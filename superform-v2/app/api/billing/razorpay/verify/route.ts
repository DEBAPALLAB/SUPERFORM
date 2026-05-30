import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_subscription_id, 
      razorpay_signature, 
      userId, 
      planType 
    } = await request.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !userId || !planType) {
      return NextResponse.json({ error: "Missing required verification properties" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("Verification failed: RAZORPAY_KEY_SECRET is not configured inside .env.local");
      return NextResponse.json({ error: "Razorpay secret is not configured" }, { status: 500 });
    }

    // Cryptographic signature verification for Razorpay Subscriptions
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    console.log("=== Razorpay Subscription Verification ===");
    console.log(`Payment ID: ${razorpay_payment_id}`);
    console.log(`Subscription ID: ${razorpay_subscription_id}`);
    console.log(`Received Signature: ${razorpay_signature}`);
    console.log(`Generated Signature: ${generatedSignature}`);
    console.log("=========================================");

    if (generatedSignature !== razorpay_signature) {
      console.error("Cryptographic signature verification failed: signature mismatch");
      return NextResponse.json({ 
        error: "Cryptographic signature verification failed",
        received: razorpay_signature,
        generated: generatedSignature
      }, { status: 400 });
    }

    console.log(`Payment verified cryptographically. Upgrading user ${userId} to ${planType}`);

    // Instantly elevate user plan in the database
    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        tier: planType === "studio" ? "Studio" : "Creator",
        subscription_status: "active",
        razorpay_subscription_id: razorpay_subscription_id,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Database update error inside verify route:", error);
      return NextResponse.json({ error: `Database update failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ verified: true });
  } catch (error: any) {
    console.error("Signature verification endpoint error:", error);
    return NextResponse.json({ error: error.message || "Verification processing failed" }, { status: 500 });
  }
}
