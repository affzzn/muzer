import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export async function Redirect() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.data?.user) {
      // User is authenticated, redirect to dashboard
      router.push("/dashboard");
    }
  }, [session]);

  return null;
}
