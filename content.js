// Standup Timer Content Script
let timerContainer = null;
let currentParticipantIndex = 0;
let timerInterval = null;
let startTime = null;
let elapsedTime = 0;
let totalElapsedTime = 0; // Total time across all participants
let totalStartTime = null; // Start time for total timer
let isMinimized = false;
let isPaused = false;
let pausedElapsedTime = 0; // Elapsed time when paused
let pausedTotalElapsedTime = 0; // Total elapsed time when paused
let participantTimeTracker = {}; // Track total time per participant
let participantCurrentStartTime = {}; // Track when current turn started for each participant
let settings = {
  participants: [],
  totalTime: 15,
  timerMode: 'countdown',
  hostUrl: 'linear.app',
  showTimer: true
};

// Check if current page matches configured host
function matchesConfiguredHost(hostUrl) {
  try {
    const currentUrl = new URL(window.location.href);
    const currentHost = currentUrl.hostname.replace('www.', '');
    const configuredHost = hostUrl.replace('www.', '').replace(/^https?:\/\//, '').split('/')[0];
    
    return currentHost.includes(configuredHost) || configuredHost.includes(currentHost);
  } catch (e) {
    return false;
  }
}

// Initialize timer
async function initTimer() {
  // Load settings
  const result = await chrome.storage.sync.get([
    'participants',
    'totalTime',
    'timerMode',
    'hostUrl',
    'showTimer'
  ]);

  if (result.participants) settings.participants = result.participants;
  if (result.totalTime) settings.totalTime = result.totalTime;
  if (result.timerMode) settings.timerMode = result.timerMode;
  if (result.hostUrl) settings.hostUrl = result.hostUrl;
  if (result.showTimer !== undefined) settings.showTimer = result.showTimer;

  // Check if current page matches configured host
  if (!matchesConfiguredHost(settings.hostUrl)) {
    return; // Don't show timer on this page
  }

  // Create timer UI if enabled
  if (settings.showTimer && settings.participants.length > 0) {
    createTimerUI();
    startTimer();
    
    // Check if timer was previously hidden (only hide if explicitly set to true)
    const hiddenResult = await chrome.storage.sync.get(['timerHidden']);
    if (hiddenResult.timerHidden === true) {
      if (timerContainer) {
        timerContainer.style.visibility = 'hidden';
      }
    } else {
      // Ensure timer is visible by default
      if (timerContainer) {
        timerContainer.style.visibility = 'visible';
      }
      // Clear any stale hidden state
      chrome.storage.sync.set({ timerHidden: false });
    }
  }
}

function createTimerUI() {
  // Remove existing timer if present
  if (timerContainer) {
    timerContainer.remove();
  }

  // Create timer container
  timerContainer = document.createElement('div');
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
  document.body.appendChild(timerContainer);

  // Create summary modal
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
  document.body.appendChild(summaryModal);

  // Event listeners
  document.getElementById('standup-timer-close').addEventListener('click', () => {
    timerContainer.style.visibility = 'hidden';
    // Store state in storage so popup can check if timer is hidden
    chrome.storage.sync.set({ timerHidden: true });
  });

  document.getElementById('standup-timer-minimize').addEventListener('click', () => {
    toggleMinimize();
  });

  document.getElementById('standup-timer-back').addEventListener('click', () => {
    previousParticipant();
  });

  document.getElementById('standup-timer-next').addEventListener('click', () => {
    nextParticipant();
  });

  document.getElementById('standup-timer-start-pause').addEventListener('click', () => {
    togglePause();
  });

  document.getElementById('standup-timer-reset-user').addEventListener('click', () => {
    resetCurrentParticipant();
  });

  document.getElementById('standup-timer-reset-standup').addEventListener('click', () => {
    resetAll();
  });

  document.getElementById('standup-timer-summary').addEventListener('click', () => {
    showSummary();
  });

  document.getElementById('standup-timer-summary-close').addEventListener('click', () => {
    document.getElementById('standup-timer-summary-modal').style.display = 'none';
  });

  // Close summary when clicking outside
  document.getElementById('standup-timer-summary-modal').addEventListener('click', (e) => {
    if (e.target.id === 'standup-timer-summary-modal') {
      document.getElementById('standup-timer-summary-modal').style.display = 'none';
    }
  });

  // Make timer draggable
  makeDraggable(timerContainer);
  
  // Make timer resizable
  makeResizable(timerContainer);
}

function makeDraggable(element) {
  const header = element.querySelector('.standup-timer-header');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    if (e.target.classList.contains('standup-timer-close') || 
        e.target.classList.contains('standup-timer-minimize') ||
        e.target.closest('.standup-timer-header-actions')) return;
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === header || header.contains(e.target)) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, element);
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }
}

