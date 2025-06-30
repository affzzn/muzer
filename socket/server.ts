import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

// Redis setup
const pubClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
const subClient = pubClient.duplicate();

await pubClient.connect();
await subClient.connect();

// HTTP Server for REST-based emit endpoint
const httpServer = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const { roomId, event, data } = JSON.parse(body);
        if (!roomId || !event) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing roomId or event" }));
          return;
        }

        console.log(`📢 Emitting '${event}' to room '${roomId}'`);
        io.to(roomId).emit(event, data ?? {});

        res.statusCode = 200;
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error("Failed to parse JSON body:", err);
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else {
    res.statusCode = 404;
    res.end("Not found");
  }
});

// Socket.IO Server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Attach Redis adapter
io.adapter(createAdapter(pubClient, subClient));

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(
    `🚀 WebSocket server with Redis listening at http://localhost:${PORT}`
  );
});
