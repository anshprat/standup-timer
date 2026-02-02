/**
 * Format seconds as MM:SS string
 * @param seconds - Total seconds to format
 * @returns Formatted time string (e.g., "05:30")
 */
export function formatTime(seconds: number): string {
  const absSeconds = Math.abs(Math.floor(seconds));
  const minutes = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Check if a URL matches a configured host pattern
 * @param currentUrl - The current URL to check
 * @param hostUrl - The configured host pattern (e.g., "linear.app")
 * @returns True if the current URL matches the host pattern
 */
export function matchesHost(currentUrl: string, hostUrl: string): boolean {
  try {
    const url = new URL(currentUrl);
    const currentHost = url.hostname.replace('www.', '');
    const configuredHost = hostUrl
      .replace('www.', '')
      .replace(/^https?:\/\//, '')
      .split('/')[0];

    return currentHost.includes(configuredHost) || configuredHost.includes(currentHost);
  } catch {
    return false;
  }
}

/**
 * Calculate time per participant based on total time and participant count
 * @param totalTimeMinutes - Total standup time in minutes
 * @param participantCount - Number of participants
 * @returns Time per participant in seconds
 */
export function calculateTimePerParticipant(totalTimeMinutes: number, participantCount: number): number {
  if (participantCount === 0) return 0;
  return Math.floor((totalTimeMinutes * 60) / participantCount);
}
