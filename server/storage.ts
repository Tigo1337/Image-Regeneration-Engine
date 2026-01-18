import { type User, type UpsertUser, type GeneratedDesign, type PromptLog, type InsertPromptLog, users, generatedDesigns, promptLogs } from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User | undefined>;
  saveGeneratedDesign(design: Omit<GeneratedDesign, 'id'>): Promise<GeneratedDesign>;
  updateGeneratedDesign(id: string, updates: Partial<GeneratedDesign>): Promise<GeneratedDesign | undefined>;
  getGeneratedDesigns(userId?: string | null): Promise<GeneratedDesign[]>;
  getGeneratedDesign(id: string): Promise<GeneratedDesign | undefined>;

  createPromptLog(log: InsertPromptLog): Promise<PromptLog>;
  getPromptLogs(): Promise<PromptLog[]>;

  // [NEW] LAW 25 COMPLIANCE: Right to Erasure
  deleteAllUserData(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...stripeInfo, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async saveGeneratedDesign(design: Omit<GeneratedDesign, 'id'>): Promise<GeneratedDesign> {
    const [saved] = await db
      .insert(generatedDesigns)
      .values([{ ...design, id: nanoid() }])
      .returning();
    return saved;
  }

  async updateGeneratedDesign(id: string, updates: Partial<GeneratedDesign>): Promise<GeneratedDesign | undefined> {
    const [updated] = await db
      .update(generatedDesigns)
      .set(updates)
      .where(eq(generatedDesigns.id, id))
      .returning();
    return updated;
  }

  async getGeneratedDesigns(userId?: string | null): Promise<GeneratedDesign[]> {
    if (userId) {
      return await db
        .select()
        .from(generatedDesigns)
        .where(or(eq(generatedDesigns.userId, userId), isNull(generatedDesigns.userId)))
        .orderBy(desc(generatedDesigns.timestamp));
    }
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

  // [NEW] LAW 25: Implementation of Right to Erasure
  async deleteAllUserData(userId: string): Promise<void> {
    // 1. Delete all generated designs associated with the user
    await db.delete(generatedDesigns).where(eq(generatedDesigns.userId, userId));

    // 2. Delete the user record itself
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();