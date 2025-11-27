# Standup Timer Chrome Extension

A Chrome extension that displays an embedded standup timer directly on web pages (initially configured for Linear). Perfect for team standups where you're sharing your screen on Google Meet.

## Features

- **Embedded Timer**: Shows directly on the page (not a popup), so it's visible when screen sharing
- **Participant Management**: Add and edit a list of participants
- **Automatic Time Division**: Total time is automatically divided equally among participants
- **Timer Modes**: 
  - Countdown: Shows remaining time per participant
  - Count Up: Shows elapsed time per participant
- **Manual Control**: Next button to skip to the next participant
- **Draggable**: Move the timer anywhere on the page
- **Resizable**: Resize the timer window by dragging the bottom-right corner
- **Minimized View**: Click the minimize button to show a compact single-line view in the header
- **Total Time Tracker**: Shows cumulative time spent across all participants
- **Per-Participant Time Tracking**: Tracks total time taken by each participant across all their turns
- **Time Display**: Shows "Current: Name - Time taken / Total allocation" format
- **Summary Report Card**: Click Summary button to see detailed report for all participants with progress bars and percentages
- **Back Button**: Go back to the previous participant and give them their full time again
- **Auto-advance**: Automatically moves to next participant when time is up (countdown mode)

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `standup-timer` directory

## Usage

1. Navigate to your Linear page (or any page where the extension is active)
2. Click the extension icon in the Chrome toolbar
3. Configure your settings:
   - Add participants (one per line)
   - Set total time in minutes
   - Choose timer mode (countdown or count up)
   - Toggle timer visibility
4. Click "Save Settings"
5. The timer will appear on the page as a draggable widget

## Configuration

- **Participants**: Enter names one per line. The timer will rotate through them in order.
- **Total Time**: The total meeting time in minutes. This is divided equally among all participants.
- **Timer Mode**: 
  - **Countdown**: Shows remaining time. Auto-advances when time runs out.
  - **Count Up**: Shows elapsed time. No auto-advance.
- **Host URL**: The host/domain where the timer should appear (e.g., `linear.app`, `example.com`). Default is `linear.app`. The timer will only show on pages matching this host.
- **Show Timer**: Toggle to show/hide the timer on the page.

## Controls

- **Next**: Manually advance to the next participant
- **Back**: Go back to the previous participant (gives them their full time again)
- **Summary**: View a detailed report card showing time usage for all participants
- **Minimize (−)**: Toggle between full view and compact single-line view
- **×**: Hide the timer (can be shown again by saving settings)
- **Resize Handle**: Drag the bottom-right corner to resize the timer window

## Time Tracking

The timer automatically tracks:
- **Current Turn Time**: Time spent by the current participant in their current turn
- **Total Time per Participant**: Cumulative time across all turns for each participant
- **Total Meeting Time**: Overall time spent across all participants

The display shows: `Current: [Name] - [Time taken] / [Total allocation]`

For example: `Current: Alice - 02:30 / 03:00` means Alice has used 2 minutes 30 seconds out of her 3-minute allocation.

## Development

The extension consists of:
- `manifest.json`: Extension configuration
- `popup.html/js`: Configuration UI
- `content.js`: Timer logic and UI injection
- `styles.css`: Timer styling

## Future Enhancements

- Support for custom time per participant
- Sound notifications
- Timer history/statistics
- Support for more websites beyond Linear

