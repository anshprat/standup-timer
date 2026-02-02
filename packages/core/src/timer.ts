import { TimerSettings, createSettings } from './settings';
import { TimerState, createState } from './state';
import { StorageAdapter, MemoryStorageAdapter } from './storage';
import { formatTime, calculateTimePerParticipant } from './utils';

/**
 * Timer event types
 */
export type TimerEventType =
  | 'tick'
  | 'participantChanged'
  | 'paused'
  | 'resumed'
  | 'reset'
  | 'timeUp'
  | 'settingsChanged'
  | 'stateChanged';

/**
 * Timer event payload
 */
export interface TimerEvent {
  type: TimerEventType;
  state: TimerState;
  settings: TimerSettings;
}

/**
 * Display time information
 */
export interface DisplayTime {
  /** Formatted time string (MM:SS) */
  time: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether time is running out (for warnings) */
  isWarning: boolean;
  /** Raw elapsed time in seconds */
  elapsedTime: number;
  /** Raw remaining time in seconds (for countdown) */
  remainingTime: number;
}

/**
 * Participant summary for report
 */
export interface ParticipantSummary {
  /** Participant name */
  name: string;
  /** Time taken in seconds */
  timeTaken: number;
  /** Formatted time taken */
  timeTakenDisplay: string;
  /** Total allocation in seconds */
  totalAllocation: number;
  /** Formatted allocation */
  totalAllocationDisplay: string;
  /** Percentage of allocation used */
  percentage: number;
  /** Whether participant went over time */
  isOver: boolean;
  /** Whether this is the current participant */
  isCurrent: boolean;
}

type EventListener = (event: TimerEvent) => void;

export interface TimerEngineOptions {
  storage?: StorageAdapter;
  settings?: Partial<TimerSettings>;
}

/**
 * Core timer engine that manages standup timer state and logic
 */
export class TimerEngine {
  private settings: TimerSettings;
  private state: TimerState;
  private storage: StorageAdapter;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: number | null = null;
  private pauseStartTime: number | null = null;
  private pausedElapsedTime = 0;
  private listeners: Map<TimerEventType, Set<EventListener>> = new Map();

  constructor(options: TimerEngineOptions = {}) {
    this.storage = options.storage || new MemoryStorageAdapter();
    this.settings = createSettings(options.settings);
    this.state = createState();
  }

  /**
   * Initialize timer engine by loading settings from storage
   */
  async initialize(): Promise<void> {
    const stored = await this.storage.get<TimerSettings>([
      'participants',
      'totalTime',
      'timerMode',
      'hostUrl',
      'showTimer',
    ]);

    this.settings = createSettings({
      ...this.settings,
      ...stored,
    });

    this.initializeParticipantTracking();
  }

  /**
   * Update settings
   */
  async updateSettings(newSettings: Partial<TimerSettings>): Promise<void> {
    this.settings = createSettings({
      ...this.settings,
      ...newSettings,
    });
    await this.storage.set(newSettings);
    this.emit('settingsChanged');
  }

  /**
   * Start the timer
   */
  start(): void {
    if (this.settings.participants.length === 0) return;

    this.state = createState({
      currentParticipantIndex: 0,
      isPaused: false,
    });
    this.startTime = Date.now();
    this.pausedElapsedTime = 0;

    this.initializeParticipantTracking();
    this.startCurrentParticipantTracking();

    this.startInterval();
    this.emit('stateChanged');
  }

