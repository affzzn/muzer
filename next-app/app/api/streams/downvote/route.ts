import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    await prismaClient.upvote.delete({
      where: {
        userId_streamId: {
          streamId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json(
      { message: "Downvoted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === "P2025") {
      // Not found (already removed or never voted)
      return NextResponse.json(
        { message: "Vote already removed" },
        { status: 200 }
      );
    }

    console.error("Downvote error:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
