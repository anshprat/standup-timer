import type { StorageAdapter } from '@standup-timer/core';

/**
 * Chrome storage adapter using chrome.storage.sync
 */
export class ChromeStorageAdapter implements StorageAdapter {
  async get<T>(keys: string[]): Promise<Partial<T>> {
    return chrome.storage.sync.get(keys) as Promise<Partial<T>>;
  }

  async set<T>(data: Partial<T>): Promise<void> {
    await chrome.storage.sync.set(data as Record<string, unknown>);
  }

  onChanged(callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void): void {
    chrome.storage.onChanged.addListener((changes) => {
      callback(changes);
    });
  }
}
