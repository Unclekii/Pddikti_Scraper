import os
import uuid
import queue
import threading
import json
import time
from flask import Flask, render_template, request, jsonify, Response, send_from_directory

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Active jobs: {job_id: {'queue': Queue, 'status': str, 'filename': str, 'event': Event, 'start_time': float}}
JOBS = {}
JOBS_LOCK = threading.Lock()

def cleanup_stale_jobs():
    """Background task to remove jobs older than 1 hour to prevent memory leaks."""
    while True:
        time.sleep(600)  # Run every 10 minutes
        now = time.time()
        with JOBS_LOCK:
            stale_ids = [jid for jid, info in JOBS.items() if now - info.get('start_time', 0) > 3600]
            for jid in stale_ids:
                del JOBS[jid]

_cleanup_started = False

@app.before_request
def _start_cleanup_once():
    """Lazy-start cleanup thread on first request — compatible with Gunicorn pre-fork workers."""
    global _cleanup_started
    if not _cleanup_started:
        _cleanup_started = True
        threading.Thread(target=cleanup_stale_jobs, daemon=True).start()


# ──────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/fetch-prodi")
def api_fetch_prodi():
    """Fetch all prodi from all bidang ilmu."""
    from scraper.fetch_prodi import fetch_all_prodi
    try:
        data = fetch_all_prodi()
        return jsonify({"success": True, "data": data, "total": len(data)})
    except Exception as e:
        app.logger.exception("fetch-prodi failed")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/run-scraper", methods=["POST"])
def api_run_scraper():
    """Start dosen scraping job with selected prodi keywords."""
    # Robust JSON parsing: dukung payload object {"prodi":[...]} maupun array langsung [...]
    body = request.get_json(silent=True)

    if isinstance(body, dict):
        prodi_keywords = body.get("prodi", [])
    elif isinstance(body, list):
        prodi_keywords = body
    else:
        prodi_keywords = []

    # Sanitasi agar hanya string non-empty yang diproses
    prodi_keywords = [str(x).strip() for x in prodi_keywords if str(x).strip()]

    if not prodi_keywords:
        return jsonify({"success": False, "error": "Tidak ada prodi yang dipilih"}), 400

    job_id = str(uuid.uuid4())
    q = queue.Queue()
    stop_event = threading.Event()
    with JOBS_LOCK:
        JOBS[job_id] = {
            "queue": q, 
            "status": "running", 
            "filename": None, 
            "event": stop_event, 
            "start_time": time.time()
        }

    def worker():
        from scraper.dosen_scraper import run_dosen_scraper
        try:
            def cb(msg):
                # Non-blocking put: tetap kirim log meski stop_event aktif
                # agar log terakhir (cancellation) tidak hilang
                try:
                    q.put({"type": "log", "message": str(msg)}, block=False)
                except queue.Full:
                    pass  # Queue penuh — skip daripada deadlock

            filename = run_dosen_scraper(prodi_keywords, OUTPUT_DIR, cb, stop_event)
            with JOBS_LOCK:
                if job_id in JOBS:
                    JOBS[job_id]["status"] = "done"
                    JOBS[job_id]["filename"] = filename
            q.put({"type": "done", "filename": filename})
        except Exception as e:
            with JOBS_LOCK:
                if job_id in JOBS:
                    JOBS[job_id]["status"] = "error"
            q.put({"type": "error", "message": str(e)})
        finally:
            q.put(None)  # sentinel

    t = threading.Thread(target=worker, daemon=True)
    t.start()
    return jsonify({"success": True, "job_id": job_id})


@app.route("/api/stop-scraper/<job_id>", methods=["POST"])
def api_stop_scraper(job_id):
    """Stop an active scraping job."""
    with JOBS_LOCK:
        if job_id in JOBS and JOBS[job_id].get("event"):
            JOBS[job_id]["event"].set()
            JOBS[job_id]["status"] = "cancelled"
            return jsonify({"success": True, "message": "Scraping dibatalkan"})
    return jsonify({"success": False, "error": "Job tidak ditemukan atau sudah selesai"}), 404


@app.route("/api/stream/<job_id>")
def api_stream(job_id):
    """SSE endpoint to stream scraping logs."""
    with JOBS_LOCK:
        if job_id not in JOBS:
            return jsonify({"error": "Job not found"}), 404
        q = JOBS[job_id]["queue"]

    def generate():
        try:
            yield "data: {\"type\": \"connected\"}\n\n"
            while True:
                try:
                    # Heartbeat setiap 30s untuk menghindari Nginx/proxy timeout default 60s
                    msg = q.get(timeout=30)
                    if msg is None:
                        break
                    yield f"data: {json.dumps(msg)}\n\n"
                except queue.Empty:
                    yield "data: {\"type\": \"heartbeat\"}\n\n"
        finally:
            # Clean up tracking dictionary to prevent Memory Leak
            # Grace period agar worker sempat update status sebelum cleanup
            time.sleep(0.5)
            with JOBS_LOCK:
                if job_id in JOBS:
                    del JOBS[job_id]

    return Response(
        generate(),
        content_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.route("/api/outputs")
def api_outputs():
    """List output Excel files."""
    files = []
    if not os.path.exists(OUTPUT_DIR):
        return jsonify([])
    for f in os.listdir(OUTPUT_DIR):
        # Filter temp/lock files Excel (diawali ~$) & hanya ambil .xlsx valid
        if f.endswith(".xlsx") and not f.startswith("~$") and not f.startswith("."):
            fp = os.path.join(OUTPUT_DIR, f)
            try:
                files.append({
                    "name": f,
                    "size": os.path.getsize(fp),
                    "modified": os.path.getmtime(fp)
                })
            except OSError:
                # Skip file yang tiba-tiba hilang / permission error
                continue
    files.sort(key=lambda x: x["modified"], reverse=True)
    return jsonify(files)


@app.route("/api/download/<filename>")
def api_download(filename):
    """Download an output Excel file."""
    return send_from_directory(OUTPUT_DIR, filename, as_attachment=True)


@app.route("/api/delete-file/<filename>", methods=["DELETE"])
def api_delete_file(filename):
    """Delete an output Excel file (.xlsx only)."""
    # Validasi path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        return jsonify({"success": False, "error": "Invalid filename"}), 400
    # Enforce ekstensi .xlsx saja — hindari hapus file lain
    if not filename.lower().endswith(".xlsx"):
        return jsonify({"success": False, "error": "Only .xlsx files can be deleted"}), 400
    try:
        fp = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(fp):
            os.remove(fp)
            return jsonify({"success": True})
        return jsonify({"success": False, "error": "File not found"}), 404
    except Exception as e:
        app.logger.exception("delete-file failed")
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 50)
    print("  PDDikti Dashboard")
    print("  Buka browser: http://localhost:5000")
    print("=" * 50)
    app.run(debug=False, port=5000, threaded=True)
