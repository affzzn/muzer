"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Appbar } from "./Appbar";
import { getSocket } from "@/app/lib/socket";
import YouTubePlayer from "youtube-player";

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

export default function StreamView({
  creatorId,
  playVideo = false,
}: {
  creatorId: string;
  playVideo?: boolean;
}) {
  const { data: session } = useSession();

  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<{
    id: string;
    title: string;
    thumb: string;
  } | null>(null);
  const [queue, setQueue] = useState<Stream[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Stream | null>(null);

  const videoPlayerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socketRef.current) {
      socketRef.current = socket;
      socket.emit("join-room", creatorId);
    }

    socket.on("song-added", refreshQueue);
    socket.on("song-voted", refreshQueue);
    socket.on("now-playing", (data: { stream: Stream }) => {
      setNowPlaying(data.stream);
    });

    return () => {
      socket.off("song-added", refreshQueue);
      socket.off("song-voted", refreshQueue);
      socket.off("now-playing");
      socket.disconnect();
    };
  }, [creatorId]);

  useEffect(() => {
    refreshQueue();
  }, [creatorId]);

  useEffect(() => {
    if (!playVideo || !videoPlayerRef.current || !nowPlaying?.extractedId)
      return;

    if (!playerRef.current) {
      playerRef.current = YouTubePlayer(videoPlayerRef.current);
      playerRef.current.on("stateChange", (event: any) => {
        if (event.data === 0) playNext(); // ended
      });
    }

    playerRef.current.loadVideoById(nowPlaying.extractedId);
  }, [nowPlaying, playVideo]);

  const refreshQueue = async () => {
    try {
      const res = await fetch(`/api/streams/?creatorId=${creatorId}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (!Array.isArray(json.streams)) return;

      const sorted = json.streams.sort(
        (a: Stream, b: Stream) => b.upvotes - a.upvotes
      );
      setQueue(sorted);

      const newActive = json.activeStream?.stream;
      if (newActive) {
        setNowPlaying((prev) => {
          if (!prev || prev.id !== newActive.id) return newActive;
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to refresh queue:", err);
    }
  };

  const extractYouTubeId = (ytUrl: string) => {
    const match = ytUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const handlePreview = async () => {
    const id = extractYouTubeId(url);
    if (!id) return;

    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
      );
      const data = await res.json();
      setPreview({ id, title: data.title, thumb: data.thumbnail_url });
    } catch (err) {
      alert("❌ Failed to fetch video preview. Check your link.");
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;

    await fetch("/api/streams", {
      method: "POST",
      body: JSON.stringify({ url, creatorId }),
      headers: { "Content-Type": "application/json" },
    });

    setUrl("");
    setPreview(null);
  };

  const toggleVote = async (streamId: string, alreadyVoted: boolean) => {
    const path = alreadyVoted ? "/api/streams/downvote" : "/api/streams/upvote";
    await fetch(path, {
      method: "POST",
      body: JSON.stringify({ streamId }),
      headers: { "Content-Type": "application/json" },
    });
  };

  const playNext = async () => {
    const res = await fetch("/api/streams/next", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (json.stream) {
      setNowPlaying(json.stream);
    }
  };

  const handleShare = () => {
    const shareableUrl = `${window.location.origin}/creator/${creatorId}`;
    navigator.clipboard.writeText(shareableUrl);
    alert("Room link copied to clipboard!");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-6 pt-28 pb-12">
      <Appbar />
      <div className="w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row gap-10">
        {/* Queue */}
        <div className="w-full lg:w-2/3">
          <h2 className="text-2xl font-semibold mb-6">🎵 Song Voting Queue</h2>
          <div className="space-y-4">
            {queue
              .filter((s) => s.id !== nowPlaying?.id)
              .map((stream) => (
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
                    {stream.userUpvoted ? "🔽" : "⬆"} {stream.upvotes}
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/3 flex flex-col gap-8">
          <div className="flex justify-end">
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded-md"
            >
              🔗 Share Room
            </button>
          </div>

          {/* Add Song Input */}
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
                {playVideo ? (
                  <div ref={videoPlayerRef} className="w-full h-64" />
                ) : (
                  <img
                    src={nowPlaying.bigImg}
                    alt={nowPlaying.title}
                    className="w-full h-64 object-cover rounded"
                  />
                )}
              </div>
              <p className="mt-4 text-sm text-gray-300">{nowPlaying.title}</p>
              {playVideo && (
                <button
                  onClick={playNext}
                  className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition"
                >
                  ▶️ Play Next
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
