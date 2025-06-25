// import { prismaClient } from "@/app/lib/db";
// import NextAuth from "next-auth";
// import GoogleProvider from "next-auth/providers/google";

// const handler = NextAuth({
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID ?? "",
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
//     }),
//   ],

//   secret: process.env.NEXTAUTH_SECRET,

//   callbacks: {
//     async signIn({ user }) {
//       if (!user?.email) {
//         console.error("Missing email in signIn callback");
//         return false;
//       }

//       try {
//         const existingUser = await prismaClient.user.findUnique({
//           where: { email: user.email },
//         });

//         if (!existingUser) {
//           await prismaClient.user.create({
//             data: {
//               email: user.email,
//               provider: "GOOGLE",
//             },
//           });
//         }

//         return true;
//       } catch (error) {
//         console.error("Error in signIn callback:", error);
//         return false;
//       }
//     },
//   },
// });

// export { handler as GET, handler as POST };

import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prismaClient } from "@/app/lib/db";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;

      try {
        const existingUser = await prismaClient.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          await prismaClient.user.create({
            data: {
              email: user.email,
              provider: "GOOGLE",
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
