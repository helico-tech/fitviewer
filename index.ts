import homepage from "./src/app/index.html";

Bun.serve({
  routes: {
    "/": homepage,
    "/worker.js": async () => {
      const result = await Bun.build({
        entrypoints: ["./src/lib/worker.ts"],
        target: "browser",
      });
      return new Response(result.outputs[0], {
        headers: { "Content-Type": "application/javascript" },
      });
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});
