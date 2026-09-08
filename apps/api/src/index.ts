import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: "http://localhost:5173",
});

app.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();