  /**
   * Stop the timer
   */
  stop(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    if (this.state.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (this.state.isPaused) return;

    this.state.isPaused = true;
    this.pausedElapsedTime = this.state.elapsedTime;
    this.pauseStartTime = Date.now();
    this.saveCurrentParticipantTime();
    this.emit('paused');
  }

  /**
   * Resume the timer
   */
  resume(): void {
    if (!this.state.isPaused) return;

    this.state.isPaused = false;

    if (this.pauseStartTime) {
      this.startTime = Date.now() - this.pausedElapsedTime * 1000;
      this.pauseStartTime = null;
      this.pausedElapsedTime = 0;
    }

    this.startCurrentParticipantTracking();
    this.emit('resumed');
  }

  /**
   * Move to next participant
   */
  nextParticipant(): void {
    if (this.settings.participants.length === 0) return;

    this.saveCurrentParticipantTime();

    this.state.currentParticipantIndex =
      (this.state.currentParticipantIndex + 1) % this.settings.participants.length;
    this.state.elapsedTime = 0;
    this.pausedElapsedTime = 0;
    this.startTime = Date.now();

    if (!this.state.isPaused) {
      this.startCurrentParticipantTracking();
    }

    this.emit('participantChanged');
  }

  /**
   * Move to previous participant
   */
  previousParticipant(): void {
    if (this.settings.participants.length === 0) return;

    this.saveCurrentParticipantTime();

    this.state.currentParticipantIndex =
      (this.state.currentParticipantIndex - 1 + this.settings.participants.length) %
      this.settings.participants.length;
    this.state.elapsedTime = 0;
    this.pausedElapsedTime = 0;
    this.startTime = Date.now();

    if (!this.state.isPaused) {
      this.startCurrentParticipantTracking();
    }

    this.emit('participantChanged');
  }

  /**
   * Reset current participant's timer
   */
  resetCurrentParticipant(): void {
    const currentParticipant = this.getCurrentParticipant();
    if (!currentParticipant) return;

    this.state.elapsedTime = 0;
    this.pausedElapsedTime = 0;
    this.startTime = Date.now();
    this.state.isPaused = false;

    this.state.participantTimeTracker[currentParticipant] = 0;
    this.state.participantCurrentStartTime[currentParticipant] = Date.now();

    this.emit('reset');
  }

  /**
   * Reset entire standup
   */
  resetAll(): void {
    this.state = createState();
    this.startTime = Date.now();
    this.pausedElapsedTime = 0;

    this.initializeParticipantTracking();
    this.startCurrentParticipantTracking();

    this.emit('reset');
  }

  /**
   * Toggle minimized state
   */
  toggleMinimized(): void {
    this.state.isMinimized = !this.state.isMinimized;
    this.emit('stateChanged');
  }

  /**
   * Get current state
   */
  getState(): Readonly<TimerState> {
    return { ...this.state };
  }

  /**
   * Get current settings
   */
  getSettings(): Readonly<TimerSettings> {
    return { ...this.settings };
  }

  /**
   * Get current participant name
   */
  getCurrentParticipant(): string | null {
    if (this.settings.participants.length === 0) return null;
    return this.settings.participants[this.state.currentParticipantIndex] || null;
  }

  /**
   * Get time allocated per participant in seconds
   */
  getTimePerParticipant(): number {
    return calculateTimePerParticipant(this.settings.totalTime, this.settings.participants.length);
  }

  /**
   * Get display time information
   */
  getDisplayTime(): DisplayTime {
    const timePerParticipant = this.getTimePerParticipant();
    const elapsedTime = this.state.elapsedTime;
    const remainingTime = Math.max(0, timePerParticipant - elapsedTime);
    const progress = timePerParticipant > 0 ? Math.min(100, (elapsedTime / timePerParticipant) * 100) : 0;

    let displayTime: string;
    if (this.settings.timerMode === 'countdown') {
      displayTime = formatTime(remainingTime);
    } else {
      displayTime = formatTime(elapsedTime);
    }

    const isWarning = this.settings.timerMode === 'countdown' && remainingTime <= 30;

    return {
      time: displayTime,
      progress,
      isWarning,
      elapsedTime,
      remainingTime,
    };
  }

  /**
   * Get total time across all participants
   */
  getTotalTime(): number {
    let total = 0;
    for (const participant of this.settings.participants) {
      total += this.getParticipantTime(participant);
    }
    return total;
  }

  /**
   * Get total time display
   */
  getTotalTimeDisplay(): string {
    return formatTime(this.getTotalTime());
  }

  /**
   * Get current participant's total time taken (including current turn)
   */
  getCurrentParticipantTotalTime(): number {
    const currentParticipant = this.getCurrentParticipant();
    if (!currentParticipant) return 0;
    return this.getParticipantTime(currentParticipant);
  }

  /**
   * Get current participant's time display
   */
  getCurrentParticipantTimeDisplay(): string {
    const timeTaken = this.getCurrentParticipantTotalTime();
    const allocation = this.getTimePerParticipant();
    return `${formatTime(timeTaken)} / ${formatTime(allocation)}`;
  }

  /**
   * Get participant summary for report
   */
  getSummary(): ParticipantSummary[] {
    const timePerParticipant = this.getTimePerParticipant();

    return this.settings.participants.map((participant, index) => {
      const timeTaken = this.getParticipantTime(participant);
      const percentage = timePerParticipant > 0 ? Math.round((timeTaken / timePerParticipant) * 100) : 0;

      return {
        name: participant,
        timeTaken,
        timeTakenDisplay: formatTime(timeTaken),
        totalAllocation: timePerParticipant,
        totalAllocationDisplay: formatTime(timePerParticipant),
        percentage,
        isOver: timeTaken > timePerParticipant,
        isCurrent: index === this.state.currentParticipantIndex,
      };
    });
  }

  /**
   * Add event listener
   */
  on(event: TimerEventType, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: TimerEventType, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  // Private methods

  private initializeParticipantTracking(): void {
    this.state.participantTimeTracker = {};
    this.state.participantCurrentStartTime = {};

    for (const participant of this.settings.participants) {
      this.state.participantTimeTracker[participant] = 0;
      this.state.participantCurrentStartTime[participant] = null;
    }
  }

  private startCurrentParticipantTracking(): void {
    const currentParticipant = this.getCurrentParticipant();
    if (currentParticipant) {
      this.state.participantCurrentStartTime[currentParticipant] = Date.now();
    }
  }

  private saveCurrentParticipantTime(): void {
    const currentParticipant = this.getCurrentParticipant();
    if (currentParticipant && this.state.participantCurrentStartTime[currentParticipant]) {
      const timeSpent = Math.floor(
        (Date.now() - this.state.participantCurrentStartTime[currentParticipant]!) / 1000
      );
      this.state.participantTimeTracker[currentParticipant] =
        (this.state.participantTimeTracker[currentParticipant] || 0) + timeSpent;
      this.state.participantCurrentStartTime[currentParticipant] = null;
    }
  }

  private getParticipantTime(participant: string): number {
    let time = this.state.participantTimeTracker[participant] || 0;

    // Add current turn time if this is the current participant and not paused
    if (
      participant === this.getCurrentParticipant() &&
      this.state.participantCurrentStartTime[participant] &&
      !this.state.isPaused
    ) {
      const currentTurnTime = Math.floor(
        (Date.now() - this.state.participantCurrentStartTime[participant]!) / 1000
      );
      time += currentTurnTime;
    }

    return time;
  }

  private startInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (!this.state.isPaused && this.startTime) {
        this.state.elapsedTime =
          Math.floor((Date.now() - this.startTime) / 1000) + this.pausedElapsedTime;

        this.emit('tick');

        // Auto-advance in countdown mode
        if (this.settings.timerMode === 'countdown') {
          const timePerParticipant = this.getTimePerParticipant();
          const remaining = timePerParticipant - this.state.elapsedTime;

          if (remaining <= 0) {
            this.emit('timeUp');
            this.nextParticipant();
          }
        }
      }
    }, 100);
  }

  private emit(type: TimerEventType): void {
    const event: TimerEvent = {
      type,
      state: this.getState(),
      settings: this.getSettings(),
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        listener(event);
      }
    }
  }
}