function makeResizable(element) {
  const resizeHandle = element.querySelector('#standup-timer-resize-handle');
  let isResizing = false;
  let startX, startY, startWidth, startHeight;

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
    
    // Minimum size constraints
    const minWidth = 200;
    const minHeight = isMinimized ? 40 : 300;
    
    element.style.width = Math.max(minWidth, width) + 'px';
    element.style.height = Math.max(minHeight, height) + 'px';
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}

function toggleMinimize() {
  isMinimized = !isMinimized;
  const content = document.getElementById('standup-timer-content');
  const headerContent = document.getElementById('standup-timer-header-content');
  const title = headerContent.querySelector('.standup-timer-title');
  const minimizedInfo = document.getElementById('standup-timer-minimized-info');
  const minimizeBtn = document.getElementById('standup-timer-minimize');
  const resizeHandle = document.getElementById('standup-timer-resize-handle');
  
  if (isMinimized) {
    content.style.display = 'none';
    title.style.display = 'none';
    minimizedInfo.style.display = 'inline';
    minimizeBtn.textContent = '+';
    minimizeBtn.title = 'Maximize';
    timerContainer.classList.add('minimized');
    if (resizeHandle) resizeHandle.style.display = 'none';
    updateMinimizedDisplay();
  } else {
    content.style.display = 'block';
    title.style.display = 'inline';
    minimizedInfo.style.display = 'none';
    minimizeBtn.textContent = '−';
    minimizeBtn.title = 'Minimize';
    timerContainer.classList.remove('minimized');
    if (resizeHandle) resizeHandle.style.display = 'block';
  }
}

function startTimer() {
  if (settings.participants.length === 0) return;

  currentParticipantIndex = 0;
  elapsedTime = 0;
  totalElapsedTime = 0;
  startTime = Date.now();
  totalStartTime = Date.now();
  isPaused = false;
  pausedElapsedTime = 0;
  pausedTotalElapsedTime = 0;
  
  // Initialize participant time tracking
  participantTimeTracker = {};
  participantCurrentStartTime = {};
  settings.participants.forEach(participant => {
    if (!participantTimeTracker.hasOwnProperty(participant)) {
      participantTimeTracker[participant] = 0;
    }
  });
  const firstParticipant = settings.participants[currentParticipantIndex];
  if (firstParticipant) {
    participantCurrentStartTime[firstParticipant] = Date.now();
  }
  
  updateDisplay();
  updateStartPauseButton();
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    if (!isPaused) {
      elapsedTime = Math.floor((Date.now() - startTime) / 1000) + pausedElapsedTime;
      totalElapsedTime = Math.floor((Date.now() - totalStartTime) / 1000) + pausedTotalElapsedTime;
      updateDisplay();
      
      if (settings.timerMode === 'countdown') {
        const timePerParticipant = Math.floor((settings.totalTime * 60) / settings.participants.length);
        const remaining = timePerParticipant - elapsedTime;
        
        if (remaining <= 0) {
          // Auto-advance to next participant when time is up
          nextParticipant();
        }
      }
    }
  }, 100);
}

let pauseStartTime = null;
let totalPauseStartTime = null;

