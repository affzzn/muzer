import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";

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

    await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId: data.url.split("?v=")[1],
        type: "Youtube",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "error while adding stream" },
      { status: 411 }
    );
  }
}
