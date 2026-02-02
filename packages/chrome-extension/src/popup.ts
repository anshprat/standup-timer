import { matchesHost, type TimerSettings } from '@standup-timer/core';
import { ChromeStorageAdapter } from './chrome-storage';

document.addEventListener('DOMContentLoaded', async () => {
  const participantsTextarea = document.getElementById('participants') as HTMLTextAreaElement;
  const totalTimeInput = document.getElementById('totalTime') as HTMLInputElement;
  const timerModeSelect = document.getElementById('timerMode') as HTMLSelectElement;
  const hostUrlInput = document.getElementById('hostUrl') as HTMLInputElement;
  const showTimerCheckbox = document.getElementById('showTimer') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const showTimerBtn = document.getElementById('showTimerBtn') as HTMLButtonElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;

  const storage = new ChromeStorageAdapter();

  // Load saved settings
  const result = await storage.get<TimerSettings>([
    'participants',
    'totalTime',
    'timerMode',
    'hostUrl',
    'showTimer',
  ]);

  if (result.participants) {
    participantsTextarea.value = result.participants.join('\n');
  }
  if (result.totalTime) {
    totalTimeInput.value = String(result.totalTime);
  }
  if (result.timerMode) {
    timerModeSelect.value = result.timerMode;
  }
  if (result.hostUrl) {
    hostUrlInput.value = result.hostUrl;
  } else {
    hostUrlInput.value = 'linear.app';
  }
  if (result.showTimer !== undefined) {
    showTimerCheckbox.checked = result.showTimer;
  }

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const participantsText = participantsTextarea.value.trim();
    const participants = participantsText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

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

    const settings: TimerSettings = {
      participants,
      totalTime,
      timerMode: timerModeSelect.value as 'countdown' | 'countup',
      hostUrl,
      showTimer: showTimerCheckbox.checked,
    };

    await storage.set(settings);

    // Notify content script to update
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url) {
      try {
        chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', settings });
      } catch {
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
    if (!tab?.url) {
      showStatus('Unable to access current page', 'error');
      return;
    }

    // Get configured host URL
    const hostResult = await storage.get<{ hostUrl: string }>(['hostUrl']);
    const hostUrl = hostResult.hostUrl || 'linear.app';

    // Check if current URL matches configured host
    if (matchesHost(tab.url, hostUrl)) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'showTimer' });
        showStatus('Timer shown!', 'success');
      }
    } else {
      showStatus(`Please navigate to ${hostUrl}`, 'error');
    }

    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 2000);
  });

  function showStatus(message: string, type: 'success' | 'error'): void {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }
});
