// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmt    = n  => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫';
const fmtPct = n  => n.toFixed(1) + '%';

function classifyAction(action, amount) {
  if (amount === 0) return 'init';
  const a = action.toLowerCase();
  if (a.includes('lãi') || a.includes('cộng')) return 'auto';
  if (a.includes('thanh toán') || a.includes('trả') || a.includes('trừ')) return 'pay';
  return 'other';
}

function formatTime(s) {
  const parts = s.split(' ');
  return { date: parts[0], time: parts[1].slice(0, 5) };
}

// ── NAV ──────────────────────────────────────────────────────────────────────
function switchPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  el.classList.add('active');
}

// ── RENDER OVERVIEW ───────────────────────────────────────────────────────────
function renderOverview(data) {
  const gocBanDau = data.lich_su[0]?.goc_hien_tai ?? data.tien_goc;
  const tong      = data.tien_goc + data.tien_lai;
  const daTra     = gocBanDau - data.tien_goc;
  const pctDaTra  = gocBanDau > 0 ? (daTra / gocBanDau) * 100 : 0;
  const countPay  = data.lich_su.filter(x => classifyAction(x.hanh_dong, x.so_tien) === 'pay').length;
  const tyLe      = data.tien_goc > 0 ? (data.tien_lai / data.tien_goc * 100) : 0;
  const [y, m]    = data.thang_cap_nhat_cuoi.split('-');

  // Stat cards
  document.getElementById('s-goc').textContent   = fmt(data.tien_goc);
  document.getElementById('s-lai').textContent   = fmt(data.tien_lai);
  document.getElementById('s-tong').textContent  = fmt(tong);
  document.getElementById('s-datra').textContent = daTra > 0 ? fmt(daTra) : '0 ₫';

  // Info rows
  document.getElementById('d-thang').textContent      = `Tháng ${m}/${y}`;
  document.getElementById('d-sl').textContent         = `${data.lich_su.length} lần`;
  document.getElementById('d-thanhtoan').textContent  = `${countPay} lần`;
  document.getElementById('d-tyle').textContent       = fmtPct(tyLe);

  // Trạng thái chip
  let ttHtml = '';
  if (data.tien_goc === 0) {
    ttHtml = '<span class="chip chip-green">✅ Đã tất toán</span>';
  } else if (pctDaTra >= 50) {
    ttHtml = '<span class="chip chip-yellow">🔄 Đang trả (&gt;50%)</span>';
  } else {
    ttHtml = '<span class="chip chip-red">⚠️ Đang theo dõi</span>';
  }
  document.getElementById('d-trangthai').innerHTML = ttHtml;

  // Sidebar footer
  document.getElementById('footer-update').textContent = `Cập nhật: ${m}/${y}`;

  // Progress ring
  const circumference = 2 * Math.PI * 55; // ≈ 345.4
  const offset = circumference - (pctDaTra / 100) * circumference;
  const ringEl = document.getElementById('ring-progress');
  ringEl.style.strokeDasharray  = circumference;
  ringEl.style.strokeDashoffset = circumference;

  requestAnimationFrame(() => {
    setTimeout(() => { ringEl.style.strokeDashoffset = offset; }, 200);
  });

  document.getElementById('ring-pct').textContent  = fmtPct(pctDaTra);
  document.getElementById('ring-paid').textContent = daTra > 0 ? fmt(daTra) : '0 ₫';
}

// ── RENDER HISTORY ────────────────────────────────────────────────────────────
function renderHistory(data) {
  // Meta chips
  const totalLai = data.lich_su
    .filter(x => classifyAction(x.hanh_dong, x.so_tien) === 'auto')
    .reduce((s, x) => s + x.so_tien, 0);
  const totalPay = data.lich_su
    .filter(x => classifyAction(x.hanh_dong, x.so_tien) === 'pay')
    .reduce((s, x) => s + x.so_tien, 0);

  document.getElementById('history-meta-chips').innerHTML = `
    <span class="chip chip-accent">${data.lich_su.length} bản ghi</span>
    ${totalLai > 0 ? `<span class="chip chip-yellow">+${fmt(totalLai)} lãi cộng</span>` : ''}
    ${totalPay > 0 ? `<span class="chip chip-green">−${fmt(totalPay)} đã trả</span>` : ''}
  `;

  // Badge sidebar
  document.getElementById('badge-count').textContent = data.lich_su.length;

  // Timeline (newest first)
  const tlEl   = document.getElementById('timeline');
  const sorted = [...data.lich_su].reverse();

  sorted.forEach(item => {
    const type = classifyAction(item.hanh_dong, item.so_tien);
    const { date, time } = formatTime(item.thoi_gian);

    const dotClass = { init: 'd-init', auto: 'd-auto', pay: 'd-pay', other: 'd-other' }[type];
    const dotIcon  = { init: '🔰', auto: '⚡', pay: '💸', other: '●' }[type];

    let amountHtml = '';
    if (item.so_tien === 0) {
      amountHtml = `<div class="tl-amount a-none">—</div><div class="tl-amount-label">không biến động</div>`;
    } else if (type === 'auto') {
      amountHtml = `<div class="tl-amount a-add">+${fmt(item.so_tien)}</div><div class="tl-amount-label">lãi cộng thêm</div>`;
    } else if (type === 'pay') {
      amountHtml = `<div class="tl-amount a-minus">−${fmt(item.so_tien)}</div><div class="tl-amount-label">đã thanh toán</div>`;
    } else {
      amountHtml = `<div class="tl-amount">${fmt(item.so_tien)}</div>`;
    }

    tlEl.insertAdjacentHTML('beforeend', `
      <div class="timeline-item">
        <div class="tl-time">${date}<br>${time}</div>
        <div class="tl-spine">
          <div class="tl-dot ${dotClass}">${dotIcon}</div>
          <div class="tl-line"></div>
        </div>
        <div>
          <div class="tl-card">
            <div class="tl-card-top">
              <div class="tl-action">${item.hanh_dong}</div>
              <div class="tl-amount-wrap">${amountHtml}</div>
            </div>
            <div class="tl-snapshot">
              <div class="snap-item">
                <div class="snap-label">Gốc sau</div>
                <div class="snap-val">${fmt(item.goc_hien_tai)}</div>
              </div>
              <div class="snap-item">
                <div class="snap-label">Lãi sau</div>
                <div class="snap-val">${fmt(item.lai_hien_tai)}</div>
              </div>
              <div class="snap-item">
                <div class="snap-label">Tổng sau</div>
                <div class="snap-val">${fmt(item.goc_hien_tai + item.lai_hien_tai)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });
}

// ── SHOW ERROR ────────────────────────────────────────────────────────────────
function showError(msg) {
  ['page-overview', 'page-history'].forEach(id => {
    const page = document.getElementById(id);
    page.innerHTML = `<div class="error-box">⚠️ ${msg}</div>`;
  });
  document.getElementById('footer-update').textContent = 'Lỗi tải dữ liệu';
}

// ── BOOTSTRAP ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetch('../data_no.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} – không tìm thấy data_no.json`);
      return res.json();
    })
    .then(data => {
      renderOverview(data);
      renderHistory(data);
    })
    .catch(err => {
      console.error('[DebtTracker]', err);
      showError(
        `Không thể tải <code>../data_no.json</code>.<br>
         File <code>data_no.json</code> phải nằm ngoài thư mục <code>web_src/</code>.<br>
         Hãy mở trang qua một web server (ví dụ: <code>npx serve .</code> hoặc Live Server).<br><br>
         Chi tiết: ${err.message}`
      );
    });
});