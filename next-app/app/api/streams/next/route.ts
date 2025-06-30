import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

import { emitToSocket } from "@/app/lib/emitToSocket";
import { redis } from "@/app/lib/redis";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json("Unauthorized", { status: 403 });
  }

  const user = await prismaClient.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    return NextResponse.json("Unauthorized", { status: 403 });
  }

  // Get the current stream
  const current = await prismaClient.currentStream.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      stream: true,
    },
  });

  // Mark current as played
  if (current?.streamId) {
    await prismaClient.stream.update({
      where: { id: current.streamId },
      data: {
        played: true,
        playedTimeStamp: new Date(),
      },
    });
  }

  // Get next most-upvoted unplayed stream
  const nextStream = await prismaClient.stream.findFirst({
    where: {
      userId: user.id,
      played: false,
    },
    orderBy: {
      upvotes: {
        _count: "desc",
      },
    },
  });

  // If no stream remains, clear the currentStream
  if (!nextStream) {
    await prismaClient.currentStream.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ stream: null });
  }

  // Set next stream as current
  await prismaClient.currentStream.upsert({
    where: { userId: user.id },
    update: { streamId: nextStream.id },
    create: {
      userId: user.id,
      streamId: nextStream.id,
    },
  });

  await emitToSocket(user.id, "now-playing", { stream: nextStream });

  await redis.del(`streams:${user.id}`);
  await redis.del(`nowplaying:${user.id}`);

  return NextResponse.json({ stream: nextStream });
}