function togglePause() {
  if (isPaused) {
    // Resume
    isPaused = false;
    
    // Calculate pause duration and adjust start times
    if (pauseStartTime) {
      const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
      startTime = Date.now() - pausedElapsedTime * 1000;
      pauseStartTime = null;
      // Reset paused elapsed time since startTime is now adjusted
      pausedElapsedTime = 0;
    }
    
    if (totalPauseStartTime) {
      const totalPauseDuration = Math.floor((Date.now() - totalPauseStartTime) / 1000);
      totalStartTime = Date.now() - pausedTotalElapsedTime * 1000;
      totalPauseStartTime = null;
      // Reset paused total elapsed time since totalStartTime is now adjusted
      pausedTotalElapsedTime = 0;
    }
    
    // Resume participant time tracking
    const currentParticipant = settings.participants[currentParticipantIndex];
    if (currentParticipant) {
      participantCurrentStartTime[currentParticipant] = Date.now();
    }
  } else {
    // Pause
    isPaused = true;
    pausedElapsedTime = elapsedTime;
    pausedTotalElapsedTime = totalElapsedTime;
    pauseStartTime = Date.now();
    totalPauseStartTime = Date.now();
    
    // Save current participant's time (this also clears the start time to prevent further accumulation)
    saveCurrentParticipantTime();
  }
  
  updateStartPauseButton();
}

function updateStartPauseButton() {
  const startPauseBtn = document.getElementById('standup-timer-start-pause');
  if (startPauseBtn) {
    if (isPaused) {
      startPauseBtn.textContent = '▶';
      startPauseBtn.title = 'Start';
    } else {
      startPauseBtn.textContent = '⏸';
      startPauseBtn.title = 'Pause';
    }
  }
}

function saveCurrentParticipantTime() {
  const currentParticipant = settings.participants[currentParticipantIndex];
  if (currentParticipant && participantCurrentStartTime[currentParticipant]) {
    const timeSpent = Math.floor((Date.now() - participantCurrentStartTime[currentParticipant]) / 1000);
    participantTimeTracker[currentParticipant] = (participantTimeTracker[currentParticipant] || 0) + timeSpent;
    // Clear start time after saving to prevent double-counting
    participantCurrentStartTime[currentParticipant] = null;
  }
}

function previousParticipant() {
  if (settings.participants.length === 0) return;

  // Save current participant's time before switching
  saveCurrentParticipantTime();

  // Go back to previous participant (with wraparound)
  currentParticipantIndex = (currentParticipantIndex - 1 + settings.participants.length) % settings.participants.length;
  elapsedTime = 0;
  pausedElapsedTime = 0;
  startTime = Date.now();
  // Preserve pause state - don't force it to false

  // Start tracking time for the new participant only if not paused
  const newParticipant = settings.participants[currentParticipantIndex];
  if (!isPaused) {
    participantCurrentStartTime[newParticipant] = Date.now();
  }

  updateDisplay();
  updateStartPauseButton();
}

function nextParticipant() {
  if (settings.participants.length === 0) return;

  // Save current participant's time before switching
  saveCurrentParticipantTime();

  currentParticipantIndex = (currentParticipantIndex + 1) % settings.participants.length;
  elapsedTime = 0;
  pausedElapsedTime = 0;
  startTime = Date.now();
  // Preserve pause state - don't force it to false

  // Start tracking time for the new participant only if not paused
  const newParticipant = settings.participants[currentParticipantIndex];
  if (!isPaused) {
    participantCurrentStartTime[newParticipant] = Date.now();
  }

  updateDisplay();
  updateStartPauseButton();
}

function resetCurrentParticipant() {
  elapsedTime = 0;
  pausedElapsedTime = 0;
  startTime = Date.now();
  isPaused = false;
  
  // Reset participant time tracking for current participant
  const currentParticipant = settings.participants[currentParticipantIndex];
  if (currentParticipant) {
    participantTimeTracker[currentParticipant] = 0;
    participantCurrentStartTime[currentParticipant] = Date.now();
  }
  
  updateDisplay();
  updateStartPauseButton();
}

