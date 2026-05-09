"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DestCards, { Card } from "./components/DestCards";

// =============================================================================
//  PARTNER CONFIG
// =============================================================================
const P = {
  tp: { marker: "525753" },
  gyg: { id: "5RHBGN7" },
  trip: { a: "8192276", s: "309639758" },
  dc: { id: "IanKon" },
};
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const AIRLINES: Record<string, string> = {
  AA: "American Airlines", AF: "Air France", BA: "British Airways",
  FR: "Ryanair", IB: "Iberia", KL: "KLM", LH: "Lufthansa",
  PC: "Pegasus", TK: "Turkish Airlines", TO: "Transavia",
  TP: "TAP Portugal", U2: "easyJet", VY: "Vueling", W6: "Wizzair",
  EK: "Emirates", QR: "Qatar Airways",
};
const airName = (c: string) => AIRLINES[c] || c;

// =============================================================================
//  LANGUAGES + TRANSLATIONS (compact subset — full UI strings)
// =============================================================================
const LANGS = [
  { c: "ru", n: "Русский" }, { c: "en", n: "English" },
];

const TR: Record<string, Record<string, string>> = {
  en: {
    hero_title: "Your whole trip, in one place.",
    hero_sub: "Compare flights, hotels, tours and routes — and book through trusted partners worldwide.",
    nav_dest: "Destinations", nav_how: "How it works", tg: "Telegram",
    search: "Search",
    tab_flights: "Flights", tab_trains: "Trains", tab_buses: "Buses",
    tab_ferry: "Ferry", tab_hotels: "Hotels", tab_tours: "Tours", tab_cars: "Cars",
    from: "From", to: "To", date: "Departure", return_date: "Return",
    city: "City", checkin: "Check-in", checkout: "Check-out", pickup: "Pick-up location",
    return_btn: "Round-trip", oneway: "One way",
    popular: "Popular destinations", popular_sub: "Get inspired for your next trip — explore cities loved by travelers.",
    popular_week: "Fly to a popular city soon", popular_week_sub: "Cheapest fares to bucket-list cities, departing in the next 30 days.",
    hot_deals: "Limited-time deals", hot_deals_sub: "Real prices from trusted partners — book before they're gone.",
    expires: "expires", no_deals: "No live deals right now — try the search above.",
    how_title: "Simple, fast, transparent", how_sub: "Three steps from idea to your destination.",
    step1: "Search smart", step1d: "Compare prices across the world's most trusted travel partners in one search.",
    step2: "Book direct", step2d: "Confirm flights, stays and tours through partners — no middlemen, real prices.",
    step3: "Travel easy", step3d: "Get day-by-day plans on the website, in our Telegram bot, or your phone.",
    deal: "Deal", from_price: "from",
    footer_desc: "Flights, hotels, tours and itineraries — your whole trip in one place.",
    ft_about: "About", ft_partners: "Partners", ft_careers: "Careers", ft_contact: "Contact",
    ft_terms: "Terms", ft_privacy: "Privacy", ft_cookies: "Cookies",
    ft_flights: "Flights", ft_hotels: "Hotels", ft_tours: "Tours", ft_cars: "Car rental",
    no_results: "No exact matches. View all flights for this route:",
    search_on: "Search on", searching: "Searching…",
    results_to: "to",
    prices_approx: "Prices are approximate. Click to see exact price and book.",
    direct: "Direct", best: "Best price", special: "Special",
  },
  ru: {
    hero_title: "Вся поездка в одном месте.",
    hero_sub: "Сравни билеты, отели, экскурсии и маршруты — и забронируй у проверенных партнёров.",
    nav_dest: "Направления", nav_how: "Как это работает", tg: "Telegram",
    search: "Найти",
    tab_flights: "Билеты", tab_trains: "Поезда", tab_buses: "Автобусы",
    tab_ferry: "Паром", tab_hotels: "Отели", tab_tours: "Экскурсии", tab_cars: "Авто",
    from: "Откуда", to: "Куда", date: "Дата", return_date: "Обратно",
    city: "Город", checkin: "Заезд", checkout: "Выезд", pickup: "Город получения",
    return_btn: "Туда-обратно", oneway: "В одну сторону",
    popular: "Популярные направления", popular_sub: "Вдохновись для следующей поездки — города, любимые путешественниками.",
    popular_week: "Полететь в популярный город скоро", popular_week_sub: "Самые дешёвые билеты в топовые города с вылетом в ближайший месяц.",
    hot_deals: "Скидки сейчас", hot_deals_sub: "Реальные цены от проверенных партнёров — успей пока не разобрали.",
    expires: "до", no_deals: "Прямо сейчас активных скидок нет — попробуй поиск выше.",
    how_title: "Просто, быстро, прозрачно", how_sub: "Три шага от идеи до направления.",
    step1: "Умный поиск", step1d: "Сравнивай цены у проверенных туристических партнёров в одном поиске.",
    step2: "Прямое бронирование", step2d: "Бронируй билеты, отели и экскурсии напрямую — без посредников, реальные цены.",
    step3: "Лёгкое путешествие", step3d: "План по дням на сайте, в Telegram-боте или на телефоне.",
    deal: "Скидка", from_price: "от",
    footer_desc: "Билеты, отели, экскурсии и маршруты — вся поездка в одном месте.",
    ft_about: "О нас", ft_partners: "Партнёры", ft_careers: "Карьера", ft_contact: "Контакты",
    ft_terms: "Условия", ft_privacy: "Конфиденциальность", ft_cookies: "Cookie",
    ft_flights: "Билеты", ft_hotels: "Отели", ft_tours: "Экскурсии", ft_cars: "Аренда авто",
    no_results: "Нет точных совпадений. Посмотри все рейсы:",
    search_on: "Искать на", searching: "Поиск…",
    results_to: "→",
    prices_approx: "Цены примерные. Нажми для точной цены и бронирования.",
    direct: "Прямой", best: "Лучшая цена", special: "Спецпредложение",
  },
  uk: { hero_title: "Уся подорож в одному місці.", hero_sub: "Порівняй квитки, готелі, екскурсії та маршрути.", nav_dest: "Напрямки", nav_how: "Як це працює", tg: "Telegram", search: "Шукати", tab_flights: "Квитки", tab_trains: "Поїзди", tab_buses: "Автобуси", tab_ferry: "Пором", tab_hotels: "Готелі", tab_tours: "Екскурсії", tab_cars: "Авто", from: "Звідки", to: "Куди", date: "Дата", return_date: "Назад", city: "Місто", checkin: "Заїзд", checkout: "Виїзд", pickup: "Місто", return_btn: "Туди-назад", oneway: "В один бік", popular: "Популярні напрямки", popular_sub: "Найкращі пропозиції з Лісабона.", how_title: "Просто і швидко", how_sub: "Три кроки до подорожі.", step1: "Розумний пошук", step1d: "Порівнюй пропозиції надійних партнерів.", step2: "Прямі бронювання", step2d: "Бронюй квитки і готелі напряму.", step3: "Легка подорож", step3d: "План по днях у боті і на сайті.", deal: "Знижка", from_price: "від" },
  fr: { hero_title: "Tout votre voyage, au même endroit.", hero_sub: "Comparez vols, hôtels, excursions et itinéraires.", nav_dest: "Destinations", nav_how: "Comment ça marche", tg: "Telegram", search: "Rechercher", tab_flights: "Vols", tab_trains: "Trains", tab_buses: "Bus", tab_ferry: "Ferry", tab_hotels: "Hôtels", tab_tours: "Excursions", tab_cars: "Voitures", from: "De", to: "À", date: "Date", return_date: "Retour", city: "Ville", checkin: "Arrivée", checkout: "Départ", pickup: "Ville", return_btn: "Aller-retour", oneway: "Aller simple", popular: "Destinations populaires", popular_sub: "Les meilleures offres au départ de Lisbonne.", how_title: "Simple et rapide", how_sub: "Trois étapes vers votre destination.", step1: "Recherche intelligente", step1d: "Comparez les offres de partenaires de confiance.", step2: "Réservez en direct", step2d: "Confirmez vols et hôtels via des marques fiables.", step3: "Voyagez facilement", step3d: "Itinéraire jour par jour sur le site et le bot.", deal: "Promo", from_price: "à partir de" },
  de: { hero_title: "Ihre ganze Reise an einem Ort.", hero_sub: "Vergleichen Sie Flüge, Hotels und Touren.", nav_dest: "Reiseziele", nav_how: "So funktioniert es", tg: "Telegram", search: "Suchen", tab_flights: "Flüge", tab_trains: "Züge", tab_buses: "Busse", tab_ferry: "Fähre", tab_hotels: "Hotels", tab_tours: "Touren", tab_cars: "Mietwagen", from: "Von", to: "Nach", date: "Datum", return_date: "Rückkehr", city: "Stadt", checkin: "Check-in", checkout: "Check-out", pickup: "Stadt", return_btn: "Hin und zurück", oneway: "Nur Hinflug", popular: "Beliebte Reiseziele", popular_sub: "Die besten Angebote ab Lissabon.", how_title: "Einfach und schnell", how_sub: "Drei Schritte zur Reise.", step1: "Smart suchen", step1d: "Vergleichen Sie zuverlässige Partner.", step2: "Direkt buchen", step2d: "Bestätigen Sie Flüge und Hotels über vertrauenswürdige Marken.", step3: "Einfach reisen", step3d: "Tagesplan im Bot und auf der Website.", deal: "Angebot", from_price: "ab" },
  es: { hero_title: "Todo tu viaje, en un solo lugar.", hero_sub: "Compara vuelos, hoteles, tours y rutas.", nav_dest: "Destinos", nav_how: "Cómo funciona", tg: "Telegram", search: "Buscar", tab_flights: "Vuelos", tab_trains: "Trenes", tab_buses: "Autobuses", tab_ferry: "Ferry", tab_hotels: "Hoteles", tab_tours: "Tours", tab_cars: "Coches", from: "Desde", to: "Hasta", date: "Fecha", return_date: "Vuelta", city: "Ciudad", checkin: "Entrada", checkout: "Salida", pickup: "Ciudad", return_btn: "Ida y vuelta", oneway: "Solo ida", popular: "Destinos populares", popular_sub: "Las mejores ofertas desde Lisboa.", how_title: "Sencillo y rápido", how_sub: "Tres pasos hacia tu destino.", step1: "Búsqueda inteligente", step1d: "Compara socios de confianza.", step2: "Reserva directa", step2d: "Confirma vuelos y hoteles a través de marcas fiables.", step3: "Viaja fácil", step3d: "Itinerario día a día en el bot y la web.", deal: "Oferta", from_price: "desde" },
  it: { hero_title: "Tutto il tuo viaggio, in un unico posto.", hero_sub: "Confronta voli, hotel, tour e percorsi.", nav_dest: "Destinazioni", nav_how: "Come funziona", tg: "Telegram", search: "Cerca", tab_flights: "Voli", tab_trains: "Treni", tab_buses: "Autobus", tab_ferry: "Traghetto", tab_hotels: "Hotel", tab_tours: "Tour", tab_cars: "Auto", from: "Da", to: "A", date: "Data", return_date: "Ritorno", city: "Città", checkin: "Check-in", checkout: "Check-out", pickup: "Città", return_btn: "Andata e ritorno", oneway: "Solo andata", popular: "Destinazioni popolari", popular_sub: "Le migliori offerte da Lisbona.", how_title: "Semplice e veloce", how_sub: "Tre passi verso la destinazione.", step1: "Ricerca smart", step1d: "Confronta partner affidabili.", step2: "Prenotazione diretta", step2d: "Conferma voli e hotel tramite marchi affidabili.", step3: "Viaggia facile", step3d: "Itinerario giorno per giorno sul sito e nel bot.", deal: "Offerta", from_price: "da" },
  pt: { hero_title: "Toda a sua viagem, num só lugar.", hero_sub: "Compare voos, hotéis, tours e rotas.", nav_dest: "Destinos", nav_how: "Como funciona", tg: "Telegram", search: "Pesquisar", tab_flights: "Voos", tab_trains: "Comboios", tab_buses: "Autocarros", tab_ferry: "Ferry", tab_hotels: "Hotéis", tab_tours: "Passeios", tab_cars: "Carros", from: "De", to: "Para", date: "Data", return_date: "Regresso", city: "Cidade", checkin: "Check-in", checkout: "Check-out", pickup: "Cidade", return_btn: "Ida e volta", oneway: "Só ida", popular: "Destinos populares", popular_sub: "As melhores ofertas a partir de Lisboa.", how_title: "Simples e rápido", how_sub: "Três passos para o seu destino.", step1: "Pesquisa inteligente", step1d: "Compare parceiros de confiança.", step2: "Reserva direta", step2d: "Confirme voos e hotéis através de marcas fiáveis.", step3: "Viaje fácil", step3d: "Itinerário dia a dia no site e no bot.", deal: "Promoção", from_price: "desde" },
  tr: { hero_title: "Tüm seyahatiniz, tek bir yerde.", hero_sub: "Uçuşları, otelleri ve turları karşılaştırın.", nav_dest: "Destinasyonlar", nav_how: "Nasıl çalışır", tg: "Telegram", search: "Ara", tab_flights: "Uçuşlar", tab_trains: "Trenler", tab_buses: "Otobüsler", tab_ferry: "Feribot", tab_hotels: "Oteller", tab_tours: "Turlar", tab_cars: "Arabalar", from: "Nereden", to: "Nereye", date: "Tarih", return_date: "Dönüş", city: "Şehir", checkin: "Giriş", checkout: "Çıkış", pickup: "Şehir", return_btn: "Gidiş-dönüş", oneway: "Tek yön", popular: "Popüler destinasyonlar", popular_sub: "Lizbon'dan en iyi fırsatlar.", how_title: "Basit ve hızlı", how_sub: "Hedefine üç adım.", step1: "Akıllı arama", step1d: "Güvenilir ortakları karşılaştırın.", step2: "Doğrudan rezervasyon", step2d: "Uçuşları ve otelleri güvenilir markalarla onaylayın.", step3: "Kolay seyahat", step3d: "Bot ve sitede günlük plan.", deal: "Fırsat", from_price: "itibaren" },
  pl: { hero_title: "Cała podróż w jednym miejscu.", hero_sub: "Porównuj loty, hotele, wycieczki i trasy.", nav_dest: "Kierunki", nav_how: "Jak to działa", tg: "Telegram", search: "Szukaj", tab_flights: "Loty", tab_trains: "Pociągi", tab_buses: "Autobusy", tab_ferry: "Prom", tab_hotels: "Hotele", tab_tours: "Wycieczki", tab_cars: "Samochody", from: "Skąd", to: "Dokąd", date: "Data", return_date: "Powrót", city: "Miasto", checkin: "Zameldowanie", checkout: "Wymeldowanie", pickup: "Miasto", return_btn: "W obie strony", oneway: "W jedną stronę", popular: "Popularne kierunki", popular_sub: "Najlepsze oferty z Lizbony.", how_title: "Prosto i szybko", how_sub: "Trzy kroki do podróży.", step1: "Inteligentne wyszukiwanie", step1d: "Porównuj zaufanych partnerów.", step2: "Bezpośrednia rezerwacja", step2d: "Potwierdź loty i hotele przez zaufane marki.", step3: "Łatwa podróż", step3d: "Plan dzień po dniu w bocie i na stronie.", deal: "Okazja", from_price: "od" },
};
const t = (lang: string, key: string) => TR[lang]?.[key] ?? TR.en[key] ?? key;

