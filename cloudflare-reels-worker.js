/**
 * JU 52nd Batch Day - Telegram Video Edge Caching Proxy
 * Cloudflare Worker (Free Plan - 100,000 req/day)
 *
 * Edge Cache in Dhaka / Kolkata
 * Fully supports HTTP 206 Range requests (video scrubbing & mobile HTML5 video)
 * Auto-sanitizes malformed MP4 audio packets (prevents Chromium/WebKit PIPELINE_ERROR_DECODE)
 */

function getMimeType(pathname, upstreamType) {
  const p = (pathname || "").toLowerCase();
  if (p.endsWith(".mp4") || p.includes("/videos/")) return "video/mp4";
  if (p.endsWith(".webm")) return "video/webm";
  if (p.endsWith(".mov")) return "video/quicktime";
  if (p.endsWith(".m4v")) return "video/x-m4v";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg") || p.includes("/photos/")) return "image/jpeg";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".mp3")) return "audio/mpeg";
  if (p.endsWith(".m4a")) return "audio/mp4";
  if (upstreamType && upstreamType !== "application/octet-stream") return upstreamType;
  return "video/mp4";
}

/**
 * Sanitizes MP4 buffer by disabling corrupted audio tracks where sample 0 has length <= 4
 * (e.g. 2-byte AudioSpecificConfig 0x1188 incorrectly written to stsz table, which crashes Chrome/Safari decoders)
 */
