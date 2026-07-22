const { cp, mkdir, rm, writeFile } = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const server = path.join(dist, "server");
const assetFiles = [
  "ai-poster-detail.jpg",
  "profile-avatar.jpg",
  "wechat-icon.png",
  "wechat-qr.jpg",
  "xhs-service-icon.png",
];

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const worker = `const mimeTypes = ${JSON.stringify(mimeTypes, null, 2)};

function withHeaders(response, pathname) {
  const headers = new Headers(response.headers);
  const extension = pathname.match(/\\.[^.\\/]+$/)?.[0]?.toLowerCase();
  if (!headers.has("content-type") && extension && mimeTypes[extension]) {
    headers.set("content-type", mimeTypes[extension]);
  }
  if (pathname !== "/index.html" && extension) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  } else {
    headers.set("cache-control", "public, max-age=300");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fetchAsset(request, env, pathname) {
  if (!env?.ASSETS?.fetch) {
    return new Response("Missing static asset binding", { status: 500 });
  }

  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  assetUrl.search = "";
  return env.ASSETS.fetch(new Request(assetUrl, request));
}

export default {
  async fetch(request, env) {
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET, HEAD" },
      });
    }

    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const candidate = pathname === "/" || pathname.endsWith("/")
      ? "/index.html"
      : pathname;

    let response = await fetchAsset(request, env, candidate);
    if (response.status === 404 && !candidate.includes(".")) {
      response = await fetchAsset(request, env, "/index.html");
      return withHeaders(response, "/index.html");
    }

    return withHeaders(response, candidate);
  },
};
`;

const wranglerConfig = {
  name: "xueying-wang-ai-profile",
  main: "index.js",
  compatibility_date: "2026-05-15",
  compatibility_flags: ["nodejs_compat"],
  no_bundle: true,
  rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
  assets: { directory: "../client" },
  observability: { enabled: true },
};

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(client, { recursive: true });
  await mkdir(server, { recursive: true });

  await Promise.all([
    cp(path.join(root, "index.html"), path.join(client, "index.html")),
    cp(path.join(root, "styles.css"), path.join(client, "styles.css")),
    cp(path.join(root, "script.js"), path.join(client, "script.js")),
  ]);

  await mkdir(path.join(client, "assets"), { recursive: true });
  await Promise.all(
    assetFiles.map((file) => cp(
      path.join(root, "assets", file),
      path.join(client, "assets", file),
    )),
  );

  await writeFile(path.join(server, "index.js"), worker);
  await writeFile(
    path.join(server, "wrangler.json"),
    `${JSON.stringify(wranglerConfig, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
