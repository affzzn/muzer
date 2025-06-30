"use client";

import { useEffect, useState } from "react";
import StreamView from "../components/StreamView";

export default function DashboardPage() {
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorId = async () => {
      const res = await fetch("/api/users/me");
      const data = await res.json();

      if (res.ok && data.id) {
        setCreatorId(data.id);
      }

      setLoading(false);
    };

    fetchCreatorId();
  }, []);

  if (loading) {
    return <div className="text-white p-10">Loading...</div>;
  }

  if (!creatorId) {
    return (
      <div className="text-red-500 p-10">
        Unauthorized or failed to fetch user ID
      </div>
    );
  }

  return <StreamView creatorId={creatorId} playVideo={true} />;
}