function sanitizeMp4Buffer(arrayBuffer) {
  try {
    const u8 = new Uint8Array(arrayBuffer);
    const len = u8.length;
    // Scan within first 128KB where moov/trak/stsz boxes reside
    const scanLimit = Math.min(len - 24, 131072);

    for (let i = 0; i < scanLimit; i++) {
      // Find 'stsz' box (0x73, 0x74, 0x73, 0x7a)
      if (
        u8[i] === 0x73 &&
        u8[i + 1] === 0x74 &&
        u8[i + 2] === 0x73 &&
        u8[i + 3] === 0x7a
      ) {
        const view = new DataView(arrayBuffer, i);
        const defaultSize = view.getUint32(8);
        const sampleCount = view.getUint32(12);

        // If sample 0 size is <= 4 bytes (e.g. 2-byte header), this audio packet causes browser decode crash
        if (defaultSize === 0 && sampleCount > 1) {
          const sample0Size = view.getUint32(16);
          if (sample0Size > 0 && sample0Size <= 4) {
            // Find enclosing 'trak' backwards
            for (let j = i; j >= 0; j--) {
              if (
                u8[j] === 0x74 &&
                u8[j + 1] === 0x72 &&
                u8[j + 2] === 0x61 &&
                u8[j + 3] === 0x6b
              ) {
                // Found 'trak'. Now find 'tkhd' right inside it (within 128 bytes)
                for (let k = j; k < Math.min(j + 128, len - 8); k++) {
                  if (
                    u8[k] === 0x74 &&
                    u8[k + 1] === 0x6b &&
                    u8[k + 2] === 0x68 &&
                    u8[k + 3] === 0x64
                  ) {
                    // Disable track by clearing track_enabled flag in tkhd
                    // tkhd: 4 bytes tag ('tkhd'), 1 byte version, 3 bytes flags
                    // flags are at k + 5, k + 6, k + 7. Set to 0 to disable track
                    u8[k + 7] = 0;
                    break;
                  }
                }
                break;
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("sanitizeMp4Buffer error:", e);
  }
  return arrayBuffer;
}

export default {
  async fetch(request, env, ctx) {
    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);

    // 2. Secure Telegram Upload Endpoint (Keeps Bot Token 100% on Cloudflare Server)
    if (request.method === "POST" && (url.pathname === "/api/upload-reel" || url.pathname === "/upload")) {
      const botToken = env.TELEGRAM_BOT_TOKEN || "8851131748:AAFNALYNcT8nneTE9nhjpveJa8wDvukKXtg";
      const chatId = env.TELEGRAM_CHAT_ID || "-1003827033172";

      try {
        const formData = await request.formData();
        if (!formData.has("chat_id")) {
          formData.set("chat_id", chatId);
        }
        formData.set("supports_streaming", "true");

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
          method: "POST",
          body: formData,
        });

        const tgJson = await tgRes.json();
        return new Response(JSON.stringify(tgJson), {
          status: tgRes.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, description: err.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // 3. bKash Merchant API Diagnostic Test Endpoint
    if (url.pathname === "/api/test-bkash" && request.method === "POST") {
      try {
        const body = await request.json();
        const targetBase =
          body.environment === "production"
            ? "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout"
            : "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout";

        const grantRes = await fetch(`${targetBase}/token/grant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: body.username || "",
            password: body.password || "",
          },
          body: JSON.stringify({
            app_key: body.app_key || "",
            app_secret: body.app_secret || "",
          }),
        });

        const rawText = await grantRes.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          try {
            // Clean unescaped newlines/control chars inside string literals from bKash server
            const cleaned = rawText.replace(/[\r\n\t]+/g, " ").trim();
            data = JSON.parse(cleaned);
          } catch {
            data = { statusCode: "PARSE_ERR", statusMessage: rawText };
          }
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ statusCode: "5000", statusMessage: err.message }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Health check endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", service: "ju52-reels-cdn", region: "edge" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Extract Telegram file path e.g. /file/bot<TOKEN>/videos/file_4.mp4
    let targetPath = url.pathname;
    if (!targetPath.startsWith("/file/")) {
      targetPath = "/file/" + targetPath.replace(/^\/+/, "");
    }
    const targetUrl = `https://api.telegram.org${targetPath}`;

    // Canonical cache key: MUST NOT include Range header or query params
    const cacheUrl = new URL(url.origin + url.pathname);
    const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
    const cache = caches.default;

    const rangeHeader = request.headers.get("range");
    const mimeType = getMimeType(url.pathname);

    // Explicit purge trigger (?purge=1)
    if (url.searchParams.get("purge") === "1") {
      try {
        await cache.delete(cacheKey);
      } catch (e) {}
    }

    // 2. Try to serve from Edge Cache
    try {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse && url.searchParams.get("purge") !== "1") {
        if (rangeHeader) {
          return await serveRangeResponse(cachedResponse, rangeHeader, "HIT-EDGE-DHAKA", mimeType);
        }
        const buffer = sanitizeMp4Buffer(await cachedResponse.arrayBuffer());
        const responseHeaders = new Headers(cachedResponse.headers);
        responseHeaders.set("Content-Type", mimeType);
        responseHeaders.set("Content-Disposition", "inline");
        responseHeaders.set("X-Cache-Status", "HIT-EDGE-DHAKA");
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set(
          "Access-Control-Expose-Headers",
          "Content-Length, Content-Range, Accept-Ranges, X-Cache-Status, Content-Disposition"
        );
        return new Response(buffer, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: responseHeaders,
        });
      }
    } catch (e) {
      console.warn("Cache read error:", e);
    }

    // 3. Cache Miss: Fetch full file from Telegram (strip Range to ensure 200 OK response from Telegram)
    const upstreamResponse = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JU52-Edge-Proxy",
      },
    });

    if (!upstreamResponse.ok) {
      return upstreamResponse;
    }

    let videoBuffer = await upstreamResponse.arrayBuffer();
    if (mimeType.startsWith("video/")) {
      videoBuffer = sanitizeMp4Buffer(videoBuffer);
    }
    const totalSize = videoBuffer.byteLength;

    // Headers for cache storage (MUST be 200 OK for caches.default.put)
    const storeHeaders = new Headers();
    storeHeaders.set("Content-Type", mimeType);
    storeHeaders.set("Content-Length", totalSize.toString());
    storeHeaders.set("Accept-Ranges", "bytes");
    storeHeaders.set("Content-Disposition", "inline");
    storeHeaders.set("Access-Control-Allow-Origin", "*");
    storeHeaders.set(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range, Accept-Ranges, X-Cache-Status, Content-Disposition"
    );
    storeHeaders.set("Cache-Control", "public, max-age=604800, s-maxage=604800"); // 7 days

    const responseToCache = new Response(videoBuffer, {
      status: 200,
      headers: storeHeaders,
    });

    // Store in background
    try {
      ctx.waitUntil(cache.put(cacheKey, responseToCache));
    } catch (e) {
      console.warn("Cache put error:", e);
    }

    // 4. Return to current client
    if (rangeHeader) {
      return serveBufferRange(videoBuffer, mimeType, rangeHeader, "MISS-UPSTREAM");
    }

    const clientHeaders = new Headers(storeHeaders);
    clientHeaders.set("X-Cache-Status", "MISS-UPSTREAM");
    return new Response(videoBuffer, {
      status: 200,
      headers: clientHeaders,
    });
  },
};

function parseRange(rangeHeader, totalSize) {
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

  if (isNaN(start)) start = 0;
  if (isNaN(end) || end >= totalSize) end = totalSize - 1;
  if (start > end || start >= totalSize) return null;

  return { start, end };
}

async function serveRangeResponse(cachedResponse, rangeHeader, cacheStatus, forcedContentType) {
  let buffer = await cachedResponse.arrayBuffer();
  buffer = sanitizeMp4Buffer(buffer);
  const contentType = forcedContentType || "video/mp4";
  return serveBufferRange(buffer, contentType, rangeHeader, cacheStatus);
}

function serveBufferRange(buffer, contentType, rangeHeader, cacheStatus) {
  const totalSize = buffer.byteLength;
  const range = parseRange(rangeHeader, totalSize);

  if (!range) {
    return new Response("Requested Range Not Satisfiable", {
      status: 416,
      headers: {
        "Content-Range": `bytes */${totalSize}`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const { start, end } = range;
  const sliced = buffer.slice(start, end + 1);
  const chunkSize = end - start + 1;

  return new Response(sliced, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": contentType,
      "Content-Length": chunkSize.toString(),
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Accept-Ranges": "bytes",
      "Content-Disposition": "inline",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers":
        "Content-Length, Content-Range, Accept-Ranges, X-Cache-Status, Content-Disposition",
      "Cache-Control": "public, max-age=604800, s-maxage=604800",
      "X-Cache-Status": cacheStatus,
    },
  });
}
