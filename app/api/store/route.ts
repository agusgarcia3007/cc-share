import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { generateId } from "@/lib/id";

export async function POST(request: NextRequest) {
  try {
    const { encrypted, iv, ttl, reads } = await request.json();

    if (!encrypted || !iv) {
      return NextResponse.json(
        { error: "Missing encrypted data or iv" },
        { status: 400 }
      );
    }

    const id = generateId();
    const data = {
      encrypted,
      iv,
      reads: reads || null,
      remainingReads: reads || null,
      createdAt: Date.now(),
    };

    if (ttl && ttl > 0) {
      await redis.setex(id, ttl * 3600, data);
    } else {
      await redis.set(id, data);
    }

    const expiresAt = ttl
      ? new Date(Date.now() + ttl * 3600 * 1000).toISOString()
      : null;

    return NextResponse.json({
      id,
      ttl: ttl || null,
      reads: reads || null,
      expiresAt,
      url: `${request.nextUrl.origin}/unseal/${id}`,
    });
  } catch (error) {
    console.error("Store error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
