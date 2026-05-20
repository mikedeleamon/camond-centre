import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

export class StorageService {
  private storagePath: string;
  private data: Record<string, unknown>;

  constructor() {
    this.storagePath = path.join(app.getPath("userData"), "camond-data.json");
    this.data = this.loadFromDisk();
  }

  get(key: string): unknown {
    return this.data[key] ?? null;
  }

  set(key: string, value: unknown): void {
    this.data[key] = value;
    this.saveToDisk();
  }

  private loadFromDisk(): Record<string, unknown> {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (error) {
      console.error("Failed to load storage:", error);
    }
    return {};
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storagePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error("Failed to save storage:", error);
    }
  }
}
