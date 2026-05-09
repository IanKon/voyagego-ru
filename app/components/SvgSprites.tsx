"use client";

const SPRITES_HTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-plane-tilt" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M21 12c0-.5-.3-.9-.7-1.1L14 7.6V3.5C14 2.7 13.3 2 12.5 2h-1c-.8 0-1.5.7-1.5 1.5v4.1l-6.3 3.3c-.4.2-.7.6-.7 1.1v.5c0 .4.4.8.9.7l6.1-1.7v3.7L8.4 16.6c-.3.2-.4.5-.4.8v.4c0 .4.4.7.8.6l3.2-.8 3.2.8c.4.1.8-.2.8-.6v-.4c0-.3-.1-.6-.4-.8L13 15.2v-3.7l6.1 1.7c.5.1.9-.3.9-.7V12z"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/></symbol>
    <symbol id="i-sparkles" viewBox="0 0 24 24"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75z"/></symbol>
    <symbol id="i-plane" viewBox="0 0 24 24"><path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z"/></symbol>
    <symbol id="i-bed" viewBox="0 0 24 24"><path d="M3 7v11M3 11h18M21 18v-7a3 3 0 0 0 -3 -3h-7v7"/><circle cx="7" cy="13" r="2"/></symbol>
    <symbol id="i-map-pin" viewBox="0 0 24 24"><circle cx="12" cy="11" r="3"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"/></symbol>
    <symbol id="i-car" viewBox="0 0 24 24"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2M9 17h6M2 9h7M16 11l-4 -5"/></symbol>
    <symbol id="i-route" viewBox="0 0 24 24"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h3.5"/></symbol>
    <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 18l6 -6M13 6l6 6"/></symbol>
    <symbol id="i-credit-card" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h.01M11 15h2"/></symbol>
    <symbol id="i-plane-departure" viewBox="0 0 24 24"><path d="M14.639 10.258l5.74 -1.538a1.95 1.95 0 0 1 1.022 3.765l-13.7 3.672l-2.83 -2.362l1.293 -.349l1.532 1.022l2.432 -.652l-3.022 -4.13l1.286 -.46l4.247 3.032zM3 21h18"/></symbol>
    <symbol id="i-world" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/></symbol>
    <symbol id="i-menu-2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
  </defs>
</svg>`;
const HERO_HTML = `<svg class="hero-video" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB88C"/><stop offset="0.5" stop-color="#E89E7C"/><stop offset="1" stop-color="#1A3A52"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#sky)"/>
    <circle cx="1280" cy="220" r="80" fill="#FFE5C4" opacity="0.85"/>
    <polygon points="0,640 220,400 420,540 660,320 880,500 1100,360 1340,520 1600,420 1600,900 0,900" fill="#0F2436" opacity="0.85"/>
    <polygon points="0,720 180,580 460,640 700,500 940,620 1180,540 1400,640 1600,580 1600,900 0,900" fill="#0A1A28"/>
    <rect x="0" y="800" width="1600" height="100" fill="#06111C"/>
  </svg>`;

export function IconSprites() {
  return <div dangerouslySetInnerHTML={{ __html: SPRITES_HTML }} />;
}

export function HeroSvg() {
  return <div style={{position:"absolute",inset:0,zIndex:0,width:"100%",height:"100%"}} dangerouslySetInnerHTML={{ __html: HERO_HTML }} />;
}