function resetAll() {
  currentParticipantIndex = 0;
  elapsedTime = 0;
  totalElapsedTime = 0;
  pausedElapsedTime = 0;
  pausedTotalElapsedTime = 0;
  startTime = Date.now();
  totalStartTime = Date.now();
  isPaused = false;
  
  // Reset all participant time tracking
  participantTimeTracker = {};
  participantCurrentStartTime = {};
  settings.participants.forEach(participant => {
    participantTimeTracker[participant] = 0;
  });
  const firstParticipant = settings.participants[currentParticipantIndex];
  if (firstParticipant) {
    participantCurrentStartTime[firstParticipant] = Date.now();
  }
  
  updateDisplay();
  updateStartPauseButton();
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateDisplay() {
  if (!timerContainer || settings.participants.length === 0) return;

  const participantName = settings.participants[currentParticipantIndex] || '-';
  document.getElementById('standup-timer-name').textContent = participantName;
  document.getElementById('standup-timer-info').textContent = 
    `Participant ${currentParticipantIndex + 1} of ${settings.participants.length}`;

  const timePerParticipant = Math.floor((settings.totalTime * 60) / settings.participants.length);
  let displayTime;
  let progress = 0;

  if (settings.timerMode === 'countdown') {
    const remaining = Math.max(0, timePerParticipant - elapsedTime);
    displayTime = formatTime(Math.floor(remaining));
    progress = Math.min(100, (elapsedTime / timePerParticipant) * 100);
  } else {
    displayTime = formatTime(elapsedTime);
    progress = Math.min(100, (elapsedTime / timePerParticipant) * 100);
  }

  document.getElementById('standup-timer-time').textContent = displayTime;
  document.getElementById('standup-timer-progress').style.width = `${progress}%`;

  // Update total time - calculate as sum of all participant times
  let totalTime = 0;
  settings.participants.forEach((participant, index) => {
    let participantTime = participantTimeTracker[participant] || 0;
    // Add current turn time if this is the current participant and not paused
    if (index === currentParticipantIndex && participantCurrentStartTime[participant] && !isPaused) {
      const currentTurnTime = Math.floor((Date.now() - participantCurrentStartTime[participant]) / 1000);
      participantTime = participantTime + currentTurnTime;
    }
    totalTime += participantTime;
  });
  const totalDisplay = formatTime(Math.floor(totalTime));
  document.getElementById('standup-timer-total').textContent = totalDisplay;

  // Update participant time info: "Time taken / Total allocation"
  const currentParticipant = settings.participants[currentParticipantIndex];
  let totalTimeTaken = participantTimeTracker[currentParticipant] || 0;
  
  // Add current turn time if participant is currently active (for display only)
  // Don't add time if paused - it's already been saved when pause was triggered
  if (currentParticipant && participantCurrentStartTime[currentParticipant] && !isPaused) {
    const currentTurnTime = Math.floor((Date.now() - participantCurrentStartTime[currentParticipant]) / 1000);
    totalTimeTaken = totalTimeTaken + currentTurnTime;
  }
  
  const timeTakenDisplay = formatTime(Math.floor(totalTimeTaken));
  const totalAllocationDisplay = formatTime(timePerParticipant);
  const timeInfoElement = document.getElementById('standup-timer-time-info');
  if (timeInfoElement) {
    timeInfoElement.textContent = `${timeTakenDisplay} / ${totalAllocationDisplay}`;
  }

  // Update minimized view
  if (isMinimized) {
    updateMinimizedDisplay();
  }

  // Change color when time is running out (for countdown)
  if (settings.timerMode === 'countdown') {
    const remaining = timePerParticipant - elapsedTime;
    const timeElement = document.getElementById('standup-timer-time');
    if (remaining <= 30) {
      timeElement.classList.add('warning');
    } else {
      timeElement.classList.remove('warning');
    }
  }
}

function updateMinimizedDisplay() {
  if (!timerContainer || !isMinimized) return;

  const participantName = settings.participants[currentParticipantIndex] || '-';
  document.getElementById('standup-timer-min-name').textContent = participantName;

  const timePerParticipant = Math.floor((settings.totalTime * 60) / settings.participants.length);
  let displayTime;

  if (settings.timerMode === 'countdown') {
    const remaining = Math.max(0, timePerParticipant - elapsedTime);
    displayTime = formatTime(Math.floor(remaining));
  } else {
    displayTime = formatTime(elapsedTime);
  }

  document.getElementById('standup-timer-min-time').textContent = displayTime;

  // Calculate total time as sum of all participant times
  let totalTime = 0;
  settings.participants.forEach((participant, index) => {
    let participantTime = participantTimeTracker[participant] || 0;
    if (index === currentParticipantIndex && participantCurrentStartTime[participant] && !isPaused) {
      const currentTurnTime = Math.floor((Date.now() - participantCurrentStartTime[participant]) / 1000);
      participantTime = participantTime + currentTurnTime;
    }
    totalTime += participantTime;
  });
  const totalDisplay = formatTime(Math.floor(totalTime));
  document.getElementById('standup-timer-min-total').textContent = `Total: ${totalDisplay}`;
}

function showSummary() {
  // Don't save time here - just display current state
  // Time is saved when pausing, switching participants, or resetting
  const summaryBody = document.getElementById('standup-timer-summary-body');
  const timePerParticipant = Math.floor((settings.totalTime * 60) / settings.participants.length);
  
  let summaryHTML = '<div class="standup-timer-summary-list">';
  
  settings.participants.forEach((participant, index) => {
    let totalTimeTaken = participantTimeTracker[participant] || 0;
    
    // Add current turn time if this is the current participant
    // Don't add time if paused - it's already been saved when pause was triggered
    if (index === currentParticipantIndex && participantCurrentStartTime[participant] && !isPaused) {
      const currentTurnTime = Math.floor((Date.now() - participantCurrentStartTime[participant]) / 1000);
      totalTimeTaken = totalTimeTaken + currentTurnTime;
    }
    
    const timeTakenDisplay = formatTime(Math.floor(totalTimeTaken));
    const totalAllocationDisplay = formatTime(timePerParticipant);
    const percentage = timePerParticipant > 0 ? Math.round((totalTimeTaken / timePerParticipant) * 100) : 0;
    const isOver = totalTimeTaken > timePerParticipant;
    const isCurrent = index === currentParticipantIndex;
    
    summaryHTML += `
      <div class="standup-timer-summary-item ${isCurrent ? 'current' : ''} ${isOver ? 'over' : ''}">
        <span class="standup-timer-summary-name">${participant}${isCurrent ? ' <span class="standup-timer-summary-badge">Current</span>' : ''}</span>
        <span class="standup-timer-summary-time">${timeTakenDisplay} / ${totalAllocationDisplay}</span>
        <span class="standup-timer-summary-progress"><span class="standup-timer-summary-progress-bar" style="width: ${Math.min(100, percentage)}%"></span></span>
        <span class="standup-timer-summary-percentage">${percentage}%</span>
      </div>
    `;
  });
  
  summaryHTML += '</div>';
  summaryBody.innerHTML = summaryHTML;
  document.getElementById('standup-timer-summary-modal').style.display = 'flex';
}

// Listen for settings updates from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateSettings') {
    settings = { ...settings, ...message.settings };
    
    // Check if current page matches configured host
    if (!matchesConfiguredHost(settings.hostUrl)) {
      // Remove timer if it exists and page doesn't match
      if (timerContainer) {
        timerContainer.remove();
        timerContainer = null;
      }
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      return;
    }
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (settings.showTimer && settings.participants.length > 0) {
      if (!timerContainer) {
        createTimerUI();
      }
      startTimer();
    } else if (timerContainer) {
      timerContainer.remove();
      timerContainer = null;
    }
  } else if (message.action === 'showTimer') {
    // Check if current page matches configured host
    if (!matchesConfiguredHost(settings.hostUrl)) {
      return;
    }
    
    // Show the timer if it exists
    if (timerContainer) {
      timerContainer.style.visibility = 'visible';
      chrome.storage.sync.set({ timerHidden: false });
    } else if (settings.showTimer && settings.participants.length > 0) {
      // Create timer if it doesn't exist
      createTimerUI();
      startTimer();
      chrome.storage.sync.set({ timerHidden: false });
    }
  }
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTimer);
} else {
  initTimer();
}

