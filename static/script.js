// ═══════════════════════════════════════════
//  APEX Dashboard — Premium Frontend Script
// ═══════════════════════════════════════════

let allProdi = [];          
let filteredProdi = [];     
let selectedProdi = new Set(); 
let currentBidang = 'semua';
let activeEventSource = null;

// ──────────────────────────────────────────
// TABS & NAVIGATION
// ──────────────────────────────────────────
function switchTab(tabId) {
  // Update UI State
  document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) targetView.style.display = 'block';

  const targetBtn = document.getElementById(`tab-${tabId}`);
  if (targetBtn) targetBtn.classList.add('active');

  // Update Header Text
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');
  
  if (tabId === 'scraping') {
    title.textContent = 'Home Scraping';
    subtitle.textContent = 'Kelola pengambilan data program studi dan dosen.';
  } else if (tabId === 'history') {
    title.textContent = 'Output Archive';
    subtitle.textContent = 'Akses file excel yang sudah dihasilkan.';
  }
}

// ──────────────────────────────────────────
// STEP 1: Fetch Prodi
// ──────────────────────────────────────────
async function fetchProdi() {
  const btn = document.getElementById('btn-fetch');
  const btnText = document.getElementById('fetch-btn-text');
  const status = document.getElementById('fetch-status');

  btn.disabled = true;
  btnText.textContent = 'Synchronizing...';
  setStatus(status, 'running', '⏳ Syncing with PDDikti API...');

  try {
    const res = await fetch('/api/fetch-prodi');
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    allProdi = json.data;
    filteredProdi = [...allProdi];
    setStatus(status, 'success', `Katalog Prodi Terkini (${json.total})`);
    renderBidangFilters();
    renderProdiList();
    loadHistory();
  } catch (err) {
    setStatus(status, 'error', `Sync Gagal: ${err.message}`);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Fetch Ulang Katalog';
    if (window.lucide) lucide.createIcons();
  }
}

function renderBidangFilters() {
  const container = document.getElementById('bidang-filters');
  const bidangSet = new Set(allProdi.map(p => p.bidang));
  container.innerHTML = '';
  container.style.display = 'flex';
  
  const allPill = document.createElement('button');
  allPill.className = 'pill-modern' + (currentBidang === 'semua' ? ' active' : '');
  allPill.textContent = 'Semua Bidang';
  allPill.onclick = () => filterBidang('semua', allPill);
  container.appendChild(allPill);

  bidangSet.forEach(bidang => {
    const pill = document.createElement('button');
    pill.className = 'pill-modern' + (currentBidang === bidang ? ' active' : '');
    pill.textContent = bidang;
    pill.onclick = () => filterBidang(bidang, pill);
    container.appendChild(pill);
  });
}

function filterBidang(bidang, el) {
  currentBidang = bidang;
  document.querySelectorAll('.pill-modern').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('search-input').value = '';
  applyFilters();
}

function filterList() { applyFilters(); }

function applyFilters() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  filteredProdi = allProdi.filter(p => {
    const matchBidang = currentBidang === 'semua' || p.bidang === currentBidang;
    const matchSearch = !q || p.nama_prodi.toLowerCase().includes(q);
    return matchBidang && matchSearch;
  });
  renderProdiList();
}

function renderProdiList() {
  const container = document.getElementById('prodi-list');
  if (filteredProdi.length === 0) {
    container.innerHTML = `<div class="empty-state">No matching found</div>`;
    return;
  }
  container.innerHTML = '';
  filteredProdi.forEach(p => {
    const isChecked = selectedProdi.has(p.nama_prodi);
    const item = document.createElement('div');
    item.className = 'prodi-item' + (isChecked ? ' checked' : '');
    
    // Custom Checkbox Structure with static SVG for instant performance
    const customCb = document.createElement('div');
    customCb.className = 'custom-cb';
    customCb.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
    
    const nameEl = document.createElement('span');
    nameEl.className = 'prodi-name';
    nameEl.textContent = p.nama_prodi;

    const bTag = document.createElement('span');
    bTag.className = 'bidang-tag-prodi';
    bTag.style.marginLeft = 'auto';
    bTag.textContent = p.bidang;

    item.appendChild(customCb);
    item.appendChild(nameEl);
    item.appendChild(bTag);
    
    item.onclick = () => {
      const currentlyChecked = selectedProdi.has(p.nama_prodi);
      if (!currentlyChecked) {
        selectedProdi.add(p.nama_prodi);
        item.classList.add('checked');
      } else {
        selectedProdi.delete(p.nama_prodi);
        item.classList.remove('checked');
      }
      updateCountBadge();
      renderSelectedSummary();
    };
    
    container.appendChild(item);
  });
  updateCountBadge();
  renderSelectedSummary();
}

function selectAll() {
  filteredProdi.forEach(p => selectedProdi.add(p.nama_prodi));
  renderProdiList();
}

function clearAll() {
  selectedProdi.clear();
  renderProdiList();
}

