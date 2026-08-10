const state = {
  items: [],
  activeCategory: "all",
  query: ""
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  filters: document.getElementById("filters"),
  menuGrid: document.getElementById("menuGrid"),
  emptyState: document.getElementById("emptyState"),
  statusMessage: document.getElementById("statusMessage"),
  backToTop: document.getElementById("backToTop")
};

const priceFormatter = new Intl.NumberFormat("fa-IR");

function normalizeText(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/[ك]/g, "ک")
    .replace(/[يى]/g, "ی")
    .toLowerCase()
    .trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  const numericValue = Number(value) || 0;
  return `${priceFormatter.format(numericValue)} تومان`;
}

function createPlaceholder(title = "کاکتوس") {
  const safeTitle = escapeHtml(title).slice(0, 32);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#1d1d27"/>
          <stop offset="100%" stop-color="#0d0d12"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#ff5a54" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ff5a54" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="500" rx="36" fill="url(#bg)"/>
      <rect width="800" height="500" rx="36" fill="url(#glow)"/>

      <!-- ▼▼▼ لوگوی تو اینجا جایگزین دایره/ستاره‌ی قبلی شد ▼▼▼ -->
      <g transform="translate()" fill="#e53935">
        <g transform="translate(LOGO_W_HALF_NEG, LOGO_H_HALF_NEG)">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2439 1356">
  <g fill="red">
    <path d="M1904.5 176.1c-3.3 1.7-6.2 3.4-6.5 3.8s-15.3 8.3-33.5 17.6c-18.1 9.2-35 17.9-37.4 19.3-2.9 1.7-4.8 2.2-5.7 1.6-.8-.5-5.4-7.9-10.3-16.4-8.2-14.4-9.1-15.5-12-15.8-2.5-.3-3.3.1-4 2-.4 1.3-1.8 11.7-3 23.3-1.3 11.5-2.6 21.9-3.1 23-.4 1.1-2.6 2.9-4.9 4-2.2 1.1-4.1 2.3-4.1 2.7 0 .3-8.9 5.2-19.7 10.9-10.9 5.6-34.6 17.9-52.8 27.4-37.2 19.4-84 43.6-124 64-27.1 13.8-35.6 18.3-36.5 19.4-.3.3-2.8 1.7-5.5 3.1-2.8 1.4-22.5 11.5-43.9 22.5-42.6 21.9-42.6 21.9-42.6 30.6 0 7.9 9.9 80.3 11.5 83.7 1.8 4 6.9 7.2 11.5 7.2 1.9 0 12.5-3.2 23.5-7.1s26.1-9.1 33.5-11.6c7.4-2.6 13.7-5 14-5.3.6-.8 8.3-3.6 59.5-21.5 19.8-6.9 41.6-14.6 48.5-17 6.9-2.5 24.2-8.5 38.5-13.5 14.2-5 26.4-9.4 27-9.9 1.4-1.1 8.3-3.5 119-42.2 40.6-14.2 52-18.3 52.5-18.9.3-.4 7.9-3.2 17-6.4s28-9.8 42-14.8c14-4.9 34.5-12.1 45.4-15.9 11.2-3.9 21-7.8 22.2-9 3-2.8 4.8-8.2 4-12.2-.4-2.2-8.5-13-24.6-33-13.2-16.4-24-30-24-30.3s-11-13.9-24.4-30.3c-13.4-16.3-24.9-30.8-25.5-32-1.8-3.3-7.1-6.1-11.6-6.1-2.6 0-6.2 1.1-10 3.1m419 51.5c-1.6.8-7.1 5.7-12.1 10.7-14.6 14.7-47.4 46-93.4 89.1-13.5 12.6-30.1 28.4-37 35.1-23.9 23.3-54.1 51.5-55.2 51.5-.4 0-5.7-6.4-11.8-14.3-6.1-7.8-12-15.2-13.1-16.5-2.3-2.7-6.5-2.9-7.8-.4-.6 1.1-.6 9.6-.1 23.2.5 11.8.9 25.5 1 30.5v9l-13.3 12.4c-7.2 6.9-22.9 21.8-34.7 33.2-11.8 11.3-23.4 22.3-25.7 24.3l-4.2 3.7-.5-3.3c-.3-1.8-.8-13.7-1.1-26.3-1.7-63.9-3.2-92.9-4.9-96.4-2.5-4.7-9.5-7.7-14.5-6.2-3.4 1-44.4 32.6-48.1 37-.8 1-18.4 15.3-39 31.7s-37.8 30.2-38.2 30.8c-.3.5-9.1 7.7-19.5 16-13.7 11-19.3 16.1-20.7 18.9l-1.8 3.8 3.7 18.7c2 10.3 8.1 39.8 13.5 65.7 5.5 25.8 12.1 58 14.9 71.5 2.7 13.5 7.3 35.5 10.1 49s7.1 34.4 9.6 46.5 6.9 33.5 9.9 47.5 7 33.6 8.9 43.5c2 9.9 7 34.4 11.3 54.4 8.3 39.4 8.8 40.7 15.5 42.7 3.2.9 31.5.7 316.6-2.5 83.3-.9 88.4-1.1 91.5-2.8 1.8-1 4.1-3.5 5.1-5.5l2-3.5-4.2-26.4c-2.3-14.5-8-50.3-12.7-79.4-4.7-29.2-10.6-65.4-13-80.5s-6.9-42.8-9.9-61.5-8.1-50-11.2-69.5l-5.7-35.5-3.6-3.6c-2.8-2.8-4.7-3.7-8.6-4.2-9-1.2-111.9-13.7-117.7-14.4-3.2-.3-5.8-.9-5.8-1.4 0-.4 8.2-6.3 18.3-13 10-6.7 18.7-12.7 19.2-13.4.6-.7 20.8-14.4 45-30.5 24.2-16 44.5-29.7 45-30.4 1.5-1.9 17.8-12.6 19.1-12.6 1.5 0 29.5 10.9 30.9 12 2.1 1.7 28.1 11.1 29.9 10.8 1-.2 2.4-1.1 3-2 1.4-2.3 0-5-14.2-26.7-6.3-9.6-11.6-17.9-11.8-18.6-.3-.7 5.1-4.8 12.3-9.5 7-4.6 14.7-9.8 17-11.7 7-5.6 7-6.5 2.4-39.3-20.8-146.6-22.1-155.1-23.8-157.5-3.7-5.1-11.2-6.8-16.8-3.9M2145.6 676c2.1 1.4 3.9 3.6 5 6.5 2.7 7.2 5.7 2.3-48.7 78.8-11.8 16.7-21.8 31-22.2 31.8-.3.8-7.2 10.6-15.4 21.9-12.5 17.2-15.4 20.6-18.5 21.8-7.3 2.8-15.9-1.4-17.7-8.6-.5-2-1.2-29.4-1.5-60.9-.7-62.6-.8-62 5-65.8 3.4-2.2 101.1-27.3 106.8-27.4 2.3-.1 5.2.7 7.2 1.9M1037 320.1c-80.3 22.3-104.1 28.9-128 35.5-13.5 3.7-24.7 7-25 7.4-.3.3-5.9 2-12.5 3.9-27.3 7.5-78.2 21.5-111 30.6-19.2 5.3-41.6 11.5-49.7 13.7s-15.3 3.8-16 3.5-5.6-9.1-10.8-19.6c-7.7-15.5-10-19.3-11.9-19.8-4.6-1.2-5.4.5-8.3 17.3-1.6 8.7-3.4 19.9-4.1 24.9l-1.3 8.9-5.9 1.7c-3.3 1-19.3 5.4-35.5 9.9-75.8 21-72.9 20.1-76 23.1-5.5 5.5-6.5-.5 18.5 110.4 9.8 43.3 13.5 60.5 13.5 61.9 0 1-6 2.9-21.2 6.5-26.3 6.3-26.8 6.5-26.8 10.1 0 1.5.6 3.2 1.2 3.7.7.5 9.2 4 18.8 7.7 9.6 3.8 18 7.2 18.6 7.7.5.4 5 2.4 9.9 4.2 4.8 1.9 9.1 4.1 9.5 4.8.5.8 3.3 12.9 6.4 26.9s8.8 39.2 12.6 56c3.9 16.8 7 32.1 7 34 0 4-2.9 9.4-5.9 11-1.2.6-11.4 3.3-22.8 6-11.5 2.8-34.7 8.4-51.8 12.5-70.8 17-97.5 23.4-107 25.6-5.5 1.3-10.2 2.6-10.5 3-.3.3-11 3.2-23.9 6.3-23.4 5.7-23.5 5.7-27.8 4.1-2.8-1.1-5.2-3-7-5.7-1.6-2.2-13.3-17.7-26.1-34.4-12.7-16.8-23.2-30.7-23.2-30.9 0-.3-6.1-8.5-13.7-18.2-7.5-9.8-14.5-19.2-15.5-20.8-3.1-5.1-2.4-9.5 2.7-16.9 2.5-3.7 4.5-6.8 4.5-7.1s7.7-11.4 17.2-24.7c9.5-13.4 20.8-29.7 25.3-36.3 4.4-6.6 14.3-20.7 21.8-31.4 14.6-20.7 15.5-22.7 12.2-29.1-.8-1.6-16.3-14.4-37.5-31-19.9-15.5-37.1-29.2-38.3-30.5-2.1-2.1-9.3-7.7-55.2-43-9.9-7.6-20.1-15.7-22.6-18.1-6.1-5.6-9.9-7.4-15.3-7.4-8 0-8.9 1.6-22.5 36.5-6.6 17-14.7 38.2-18 47-5.3 14.2-14.7 38.5-34.9 90.5-3.3 8.5-8 20.9-10.5 27.5s-7.9 20.6-12.1 31.2c-4.2 10.5-7.6 19.5-7.6 19.8 0 .4-5.4 14.5-11.9 31.3-19.4 49.9-18.6 47.2-15.2 52.7 1 1.7 9.4 10 18.7 18.4 9.3 8.5 18.9 17.5 21.4 20s10.7 10.3 18.2 17.3l13.7 12.8-19.2 21.6c-10.6 11.8-19.9 22.6-20.7 24-1.8 2.8-.5 5.7 2.8 6.2 1.1.2 18.1-3.3 37.7-7.7 19.6-4.5 36.4-8.1 37.3-8.1s15.3 12.5 31.9 27.8c16.6 15.2 45 41.2 63.1 57.8 18.1 16.5 34.6 31.9 36.8 34.2 2.1 2.2 16.6 15.5 32.1 29.6 15.6 14.1 32.7 29.9 38 35.2 10.8 10.6 16.4 14 21.6 12.8 3.2-.7 36.8-17.1 37.7-18.4.6-.8 24.6-13.2 79.5-40.9 20.9-10.6 42.1-21.5 47-24.2 5-2.7 31.3-16.2 58.5-29.8 27.2-13.7 52.2-26.5 55.5-28.5s26.3-13.8 51-26.3c74-37.1 81.8-41.2 85.3-44.9 4.1-4.4 4.1-5.2-.7-33.8l-3.8-22.9 2.6-1.4c1.4-.8 12.5-6 24.6-11.7 19.6-9.1 22-10.5 22.3-12.7.2-1.4-.3-3.1-1.1-3.7-.8-.7-13.4-3.4-28.1-6.1s-26.9-5-27.1-5.3c-.2-.2-4.1-22-8.5-48.3-4.4-26.4-9.2-54.1-10.5-61.5-9-50.2-17.6-104.5-17.1-107.4.3-1.8 2.1-4.6 3.9-6.4 2.9-2.8 5.4-3.6 24.7-8.2 11.8-2.8 33-8 47-11.5s33.6-8.2 43.5-10.5 18.2-4.6 18.5-5 14.9-4.2 32.5-8.3c29.8-7.1 90.3-21.6 112.8-27.1 10.6-2.6 14.9-5.4 16.2-10.5.9-3.3 8.9-42.3 16.5-79.6 10.8-53.4 14.9-72.9 17.4-84.8 3.1-14.3 3.2-17 .6-21.2-2-3.2-8.2-6.6-11.8-6.4-.9 0-19.5 5-41.2 11M0 323.5V337h77v-27H0zm1356.5 53.7c-18.6 2.2-188.6 20.7-195.5 21.4-9.9.8-15.2 3.2-17.2 7.5-1.2 2.4-2.4 12.7-4.2 34.3-5.6 65.4-5.6 60.7-.1 65.4 4 3.6 4.8 3.7 39.5 5.2 32.1 1.4 145.8 6.7 170.9 8 32.9 1.6 33.5 1.6 37.7-2.3 2.8-2.6 3.7-4.2 4.1-7.7.2-2.5-.7-19.8-2.1-38.5s-3.3-45.3-4.2-59c-1.8-27.2-2.6-30.4-7.8-33.6-3.4-2.1-7.9-2.2-21.1-.7"/>
    <path d="M1636 460.6c-8 4.8-20.3 12-27.5 16.1-7.1 4.2-13.4 8.1-14 8.8-.5.6-5.3 3.6-10.5 6.7-43.4 25.1-81.8 48.2-83.2 49.9-2.2 2.6-3.2 7.9-2.4 12.1.6 3.5 14.4 20 66.5 79.7 14.1 16.1 27.4 31.6 29.6 34.5 2.1 2.8 11.4 13.6 20.5 24.1 9.1 10.4 17.4 20.1 18.3 21.5 2.2 3.1 2.1 9.6-.1 13.7-1.4 2.6-41.4 35.1-70.7 57.5-6 4.5-11.8 5.1-17.3 1.8-3.7-2.3-3.5-1.8-17.4-34.5-4.8-11-13.2-30.8-18.9-44-5.6-13.2-12.4-29.2-15-35.5s-8.5-20.3-13.2-31c-4.6-10.7-12.4-28.6-17.2-39.8-12.3-28.3-13.1-28.9-32.7-22.2-6.8 2.3-38.8 13.3-71.3 24.5-32.4 11.1-62.7 21.5-67.2 22.9-10.1 3.4-14.3 7.4-14.3 13.7 0 2.2.5 5 1.2 6.2 1.5 2.9 21.9 30.2 44.8 60.2 14.9 19.3 24.5 32.6 26.5 36.5s1.9 6.3-.5 11c-2.1 4.2-3.5 5-24.4 14-29.4 12.8-48.3 21.2-50.3 22.5-3.7 2.5-9.1 1.9-13.3-1.5-4.6-3.6-4.3-2.8-13.5-34-4.2-14-10.5-35-14-46.5-3.5-11.6-7.8-26-9.6-32-3.2-11.2-14.6-49-20.1-66.7-3.2-10.7-6.1-14.3-12.1-15.2-1.8-.3-16.7-1.4-33.2-2.6-26.7-1.8-101.8-6.9-147.7-10.1-18-1.3-20.7-.9-24.5 3.4-1.8 2-47.3 81.1-47.3 82.2 0 .3-7.7 13.8-17.1 30.1s-17.3 30.4-17.7 31.3c-.3.9-4.5 8.4-9.2 16.6-15.5 26.8-15.2 25.5-8.1 37.2 2.6 4.4 5 8.5 5.2 9.1s8.4 14 18.2 29.9c9.8 15.8 27.3 44.3 38.9 63.3 11.5 19 22.2 35.8 23.7 37.3 5.5 5.6 8.2 5.2 52.6-8.3 103.5-31.3 102.6-31.1 108.6-25.4 3.4 3.3 4.5 6.6 5.4 16.1.8 8.7-.5 13.5-4.5 16.3-1.6 1.2-14.5 5.4-28.7 9.5-14.2 4-36.1 10.3-48.8 14-65.6 19-96.2 27.8-98 28.3-1.1.3-2.2.8-2.5 1.2s-5.4 2.1-11.5 3.7c-6 1.7-22.7 6.5-37 10.6-32 9.3-65.6 19-118.5 34.2-22.3 6.4-40.7 12-41 12.4s-6.6 2.4-14 4.4c-21.1 5.9-54.1 15.6-58.7 17.3-7.2 2.6-10.5 11.3-6.9 18.3 1.9 3.7 4 4.9 16.5 10 14.5 6 26.5 11.3 27.1 12 .5.6 14.8 6.8 79.5 34.2 19.8 8.4 36.4 15.6 36.9 16 1 .9.3 2.8-10.2 27.2-5.9 14-7.4 18.2-6.5 19.5 2 3.4 5.7 2.5 15.9-3.6 28.4-17.2 41-24.5 42.1-24.5.6 0 10.8 4.1 22.6 9.1 12.7 5.5 22.8 9.2 24.8 9.2 3.3 0 87.9-24.7 88.9-26 .3-.3 9.1-3.1 19.5-6.2 10.5-3.1 42.4-12.7 71-21.2s54.6-16.2 57.8-17.1c3.3-.9 7.2-2.9 8.8-4.3 3.1-2.9 2.5-1.3 34-100.2 21.5-67.8 20.8-65.7 23.9-68.3 1.6-1.4 4.5-2.8 6.4-3.1 4-.8 4.9-.4 47.1 17.4 13.2 5.6 28.5 12 34 14.3 5.5 2.2 10.2 4.4 10.5 4.8s6 3 12.8 5.9c17.4 7.3 16.6 7.5 34.5-10.2 22.1-21.8 46-44.4 48.4-45.7 3.3-1.7 9.4-1.3 13.1.9 4 2.5 5.2 5.2 8.6 20.2 2.5 10.5 3.1 12 6.1 14.7 1.9 1.7 4.9 3.2 6.7 3.5s42.9 1.2 91.3 2.1 93.2 1.7 99.5 1.9 12.9-.1 14.6-.6c1.8-.4 10.5-6.9 19.5-14.4 10.8-8.9 16.8-13.3 17.8-12.9 52.5 20.2 64.4 24.5 66.1 24 4.9-1.6 3.8-4.2-13.6-30.5l-16.7-25.4 2.6-2c12.9-10.6 59.9-50.6 62.2-53 1.7-1.7 7.2-6.6 12.2-10.8 12.1-10.2 13-12.7 8.6-23.1-9.8-22.8-18.2-41.7-27.3-61.7-5.6-12.4-10.4-23.2-10.7-24-.6-1.5-17.4-39.3-42.8-96-7.5-16.8-18.4-41.2-24.2-54.2l-10.5-23.8 5.1-5.7c2.8-3.2 11.3-12.7 18.8-21.1 16.4-18.3 17.8-20.3 16.3-23.1-.6-1.2-2.1-2.1-3.3-2.1-2.1 0-25.2 4.8-43 9-4.8 1.1-9.5 2-10.5 2-1.2 0-3.7-4.5-9-16.8-12.7-28.9-22.5-50.2-23.1-50.2-.3.1-7.1 3.9-15.1 8.6"/>
    <path d="m1276.9 1059.9-2.9 2.9v49.7c0 55.6-.1 54.5 6.8 56.4 2 .6 12 1.1 22.2 1.1 15.6 0 19-.3 22-1.8 5.4-2.7 6-4.8 6-23V1129h-20v23.1l-8.7-.3-8.8-.3-.3-38.8-.2-38.7h18v21h20v-14.4c0-7.9-.5-15.7-1.1-17.5-2-5.6-4.3-6.1-28.4-6.1h-21.7zm95.1 53.6v56.5h19v-96h18.1l-.3 15.7-.3 15.8-7.7.3-7.8.3v5.7c0 4.6 1.5 9.9 7.6 27.2 4.2 11.8 8.4 23.5 9.3 26l1.7 4.5 9.9.3 9.8.3-.6-3c-.5-2.3-11-31.8-16.3-45.5-.4-1 .7-1.6 4.5-2.1s5.6-1.4 7.1-3.2c1.9-2.4 2-4.1 2-27.9 0-25.3 0-25.3-2.4-28.1l-2.4-2.8-25.6-.3-25.6-.3zm98-54.3v53.2c0 56.7-.3 54.6 6.7 56.5 4.9 1.4 38.7 1.4 43.5.1 7.1-2 6.8.5 6.8-58.7V1057h-19v95h-19v-95h-9.5c-9.2 0-9.5.1-9.5 2.2m99 54.3v56.5h19l.2-28.8c.2-17.7.6-27.9 1.2-26.7.5 1.1 4.6 11.9 9.2 24 4.7 12.1 9.2 24 10.2 26.5l1.8 4.5h8.2c4.5 0 8.2-.3 8.2-.8V1057h-18.5l.1 28c.1 15.4-.2 27.8-.6 27.5-.5-.3-2-3.8-3.5-7.8-1.5-3.9-6.3-16.3-10.7-27.5l-8-20.2H1569zm105-55.2c-4.9 2.5-5 2.8-5 55 0 55.2-.2 53.8 7.1 55.7 2.6.7 11.6 1 24 .8l19.9-.3 2.7-2.8 2.8-2.7.3-17.6.3-17.5-9.8.3c-11.3.3-10-1.4-10.2 14.1l-.1 8.8-8.7-.3c-4.9-.2-8.7-.6-8.5-1.1.1-.4.2-17.8.2-38.7v-38h17l.1 7.7c.2 14.3-1 12.8 10.2 13.1l9.7.3v-14.4c0-16.1-.9-20.1-5.1-22.2-3.8-2-43.1-2.1-46.9-.2m93.2 54.9.3 56.3h18.8l.2-24.5.1-24.5h18.9l.3 24.7.2 24.8h19v-113h-19v45h-19l-.1-3.8V1081c0-7.4-.2-15.9-.6-18.8l-.6-5.2H1767zm160.8-55.5v111.8l17.7.3c22.1.3 27-.6 32.9-6 6.4-5.9 6.6-7.7 6.2-53.9l-.3-39.5-2.8-4.2c-1.5-2.3-4.6-5.2-7-6.4-3.9-2.1-5.6-2.3-25.4-2.6-11.7-.2-21.3 0-21.3.5m35.6 18.4c1.8 2 1.9 4.3 2.2 36.5l.3 34.4-2.5 2.5c-2.2 2.2-3.4 2.5-9.6 2.5h-7v-78h7.3c6.2 0 7.7.3 9.3 2.1m62.6 37.1.3 56.3 9.8.3 9.7.3V1057h-20zm61.8.3v56.5h19l.2-28.8.3-28.7 7.7 20c4.3 11 9.1 23.9 10.9 28.7l3.1 8.8h16.8v-113h-19l-.1 28.2c-.1 31.7.3 30.9-6.4 12.3-1.8-5-6.1-16.1-9.5-24.8l-6.1-15.7H2088zm100 0v56.5h48v-17.9l-14.2-.3-14.3-.3-.3-15.3-.3-15.2h25.1v-16.9l-12.2-.3-12.3-.3v-29l14.3-.3 14.2-.3V1057h-48zm88 0v56.5h19l.2-47.8.3-47.7 8.8-.3 8.7-.3v32.1h-16v6.2c0 5.1 1.2 9.6 7.4 26.7 4.1 11.3 8.1 23 9.1 25.8l1.7 5.3h9.9c5.7 0 9.9-.4 9.9-1 0-1.6-4.5-14.6-10.9-31.8-3.4-8.9-6.1-16.4-6.1-16.6s2.1-.7 4.6-1.1c2.9-.4 5.6-1.6 7-3l2.4-2.4v-51l-2.4-2.8-2.4-2.8-25.6-.3-25.6-.3z"/>
  </g>
</svg>
        </g>
      </g>
      <!-- ▲▲▲ پایان لوگو ▲▲▲ -->

      <text x="400" y="360" text-anchor="middle" fill="#f5f5f7" font-size="55" font-family="Vazirmatn, Arial, sans-serif">کاکتوس</text>
      <text x="400" y="410" text-anchor="middle" fill="#b4b4bf" font-size="55" font-family="Vazirmatn, Arial, sans-serif">${safeTitle}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}


