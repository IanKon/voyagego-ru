import { NextRequest, NextResponse } from "next/server";

// =============================================================================
//  /api/photo?city=Paris
//  Server-side proxy that fetches a city photo from Pexels using a private key.
//  Returns: { url: string, photographer: string, photographer_url: string, source: "pexels" }
//  Or 404 if no photo found.
// =============================================================================

// Caching is handled via:
//  - per-fetch `next: { revalidate }` on the upstream Pexels call
//  - Cache-Control header on our response (s-maxage)
// We deliberately do NOT export `revalidate` at the segment level — Next.js 16
// rejects this pattern when combined with dynamic request handling, causing
// "Invalid segment configuration export" build failures.

// Whitelist pattern: letters, spaces, hyphens, apostrophes only.
// Length 2..40 chars. Prevents injection / abuse via arbitrary query params.
const CITY_RE = /^[a-zA-ZÀ-ÿ\u00C0-\u024F\u0400-\u04FF][a-zA-ZÀ-ÿ\u00C0-\u024F\u0400-\u04FF\s\-']{1,39}$/;

// Simple in-memory rate limit per server instance.
// Vercel runs serverless, so this is best-effort but does dampen single-IP bursts.
const RATE_BUCKET = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // 30 requests
const RATE_WINDOW_MS = 60_000; // per minute

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_BUCKET.get(ip);
  if (!entry || entry.reset < now) {
    RATE_BUCKET.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  // -------- 1. Validate input --------
  const cityRaw = req.nextUrl.searchParams.get("city")?.trim();
  if (!cityRaw) {
    return NextResponse.json({ error: "Missing city parameter" }, { status: 400 });
  }
  if (!CITY_RE.test(cityRaw)) {
    return NextResponse.json({ error: "Invalid city name" }, { status: 400 });
  }

  // -------- 2. Rate limit --------
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // -------- 3. Server has key, browser never sees it --------
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // -------- 4. Query Pexels --------
  // For well-known cities we use a curated keyword set that returns iconic shots.
  // For unknown cities we fall back to a generic "<city> city skyline" query.
  const ICONIC_QUERIES: Record<string, string> = {
    "paris": "Paris Eiffel Tower",
    "london": "London Tower Bridge",
    "rome": "Rome Colosseum",
    "barcelona": "Barcelona Sagrada Familia",
    "amsterdam": "Amsterdam canals",
    "berlin": "Berlin Brandenburg Gate",
    "prague": "Prague old town",
    "tokyo": "Tokyo Shibuya",
    "new york": "New York Manhattan skyline",
    "dubai": "Dubai Burj Khalifa",
    "istanbul": "Istanbul Hagia Sophia",
    "bangkok": "Bangkok temple",
    "bali": "Bali rice terraces",
    "lisbon": "Lisbon trams Alfama",
    "marrakech": "Marrakech medina market",
    "marrakesh": "Marrakech medina market",
    "venice": "Venice gondola",
    "florence": "Florence Duomo",
    "athens": "Athens Acropolis",
    "vienna": "Vienna palace",
    "budapest": "Budapest parliament",
    "moscow": "Moscow Red Square",
    "saint petersburg": "Saint Petersburg Hermitage",
    "kyoto": "Kyoto temple",
    "seoul": "Seoul palace",
    "singapore": "Singapore Marina Bay",
    "sydney": "Sydney Opera House",
    "rio de janeiro": "Rio de Janeiro beach",
    "rio": "Rio de Janeiro beach",
    "cairo": "Cairo pyramids",
  };
  const cityLower = cityRaw.toLowerCase();
  const query = ICONIC_QUERIES[cityLower] || `${cityRaw} city`;
  const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;

  try {
    const r = await fetch(pexelsUrl, {
      headers: { Authorization: apiKey },
      // Cache at the fetch layer too
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!r.ok) {
      // Pexels returns 429 if rate limited, propagate as 503
      if (r.status === 429) {
        return NextResponse.json({ error: "Upstream rate limit" }, { status: 503 });
      }
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }

    const data = await r.json();
    const photos = data.photos || [];
    if (photos.length === 0) {
      return NextResponse.json({ error: "No photo found" }, { status: 404 });
    }

    // Pick the first result. Pexels orders by relevance.
    const p = photos[0];
    const result = {
      url: p.src?.large || p.src?.medium || p.src?.original,
      photographer: p.photographer || "",
      photographer_url: p.photographer_url || "",
      source: "pexels" as const,
    };

    return NextResponse.json(result, {
      headers: {
        // Browser cache for 1 day, CDN cache for 30 days
        "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400, max-age=86400",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
