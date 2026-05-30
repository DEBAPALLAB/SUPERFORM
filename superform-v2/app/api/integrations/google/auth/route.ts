import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId") || "";
    const redirectTo = searchParams.get("redirectTo") || "";

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "GOOGLE_CLIENT_ID is not configured in .env.local" },
        { status: 500 }
      );
    }

    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/integrations/google/callback`;

    // We pass formId in the 'state' parameter so we can associate the linked sheet directly upon redirecting back!
    const state = JSON.stringify({ formId, redirectTo });

    const scopes = [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
      "openid",
      "email"
    ].join(" ");

    const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    oauthUrl.searchParams.set("client_id", clientId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("scope", scopes);
    oauthUrl.searchParams.set("access_type", "offline");
    oauthUrl.searchParams.set("prompt", "consent");
    oauthUrl.searchParams.set("state", state);

    return NextResponse.redirect(oauthUrl.toString());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
