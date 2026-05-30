import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize a Supabase Admin Client using the Service Role Key to bypass RLS for webhook updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET is not configured. Signature verification skipped for debugging.");
    } else {
      // Cryptographic signature verification
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("Signature mismatch on Razorpay Webhook");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    console.log(`Processing Razorpay Webhook Event: ${eventType}`);

    // subscription.charged is dispatched on every successful recurring payment/subscription activation
    if (eventType === "subscription.charged" || eventType === "subscription.activated") {
      const subscription = payload.subscription.entity;
      const notes = subscription.notes || {};
      const userId = notes.userId;
      const planType = notes.planType; // 'creator' | 'studio'

      if (userId) {
        console.log(`Upgrading User ${userId} to Tier: ${planType}`);
        
        const { error } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            tier: planType === "studio" ? "Studio" : "Creator",
            subscription_status: "active",
            razorpay_subscription_id: subscription.id,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error("Database upgrade error inside webhook:", error);
          throw error;
        }
      } else {
        console.warn("No userId found in subscription notes payload.");
      }
    }

    // subscription.cancelled or subscription.halted are fired when subscription stops
    if (eventType === "subscription.cancelled" || eventType === "subscription.halted") {
      const subscription = payload.subscription.entity;
      const notes = subscription.notes || {};
      const userId = notes.userId;

      if (userId) {
        console.log(`Downgrading User ${userId} due to cancel event`);
        
        await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            tier: "Free",
            subscription_status: "inactive",
            updated_at: new Date().toISOString()
          });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Razorpay webhook internal error:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
