"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Stream = {
  id: string;
  type: string;
  title: string;
  url: string;
  userId: string;
  extractedId: string;
  smallImg: string;
  bigImg: string;
  upvotes: number;
  userUpvoted?: boolean;
};

export default function DashboardPage() {
  const { data: session } = useSession();

  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<{
    id: string;
    title: string;
    thumb: string;
  } | null>(null);
  const [queue, setQueue] = useState<Stream[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Stream | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    const res = await fetch("/api/streams/my");
    const result = await res.json();

    if (!Array.isArray(result.streams)) return;

    const sorted = result.streams.sort(
      (a: any, b: any) => b.upvotes - a.upvotes
    );

    setQueue(sorted);
    setNowPlaying(sorted[0] || null);
  };

  const extractYouTubeId = (ytUrl: string) => {
    const match = ytUrl.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const handlePreview = async () => {
    const id = extractYouTubeId(url);
    if (!id) return;

    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    );
    const data = await res.json();
    setPreview({
      id,
      title: data.title,
      thumb: data.thumbnail_url,
    });
  };

  const handleSubmit = async () => {
    if (!preview) return;

    await fetch("/api/streams", {
      method: "POST",
      body: JSON.stringify({
        url,
        // creatorId: session?.user?.email,
        creatorId: "cmccbe49y0000ithc60dxzqqv", // hardcoded for now
      }),
      headers: { "Content-Type": "application/json" },
    });

    setUrl("");
    setPreview(null);
    // setQueue
    fetchQueue();
  };

  const toggleVote = async (streamId: string, alreadyVoted: boolean) => {
    const path = alreadyVoted ? "/api/streams/downvote" : "/api/streams/upvote";

    await fetch(path, {
      method: "POST",
      body: JSON.stringify({ streamId }),
      headers: { "Content-Type": "application/json" },
    });

    fetchQueue(); // Refresh
  };

  const playNext = () => {
    if (queue.length > 1) {
      setNowPlaying(queue[1]);
      setQueue(queue.slice(1));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-5xl flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">🎵 Muzer</h1>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded-md"
        >
          🔗 Share Room
        </button>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-xl bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
        <input
          type="text"
          placeholder="Paste a YouTube link..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 text-white rounded-md mb-4 focus:outline-none"
        />
        <div className="flex justify-between">
          <button
            onClick={handlePreview}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition rounded-md text-sm"
          >
            Preview
          </button>
          {preview && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 transition rounded-md text-sm"
            >
              Add to Queue
            </button>
          )}
        </div>

        {/* Thumbnail Preview */}
        {preview && (
          <div className="mt-4 text-center">
            <p className="text-sm mb-2">{preview.title}</p>
            <img
              src={preview.thumb}
              alt="thumbnail"
              width={320}
              height={180}
              className="mx-auto rounded-md"
            />
          </div>
        )}
      </div>

      {/* Now Playing */}
      {nowPlaying && (
        <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10 text-center">
          <h2 className="text-lg font-semibold mb-4">Now Playing</h2>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-64 rounded-md"
              src={`https://www.youtube.com/embed/${nowPlaying.extractedId}?autoplay=1&controls=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
          <p className="mt-4 text-sm text-gray-300">{nowPlaying.title}</p>
          <button
            onClick={playNext}
            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition"
          >
            ▶️ Play Next
          </button>
        </div>
      )}

      {/* Queue */}
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 text-center">Upcoming Queue</h2>
        <div className="space-y-4">
          {queue.slice(1).map((stream) => (
            <div
              key={stream.id}
              className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-4">
                <img
                  src={stream.smallImg}
                  alt={stream.title}
                  width={80}
                  height={45}
                  className="rounded-md"
                />
                <p className="text-sm text-gray-200 max-w-xs truncate">
                  {stream.title}
                </p>
              </div>
              <button
                onClick={() =>
                  toggleVote(stream.id, stream.userUpvoted ?? false)
                }
                className={`px-3 py-1 ${
                  stream.userUpvoted
                    ? "bg-red-600 hover:bg-red-700" // 🔽 Downvote style
                    : "bg-purple-600 hover:bg-purple-700" // ⬆ Upvote style
                } rounded-md text-sm`}
              >
                {stream.userUpvoted ? "🔽 " : "⬆"} {stream.upvotes}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
