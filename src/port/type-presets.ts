/**
 * Type presets configuration for port type detection
 */

export interface TypePreset {
  name: string;
  ports?: number[];
  portRanges?: { min: number; max: number }[];
  commandPatterns?: string[];
  processPatterns?: string[];
  priority?: number; // Higher priority = checked first
}

export interface TypePresetsConfig {
  types: TypePreset[];
}

/**
 * Default type presets configuration
 * These presets determine the type of a port based on port number, command patterns, and process name patterns
 */
export const defaultTypePresets: TypePreset[] = [
  {
    name: "storybook",
    ports: [6006],
    commandPatterns: ["storybook"],
    processPatterns: ["storybook"],
    priority: 10,
  },
  {
    name: "dev-server",
    ports: [3000, 3001, 5173, 4200, 8080, 8081, 4000],
    commandPatterns: [
      "dev",
      "start",
      "serve",
      "vite",
      "next",
      "react",
      "angular",
      "webpack",
      "parcel",
    ],
    processPatterns: ["node", "vite", "next", "react", "angular", "webpack", "parcel"],
    priority: 9,
  },
  {
    name: "api",
    ports: [8000, 8001, 4000, 3000, 3001],
    commandPatterns: [
      "api",
      "server",
      "flask",
      "django",
      "fastapi",
      "uvicorn",
      "gunicorn",
      "express",
      "koa",
    ],
    processPatterns: [
      "python",
      "flask",
      "django",
      "fastapi",
      "uvicorn",
      "gunicorn",
      "node",
      "express",
      "koa",
    ],
    priority: 8,
  },
  {
    name: "database",
    ports: [5432, 3306, 27017, 6379, 5984, 9200, 1521, 1433],
    processPatterns: [
      "postgres",
      "postgresql",
      "mysql",
      "mariadb",
      "mongodb",
      "redis",
      "couchdb",
      "elasticsearch",
      "oracle",
      "mssql",
    ],
    priority: 7,
  },
  {
    name: "testing",
    ports: [9229, 9228],
    commandPatterns: ["jest", "test", "mocha", "jasmine", "karma"],
    processPatterns: ["jest", "test", "mocha", "jasmine", "karma"],
    priority: 6,
  },
  {
    name: "unexpected",
    ports: [22, 80, 443, 3306, 5432, 27017, 6379],
    priority: 5,
  },
  {
    name: "other",
    priority: 0, // Fallback - lowest priority
  },
];

/**
 * Default type presets configuration object
 */
export const defaultTypePresetsConfig: TypePresetsConfig = {
  types: defaultTypePresets,
};
