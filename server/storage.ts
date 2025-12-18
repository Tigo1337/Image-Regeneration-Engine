import { type User, type InsertUser, type GeneratedDesign, users, generatedDesigns } from "@shared/schema";
import { db } from "./db"; // Assumes you create this simple connection file
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveGeneratedDesign(design: Omit<GeneratedDesign, 'id'>): Promise<GeneratedDesign>;
  getGeneratedDesigns(): Promise<GeneratedDesign[]>;
  getGeneratedDesign(id: string): Promise<GeneratedDesign | undefined>;
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
      .values(design)
      .returning();
    return saved;
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
}

export const storage = new DatabaseStorage();