import { NextResponse } from "next/server";
import { createMockWeatherEnvelope } from "@/services/mcpAdapter";

export async function POST() {
  const envelope = createMockWeatherEnvelope();
  return NextResponse.json(envelope);
}

export async function GET() {
  const envelope = createMockWeatherEnvelope();
  return NextResponse.json(envelope);
}
