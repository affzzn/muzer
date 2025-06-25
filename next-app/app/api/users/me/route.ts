// app/api/users/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prismaClient } from "@/app/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const user = await prismaClient.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ id: user.id });
}
