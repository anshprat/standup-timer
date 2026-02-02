import Store from 'electron-store';
import type { StorageAdapter } from '@standup-timer/core';

interface StoreSchema {
  participants: string[];
  totalTime: number;
  timerMode: 'countdown' | 'countup';
  hostUrl: string;
  showTimer: boolean;
  autoStartEnabled: boolean;
}

/**
 * Electron storage adapter using electron-store
 */
export class ElectronStorageAdapter implements StorageAdapter {
  private store: Store<StoreSchema>;
  private listeners: Array<(changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void> = [];

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'standup-timer-settings',
      defaults: {
        participants: [],
        totalTime: 15,
        timerMode: 'countdown',
        hostUrl: 'linear.app',
        showTimer: true,
        autoStartEnabled: true,
      },
    });
  }

  async get<T>(keys: string[]): Promise<Partial<T>> {
    const result: Partial<T> = {} as Partial<T>;
    for (const key of keys) {
      const value = this.store.get(key as keyof StoreSchema);
      if (value !== undefined) {
        (result as Record<string, unknown>)[key] = value;
      }
    }
    return result;
  }

  async set<T>(data: Partial<T>): Promise<void> {
    const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const oldValue = this.store.get(key as keyof StoreSchema);
      changes[key] = { oldValue, newValue: value };
      this.store.set(key as keyof StoreSchema, value as StoreSchema[keyof StoreSchema]);
    }

    for (const listener of this.listeners) {
      listener(changes);
    }
  }

  onChanged(callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Get auto-start enabled setting
   */
  getAutoStartEnabled(): boolean {
    return this.store.get('autoStartEnabled', true);
  }

  /**
   * Set auto-start enabled setting
   */
  setAutoStartEnabled(enabled: boolean): void {
    this.store.set('autoStartEnabled', enabled);
  }
}
