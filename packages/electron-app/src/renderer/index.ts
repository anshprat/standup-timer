import {
  updateDisplay,
  showSummary,
  hideSummary,
  showSettings,
  hideSettings,
  getSettingsFromForm,
  setupDragging,
  type TimerEventData,
} from './ui';

// Current data for summary
let currentData: TimerEventData | null = null;

/**
 * Initialize the renderer
 */
async function init(): Promise<void> {
  // Set up dragging
  setupDragging();

  // Set up event listeners
  setupEventListeners();

  // Listen for timer events from main process
  window.electronAPI.onTimerEvent((data) => {
    currentData = data as TimerEventData;
    updateDisplay(currentData);
  });

  // Get initial state
  const state = await window.electronAPI.getState();
  if (state) {
    currentData = state as TimerEventData;
    updateDisplay(currentData);
  }
}

/**
 * Set up UI event listeners
 */
function setupEventListeners(): void {
  // Close button
  const closeBtn = document.getElementById('timer-close');
  closeBtn?.addEventListener('click', () => {
    window.electronAPI.closeWindow();
  });

  // Minimize button
  const minimizeBtn = document.getElementById('timer-minimize');
  minimizeBtn?.addEventListener('click', () => {
    window.electronAPI.sendCommand('toggleMinimized');
  });

  // Back button
  const backBtn = document.getElementById('timer-back');
  backBtn?.addEventListener('click', () => {
    window.electronAPI.sendCommand('previousParticipant');
  });

  // Next button
  const nextBtn = document.getElementById('timer-next');
  nextBtn?.addEventListener('click', () => {
    window.electronAPI.sendCommand('nextParticipant');
  });

  // Pause button
  const pauseBtn = document.getElementById('timer-pause');
  pauseBtn?.addEventListener('click', () => {
    window.electronAPI.sendCommand('togglePause');
  });

  // Reset user button
  const resetUserBtn = document.getElementById('timer-reset-user');
  resetUserBtn?.addEventListener('click', () => {
    window.electronAPI.sendCommand('resetCurrentParticipant');
  });

  // Reset all button
  const resetAllBtn = document.getElementById('timer-reset-all');
  resetAllBtn?.addEventListener('click', () => {
    window.electronAPI.sendCommand('resetAll');
  });

  // Summary button
  const summaryBtn = document.getElementById('timer-summary');
  summaryBtn?.addEventListener('click', () => {
    if (currentData) {
      showSummary(currentData.summary);
    }
  });

  // Summary close button
  const summaryCloseBtn = document.getElementById('summary-close');
  summaryCloseBtn?.addEventListener('click', hideSummary);

  // Close summary when clicking outside
  const summaryModal = document.getElementById('summary-modal');
  summaryModal?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'summary-modal') {
      hideSummary();
    }
  });

  // Settings button
  const settingsBtn = document.getElementById('timer-settings');
  settingsBtn?.addEventListener('click', async () => {
    const settings = await window.electronAPI.getSettings();
    showSettings(settings);
  });

  // Settings save button
  const settingsSaveBtn = document.getElementById('settings-save');
  settingsSaveBtn?.addEventListener('click', async () => {
    const newSettings = getSettingsFromForm();
    if (newSettings) {
      await window.electronAPI.saveSettings(newSettings);
      hideSettings();
    }
  });

  // Settings cancel button
  const settingsCancelBtn = document.getElementById('settings-cancel');
  settingsCancelBtn?.addEventListener('click', hideSettings);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
