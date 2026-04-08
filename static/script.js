// ═══════════════════════════════════════════
//  PDDikti Dashboard — Frontend Script
// ═══════════════════════════════════════════

let allProdi = [];          // full prodi list from API
let filteredProdi = [];     // currently visible (after search/filter)
let selectedProdi = new Set(); // selected prodi names
let currentBidang = 'semua';
let activeEventSource = null;

// ──────────────────────────────────────────
// STEP 1: Fetch Prodi
// ──────────────────────────────────────────
async function fetchProdi() {
  const btn = document.getElementById('btn-fetch');
  const btnText = document.getElementById('fetch-btn-text');
  const btnIcon = document.getElementById('fetch-btn-icon');
  const status = document.getElementById('fetch-status');

  btn.disabled = true;
  btnIcon.innerHTML = '<span class="spinner"></span>';
  btnText.textContent = 'Mengambil data...';
  setStatus(status, 'running', '⏳ Mengambil dari PDDikti...');

  try {
    const res = await fetch('/api/fetch-prodi');
    const json = await res.json();

    if (!json.success) throw new Error(json.error);

    allProdi = json.data;
    filteredProdi = [...allProdi];

    setStatus(status, 'success', `✅ ${json.total} prodi ditemukan`);

    renderBidangFilters();
    renderProdiList();
    loadHistory();
  } catch (err) {
    setStatus(status, 'error', `❌ Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btnIcon.textContent = '🔍';
    btnText.textContent = 'Fetch Ulang';
  }
}

// ──────────────────────────────────────────
// Render Bidang Filter Pills
// ──────────────────────────────────────────
function renderBidangFilters() {
  const container = document.getElementById('bidang-filters');
  const bidangSet = new Set(allProdi.map(p => p.bidang));

  container.innerHTML = '<span class="filter-label">Filter Bidang:</span>';
  container.style.display = 'flex';

  const allPill = makePill('Semua', 'semua', true);
  container.appendChild(allPill);

  bidangSet.forEach(bidang => {
    const pill = makePill(bidang, bidang, false);
    container.appendChild(pill);
  });
}

function makePill(label, bidang, isActive) {
  const btn = document.createElement('button');
  btn.className = 'pill' + (isActive ? ' pill-active' : '');
  btn.dataset.bidang = bidang;
  btn.textContent = label;
  btn.onclick = () => filterBidang(bidang, btn);
  return btn;
}

function filterBidang(bidang, el) {
  currentBidang = bidang;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('pill-active'));
  el.classList.add('pill-active');
  
  // Reset pencarian saat pindah bidang agar tidak membingungkan
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
  }
  
  applyFilters();
}

// ──────────────────────────────────────────
// Search + Bidang Filter
// ──────────────────────────────────────────
function filterList() {
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  filteredProdi = allProdi.filter(p => {
    const matchBidang = currentBidang === 'semua' || p.bidang === currentBidang;
    const matchSearch = !q || p.nama_prodi.toLowerCase().includes(q);
    return matchBidang && matchSearch;
  });
  renderProdiList();
}

// ──────────────────────────────────────────
// Render Prodi List
// ──────────────────────────────────────────
function renderProdiList() {
  const container = document.getElementById('prodi-list');
  const totalEl = document.getElementById('total-count');

  totalEl.textContent = `Menampilkan ${filteredProdi.length} dari ${allProdi.length} prodi`;

  if (filteredProdi.length === 0) {
    container.innerHTML = `<div class="empty-state"><span>🔍</span><p>Tidak ada prodi yang cocok</p></div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  filteredProdi.forEach(p => {
    const item = document.createElement('div');
    item.className = 'prodi-item' + (selectedProdi.has(p.nama_prodi) ? ' checked' : '');
    item.dataset.nama = p.nama_prodi;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = selectedProdi.has(p.nama_prodi);

    // onchange handles the Set update — works whether user clicks checkbox OR row
    cb.onchange = () => {
      if (cb.checked) {
        selectedProdi.add(p.nama_prodi);
        item.classList.add('checked');
      } else {
        selectedProdi.delete(p.nama_prodi);
        item.classList.remove('checked');
      }
      updateCountBadge();
      updateRunButton();
    };

    // Clicking anywhere on the row toggles the checkbox
    item.onclick = (e) => {
      if (e.target === cb) return; // checkbox handles itself via onchange
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    };

    const nameEl = document.createElement('span');
    nameEl.className = 'prodi-name';
    nameEl.textContent = p.nama_prodi;

    const bidangEl = document.createElement('span');
    bidangEl.className = 'prodi-bidang';
    bidangEl.textContent = p.bidang;

    item.appendChild(cb);
    item.appendChild(nameEl);
    item.appendChild(bidangEl);
    fragment.appendChild(item);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
  updateCountBadge();
}

function updateCountBadge() {
  const count = selectedProdi.size;
  document.getElementById('count-badge').textContent = `${count} terpilih`;
  renderSelectedSummary();
}

/**
 * Render chips/tags for selected prodi
 */
function renderSelectedSummary() {
  const container = document.getElementById('selected-summary');
  const tagsContainer = document.getElementById('selected-tags');
  
  if (selectedProdi.size === 0) {
    container.style.display = 'none';
    tagsContainer.innerHTML = '';
    return;
  }

  container.style.display = 'flex';
  tagsContainer.innerHTML = '';

  selectedProdi.forEach(name => {
    const tag = document.createElement('div');
    tag.className = 'prodi-tag';
    
    const label = document.createElement('span');
    label.textContent = name;
    
    const removeBtn = document.createElement('span');
    removeBtn.className = 'prodi-tag-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = `Hapus ${name}`;
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      selectedProdi.delete(name);
      
      // Safely find the checkbox by iterating DOM (avoid selector injection issues)
      document.querySelectorAll('.prodi-item').forEach(item => {
        if (item.dataset.nama === name) {
          const cb = item.querySelector('input[type="checkbox"]');
          if (cb) cb.checked = false;
          item.classList.remove('checked');
        }
      });
      
      updateCountBadge();
      updateRunButton();
    };

    tag.appendChild(label);
    tag.appendChild(removeBtn);
    tagsContainer.appendChild(tag);
  });
}


function updateRunButton() {
  const btn = document.getElementById('btn-run');
  const status = document.getElementById('run-status');
  if (selectedProdi.size === 0) {
    btn.disabled = true;
    setStatus(status, '', 'Pilih prodi terlebih dahulu');
  } else {
    btn.disabled = false;
    setStatus(status, 'success', `✅ ${selectedProdi.size} prodi siap di-scrape`);
  }
}

function selectAll() {
  filteredProdi.forEach(p => selectedProdi.add(p.nama_prodi));
  renderProdiList();
  updateRunButton();
}

function clearAll() {
  selectedProdi.clear();
  renderProdiList();
  updateRunButton();
}

// ──────────────────────────────────────────
// STEP 3: Run Scraper
// ──────────────────────────────────────────
async function runScraper() {
  if (selectedProdi.size === 0) return;

  const btn = document.getElementById('btn-run');
  const status = document.getElementById('run-status');
  const logWrapper = document.getElementById('log-wrapper');
  const logBox = document.getElementById('log-box');
  const dlSection = document.getElementById('download-section');

  // Reset
  btn.disabled = true;
  logWrapper.style.display = 'block';
  dlSection.style.display = 'none';
  logBox.innerHTML = '';
  setStatus(status, 'running', '⏳ Menginisiasi scraping...');

  appendLog(`🚀 Memulai scraping untuk ${selectedProdi.size} keyword prodi...`);
  appendLog(`Keyword: ${[...selectedProdi].slice(0, 5).join(', ')}${selectedProdi.size > 5 ? '...' : ''}`);
  appendLog('─'.repeat(55));

  // Close previous SSE if any
  if (activeEventSource) activeEventSource.close();

  try {
    // Start job
    const res = await fetch('/api/run-scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prodi: [...selectedProdi] }),
    });
    const json = await res.json();

    if (!json.success) {
      appendLog('❌ Error: ' + json.error, 'error');
      setStatus(status, 'error', '❌ Gagal memulai');
      btn.disabled = false;
      return;
    }

    const jobId = json.job_id;

    // Connect SSE
    activeEventSource = new EventSource(`/api/stream/${jobId}`);

    activeEventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'heartbeat' || data.type === 'connected') return;

      if (data.type === 'log') {
        const msg = data.message;
        let cls = '';
        if (msg.includes('STEP') && msg.includes('=')) cls = 'step';
        else if (msg.includes('❌')) cls = 'error';
        else if (msg.includes('🎉') || msg.includes('✅ File')) cls = 'done';
        appendLog(msg, cls);
      }

      if (data.type === 'done') {
        setStatus(status, 'success', '✅ Selesai!');
        appendLog('\n🎉 SCRAPING SELESAI!', 'done');
        showDownload(data.filename);
        btn.disabled = false;
        activeEventSource.close();
        loadHistory();
      }

      if (data.type === 'error') {
        setStatus(status, 'error', '❌ ' + data.message);
        appendLog('❌ ERROR: ' + data.message, 'error');
        btn.disabled = false;
        activeEventSource.close();
      }
    };

    activeEventSource.onerror = () => {
      if (activeEventSource.readyState === EventSource.CLOSED) return;
      appendLog('⚠️ Koneksi SSE terputus. Proses mungkin masih berjalan.', 'error');
      btn.disabled = false;
    };

  } catch (err) {
    appendLog('❌ Error: ' + err.message, 'error');
    setStatus(status, 'error', '❌ Gagal');
    btn.disabled = false;
  }
}

