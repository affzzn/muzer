import StreamView from "@/app/components/StreamView";

export default function ({
  params: { creatorId },
}: {
  params: { creatorId: string };
}) {
  return <StreamView creatorId={creatorId} />;
}
