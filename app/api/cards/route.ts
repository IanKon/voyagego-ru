import { NextRequest, NextResponse } from "next/server";

// =============================================================================
//  /api/cards?origin=LIS&lang=en&currency=EUR
//
//  LIVE pricing endpoint with DYNAMIC destinations.
//  We do NOT hardcode the destination list. We ask Travelpayouts for the
//  cheapest ~20 destinations from this origin, then return the top 8.
//
//  This means:
//   - Cards change as prices change in the market
//   - Berlin can disappear if it gets expensive, Athens can appear
//   - Same origin = same cards for all users (cached 1h)
//   - Different origin = different cards (Lisbon ≠ Berlin ≠ Madrid)
// =============================================================================

const TP_TOKEN = process.env.TRAVELPAYOUTS_TOKEN || "16d7ec9bece341a8215923ee5188c63d";
const TP_MARKER = process.env.TRAVELPAYOUTS_MARKER || "525753";
const TRIP_ALLIANCE = "8192276";
const TRIP_SID = "309639758";

// Map IATA → city name. Travelpayouts returns codes; we humanize them.
// We also include this so we can drop unknown codes (no city name = no point showing).
const CITY_NAMES: Record<string, string> = {
  // Iberia
  MAD: "Madrid", BCN: "Barcelona", VLC: "Valencia", AGP: "Malaga", IBZ: "Ibiza", SVQ: "Seville",
  LIS: "Lisbon", OPO: "Porto", FAO: "Faro", LPA: "Las Palmas", TFS: "Tenerife",
  // France
  CDG: "Paris", ORY: "Paris", LYS: "Lyon", NCE: "Nice", MRS: "Marseille", BOD: "Bordeaux",
  // UK & Ireland
  LHR: "London", LGW: "London", STN: "London", LTN: "London",
  MAN: "Manchester", EDI: "Edinburgh", DUB: "Dublin",
  // Italy
  FCO: "Rome", CIA: "Rome", MIL: "Milan", MXP: "Milan", LIN: "Milan", BGY: "Milan",
  VCE: "Venice", NAP: "Naples", BLQ: "Bologna", FLR: "Florence", PSA: "Pisa", CTA: "Catania",
  // Benelux & DACH
  AMS: "Amsterdam", RTM: "Rotterdam", EIN: "Eindhoven", BRU: "Brussels", CRL: "Charleroi",
  BER: "Berlin", MUC: "Munich", FRA: "Frankfurt", HAM: "Hamburg", DUS: "Düsseldorf", CGN: "Cologne",
  VIE: "Vienna", ZRH: "Zurich", GVA: "Geneva", BSL: "Basel",
  // Eastern Europe
  WAW: "Warsaw", KRK: "Krakow", GDN: "Gdansk", WRO: "Wroclaw",
  PRG: "Prague", BUD: "Budapest", OTP: "Bucharest", SOF: "Sofia",
  // Greece, Balkans
  ATH: "Athens", SKG: "Thessaloniki", HER: "Heraklion", JMK: "Mykonos", JTR: "Santorini",
  ZAG: "Zagreb", DBV: "Dubrovnik", SPU: "Split", TIA: "Tirana",
  // Turkey & Levant
  IST: "Istanbul", SAW: "Istanbul", AYT: "Antalya", ESB: "Ankara",
  TLV: "Tel Aviv",
  // Nordics
  CPH: "Copenhagen", ARN: "Stockholm", OSL: "Oslo", HEL: "Helsinki", KEF: "Reykjavik",
  // Russia, ex-USSR
  SVO: "Moscow", DME: "Moscow", VKO: "Moscow", LED: "Saint Petersburg",
  KBP: "Kyiv", IEV: "Kyiv", MSQ: "Minsk", ALA: "Almaty", TBS: "Tbilisi", EVN: "Yerevan",
  // Middle East / Africa
  DXB: "Dubai", AUH: "Abu Dhabi", DOH: "Doha", AMM: "Amman",
  CAI: "Cairo", CMN: "Casablanca", RAK: "Marrakech", AGA: "Agadir", TUN: "Tunis",
  // Americas
  JFK: "New York", LGA: "New York", EWR: "New York", LAX: "Los Angeles",
  ORD: "Chicago", MIA: "Miami", SFO: "San Francisco", BOS: "Boston", IAD: "Washington",
  YYZ: "Toronto", YUL: "Montreal",
  GRU: "Sao Paulo", GIG: "Rio de Janeiro", EZE: "Buenos Aires",
  // Asia / Oceania
  HND: "Tokyo", NRT: "Tokyo", KIX: "Osaka", ICN: "Seoul",
  PEK: "Beijing", PVG: "Shanghai", HKG: "Hong Kong",
  BKK: "Bangkok", HKT: "Phuket", DPS: "Bali", CGK: "Jakarta", SIN: "Singapore",
  KUL: "Kuala Lumpur", DEL: "Delhi", BOM: "Mumbai",
  SYD: "Sydney", MEL: "Melbourne", AKL: "Auckland",
};

