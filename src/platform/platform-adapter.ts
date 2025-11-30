/**
 * Platform adapter interface for cross-platform port and process management
 */

import type { PortInfo } from "../port/types.js";

/**
 * Platform adapter interface
 * Abstracts platform-specific operations for port detection and process management
 */
export interface PlatformAdapter {
  /**
   * Detect all active listening ports
   */
  detectPorts(): Promise<PortInfo[]>;

  /**
   * Get process information by PID
   */
  getProcessInfo(pid: number): Promise<{
    command: string;
    cwd: string | null;
  }>;

  /**
   * Get process lifetime (uptime in seconds)
   */
  getProcessLifetime(pid: number): Promise<number | undefined>;

  /**
   * Kill a process
   */
  killProcess(pid: number, force: boolean): Promise<boolean>;

  /**
   * Get process command line
   */
  getProcessCommand(pid: number): Promise<string>;
}