function renderSelectedSummary() {
  const container = document.getElementById('selected-summary');
  const tagsContainer = document.getElementById('selected-tags');
  if (selectedProdi.size === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  tagsContainer.innerHTML = '';
  selectedProdi.forEach(name => {
    const tag = document.createElement('div');
    tag.style = "background: rgba(63, 94, 251, 0.1); border: 1px solid var(--accent-blue); color: var(--accent-blue); padding: 4px 10px; border-radius: 50px; font-size: 11px; display: flex; align-items: center; gap: 6px; font-weight: 500;";
    tag.innerHTML = `<span>${name}</span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="cursor:pointer;" onclick="event.stopPropagation(); selectedProdi.delete('${name}'); renderProdiList();"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    tagsContainer.appendChild(tag);
  });
}

function updateCountBadge() {
  document.getElementById('count-badge').textContent = selectedProdi.size;
  const btn = document.getElementById('btn-run');
  btn.disabled = selectedProdi.size === 0;
  setStatus(document.getElementById('run-status'), selectedProdi.size > 0 ? 'success' : '', selectedProdi.size > 0 ? `${selectedProdi.size} target selected` : 'Select target to start');
}

// ──────────────────────────────────────────
// SCRAPER EXECUTION
// ──────────────────────────────────────────
async function runScraper() {
  if (selectedProdi.size === 0) return;
  const btn = document.getElementById('btn-run');
  const status = document.getElementById('run-status');
  const logWrapper = document.getElementById('log-wrapper');
  const logBox = document.getElementById('log-box');
  
  btn.disabled = true;
  logWrapper.style.display = 'block';
  logBox.innerHTML = '';
  setStatus(status, 'running', 'Initializing engine...');

  try {
    const res = await fetch('/api/run-scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prodi: [...selectedProdi] }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    if (activeEventSource) activeEventSource.close();
    activeEventSource = new EventSource(`/api/stream/${json.job_id}`);

    activeEventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'log') appendLog(data.message);
      if (data.type === 'done') {
        setStatus(status, 'success', 'Scraping Process Completed');
        showDownload(data.filename);
        activeEventSource.close();
        loadHistory();
      }
      if (data.type === 'error') {
        setStatus(status, 'error', `Failure: ${data.message}`);
        activeEventSource.close();
      }
    };
  } catch (err) {
    appendLog('❌ Error: ' + err.message);
    btn.disabled = false;
  }
}

function appendLog(text) {
  const logBox = document.getElementById('log-box');
  const p = document.createElement('p');
  p.className = 'log-line';
  p.textContent = text;
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
}

function showDownload(filename) {
  const section = document.getElementById('download-section-history');
  section.style.display = 'block';
  document.getElementById('dl-filename').textContent = filename;
  document.getElementById('dl-btn').href = `/api/download/${filename}`;
  switchTab('history');
}

// ──────────────────────────────────────────
// HELPERS & HISTORY
// ──────────────────────────────────────────
async function loadHistory() {
  const container = document.getElementById('history-list');
  const totalCountEl = document.getElementById('total-files-count');
  const totalSizeEl = document.getElementById('total-files-size');
  const lastSyncEl = document.getElementById('last-sync-date');
  const archiveCountEl = document.getElementById('archive-count');

  try {
    const res = await fetch('/api/outputs');
    const files = await res.json();
    
    // Calculate Stats
    let totalSize = 0;
    let lastModified = 0;
    files.forEach(f => {
      totalSize += f.size;
      if (f.modified > lastModified) lastModified = f.modified;
    });

    // Update Summary Elements
    if (totalCountEl) totalCountEl.textContent = files.length;
    if (totalSizeEl) totalSizeEl.textContent = (totalSize / 1024).toFixed(1) + ' KB';
    if (lastSyncEl) lastSyncEl.textContent = lastModified ? new Date(lastModified * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
    if (archiveCountEl) archiveCountEl.textContent = `${files.length} FILES`;

    if (!files.length) { 
      container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-dim);">Archive is empty</div>'; 
      return; 
    }
    
    container.innerHTML = '';
    files.forEach(f => {
      const dateStr = new Date(f.modified * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      const sizeStr = (f.size / 1024).toFixed(1) + ' KB';
      const fileExt = f.name.split('.').pop().toUpperCase();
      
      const item = document.createElement('div');
      item.className = 'history-item';
      
      item.innerHTML = `
        <div class="file-status-circle" title="File Ready">
          <i data-lucide="check" class="status-check"></i>
        </div>
        <div class="file-info-main">
          <div class="file-name-row">
            <span class="file-name-text" title="${f.name}">${f.name}</span>
            <span class="file-ext-badge">${fileExt}</span>
          </div>
          <div class="file-meta-row">
            <span class="meta-item"><i data-lucide="calendar" style="width:12px;"></i> ${dateStr}</span>
            <span class="meta-item"><i data-lucide="database" style="width:12px;"></i> ${sizeStr}</span>
          </div>
        </div>
        <div class="file-actions">
          <a class="action-btn-modern" href="/api/download/${f.name}" title="Download Excel">
            <i data-lucide="download"></i>
          </a>
          <button class="action-btn-modern btn-delete" onclick="deleteHistoryFile('${f.name}')" title="Delete File">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      container.appendChild(item);
    });
    if (window.lucide) lucide.createIcons();
  } catch(e) {
    console.error("History fail:", e);
  }
}

async function deleteHistoryFile(filename) {
  if (!confirm(`Delete ${filename}?`)) return;
  await fetch(`/api/delete-file/${filename}`, { method: 'DELETE' });
  loadHistory();
}

function setStatus(el, type, text) {
  el.textContent = text;
  el.className = 'status-pill ' + type;
}




window.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  switchTab('scraping');
  if (window.lucide) lucide.createIcons();
});