function appendLog(text, cls = '') {
  const logBox = document.getElementById('log-box');
  const line = document.createElement('p');
  line.className = 'log-line' + (cls ? ' ' + cls : '');
  // Clean ANSI escape sequences if any
  line.textContent = text.replace(/\x1B\[[0-9;]*m/g, '');
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

function clearLog() {
  document.getElementById('log-box').innerHTML = '';
}

function showDownload(filename) {
  const section = document.getElementById('download-section');
  const dlBtn = document.getElementById('dl-btn');
  const dlFilename = document.getElementById('dl-filename');
  dlFilename.textContent = filename;
  dlBtn.href = `/api/download/${filename}`;
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ──────────────────────────────────────────
// History
// ──────────────────────────────────────────
async function loadHistory() {
  const container = document.getElementById('history-list');
  try {
    const res = await fetch('/api/outputs');
    const files = await res.json();
    if (files.length === 0) {
      container.innerHTML = '<p class="text-muted small">Belum ada file output.</p>';
      return;
    }
    container.innerHTML = '';
    files.forEach(f => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const sizeMB = (f.size / 1024 / 1024).toFixed(2);
      const date = new Date(f.modified * 1000).toLocaleString('id-ID');
      item.innerHTML = `
        <div>
          <div class="history-name">${f.name}</div>
          <div class="history-meta">${sizeMB} MB · ${date}</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <a class="btn btn-sm btn-ghost" href="/api/download/${f.name}" title="Download File">⬇️</a>
          <button class="btn btn-sm btn-ghost" onclick="deleteHistoryFile('${f.name}')" style="color: #e74c3c;" title="Hapus File">🗑️</button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (e) {
    container.innerHTML = '<p class="text-muted small">Gagal memuat riwayat.</p>';
  }
}

async function deleteHistoryFile(filename) {
  if (!confirm(`Apakah Anda yakin ingin menghapus file "${filename}"?`)) return;
  try {
    const res = await fetch(`/api/delete-file/${filename}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      loadHistory(); // refresh list
    } else {
      alert('Gagal menghapus: ' + json.error);
    }
  } catch (e) {
    alert('Terjadi kesalahan saat menghapus file.');
  }
}

// ──────────────────────────────────────────
// Helpers & Theme
// ──────────────────────────────────────────
function setStatus(el, type, text) {
  el.textContent = text;
  el.className = 'status-pill' + (type ? ' ' + type : '');
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  const currentTheme = document.documentElement.getAttribute('data-theme');
  icon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadHistory();
  updateRunButton();
});
