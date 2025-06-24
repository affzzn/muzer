import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpvoteSchema = z.object({
  streamId: z.string(),
});

export async function POST(request: NextRequest) {
  // getting the user
  const session = await getServerSession();

  const user = await prismaClient.user.findFirst({
    where: {
      email: session?.user?.email || "",
    },
  });

  if (!user) {
    return NextResponse.json("Unauthorized", { status: 403 });
  }

  try {
    const data = UpvoteSchema.parse(await request.json());

    await prismaClient.upvote.delete({
      where: {
        userId_streamId: {
          streamId: data.streamId,
          userId: user.id,
        },
      },
    });
  } catch (error) {
    return NextResponse.json("error while downvoting", { status: 403 });
  }
}
