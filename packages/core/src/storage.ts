/**
 * Storage adapter interface for persisting settings
 */
export interface StorageAdapter {
  /**
   * Get values from storage
   * @param keys - Array of keys to retrieve
   * @returns Promise resolving to object with key-value pairs
   */
  get<T>(keys: string[]): Promise<Partial<T>>;

  /**
   * Set values in storage
   * @param data - Object with key-value pairs to store
   */
  set<T>(data: Partial<T>): Promise<void>;

  /**
   * Optional callback for storage change events
   * @param callback - Function called when storage changes
   */
  onChanged?(callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void): void;
}

/**
 * In-memory storage adapter for testing or when no persistent storage is needed
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store: Record<string, unknown> = {};
  private listeners: Array<(changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void> = [];

  async get<T>(keys: string[]): Promise<Partial<T>> {
    const result: Partial<T> = {} as Partial<T>;
    for (const key of keys) {
      if (key in this.store) {
        (result as Record<string, unknown>)[key] = this.store[key];
      }
    }
    return result;
  }

  async set<T>(data: Partial<T>): Promise<void> {
    const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      changes[key] = {
        oldValue: this.store[key],
        newValue: value,
      };
      this.store[key] = value;
    }

    for (const listener of this.listeners) {
      listener(changes);
    }
  }

  onChanged(callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void): void {
    this.listeners.push(callback);
  }
}
