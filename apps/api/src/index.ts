import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth.js";
import links from "./routes/links.js";
import { env } from "./env.js";

const app = new Hono();
const webAppOrigin = env.WEB_APP_URL
  ? new URL(env.WEB_APP_URL).origin
  : undefined;

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", ...(webAppOrigin ? [webAppOrigin] : [])],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.all("/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/api/links", links);

app.get("/", (c) => {
  return c.json({ name: "Keeply API", status: "ok" });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy" });
});

export default app;
