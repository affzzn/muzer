// components/appbar.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Appbar() {
  const session = useSession();
  const router = useRouter();
  const user = session.data?.user;

  return (
    <nav className="bg-gray-900 text-white px-5 py-4 flex justify-between items-center">
      {/* App name */}
      <div
        className="text-2xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        muzer
      </div>

      {/* Auth buttons */}
      <div className="flex items-center space-x-3">
        {session.status === "loading" ? (
          <div className="animate-pulse text-gray-500">Loading...</div>
        ) : user ? (
          <>
            <span className="hidden sm:block">Hi, {user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 bg-red-600 rounded-md text-sm font-medium hover:bg-red-500 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => signIn("google")}
              className="px-4 py-2 bg-purple-600 rounded-md text-sm font-medium hover:bg-purple-700 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/auth?authType=signUp")}
              className="px-4 py-2 border border-purple-600 rounded-md text-sm font-medium hover:bg-purple-700 transition"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
