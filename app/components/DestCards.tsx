"use client";

import { useEffect, useState } from "react";

// =============================================================================
//  CARD TYPES
//  tier1 = real, fresh deal with a future departure date — show price + airline
//  tier2 = inspiration card — just photo + city name, no price
// =============================================================================

export type Card = {
  city: string;
  origin: string;
  destination_code?: string;
  link: string;
  tier: "tier1" | "tier2";
  price?: number;
  airline?: string;
  departure_date?: string;
  expires_at?: string;
};

// Legacy shape — kept for back-compat with the old /api/deals raw payload
export type Deal = {
  city: string;
  price: number;
  airline?: string;
  link: string;
  badge?: string;
};

type Labels = {
  hot_deals: string;          // "Limited-time deals"
  hot_deals_sub: string;      // "Real prices, real dates."
  popular: string;            // "Popular destinations"
  popular_sub: string;        // "Get inspired for your next trip."
  from: string;               // "from"
  expires: string;            // "expires"
  no_deals: string;           // "No live deals right now — check the search above."
};

type Props = {
  cards: Card[];
  curSym: string;
  rate: number;
  labels: Labels;
  lang: string;
};

const LOCAL_EXTS = ["avif", "jpg", "jpeg", "webp", "png"];

function citySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Default inspiration cards shown if FastAPI is down or returns nothing.
// Uses generic city links so the click still goes somewhere useful.
const DEFAULT_INSPIRATION: Card[] = [
  { city: "Paris",     origin: "LIS", link: "#flights", tier: "tier2" },
  { city: "Rome",      origin: "LIS", link: "#flights", tier: "tier2" },
  { city: "Barcelona", origin: "LIS", link: "#flights", tier: "tier2" },
  { city: "Amsterdam", origin: "LIS", link: "#flights", tier: "tier2" },
  { city: "London",    origin: "LIS", link: "#flights", tier: "tier2" },
  { city: "Tokyo",     origin: "LIS", link: "#flights", tier: "tier2" },
  { city: "New York",  origin: "LIS", link: "#flights", tier: "tier2" },
  { city: "Dubai",     origin: "LIS", link: "#flights", tier: "tier2" },
];

// =============================================================================
//  Format date in user's locale (no year if it's this year)
// =============================================================================
function formatDate(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "en" ? "en-GB" : lang, {
      day: "numeric", month: "short",
    });
  } catch { return iso; }
}

// =============================================================================
//  Image hook — try local files in order, then Pexels, then gradient
// =============================================================================
type ImgState =
  | { kind: "loading" }
  | { kind: "local"; url: string }
  | { kind: "pexels"; url: string; credit: { name: string; link: string } }
  | { kind: "gradient" };

function useCityImage(city: string): ImgState {
  const [img, setImg] = useState<ImgState>({ kind: "loading" });
  const slug = citySlug(city);

  useEffect(() => {
    let cancelled = false;

    async function tryLocal(): Promise<string | null> {
      for (const ext of LOCAL_EXTS) {
        const path = `/destinations/${slug}.${ext}`;
        const ok = await new Promise<boolean>(resolve => {
          const probe = new window.Image();
          probe.onload = () => resolve(true);
          probe.onerror = () => resolve(false);
          probe.src = path;
        });
        if (cancelled) return null;
        if (ok) return path;
      }
      return null;
    }

    async function tryPexels(): Promise<{ url: string; name: string; link: string } | null> {
      try {
        const r = await fetch(`/api/photo?city=${encodeURIComponent(city)}`);
        if (!r.ok) return null;
        const data = await r.json();
        if (!data.url) return null;
        return { url: data.url, name: data.photographer || "", link: data.photographer_url || "" };
      } catch { return null; }
    }

    (async () => {
      const local = await tryLocal();
      if (cancelled) return;
      if (local) { setImg({ kind: "local", url: local }); return; }

      const pexels = await tryPexels();
      if (cancelled) return;
      if (pexels) {
        setImg({ kind: "pexels", url: pexels.url, credit: { name: pexels.name, link: pexels.link } });
        return;
      }
      setImg({ kind: "gradient" });
    })();

    return () => { cancelled = true; };
  }, [slug, city]);

  return img;
}

