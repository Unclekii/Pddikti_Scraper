import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, '.')
from scraper.dosen_scraper import make_session, fetch_api
import urllib.parse
import json

session = make_session()

kw = 'Sains Ekonomi Islam'
quoted = urllib.parse.quote(kw)
results = fetch_api(session, f'pencarian/prodi/{quoted}')

for prodi in results:
    prodi_id = prodi.get('id', '')
    nama = prodi.get('nama', '')
    print(f'Prodi ID: {prodi_id} | Name: {nama}')
    
    detail = fetch_api(session, f'prodi/detail/{prodi_id}')
    if detail is None:
        print('  API RETURNED NONE!')
    else:
        print(f'  Status: {detail.get("status")}')
