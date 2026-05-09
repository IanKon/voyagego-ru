import "./globals.css";

export const metadata = {
  title: "VoyageGO — Дешёвые билеты, отели и туры",
  description: "Сравнивайте цены на билеты, отели, экскурсии и туры от Aviasales, Островок, Tripster и других проверенных партнёров. Оплата в рублях.",
  openGraph: {
    title: "VoyageGO — Путешествия в одном месте",
    description: "Билеты, отели, экскурсии — реальные цены, оплата рублями.",
    locale: "ru_RU",
    type: "website",
  },
  alternates: {
    canonical: "https://ru.voyagego.world",
  },
};

export default function L({children}:{children:React.ReactNode}) {
  return <html lang="ru"><body>{children}</body></html>;
}
