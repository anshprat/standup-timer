import { app, ipcMain, BrowserWindow } from 'electron';
import { TimerEngine, type TimerSettings } from '@standup-timer/core';
import { ElectronStorageAdapter } from './electron-storage';
import { createOverlayWindow, getOverlayWindow, hideOverlayWindow } from './window';
import { createTray, updateTrayMenu } from './tray';

// Set app name (shows in macOS menu bar)
app.setName('Standup Timer');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let storage: ElectronStorageAdapter;
let engine: TimerEngine;

app.on('ready', async () => {
  // Initialize storage
  storage = new ElectronStorageAdapter();

  // Initialize timer engine
  engine = new TimerEngine({ storage });
  await engine.initialize();

  // Create overlay window
  createOverlayWindow();

  // Create system tray
  createTray(storage);

  // Configure auto-start
  const autoStartEnabled = storage.getAutoStartEnabled();
  app.setLoginItemSettings({
    openAtLogin: autoStartEnabled,
    openAsHidden: true,
  });

  // Set up timer event forwarding to renderer
  engine.on('tick', forwardEventToRenderer);
  engine.on('participantChanged', forwardEventToRenderer);
  engine.on('paused', forwardEventToRenderer);
  engine.on('resumed', forwardEventToRenderer);
  engine.on('reset', forwardEventToRenderer);
  engine.on('timeUp', forwardEventToRenderer);
  engine.on('settingsChanged', forwardEventToRenderer);
  engine.on('stateChanged', forwardEventToRenderer);

  // Start the timer if participants are configured
  const settings = engine.getSettings();
  if (settings.participants.length > 0) {
    engine.start();
  }
});

/**
 * Forward timer events to renderer process
 */
function forwardEventToRenderer(): void {
  const window = getOverlayWindow();
  if (window && !window.isDestroyed()) {
    window.webContents.send('timer-event', {
      state: engine.getState(),
      settings: engine.getSettings(),
      displayTime: engine.getDisplayTime(),
      totalTime: engine.getTotalTimeDisplay(),
      currentParticipantTime: engine.getCurrentParticipantTimeDisplay(),
      summary: engine.getSummary(),
    });
  }
}

// IPC handlers
ipcMain.handle('get-settings', () => {
  return engine.getSettings();
});

ipcMain.handle('get-state', () => {
  return {
    state: engine.getState(),
    displayTime: engine.getDisplayTime(),
    totalTime: engine.getTotalTimeDisplay(),
    currentParticipantTime: engine.getCurrentParticipantTimeDisplay(),
    currentParticipant: engine.getCurrentParticipant(),
  };
});

ipcMain.handle('save-settings', async (_event, newSettings: Partial<TimerSettings>) => {
  await engine.updateSettings(newSettings);
  updateTrayMenu(storage);

  // Restart timer if participants changed
  if (newSettings.participants) {
    engine.stop();
    if (newSettings.participants.length > 0) {
      engine.start();
    }
  }

  return engine.getSettings();
});

ipcMain.on('timer-command', (_event, { cmd, data }: { cmd: string; data?: unknown }) => {
  switch (cmd) {
    case 'start':
      engine.start();
      break;
    case 'stop':
      engine.stop();
      break;
    case 'togglePause':
      engine.togglePause();
      break;
    case 'nextParticipant':
      engine.nextParticipant();
      break;
    case 'previousParticipant':
      engine.previousParticipant();
      break;
    case 'resetCurrentParticipant':
      engine.resetCurrentParticipant();
      break;
    case 'resetAll':
      engine.resetAll();
      break;
    case 'toggleMinimized':
      engine.toggleMinimized();
      break;
  }

  // Send updated state after command
  forwardEventToRenderer();
});

ipcMain.on('minimize-window', () => {
  const window = getOverlayWindow();
  if (window) {
    window.minimize();
  }
});

ipcMain.on('close-window', () => {
  hideOverlayWindow();
});

// Handle second instance
app.on('second-instance', () => {
  const window = getOverlayWindow();
  if (window) {
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  }
});

// macOS: Re-create window when dock icon clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createOverlayWindow();
  } else {
    const window = getOverlayWindow();
    window?.show();
  }
});

// Prevent app from quitting when all windows are closed (keep in tray)
app.on('window-all-closed', () => {
  // Don't quit on macOS
  if (process.platform !== 'darwin') {
    // On other platforms, we still want to keep running for the tray
  }
});
