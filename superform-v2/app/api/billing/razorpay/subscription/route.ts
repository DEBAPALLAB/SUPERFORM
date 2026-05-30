import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const { planType, billingCycle, email, userId } = await request.json();

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured in .env.local" },
        { status: 500 }
      );
    }

    // Lazy instantiate Razorpay client to avoid server startup environment variable race conditions
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Dynamic map supporting both monthly and yearly Plan IDs
    const planKey = `${planType.toUpperCase()}_${billingCycle === "annual" ? "YEARLY" : "MONTHLY"}`;
    
    const PLAN_MAP: Record<string, string | undefined> = {
      CREATOR_MONTHLY: process.env.RAZORPAY_PLAN_CREATOR_MONTHLY,
      CREATOR_YEARLY: process.env.RAZORPAY_PLAN_CREATOR_YEARLY,
      STUDIO_MONTHLY: process.env.RAZORPAY_PLAN_STUDIO_MONTHLY,
      STUDIO_YEARLY: process.env.RAZORPAY_PLAN_STUDIO_YEARLY,
    };

    const planId = PLAN_MAP[planKey];
    if (!planId) {
      return NextResponse.json(
        { error: `Razorpay Plan ID not configured in .env.local for: ${planKey}` },
        { status: 400 }
      );
    }

    // Initialize Subscription on Razorpay
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 60, // set high enough for continuous monthly/yearly cycles
      quantity: 1,
      notes: {
        userId: userId || "",
        planType: planType || "",
        email: email || ""
      }
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay subscription endpoint error:", error);
    return NextResponse.json({ error: error.message || "Subscription creation failed" }, { status: 500 });
  }
}