// =============================================================================
//  CURRENCIES
// =============================================================================
const CURRENCIES = [
  { c: "RUB", s: "₽" }, { c: "EUR", s: "€" },
];
const RATES: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.86, RUB: 88, UAH: 51, TRY: 53, PLN: 4.25,
  CZK: 25, JPY: 185, CNY: 7.8, KRW: 1450, INR: 90, BRL: 5.8, CHF: 0.92,
  SEK: 11.2, CAD: 1.47, AUD: 1.65, AED: 3.97, KZT: 543, IDR: 17000,
};

// =============================================================================
//  TYPES
// =============================================================================
type ACItem = { label: string; code: string };
type FlightResult = {
  type: "flight" | "train" | "bus" | "ferry";
  price: number; airline?: string; transfers?: number;
  origin?: string; destination?: string;
  departure_date?: string; departure_time?: string;
  duration?: string; link: string;
};
type TwoWayData = { outbound: FlightResult[]; return: FlightResult[]; outbound_count: number; return_count: number };

// =============================================================================
//  ICON SET (inline SVG, simpler than spritesheet)
// =============================================================================
const Icon = ({ name, style }: { name: string; style?: React.CSSProperties }) => {
  const paths: Record<string, React.ReactNode> = {
    plane: <path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2-7h-4l-2 2h-3l2-4l-2-4h3l2 2h4l-2-7h3z" />,
    train: <><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7h3.5"/></>,
    bus: <><path d="M4 17V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12"/><path d="M2 17h20"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/><path d="M4 11h16M9 3v8"/></>,
    ferry: <><path d="M2 20a3 3 0 0 0 4 0a3 3 0 0 1 4 0a3 3 0 0 0 4 0a3 3 0 0 1 4 0a3 3 0 0 0 4 0"/><path d="M4 18l-1-5h18l-2 5"/><path d="M5 13V7h8l3 3l3 3"/><path d="M7 13V9h6"/></>,
    bed: <><path d="M3 7v11M3 11h18M21 18v-7a3 3 0 0 0-3-3h-7v7"/><circle cx="7" cy="13" r="2"/></>,
    pin: <><circle cx="12" cy="11" r="3"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/></>,
    car: <><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2M9 17h6"/></>,
    search: <><circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    arrow_right: <path d="M5 12h14M13 18l6-6M13 6l6 6"/>,
    card: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h.01M11 15h2"/></>,
    plane_up: <path d="M14.639 10.258l5.74-1.538a1.95 1.95 0 0 1 1.022 3.765l-13.7 3.672l-2.83-2.362l1.293-.349l1.532 1.022l2.432-.652l-3.022-4.13l1.286-.46l4.247 3.032zM3 21h18"/>,
  };
  return (
    <svg className="icon" style={style} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

// =============================================================================
//  AUTOCOMPLETE INPUT
// =============================================================================
function ACInput(props: {
  label: string; placeholder: string;
  type: "airport" | "city";
  value: string;
  onPick: (label: string, code: string) => void;
  onChange: (v: string) => void;
}) {
  const [items, setItems] = useState<ACItem[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (q: string) => {
    props.onChange(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 2) { setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const url = props.type === "airport"
          ? `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(q)}&locale=en&types[]=city&types[]=airport`
          : `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`;
        const data = await fetch(url).then(r => r.json());
        let result: ACItem[];
        if (props.type === "airport") {
          result = (data as any[]).slice(0, 6).map(i => ({
            label: i.name + (i.country_name ? `, ${i.country_name}` : ""),
            code: i.code || "",
          }));
        } else {
          result = ((data as any).features || []).slice(0, 6).map((f: any) => ({
            label: f.properties.name + (f.properties.country ? `, ${f.properties.country}` : ""),
            code: f.properties.name || "",
          }));
        }
        setItems(result);
        setOpen(result.length > 0);
      } catch { setOpen(false); }
    }, 280);
  };

  return (
    <div className="form-field">
      <label>{props.label}</label>
      <input
        type="text"
        autoComplete="off"
        placeholder={props.placeholder}
        value={props.value}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onFocus={() => { if (items.length > 0) setOpen(true); }}
      />
      <div className={"ac-dropdown" + (open ? " show" : "")}>
        {items.map((it, i) => (
          <div
            key={i}
            className="ac-opt"
            onMouseDown={e => {
              e.preventDefault();
              props.onPick(it.label, it.code);
              setOpen(false);
            }}
          >
            <span>{it.label}</span>
            <span className="ac-code">{it.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
//  BRAND LOGO
// =============================================================================
function BrandLogo() {
  return (
    <span className="brand-wrap">
      <span className="brand">
        <span className="v">V</span>
        <span className="stack">
          <span className="oyage">oyage</span>
          <span className="go">GO</span>
        </span>
      </span>
    </span>
  );
}

// =============================================================================
//  MAIN PAGE
// =============================================================================
export default function Page() {
  const [lang, setLang] = useState("ru");
  const [cur, setCur] = useState("RUB");
  const [curSym, setCurSym] = useState("₽");
  const [tab, setTab] = useState<"flights" | "trains" | "buses" | "ferry" | "hotels" | "tours" | "cars">("flights");
  const [tripType, setTripType] = useState<"return" | "oneway">("return");

  // Form state
  const [flFrom, setFlFrom] = useState(""); const [flFromCode, setFlFromCode] = useState("");
  const [flTo, setFlTo] = useState(""); const [flToCode, setFlToCode] = useState("");
  const [flDate, setFlDate] = useState(""); const [flReturn, setFlReturn] = useState("");

  const [trFrom, setTrFrom] = useState(""); const [trTo, setTrTo] = useState("");
  const [htCity, setHtCity] = useState("");
  const [htIn, setHtIn] = useState(""); const [htOut, setHtOut] = useState("");
  const [toCity, setToCity] = useState("");
  const [caCity, setCaCity] = useState("");

  const [langModalOpen, setLangModalOpen] = useState(false);
  const [curModalOpen, setCurModalOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsTitle, setResultsTitle] = useState("Results");
  const [resultsHTML, setResultsHTML] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [popularCards, setPopularCards] = useState<Card[]>([]);
  const [geo, setGeo] = useState<{ city: string; airport: string; country: string }>({
    city: "Lisbon", airport: "LIS", country: "PT",
  });

  // body scroll lock when results modal open
  useEffect(() => {
    document.body.style.overflow = resultsOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [resultsOpen]);

  // ---------- detect user location once on mount ----------
  useEffect(() => {
    fetch("/api/geo")
      .then(r => r.json())
      .then(data => {
        if (data?.airport) {
          setGeo({
            city: data.city || "Lisbon",
            airport: data.airport || "LIS",
            country: data.country || "PT",
          });
        }
      })
      .catch(() => { /* keep default Lisbon */ });
  }, []);

  // ---------- load both card lists when origin/lang/cur changes ----------
  const loadCards = useCallback(async () => {
    const useAviasales = lang === "ru" || lang === "uk" || cur === "RUB";
    const langForApi = useAviasales ? "ru" : lang;

    // Fire both endpoints in parallel — they're independent, no point waiting
    const [cheapAnywhere, popularNextWeek] = await Promise.allSettled([
      fetch(`/api/cards?origin=${geo.airport}&lang=${langForApi}&currency=${cur}`).then(r => r.json()),
      fetch(`/api/cards-popular?origin=${geo.airport}&lang=${langForApi}&currency=${cur}&days=60`).then(r => r.json()),
    ]);

    if (cheapAnywhere.status === "fulfilled") {
      setCards(cheapAnywhere.value.cards || []);
    }
    if (popularNextWeek.status === "fulfilled") {
      setPopularCards(popularNextWeek.value.cards || []);
    }
  }, [lang, cur, geo.airport]);
  useEffect(() => { loadCards(); }, [loadCards]);

  // delegate clicks on result cards
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".result-card") as HTMLElement | null;
      if (target?.dataset.link) window.open(target.dataset.link, "_blank");
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ---------- result card builder ----------
  const buildCard = (r: FlightResult): string => {
    let tag = "";
    if (r.type === "train") tag = '<span class="result-tag direct">Train</span>';
    else if (r.type === "bus") tag = '<span class="result-tag" style="background:#e8eaf6;color:#3949ab">Bus</span>';
    else if (r.type === "ferry") tag = '<span class="result-tag" style="background:#e0f7fa;color:#00838f">Ferry</span>';
    else if (r.transfers === 0) tag = `<span class="result-tag direct">${t(lang, "direct")}</span>`;
    else tag = `<span class="result-tag stop">${r.transfers} stop</span>`;

    const safe = r.link.replace(/'/g, "%27").replace(/"/g, "&quot;");
    const price = Math.round(r.price * RATES[cur]);
    const priceHTML = r.type === "flight"
      ? `<div class="result-price">${curSym}${price}</div>`
      : `<div class="result-price" style="font-size:16px">${curSym}${price}–${curSym}${Math.round(price * 1.5)}</div>`;
    const route = r.type === "flight"
      ? `${r.origin || ""} → ${r.destination || ""}`
      : r.type.charAt(0).toUpperCase() + r.type.slice(1);

    let details = tag;
    if (r.airline) details += `<span>${airName(r.airline)}</span>`;
    if (r.departure_time) details += `<span>${r.departure_time}</span>`;
    if (r.duration) details += `<span>${r.duration}</span>`;

    return `<div class="result-card" data-link="${safe}">${priceHTML}<div class="result-info"><div class="result-route">${route}</div><div class="result-details">${details}</div></div><div class="result-arrow">›</div></div>`;
  };

  const renderTwoWay = (data: TwoWayData, from: string, to: string) => {
    const noResults = !data.outbound.length && !data.return.length;
    const fcode = flFromCode || flFrom.slice(0, 3).toUpperCase();
    const tcode = flToCode || flTo.slice(0, 3).toUpperCase();
    const useAviasales = lang === "ru" || lang === "uk" || cur === "RUB";

    let fallback = `https://www.trip.com/flights/?dcity=${fcode}&acity=${tcode}&ddate=${flDate}&Allianceid=${P.trip.a}&SID=${P.trip.s}`;
    if (useAviasales) {
      const dd = flDate ? flDate.slice(8, 10) + flDate.slice(5, 7) : "";
      fallback = `https://www.aviasales.ru/search/${fcode}${dd}${tcode}1?marker=${P.tp.marker}`;
    }
    const partner = useAviasales ? "Aviasales" : "Trip.com";

    if (noResults) {
      setResultsHTML(
        `<div class="result-empty"><p style="margin-bottom:20px;font-size:15px">${t(lang, "no_results")}</p><a href="${fallback}" target="_blank" style="display:inline-block;background:#1d1d1f;color:#fff;padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">${t(lang, "search_on")} ${partner} →</a></div>`
      );
      return;
    }

    let h = "<div>";
    h += `<div style="padding:16px 24px;background:#f5f5f7;border-bottom:1px solid rgba(0,0,0,.08)"><div style="font-weight:600;font-size:14px">${from} ${t(lang, "results_to")} ${to} · ${data.outbound_count}</div></div>`;
    h += '<div class="results-list">';
    data.outbound.forEach(r => { h += buildCard(r); });
    h += "</div>";
    if (data.return_count > 0) {
      h += `<div style="padding:16px 24px;background:#f5f5f7;border-top:2px solid #1d1d1f"><div style="font-weight:600;font-size:14px">${to} ${t(lang, "results_to")} ${from} · ${data.return_count}</div></div>`;
      h += '<div class="results-list">';
      (data.return || []).forEach(r => { h += buildCard(r); });
      h += "</div>";
    }
    h += `<div style="padding:14px 24px;background:#f5f5f7;font-size:11px;color:#86868b">${t(lang, "prices_approx")}</div></div>`;
    setResultsHTML(h);
  };

  // ---------- search handlers ----------
  const searchFlights = async () => {
    if (!flFrom || !flTo) return;
    const fc = flFromCode || flFrom.slice(0, 3).toUpperCase();
    const tc = flToCode || flTo.slice(0, 3).toUpperCase();
    const rd = tripType === "oneway" ? "" : flReturn;
    setResultsTitle(`${flFrom} → ${flTo}`);
    setResultsHTML(`<div class="results-loading">${t(lang, "searching")}</div>`);
    setResultsOpen(true);
    try {
      let url = `${API_BASE}/api/search-return?origin=${fc}&dest=${tc}&date=${flDate}&lang=${lang}`;
      if (rd) url += `&return_date=${rd}`;
      const res = await fetch(url);
      const data: TwoWayData = await res.json();
      renderTwoWay(data, flFrom, flTo);
    } catch {
      setResultsHTML('<div class="result-empty">Error. Try again.</div>');
    }
  };

  const searchTrains = () => {
    const f = trFrom.split(",")[0].trim().toLowerCase().replace(/ /g, "-");
    const t = trTo.split(",")[0].trim().toLowerCase().replace(/ /g, "-");
    if (!f || !t) return;
    window.open(`https://omio.sjv.io/c/7271483/861892/7385?u=https%3A%2F%2Fwww.omio.com%2Ftravel%2F${f}%2F${t}`, "_blank");
  };

  const searchHotels = () => {
    const c = htCity.split(",")[0].trim();
    if (!c) return;
    window.open(`https://search.hotellook.com/hotels?destination=${encodeURIComponent(c)}&checkIn=${htIn}&checkOut=${htOut}&currency=${cur.toLowerCase()}&marker=${P.tp.marker}`, "_blank");
  };

  const searchTours = () => {
    const c = toCity.split(",")[0].trim();
    if (!c) return;
    window.open(`https://www.getyourguide.com/s/?q=${encodeURIComponent(c)}&partner_id=${P.gyg.id}&utm_medium=online_publisher`, "_blank");
  };

  const searchCars = () => {
    const c = caCity.split(",")[0].trim().toLowerCase().replace(/ /g, "-");
    if (!c) return;
    window.open(`https://www.discovercars.com/${c}?a_aid=${P.dc.id}`, "_blank");
  };

  // =============================================================================
  //  RENDER
  // =============================================================================
  const tabsList: Array<{ k: typeof tab; icon: string; label: string }> = [
    { k: "flights", icon: "plane", label: t(lang, "tab_flights") },
    { k: "trains", icon: "train", label: t(lang, "tab_trains") },
    { k: "buses", icon: "bus", label: t(lang, "tab_buses") },
    { k: "ferry", icon: "ferry", label: t(lang, "tab_ferry") },
    { k: "hotels", icon: "bed", label: t(lang, "tab_hotels") },
    { k: "tours", icon: "pin", label: t(lang, "tab_tours") },
    { k: "cars", icon: "car", label: t(lang, "tab_cars") },
  ];

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="logo"><BrandLogo /></div>
        <span className="hamburger" aria-label="Menu"><Icon name="menu" /></span>
        <div className="nav-links">
          <a href="#destinations">{t(lang, "nav_dest")}</a>
          <a href="#how">{t(lang, "nav_how")}</a>
          <span className="pill" onClick={() => setCurModalOpen(true)}>
            <span>{curSym} {cur}</span>
          </span>
          <span className="pill" onClick={() => setLangModalOpen(true)}>
            <Icon name="globe" />
            <span>{lang.toUpperCase()}</span>
          </span>
          <a href="https://t.me/VoyageGoBot" target="_blank" rel="noreferrer" className="tg-btn">
            {t(lang, "tg")}
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <h1>{t(lang, "hero_title")}</h1>
        <p>{t(lang, "hero_sub")}</p>

        {/* SEARCH CARD */}
        <div className="search-card">
          <div className="tabs">
            {tabsList.map(({ k, icon, label }) => (
              <div
                key={k}
                className={"tab" + (tab === k ? " active" : "")}
                onClick={() => setTab(k)}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Flights */}
          <div className={"tab-form" + (tab === "flights" ? " active" : "")}>
            <div className="trip-toggle-group">
              <button
                className={"trip-toggle" + (tripType === "return" ? " active" : "")}
                onClick={() => setTripType("return")}
              >{t(lang, "return_btn")}</button>
              <button
                className={"trip-toggle" + (tripType === "oneway" ? " active" : "")}
                onClick={() => setTripType("oneway")}
              >{t(lang, "oneway")}</button>
            </div>
            <div className="form-row">
              <ACInput
                label={t(lang, "from")} placeholder="London, Paris..."
                type="airport" value={flFrom}
                onChange={v => { setFlFrom(v); setFlFromCode(""); }}
                onPick={(label, code) => { setFlFrom(label); setFlFromCode(code); }}
              />
              <ACInput
                label={t(lang, "to")} placeholder="New York, Tokyo..."
                type="airport" value={flTo}
                onChange={v => { setFlTo(v); setFlToCode(""); }}
                onPick={(label, code) => { setFlTo(label); setFlToCode(code); }}
              />
            </div>
            <div className={"form-row" + (tripType === "oneway" ? " single" : "")}>
              <div className="form-field">
                <label>{t(lang, "date")}</label>
                <input type="date" value={flDate} onChange={e => setFlDate(e.target.value)} />
              </div>
              {tripType === "return" && (
                <div className="form-field">
                  <label>{t(lang, "return_date")}</label>
                  <input type="date" value={flReturn} onChange={e => setFlReturn(e.target.value)} />
                </div>
              )}
            </div>
            <button className="search-btn" onClick={searchFlights}>{t(lang, "search")}</button>
          </div>

          {/* Trains */}
          <div className={"tab-form" + (tab === "trains" ? " active" : "")}>
            <div className="form-row">
              <ACInput label={t(lang, "from")} placeholder="Paris, Berlin..."
                type="city" value={trFrom}
                onChange={setTrFrom} onPick={l => setTrFrom(l)} />
              <ACInput label={t(lang, "to")} placeholder="Rome, Madrid..."
                type="city" value={trTo}
                onChange={setTrTo} onPick={l => setTrTo(l)} />
            </div>
            <button className="search-btn" onClick={searchTrains}>{t(lang, "search")}</button>
          </div>

          {/* Buses */}
          <div className={"tab-form" + (tab === "buses" ? " active" : "")}>
            <div className="form-row">
              <ACInput label={t(lang, "from")} placeholder="Lisbon, Porto..."
                type="city" value={trFrom}
                onChange={setTrFrom} onPick={l => setTrFrom(l)} />
              <ACInput label={t(lang, "to")} placeholder="Madrid, Seville..."
                type="city" value={trTo}
                onChange={setTrTo} onPick={l => setTrTo(l)} />
            </div>
            <button className="search-btn" onClick={searchTrains}>{t(lang, "search")}</button>
          </div>

          {/* Ferry */}
          <div className={"tab-form" + (tab === "ferry" ? " active" : "")}>
            <div className="form-row">
              <ACInput label={t(lang, "from")} placeholder="Athens, Naples..."
                type="city" value={trFrom}
                onChange={setTrFrom} onPick={l => setTrFrom(l)} />
              <ACInput label={t(lang, "to")} placeholder="Mykonos, Santorini..."
                type="city" value={trTo}
                onChange={setTrTo} onPick={l => setTrTo(l)} />
            </div>
            <button className="search-btn" onClick={searchTrains}>{t(lang, "search")}</button>
          </div>

          {/* Hotels */}
          <div className={"tab-form" + (tab === "hotels" ? " active" : "")}>
            <div className="form-row single">
              <ACInput label={t(lang, "city")} placeholder="Paris, Rome, Tokyo..."
                type="city" value={htCity}
                onChange={setHtCity} onPick={l => setHtCity(l)} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>{t(lang, "checkin")}</label>
                <input type="date" value={htIn} onChange={e => setHtIn(e.target.value)} />
              </div>
              <div className="form-field">
                <label>{t(lang, "checkout")}</label>
                <input type="date" value={htOut} onChange={e => setHtOut(e.target.value)} />
              </div>
            </div>
            <button className="search-btn" onClick={searchHotels}>{t(lang, "search")}</button>
          </div>

          {/* Tours */}
          <div className={"tab-form" + (tab === "tours" ? " active" : "")}>
            <div className="form-row single">
              <ACInput label={t(lang, "city")} placeholder="Paris, Barcelona, Kyoto..."
                type="city" value={toCity}
                onChange={setToCity} onPick={l => setToCity(l)} />
            </div>
            <button className="search-btn" onClick={searchTours}>{t(lang, "search")}</button>
          </div>

          {/* Cars */}
          <div className={"tab-form" + (tab === "cars" ? " active" : "")}>
            <div className="form-row single">
              <ACInput label={t(lang, "pickup")} placeholder="Lisbon, Barcelona..."
                type="city" value={caCity}
                onChange={setCaCity} onPick={l => setCaCity(l)} />
            </div>
            <button className="search-btn" onClick={searchCars}>{t(lang, "search")}</button>
          </div>
        </div>
      </section>

      {/* DESTINATIONS — DestCards renders Hot deals + Popular sections itself */}
      <DestCards
        cards={cards}
        popularCards={popularCards}
        popularLabel={t(lang, "popular_week")}
        popularSubLabel={t(lang, "popular_week_sub")}
        curSym={curSym}
        rate={RATES[cur]}
        lang={lang}
        labels={{
          hot_deals: t(lang, "hot_deals"),
          hot_deals_sub: t(lang, "hot_deals_sub"),
          popular: t(lang, "popular"),
          popular_sub: t(lang, "popular_sub"),
          from: t(lang, "from_price"),
          expires: t(lang, "expires"),
          no_deals: t(lang, "no_deals"),
        }}
      />

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-head">
          <h2>{t(lang, "how_title")}</h2>
          <p>{t(lang, "how_sub")}</p>
        </div>
        <div className="how-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <div className="step-icon"><Icon name="search" /></div>
            <h3>{t(lang, "step1")}</h3>
            <p>{t(lang, "step1d")}</p>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <div className="step-icon"><Icon name="card" /></div>
            <h3>{t(lang, "step2")}</h3>
            <p>{t(lang, "step2d")}</p>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <div className="step-icon"><Icon name="plane_up" /></div>
            <h3>{t(lang, "step3")}</h3>
            <p>{t(lang, "step3d")}</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo"><BrandLogo /></div>
            <p>{t(lang, "footer_desc")}</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#">{t(lang, "ft_flights")}</a>
            <a href="#">{t(lang, "ft_hotels")}</a>
            <a href="#">{t(lang, "ft_tours")}</a>
            <a href="#">{t(lang, "ft_cars")}</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">{t(lang, "ft_about")}</a>
            <a href="#">{t(lang, "ft_partners")}</a>
            <a href="#">{t(lang, "ft_careers")}</a>
            <a href="#">{t(lang, "ft_contact")}</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">{t(lang, "ft_terms")}</a>
            <a href="#">{t(lang, "ft_privacy")}</a>
            <a href="#">{t(lang, "ft_cookies")}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 VoyageGo. All rights reserved.</span>
          <span>voyagego.world</span>
        </div>
      </footer>

      {/* CURRENCY MODAL */}
      <div
        className={"modal-bg" + (curModalOpen ? " show" : "")}
        onClick={e => { if (e.target === e.currentTarget) setCurModalOpen(false); }}
      >
        <div className="modal-box">
          <h3>Currency</h3>
          <div className="modal-grid">
            {CURRENCIES.map(c => (
              <div
                key={c.c}
                className={"modal-opt" + (c.c === cur ? " active" : "")}
                onClick={() => { setCur(c.c); setCurSym(c.s); setCurModalOpen(false); }}
              >
                {c.s} {c.c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LANG MODAL */}
      <div
        className={"modal-bg" + (langModalOpen ? " show" : "")}
        onClick={e => { if (e.target === e.currentTarget) setLangModalOpen(false); }}
      >
        <div className="modal-box">
          <h3>Language</h3>
          <div className="modal-grid">
            {LANGS.map(l => (
              <div
                key={l.c}
                className={"modal-opt" + (l.c === lang ? " active" : "")}
                onClick={() => { setLang(l.c); setLangModalOpen(false); }}
              >
                {l.n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS OVERLAY */}
      {resultsOpen && (
        <div className="results-overlay show" onClick={e => { if (e.target === e.currentTarget) setResultsOpen(false); }}>
          <div className="results-box">
            <div className="results-header">
              <h3>{resultsTitle}</h3>
              <button className="results-close" onClick={() => setResultsOpen(false)}>×</button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: resultsHTML }} />
          </div>
        </div>
      )}
    </>
  );
}
