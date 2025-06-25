import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

  const streams = await prismaClient.stream.findMany({
    include: {
      _count: {
        select: { upvotes: true },
      },
      upvotes: {
        where: {
          userId: user.id, // just check if current user upvoted
        },
      },
    },
  });

  return NextResponse.json({
    streams: streams.map(({ _count, upvotes, ...rest }) => ({
      ...rest,
      upvotes: _count.upvotes,
      userUpvoted: upvotes.length > 0,
    })),
  });
}
