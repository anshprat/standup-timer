import type { DisplayTime, ParticipantSummary, TimerState, TimerSettings } from '@standup-timer/core';

/**
 * Timer event data from main process
 */
export interface TimerEventData {
  state: TimerState;
  settings: TimerSettings;
  displayTime: DisplayTime;
  totalTime: string;
  currentParticipantTime: string;
  summary: ParticipantSummary[];
}

/**
 * Update the timer display
 */
export function updateDisplay(data: TimerEventData): void {
  const { state, settings, displayTime, totalTime, currentParticipantTime } = data;

  if (settings.participants.length === 0) return;

  const participantName = settings.participants[state.currentParticipantIndex] || '-';

  // Update participant name
  const nameEl = document.getElementById('timer-name');
  if (nameEl) nameEl.textContent = participantName;

  // Update participant info
  const infoEl = document.getElementById('timer-info');
  if (infoEl) {
    infoEl.textContent = `Participant ${state.currentParticipantIndex + 1} of ${settings.participants.length}`;
  }

  // Update time display
  const timeEl = document.getElementById('timer-time');
  if (timeEl) {
    timeEl.textContent = displayTime.time;
    if (displayTime.isWarning) {
      timeEl.classList.add('warning');
    } else {
      timeEl.classList.remove('warning');
    }
  }

  // Update progress bar
  const progressEl = document.getElementById('timer-progress') as HTMLElement;
  if (progressEl) {
    progressEl.style.width = `${displayTime.progress}%`;
  }

  // Update total time
  const totalEl = document.getElementById('timer-total');
  if (totalEl) {
    totalEl.textContent = totalTime;
  }

  // Update current participant time info
  const timeInfoEl = document.getElementById('timer-time-info');
  if (timeInfoEl) {
    timeInfoEl.textContent = currentParticipantTime;
  }

  // Update minimized display
  if (state.isMinimized) {
    updateMinimizedDisplay(participantName, displayTime.time, totalTime);
  }

  // Update pause button
  updatePauseButton(state.isPaused);

  // Handle minimized state
  handleMinimizedState(state.isMinimized);
}

/**
 * Update the minimized display
 */
function updateMinimizedDisplay(name: string, time: string, total: string): void {
  const minNameEl = document.getElementById('timer-min-name');
  if (minNameEl) minNameEl.textContent = name;

  const minTimeEl = document.getElementById('timer-min-time');
  if (minTimeEl) minTimeEl.textContent = time;

  const minTotalEl = document.getElementById('timer-min-total');
  if (minTotalEl) minTotalEl.textContent = `Total: ${total}`;
}

/**
 * Update the pause button state
 */
export function updatePauseButton(isPaused: boolean): void {
  const btn = document.getElementById('timer-pause');
  if (btn) {
    btn.textContent = isPaused ? '▶' : '⏸';
    btn.setAttribute('title', isPaused ? 'Start' : 'Pause');
  }
}

/**
 * Handle minimized state
 */
function handleMinimizedState(isMinimized: boolean): void {
  const content = document.getElementById('timer-content');
  const minimizedInfo = document.getElementById('timer-minimized-info');
  const minimizeBtn = document.getElementById('timer-minimize');
  const container = document.getElementById('timer-container');

  if (isMinimized) {
    if (content) content.style.display = 'none';
    if (minimizedInfo) minimizedInfo.style.display = 'inline';
    if (minimizeBtn) {
      minimizeBtn.textContent = '+';
      minimizeBtn.setAttribute('title', 'Maximize');
    }
    if (container) container.classList.add('minimized');
  } else {
    if (content) content.style.display = 'block';
    if (minimizedInfo) minimizedInfo.style.display = 'none';
    if (minimizeBtn) {
      minimizeBtn.textContent = '−';
      minimizeBtn.setAttribute('title', 'Minimize');
    }
    if (container) container.classList.remove('minimized');
  }
}

/**
 * Show summary modal
 */
export function showSummary(summary: ParticipantSummary[]): void {
  const summaryBody = document.getElementById('summary-body');
  if (!summaryBody) return;

  let summaryHTML = '<div class="summary-list">';

  for (const item of summary) {
    summaryHTML += `
      <div class="summary-item ${item.isCurrent ? 'current' : ''} ${item.isOver ? 'over' : ''}">
        <span class="summary-name">${item.name}${item.isCurrent ? ' <span class="summary-badge">Current</span>' : ''}</span>
        <span class="summary-time">${item.timeTakenDisplay} / ${item.totalAllocationDisplay}</span>
        <span class="summary-progress"><span class="summary-progress-bar" style="width: ${Math.min(100, item.percentage)}%"></span></span>
        <span class="summary-percentage">${item.percentage}%</span>
      </div>
    `;
  }

  summaryHTML += '</div>';
  summaryBody.innerHTML = summaryHTML;

  const modal = document.getElementById('summary-modal');
  if (modal) modal.style.display = 'flex';
}

/**
 * Hide summary modal
 */
export function hideSummary(): void {
  const modal = document.getElementById('summary-modal');
  if (modal) modal.style.display = 'none';
}

/**
 * Show settings panel
 */
export function showSettings(settings: TimerSettings): void {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;

  const participantsTextarea = document.getElementById('settings-participants') as HTMLTextAreaElement;
  const totalTimeInput = document.getElementById('settings-totalTime') as HTMLInputElement;
  const timerModeSelect = document.getElementById('settings-timerMode') as HTMLSelectElement;

  if (participantsTextarea) {
    participantsTextarea.value = settings.participants.join('\n');
  }
  if (totalTimeInput) {
    totalTimeInput.value = String(settings.totalTime);
  }
  if (timerModeSelect) {
    timerModeSelect.value = settings.timerMode;
  }

  panel.style.display = 'block';
}

/**
 * Hide settings panel
 */
export function hideSettings(): void {
  const panel = document.getElementById('settings-panel');
  if (panel) panel.style.display = 'none';
}

/**
 * Get settings from form
 */
export function getSettingsFromForm(): Partial<TimerSettings> | null {
  const participantsTextarea = document.getElementById('settings-participants') as HTMLTextAreaElement;
  const totalTimeInput = document.getElementById('settings-totalTime') as HTMLInputElement;
  const timerModeSelect = document.getElementById('settings-timerMode') as HTMLSelectElement;

  const participantsText = participantsTextarea?.value.trim() || '';
  const participants = participantsText
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (participants.length === 0) {
    alert('Please add at least one participant');
    return null;
  }

  const totalTime = parseInt(totalTimeInput?.value || '15');
  if (isNaN(totalTime) || totalTime < 1) {
    alert('Total time must be at least 1 minute');
    return null;
  }

  return {
    participants,
    totalTime,
    timerMode: (timerModeSelect?.value as 'countdown' | 'countup') || 'countdown',
    showTimer: true,
  };
}

/**
 * Make window draggable by header
 */
export function setupDragging(): void {
  const header = document.getElementById('timer-header');
  if (!header) return;

  header.style.webkitAppRegion = 'drag';

  // Make buttons non-draggable
  const buttons = header.querySelectorAll('button');
  buttons.forEach((btn) => {
    (btn as HTMLElement).style.webkitAppRegion = 'no-drag';
  });
}
