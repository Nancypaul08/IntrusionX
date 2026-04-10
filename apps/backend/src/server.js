import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { registerSocket } from "./services/socketService.js";
import { seedDefaultAdmin, seedRules } from "./services/seedService.js";

async function bootstrap() {
  console.log("bootstrap: connectDatabase:start");
  await connectDatabase(env.mongoUri);
  console.log("bootstrap: connectDatabase:done");
  await seedDefaultAdmin();
  console.log("bootstrap: seedDefaultAdmin:done");
  await seedRules();
  console.log("bootstrap: seedRules:done");

  const app = createApp();
  console.log("bootstrap: createApp:done");
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit("system:ready", { message: "Realtime channel connected" });
  });

  registerSocket(io);
  console.log("bootstrap: registerSocket:done");

  server.listen(env.port, () => {
    console.log(`IntrusionX backend running on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
