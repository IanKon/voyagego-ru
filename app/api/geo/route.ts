import { NextRequest, NextResponse } from "next/server";

// =============================================================================
//  /api/geo
//  Returns: { city, country, airport, lat, lng, source }
//
//  Vercel injects request headers with the visitor's geo info on every request.
//  No API key needed, no external service. Locally we fall back to Lisbon
//  so dev experience is stable.
// =============================================================================

// Map of country code → main hub airport (used as fallback when city is unknown).
// We list only the major hubs Travelpayouts knows well.
const COUNTRY_HUB: Record<string, { city: string; airport: string }> = {
  PT: { city: "Lisbon",   airport: "LIS" },
  ES: { city: "Madrid",   airport: "MAD" },
  FR: { city: "Paris",    airport: "CDG" },
  GB: { city: "London",   airport: "LHR" },
  DE: { city: "Berlin",   airport: "BER" },
  IT: { city: "Rome",     airport: "FCO" },
  NL: { city: "Amsterdam",airport: "AMS" },
  BE: { city: "Brussels", airport: "BRU" },
  AT: { city: "Vienna",   airport: "VIE" },
  CH: { city: "Zurich",   airport: "ZRH" },
  PL: { city: "Warsaw",   airport: "WAW" },
  CZ: { city: "Prague",   airport: "PRG" },
  GR: { city: "Athens",   airport: "ATH" },
  TR: { city: "Istanbul", airport: "IST" },
  RU: { city: "Moscow",   airport: "MOW" },
  UA: { city: "Kyiv",     airport: "KBP" },
  BY: { city: "Minsk",    airport: "MSQ" },
  KZ: { city: "Almaty",   airport: "ALA" },
  US: { city: "New York", airport: "JFK" },
  CA: { city: "Toronto",  airport: "YYZ" },
  BR: { city: "Sao Paulo",airport: "GRU" },
  AE: { city: "Dubai",    airport: "DXB" },
  IL: { city: "Tel Aviv", airport: "TLV" },
  IN: { city: "Delhi",    airport: "DEL" },
  CN: { city: "Beijing",  airport: "PEK" },
  JP: { city: "Tokyo",    airport: "HND" },
  KR: { city: "Seoul",    airport: "ICN" },
  TH: { city: "Bangkok",  airport: "BKK" },
  SG: { city: "Singapore",airport: "SIN" },
  AU: { city: "Sydney",   airport: "SYD" },
  ZA: { city: "Cape Town",airport: "CPT" },
  EG: { city: "Cairo",    airport: "CAI" },
  MA: { city: "Casablanca",airport: "CMN" },
  IE: { city: "Dublin",   airport: "DUB" },
  SE: { city: "Stockholm",airport: "ARN" },
  NO: { city: "Oslo",     airport: "OSL" },
  DK: { city: "Copenhagen",airport: "CPH"},
  FI: { city: "Helsinki", airport: "HEL" },
  HU: { city: "Budapest", airport: "BUD" },
  RO: { city: "Bucharest",airport: "OTP" },
};

// Some cities have a clearly preferred airport. When Vercel gives us a city
// name, this map lets us return a sharper result than just the country hub.
const CITY_AIRPORT: Record<string, string> = {
  "lisbon": "LIS", "porto": "OPO", "faro": "FAO",
  "madrid": "MAD", "barcelona": "BCN", "valencia": "VLC", "seville": "SVQ",
  "paris": "CDG", "lyon": "LYS", "marseille": "MRS", "nice": "NCE",
  "london": "LHR", "manchester": "MAN", "edinburgh": "EDI",
  "berlin": "BER", "munich": "MUC", "frankfurt": "FRA", "hamburg": "HAM",
  "rome": "FCO", "milan": "MXP", "venice": "VCE", "naples": "NAP",
  "amsterdam": "AMS", "rotterdam": "RTM",
  "vienna": "VIE", "zurich": "ZRH", "geneva": "GVA",
  "warsaw": "WAW", "krakow": "KRK", "prague": "PRG",
  "athens": "ATH", "thessaloniki": "SKG",
  "istanbul": "IST", "ankara": "ESB", "antalya": "AYT",
  "moscow": "MOW", "saint petersburg": "LED", "minsk": "MSQ",
  "novosibirsk": "OVB", "yekaterinburg": "SVX", "kazan": "KZN", "sochi": "AER",
  "krasnodar": "KRR", "rostov": "ROV", "samara": "KUF", "ufa": "UFA",
  "vladivostok": "VVO", "irkutsk": "IKT", "kaliningrad": "KGD", "perm": "PEE",
  "kyiv": "KBP", "kiev": "KBP", "lviv": "LWO", "odessa": "ODS",
  "new york": "JFK", "los angeles": "LAX", "chicago": "ORD", "miami": "MIA",
  "san francisco": "SFO", "boston": "BOS", "washington": "IAD",
  "toronto": "YYZ", "montreal": "YUL",
  "dubai": "DXB", "abu dhabi": "AUH",
  "tokyo": "HND", "osaka": "KIX",
  "seoul": "ICN",
  "bangkok": "BKK", "phuket": "HKT",
  "singapore": "SIN",
  "sydney": "SYD", "melbourne": "MEL",
  "casablanca": "CMN", "marrakech": "RAK",
};

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  // Vercel sets these headers on every request. They look like:
  //   x-vercel-ip-country: PT
  //   x-vercel-ip-city: Lisbon
  //   x-vercel-ip-latitude: 38.7223
  //   x-vercel-ip-longitude: -9.1393
  // (The city header is URL-encoded by Vercel — they replace spaces with +.)
  const headerCountry = req.headers.get("x-vercel-ip-country") || "";
  const headerCityRaw = req.headers.get("x-vercel-ip-city") || "";
  const headerLat = req.headers.get("x-vercel-ip-latitude");
  const headerLng = req.headers.get("x-vercel-ip-longitude");

  const cityDecoded = headerCityRaw ? decodeURIComponent(headerCityRaw.replace(/\+/g, " ")) : "";
  const cityKey = normalize(cityDecoded);

  // Pick airport: prefer specific city match, then country hub, then Moscow as default.
  let city = cityDecoded || "Moscow";
  let airport = CITY_AIRPORT[cityKey] || COUNTRY_HUB[headerCountry]?.airport || "MOW";
  let countryFallback = COUNTRY_HUB[headerCountry]?.city;
  let source: "city-precise" | "country-hub" | "default" = "default";

  if (CITY_AIRPORT[cityKey]) {
    source = "city-precise";
  } else if (countryFallback) {
    // We know the country but not the specific city's airport — use country hub.
    city = countryFallback;
    source = "country-hub";
  }

  const lat = headerLat ? parseFloat(headerLat) : null;
  const lng = headerLng ? parseFloat(headerLng) : null;

  return NextResponse.json({
    city,
    country: headerCountry || "RU",
    airport,
    lat, lng,
    source,
  }, {
    // Cache per-IP for 1 hour: same user gets stable result without Vercel
    // hammering geo lookups on every page load.
    headers: { "Cache-Control": "private, max-age=3600" },
  });
}
