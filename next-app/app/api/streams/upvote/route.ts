import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { emitToSocket } from "@/app/lib/emitToSocket";
import { redis } from "@/app/lib/redis";

const UpvoteSchema = z.object({
  streamId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = await prismaClient.user.findFirst({
    where: { email: session?.user?.email || "" },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { streamId } = UpvoteSchema.parse(await request.json());

  try {
    await prismaClient.upvote.create({
      data: {
        streamId,
        userId: user.id,
      },
    });

    // Emit to socket to notify clients about the upvote
    const stream = await prismaClient.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    await emitToSocket(stream.userId, "song-voted");
    await redis.del(`streams:${stream.userId}`);

    return NextResponse.json(
      { message: "Upvoted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      // Unique constraint violation: already upvoted
      return NextResponse.json({ message: "Already upvoted" }, { status: 200 });
    }

    console.error("Upvote error:", error);
    return NextResponse.json({ error: "Failed to upvote" }, { status: 500 });
  }
}
