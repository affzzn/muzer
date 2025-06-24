import { prismaClient } from "@/app/lib/db";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    async signIn(params) {
      console.log("signIn", params);

      const { user } = params;
      if (!user) {
        console.error("Missing user in signIn callback");
        return false;
      }

      try {
        await prismaClient.user.create({
          data: {
            email: params.user.email ?? "",
            provider: "GOOGLE",
          },
        });
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }

      return true;
    },
  },
});

export { handler as GET, handler as POST };
