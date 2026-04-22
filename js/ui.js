// =============================================
// UI.JS — All DOM rendering functions
// Reads from the tasks array, writes to the DOM
// =============================================

/**
 * Render the full task list based on current filter + search
 * @param {Array}  tasks   - full tasks array
 * @param {string} filter  - "all" | "active" | "completed" | "high"
 * @param {string} query   - search string
 */
function renderTasks(tasks, filter, query) {
  const list = document.getElementById('taskList');
  const filtered = getFilteredTasks(tasks, filter, query);

  if (filtered.length === 0) {
    list.innerHTML = buildEmptyState(filter);
    return;
  }

  list.innerHTML = filtered.map(buildTaskHTML).join('');
  attachDragEvents(tasks);
}

/**
 * Filter and search tasks
 * @returns {Array}
 */
function getFilteredTasks(tasks, filter, query) {
  const q = (query || '').toLowerCase().trim();
  return tasks.filter(task => {
    const matchesSearch = !q || task.title.toLowerCase().includes(q);
    const matchesFilter =
      filter === 'all'       ? true :
      filter === 'active'    ? !task.done :
      filter === 'completed' ? task.done :
      filter === 'high'      ? (task.priority === 'high' && !task.done) :
      true;
    return matchesSearch && matchesFilter;
  });
}

/**
 * Build the HTML string for a single task card
 * @param {Object} task
 * @returns {string}
 */
function buildTaskHTML(task) {
  const priorityClass = { low: 'p-low', medium: 'p-med', high: 'p-high' }[task.priority];
  const priorityLabel = { low: 'Low',   medium: 'Med',   high: 'High'  }[task.priority];
  const doneClass     = task.done ? 'done' : '';
  const checkedClass  = task.done ? 'checked' : '';
  const checkMark     = task.done ? '✓' : '';

  // Build due date badge
  let dueHtml = '';
  if (task.due) {
    const cls    = isOverdue(task.due) ? 'overdue' : isToday(task.due) ? 'today' : '';
    const icon   = isOverdue(task.due) ? '⚠ '     : isToday(task.due) ? '⏰ '  : '📅 ';
    dueHtml = `<span class="due-label ${cls}">${icon}${formatDate(task.due)}</span>`;
  }

  return `
    <div class="task-item ${doneClass}" data-id="${task.id}" draggable="true">
      <div class="drag-handle">
        <span></span><span></span><span></span>
      </div>
      <button class="check-btn ${checkedClass}"
              data-action="toggle"
              data-id="${task.id}"
              title="${task.done ? 'Mark active' : 'Mark done'}">
        ${checkMark}
      </button>
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="priority-badge ${priorityClass}">${priorityLabel}</span>
          ${dueHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn"
                data-action="edit"
                data-id="${task.id}"
                title="Edit task">✎</button>
        <button class="action-btn delete-btn"
                data-action="delete"
                data-id="${task.id}"
                title="Delete task">✕</button>
      </div>
    </div>
  `;
}

/**
 * Build empty state HTML
 */
function buildEmptyState(filter) {
  const icon = filter === 'completed' ? '✓' : '◎';
  const msg  = filter === 'completed'
    ? 'No completed tasks yet'
    : 'No tasks here. Add one above!';
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-msg">${msg}</div>
    </div>
  `;
}

/**
 * Switch a task title to an editable input in-place
 * @param {string}   taskId
 * @param {Array}    tasks
 * @param {Function} onSave - callback(taskId, newTitle)
 */
function startInlineEdit(taskId, tasks, onSave) {
  const taskEl  = document.querySelector(`[data-id="${taskId}"] .task-title`);
  const task    = tasks.find(t => t.id === taskId);
  if (!taskEl || !task) return;

  const safeVal = task.title.replace(/"/g, '&quot;');
  taskEl.innerHTML = `<input class="edit-input" value="${safeVal}" maxlength="200" />`;

  const input = taskEl.querySelector('input');
  input.focus();
  input.select();

  function commitEdit(e) {
    if (e.type === 'keydown' && e.key === 'Escape') {
      // Cancel — re-render without saving
      renderTasks(tasks, currentFilter, currentQuery);
      return;
    }
    if (e.type === 'keydown' && e.key !== 'Enter') return;
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== task.title) {
      onSave(taskId, newTitle);
    } else {
      renderTasks(tasks, currentFilter, currentQuery);
    }
  }

  input.addEventListener('keydown', commitEdit);
  input.addEventListener('blur',    commitEdit);
}

/**
 * Update statistics display
 * @param {Array} tasks
 */
function updateStats(tasks) {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.done).length;
  const active  = total - done;
  const overdue = tasks.filter(t => !t.done && isOverdue(t.due)).length;
  const pct     = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statActive').textContent  = active;
  document.getElementById('statDone').textContent    = done;
  document.getElementById('statOverdue').textContent = overdue;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progPct').textContent     = pct + '%';
}

/**
 * Attach drag-and-drop events to rendered task items
 * @param {Array} tasks - reference to main tasks array (mutated on drop)
 */
function attachDragEvents(tasks) {
  let dragSourceId = null;

  document.querySelectorAll('.task-item').forEach(el => {
    el.addEventListener('dragstart', e => {
      dragSourceId = e.currentTarget.dataset.id;
      el.classList.add('dragging');
    });

    el.addEventListener('dragend', () => {
      document.querySelectorAll('.task-item')
        .forEach(i => i.classList.remove('dragging', 'drag-over'));
    });

    el.addEventListener('dragover', e => {
      e.preventDefault();
      el.classList.add('drag-over');
    });

    el.addEventListener('dragleave', () => {
      el.classList.remove('drag-over');
    });

    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('drag-over');

      const destId = el.dataset.id;
      if (!dragSourceId || dragSourceId === destId) return;

      // Find positions in the full tasks array
      const srcIndex  = tasks.findIndex(t => t.id === dragSourceId);
      const destIndex = tasks.findIndex(t => t.id === destId);

      // Reorder: remove from source, insert at destination
      const [moved] = tasks.splice(srcIndex, 1);
      tasks.splice(destIndex, 0, moved);

      saveTasks(tasks);
      renderTasks(tasks, currentFilter, currentQuery);
    });
  });
}