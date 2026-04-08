import requests
import time

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


def fetch_all_prodi(callback=None):
    all_data = []
    seen_prodi = set()

    def log(msg):
        if callback:
            callback(msg)

    for bidang in BIDANG_ILMU:
        log(f"🔍 Mengambil bidang: {bidang}...")
        url = f"https://api-pddikti.kemdiktisaintek.go.id/prodi/bidang-ilmu/{bidang}"
        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            if response.status_code != 200:
                log(f"⚠️ Gagal {bidang}: status {response.status_code}")
                continue

            data = response.json()
            count_new = 0
            for item in data:
                nama = item.get("nama_prodi", "").strip()
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
        except Exception as e:
            log(f"❌ Error {bidang}: {e}")

    all_data.sort(key=lambda x: x["nama_prodi"])
    log(f"📊 Total prodi unik: {len(all_data)}")
    return all_data
