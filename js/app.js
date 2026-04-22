// =============================================
// APP.JS — Main controller / entry point
// Wires together storage.js, ui.js, utils.js
// All event listeners live here
// =============================================

// === APPLICATION STATE ===
let tasks         = [];
let currentFilter = 'all';
let currentQuery  = '';
let lastDeleted   = null;   // For Ctrl+Z undo

// === INITIALISE APP ===
function init() {
  // 1. Load saved theme
  const savedTheme = loadTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('themeToggleBtn').textContent =
    savedTheme === 'dark' ? '☀' : '🌙';

  // 2. Load saved tasks
  tasks = loadTasks();

  // 3. Seed demo tasks if app is opened for the first time
  if (tasks.length === 0) {
    tasks = getDefaultTasks();
    saveTasks(tasks);
  }

  // 4. Render UI
  updateStats(tasks);
  renderTasks(tasks, currentFilter, currentQuery);

  // 5. Set default due date to today
  document.getElementById('dueDate').valueAsDate = new Date();

  // 6. Attach all event listeners
  bindEvents();
}

// === DEFAULT TASKS (first-time seed) ===
function getDefaultTasks() {
  return [
    { id: generateId(), title: 'Review Java OOP concepts', priority: 'high',   due: '', done: false },
    { id: generateId(), title: 'Build Spring Boot REST API', priority: 'medium', due: '', done: false },
    { id: generateId(), title: 'Practice LeetCode array problems', priority: 'medium', due: '', done: true  },
    { id: generateId(), title: 'Update GitHub portfolio README', priority: 'low',    due: '', done: false },
  ];
}

// === ADD TASK ===
function addTask() {
  const input    = document.getElementById('taskInput');
  const title    = input.value.trim();
  const priority = document.getElementById('prioritySelect').value;
  const due      = document.getElementById('dueDate').value;

  if (!title) {
    input.focus();
    input.style.borderColor = 'var(--danger)';
    setTimeout(() => { input.style.borderColor = ''; }, 800);
    return;
  }

  const newTask = {
    id:       generateId(),
    title:    title,
    priority: priority,
    due:      due,
    done:     false
  };

  tasks.unshift(newTask);      // Add to start of array
  saveTasks(tasks);
  updateStats(tasks);
  renderTasks(tasks, currentFilter, currentQuery);

  input.value = '';
  input.focus();
  showToast('Task added ✓');
}

// === DELETE TASK ===
function deleteTask(id) {
  lastDeleted = tasks.find(t => t.id === id);   // Store for undo
  tasks       = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  updateStats(tasks);
  renderTasks(tasks, currentFilter, currentQuery);
  showToast('Deleted · Ctrl+Z to undo');
}

// === TOGGLE DONE/UNDONE ===
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks(tasks);
  updateStats(tasks);
  renderTasks(tasks, currentFilter, currentQuery);
}

// === EDIT TASK (save callback) ===
function saveEditedTask(id, newTitle) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.title = newTitle;
  saveTasks(tasks);
  renderTasks(tasks, currentFilter, currentQuery);
  showToast('Task updated');
}

// === CLEAR COMPLETED ===
function clearCompleted() {
  const count = tasks.filter(t => t.done).length;
  if (count === 0) { showToast('No completed tasks to clear'); return; }
  tasks = tasks.filter(t => !t.done);
  saveTasks(tasks);
  updateStats(tasks);
  renderTasks(tasks, currentFilter, currentQuery);
  showToast(`Cleared ${count} completed task${count > 1 ? 's' : ''}`);
}

// === SET FILTER ===
function setFilter(filterValue) {
  currentFilter = filterValue;

  // Update active button style
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterValue);
  });

  renderTasks(tasks, currentFilter, currentQuery);
}

// === TOGGLE THEME ===
function toggleTheme() {
  const html    = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.getElementById('themeToggleBtn').textContent = next === 'dark' ? '☀' : '🌙';
  saveTheme(next);
  showToast(`Switched to ${next} mode`);
}

// === UNDO LAST DELETE (Ctrl+Z) ===
function undoDelete() {
  if (!lastDeleted) return;
  tasks.unshift(lastDeleted);
  lastDeleted = null;
  saveTasks(tasks);
  updateStats(tasks);
  renderTasks(tasks, currentFilter, currentQuery);
  showToast('Task restored ✓');
}

// =============================================
// BIND ALL EVENT LISTENERS
// =============================================
function bindEvents() {

  // Add button click
  document.getElementById('addTaskBtn')
    .addEventListener('click', addTask);

  // Enter key in input
  document.getElementById('taskInput')
    .addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  // Theme toggle
  document.getElementById('themeToggleBtn')
    .addEventListener('click', toggleTheme);

  // Clear done button
  document.getElementById('clearDoneBtn')
    .addEventListener('click', clearCompleted);

  // Export button
  document.getElementById('exportBtn')
    .addEventListener('click', () => {
      exportTasksAsJson(tasks);
      showToast('Tasks exported!');
    });

  // Filter buttons — single delegated listener
  document.getElementById('filterBtns')
    .addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (btn) setFilter(btn.dataset.filter);
    });

  // Search input — live search on every keystroke
  document.getElementById('searchInput')
    .addEventListener('input', e => {
      currentQuery = e.target.value;
      renderTasks(tasks, currentFilter, currentQuery);
    });

  // Task list — delegated click handler for toggle / edit / delete
  document.getElementById('taskList')
    .addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id     = btn.dataset.id;
      if (action === 'toggle') toggleTask(id);
      if (action === 'edit')   startInlineEdit(id, tasks, saveEditedTask);
      if (action === 'delete') deleteTask(id);
    });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Ctrl+Z — undo delete
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      undoDelete();
    }
  });
}

// === START APP ===
init();