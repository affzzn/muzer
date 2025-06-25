import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const DeleteSchema = z.object({
  streamId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const user = await prismaClient.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { streamId } = DeleteSchema.parse(await request.json());

  try {
    // Delete related upvotes first
    await prismaClient.upvote.deleteMany({
      where: {
        streamId,
      },
    });

    // Then delete the stream
    await prismaClient.stream.delete({
      where: {
        id: streamId,
      },
    });

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Stream deletion failed:", error);
    return NextResponse.json(
      { error: "Failed to delete stream" },
      { status: 500 }
    );
  }
}
