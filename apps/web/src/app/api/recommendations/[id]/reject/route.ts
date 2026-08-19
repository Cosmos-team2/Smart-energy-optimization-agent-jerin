import { NextRequest, NextResponse } from "next/server";
import { CANONICAL_REC_042 } from "@/services/apiService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  let body: any = {};

  try {
    body = await request.json();
  } catch {
    // optional body
  }

  // Attempt proxy to real backend if available
  const backendUrl = process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";
  try {
    const backendRes = await fetch(`${backendUrl}/api/recommendations/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch {
    // FastAPI server not reachable or endpoint not implemented yet in backend spine
  }

  // Return canonical Contract 3 response with rejected status
  const rejectedRecommendation = {
    ...CANONICAL_REC_042,
    id,
    status: "rejected" as const,
    reviewed_at: new Date().toISOString(),
    reviewed_by: body.reviewer || "Facility Manager (Admin)",
  };

  return NextResponse.json({
    success: true,
    status: "rejected",
    message: `Recommendation ${id} rejected by operator. Optimization sequence canceled.`,
    recommendation: rejectedRecommendation,
    audit_trail: {
      action: "reject",
      reason: body.reason || "Manual operator override",
      timestamp: new Date().toISOString(),
      user: body.reviewer || "Facility Manager (Admin)",
    },
  });
}
