/**
 * Timer state
 */
export interface TimerState {
  /** Current participant index */
  currentParticipantIndex: number;
  /** Elapsed time for current participant in seconds */
  elapsedTime: number;
  /** Total elapsed time across all participants in seconds */
  totalElapsedTime: number;
  /** Whether the timer is paused */
  isPaused: boolean;
  /** Whether the UI is minimized */
  isMinimized: boolean;
  /** Total time spent by each participant (accumulated across turns) */
  participantTimeTracker: Record<string, number>;
  /** Start time of current turn for each participant (null if not active) */
  participantCurrentStartTime: Record<string, number | null>;
}

/**
 * Initial timer state
 */
export const INITIAL_STATE: TimerState = {
  currentParticipantIndex: 0,
  elapsedTime: 0,
  totalElapsedTime: 0,
  isPaused: false,
  isMinimized: false,
  participantTimeTracker: {},
  participantCurrentStartTime: {},
};

/**
 * Create a fresh state with optional overrides
 */
export function createState(partial: Partial<TimerState> = {}): TimerState {
  return {
    ...INITIAL_STATE,
    participantTimeTracker: {},
    participantCurrentStartTime: {},
    ...partial,
  };
}
