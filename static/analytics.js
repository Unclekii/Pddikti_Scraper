// ═══════════════════════════════════════════
//  Analytics Engine — Chart.js v4 Powered
// ═══════════════════════════════════════════

// Chart instances registry for cleanup
const chartInstances = {};
let dosenData = null;
let prodiData = null;
let dosenTablePage = 0;
let prodiTablePage = 0;
const TABLE_PAGE_SIZE = 25;

// Color palettes
const PALETTE = {
  primary: ['#3f5efb', '#00f2fe', '#fb2576', '#9d00ff', '#00ffab', '#ffab00', '#ff6b6b', '#4ecdc4'],
  gender: ['#3f5efb', '#fb2576'],
  akred: ['#00ffab', '#2ecc71', '#00f2fe', '#3f5efb', '#ffab00', '#f39c12', '#fb2576', '#9d00ff'],
  gradient: (ctx, c1, c2) => {
    const g = ctx.createLinearGradient(0, 0, 0, 400);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    return g;
  }
};

// Chart.js global defaults & plugins
Chart.register(ChartDataLabels);
Chart.defaults.color = '#838eb0';
Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(13,14,26,0.95)';
Chart.defaults.plugins.tooltip.titleColor = '#e2e8f0';
Chart.defaults.plugins.tooltip.bodyColor = '#838eb0';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 12;
Chart.defaults.plugins.tooltip.padding = 12;

// DataLabels Global Defaults
Chart.defaults.plugins.datalabels = {
  color: '#ffffff',
  font: { weight: 'bold', size: 11, family: "'Inter', sans-serif" },
  textShadowColor: 'rgba(0,0,0,0.8)',
  textShadowBlur: 4,
  display: function(context) {
    return context.dataset.data[context.dataIndex] > 0; // Hide 0 values
  }
};

