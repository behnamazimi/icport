import type { PortInfo } from "../port/types.js";
import { spawnDetached } from "./runtime-utils.js";
import { getPlatformAdapter } from "../platform/platform-factory.js";

export interface ProcessDetails {
  pid: number;
  name: string;
  command: string;
  memory: number; // in KB
  cpu: number; // percentage
  cwd: string | null;
}

/**
 * Get detailed process information
 */
export async function getProcessDetails(pid: number): Promise<ProcessDetails | null> {
  try {
    const platformAdapter = getPlatformAdapter();
    const processInfo = await platformAdapter.getProcessInfo(pid);

    // Note: Memory and CPU info are platform-specific and not in the adapter interface
    // For now, we'll return basic info
    return {
      pid,
      name: "", // Will be extracted from command if needed
      command: processInfo.command,
      memory: 0, // Not available through adapter
      cpu: 0, // Not available through adapter
      cwd: processInfo.cwd,
    };
  } catch {
    return null;
  }
}

/**
 * Kill a process gracefully (SIGTERM on Unix, normal termination on Windows)
 */
export async function killProcess(pid: number, force: boolean = false): Promise<boolean> {
  try {
    const platformAdapter = getPlatformAdapter();
    return await platformAdapter.killProcess(pid, force);
  } catch {
    return false;
  }
}

/**
 * Get process stdout/stderr streams
 */
export async function getProcessLogs(
  pid: number
): Promise<{ stdout: string; stderr: string } | null> {
  try {
    const platformAdapter = getPlatformAdapter();
    const command = await platformAdapter.getProcessCommand(pid);

    return {
      stdout: `Process: ${command}\n\nNote: Live logs are not available. Use the process command to view logs manually.`,
      stderr: "",
    };
  } catch {
    return null;
  }
}
