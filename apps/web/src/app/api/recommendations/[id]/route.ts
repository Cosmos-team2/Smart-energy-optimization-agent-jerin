import { NextRequest, NextResponse } from "next/server";
import { CANONICAL_REC_042 } from "@/services/apiService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Attempt proxy to real backend if available
  const backendUrl = process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";
  try {
    const backendRes = await fetch(`${backendUrl}/api/recommendations/${id}`, {
      cache: "no-store",
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }

    // Backend returned an error — propagate it
    const errorBody = await backendRes.text();
    console.error(`[route:GET /api/recommendations/${id}] Backend returned ${backendRes.status}: ${errorBody}`);
    return NextResponse.json(
      { error: `Backend error: ${backendRes.status}`, detail: errorBody },
      { status: backendRes.status }
    );
  } catch (err) {
    console.warn(`[route:GET /api/recommendations/${id}] Backend offline, falling back to canonical fixture:`, err);
  }

  return NextResponse.json({
    ...CANONICAL_REC_042,
    id,
  });
}
