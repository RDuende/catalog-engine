import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyPluginAsync } from "fastify";

const publicDir = path.join(process.cwd(), "src", "modules", "catalog-studio", "public");

async function serve(reply: any, fileName: string, contentType: string) {
  const body = await readFile(path.join(publicDir, fileName));
  return reply.type(contentType).send(body);
}

export const catalogStudioRoutes: FastifyPluginAsync = async (app) => {
  app.get("/studio", async (_request, reply) => serve(reply, "index.html", "text/html; charset=utf-8"));
  app.get("/studio/app.js", async (_request, reply) => serve(reply, "app.js", "application/javascript; charset=utf-8"));
  app.get("/studio/styles.css", async (_request, reply) => serve(reply, "styles.css", "text/css; charset=utf-8"));
  app.get("/playground", async (_request, reply) => reply.redirect("/studio#recommendations"));
};
