/**
 * Timer settings configuration
 */
export interface TimerSettings {
  /** List of participant names */
  participants: string[];
  /** Total time for standup in minutes */
  totalTime: number;
  /** Timer display mode */
  timerMode: 'countdown' | 'countup';
  /** Host URL for Chrome extension (which domain to show timer on) */
  hostUrl: string;
  /** Whether to show the timer */
  showTimer: boolean;
}

/**
 * Default timer settings
 */
export const DEFAULT_SETTINGS: TimerSettings = {
  participants: [],
  totalTime: 15,
  timerMode: 'countdown',
  hostUrl: 'linear.app',
  showTimer: true,
};

/**
 * Create settings with defaults for any missing values
 */
export function createSettings(partial: Partial<TimerSettings> = {}): TimerSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
  };
}