// =============================================================================
//  TIER 1 CARD — Hot deal (wide horizontal card with photo, date, price)
// =============================================================================
function HotDealCard({ card, curSym, rate, labels, lang }: {
  card: Card; curSym: string; rate: number; labels: Labels; lang: string;
}) {
  const img = useCityImage(card.city);
  const price = card.price ? Math.round(card.price * rate) : 0;
  const date = card.departure_date ? formatDate(card.departure_date, lang) : "";

  return (
    <div className="hot-card" style={{ position: "relative" }}>
      {/* Full-card click target laid as overlay anchor.
          Letting us add nested <a> elements later (e.g. Pexels credit)
          without violating HTML "no <a> inside <a>" rule. */}
      <a
        href={card.link}
        target="_blank"
        rel="noreferrer"
        style={{ position: "absolute", inset: 0, zIndex: 2, display: "block" }}
        aria-label={`Book flight to ${card.city}`}
      />
      <div className="hot-card-img">
        {(img.kind === "local" || img.kind === "pexels") && (
          <>
            <img src={img.url} alt={card.city} loading="lazy" />
            <div className="hot-card-img-overlay" />
          </>
        )}
        {img.kind === "loading" && <div className="dest-spinner" />}
      </div>
      <div className="hot-card-body">
        <div className="hot-card-tag">🔥 {labels.hot_deals}</div>
        <div className="hot-card-title">{card.city}</div>
        <div className="hot-card-meta">
          {date && <span>{date}</span>}
          {card.airline && <span>· {card.airline}</span>}
        </div>
        <div className="hot-card-price">
          <span className="hot-card-from">{labels.from}</span>{" "}
          <span className="hot-card-amount">{curSym}{price}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  TIER 2 CARD — Inspiration (just photo + city, no price)
// =============================================================================
function InspirationCard({ card, lang, priceLabel }: {
  card: Card; lang: string; priceLabel?: string;
}) {
  const img = useCityImage(card.city);

  return (
    <div className="dest-card" style={{ position: "relative" }}>
      {/* Main click target — covers the whole card. We wrap content in a div
          (not <a>) so the Pexels credit can be its own clickable element
          without nesting <a> inside <a> (HTML invalid). */}
      <a
        href={card.link}
        target="_blank"
        rel="noreferrer"
        style={{ position: "absolute", inset: 0, zIndex: 1, display: "block" }}
        aria-label={`Book flight to ${card.city}`}
      />

      {img.kind === "loading" && (
        <div className="dest-image dest-placeholder">
          <div className="dest-spinner" />
        </div>
      )}
      {img.kind === "gradient" && (
        <div className="dest-image dest-placeholder" style={{ ["--c1" as any]: "#bbb", ["--c2" as any]: "#888" }}>
          ✈
        </div>
      )}
      {(img.kind === "local" || img.kind === "pexels") && (
        <>
          <img className="dest-image" src={img.url} alt={card.city} loading="lazy" />
          <div className="dest-overlay" />
        </>
      )}
      <div className="dest-info" style={{ pointerEvents: "none" }}>
        <div className="name">{card.city}</div>
        {priceLabel && <div className="price">{priceLabel}</div>}
      </div>
      {img.kind === "pexels" && img.credit.name && (
        <div className="dest-credit" style={{ position: "absolute", zIndex: 3 }}>
          <a
            href={img.credit.link}
            target="_blank"
            rel="noreferrer noopener"
          >
            {img.credit.name}
          </a>
          {" / Pexels"}
        </div>
      )}
    </div>
  );
}

// =============================================================================
//  MAIN COMPONENT — two sections
//
//  Section 1: "Limited-time deals" — top 4 cheapest from anywhere
//  Section 2: "Fly somewhere popular next week" — 8 famous cities w/ prices
// =============================================================================
type DestCardsProps = Props & {
  popularCards?: Card[];   // optional second list of cards from /api/cards-popular
  popularLabel?: string;   // section heading
  popularSubLabel?: string;
};

export default function DestCards({
  cards, popularCards, popularLabel, popularSubLabel,
  curSym, rate, labels, lang,
}: DestCardsProps) {
  // Top 4 cheapest "anywhere" deals → big horizontal cards
  const topDeals = cards.slice(0, 4);
  // Popular section → 8 famous cities with price
  const popular = (popularCards || []).slice(0, 8);

  return (
    <>
      {/* SECTION 1 — Limited-time deals (cheapest anywhere) */}
      {topDeals.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>{labels.hot_deals}</h2>
            <p>{labels.hot_deals_sub}</p>
          </div>
          <div className="hot-grid">
            {topDeals.map((c, i) => (
              <HotDealCard
                key={`hot-${c.city}-${i}`}
                card={c}
                curSym={curSym}
                rate={rate}
                labels={labels}
                lang={lang}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2 — Popular cities next week (or default fallback) */}
      <section className="section" id="destinations">
        <div className="section-head">
          <h2>{popularLabel || labels.popular}</h2>
          <p>{popularSubLabel || labels.popular_sub}</p>
        </div>
        <div className="dest-grid">
          {(popular.length > 0 ? popular : DEFAULT_INSPIRATION).slice(0, 8).map((c, i) => (
            <InspirationCard
              key={`pop-${c.city}-${i}`}
              card={c}
              lang={lang}
              priceLabel={c.price ? `${labels.from} ${curSym}${Math.round(c.price * rate)}` : undefined}
            />
          ))}
        </div>
      </section>
    </>
  );
}
