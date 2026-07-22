const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function withHeaders(response, pathname) {
  const headers = new Headers(response.headers);
  const extension = pathname.match(/\.[^.\/]+$/)?.[0]?.toLowerCase();
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
