import type { PortInfo, PortGroup, PortDetectionResult } from "./types.js";
import { TypeDetector } from "./type-detector.js";

export class PortProcessor {
  private typeDetector: TypeDetector;

  constructor(typeDetector?: TypeDetector) {
    this.typeDetector = typeDetector || new TypeDetector();
  }

  /**
   * Process ports into grouped and categorized structure
   */
  async processPorts(ports: PortInfo[]): Promise<PortDetectionResult> {
    // Detect types and categorize ports in a single pass
    const categorized = ports.map((port) => {
      const type = this.typeDetector.detectType(port);
      return {
        ...port,
        type,
        category: type, // Keep category for backward compatibility with grouping
      };
    });

    // Group ports
    const groups = await this.groupPorts(categorized);

    // Return ports with types (already included in categorized)
    return {
      ports: categorized,
      groups,
      timestamp: Date.now(),
    };
  }

  /**
   * Categorize a port based on type detection
   * @deprecated Use TypeDetector directly instead
   */
  public categorizePort(
    port: PortInfo
  ): "dev-server" | "api" | "database" | "storybook" | "testing" | "unexpected" | "other" {
    const type = this.typeDetector.detectType(port);
    return type as
      | "dev-server"
      | "api"
      | "database"
      | "storybook"
      | "testing"
      | "unexpected"
      | "other";
  }

  /**
   * Group ports by category
   */
  private async groupPorts(
    categorized: Array<PortInfo & { category: string }>
  ): Promise<PortGroup[]> {
    const groups: Map<string, PortGroup> = new Map();

    // Group ports by category
    for (const port of categorized) {
      const category = port.category;
      const groupId = `category:${category}`;

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          name: this.getCategoryName(category),
          type: category as PortGroup["type"],
          ports: [],
          collapsed: false,
        });
      }

      groups.get(groupId)!.ports.push(port);
    }

    // Sort groups: unexpected first, then by type
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (a.type === "unexpected") return -1;
      if (b.type === "unexpected") return 1;
      return a.name.localeCompare(b.name);
    });

    // Sort ports within each group by port number
    for (const group of sortedGroups) {
      group.ports.sort((a, b) => a.port - b.port);
    }

    return sortedGroups;
  }

  /**
   * Get display name for category
   */
  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      "dev-server": "Dev Servers",
      api: "APIs",
      database: "Databases",
      storybook: "Storybook",
      testing: "Testing",
      unexpected: "⚠️  Unexpected Ports",
      other: "Other Services",
    };
    return names[category] || "Other";
  }
}
