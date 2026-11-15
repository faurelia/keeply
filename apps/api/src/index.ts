import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth.js";
import links from "./routes/links.js";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
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
