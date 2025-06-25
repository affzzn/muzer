"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Appbar() {
  const session = useSession();
  const router = useRouter();
  const user = session.data?.user;

  return (
    <nav className="bg-transparent backdrop-blur-md border-b border-gray-800 text-white px-6 py-4 flex justify-between items-center fixed top-0 left-0 w-full z-50">
      {/* Logo / App name */}
      <div
        className="text-2xl font-bold tracking-tight cursor-pointer select-none"
        onClick={() => router.push("/")}
      >
        muzer
      </div>

      {/* Auth buttons */}
      <div>
        {session.status === "loading" ? (
          <div className="animate-pulse text-gray-500">Loading...</div>
        ) : user ? (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 transition rounded-full text-sm font-medium shadow-sm"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 transition rounded-full text-sm font-medium shadow-sm"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </nav>
  );
}
