import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";

// @ts-ignore
// import youtubesearchapi from "youtube-search-api";
import * as youtubesearchapi from "youtube-search-api";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

import { emitToSocket } from "@/app/lib/emitToSocket";
import { redis } from "@/app/lib/redis";

const YT_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?(?!.*\blist=)(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&]\S+)?$/;

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());

    const isYT = YT_REGEX.test(data.url);

    if (!isYT) {
      return NextResponse.json({ error: "wrong url" }, { status: 411 });
    }

    const extractedId = data.url.split("?v=")[1];
    const res = await youtubesearchapi.GetVideoDetails(extractedId);

    console.log("extractedId", extractedId);
    console.log("res", res);
    console.log(res.thumbnail.thumbnails);
    console.log(JSON.stringify(res.thumbnail.thumbnails));

    const thumbnails = res.thumbnail.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId: extractedId,
        type: "Youtube",
        title: res.title ?? "Can't find video",
        smallImg:
          (thumbnails.length > 1
            ? thumbnails[thumbnails.length - 2].url
            : thumbnails[thumbnails.length - 1].url) ??
          "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
        bigImg:
          thumbnails[thumbnails.length - 1].url ??
          "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
      },
    });

    await emitToSocket(data.creatorId, "song-added", { stream });

    await redis.del(`streams:${data.creatorId}`);

    return NextResponse.json(
      { message: "Stream added successfully", id: stream.id },

      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to create stream:", error);
    return NextResponse.json(
      { error: error.message || "unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json("Unauthorized", { status: 403 });
  }

  const cachedStreams = await redis.get(`streams:${creatorId}`);
  const cachedNowPlaying = await redis.get(`nowplaying:${creatorId}`);

  if (cachedStreams && cachedNowPlaying) {
    console.log("Returning streams from Redis cache");
    return NextResponse.json({
      streams: JSON.parse(cachedStreams),
      activeStream: JSON.parse(cachedNowPlaying),
    });
  }

  const user = await prismaClient.user.findUnique({
    where: {
      email: session.user.email,
    },
  });
  console.log("user", user);

  if (!user) {
    return NextResponse.json("Unauthorized", { status: 403 });
  }

  if (!creatorId || creatorId.length === 0) {
    return NextResponse.json(
      { error: "creatorId is required" },
      { status: 400 }
    );
  }

  const [streams, activeStream] = await Promise.all([
    await prismaClient.stream.findMany({
      where: {
        userId: creatorId,
        played: false,
      },
      include: {
        _count: {
          select: {
            upvotes: true,
          },
        },
        upvotes: {
          where: {
            userId: user.id,
          },
        },
      },
    }),
    prismaClient.currentStream.findFirst({
      where: {
        userId: creatorId,
      },
      include: {
        stream: true,
      },
    }),
  ]);
  const formattedStreams = streams.map(({ _count, upvotes, ...rest }) => ({
    ...rest,
    upvotes: _count.upvotes,
    userUpvoted: upvotes.length > 0,
  }));

  await redis.set(`streams:${creatorId}`, JSON.stringify(formattedStreams), {
    EX: 30, // 30 seconds
  });

  await redis.set(`nowplaying:${creatorId}`, JSON.stringify(activeStream), {
    EX: 30,
  });

  return NextResponse.json({
    streams: formattedStreams,
    activeStream,
  });
}