function resolveImageSource(value, title) {
  const trimmed = String(value ?? "").trim();
  return trimmed || createPlaceholder(title);
}

function uniqueCategories(items) {
  return [...new Set(items.map((item) => String(item.category || "").trim()).filter(Boolean))];
}

function renderFilters(categories) {
  const buttons = [
    { key: "all", label: "همه" },
    ...categories.map((category) => ({ key: category, label: category }))
  ];

  elements.filters.innerHTML = buttons
    .map(
      (button) => `
        <button
          class="filter-btn${button.key === state.activeCategory ? " is-active" : ""}"
          type="button"
          data-category="${escapeHtml(button.key)}"
          role="tab"
          aria-pressed="${button.key === state.activeCategory ? "true" : "false"}"
        >
          ${escapeHtml(button.label)}
        </button>
      `
    )
    .join("");

  elements.filters.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category || "all";
      updateActiveFilterUI();
      renderMenu();
    });
  });
}

function updateActiveFilterUI() {
  elements.filters.querySelectorAll(".filter-btn").forEach((button) => {
    const isActive = (button.dataset.category || "all") === state.activeCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function matchesQuery(item, query) {
  if (!query) return true;

  const haystack = normalizeText(
    [
      item.name,
      item.category,
      item.description,
      item.badge
    ].join(" ")
  );

  return haystack.includes(query);
}

function renderMenu() {
  const query = normalizeText(state.query);

  const filteredItems = state.items.filter((item) => {
    const matchesCategory =
      state.activeCategory === "all" || String(item.category || "") === state.activeCategory;
    return matchesCategory && matchesQuery(item, query);
  });

  elements.menuGrid.innerHTML = filteredItems
    .map((item) => {
      const imageSrc = resolveImageSource(item.image, item.name);
      const tagLabel = item.badge || item.category || "ویژه";
      const price = formatPrice(item.price);

      return `
        <article class="menu-card">
          <figure class="menu-card__media">
            <img
              src="${escapeHtml(imageSrc)}"
              alt="${escapeHtml(item.name)}"
              loading="lazy"
              decoding="async"
            />
            <span class="menu-card__badge">${escapeHtml(tagLabel)}</span>
          </figure>

          <div class="menu-card__body">
            <div class="menu-card__title-row">
              <div>
                <h2 class="menu-card__title">${escapeHtml(item.name)}</h2>
                <p class="menu-card__category">${escapeHtml(item.category || "")}</p>
              </div>
            </div>

            <p class="menu-card__description">${escapeHtml(item.description || "")}</p>

            <div class="menu-card__meta">
              <span class="menu-card__price"><strong>${price}</strong></span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  bindImageFallbacks();

  const hasItems = filteredItems.length > 0;
  elements.emptyState.hidden = hasItems;
  elements.menuGrid.hidden = !hasItems;

  if (hasItems) {
    elements.statusMessage.textContent = "";
  } else {
    elements.statusMessage.textContent = "موردی برای نمایش پیدا نشد.";
  }
}

function bindImageFallbacks() {
  elements.menuGrid.querySelectorAll("img").forEach((imageElement) => {
    imageElement.addEventListener(
      "error",
      () => {
        if (imageElement.dataset.fallbackApplied === "true") return;
        imageElement.dataset.fallbackApplied = "true";
        imageElement.src = createPlaceholder(imageElement.alt || "کاکتوس");
      },
      { once: true }
    );
  });
}

async function loadMenu() {
  elements.statusMessage.textContent = "در حال بارگذاری منو...";
  try {
    const response = await fetch("menu.json", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid menu format");
    }

    state.items = data;
    renderFilters(uniqueCategories(data));
    renderMenu();
    elements.statusMessage.textContent = "";
  } catch (error) {
    console.error("Failed to load menu.json:", error);
    elements.statusMessage.textContent = "بارگذاری منو با خطا مواجه شد.";

    elements.menuGrid.innerHTML = "";
    elements.menuGrid.hidden = true;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("h2").textContent = "خطا در دریافت منو";
    elements.emptyState.querySelector("p").textContent =
      "فایل menu.json در دسترس نیست یا فرمت آن معتبر نیست.";
  }
}

function handleSearchInput(event) {
  state.query = event.target.value || "";
  renderMenu();
}

function setupBackToTop() {
  const toggleButton = () => {
    const shouldShow = window.scrollY > 320;
    elements.backToTop.classList.toggle("is-visible", shouldShow);
  };

  window.addEventListener("scroll", toggleButton, { passive: true });
  toggleButton();

  elements.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

elements.searchInput.addEventListener("input", handleSearchInput);
setupBackToTop();
loadMenu();
