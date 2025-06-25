"use client";

import StreamView from "../components/StreamView";

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

export default function DashboardPage() {
  return <StreamView creatorId="cmccbe49y0000ithc60dxzqqv" />;
}
