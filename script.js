// ── BOOTSTRAP ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetch('./data_no.json') // Đã sửa đường dẫn thành ngang hàng
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
        `Không thể tải <code>data_no.json</code>.<br>
         Đảm bảo file <code>data_no.json</code> nằm cùng cấp với file HTML/JS hiện tại.<br>
         Hãy mở trang qua một web server (ví dụ: <code>npx serve .</code> hoặc Live Server).<br><br>
         Chi tiết: ${err.message}`
      );
    });
});