import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "../auth.js";
import { db } from "../db/index.js";
import { favoriteLinks } from "../db/schema.js";

type Variables = {
  userId: string;
};

const links = new Hono<{ Variables: Variables }>();

const createLinkSchema = z.object({
  title: z.string().trim().min(1).max(255),
  url: z
    .url()
    .trim()
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    }, "URL must use HTTP or HTTPS"),
  description: z.string().trim().max(2000).nullable().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

const updateLinkSchema = createLinkSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// Require an authenticated user for every endpoint.
links.use("*", async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", session.user.id);

  await next();
});

// GET /api/links
links.get("/", async (c) => {
  const userId = c.get("userId");

  const result = await db
    .select()
    .from(favoriteLinks)
    .where(eq(favoriteLinks.userId, userId))
    .orderBy(desc(favoriteLinks.createdAt));

  return c.json({ links: result });
});

// POST /api/links
links.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createLinkSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid request body",
        issues: parsed.error.issues,
      },
      400,
    );
  }

  const userId = c.get("userId");

  const [link] = await db
    .insert(favoriteLinks)
    .values({
      ...parsed.data,
      userId,
    })
    .returning();

  return c.json({ link }, 201);
});

// PATCH /api/links/:id
links.patch("/:id", async (c) => {
  const id = z.uuid().safeParse(c.req.param("id"));

  if (!id.success) {
    return c.json({ error: "Invalid link ID" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateLinkSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid request body",
        issues: parsed.error.issues,
      },
      400,
    );
  }

  const userId = c.get("userId");

  const [link] = await db
    .update(favoriteLinks)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(and(eq(favoriteLinks.id, id.data), eq(favoriteLinks.userId, userId)))
    .returning();

  if (!link) {
    return c.json({ error: "Link not found" }, 404);
  }

  return c.json({ link });
});

// DELETE /api/links/:id
links.delete("/:id", async (c) => {
  const id = z.uuid().safeParse(c.req.param("id"));

  if (!id.success) {
    return c.json({ error: "Invalid link ID" }, 400);
  }

  const userId = c.get("userId");

  const [deleted] = await db
    .delete(favoriteLinks)
    .where(and(eq(favoriteLinks.id, id.data), eq(favoriteLinks.userId, userId)))
    .returning({ id: favoriteLinks.id });

  if (!deleted) {
    return c.json({ error: "Link not found" }, 404);
  }

  return c.json({ success: true });
});

export default links;
