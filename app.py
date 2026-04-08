import os
import uuid
import queue
import threading
import json
from flask import Flask, render_template, request, jsonify, Response, send_from_directory

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Active jobs: {job_id: {'queue': Queue, 'status': str, 'filename': str}}
JOBS = {}


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
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/run-scraper", methods=["POST"])
def api_run_scraper():
    """Start dosen scraping job with selected prodi keywords."""
    body = request.get_json()
    prodi_keywords = body.get("prodi", [])
    if not prodi_keywords:
        return jsonify({"success": False, "error": "Tidak ada prodi yang dipilih"}), 400

    job_id = str(uuid.uuid4())
    q = queue.Queue()
    JOBS[job_id] = {"queue": q, "status": "running", "filename": None}

    def worker():
        from scraper.dosen_scraper import run_dosen_scraper
        try:
            def cb(msg):
                q.put({"type": "log", "message": str(msg)})

            filename = run_dosen_scraper(prodi_keywords, OUTPUT_DIR, cb)
            JOBS[job_id]["status"] = "done"
            JOBS[job_id]["filename"] = filename
            q.put({"type": "done", "filename": filename})
        except Exception as e:
            JOBS[job_id]["status"] = "error"
            q.put({"type": "error", "message": str(e)})
        finally:
            q.put(None)  # sentinel

    t = threading.Thread(target=worker, daemon=True)
    t.start()
    return jsonify({"success": True, "job_id": job_id})


@app.route("/api/stream/<job_id>")
def api_stream(job_id):
    """SSE endpoint to stream scraping logs."""
    if job_id not in JOBS:
        return jsonify({"error": "Job not found"}), 404

    q = JOBS[job_id]["queue"]

    def generate():
        try:
            yield "data: {\"type\": \"connected\"}\n\n"
            while True:
                try:
                    msg = q.get(timeout=60)
                    if msg is None:
                        break
                    yield f"data: {json.dumps(msg)}\n\n"
                except queue.Empty:
                    yield "data: {\"type\": \"heartbeat\"}\n\n"
        finally:
            # Clean up tracking dictionary to prevent Memory Leak
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
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith(".xlsx"):
            fp = os.path.join(OUTPUT_DIR, f)
            files.append({
                "name": f,
                "size": os.path.getsize(fp),
                "modified": os.path.getmtime(fp),
            })
    files.sort(key=lambda x: x["modified"], reverse=True)
    return jsonify(files)


@app.route("/api/download/<filename>")
def api_download(filename):
    """Download an output Excel file."""
    return send_from_directory(OUTPUT_DIR, filename, as_attachment=True)


@app.route("/api/delete-file/<filename>", methods=["DELETE"])
def api_delete_file(filename):
    """Delete an output Excel file."""
    if ".." in filename or "/" in filename or "\\" in filename:
        return jsonify({"success": False, "error": "Invalid filename"}), 400
    try:
        fp = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(fp):
            os.remove(fp)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 50)
    print("  PDDikti Dashboard")
    print("  Buka browser: http://localhost:5000")
    print("=" * 50)
    app.run(debug=False, port=5000, threaded=True)
