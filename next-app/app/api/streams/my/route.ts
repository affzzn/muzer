// import { prismaClient } from "@/app/lib/db";
// import { getServerSession } from "next-auth";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   const session = await getServerSession();

//   const user = await prismaClient.user.findFirst({
//     where: {
//       email: session?.user?.email || "",
//     },
//   });

//   if (!user) {
//     return NextResponse.json("Unauthorized", { status: 403 });
//   }

//   // if user exists, fetch their streams
//   const streams = await prismaClient.stream.findMany({
//     where: {
//       userId: user.id,
//     },
//     include: {
//       _count: {
//         select: {
//           upvotes: true,
//         },
//       },
//       // Include upvotes count
//       upvotes: {
//         where: {
//           userId: user.id,
//         },
//       },
//     },
//   });

//   if (!streams) {
//     return NextResponse.json("No streams found", { status: 404 });
//   }
//   if (streams.length === 0) {
//     return NextResponse.json("No streams found", { status: 404 });
//   }

//   return NextResponse.json(
//     {
//       streams: streams.map(({ _count, ...rest }) => ({
//         ...rest,
//         upvotes: _count.upvotes,
//       })),
//     },

//     { status: 200 }
//   );
// }

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
    where: {
      userId: user.id,
    },
    include: {
      _count: {
        select: { upvotes: true },
      },
    },
  });

  return NextResponse.json({
    streams: streams.map(({ _count, ...rest }) => ({
      ...rest,
      upvotes: _count.upvotes,
    })),
  });
}
