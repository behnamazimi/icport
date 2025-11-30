/**
 * Dashboard keyboard event handlers
 * Extracted from dashboard.ts to reduce complexity
 */

import type { DashboardState } from "./dashboard.js";
import type { PortInfo, PortGroup } from "../port/types.js";
import { Shortcuts } from "./keyboard.js";
import {
  killPort,
  copyCommandToClipboard,
  viewPortLogs,
  getFullCommand,
} from "../actions/port-actions.js";
import { getPlatformAdapter } from "../platform/platform-factory.js";

export interface DashboardHandlers {
  // State access
  getState: () => DashboardState;
  setState: (updater: (state: DashboardState) => void) => void;
  getSelectedPort: () => { port: PortInfo; group: PortGroup } | null;

  // Actions
  moveSelection: (delta: number) => void;
  applySorting: () => void;
  toggleGroup: () => void;
  refresh: () => Promise<void>;
  render: () => void;
  stop: () => void;
  clearFilteredPortsCache: () => void;
  clearDetectorCache: () => void;
}

/**
 * Setup keyboard handlers for the dashboard
 */
export function setupKeyboardHandlers(
  keyboard: { on: (key: string, handler: () => void | Promise<void>) => void },
  handlers: DashboardHandlers
): void {
  const { getState, setState, getSelectedPort } = handlers;

  // Helper to check if modal is open
  const isModalOpen = (): boolean => {
    const state = getState();
    return (
      state.showHelp || state.showConfirm || state.showLogs || state.showCommand || state.searching
    );
  };

  keyboard.on(Shortcuts.QUIT, () => {
    handlers.stop();
    process.exit(0);
  });

  keyboard.on(Shortcuts.UP, () => {
    if (isModalOpen()) {
      return;
    }
    handlers.moveSelection(-1);
    handlers.render();
  });

  keyboard.on(Shortcuts.DOWN, () => {
    if (isModalOpen()) {
      return;
    }
    handlers.moveSelection(1);
    handlers.render();
  });

  // Port search (like lsof -i :PORT)
  keyboard.on(Shortcuts.SEARCH, () => {
    if (isModalOpen()) {
      return;
    }
    setState((state) => {
      state.searching = true;
    });
    handlers.render();
  });

  // Kill without confirmation (like kill $(lsof -t -i:8080))
  keyboard.on(Shortcuts.KILL, async () => {
    if (isModalOpen()) {
      return;
    }
    await handleKill(handlers);
  });

  keyboard.on(Shortcuts.COPY, async () => {
    if (isModalOpen()) {
      return;
    }
    await handleCopy(handlers);
  });

  keyboard.on(Shortcuts.VIEW_COMMAND, async () => {
    if (isModalOpen()) {
      return;
    }
    await handleViewCommand(handlers);
  });

  keyboard.on(Shortcuts.VIEW_LOGS, async () => {
    if (isModalOpen()) {
      return;
    }
    await handleViewLogs(handlers);
  });

  keyboard.on(Shortcuts.TOGGLE_GROUP, () => {
    if (isModalOpen()) {
      return;
    }
    handlers.toggleGroup();
    handlers.clearFilteredPortsCache();
    handlers.render();
  });

  keyboard.on(Shortcuts.TOGGLE_DETAILS, () => {
    if (isModalOpen()) {
      return;
    }
    setState((state) => {
      state.showDetails = !state.showDetails;
    });
    handlers.render();
  });

  keyboard.on(Shortcuts.SORT_PORT, () => {
    if (isModalOpen()) {
      return;
    }
    setState((state) => {
      state.sortBy = "port";
    });
    handlers.applySorting();
    handlers.render();
  });

  keyboard.on(Shortcuts.SORT_PROCESS, () => {
    if (isModalOpen()) {
      return;
    }
    setState((state) => {
      state.sortBy = "process";
    });
    handlers.applySorting();
    handlers.render();
  });

  keyboard.on(Shortcuts.SORT_PID, () => {
    if (isModalOpen()) {
      return;
    }
    setState((state) => {
      state.sortBy = "pid";
    });
    handlers.applySorting();
    handlers.render();
  });

  keyboard.on(Shortcuts.HELP, () => {
    setState((state) => {
      state.showHelp = !state.showHelp;
    });
    handlers.render();
  });

  keyboard.on(Shortcuts.ESCAPE, () => {
    const state = getState();
    if (state.searching) {
      // Note: searchBuffer is managed in dashboard.ts
      setState((state) => {
        state.searching = false;
        state.filter = "";
      });
      handlers.clearFilteredPortsCache();
      handlers.render();
    } else if (state.showHelp) {
      setState((state) => {
        state.showHelp = false;
      });
      handlers.render();
    } else if (state.showConfirm) {
      setState((state) => {
        state.showConfirm = false;
        state.confirmAction = null;
      });
      handlers.render();
    } else if (state.showLogs) {
      setState((state) => {
        state.showLogs = false;
        state.logsContent = null;
      });
      handlers.render();
    } else if (state.showCommand) {
      setState((state) => {
        state.showCommand = false;
        state.commandContent = null;
      });
      handlers.render();
    }
  });

  keyboard.on(Shortcuts.ENTER, async () => {
    const state = getState();
    if (state.searching) {
      // Execute search
      setState((state) => {
        state.searching = false;
        state.filter = state.filter || "";
      });
      handlers.clearFilteredPortsCache();
      handlers.render();
    } else if (state.showConfirm && state.confirmAction) {
      // Execute confirmed action
      setState((state) => {
        state.showConfirm = false;
      });
      await state.confirmAction();
      handlers.render();
    }
  });

  // Note: Search input handling is done in dashboard.ts via keyboard.on("*")
  // This is kept in dashboard.ts because it requires direct access to searchBuffer
}

