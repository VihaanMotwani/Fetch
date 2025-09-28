// src/app/api/ml/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const top_k = searchParams.get("top_k");

  if (!name) {
    return NextResponse.json({ error: "Missing ?name=" }, { status: 400 });
  }

  const base = process.env.BACKEND_URL || "http://localhost:8000";
  const qs = new URLSearchParams({ name });
  if (top_k) qs.set("top_k", top_k);

  try {
    const r = await fetch(`${base}/ml/recommendations?${qs.toString()}`);
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upstream error" }, { status: 500 });
  }
}
