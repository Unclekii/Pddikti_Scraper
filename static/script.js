// ═══════════════════════════════════════════
//  APEX Dashboard — Premium Frontend Script v2.0
// ═══════════════════════════════════════════

let allProdi = [];
let filteredProdi = [];
let selectedProdi = new Set();
let currentBidang = 'semua';
let activeEventSource = null;
let tagsExpanded = false;

// ──────────────────────────────────────────
// TABS & NAVIGATION
// ──────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.view-section').forEach((el) => (el.style.display = 'none'));
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) targetView.style.display = 'block';

  const targetBtn = document.getElementById(`tab-${tabId}`);
  if (targetBtn) targetBtn.classList.add('active');

  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');

  const tabInfo = {
    'scraping': ['Home Scraping', 'Kelola pengambilan data program studi dan dosen.'],
    'history': ['Output Archive', 'Akses file excel yang sudah dihasilkan.'],
    'analytics-dosen': ['Analisis Dosen', 'Visualisasi data dosen dari hasil scraping.'],
    'analytics-prodi': ['Analisis Program Studi', 'Visualisasi data program studi dari hasil scraping.'],
  };
  if (tabInfo[tabId]) {
    title.textContent = tabInfo[tabId][0];
    subtitle.textContent = tabInfo[tabId][1];
  }

  // Populate file selectors on analytics tabs
  if (tabId === 'analytics-dosen' || tabId === 'analytics-prodi') {
    populateFileSelector(tabId === 'analytics-dosen' ? 'dosen-file-select' : 'prodi-file-select');
  }
}

