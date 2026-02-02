import type { TimerEngine, TimerSettings } from '@standup-timer/core';

/**
 * Create the timer UI container and elements
 */
export function createTimerUI(engine: TimerEngine): HTMLDivElement {
  const settings = engine.getSettings();

  const timerContainer = document.createElement('div');
  timerContainer.id = 'standup-timer-container';

  const timerHTML = `
    <div class="standup-timer-header">
      <div class="standup-timer-header-content" id="standup-timer-header-content">
        <span class="standup-timer-title">Standup Timer</span>
        <span class="standup-timer-minimized-info" id="standup-timer-minimized-info" style="display: none;">
          <span id="standup-timer-min-name">-</span> |
          <span id="standup-timer-min-time">00:00</span> |
          <span id="standup-timer-min-total">Total: 00:00</span>
        </span>
      </div>
      <div class="standup-timer-header-actions">
        <button class="standup-timer-minimize" id="standup-timer-minimize" title="Minimize">−</button>
        <button class="standup-timer-close" id="standup-timer-close" title="Close">×</button>
      </div>
    </div>
    <div class="standup-timer-content" id="standup-timer-content">
      <div class="standup-timer-total-time">
        <span class="standup-timer-label">Total Time:</span>
        <span class="standup-timer-total" id="standup-timer-total">00:00</span>
      </div>
      <div class="standup-timer-participant">
        <span class="standup-timer-label">Current:</span>
        <span class="standup-timer-name" id="standup-timer-name">-</span>
        <span class="standup-timer-time-info" id="standup-timer-time-info"></span>
      </div>
      <div class="standup-timer-time" id="standup-timer-time">00:00</div>
      <div class="standup-timer-progress">
        <div class="standup-timer-progress-bar" id="standup-timer-progress"></div>
      </div>
      <div class="standup-timer-controls">
        <button class="standup-timer-btn" id="standup-timer-back">Back</button>
        <button class="standup-timer-btn" id="standup-timer-next">Next</button>
      </div>
      <div class="standup-timer-controls-icon">
        <button class="standup-timer-icon-btn" id="standup-timer-start-pause" title="Start/Pause">▶</button>
        <button class="standup-timer-icon-btn" id="standup-timer-reset-user" title="Reset Current User">↻</button>
        <button class="standup-timer-icon-btn" id="standup-timer-reset-standup" title="Reset Standup">⟲</button>
      </div>
      <div class="standup-timer-controls">
        <button class="standup-timer-btn standup-timer-btn-secondary" id="standup-timer-summary">Summary</button>
      </div>
      <div class="standup-timer-info">
        <span id="standup-timer-info">Participant 1 of ${settings.participants.length}</span>
      </div>
    </div>
    <div class="standup-timer-resize-handle" id="standup-timer-resize-handle"></div>
  `;

  timerContainer.innerHTML = timerHTML;
  timerContainer.style.visibility = 'visible';

  return timerContainer;
}

/**
 * Create the summary modal element
 */
export function createSummaryModal(): HTMLDivElement {
  const summaryModal = document.createElement('div');
  summaryModal.id = 'standup-timer-summary-modal';
  summaryModal.className = 'standup-timer-summary-modal';
  summaryModal.style.display = 'none';
  summaryModal.innerHTML = `
    <div class="standup-timer-summary-content">
      <div class="standup-timer-summary-header">
        <h3>Standup Report Card</h3>
        <button class="standup-timer-summary-close" id="standup-timer-summary-close">×</button>
      </div>
      <div class="standup-timer-summary-body" id="standup-timer-summary-body">
        <!-- Summary content will be generated here -->
      </div>
    </div>
  `;

  return summaryModal;
}

/**
 * Update the timer display
 */
export function updateDisplay(engine: TimerEngine, container: HTMLElement): void {
  const state = engine.getState();
  const settings = engine.getSettings();

  if (settings.participants.length === 0) return;

  const participantName = engine.getCurrentParticipant() || '-';
  const nameEl = container.querySelector('#standup-timer-name');
  if (nameEl) nameEl.textContent = participantName;

  const infoEl = container.querySelector('#standup-timer-info');
  if (infoEl) {
    infoEl.textContent = `Participant ${state.currentParticipantIndex + 1} of ${settings.participants.length}`;
  }

  const displayTime = engine.getDisplayTime();

  const timeEl = container.querySelector('#standup-timer-time');
  if (timeEl) {
    timeEl.textContent = displayTime.time;
    if (displayTime.isWarning) {
      timeEl.classList.add('warning');
    } else {
      timeEl.classList.remove('warning');
    }
  }

  const progressEl = container.querySelector('#standup-timer-progress') as HTMLElement;
  if (progressEl) {
    progressEl.style.width = `${displayTime.progress}%`;
  }

  const totalEl = container.querySelector('#standup-timer-total');
  if (totalEl) {
    totalEl.textContent = engine.getTotalTimeDisplay();
  }

  const timeInfoEl = container.querySelector('#standup-timer-time-info');
  if (timeInfoEl) {
    timeInfoEl.textContent = engine.getCurrentParticipantTimeDisplay();
  }

  // Update minimized display if minimized
  if (state.isMinimized) {
    updateMinimizedDisplay(engine, container);
  }
}

