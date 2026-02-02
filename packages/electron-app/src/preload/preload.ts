import { contextBridge, ipcRenderer } from 'electron';

/**
 * Electron API exposed to renderer process
 */
const electronAPI = {
  /**
   * Listen for timer events from main process
   */
  onTimerEvent: (callback: (data: unknown) => void) => {
    ipcRenderer.on('timer-event', (_event, data) => callback(data));
  },

  /**
   * Remove timer event listener
   */
  removeTimerEventListener: () => {
    ipcRenderer.removeAllListeners('timer-event');
  },

  /**
   * Send timer command to main process
   */
  sendCommand: (cmd: string, data?: unknown) => {
    ipcRenderer.send('timer-command', { cmd, data });
  },

  /**
   * Get current settings
   */
  getSettings: () => ipcRenderer.invoke('get-settings'),

  /**
   * Get current state
   */
  getState: () => ipcRenderer.invoke('get-state'),

  /**
   * Save settings
   */
  saveSettings: (settings: unknown) => ipcRenderer.invoke('save-settings', settings),

  /**
   * Minimize the window
   */
  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  /**
   * Close/hide the window
   */
  closeWindow: () => ipcRenderer.send('close-window'),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
