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
  } catch {
    // Backend offline fallback
  }

  return NextResponse.json({
    ...CANONICAL_REC_042,
    id,
  });
}
