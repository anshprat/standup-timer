document.addEventListener('DOMContentLoaded', async () => {
  const participantsTextarea = document.getElementById('participants');
  const totalTimeInput = document.getElementById('totalTime');
  const timerModeSelect = document.getElementById('timerMode');
  const hostUrlInput = document.getElementById('hostUrl');
  const showTimerCheckbox = document.getElementById('showTimer');
  const saveBtn = document.getElementById('saveBtn');
  const showTimerBtn = document.getElementById('showTimerBtn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  const result = await chrome.storage.sync.get([
    'participants',
    'totalTime',
    'timerMode',
    'hostUrl',
    'showTimer'
  ]);

  if (result.participants) {
    participantsTextarea.value = result.participants.join('\n');
  }
  if (result.totalTime) {
    totalTimeInput.value = result.totalTime;
  }
  if (result.timerMode) {
    timerModeSelect.value = result.timerMode;
  }
  if (result.hostUrl) {
    hostUrlInput.value = result.hostUrl;
  } else {
    hostUrlInput.value = 'linear.app'; // Default value
  }
  if (result.showTimer !== undefined) {
    showTimerCheckbox.checked = result.showTimer;
  }

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const participantsText = participantsTextarea.value.trim();
    const participants = participantsText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (participants.length === 0) {
      showStatus('Please add at least one participant', 'error');
      return;
    }

    const totalTime = parseInt(totalTimeInput.value);
    if (isNaN(totalTime) || totalTime < 1) {
      showStatus('Total time must be at least 1 minute', 'error');
      return;
    }

    const hostUrl = hostUrlInput.value.trim();
    if (!hostUrl) {
      showStatus('Please enter a host URL', 'error');
      return;
    }

    const settings = {
      participants,
      totalTime,
      timerMode: timerModeSelect.value,
      hostUrl: hostUrl,
      showTimer: showTimerCheckbox.checked
    };

    await chrome.storage.sync.set(settings);
    
    // Notify content script to update
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', settings });
      } catch (e) {
        // Content script might not be loaded on this page
      }
    }

    showStatus('Settings saved!', 'success');
    
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 2000);
  });

  // Show Timer button
  showTimerBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      showStatus('Unable to access current page', 'error');
      return;
    }

    // Get configured host URL
    const hostResult = await chrome.storage.sync.get(['hostUrl']);
    const hostUrl = hostResult.hostUrl || 'linear.app';
    
    // Check if current URL matches configured host
    try {
      const currentUrl = new URL(tab.url);
      const currentHost = currentUrl.hostname.replace('www.', '');
      const configuredHost = hostUrl.replace('www.', '').replace(/^https?:\/\//, '').split('/')[0];
      
      if (currentHost.includes(configuredHost) || configuredHost.includes(currentHost)) {
        chrome.tabs.sendMessage(tab.id, { action: 'showTimer' });
        showStatus('Timer shown!', 'success');
      } else {
        showStatus(`Please navigate to ${hostUrl}`, 'error');
      }
    } catch (e) {
      showStatus('Error checking page URL', 'error');
    }
    
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 2000);
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }
});

