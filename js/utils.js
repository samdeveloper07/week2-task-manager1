// =============================================
// UTILS.JS — Pure helper functions
// No DOM access, no state. Just reusable logic.
// =============================================

/**
 * Generate a unique ID for each task
 * Combines timestamp + random string
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Escape HTML to prevent XSS attacks
 * Always use this before inserting user text into innerHTML
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check if a due date is in the past (overdue)
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {boolean}
 */
function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

/**
 * Check if a due date is today
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {boolean}
 */
function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

/**
 * Format a date string to a readable label
 * e.g. "2025-06-15" → "15 Jun"
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Show a toast notification
 * @param {string} message
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}