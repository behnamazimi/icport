import type { PortInfo } from "./types.js";
import { getPlatformAdapter } from "../platform/platform-factory.js";
import type { PlatformAdapter } from "../platform/platform-adapter.js";
import { logger } from "../utils/logger.js";

export class PortDetector {
  private cache: Map<string, PortInfo> = new Map();
  private lastUpdate: number = 0;
  private readonly cacheTimeout = 5000; // 5 second cache
  private platformAdapter: PlatformAdapter;
  private lastPortCount: number = 0;

  constructor(platformAdapter?: PlatformAdapter) {
    this.platformAdapter = platformAdapter || getPlatformAdapter();
  }

  /**
   * Get all active listening ports using platform-specific adapter
   */
  async detectPorts(): Promise<PortInfo[]> {
    const now = Date.now();

    // Return cached results if still fresh
    if (now - this.lastUpdate < this.cacheTimeout && this.cache.size > 0) {
      return Array.from(this.cache.values());
    }

    try {
      const ports = await this.platformAdapter.detectPorts();

      // Deduplicate: same port+pid combination (prefer IPv4 over IPv6, TCP over UDP)
      const deduplicated = this.deduplicatePorts(ports);

      // Check if ports have changed (cache invalidation)
      const currentPortCount = deduplicated.length;
      const portsChanged = currentPortCount !== this.lastPortCount;

      // Invalidate cache if port count changed or if we detect port changes
      if (portsChanged) {
        this.cache.clear();
        this.lastPortCount = currentPortCount;
      }

      // Update cache (removed protocol from key since ports are same regardless of protocol)
      for (const port of deduplicated) {
        const key = `${port.port}-${port.pid}`;
        this.cache.set(key, port);
      }

      this.lastUpdate = now;
      return deduplicated;
    } catch (error) {
      // If we have cached data, return it even if stale
      if (this.cache.size > 0) {
        logger.warn(`Failed to detect ports: ${error}. Using cached data.`);
        return Array.from(this.cache.values());
      }
      throw error;
    }
  }

  /**
   * Deduplicate ports - remove entries with same port+pid
   * Prefer TCP over UDP (most services use TCP)
   */
  private deduplicatePorts(ports: PortInfo[]): PortInfo[] {
    const seen = new Map<string, PortInfo>();

    for (const port of ports) {
      // Key: port+pid (ignore protocol for deduplication)
      const key = `${port.port}-${port.pid}`;

      if (!seen.has(key)) {
        seen.set(key, port);
      } else {
        // If duplicate, prefer TCP over UDP
        const existing = seen.get(key)!;
        if (port.protocol === "TCP" && existing.protocol === "UDP") {
          seen.set(key, port);
        }
        // Otherwise keep the existing one (first one wins for same protocol)
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastUpdate = 0;
  }
}