// ──────────────────────────────────────────
// U1: TOAST NOTIFICATION SYSTEM
// ──────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
  toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:18px;height:18px;flex-shrink:0;"></i><span></span>`;
  toast.querySelector('span').textContent = message;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons({ nodes: [toast] });
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 4000);
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
    showToast(`Katalog berhasil disinkronisasi: ${json.total} prodi`, 'success');
  } catch (err) {
    setStatus(status, 'error', `Sync Gagal: ${err.message}`);
    showToast(`Gagal sinkronisasi: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Fetch Ulang Katalog';
    if (window.lucide) lucide.createIcons();
  }
}

// U4: Bidang pills with count
function renderBidangFilters() {
  const container = document.getElementById('bidang-filters');
  const bidangMap = new Map();
  allProdi.forEach((p) => bidangMap.set(p.bidang, (bidangMap.get(p.bidang) || 0) + 1));
  container.innerHTML = '';
  container.style.display = 'flex';

  const allPill = document.createElement('button');
  allPill.className = 'pill-modern' + (currentBidang === 'semua' ? ' active' : '');
  allPill.textContent = `Semua Bidang (${allProdi.length})`;
  allPill.onclick = () => filterBidang('semua', allPill);
  container.appendChild(allPill);

  bidangMap.forEach((count, bidang) => {
    const pill = document.createElement('button');
    pill.className = 'pill-modern' + (currentBidang === bidang ? ' active' : '');
    pill.textContent = `${bidang} (${count})`;
    pill.onclick = () => filterBidang(bidang, pill);
    container.appendChild(pill);
  });
}

function filterBidang(bidang, el) {
  currentBidang = bidang;
  document.querySelectorAll('.pill-modern').forEach((p) => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('search-input').value = '';
  applyFilters();
}

function filterList() {
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  filteredProdi = allProdi.filter((p) => {
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
  filteredProdi.forEach((p) => {
    const isChecked = selectedProdi.has(p.nama_prodi);
    const item = document.createElement('div');
    item.className = 'prodi-item' + (isChecked ? ' checked' : '');

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
      if (!selectedProdi.has(p.nama_prodi)) {
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
  filteredProdi.forEach((p) => selectedProdi.add(p.nama_prodi));
  renderProdiList();
}

function clearAll() {
  selectedProdi.clear();
  renderProdiList();
}

// U5: Tags auto-collapse
function renderSelectedSummary() {
  const container = document.getElementById('selected-summary');
  const tagsContainer = document.getElementById('selected-tags');
  const toggleBtn = document.getElementById('tags-toggle-btn');
  if (selectedProdi.size === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  tagsContainer.innerHTML = '';
  const MAX_VISIBLE = 8;
  const prodiArr = [...selectedProdi];
  const visibleItems = tagsExpanded ? prodiArr : prodiArr.slice(0, MAX_VISIBLE);

  visibleItems.forEach((name) => {
    const tag = document.createElement('div');
    tag.className = 'selected-tag';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '12'); svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '3');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    svg.style.cursor = 'pointer'; svg.style.flexShrink = '0';
    const p1 = document.createElementNS(svgNS, 'path'); p1.setAttribute('d', 'M18 6 6 18');
    const p2 = document.createElementNS(svgNS, 'path'); p2.setAttribute('d', 'm6 6 12 12');
    svg.appendChild(p1); svg.appendChild(p2);
    svg.addEventListener('click', (e) => { e.stopPropagation(); selectedProdi.delete(name); renderProdiList(); });

    tag.appendChild(nameSpan);
    tag.appendChild(svg);
    tagsContainer.appendChild(tag);
  });

  if (prodiArr.length > MAX_VISIBLE) {
    toggleBtn.style.display = 'inline-block';
    toggleBtn.textContent = tagsExpanded ? `Sembunyikan` : `Lihat semua (${prodiArr.length} prodi)`;
  } else {
    toggleBtn.style.display = 'none';
  }
}

function toggleTagsExpand() {
  tagsExpanded = !tagsExpanded;
  renderSelectedSummary();
}

function updateCountBadge() {
  document.getElementById('count-badge').textContent = selectedProdi.size;
  const btn = document.getElementById('btn-run');
  btn.disabled = selectedProdi.size === 0;
  setStatus(document.getElementById('run-status'), selectedProdi.size > 0 ? 'success' : '', selectedProdi.size > 0 ? `${selectedProdi.size} target selected` : 'Select target to start');
}

// ──────────────────────────────────────────
// U2: CONFIRMATION DIALOG
// ──────────────────────────────────────────
function openConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-summary').textContent = `Anda akan menjalankan scraping untuk ${selectedProdi.size} program studi. Proses ini mungkin memakan waktu beberapa menit.`;
  const listEl = document.getElementById('confirm-prodi-list');
  listEl.innerHTML = '';
  selectedProdi.forEach((name) => {
    const li = document.createElement('div');
    li.className = 'confirm-prodi-item';
    li.textContent = name;
    listEl.appendChild(li);
  });
  modal.style.display = 'flex';
  if (window.lucide) lucide.createIcons();
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').style.display = 'none';
}

function confirmAndRun() {
  closeConfirmModal();
  executeScraperRun();
}

// ──────────────────────────────────────────
// SCRAPER EXECUTION
// ──────────────────────────────────────────
async function runScraper() {
  if (selectedProdi.size === 0) return;
  openConfirmModal();
}

async function executeScraperRun() {
  const btn = document.getElementById('btn-run');
  const status = document.getElementById('run-status');
  const logWrapper = document.getElementById('log-wrapper');
  const logBox = document.getElementById('log-box');
  const progressContainer = document.getElementById('progress-container');

  btn.disabled = true;
  logWrapper.style.display = 'block';
  logBox.innerHTML = '';
  progressContainer.style.display = 'block';
  updateProgress(0, 0, 1, 'Initializing...');
  setStatus(status, 'running', 'Initializing engine...');
  document.getElementById('btn-stop').style.display = 'flex';

  try {
    const res = await fetch('/api/run-scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prodi: [...selectedProdi] }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    window.currentJobId = json.job_id;

    if (activeEventSource) activeEventSource.close();
    activeEventSource = new EventSource(`/api/stream/${json.job_id}`);

    activeEventSource.onerror = () => {
      appendLog('⚠️ Koneksi terputus. Mencoba menyambung kembali...');
    };

    activeEventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'log') appendLog(data.message);
      if (data.type === 'progress') updateProgress(data.step, data.current, data.total, data.label);
      if (data.type === 'done') {
        setStatus(status, 'success', 'Scraping Process Completed');
        showDownload(data.filename);
        activeEventSource.close();
        loadHistory();
        document.getElementById('btn-stop').style.display = 'none';
        progressContainer.style.display = 'none';
        btn.disabled = false;
        window.currentJobId = null;
        showToast(`Scraping selesai! File: ${data.filename}`, 'success');
      }
      if (data.type === 'error') {
        if (data.message.includes('dihentikan')) {
          setStatus(status, 'cancelled', 'Scraping Berhasil Dibatalkan');
          appendLog('🛑 Proses dihentikan sepenuhnya.');
          showToast('Scraping berhasil dibatalkan.', 'warning');
        } else {
          setStatus(status, 'error', `Failure: ${data.message}`);
          showToast(`Error: ${data.message}`, 'error');
        }
        activeEventSource.close();
        document.getElementById('btn-stop').style.display = 'none';
        progressContainer.style.display = 'none';
        btn.disabled = false;
        window.currentJobId = null;
      }
    };
  } catch (err) {
    appendLog('❌ Error: ' + err.message);
    btn.disabled = false;
    document.getElementById('btn-stop').style.display = 'none';
    progressContainer.style.display = 'none';
    showToast('Gagal memulai scraper: ' + err.message, 'error');
  }
}

// B3: Progress bar
function updateProgress(step, current, total, label) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const fill = document.getElementById('progress-fill');
  const pctEl = document.getElementById('progress-pct');
  const labelEl = document.getElementById('progress-label');
  fill.style.width = pct + '%';
  pctEl.textContent = pct + '%';
  labelEl.textContent = `Step ${step}: ${label} (${current}/${total})`;

  document.querySelectorAll('.pstep').forEach((el) => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('active', s === step);
    el.classList.toggle('done', s < step);
  });
}

async function stopScraper() {
  if (!window.currentJobId) return;
  const btnStop = document.getElementById('btn-stop');
  btnStop.disabled = true;
  btnStop.textContent = 'Stopping...';

  try {
    const res = await fetch(`/api/stop-scraper/${window.currentJobId}`, { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      appendLog('⏳ Mengirim sinyal berhenti ke engine...');
    } else {
      appendLog('❌ Gagal menghentikan: ' + json.error);
    }
  } catch (err) {
    appendLog('❌ Error stopping: ' + err.message);
  } finally {
    btnStop.disabled = false;
    btnStop.innerHTML = '<i data-lucide="square"></i> Batalkan Scraping';
    if (window.lucide) lucide.createIcons();
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

// U3: Log toolbar functions
function copyLog() {
  const logBox = document.getElementById('log-box');
  const text = Array.from(logBox.querySelectorAll('.log-line')).map(l => l.textContent).join('\n');
  navigator.clipboard.writeText(text).then(() => showToast('Log disalin ke clipboard!', 'success'));
}

function clearLog() {
  document.getElementById('log-box').innerHTML = '';
}

function filterLog() {
  const q = document.getElementById('log-search-input').value.toLowerCase();
  document.querySelectorAll('#log-box .log-line').forEach((line) => {
    line.style.display = !q || line.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function showDownload(filename) {
  const section = document.getElementById('download-section-history');
  section.style.display = 'block';
  document.getElementById('dl-filename').textContent = filename;
  document.getElementById('dl-btn').href = `/api/download/${filename}`;
  switchTab('history');
}

// ──────────────────────────────────────────
// B1: XSS-SAFE HISTORY (DOM API)
// ──────────────────────────────────────────
async function loadHistory() {
  const container = document.getElementById('history-list');
  const totalCountEl = document.getElementById('total-files-count');
  const totalSizeEl = document.getElementById('total-files-size');
  const lastSyncEl = document.getElementById('last-sync-date');
  const archiveCountEl = document.getElementById('archive-count');

  try {
    const res = await fetch('/api/outputs');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const files = await res.json();
    if (!Array.isArray(files)) throw new Error('Invalid response format');

    let totalSize = 0, lastModified = 0;
    files.forEach((f) => {
      totalSize += f.size;
      if (f.modified > lastModified) lastModified = f.modified;
    });

    if (totalCountEl) totalCountEl.textContent = files.length;
    if (totalSizeEl) totalSizeEl.textContent = (totalSize / 1024).toFixed(1) + ' KB';
    if (lastSyncEl) lastSyncEl.textContent = lastModified ? new Date(lastModified * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
    if (archiveCountEl) archiveCountEl.textContent = `${files.length} FILES`;

    if (!files.length) {
      container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-dim);">Archive is empty</div>';
      return;
    }

    container.innerHTML = '';
    files.forEach((f) => {
      const dateStr = new Date(f.modified * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      const sizeStr = (f.size / 1024).toFixed(1) + ' KB';
      const fileExt = f.name.split('.').pop().toUpperCase();

      const item = document.createElement('div');
      item.className = 'history-item';

      // Status circle
      const circle = document.createElement('div');
      circle.className = 'file-status-circle';
      circle.title = 'File Ready';
      circle.innerHTML = '<i data-lucide="check" class="status-check"></i>';

      // File info
      const infoMain = document.createElement('div');
      infoMain.className = 'file-info-main';

      const nameRow = document.createElement('div');
      nameRow.className = 'file-name-row';
      const nameText = document.createElement('span');
      nameText.className = 'file-name-text';
      nameText.textContent = f.name;
      nameText.title = f.name;
      const extBadge = document.createElement('span');
      extBadge.className = 'file-ext-badge';
      extBadge.textContent = fileExt;
      nameRow.appendChild(nameText);
      nameRow.appendChild(extBadge);

      const metaRow = document.createElement('div');
      metaRow.className = 'file-meta-row';
      metaRow.innerHTML = `<span class="meta-item"><i data-lucide="calendar" style="width:12px;"></i> </span><span class="meta-item"><i data-lucide="database" style="width:12px;"></i> </span>`;
      metaRow.children[0].appendChild(document.createTextNode(dateStr));
      metaRow.children[1].appendChild(document.createTextNode(sizeStr));

      infoMain.appendChild(nameRow);
      infoMain.appendChild(metaRow);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'file-actions';
      const dlLink = document.createElement('a');
      dlLink.className = 'action-btn-modern';
      dlLink.href = `/api/download/${encodeURIComponent(f.name)}`;
      dlLink.title = 'Download Excel';
      dlLink.innerHTML = '<i data-lucide="download"></i>';

      const delBtn = document.createElement('button');
      delBtn.className = 'action-btn-modern btn-delete';
      delBtn.title = 'Delete File';
      delBtn.innerHTML = '<i data-lucide="trash-2"></i>';
      delBtn.addEventListener('click', () => deleteHistoryFile(f.name));

      actions.appendChild(dlLink);
      actions.appendChild(delBtn);

      item.appendChild(circle);
      item.appendChild(infoMain);
      item.appendChild(actions);
      container.appendChild(item);
    });
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    console.error('History fail:', e);
    if (container) container.innerHTML = `<div style="text-align:center; padding: 40px; color: #ff6b6b;">⚠️ Gagal memuat arsip</div>`;
    if (archiveCountEl) archiveCountEl.textContent = 'ERROR';
  }
}

async function deleteHistoryFile(filename) {
  if (!confirm(`Delete ${filename}?`)) return;
  try {
    const res = await fetch(`/api/delete-file/${encodeURIComponent(filename)}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) {
      showToast('Gagal menghapus: ' + (json.error || 'Unknown error'), 'error');
      return;
    }
    showToast('File berhasil dihapus', 'success');
  } catch (e) {
    showToast('Error menghapus file: ' + e.message, 'error');
    return;
  }
  loadHistory();
}

// ──────────────────────────────────────────
// ANALYTICS: File selector population
// ──────────────────────────────────────────
async function populateFileSelector(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const currentVal = select.value;
  try {
    const res = await fetch('/api/outputs');
    const files = await res.json();
    select.innerHTML = '<option value="">— Pilih file Excel —</option>';
    files.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f.name;
      opt.textContent = `${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
      select.appendChild(opt);
    });
    if (currentVal) select.value = currentVal;
  } catch (e) {
    console.error('populate file selector failed', e);
  }
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
function setStatus(el, type, text) {
  el.textContent = text;
  el.className = 'status-pill ' + type;
}

// U6: Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    if (selectedProdi.size > 0) runScraper();
  }
  if (e.key === 'Escape' && window.currentJobId) {
    e.preventDefault();
    stopScraper();
  }
  if (e.key === 'Escape' && document.getElementById('confirm-modal').style.display === 'flex') {
    closeConfirmModal();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    selectAll();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  switchTab('scraping');
  if (window.lucide) lucide.createIcons();
});