/**
 * Handle kill action
 */
async function handleKill(handlers: DashboardHandlers): Promise<void> {
  const selected = handlers.getSelectedPort();
  if (!selected) return;

  const { getState, setState } = handlers;

  // Show loading state
  setState((state) => {
    state.isKilling = true;
    state.killingPort = selected.port.port;
  });
  handlers.render();

  try {
    const killed = await killPort(selected.port, false, false);

    // Clear cache to force immediate refresh
    handlers.clearFilteredPortsCache();
    handlers.clearDetectorCache();

    // Small delay to allow process to fully terminate before detection
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Always refresh immediately to show updated list
    await handlers.refresh();
    handlers.render();
  } catch (error) {
    // Clear cache and refresh even on error to show current state
    handlers.clearFilteredPortsCache();
    handlers.clearDetectorCache();
    await handlers.refresh();
    handlers.render();
  } finally {
    // Clear loading state
    setState((state) => {
      state.isKilling = false;
      state.killingPort = null;
    });
    handlers.render();
  }
}

/**
 * Handle copy action
 */
async function handleCopy(handlers: DashboardHandlers): Promise<void> {
  const selected = handlers.getSelectedPort();
  if (!selected) return;

  const command = getFullCommand(selected.port);
  await copyCommandToClipboard(command);
}

/**
 * Handle view command action
 */
async function handleViewCommand(handlers: DashboardHandlers): Promise<void> {
  const selected = handlers.getSelectedPort();
  if (!selected) return;

  const { setState } = handlers;

  setState((state) => {
    state.showCommand = true;
  });

  // Get fresh command from platform adapter to ensure we have the full command
  try {
    const adapter = getPlatformAdapter();
    const fullCommand = await adapter.getProcessCommand(selected.port.pid);
    setState((state) => {
      state.commandContent = fullCommand || getFullCommand(selected.port);
    });
  } catch {
    // Fallback to stored command if fetching fails
    setState((state) => {
      state.commandContent = getFullCommand(selected.port);
    });
  }
  handlers.render();
}

/**
 * Handle view logs action
 */
async function handleViewLogs(handlers: DashboardHandlers): Promise<void> {
  const selected = handlers.getSelectedPort();
  if (!selected) return;

  const { setState } = handlers;

  const logs = await viewPortLogs(selected.port);
  setState((state) => {
    state.showLogs = true;
    state.logsContent = logs || "No logs available";
  });
  handlers.render();
}
