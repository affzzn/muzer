import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());
    // prismaClient.stream.create({
    //   userId: data.creatorId,
    //   url: data.url,
    // });
  } catch (error) {
    return NextResponse.json(
      { error: "error while adding stream" },
      { status: 411 }
    );
  }
}