type RawCheap = {
  origin: string;
  destination: string;
  price: number;
  airline: string;
  flight_number: string | number;
  departure_at: string;
  return_at?: string;
  expires_at?: string;
};

type Card = {
  city: string;
  origin: string;
  destination_code: string;
  link: string;
  tier: "tier1" | "tier2";
  price?: number;
  currency?: string;
  airline?: string;
  departure_date?: string;
};

// Sanity check: a "deal" should have price below this much per km.
// E.g. Lisbon → Tokyo is ~12,000 km. €400 / 12000 = €0.033/km — reasonable.
// €60 for the same route would be obviously fake or stale, so we drop it.
// We don't actually compute distance — instead we use absolute floors:
const MIN_REASONABLE_PRICE_EUR = 9; // anything below this is almost certainly noise

// =============================================================================
//  Build affiliate link
// =============================================================================
function buildLink(origin: string, dest: string, date: string, _useAviasales: boolean): string {
  // Russian site: ALL flight links go to Aviasales.
  let effectiveDate = date;
  if (!effectiveDate) {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    effectiveDate = future.toISOString().slice(0, 10);
  }
  const dd = effectiveDate.slice(8, 10);
  const mm = effectiveDate.slice(5, 7);
  return `https://www.aviasales.ru/search/${origin}${dd}${mm}${dest}1?marker=${TP_MARKER}`;
}

// =============================================================================
//  Fetch cheapest destinations from a given origin
//  Endpoint: v1/prices/cheap returns origin → many destinations with price/date.
//  This is the official "cheapest tickets to anywhere" data.
// =============================================================================
async function fetchCheapestFromOrigin(origin: string, currency: string): Promise<RawCheap[]> {
  try {
    // /v1/prices/cheap returns a map: { destination_code: { "0": {price, ...}, "1": {...} } }
    const url = `https://api.travelpayouts.com/v1/prices/cheap`
      + `?origin=${origin}`
      + `&currency=${currency.toLowerCase()}`
      + `&token=${TP_TOKEN}`;

    const r = await fetch(url, { next: { revalidate: 3600 } });
    if (!r.ok) return [];

    const data = await r.json();
    const destinations = data.data || {};

    // Flatten the nested structure into a flat array
    const flat: RawCheap[] = [];
    for (const destCode of Object.keys(destinations)) {
      const offers = destinations[destCode];
      // Each destination has multiple offers indexed "0", "1", etc — take the cheapest one
      let cheapest: any = null;
      for (const idx of Object.keys(offers)) {
        const o = offers[idx];
        if (!cheapest || o.price < cheapest.price) cheapest = o;
      }
      if (cheapest) {
        flat.push({
          origin,
          destination: destCode,
          price: cheapest.price,
          airline: cheapest.airline || "",
          flight_number: cheapest.flight_number || "",
          departure_at: cheapest.departure_at || "",
          return_at: cheapest.return_at || "",
          expires_at: cheapest.expires_at || "",
        });
      }
    }
    return flat;
  } catch {
    return [];
  }
}

// =============================================================================
//  Main handler
// =============================================================================
export async function GET(req: NextRequest) {
  const origin = (req.nextUrl.searchParams.get("origin") || "LIS").toUpperCase().slice(0, 3);
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const currency = (req.nextUrl.searchParams.get("currency") || "EUR").toUpperCase();
  const useAviasales = lang === "ru" || lang === "uk";

  const allOffers = await fetchCheapestFromOrigin(origin, currency);

  // Filter and sort
  const now = new Date();
  const horizonMax = new Date(now.getTime() + 365 * 86400000);

  const valid = allOffers
    .filter(o => {
      // Drop unknown destination codes (no city name = no card)
      if (!CITY_NAMES[o.destination]) return false;
      // Drop suspiciously low prices
      if (o.price < MIN_REASONABLE_PRICE_EUR) return false;
      // Drop offers without a departure date
      if (!o.departure_at) return false;
      // Date sanity: must be in the future, not absurdly far
      const t = Date.parse(o.departure_at);
      if (isNaN(t)) return false;
      const d = new Date(t);
      if (d < now || d > horizonMax) return false;
      return true;
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 8); // Top 8 cheapest

  const cards: Card[] = valid.map(o => {
    const date = o.departure_at.slice(0, 10);
    return {
      city: CITY_NAMES[o.destination],
      origin,
      destination_code: o.destination,
      link: buildLink(origin, o.destination, date, useAviasales),
      tier: "tier1" as const,
      price: Math.round(o.price),
      currency,
      // Intentionally not setting airline — see comments in older versions.
      departure_date: date,
    };
  });

  return NextResponse.json({
    origin,
    cards,
    counts: {
      tier1: cards.length,
      tier2: 0,
    },
  }, {
    headers: {
      // 1 hour CDN cache, shared across all users for this origin
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
