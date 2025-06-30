export async function emitToSocket(
  creatorId: string,
  event: "song-added" | "song-voted" | "now-playing",
  data: any = {}
) {
  try {
    await fetch("http://localhost:3001/emit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: creatorId, // im still using creatorId as the room
        event,
        data,
      }),
    });
  } catch (e) {
    console.error(`Failed to emit ${event}:`, e);
  }
}
