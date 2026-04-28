"""
fetch_prodi.py — Ambil daftar semua prodi dari PDDikti berdasarkan bidang ilmu.

Fitur:
  • Retry otomatis + backoff (menyamakan pattern dengan dosen_scraper.py)
  • Support stop_event untuk cancellation
  • Deduplikasi prodi berdasarkan nama
"""

import os
import time
import requests

BIDANG_ILMU = [
    "Agama", "Ekonomi", "Humaniora", "Kesehatan",
    "MIPA", "Pendidikan", "Pertanian", "Seni", "Sosial", "Teknik"
]

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://pddikti.kemdiktisaintek.go.id",
    "Referer": "https://pddikti.kemdiktisaintek.go.id/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

TIMEOUT = int(os.environ.get("PDDIKTI_TIMEOUT", 30))
MAX_RETRIES = int(os.environ.get("PDDIKTI_MAX_RETRIES", 3))
RETRY_DELAY = int(os.environ.get("PDDIKTI_RETRY_DELAY", 2))


def _sleep(seconds, stop_event=None):
    """Interruptible sleep yang respect stop_event."""
    if stop_event:
        stop_event.wait(seconds)
    else:
        time.sleep(seconds)


def _fetch_bidang(bidang, stop_event=None):
    """Fetch 1 bidang dengan retry & backoff. Return list atau None."""
    url = f"https://api-pddikti.kemdiktisaintek.go.id/prodi/bidang-ilmu/{bidang}"
    last_err = None
    for attempt in range(MAX_RETRIES):
        if stop_event and stop_event.is_set():
            return None
        try:
            r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.RequestException as e:
            last_err = e
            # Backoff lebih lama jika rate-limit 429
            if getattr(e, "response", None) is not None and e.response.status_code == 429:
                _sleep(5, stop_event)
            elif attempt < MAX_RETRIES - 1:
                _sleep(RETRY_DELAY * (attempt + 1), stop_event)
    # Gagal total setelah semua retry
    raise last_err if last_err else Exception(f"Gagal fetch bidang {bidang}")


def fetch_all_prodi(callback=None, stop_event=None):
    """
    Ambil daftar prodi unik dari semua bidang ilmu PDDikti.

    Args:
        callback: opsional, fungsi log(msg)
        stop_event: opsional, threading.Event untuk cancellation
    """
    all_data = []
    seen_prodi = set()

    def log(msg):
        if callback:
            try:
                callback(msg)
            except Exception:
                pass  # abaikan error logging

    for bidang in BIDANG_ILMU:
        if stop_event and stop_event.is_set():
            log("⏹️  Fetch prodi dibatalkan oleh pengguna.")
            break

        log(f"🔍 Mengambil bidang: {bidang}...")
        try:
            data = _fetch_bidang(bidang, stop_event=stop_event)
        except Exception as e:
            log(f"❌ Error {bidang}: {type(e).__name__}: {e}")
            continue

        if data is None:  # Dibatalkan di tengah
            break

        count_new = 0
        for item in data:
            nama = (item.get("nama_prodi") or "").strip()
            if not nama or nama in seen_prodi:
                continue
            seen_prodi.add(nama)
            all_data.append({
                "nama_prodi": nama,
                "total_mahasiswa": item.get("total_mahasiswa", 0),
                "persentase_kelulusan": item.get("persentase_kelulusan", "0"),
                "bidang": bidang,
            })
            count_new += 1
        log(f"✅ {bidang}: {len(data)} data, {count_new} prodi baru.")

    all_data.sort(key=lambda x: x["nama_prodi"])
    log(f"📊 Total prodi unik: {len(all_data)}")
    return all_data
