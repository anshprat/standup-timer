import { TimerEngine, matchesHost, type TimerSettings } from '@standup-timer/core';
import { ChromeStorageAdapter } from './chrome-storage';
import {
  createTimerUI,
  createSummaryModal,
  updateDisplay,
  updateStartPauseButton,
  toggleMinimize,
  showSummary,
  makeDraggable,
  makeResizable,
} from './ui';

// Global state
let timerContainer: HTMLDivElement | null = null;
let summaryModal: HTMLDivElement | null = null;
let engine: TimerEngine | null = null;

/**
 * Initialize the timer
 */
async function initTimer(): Promise<void> {
  const storage = new ChromeStorageAdapter();

  // Create and initialize engine
  engine = new TimerEngine({ storage });
  await engine.initialize();

  const settings = engine.getSettings();

  // Check if current page matches configured host
  if (!matchesHost(window.location.href, settings.hostUrl)) {
    return;
  }

  // Create timer UI if enabled
  if (settings.showTimer && settings.participants.length > 0) {
    createUI();
    engine.start();

    // Check if timer was previously hidden
    const hiddenResult = await chrome.storage.sync.get(['timerHidden']);
    if (hiddenResult.timerHidden === true) {
      if (timerContainer) {
        timerContainer.style.visibility = 'hidden';
      }
    } else {
      if (timerContainer) {
        timerContainer.style.visibility = 'visible';
      }
      chrome.storage.sync.set({ timerHidden: false });
    }
  }
}

/**
 * Create the UI elements and attach event listeners
 */
function createUI(): void {
  if (!engine) return;

  // Remove existing UI
  if (timerContainer) {
    timerContainer.remove();
  }
  if (summaryModal) {
    summaryModal.remove();
  }

  // Create timer container
  timerContainer = createTimerUI(engine);
  document.body.appendChild(timerContainer);

  // Create summary modal
  summaryModal = createSummaryModal();
  document.body.appendChild(summaryModal);

  // Set up event listeners
  setupEventListeners();

  // Make timer draggable and resizable
  makeDraggable(timerContainer);
  makeResizable(timerContainer, () => engine?.getState().isMinimized ?? false);

  // Subscribe to engine events
  engine.on('tick', () => {
    if (timerContainer) {
      updateDisplay(engine!, timerContainer);
    }
  });

  engine.on('participantChanged', () => {
    if (timerContainer) {
      updateDisplay(engine!, timerContainer);
    }
  });

  engine.on('paused', () => {
    if (timerContainer) {
      updateStartPauseButton(true, timerContainer);
    }
  });

  engine.on('resumed', () => {
    if (timerContainer) {
      updateStartPauseButton(false, timerContainer);
    }
  });

  engine.on('reset', () => {
    if (timerContainer) {
      updateDisplay(engine!, timerContainer);
      updateStartPauseButton(false, timerContainer);
    }
  });

  // Initial display update
  updateDisplay(engine, timerContainer);
  updateStartPauseButton(engine.getState().isPaused, timerContainer);
}

/**
 * Set up UI event listeners
 */
function setupEventListeners(): void {
  if (!timerContainer || !engine) return;

  // Close button
  const closeBtn = timerContainer.querySelector('#standup-timer-close');
  closeBtn?.addEventListener('click', () => {
    if (timerContainer) {
      timerContainer.style.visibility = 'hidden';
      chrome.storage.sync.set({ timerHidden: true });
    }
  });

  // Minimize button
  const minimizeBtn = timerContainer.querySelector('#standup-timer-minimize');
  minimizeBtn?.addEventListener('click', () => {
    if (timerContainer && engine) {
      toggleMinimize(engine, timerContainer);
    }
  });

  // Back button
  const backBtn = timerContainer.querySelector('#standup-timer-back');
  backBtn?.addEventListener('click', () => {
    engine?.previousParticipant();
  });

  // Next button
  const nextBtn = timerContainer.querySelector('#standup-timer-next');
  nextBtn?.addEventListener('click', () => {
    engine?.nextParticipant();
  });

  // Start/Pause button
  const startPauseBtn = timerContainer.querySelector('#standup-timer-start-pause');
  startPauseBtn?.addEventListener('click', () => {
    engine?.togglePause();
  });

  // Reset user button
  const resetUserBtn = timerContainer.querySelector('#standup-timer-reset-user');
  resetUserBtn?.addEventListener('click', () => {
    engine?.resetCurrentParticipant();
  });

  // Reset standup button
  const resetStandupBtn = timerContainer.querySelector('#standup-timer-reset-standup');
  resetStandupBtn?.addEventListener('click', () => {
    engine?.resetAll();
  });

  // Summary button
  const summaryBtn = timerContainer.querySelector('#standup-timer-summary');
  summaryBtn?.addEventListener('click', () => {
    if (engine) {
      showSummary(engine);
    }
  });

  // Summary close button
  const summaryCloseBtn = document.querySelector('#standup-timer-summary-close');
  summaryCloseBtn?.addEventListener('click', () => {
    const modal = document.getElementById('standup-timer-summary-modal');
    if (modal) modal.style.display = 'none';
  });

  // Close summary when clicking outside
  summaryModal?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'standup-timer-summary-modal') {
      const modal = document.getElementById('standup-timer-summary-modal');
      if (modal) modal.style.display = 'none';
    }
  });
}

/**
 * Handle messages from popup
 */
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.action === 'updateSettings') {
    handleSettingsUpdate(message.settings);
  } else if (message.action === 'showTimer') {
    handleShowTimer();
  }
});

/**
 * Handle settings update from popup
 */
async function handleSettingsUpdate(newSettings: Partial<TimerSettings>): Promise<void> {
  if (!engine) {
    engine = new TimerEngine({ storage: new ChromeStorageAdapter() });
    await engine.initialize();
  }

  await engine.updateSettings(newSettings);
  const settings = engine.getSettings();

  // Check if current page matches configured host
  if (!matchesHost(window.location.href, settings.hostUrl)) {
    // Remove timer if it exists and page doesn't match
    if (timerContainer) {
      timerContainer.remove();
      timerContainer = null;
    }
    if (summaryModal) {
      summaryModal.remove();
      summaryModal = null;
    }
    engine.stop();
    return;
  }

  engine.stop();

  if (settings.showTimer && settings.participants.length > 0) {
    createUI();
    engine.start();
  } else if (timerContainer) {
    timerContainer.remove();
    timerContainer = null;
    if (summaryModal) {
      summaryModal.remove();
      summaryModal = null;
    }
  }
}

/**
 * Handle show timer message from popup
 */
async function handleShowTimer(): Promise<void> {
  if (!engine) {
    engine = new TimerEngine({ storage: new ChromeStorageAdapter() });
    await engine.initialize();
  }

  const settings = engine.getSettings();

  // Check if current page matches configured host
  if (!matchesHost(window.location.href, settings.hostUrl)) {
    return;
  }

  if (timerContainer) {
    timerContainer.style.visibility = 'visible';
    chrome.storage.sync.set({ timerHidden: false });
  } else if (settings.showTimer && settings.participants.length > 0) {
    createUI();
    engine.start();
    chrome.storage.sync.set({ timerHidden: false });
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTimer);
} else {
  initTimer();
}
