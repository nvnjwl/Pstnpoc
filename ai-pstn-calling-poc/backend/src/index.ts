import http from "node:http";
import { env } from "./config/env.js";
import { createServer } from "./server.js";
import { WsHub } from "./ws/wsServer.js";
import { createCallRoutes } from "./routes/callRoutes.js";
import { createWebhookRoutes } from "./routes/webhookRoutes.js";

const { app, store } = createServer();
const server = http.createServer(app);
const wsHub = new WsHub(server, store);

app.use("/api/call", createCallRoutes(store, wsHub));
app.use("/api/exotel", createWebhookRoutes(store, wsHub));

server.listen(env.port, () => {
  console.log(`Server listening on ${env.port}`);
});
