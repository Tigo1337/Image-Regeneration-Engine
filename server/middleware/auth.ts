import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Helper to extract userId from authenticated request (or null for anonymous)
export function getUserId(req: Request): string | null {
  const user = req.user as any;
  return user?.claims?.sub || null;
}

// Helper to check if a user is a super admin (bypasses billing)
export function isSuperAdmin(userId: string | null): boolean {
  if (!userId) return false;
  const superAdminIds = process.env.SUPER_ADMIN_IDS || '';
  const adminList = superAdminIds.split(',').map(id => id.trim()).filter(Boolean);
  return adminList.includes(userId);
}

// Middleware to check if user has active subscription for generation endpoints
export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ 
      error: "Authentication required", 
      code: "AUTH_REQUIRED",
      message: "Please sign in to use this feature."
    });
  }

  // Super admins bypass all billing checks
  if (isSuperAdmin(userId)) {
    console.log(`Super admin ${userId} - bypassing subscription check`);
    (req as any).isSuperAdmin = true;
    return next();
  }

  try {
    const user = await storage.getUser(userId);

    if (!user?.stripeSubscriptionId) {
      return res.status(402).json({ 
        error: "Subscription required", 
        code: "SUBSCRIPTION_REQUIRED",
        message: "A Pro subscription is required to generate designs. Visit the pricing page to subscribe."
      });
    }

    // Check subscription status via Stripe (dynamic import to avoid circular deps)
    const { stripeService } = await import("../stripeService");
    const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);

    if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
      return res.status(402).json({ 
        error: "Subscription inactive", 
        code: "SUBSCRIPTION_INACTIVE",
        message: "Your subscription is not active. Please renew your subscription to continue."
      });
    }

    // Attach subscription info to request for usage reporting
    (req as any).subscriptionInfo = {
      subscriptionId: user.stripeSubscriptionId,
      customerId: user.stripeCustomerId
    };

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    return res.status(500).json({ error: "Failed to verify subscription status" });
  }
}

// Helper to report usage to Stripe after successful generation
export async function reportGenerationUsage(req: Request, qualityTier: string) {
  // Super admins don't get billed
  if ((req as any).isSuperAdmin) {
    console.log("Super admin - skipping usage reporting");
    return;
  }

  try {
    const subscriptionInfo = (req as any).subscriptionInfo;
    if (!subscriptionInfo?.customerId) return;

    const { stripeService } = await import("../stripeService");

    // Use meter events for usage-based billing (Stripe API 2025+)
    await stripeService.reportMeterEvent(subscriptionInfo.customerId, qualityTier, 1);
    console.log(`Reported meter event for quality: ${qualityTier}`);
  } catch (error) {
    console.error("Usage reporting error:", error);
    // Don't fail the request if usage reporting fails
  }
}
