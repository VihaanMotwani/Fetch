// src/app/api/ai/summary/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const base = process.env.BACKEND_URL || "http://localhost:8000"; // FastAPI
  const body = await req.text(); // forward raw body (JSON string)

  try {
    const r = await fetch(`${base}/ai/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e: any) {
    return new NextResponse(`Upstream error: ${e?.message || "unknown"}`, { status: 500 });
  }
}
