// flight-kinds.js — classify /flights/{locale}/… pages by slug shape, across languages.
// `s` is the lowercased, decoded path-segment array, e.g. ['flights', 'de-de', 'flüge-nach-thailand'].

// localized "from"/"to" words seen in the slugs (en, th, de, it, fr, no, sv, tr, ko, zh, ja).
// Short fr/it words (de, da, a) only count after the vols-/voli- prefix — elsewhere they hit place
// names (e.g. tr "uygun-da-nang-ucak-bileti" = cheap tickets to Da Nang).
// tr: "X-kalkisli" = departing X, "Y-varisli" = arriving Y, "uygun-Y-ucak-bileti" = cheap tickets to Y
// ko: "X-출발" = departing X, "Y-도착" = arriving Y; zh: "飞往"/"前往" = fly/go to
const FROM = /(^|-)(from|จาก|ab|fra|fran|från|kalkisli|kalkışlı|출발)(-|$)|從|出發自|从|から|^voli-da-|^vols-de-|^vols-au-depart-de-/;
const TO = /(^|-)(to|ไป|ไปยัง|nach|per|pour|vers|til|till|行|행|도착|varisli|varışlı)(-|$)|前往|飞往|到|へ|^uygun-|^(voli|vols)-.+-a-/;
const BUSINESS = /^business-class|ชั้นธุรกิจ/;

function flightKind(s) {
  if (s.length === 2) return 'hub';
  if (s.length >= 5) return 'html-sitemap-listing';
  const x = s[2];
  if (BUSINESS.test(x)) return 'business-class-route';
  const f = FROM.test(x); const t = TO.test(x) || (/^vols-/.test(x) && !f); // fr "vols-bangkok" = flights (to) Bangkok
  if (f && t) return 'pair';
  if (t) return 'destination';
  if (f) return 'origin';
  return 'campaign-or-deal';
}

module.exports = { flightKind };