/**
 * Update the minimized display
 */
export function updateMinimizedDisplay(engine: TimerEngine, container: HTMLElement): void {
  const participantName = engine.getCurrentParticipant() || '-';
  const displayTime = engine.getDisplayTime();

  const minNameEl = container.querySelector('#standup-timer-min-name');
  if (minNameEl) minNameEl.textContent = participantName;

  const minTimeEl = container.querySelector('#standup-timer-min-time');
  if (minTimeEl) minTimeEl.textContent = displayTime.time;

  const minTotalEl = container.querySelector('#standup-timer-min-total');
  if (minTotalEl) minTotalEl.textContent = `Total: ${engine.getTotalTimeDisplay()}`;
}

/**
 * Update the start/pause button display
 */
export function updateStartPauseButton(isPaused: boolean, container: HTMLElement): void {
  const btn = container.querySelector('#standup-timer-start-pause');
  if (btn) {
    btn.textContent = isPaused ? '▶' : '⏸';
    btn.setAttribute('title', isPaused ? 'Start' : 'Pause');
  }
}

/**
 * Toggle minimize state
 */
export function toggleMinimize(engine: TimerEngine, container: HTMLElement): void {
  engine.toggleMinimized();
  const state = engine.getState();
  const isMinimized = state.isMinimized;

  const content = container.querySelector('#standup-timer-content') as HTMLElement;
  const headerContent = container.querySelector('#standup-timer-header-content');
  const title = headerContent?.querySelector('.standup-timer-title') as HTMLElement;
  const minimizedInfo = container.querySelector('#standup-timer-minimized-info') as HTMLElement;
  const minimizeBtn = container.querySelector('#standup-timer-minimize');
  const resizeHandle = container.querySelector('#standup-timer-resize-handle') as HTMLElement;

  if (isMinimized) {
    if (content) content.style.display = 'none';
    if (title) title.style.display = 'none';
    if (minimizedInfo) minimizedInfo.style.display = 'inline';
    if (minimizeBtn) {
      minimizeBtn.textContent = '+';
      minimizeBtn.setAttribute('title', 'Maximize');
    }
    container.classList.add('minimized');
    if (resizeHandle) resizeHandle.style.display = 'none';
    updateMinimizedDisplay(engine, container);
  } else {
    if (content) content.style.display = 'block';
    if (title) title.style.display = 'inline';
    if (minimizedInfo) minimizedInfo.style.display = 'none';
    if (minimizeBtn) {
      minimizeBtn.textContent = '−';
      minimizeBtn.setAttribute('title', 'Minimize');
    }
    container.classList.remove('minimized');
    if (resizeHandle) resizeHandle.style.display = 'block';
  }
}

/**
 * Show summary modal
 */
export function showSummary(engine: TimerEngine): void {
  const summaryBody = document.getElementById('standup-timer-summary-body');
  if (!summaryBody) return;

  const summary = engine.getSummary();

  let summaryHTML = '<div class="standup-timer-summary-list">';

  for (const item of summary) {
    summaryHTML += `
      <div class="standup-timer-summary-item ${item.isCurrent ? 'current' : ''} ${item.isOver ? 'over' : ''}">
        <span class="standup-timer-summary-name">${item.name}${item.isCurrent ? ' <span class="standup-timer-summary-badge">Current</span>' : ''}</span>
        <span class="standup-timer-summary-time">${item.timeTakenDisplay} / ${item.totalAllocationDisplay}</span>
        <span class="standup-timer-summary-progress"><span class="standup-timer-summary-progress-bar" style="width: ${Math.min(100, item.percentage)}%"></span></span>
        <span class="standup-timer-summary-percentage">${item.percentage}%</span>
      </div>
    `;
  }

  summaryHTML += '</div>';
  summaryBody.innerHTML = summaryHTML;

  const modal = document.getElementById('standup-timer-summary-modal');
  if (modal) modal.style.display = 'flex';
}

/**
 * Make an element draggable
 */
export function makeDraggable(element: HTMLElement): void {
  const header = element.querySelector('.standup-timer-header') as HTMLElement;
  if (!header) return;

  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;
  let xOffset = 0;
  let yOffset = 0;

  function dragStart(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      target.classList.contains('standup-timer-close') ||
      target.classList.contains('standup-timer-minimize') ||
      target.closest('.standup-timer-header-actions')
    ) {
      return;
    }

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (target === header || header.contains(target)) {
      isDragging = true;
    }
  }

  function drag(e: MouseEvent) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
}

/**
 * Make an element resizable
 */
export function makeResizable(element: HTMLElement, isMinimized: () => boolean): void {
  const resizeHandle = element.querySelector('#standup-timer-resize-handle') as HTMLElement;
  if (!resizeHandle) return;

  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(window.getComputedStyle(element).width, 10);
    startHeight = parseInt(window.getComputedStyle(element).height, 10);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const width = startWidth + (e.clientX - startX);
    const height = startHeight + (e.clientY - startY);

    const minWidth = 200;
    const minHeight = isMinimized() ? 40 : 300;

    element.style.width = Math.max(minWidth, width) + 'px';
    element.style.height = Math.max(minHeight, height) + 'px';
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}
