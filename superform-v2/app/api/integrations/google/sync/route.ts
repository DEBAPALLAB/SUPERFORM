import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getActiveToken(settings: any) {
  if (
    settings.google_sheets_access_token &&
    settings.google_sheets_token_expiry &&
    settings.google_sheets_token_expiry > Date.now() + 60000
  ) {
    return settings.google_sheets_access_token;
  }

  if (!settings.google_sheets_refresh_token) {
    throw new Error("No refresh token available. Re-authenticate Google Account.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: settings.google_sheets_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await tokenResponse.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { responseId, formId, answers } = await request.json();
    if (!formId || !responseId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch form
    const { data: form, error: fetchErr } = await supabaseServer
      .from("forms")
      .select("*")
      .eq("id", formId)
      .single();

    if (fetchErr || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const updatedQuestions = [...form.questions];
    if (updatedQuestions.length === 0) {
      return NextResponse.json({ error: "Form questions are empty" }, { status: 200 }); // No-op
    }

    const firstQ = updatedQuestions[0] as any;
    const settings = firstQ.settings || {};

    // If Google Sheets sync is not enabled, return early
    if (!settings.google_sheets_enabled || !settings.google_sheets_spreadsheet_id) {
      return NextResponse.json({ status: "Google Sheets sync is not active for this form" }, { status: 200 });
    }

    // Get an active OAuth token
    const accessToken = await getActiveToken(settings);

    // Filter questions excluding sections
    const activeQuestions = form.questions.filter((q: any) => q.type !== "section");

    // Construct the row array
    const row = [
      responseId,
      new Date().toISOString(),
      ...activeQuestions.map((q: any) => {
        const val = answers[q.id];
        return val !== undefined ? val : "";
      }),
    ];

    // Append to spreadsheet
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${settings.google_sheets_spreadsheet_id}/values/Sheet1!A1:append?valueInputOption=RAW`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );

    const appendData = await appendResponse.json();
    if (appendData.error) {
      return NextResponse.json({ error: appendData.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Google Sheets Submission Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
