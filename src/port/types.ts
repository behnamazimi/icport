export interface PortInfo {
  port: number;
  protocol: "TCP" | "UDP";
  pid: number;
  processName: string;
  command: string;
  cwd: string | null;
  user: string;
  memory?: number;
  cpu?: number;
  lifetime?: number; // Process uptime in seconds
  type?: string; // Detected type (e.g., 'dev-server', 'api', 'database', etc.)
}

export interface PortGroup {
  id: string;
  name: string;
  type: "dev-server" | "api" | "database" | "storybook" | "testing" | "unexpected" | "other";
  ports: PortInfo[];
  collapsed: boolean;
}

export interface PortDetectionResult {
  ports: PortInfo[];
  groups: PortGroup[];
  timestamp: number;
}
