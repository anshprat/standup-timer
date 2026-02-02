import { Tray, Menu, nativeImage, app } from 'electron';
import * as path from 'path';
import { showOverlayWindow, hideOverlayWindow, getOverlayWindow } from './window';
import type { ElectronStorageAdapter } from './electron-storage';

let tray: Tray | null = null;

/**
 * Create the system tray icon and menu
 */
export function createTray(storage: ElectronStorageAdapter): Tray {
  // Create a simple tray icon (you can replace with actual icon)
  const iconPath = path.join(__dirname, '../../resources/icons/tray-icon.png');

  // Create a fallback icon if the file doesn't exist
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = createFallbackIcon();
    }
  } catch {
    icon = createFallbackIcon();
  }

  tray = new Tray(icon);
  tray.setToolTip('Standup Timer');

  updateTrayMenu(storage);

  tray.on('click', () => {
    const window = getOverlayWindow();
    if (window?.isVisible()) {
      hideOverlayWindow();
    } else {
      showOverlayWindow();
    }
  });

  return tray;
}

/**
 * Create a fallback icon when no icon file exists
 */
function createFallbackIcon(): Electron.NativeImage {
  // Create a simple 16x16 colored square as fallback
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  // Fill with purple color (matching the app theme)
  for (let i = 0; i < size * size; i++) {
    canvas[i * 4] = 94; // R
    canvas[i * 4 + 1] = 106; // G
    canvas[i * 4 + 2] = 210; // B
    canvas[i * 4 + 3] = 255; // A
  }

  return nativeImage.createFromBuffer(canvas, {
    width: size,
    height: size,
  });
}

/**
 * Update the tray menu
 */
export function updateTrayMenu(storage: ElectronStorageAdapter): void {
  if (!tray) return;

  const autoStartEnabled = storage.getAutoStartEnabled();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Timer',
      click: () => showOverlayWindow(),
    },
    {
      label: 'Hide Timer',
      click: () => hideOverlayWindow(),
    },
    { type: 'separator' },
    {
      label: 'Start at Login',
      type: 'checkbox',
      checked: autoStartEnabled,
      click: (menuItem) => {
        const enabled = menuItem.checked;
        storage.setAutoStartEnabled(enabled);
        app.setLoginItemSettings({
          openAtLogin: enabled,
          openAsHidden: true,
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * Get the tray instance
 */
export function getTray(): Tray | null {
  return tray;
}
