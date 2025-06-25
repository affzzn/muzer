"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Appbar } from "./Appbar";

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

// const creatorId = "cmccbe49y0000ithc60dxzqqv";

export default function StreamView({ creatorId }: { creatorId: string }) {
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
    const res = await fetch(`/api/streams/?creatorId=${creatorId}`);
    const result = await res.json();

    if (!Array.isArray(result.streams)) return;

    const sorted = result.streams.sort(
      (a: any, b: any) => b.upvotes - a.upvotes
    );

    setQueue(sorted);

    // Preserve the current nowPlaying if it's still in the list
    if (!nowPlaying || !sorted.find((s: Stream) => s.id === nowPlaying.id)) {
      setNowPlaying(sorted[0] || null);
    }
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
        creatorId: creatorId, // hardcoded
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

  const playNext = async () => {
    if (!nowPlaying || queue.length <= 1) return;

    // Delete the current song from DB
    await fetch("/api/streams/delete", {
      method: "POST",
      body: JSON.stringify({ streamId: nowPlaying.id }),
      headers: { "Content-Type": "application/json" },
    });

    // Play next
    setNowPlaying(queue[1]);
    fetchQueue();
  };

  const handleShare = () => {
    const shareableUrl = `${window.location.hostname}/creator/${creatorId}`;
    navigator.clipboard.writeText(shareableUrl);
    alert("Room link copied to clipboard!");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-6 pt-28 pb-12">
      <Appbar />

      <div className="w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row gap-10">
        {/* Left: Queue */}
        <div className="w-full lg:w-2/3">
          <h2 className="text-2xl font-semibold mb-6">🎵 Song Voting Queue</h2>
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
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  } rounded-md text-sm`}
                >
                  {stream.userUpvoted ? "🔽 " : "⬆"} {stream.upvotes}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Share, Input, Now Playing */}
        <div className="w-full lg:w-1/3 flex flex-col gap-8">
          {/* Share Button */}
          <div className="flex justify-end">
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded-md"
            >
              🔗 Share Room
            </button>
          </div>

          {/* Input Section */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
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
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
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
        </div>
      </div>
    </main>
  );
}
