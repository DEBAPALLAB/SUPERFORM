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
    const { formId } = await request.json();
    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
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
      return NextResponse.json({ error: "Form questions are empty" }, { status: 400 });
    }

    const firstQ = updatedQuestions[0] as any;
    const settings = firstQ.settings || {};

    if (!settings.google_sheets_refresh_token) {
      return NextResponse.json({ error: "Google Account is not connected" }, { status: 400 });
    }

    // 1. Get an active OAuth access token
    const accessToken = await getActiveToken(settings);

    // 2. Create a new Spreadsheet
    const createSheetResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: `Superform: ${form.title} Submissions`,
        },
      }),
    });

    const sheetData = await createSheetResponse.json();
    if (sheetData.error) {
      return NextResponse.json({ error: sheetData.error.message }, { status: 400 });
    }

    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl;

    // 3. Create header columns based on questions
    const activeQuestions = form.questions.filter((q: any) => q.type !== "section");
    const headers = [
      "Submission ID",
      "Submitted At",
      ...activeQuestions.map((q: any) => q.label || `Question ${q.id}`),
    ];

    const appendHeadersResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=RAW`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [headers],
        }),
      }
    );

    const appendData = await appendHeadersResponse.json();
    if (appendData.error) {
      return NextResponse.json({ error: appendData.error.message }, { status: 400 });
    }

    // --- 3.5 Backfill Existing Responses & Answers ---
    const { data: responses } = await supabaseServer
      .from("responses")
      .select("*")
      .eq("form_id", formId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true });

    if (responses && responses.length > 0) {
      const responseIds = responses.map((r: any) => r.id);
      const { data: answers } = await supabaseServer
        .from("answers")
        .select("*")
        .in("response_id", responseIds);

      if (answers) {
        // Construct bulk rows matching column index
        const rowsToAppend = responses.map((response: any) => {
          return [
            response.id,
            response.completed_at || response.started_at || new Date().toISOString(),
            ...activeQuestions.map((q: any) => {
              const qUuid = `00000000-0000-0000-0000-${String(q.id).padStart(12, "0")}`;
              const answerObj = answers.find(
                (a: any) => a.response_id === response.id && a.question_id === qUuid
              );
              return answerObj ? answerObj.value : "";
            }),
          ];
        });

        // Bulk append historical responses starting at Row 2
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:append?valueInputOption=RAW`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              values: rowsToAppend,
            }),
          }
        );
      }
    }

    // 4. Update the form settings inside Supabase
    updatedQuestions[0] = {
      ...firstQ,
      settings: {
        ...settings,
        google_sheets_spreadsheet_id: spreadsheetId,
        google_sheets_spreadsheet_url: spreadsheetUrl,
        google_sheets_enabled: true,
      },
    };

    const { error: updateErr } = await supabaseServer
      .from("forms")
      .update({ questions: updatedQuestions })
      .eq("id", formId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
