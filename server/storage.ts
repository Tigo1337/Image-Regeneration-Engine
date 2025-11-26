import { type User, type InsertUser, type GeneratedDesign } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveGeneratedDesign(design: Omit<GeneratedDesign, 'id'>): Promise<GeneratedDesign>;
  getGeneratedDesigns(): Promise<GeneratedDesign[]>;
  getGeneratedDesign(id: string): Promise<GeneratedDesign | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private generatedDesigns: Map<string, GeneratedDesign>;

  constructor() {
    this.users = new Map();
    this.generatedDesigns = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveGeneratedDesign(design: Omit<GeneratedDesign, 'id'>): Promise<GeneratedDesign> {
    const id = randomUUID();
    const savedDesign: GeneratedDesign = { ...design, id };
    this.generatedDesigns.set(id, savedDesign);
    return savedDesign;
  }

  async getGeneratedDesigns(): Promise<GeneratedDesign[]> {
    return Array.from(this.generatedDesigns.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  async getGeneratedDesign(id: string): Promise<GeneratedDesign | undefined> {
    return this.generatedDesigns.get(id);
  }
}

export const storage = new MemStorage();
