import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateStr = searchParams.get("state") || "{}";

    if (!code) {
      return NextResponse.json({ error: "No authorization code returned" }, { status: 400 });
    }

    const { formId, redirectTo } = JSON.parse(stateStr);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Google OAuth credentials not configured" }, { status: 500 });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error_description || tokenData.error }, { status: 400 });
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user info (email) from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const googleUser = await userResponse.json();
    const googleEmail = googleUser.email || "Google Account";

    // Since we need to update the form's settings, let's create a server-side Supabase client using Service Key if available, or base Url.
    // If NEXT_PUBLIC_SUPABASE_URL and service key is not configured, we fall back to anon key.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

    if (formId) {
      // Fetch current form
      const { data: form, error: fetchErr } = await supabaseServer
        .from("forms")
        .select("*")
        .eq("id", formId)
        .single();

      if (form && !fetchErr) {
        const updatedQuestions = [...form.questions];
        if (updatedQuestions.length > 0) {
          const firstQ = updatedQuestions[0] as any;
          const currentSettings = firstQ.settings || {};
          
          updatedQuestions[0] = {
            ...firstQ,
            settings: {
              ...currentSettings,
              google_sheets_enabled: true,
              google_sheets_email: googleEmail,
              google_sheets_refresh_token: refresh_token || currentSettings.google_sheets_refresh_token || "",
              google_sheets_access_token: access_token,
              google_sheets_token_expiry: Date.now() + expires_in * 1000,
            }
          };

          await supabaseServer
            .from("forms")
            .update({ questions: updatedQuestions })
            .eq("id", formId);
        }
      }
    }

    if (redirectTo === "responses") {
      return NextResponse.redirect(`${origin}/responses/${formId}?google_sheets_auth=success`);
    }

    // Redirect the user back to the Integrations dashboard tab
    return NextResponse.redirect(`${origin}/dashboard/integrations?status=success&formId=${formId}`);
  } catch (error: any) {
    const origin = new URL(request.url).origin;
    const stateStr = new URL(request.url).searchParams.get("state") || "{}";
    let fId = "";
    let rTo = "";
    try {
      const parsed = JSON.parse(stateStr);
      fId = parsed.formId || "";
      rTo = parsed.redirectTo || "";
    } catch (_) {}

    if (rTo === "responses" && fId) {
      return NextResponse.redirect(`${origin}/responses/${fId}?google_sheets_auth=error&message=${encodeURIComponent(error.message)}`);
    }
    return NextResponse.redirect(`${origin}/dashboard/integrations?status=error&message=${encodeURIComponent(error.message)}`);
  }
}
