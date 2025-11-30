/**
 * Platform factory for creating platform-specific adapters
 */

import type { PlatformAdapter } from "./platform-adapter.js";
import { UnixPlatformAdapter } from "./unix-adapter.js";
import { WindowsPlatformAdapter } from "./windows-adapter.js";

/**
 * Get the appropriate platform adapter for the current platform
 */
export function getPlatformAdapter(): PlatformAdapter {
  const platform = process.platform;

  if (platform === "win32") {
    return new WindowsPlatformAdapter();
  } else {
    // macOS (darwin) and Linux
    return new UnixPlatformAdapter();
  }
}

/**
 * Check if the current platform is Windows
 */
export function isWindows(): boolean {
  return process.platform === "win32";
}

/**
 * Check if the current platform is Unix-like (macOS or Linux)
 */
export function isUnix(): boolean {
  return process.platform !== "win32";
}
