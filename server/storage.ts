import { type User, type InsertUser, type GeneratedDesign, type PromptLog, type InsertPromptLog, users, generatedDesigns, promptLogs } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveGeneratedDesign(design: Omit<GeneratedDesign, 'id'>): Promise<GeneratedDesign>;
  // [NEW] Method to update a design (e.g. add variations)
  updateGeneratedDesign(id: string, updates: Partial<GeneratedDesign>): Promise<GeneratedDesign | undefined>;
  getGeneratedDesigns(): Promise<GeneratedDesign[]>;
  getGeneratedDesign(id: string): Promise<GeneratedDesign | undefined>;

  createPromptLog(log: InsertPromptLog): Promise<PromptLog>;
  getPromptLogs(): Promise<PromptLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async saveGeneratedDesign(design: Omit<GeneratedDesign, 'id'>): Promise<GeneratedDesign> {
    const [saved] = await db
      .insert(generatedDesigns)
      .values([{ ...design, id: nanoid() }])
      .returning();
    return saved;
  }

  // [NEW] Implementation
  async updateGeneratedDesign(id: string, updates: Partial<GeneratedDesign>): Promise<GeneratedDesign | undefined> {
    const [updated] = await db
      .update(generatedDesigns)
      .set(updates)
      .where(eq(generatedDesigns.id, id))
      .returning();
    return updated;
  }

  async getGeneratedDesigns(): Promise<GeneratedDesign[]> {
    return await db
      .select()
      .from(generatedDesigns)
      .orderBy(desc(generatedDesigns.timestamp));
  }

  async getGeneratedDesign(id: string): Promise<GeneratedDesign | undefined> {
    const [design] = await db
      .select()
      .from(generatedDesigns)
      .where(eq(generatedDesigns.id, id));
    return design;
  }

  async createPromptLog(insertLog: InsertPromptLog): Promise<PromptLog> {
    const [log] = await db
      .insert(promptLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getPromptLogs(): Promise<PromptLog[]> {
    return await db
      .select()
      .from(promptLogs)
      .orderBy(desc(promptLogs.timestamp));
  }
}

export const storage = new DatabaseStorage();