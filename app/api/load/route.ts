import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const rawData = await redis.get(id);
    if (!rawData) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }

    let data: {
      encrypted: string;
      iv: string;
      remainingReads: number | null;
    };

    if (typeof rawData === "string") {
      data = JSON.parse(rawData);
    } else {
      data = rawData as {
        encrypted: string;
        iv: string;
        remainingReads: number | null;
      };
    }
    let remainingReads = data.remainingReads;

    if (remainingReads !== null) {
      remainingReads -= 1;

      if (remainingReads <= 0) {
        await redis.del(id);
        remainingReads = 0;
      } else {
        data.remainingReads = remainingReads;
        const ttl = await redis.ttl(id);
        if (ttl > 0) {
          await redis.setex(id, ttl, data);
        } else {
          await redis.set(id, data);
        }
      }
    }

    return NextResponse.json({
      encrypted: data.encrypted,
      iv: data.iv,
      remainingReads,
    });
  } catch (error) {
    console.error("Load error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