// ──────────────────────────────────────────
// LOAD ANALYTICS DATA
// ──────────────────────────────────────────
async function loadAnalytics(type) {
  const selectId = type === 'dosen' ? 'dosen-file-select' : 'prodi-file-select';
  const filename = document.getElementById(selectId).value;
  if (!filename) return;

  const emptyEl = document.getElementById(`${type}-empty`);
  const contentEl = document.getElementById(`${type}-analytics-content`);
  const loadingEl = document.getElementById(`${type}-loading`);

  emptyEl.style.display = 'none';
  contentEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'flex';

  try {
    const res = await fetch(`/api/analyze/${encodeURIComponent(filename)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);

    if (loadingEl) loadingEl.style.display = 'none';

    if (type === 'dosen') {
      dosenData = json.dosen;
      renderDosenAnalytics(json.dosen);
    } else {
      prodiData = json.prodi;
      renderProdiAnalytics(json.prodi);
    }
    contentEl.style.display = 'block';
    if (window.showToast) showToast(`Data loaded: ${filename}`, 'success');
  } catch (e) {
    if (loadingEl) loadingEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    if (window.showToast) showToast('Gagal load data: ' + e.message, 'error');
  }
}

// ──────────────────────────────────────────
// HELPER: Count occurrences
// ──────────────────────────────────────────
function countBy(arr, key) {
  const m = {};
  arr.forEach((x) => { const v = x[key] || 'Tidak Diketahui'; m[v] = (m[v] || 0) + 1; });
  return m;
}

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function createDoughnut(canvasId, labels, data, colors) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
    options: { 
      cutout: '65%', 
      plugins: { 
        legend: { position: 'bottom' },
        datalabels: {
          formatter: (value, ctx) => {
            let sum = 0;
            let dataArr = ctx.chart.data.datasets[0].data;
            dataArr.map(data => { sum += Number(data); });
            if(sum === 0) return '';
            let percentage = (value * 100 / sum).toFixed(1) + "%";
            return percentage;
          },
          color: '#fff',
        }
      }, 
      responsive: true, maintainAspectRatio: false 
    }
  });
}

function createHBar(canvasId, labels, data, color) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: color || PALETTE.primary[0], borderRadius: 6, maxBarThickness: 32 }] },
    options: { 
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, 
      plugins: { 
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          offset: 4,
          color: '#e2e8f0',
          font: { weight: '600', size: 11 },
          formatter: Math.round
        }
      },
      scales: { 
        x: { grid: { color: 'rgba(255,255,255,0.03)' }, grace: '10%' }, 
        y: { 
          grid: { display: false },
          ticks: { crossAlign: 'far' }
        } 
      } 
    }
  });
}

function createBar(canvasId, labels, data, colors) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors || PALETTE.primary, borderRadius: 6 }] },
    options: { 
      responsive: true, maintainAspectRatio: false, 
      plugins: { 
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          offset: 4,
          color: '#e2e8f0',
          font: { weight: '600', size: 11 },
          formatter: Math.round
        }
      },
      scales: { 
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, grace: '10%' }, 
        x: { grid: { display: false } } 
      } 
    }
  });
}

function createStackedBar(canvasId, labels, datasets, horizontal = false, stacked = true) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: { 
      indexAxis: horizontal ? 'y' : 'x', 
      responsive: true, maintainAspectRatio: false,
      plugins: { 
        legend: { position: 'bottom' },
        datalabels: {
          anchor: stacked ? 'center' : 'end',
          align: stacked ? 'center' : 'end',
          color: stacked ? '#fff' : '#a0aec0',
          font: { weight: 'bold', size: 10 },
          formatter: (value) => value > 0 ? value : ''
        }
      },
      scales: { 
        x: { stacked: stacked, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { stacked: stacked, grid: { color: 'rgba(255,255,255,0.03)' } } 
      } 
    }
  });
}

// ──────────────────────────────────────────
// RENDER KPI CARDS
// ──────────────────────────────────────────
function renderKPIRow(containerId, kpis) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  kpis.forEach((kpi) => {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.innerHTML = `
      <div class="kpi-icon">${kpi.icon}</div>
      <div class="kpi-info">
        <span class="kpi-value">${kpi.value}</span>
        <span class="kpi-label">${kpi.label}</span>
      </div>`;
    container.appendChild(card);
  });
  if (window.lucide) lucide.createIcons({ nodes: [container] });
}

// ══════════════════════════════════════
// PAGE 3: DOSEN ANALYTICS
// ══════════════════════════════════════
function renderDosenAnalytics(data) {
  const total = data.length;
  const female = data.filter((d) => (d['Jenis Kelamin'] || '').includes('Perempuan')).length;
  const male = data.filter((d) => (d['Jenis Kelamin'] || '').includes('Laki')).length;
  const s3 = data.filter((d) => d['Pendidikan Terakhir'] === 'S3').length;
  const profesor = data.filter((d) => d['Jabatan Fungsional'] === 'Profesor').length;
  const tetap = data.filter((d) => (d['Status Ikatan Kerja'] || '').includes('Dosen Tetap')).length;

  renderKPIRow('dosen-kpi-row', [
    { icon: '<i data-lucide="users" style="width:28px;height:28px;"></i>', value: total.toLocaleString(), label: 'Total Dosen' },
    { icon: '<i data-lucide="user" style="width:28px;height:28px;"></i>', value: male.toLocaleString(), label: 'Laki-Laki' },
    { icon: '<i data-lucide="user" style="width:28px;height:28px;"></i>', value: female.toLocaleString(), label: 'Perempuan' },
    { icon: '<i data-lucide="graduation-cap" style="width:28px;height:28px;"></i>', value: ((s3 / total) * 100).toFixed(1) + '%', label: 'Doktor (S3)' },
    { icon: '<i data-lucide="award" style="width:28px;height:28px;"></i>', value: ((profesor / total) * 100).toFixed(1) + '%', label: 'Profesor' },
    { icon: '<i data-lucide="briefcase" style="width:28px;height:28px;"></i>', value: ((tetap / total) * 100).toFixed(1) + '%', label: 'Dosen Tetap' },
  ]);

  // Gender
  const genderCounts = countBy(data, 'Jenis Kelamin');
  createDoughnut('chart-dosen-gender', Object.keys(genderCounts), Object.values(genderCounts), PALETTE.gender);

  // Education
  const eduCounts = countBy(data, 'Pendidikan Terakhir');
  const eduOrder = ['S3', 'S2', 'S2 Terapan', 'S1', 'Lainnya', '(tidak diisi)', 'Tidak Diketahui'];
  const eduLabels = eduOrder.filter((k) => eduCounts[k]);
  const eduData = eduLabels.map((k) => eduCounts[k]);
  createHBar('chart-dosen-education', eduLabels, eduData, '#00f2fe');

  // Jabatan
  const jabCounts = countBy(data, 'Jabatan Fungsional');
  const jabOrder = ['Profesor', 'Lektor Kepala', 'Lektor', 'Asisten Ahli', 'Tidak Diketahui'];
  const jabLabels = jabOrder.filter((k) => jabCounts[k]);
  const jabData = jabLabels.map((k) => jabCounts[k]);
  createHBar('chart-dosen-jabatan', jabLabels, jabData, '#9d00ff');

  // Kepegawaian
  const kepCounts = countBy(data, 'Status Kepegawaian');
  const kepSorted = Object.entries(kepCounts).sort((a, b) => b[1] - a[1]);
  createHBar('chart-dosen-kepegawaian', kepSorted.map(x => x[0]), kepSorted.map(x => x[1]), '#00f2fe');

  // Gender × Jabatan cross
  const crossLabels = jabOrder.filter((k) => k !== 'Tidak Diketahui' && jabCounts[k]);
  const maleData = crossLabels.map((j) => data.filter((d) => d['Jabatan Fungsional'] === j && (d['Jenis Kelamin'] || '').includes('Laki')).length);
  const femaleData = crossLabels.map((j) => data.filter((d) => d['Jabatan Fungsional'] === j && (d['Jenis Kelamin'] || '').includes('Perempuan')).length);
  createStackedBar('chart-dosen-crossgender', crossLabels, [
    { label: 'Laki-laki', data: maleData, backgroundColor: '#3f5efb', borderRadius: 4 },
    { label: 'Perempuan', data: femaleData, backgroundColor: '#fb2576', borderRadius: 4 },
  ], true, true);

  // Top 10 PT
  const ptCounts = countBy(data, 'Perguruan Tinggi');
  const ptSorted = Object.entries(ptCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  createHBar('chart-dosen-toppt', ptSorted.map((x) => x[0].length > 40 ? x[0].substring(0, 37) + '...' : x[0]), ptSorted.map((x) => x[1]), '#00ffab');

  // Status Aktivitas
  const statusCountsRaw = countBy(data, 'Status Aktifitas');
  const statusCounts = {};
  for (const [k, v] of Object.entries(statusCountsRaw)) {
    let formatted = k === 'Tidak Diketahui' ? k : k.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    statusCounts[formatted] = (statusCounts[formatted] || 0) + v;
  }
  const statusSorted = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  createHBar('chart-dosen-status', statusSorted.map(x => x[0]), statusSorted.map(x => x[1]),
    ['#00ffab', '#ffab00', '#3f5efb', '#fb2576', '#9d00ff', '#4ecdc4']);

  // Status Ikatan Kerja
  const ikatanCounts = countBy(data, 'Status Ikatan Kerja');
  const ikatanSorted = Object.entries(ikatanCounts).sort((a, b) => b[1] - a[1]);
  createHBar('chart-dosen-ikatan', ikatanSorted.map(x => x[0]), ikatanSorted.map(x => x[1]), ['#3f5efb', '#00f2fe', '#fb2576']);

  // Data Table
  dosenTablePage = 0;
  renderDosenTable(data);
}

// ══════════════════════════════════════
// PAGE 4: PRODI ANALYTICS
// ══════════════════════════════════════
function renderProdiAnalytics(data) {
  const total = data.length;
  const uniquePT = new Set(data.map((p) => p['Perguruan Tinggi'])).size;
  const totalDosen = data.reduce((s, p) => s + (parseInt(p['Jumlah Dosen']) || 0), 0);
  const avgDosen = total > 0 ? (totalDosen / total).toFixed(1) : 0;
  // Map Akreditasi A->Unggul, B->Baik Sekali, C->Baik
  const akredMap = { 'A': 'Unggul', 'B': 'Baik Sekali', 'C': 'Baik' };
  data.forEach(p => {
    let akred = p['Akreditasi Program Studi'];
    if (akredMap[akred]) {
      p['Akreditasi Program Studi'] = akredMap[akred];
    }
  });

  const unggulA = data.filter((p) => ['Unggul'].includes(p['Akreditasi Program Studi'])).length;
  const belumLapor = data.filter((p) => (p['Semester Laporan Terakhir'] || '').toString().toLowerCase().includes('belum')).length;

  renderKPIRow('prodi-kpi-row', [
    { icon: '<i data-lucide="clipboard-list" style="width:28px;height:28px;"></i>', value: total.toLocaleString(), label: 'Total Prodi' },
    { icon: '<i data-lucide="landmark" style="width:28px;height:28px;"></i>', value: uniquePT.toLocaleString(), label: 'Total Perguruan Tinggi' },
    { icon: '<i data-lucide="bar-chart-2" style="width:28px;height:28px;"></i>', value: avgDosen, label: 'Avg Dosen/Prodi' },
    { icon: '<i data-lucide="star" style="width:28px;height:28px;"></i>', value: ((unggulA / total) * 100).toFixed(1) + '%', label: 'Unggul' },
    { icon: '<i data-lucide="alert-triangle" style="width:28px;height:28px;"></i>', value: ((belumLapor / total) * 100).toFixed(1) + '%', label: 'Belum Lapor' },
  ]);

  // Akreditasi
  const akredCounts = countBy(data, 'Akreditasi Program Studi');
  const akredOrder = ['Unggul', 'Baik Sekali', 'Baik', 'Terakreditasi Pertama', 'Terakreditasi Sementara', '(kosong)'];
  const akredLabels = akredOrder.filter((k) => akredCounts[k]);
  createDoughnut('chart-prodi-akreditasi', akredLabels, akredLabels.map((k) => akredCounts[k]), PALETTE.akred);

  // Jenjang
  const jenjangCounts = countBy(data, 'Jenjang');
  const jenjangOrder = ['D3', 'D4', 'S1', 'S2', 'S2 TERAPAN', 'S3'];
  const jLabels = jenjangOrder.filter((k) => jenjangCounts[k]);
  createBar('chart-prodi-jenjang', jLabels, jLabels.map((k) => jenjangCounts[k]), PALETTE.primary);

  // Trifecta: PTN/PTS, PTKIN/NON, DIKTI/DIKTIS
  const ptnCounts = countBy(data, 'PTN/PTS');
  createDoughnut('chart-prodi-ptnpts', Object.keys(ptnCounts), Object.values(ptnCounts), ['#3f5efb', '#fb2576']);
  const ptkinCounts = countBy(data, 'PTKIN/NON PTKIN');
  createDoughnut('chart-prodi-ptkin', Object.keys(ptkinCounts), Object.values(ptkinCounts), ['#00ffab', '#ffab00']);
  const diktisCounts = countBy(data, 'DIKTI/DIKTIS');
  createDoughnut('chart-prodi-diktis', Object.keys(diktisCounts), Object.values(diktisCounts), ['#00f2fe', '#9d00ff']);

  // Top 10 Provinsi
  const provCounts = countBy(data, 'Provinsi');
  const provSorted = Object.entries(provCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  createHBar('chart-prodi-provinsi', provSorted.map((x) => x[0]), provSorted.map((x) => x[1]), '#3f5efb');

  // Avg dosen per akreditasi
  const akredAvg = {};
  akredLabels.forEach((ak) => {
    const prodiInAk = data.filter((p) => p['Akreditasi Program Studi'] === ak);
    const totalD = prodiInAk.reduce((s, p) => s + (parseInt(p['Jumlah Dosen']) || 0), 0);
    akredAvg[ak] = prodiInAk.length > 0 ? (totalD / prodiInAk.length).toFixed(1) : 0;
  });
  createBar('chart-prodi-avgdosen', Object.keys(akredAvg), Object.values(akredAvg).map(Number), PALETTE.akred);

  // Semester pelaporan
  const semCounts = {};
  data.forEach((p) => {
    const v = (p['Semester Laporan Terakhir'] || '').toString();
    const label = (!v || v.toLowerCase().includes('belum') || v === 'Tidak Diketahui') ? 'Belum Lapor / Tidak Diketahui' : 'Sudah Lapor';
    semCounts[label] = (semCounts[label] || 0) + 1;
  });
  createDoughnut('chart-prodi-semester', Object.keys(semCounts), Object.values(semCounts), ['#00ffab', '#fb2576']);

  // Jenjang × Akreditasi stacked
  const uniqueAkred = akredLabels.filter((k) => k !== 'Tidak Diketahui');
  const jenjangLabels = jLabels;
  const akredDatasets = uniqueAkred.map((ak, idx) => ({
    label: ak,
    data: jenjangLabels.map((j) => data.filter((p) => p['Jenjang'] === j && p['Akreditasi Program Studi'] === ak).length),
    backgroundColor: PALETTE.akred[idx % PALETTE.akred.length],
    borderRadius: 3,
  }));
  createStackedBar('chart-prodi-jenjangakred', jenjangLabels, akredDatasets, false, false);

  // Data Table
  prodiTablePage = 0;
  renderProdiTable(data);
}

// ──────────────────────────────────────────
// INTERACTIVE DATA TABLES
// ──────────────────────────────────────────
function renderDosenTable(data) {
  const cols = ['Nama', 'Perguruan Tinggi', 'Jabatan Fungsional', 'Jenis Kelamin', 'Pendidikan Terakhir', 'Status Kepegawaian', 'Jenjang'];
  const thead = document.getElementById('dosen-table-head');
  const tbody = document.getElementById('dosen-table-body');

  thead.innerHTML = '';
  cols.forEach((c) => {
    const th = document.createElement('th');
    th.textContent = c;
    th.style.cursor = 'pointer';
    th.onclick = () => {
      data.sort((a, b) => (a[c] || '').toString().localeCompare((b[c] || '').toString()));
      renderDosenTableBody(data, cols);
    };
    thead.appendChild(th);
  });
  renderDosenTableBody(data, cols);
}

function renderDosenTableBody(data, cols) {
  const tbody = document.getElementById('dosen-table-body');
  const q = (document.getElementById('dosen-table-search')?.value || '').toLowerCase();
  const filtered = q ? data.filter((d) => cols.some((c) => (d[c] || '').toString().toLowerCase().includes(q))) : data;
  const start = dosenTablePage * TABLE_PAGE_SIZE;
  const page = filtered.slice(start, start + TABLE_PAGE_SIZE);

  tbody.innerHTML = '';
  page.forEach((d) => {
    const tr = document.createElement('tr');
    cols.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = d[c] || '-';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  renderPagination('dosen-pagination', filtered.length, dosenTablePage, (p) => { dosenTablePage = p; renderDosenTableBody(data, cols); });
}

function filterDosenTable() {
  dosenTablePage = 0;
  if (dosenData) renderDosenTable(dosenData);
}

function renderProdiTable(data) {
  const cols = ['Nama Prodi', 'Jenjang', 'Perguruan Tinggi', 'Jumlah Dosen', 'Akreditasi Program Studi', 'PTN/PTS', 'Provinsi'];
  const thead = document.getElementById('prodi-table-head');
  const tbody = document.getElementById('prodi-table-body');

  thead.innerHTML = '';
  cols.forEach((c) => {
    const th = document.createElement('th');
    th.textContent = c;
    th.style.cursor = 'pointer';
    th.onclick = () => {
      data.sort((a, b) => {
        const av = a[c], bv = b[c];
        if (c === 'Jumlah Dosen') return (parseInt(bv) || 0) - (parseInt(av) || 0);
        return (av || '').toString().localeCompare((bv || '').toString());
      });
      renderProdiTableBody(data, cols);
    };
    thead.appendChild(th);
  });
  renderProdiTableBody(data, cols);
}

function renderProdiTableBody(data, cols) {
  const tbody = document.getElementById('prodi-table-body');
  const q = (document.getElementById('prodi-table-search')?.value || '').toLowerCase();
  const filtered = q ? data.filter((d) => cols.some((c) => (d[c] || '').toString().toLowerCase().includes(q))) : data;
  const start = prodiTablePage * TABLE_PAGE_SIZE;
  const page = filtered.slice(start, start + TABLE_PAGE_SIZE);

  tbody.innerHTML = '';
  page.forEach((d) => {
    const tr = document.createElement('tr');
    cols.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = d[c] !== undefined && d[c] !== '' ? d[c] : '-';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  renderPagination('prodi-pagination', filtered.length, prodiTablePage, (p) => { prodiTablePage = p; renderProdiTableBody(data, cols); });
}

function filterProdiTable() {
  prodiTablePage = 0;
  if (prodiData) renderProdiTable(prodiData);
}

function renderPagination(containerId, totalItems, currentPage, onPageChange) {
  const container = document.getElementById(containerId);
  const totalPages = Math.ceil(totalItems / TABLE_PAGE_SIZE);
  container.innerHTML = '';

  if (totalPages <= 1) return;

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `${currentPage * TABLE_PAGE_SIZE + 1}–${Math.min((currentPage + 1) * TABLE_PAGE_SIZE, totalItems)} of ${totalItems}`;
  container.appendChild(info);

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '← Prev';
  prev.disabled = currentPage === 0;
  prev.onclick = () => onPageChange(currentPage - 1);
  container.appendChild(prev);

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = 'Next →';
  next.disabled = currentPage >= totalPages - 1;
  next.onclick = () => onPageChange(currentPage + 1);
  container.appendChild(next);
}
