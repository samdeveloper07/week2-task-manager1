// =============================================
// STORAGE.JS — All localStorage operations
// Single responsibility: read/write tasks only
// =============================================

const STORAGE_KEY = 'tm_tasks_v2';

/**
 * Save the entire tasks array to localStorage
 * Called after every change (add, delete, toggle, edit)
 * @param {Array} tasks
 */
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Storage save failed:', e);
    showToast('⚠ Could not save — storage may be full');
  }
}

/**
 * Load tasks array from localStorage
 * Returns empty array if nothing saved yet
 * @returns {Array}
 */
function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Storage load failed:', e);
    return [];
  }
}

/**
 * Save the current theme ("dark" or "light")
 * @param {string} theme
 */
function saveTheme(theme) {
  localStorage.setItem('tm_theme', theme);
}

/**
 * Load the saved theme, default to "dark"
 * @returns {string}
 */
function loadTheme() {
  return localStorage.getItem('tm_theme') || 'dark';
}

/**
 * Export tasks as a downloadable JSON file
 * @param {Array} tasks
 */
function exportTasksAsJson(tasks) {
  const json = JSON.stringify(tasks, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'tasks_backup.json';
  a.click();
  URL.revokeObjectURL(url);
}