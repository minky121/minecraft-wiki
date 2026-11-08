(() => {
"use strict";
document.documentElement.classList.add("js");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const staticMode = reduce || navigator.webdriver || /static/.test(location.search);

/* ---------- Pixel helpers ---------- */
function rand(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const pick = (pal, x, y, s) => pal[Math.floor(rand(x, y, s) * pal.length) % pal.length];
function draw(w, h, fn) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const px = (x, y, col) => { if (!col || x < 0 || y < 0 || x >= w || y >= h) return; ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); };
  const fill = (col, x, y, s) => Array.isArray(col) ? pick(col, x, y, s) : col;
  const rect = (x, y, ww, hh, col, s = 0) => { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) px(x + i, y + j, fill(col, x + i, y + j, s)); };
  const map = (x, y, rows, legend, s = 0) => rows.forEach((r, j) => [...r].forEach((ch, i) => { const v = legend[ch]; if (v) px(x + i, y + j, fill(v, x + i, y + j, s)); }));
  fn({ ctx, px, rect, map, fill, w, h });
  return c;
}
const tex = fn => draw(16, 16, ({ px }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, fn(x, y)); });
function put(el, src) {
  el.width = src.width; el.height = src.height;
  el.getContext("2d").drawImage(src, 0, 0);
  el.style.setProperty("--pw", src.width);
  return el;
}
function cv(src, cls, k) {
  const c = document.createElement("canvas");
  if (cls) c.className = cls;
  c.setAttribute("aria-hidden", "true");
  if (k) c.style.setProperty("--k", k);
  return put(c, src);
}
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; };
function sample(c, n = 8) {
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, out = [];
  for (let i = 0; i < 40 && out.length < n; i++) {
    const p = Math.floor(rand(i, 7, 77) * c.width * c.height) * 4;
    if (d[p + 3] > 200) out.push(`rgb(${d[p]},${d[p + 1]},${d[p + 2]})`);
  }
  return out.length ? out : ["#888"];
}

/* ---------- Palettes & textures ---------- */
const P = {
  dirt: ["#866043", "#79553a", "#966c4a", "#5d4130", "#6c4d36"],
  grass: ["#5d9b2f", "#6aab38", "#4f8a28", "#79bd45", "#558f2c"],
  stone: ["#7f7f7f", "#747474", "#8a8a8a", "#6b6b6b", "#959595", "#7a7a7a"],
  sand: ["#dbd3a0", "#e2dbb0", "#d1c78f", "#e8e1b8"],
  log: ["#6b5130", "#5c4426", "#7a5e38", "#4d3920"],
  planks: ["#b8945f", "#a88550", "#c4a46e", "#ad8a55"],
  obsidian: ["#0f0a18", "#1d1030", "#140c22", "#0b0712", "#140c22", "#3b2a54"],
  nether: ["#6f3534", "#8a4140", "#5a2827", "#7d3a39", "#4b2121"],
  end: ["#dbdea0", "#e8eab4", "#c9cc8e", "#d2d596"],
  cobble: ["#7a7a7a", "#8f8f8f", "#6a6a6a", "#a3a3a3"],
  diamond: ["#5decf5", "#2bc7d0", "#b8fffb"],
  leaves: ["#3f8a2a", "#4d9c33", "#2f6f1f", "#5aae3d", "#2a5e1a"],
  spruce: ["#2e4f2e", "#294a29", "#365c36"],
};
const T = {};
T.dirt = tex((x, y) => pick(P.dirt, x, y, 1));
T.grassTop = tex((x, y) => pick(P.grass, x, y, 2));
T.grassSide = tex((x, y) => { const d = 3 + (rand(x, 0, 7) < .5 ? 1 : 0) + (rand(x, 1, 8) < .25 ? 1 : 0); return y < d ? pick(P.grass, x, y, 3) : pick(P.dirt, x, y, 4); });
T.stone = tex((x, y) => pick(P.stone, x, y, 5));
const cells = [[2, 2], [8, 1], [13, 4], [4, 7], [10, 8], [1, 12], [7, 13], [13, 12]];
T.cobble = tex((x, y) => {
  let d1 = 99, d2 = 99, k = 0;
  cells.forEach(([cx, cy], i) => { for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) { const d = Math.hypot(x - cx - ox, y - cy - oy); if (d < d1) { d2 = d1; d1 = d; k = i; } else if (d < d2) d2 = d; } });
  if (d2 - d1 < 1.1) return rand(x, y, 6) < .5 ? "#4f4f4f" : "#595959";
  return P.cobble[(k + (rand(x, y, 7) < .3 ? 1 : 0)) % P.cobble.length];
});
T.log = tex((x, y) => pick(P.log, x, Math.floor(y / 3) + (x % 3 === 0 ? 7 : 0), 8));
T.logTop = tex((x, y) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); if (d > 6.5) return pick(P.log, x, y, 9); return Math.floor(d) % 2 ? "#b8945f" : "#9c7a48"; });
T.planks = tex((x, y) => { const b = Math.floor(y / 4); if (y % 4 === 3) return "#7e6339"; if (x === (b % 2 ? 4 : 11)) return "#8f7043"; return pick(P.planks, x, y, 10); });
T.sand = tex((x, y) => pick(P.sand, x, y, 11));
const ores = [[3, 3], [11, 4], [5, 11], [12, 12], [8, 8]];
T.diamond = tex((x, y) => { for (const [ox, oy] of ores) { const d = Math.abs(x - ox) + Math.abs(y - oy); if (d === 0) return "#e8ffff"; if (d === 1) return pick(P.diamond, x, y, 12); } return pick(P.stone, x, y, 13); });
T.obsidian = tex((x, y) => pick(P.obsidian, x, y, 14));
T.nether = tex((x, y) => pick(P.nether, x, y, 15));
T.endstone = tex((x, y) => pick(P.end, x, y, 16));
const TNT = ["XXX.X..X.XXX", ".X..XX.X..X.", ".X..X.XX..X.", ".X..X..X..X."];
T.tntSide = tex((x, y) => {
  if (y >= 5 && y <= 10) { if (y === 5 || y === 10) return "#d8d8d8"; const r = TNT[y - 6]; return r && r[x - 2] === "X" ? "#1a1a1a" : "#f0f0f0"; }
  return x % 4 === 0 ? "#b52d20" : (rand(x, y, 17) < .2 ? "#e8513f" : "#db3a2a");
});
T.tntTop = tex((x, y) => {
  if (x >= 6 && x <= 9 && y >= 6 && y <= 9) return (x === 7 || x === 8) && (y === 7 || y === 8) ? "#3a3a3a" : "#8a8a8a";
  return x === 0 || y === 0 || x === 15 || y === 15 ? "#8f1f15" : pick(["#db3a2a", "#c9321f", "#e04634"], x, y, 18);
});
T.tableTop = tex((x, y) => { if (x === 0 || y === 0 || x === 15 || y === 15) return "#5c4426"; if (x === 5 || x === 10 || y === 5 || y === 10) return "#6b4f2a"; return pick(P.planks, x, y, 19); });
T.tableSide = tex((x, y) => {
  if (y < 3) return y === 2 ? "#5c4426" : pick(P.planks, x, y, 20);
  if (x < 2 || x > 13) return pick(P.log, x, y, 21);
  if (y >= 5 && y <= 11 && x >= 4 && x <= 6) return y < 8 ? "#a8a8a8" : "#6b5130";
  if (y >= 5 && y <= 11 && x >= 9 && x <= 11) return (x + y) % 2 ? "#9c9c9c" : "#cfcfcf";
  return pick(P.planks, x, y, 22);
});
T.furnace = tex((x, y) => {
  if (x >= 4 && x <= 11 && y >= 8 && y <= 13) return y >= 12 ? "#ff8a1f" : "#1f1f1f";
  if (x >= 4 && x <= 11 && y >= 3 && y <= 4) return "#3a3a3a";
  return pick(["#7a7a7a", "#6e6e6e", "#858585", "#5f5f5f"], x, y, 23);
});
T.leaves = tex((x, y) => rand(x, y, 24) < .12 ? null : pick(P.leaves, x, y, 25));

/* ---------- Items & icons ---------- */
const I = {};
I.stick = draw(16, 16, ({ px }) => { for (let i = 0; i < 10; i++) { px(3 + i, 12 - i, "#6b5130"); px(4 + i, 12 - i, "#8a6a3e"); } });
I.coal = draw(16, 16, ({ px }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 8) + (rand(x, y, 26) - .5) * 1.6; if (d < 5.6) px(x, y, d < 2.4 && rand(x, y, 27) < .4 ? "#5a5a5a" : pick(["#1a1a1a", "#2b2b2b", "#232323", "#3a3a3a"], x, y, 28)); } });
I.torch = draw(16, 16, ({ rect, px }) => { rect(7, 6, 2, 10, ["#6b5130", "#7a5e38"]); rect(7, 3, 2, 3, "#ffd84a"); px(7, 2, "#fff3a0"); px(8, 2, "#ffb03a"); px(6, 4, "#ff9a1f"); px(9, 4, "#ff9a1f"); px(7, 5, "#ff9a1f"); });
I.pickaxe = draw(16, 16, ({ map }) => map(0, 0, [
  "................", "....PPPPPPP.....", "...PPppppppPP...", "..PP...SS...PP..", "..P....SS....P..",
  ".......SS.......", ".......SS.......", ".......SS.......", ".......SS.......", ".......SS.......",
  ".......SS.......", ".......SS.......", ".......SS.......", ".......SS......."
], { P: "#b8945f", p: "#8f7043", S: ["#6b5130", "#7a5e38"] }));
I.sword = draw(16, 16, ({ px }) => {
  px(13, 2, "#e0e0e0");
  for (let i = 0; i < 7; i++) { px(12 - i, 3 + i, "#c8c8c8"); px(13 - i, 3 + i, "#8a8a8a"); px(12 - i, 4 + i, "#6f6f6f"); }
  [[3, 8], [4, 9], [5, 10], [6, 11], [7, 12]].forEach(([x, y]) => px(x, y, "#5a3d28"));
  px(4, 11, "#6b5130"); px(3, 12, "#6b5130"); px(2, 13, "#7a5e38"); px(1, 14, "#8a8a8a");
});
const heartRows = [".KKK.KKK.", "KRRWKRRRK", "KRWRRRRRK", "KRRRRRRRK", ".KRRRRRK.", "..KRRRK..", "...KRK...", "....K...."];
I.heart = draw(9, 8, ({ map }) => map(0, 0, heartRows, { K: "#2b0c0c", R: "#e5281f", W: "#ffffff" }));
I.hardcore = draw(9, 8, ({ map }) => map(0, 0, heartRows, { K: "#111111", R: "#8f1212", W: "#ff7b7b" }));
I.eye = draw(9, 7, ({ map }) => map(0, 0, ["..KKKKK..", ".KWWWWWK.", "KWWBBBWWK", "KWWBKBWWK", "KWWBBBWWK", ".KWWWWWK.", "..KKKKK.."], { K: "#222222", W: "#f2f2f2", B: "#3a7bd5" }));
I.map = draw(10, 10, ({ map }) => map(0, 0, ["BBBBBBBBBB", "BPPPPPPPPB", "BPLLLPPPPB", "BPPPPPXPXB", "BPLLPPPXPB", "BPPPPPXPXB", "BPLLLLPPPB", "BPPPPPPPPB", "BPLLPPPPPB", "BBBBBBBBBB"], { B: "#8a6a3e", P: ["#e8d9a8", "#dccb94"], L: "#a08850", X: "#c0392b" }));
I.book = draw(16, 16, ({ rect }) => { rect(2, 2, 11, 12, ["#7a4a22", "#6b3f1c"]); rect(13, 3, 1, 11, "#f2ead6"); rect(3, 14, 11, 1, "#f2ead6"); rect(5, 5, 6, 1, "#e0b850"); rect(5, 7, 4, 1, "#e0b850"); rect(2, 2, 2, 12, "#4e2d12"); });
const G = ["#5cb85c", "#4ca64c", "#7fcf6f", "#3e9c3e", "#69c269", "#2f8a2f"];
const CF = ["GGGGGGGG", "GGGGGGGG", "GKKGGKKG", "GKKGGKKG", "GGGKKGGG", "GGKKKKGG", "GGKKKKGG", "GGKGGKGG"];
const CL = { G, K: ["#111111", "#1d1d1d", "#0a0a0a"] };
I.creeperFace = draw(8, 8, ({ map }) => map(0, 0, CF, CL, 41));

/* ---------- Characters ---------- */
function humanoid(o) {
  return draw(16, 32, ({ ctx, rect, map }) => {
    map(4, 0, o.head, o.L, 30);
    rect(4, 8, 8, 12, o.shirt, 31);
    if (o.torso) map(4, 8, o.torso, o.L, 30);
    const sl = o.sleeve ?? 12;
    rect(0, 8, 4, sl, o.shirt, 32); rect(12, 8, 4, sl, o.shirt, 33);
    if (sl < 12) { rect(0, 8 + sl, 4, 12 - sl, o.L.S, 34); rect(12, 8 + sl, 4, 12 - sl, o.L.S, 35); }
    rect(4, 20, 4, 10, o.pants, 36); rect(8, 20, 4, 10, o.pants, 37);
    rect(4, 30, 4, 2, o.shoes, 38); rect(8, 30, 4, 2, o.shoes, 39);
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.fillRect(3, 8, 1, 12); ctx.fillRect(12, 8, 1, 12); ctx.fillRect(7, 20, 1, 12); ctx.fillRect(4, 19, 8, 1);
  });
}
const S = {};
S.steve = humanoid({
  head: ["HHHHHHHH", "HHHHHHHH", "HSSSSSSH", "SSSSSSSS", "SWESSEWS", "SSSNNSSS", "SSMMMMSS", "SSSSSSSS"],
  L: { H: ["#3b2a1a", "#2f2113", "#45321f"], S: ["#c69472", "#bd8b68", "#cf9d7b"], W: "#ffffff", E: "#4a3a8c", N: "#8a4d3d", M: "#6a3a2a" },
  shirt: ["#00a8a8", "#009c9c", "#00b2b2"], sleeve: 4, torso: ["..SSSS..", "...SS..."],
  pants: ["#463aa5", "#3c3196", "#4b40b0"], shoes: ["#6b6b6b", "#5a5a5a"]
});
S.alex = humanoid({
  head: ["HHHHHHHH", "HHHHHHHH", "HHSSSSSH", "HSSSSSSH", "HWESSEWH", "HSSSSSSH", "HSSMMSSH", "HSSSSSSH"],
  L: { H: ["#e8833a", "#d26f2a", "#f09a4c"], S: ["#f1c6a0", "#eab38e", "#f6d1b0"], W: "#ffffff", E: "#3b8c3b", M: "#c9846a" },
  shirt: ["#7ab36a", "#6aa35a", "#86bf76"], sleeve: 3, torso: ["H.......", "H.......", "H......."],
  pants: ["#6b4a2b", "#5e4024", "#77532f"], shoes: ["#3f3f3f", "#4a4a4a"]
});
S.zombie = humanoid({
  head: ["HHHHHHHH", "HSSHSSHH", "SSSSSSSS", "SSSSSSSS", "SKKSSKKS", "SSSNNSSS", "SSSSSSSS", "SSSSSSSS"],
  L: { H: ["#2e5a22", "#264d1c"], S: ["#4f8f3a", "#447e32", "#5a9c43"], K: "#1a1a1a", N: "#3a6a2b" },
  shirt: ["#00a0a0", "#008c8c", "#009696"], sleeve: 3,
  pants: ["#463aa5", "#3c3196"], shoes: ["#33335a", "#2b2b4a"]
});
S.skeleton = draw(16, 32, ({ rect, map }) => {
  const B = ["#c8c8c8", "#bcbcbc", "#d4d4d4"];
  map(4, 0, ["BBBBBBBB", "BBBBBBBB", "BBBBBBBB", "BDDBBDDB", "BDDBBDDB", "BBBDDBBB", "BBDDDDBB", "BBBBBBBB"], { B, D: "#3a3a3a" });
  map(4, 8, ["BBBBBBBB", "...BB...", ".BBBBBB.", "...BB...", ".BBBBBB.", "...BB...", ".BBBBBB.", "...BB...", "...BB...", "..BBBB..", "..BBBB.."], { B });
  rect(2, 8, 2, 12, B); rect(12, 8, 2, 12, B);
  rect(5, 19, 2, 13, B); rect(9, 19, 2, 13, B);
});
S.creeper = draw(8, 26, ({ ctx, rect, map }) => {
  map(0, 0, CF, CL, 41);
  rect(0, 8, 8, 12, G, 42);
  rect(0, 20, 8, 6, ["#3e9c3e", "#2f8a2f", "#4ca64c"], 43);
  ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(0, 8, 8, 1); ctx.fillRect(3, 20, 1, 6); ctx.fillRect(0, 25, 8, 1);
});
S.enderman = draw(12, 50, ({ rect, map }) => {
  const B = ["#161616", "#0e0e0e", "#1f1f1f", "#121212"];
  map(2, 0, ["BBBBBBBB", "BBBBBBBB", "BBBBBBBB", "BBBBBBBB", "PQPBBPQP", "BBBBBBBB", "BBBBBBBB", "BBBBBBBB"], { B, P: "#cc00fa", Q: "#f3b6ff" });
  rect(2, 8, 8, 12, B); rect(0, 8, 2, 30, B); rect(10, 8, 2, 30, B);
  rect(3, 20, 2, 30, B); rect(7, 20, 2, 30, B);
});
S.pig = draw(22, 13, ({ rect, px }) => {
  const Pk = ["#f0a5a2", "#eb9b98", "#f5b0ad"];
  rect(1, 10, 3, 3, "#d98a87"); rect(10, 10, 3, 3, "#d98a87"); rect(1, 12, 3, 1, "#a86562"); rect(10, 12, 3, 1, "#a86562");
  rect(0, 2, 14, 8, Pk, 51); rect(0, 9, 14, 1, "#d98a87");
  rect(13, 1, 7, 8, Pk, 52); rect(13, 1, 7, 1, "#f7bcb9");
  rect(20, 4, 2, 3, "#f7b7b4"); px(21, 4, "#8a4a4a"); px(21, 6, "#8a4a4a");
  px(17, 3, "#ffffff"); px(18, 3, "#111111"); px(0, 3, "#d98a87");
});
S.cow = draw(24, 16, ({ rect, px }) => {
  const B = ["#4a3020", "#3e281a", "#54382a"], W = ["#e8e8e8", "#dcdcdc"];
  rect(1, 12, 3, 4, B); rect(12, 12, 3, 4, B); rect(1, 15, 3, 1, "#2a1a10"); rect(12, 15, 3, 1, "#2a1a10");
  rect(0, 3, 16, 9, B, 61);
  rect(3, 4, 4, 3, W, 62); rect(9, 7, 4, 4, W, 63); rect(1, 9, 3, 2, W, 64); rect(12, 3, 3, 2, W, 65);
  rect(7, 12, 2, 1, "#e8a8a8");
  rect(15, 1, 8, 8, B, 66); rect(19, 2, 3, 3, W, 67);
  rect(20, 5, 4, 4, "#c9b6a0"); px(23, 6, "#5a4a3a"); px(23, 8, "#5a4a3a");
  px(17, 3, "#ffffff"); px(18, 3, "#111111");
  rect(15, 0, 2, 1, "#d8d0b8"); rect(21, 0, 2, 1, "#d8d0b8");
});

/* ---------- Landscapes ---------- */
function scene(o) {
  const W = 64, H = 32;
  return draw(W, H, d => {
    const { px, rect, fill, ctx } = d;
    for (let y = 0; y < H; y++) { ctx.fillStyle = mix(o.sky[0], o.sky[1], Math.floor(y / 4) * 4 / H); ctx.fillRect(0, y, W, 1); }
    if (o.stars) for (let i = 0; i < o.stars; i++) px(Math.floor(rand(i, 3, 91) * W), Math.floor(rand(i, 4, 92) * H * .55), rand(i, 5, 93) < .3 ? "#d27cff" : "#ffffff");
    if (o.sun) { rect(o.sun[0], o.sun[1], 5, 5, "#fff36b"); rect(o.sun[0] + 1, o.sun[1] + 1, 3, 3, "#fffbd0"); }
    if (o.before) o.before(d);
    const hs = [];
    for (let x = 0; x < W; x++) hs[x] = Math.round(o.base + Math.sin(x * o.freq + o.seed) * o.amp + Math.sin(x * o.freq * 2.3 + o.seed * 2) * o.amp * .45 + (rand(x, 0, o.seed) - .5) * (o.jitter || 0));
    for (let x = 0; x < W; x++) {
      if (o.water != null && hs[x] > o.water) for (let y = o.water; y < hs[x]; y++) px(x, y, y === o.water ? (o.waterTop || "#5a8ff0") : fill(o.waterCol || ["#3f6fdd", "#3a66cc"], x, y, 94));
      for (let y = hs[x]; y < H; y++) px(x, y, fill(y < hs[x] + (o.topDepth || 1) ? o.top : (o.deep && y > hs[x] + 4 ? o.deep : o.fill), x, y, 95));
    }
    if (o.after) o.after(d, hs);
  });
}
const oak = (d, x, g, leaf = P.leaves, trunk = P.log) => { d.rect(x - 2, g - 6, 5, 3, leaf, x); d.rect(x - 1, g - 7, 3, 1, leaf, x + 1); d.rect(x, g - 4, 1, 4, trunk); };
const birch = (d, x, g) => oak(d, x, g, ["#6aa040", "#5c9436", "#78ae4a"], ["#e0e0d8", "#d0d0c8", "#2a2a2a"]);
const spruce = (d, x, g, snow) => {
  d.rect(x, g - 3, 1, 3, P.log);
  [[-2, 3, 5], [-1, 4, 3], [-2, 5, 5], [-1, 6, 3], [0, 8, 1], [0, 7, 1]].forEach(([dx, dy, w]) => d.rect(x + dx, g - dy, w, 1, P.spruce, x));
  if (snow) { d.px(x, g - 8, "#ffffff"); d.px(x - 2, g - 5, "#ffffff"); d.px(x + 2, g - 3, "#ffffff"); }
};
const cactus = (d, x, g, h = 5) => { d.rect(x, g - h, 2, h, ["#3f8a2f", "#5aa846", "#357a26"]); d.rect(x + 2, g - h + 2, 1, 1, "#3f8a2f"); d.rect(x + 3, g - h, 1, 3, "#3f8a2f"); };
const jungle = (d, x, g) => {
  const L = ["#4aa52e", "#3f9626", "#2f7d1c", "#58b538"];
  d.rect(x - 4, g - 14, 10, 3, L, x); d.rect(x - 2, g - 15, 6, 1, L, x + 1);
  d.rect(x, g - 11, 2, 11, ["#5c4a26", "#6b5730"]);
  [x - 4, x + 5, x - 2].forEach((vx, i) => d.rect(vx, g - 11, 1, 3 + i, "#2f6f1f"));
};
const acacia = (d, x, g) => {
  [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]].forEach(([dx, dy]) => d.px(x + dx, g - dy, "#6b5a4a"));
  d.rect(x - 2, g - 7, 9, 2, ["#7a9a2a", "#6b8a22", "#88a832"], x);
};
const shroom = (d, x, g, red) => {
  d.rect(x, g - 5, 2, 5, "#e8e0d0");
  if (red) { d.rect(x - 2, g - 8, 6, 3, ["#c0392b", "#b03024"]); d.px(x - 1, g - 7, "#ffffff"); d.px(x + 2, g - 8, "#ffffff"); }
  else d.rect(x - 3, g - 7, 8, 2, ["#8a6a4a", "#7a5c3e"]);
};
const flowers = (d, hs, xs) => xs.forEach((x, i) => d.px(x, hs[x] - 1, ["#e33b3b", "#ffd84a", "#ffffff", "#d27cff"][i % 4]));

/* ---------- Data ---------- */
const MODES = [
  { key: "survival", name: "Выживание", icon: I.heart, desc: "Добывайте ресурсы, следите за здоровьем и голодом и стройте убежище до наступления ночи." },
  { key: "creative", name: "Творческий", icon: T.grassSide, desc: "Бесконечные блоки, полёт и бессмертие — полная свобода для строительства." },
  { key: "adventure", name: "Приключение", icon: I.map, desc: "Для карт, созданных игроками: ломать и ставить блоки можно только по правилам автора." },
  { key: "spectator", name: "Наблюдатель", icon: I.eye, desc: "Свободный полёт сквозь блоки: можно смотреть на мир, ничего в нём не меняя." },
  { key: "hardcore", name: "Хардкор", icon: I.hardcore, desc: "Выживание на максимальной сложности и с одной жизнью. Умерли — дальше можно только наблюдать." },
];
const DIMS = [
  { key: "overworld", name: "Верхний мир", cls: "", desc: "Стартовое измерение со сменой дня и ночи, погодой, биомами, океанами и пещерами.", how: "Вы появляетесь здесь при создании мира.",
    art: () => scene({ sky: ["#5aa9ff", "#cfeaff"], top: P.grass, fill: P.dirt, deep: P.stone, base: 20, amp: 3, freq: .11, seed: 2, sun: [50, 4], after: (d, hs) => { oak(d, 14, hs[14]); oak(d, 24, hs[24]); birch(d, 42, hs[42]); flowers(d, hs, [6, 19, 31, 36, 55, 60]); } }) },
  { key: "nether", name: "Незер", cls: "nether", desc: "Огненный мир лавы, незерака и крепостей. Один блок здесь равен восьми блокам Верхнего мира — удобно для быстрых путешествий.", how: "Постройте рамку из обсидиана (минимум 4×5) и подожгите её.",
    art: () => scene({ sky: ["#2a0606", "#6b1a0c"], top: P.nether, fill: P.nether, base: 22, amp: 3, freq: .14, seed: 4, water: 25, waterTop: "#ffd04a", waterCol: ["#ff8a1f", "#ff6a00", "#ffa030"], before: d => { for (let x = 0; x < 64; x++) { const ch = 3 + Math.round(Math.sin(x * .2) * 2 + rand(x, 1, 5) * 2); d.rect(x, 0, 1, ch, P.nether, 96); if ((x > 18 && x < 24) || (x > 44 && x < 48)) d.rect(x, ch, 1, 2 + (x % 2), ["#f5d77a", "#e8b84a", "#fff0a8"], 97); } } }) },
  { key: "end", name: "Энд", cls: "end", desc: "Тёмная пустота с островами из эндерняка. Здесь живёт Эндер-дракон — финальный босс игры.", how: "Найдите крепость и активируйте портал Оками Эндера.",
    art: () => scene({ sky: ["#07040f", "#1c1030"], stars: 46, top: P.end, fill: P.end, base: 99, amp: 0, freq: 0, seed: 0, after: d => {
      let topY = 19;
      for (let x = 6; x < 59; x++) { const t = 1 - ((x - 32) / 26) ** 2; if (t <= 0) continue; const top = 19 - Math.round(t * 2 + Math.sin(x * .5)); const bot = 19 + Math.round(t * 9 + rand(x, 2, 98) * 1.5); d.rect(x, top, 1, bot - top, P.end, 99); }
      [[15, 9], [30, 6], [45, 11]].forEach(([x, y]) => { d.rect(x, y, 3, topY - y, P.obsidian, 100); d.rect(x, y - 2, 3, 2, "#e079fa"); d.px(x + 1, y - 3, "#ffd0ff"); });
      d.map(22, 2, ["KK.......KK", ".KK.KKK.KK.", "..KKKKKKK..", ".....KKP..."], { K: "#050505", P: "#cc00fa" });
    } }) },
];
const MOBS = [
  { key: "steve", name: "Стив", type: "player", typeName: "Игрок", hp: 20, k: 1, where: "В любом мире — это вы!", drop: "Содержимое инвентаря при смерти", desc: "Классический персонаж игрока. Стив добывает ресурсы, строит дома и сражается с мобами. Его внешность можно поменять с помощью скина.", fact: "Стив настолько известен, что попал в файтинг Super Smash Bros. Ultimate." },
  { key: "alex", name: "Алекс", type: "player", typeName: "Игрок", hp: 20, k: 1, where: "В любом мире — это вы!", drop: "Содержимое инвентаря при смерти", desc: "Второй стандартный скин игрока, появился в 2014 году. У Алекс более тонкие руки: 3 пикселя в ширину вместо 4.", fact: "Скин Алекс добавили, чтобы у игроков был выбор стандартного персонажа." },
  { key: "creeper", name: "Крипер", type: "hostile", typeName: "Враждебный", hp: 20, k: 1, where: "Верхний мир, в темноте и ночью", drop: "Порох", desc: "Бесшумно подкрадывается к игроку, шипит и взрывается, разрушая блоки вокруг. От удара молнии становится заряженным, и взрыв усиливается.", fact: "Крипер появился случайно: Notch перепутал длину и высоту, когда делал модель свиньи." },
  { key: "zombie", name: "Зомби", type: "hostile", typeName: "Враждебный", hp: 20, k: 1, where: "Верхний мир, ночью и в пещерах", drop: "Гнилая плоть, иногда железо, морковь или картофель", desc: "Медленно преследует игрока по ночам и сгорает на солнце. Может превратить жителя деревни в зомби-жителя.", fact: "На уровне сложности «Сложно» зомби умеют выбивать деревянные двери." },
  { key: "skeleton", name: "Скелет", type: "hostile", typeName: "Враждебный", hp: 20, k: 1, where: "Верхний мир, ночью и в пещерах", drop: "Кости и стрелы, иногда лук", desc: "Стреляет из лука с расстояния и тоже сгорает днём. Лучшая тактика — прятаться за блоками и подходить вплотную.", fact: "Если скелет случайно попадёт стрелой в другого моба, они начнут драться между собой." },
  { key: "enderman", name: "Эндермен", type: "neutral", typeName: "Нейтральный", hp: 40, k: .75, where: "Все измерения, чаще всего Энд", drop: "Жемчуг Эндера", desc: "Высокое существо, которое умеет телепортироваться и переносить блоки. Нападает, если посмотреть ему в глаза. Боится воды.", fact: "Чтобы эндермен не разозлился от взгляда, наденьте на голову вырезанную тыкву." },
  { key: "pig", name: "Свинья", type: "passive", typeName: "Мирный", hp: 10, k: 1.5, where: "Луга и леса Верхнего мира", drop: "Сырая свинина", desc: "Мирное животное. На свинью можно надеть седло и управлять ею с помощью морковки на удочке.", fact: "Если в свинью ударит молния, она превратится в зомбифицированного пиглина." },
  { key: "cow", name: "Корова", type: "passive", typeName: "Мирный", hp: 10, k: 1.25, where: "Луга и леса Верхнего мира", drop: "Сырая говядина и кожа", desc: "Даёт говядину и кожу, а если подойти к ней с ведром — молоко.", fact: "Молоко снимает с игрока все эффекты зелий — и хорошие, и плохие." },
];
const BL = {
  grass: { top: T.grassTop, side: T.grassSide, bottom: T.dirt },
  dirt: { all: T.dirt }, stone: { all: T.stone }, cobble: { all: T.cobble },
  log: { top: T.logTop, side: T.log, bottom: T.logTop }, planks: { all: T.planks },
  sand: { all: T.sand }, diamond: { all: T.diamond }, obsidian: { all: T.obsidian },
  tnt: { top: T.tntTop, side: T.tntSide, bottom: T.tntTop }, nether: { all: T.nether }, endstone: { all: T.endstone },
  table: { top: T.tableTop, side: T.tableSide, bottom: T.planks },
};
const BLOCKS = [
  { key: "grass", name: "Блок травы", desc: "Покрывает поверхность большинства биомов. Если сломать, выпадет земля." },
  { key: "dirt", name: "Земля", desc: "Самый частый блок на поверхности. Копается рукой или лопатой." },
  { key: "stone", name: "Камень", desc: "Основа подземного мира. Если сломать киркой, выпадет булыжник." },
  { key: "cobble", name: "Булыжник", desc: "Нужен для печи и каменных инструментов." },
  { key: "log", name: "Дубовое бревно", desc: "Из одного бревна получается 4 доски." },
  { key: "planks", name: "Дубовые доски", desc: "Главный строительный материал в начале игры. Из них делают верстак." },
  { key: "sand", name: "Песок", desc: "Падает вниз, если под ним нет опоры. В печи переплавляется в стекло." },
  { key: "diamond", name: "Алмазная руда", desc: "Встречается глубоко под землёй. Добывается железной киркой или лучше." },
  { key: "obsidian", name: "Обсидиан", desc: "Появляется, когда вода касается лавы. Добывается только алмазной или незеритовой киркой. Из него строят портал в Незер." },
  { key: "tnt", name: "ТНТ", desc: "Взрывчатка. Поджигается огнивом или сигналом редстоуна." },
  { key: "nether", name: "Незерак", desc: "Основной блок Незера. Если поджечь, горит бесконечно." },
  { key: "endstone", name: "Эндерняк", desc: "Из него состоят острова Энда." },
];
const landXs = (hs, level, gap) => { const out = []; for (let x = 4; x < 61; x++) if (hs[x] <= level && (!out.length || x - out[out.length - 1] > gap)) out.push(x); return out; };
const BIOMES = [
  { key: "plains", name: "Равнины", temp: "Умеренный", desc: "Открытые луга с цветами и редкими деревьями. Здесь часто встречаются деревни и лошади.", o: { sky: ["#78b8ff", "#cfe8ff"], top: P.grass, fill: P.dirt, base: 22, amp: 1.5, freq: .15, seed: 1, sun: [50, 4], after: (d, hs) => { oak(d, 12, hs[12]); oak(d, 46, hs[46]); flowers(d, hs, [5, 18, 24, 31, 38, 55, 60]); } } },
  { key: "forest", name: "Лес", temp: "Умеренный", desc: "Густые заросли дуба и берёзы. Хорошее место, чтобы запастись древесиной.", o: { sky: ["#78b8ff", "#d8ecff"], top: P.grass, fill: P.dirt, base: 23, amp: 2, freq: .12, seed: 2, after: (d, hs) => [3, 10, 17, 24, 31, 38, 45, 52, 59].forEach((x, i) => (i % 3 === 1 ? birch : oak)(d, x, hs[x])) } },
  { key: "desert", name: "Пустыня", temp: "Жаркий", desc: "Пески, кактусы и пирамиды. Дождя здесь не бывает, а вместо обычных зомби бродят кадавры.", o: { sky: ["#8fc8ff", "#f2e6c0"], top: P.sand, fill: ["#d8c88a", "#cfbd7c", "#e0d39a"], topDepth: 3, base: 23, amp: 2, freq: .12, seed: 3, sun: [8, 3], after: (d, hs) => { cactus(d, 14, hs[14]); cactus(d, 34, hs[34], 4); cactus(d, 52, hs[52], 6); } } },
  { key: "taiga", name: "Тайга", temp: "Холодный", desc: "Хвойные леса с ягодными кустами. Здесь живут волки и лисы.", o: { sky: ["#8ab4d8", "#d4e4ee"], top: ["#4a7a3a", "#3f6e30", "#557f42"], fill: P.dirt, base: 23, amp: 2.5, freq: .13, seed: 4, after: (d, hs) => [4, 12, 20, 29, 37, 45, 54, 61].forEach(x => spruce(d, x, hs[x])) } },
  { key: "jungle", name: "Джунгли", temp: "Жаркий", desc: "Огромные деревья, лианы и какао-бобы. Здесь водятся оцелоты, попугаи и панды.", o: { sky: ["#6fb7ff", "#d8f0d0"], top: ["#4aa52e", "#3f9626", "#55b236"], fill: P.dirt, base: 25, amp: 1.5, freq: .17, seed: 5, after: (d, hs) => { jungle(d, 10, hs[10]); jungle(d, 32, hs[32]); jungle(d, 53, hs[53]); [20, 22, 42, 44, 62].forEach(x => d.rect(x - 1, hs[x] - 2, 3, 2, P.leaves, x)); } } },
  { key: "swamp", name: "Болото", temp: "Умеренный", desc: "Тёмная вода, кувшинки и деревья с лианами. Ночью здесь появляются слизни, а в хижинах живут ведьмы.", o: { sky: ["#8a9a88", "#c8d0b8"], top: ["#4c6b2f", "#46632a", "#56763a"], fill: P.dirt, base: 23, amp: 2.2, freq: .2, seed: 6, water: 22, waterTop: "#4a6a5a", waterCol: ["#3d5d4f", "#36574a"], after: (d, hs) => { const L = ["#3e5d22", "#36521d", "#47682a"]; landXs(hs, 22, 16).slice(0, 3).forEach(x => { oak(d, x, hs[x], L); d.rect(x - 2, hs[x] - 3, 1, 2, "#2f4a1a"); d.rect(x + 2, hs[x] - 3, 1, 3, "#2f4a1a"); }); for (let x = 1; x < 64; x += 5) if (hs[x] > 22) d.px(x, 22, "#2f7a2f"); } } },
  { key: "snowy", name: "Снежная равнина", temp: "Ледяной", desc: "Бескрайние снега и замёрзшие озёра. Здесь встречаются белые медведи и иглу.", o: { sky: ["#b8cce0", "#eef3f8"], top: ["#ffffff", "#f2f6fa", "#e8eef4"], fill: P.dirt, base: 23, amp: 2, freq: .14, seed: 7, water: 24, waterTop: "#bfe0ff", waterCol: ["#9cc8f0", "#8fbde8"], after: (d, hs) => landXs(hs, 24, 18).slice(0, 3).forEach(x => spruce(d, x, hs[x], true)) } },
  { key: "ocean", name: "Океан", temp: "Умеренный", desc: "Огромные водные просторы с коралловыми рифами, затонувшими кораблями, руинами и подводными крепостями со стражами.", o: { sky: ["#6fb7ff", "#cfe8ff"], top: P.sand, fill: P.sand, base: 27, amp: 1.8, freq: .16, seed: 8, water: 12, waterTop: "#7aa8ff", waterCol: ["#2f5fd0", "#2a56c0", "#3366dd"], sun: [52, 3], after: (d, hs) => { [6, 13, 22, 37, 44, 58].forEach((x, i) => d.rect(x, hs[x] - 2 - (i % 2), 1, 2 + (i % 2), ["#e85a9a", "#f0c040", "#5ad0c0"][i % 3])); [17, 29, 51].forEach(x => d.rect(x, hs[x] - 5, 1, 5, ["#2f8a3f", "#3a9a4a"])); } } },
  { key: "mushroom", name: "Грибные поля", temp: "Умеренный", desc: "Редкий остров из мицелия и гигантских грибов. Враждебные мобы здесь не появляются, зато живут грибные коровы.", o: { sky: ["#8ab8e8", "#e0d8f0"], top: ["#7a6a7e", "#6e5e72", "#857588"], fill: P.dirt, base: 22, amp: 1.5, freq: .15, seed: 9, after: (d, hs) => { shroom(d, 14, hs[14], true); shroom(d, 38, hs[38], false); shroom(d, 55, hs[55], true); } } },
  { key: "savanna", name: "Саванна", temp: "Жаркий", desc: "Сухая трава и акации. Дождей нет, по равнинам бродят лошади, а на плато — ламы.", o: { sky: ["#7ab8f0", "#f2dca0"], top: ["#9aa84a", "#8f9c40", "#a8b456"], fill: P.dirt, base: 23, amp: 1.5, freq: .12, seed: 10, sun: [48, 4], after: (d, hs) => { acacia(d, 12, hs[12]); acacia(d, 40, hs[40]); } } },
];
const ING = { P: { src: T.planks, name: "Доски" }, S: { src: I.stick, name: "Палка" }, C: { src: I.coal, name: "Уголь" }, K: { src: T.cobble, name: "Булыжник" } };
const RECIPES = [
  { key: "table", name: "Верстак", out: T.tableSide, n: 1, grid: "PP_PP____", desc: "Четыре доски квадратом — и у вас есть верстак с сеткой 3×3 для сложных рецептов." },
  { key: "sticks", name: "Палки", out: I.stick, n: 4, grid: "_P__P____", desc: "Две доски одна над другой дают четыре палки — основу для инструментов и факелов." },
  { key: "torch", name: "Факел", out: I.torch, n: 4, grid: "_C__S____", desc: "Уголь над палкой — четыре факела. Свет не даёт враждебным мобам появляться рядом." },
  { key: "pickaxe", name: "Деревянная кирка", out: I.pickaxe, n: 1, grid: "PPP_S__S_", desc: "Первый инструмент для добычи камня. Затем можно сделать каменную, железную и алмазную кирки." },
  { key: "sword", name: "Каменный меч", out: I.sword, n: 1, grid: "_K__K__S_", desc: "Два булыжника и палка. Каменный меч заметно сильнее деревянного." },
  { key: "furnace", name: "Печь", out: T.furnace, n: 1, grid: "KKKK_KKKK", desc: "Восемь булыжников по кругу. В печи переплавляют руду, готовят еду и делают стекло из песка." },
];
const TIMELINE = [
  ["2009", "Classic", "17 мая выходит первая публичная версия: только строительство из нескольких десятков блоков."],
  ["2010", "Alpha и Beta", "Появляется режим выживания, а в Halloween Update (Alpha 1.2) — Незер. 20 декабря игра переходит в бету."],
  ["2011", "Релиз 1.0", "18 ноября на MineCon выходит полная версия: Энд, Эндер-дракон, зельеварение и зачарование."],
  ["2014", "Microsoft покупает Mojang", "Сделка на 2,5 млрд долларов. Работа над игрой продолжается в Mojang Studios."],
  ["2016", "1.9 — Боевое обновление", "Щит, вторая рука и задержка между ударами меняют сражения."],
  ["2018", "1.13 — Водное обновление", "Океаны оживают: дельфины, черепахи, кораллы и затонувшие корабли."],
  ["2019", "1.14 — Деревни и разбойники", "Новые деревни, профессии жителей и набеги разбойников."],
  ["2020", "1.16 — Обновление Незера", "Новые биомы Незера, пиглины и незерит — материал прочнее алмаза."],
  ["2021", "1.17–1.18 — Пещеры и скалы", "Огромные пещеры, высокие горы и увеличенная высота мира."],
  ["2022", "1.19 — Дикое обновление", "Мангровые болота, лягушки, Глубокая тьма и Хранитель."],
  ["2023", "1.20 — Тропы и истории", "Верблюды, вишнёвые рощи, археология и нюхач."],
  ["2024", "1.21 — Хитрые испытания", "Испытательные залы, моб вихрь и новое оружие — булава."],
];
const FACTS = [
  "Один игровой день в Minecraft длится 20 реальных минут.",
  "Крипер получился из неудачной модели свиньи.",
  "Звуки эндермена — это искажённые и перевёрнутые фразы.",
  "Звуки гаста записаны с кошки композитора C418.",
  "Обсидиан выдерживает взрыв ТНТ.",
  "Ламы плюются во врагов.",
  "Овца с именем jeb_ переливается всеми цветами радуги.",
  "Моб с именем Dinnerbone или Grumm переворачивается вверх ногами.",
];

/* ---------- Render ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const urlCache = new Map();
const url = c => { if (!urlCache.has(c)) urlCache.set(c, `url(${c.toDataURL()})`); return urlCache.get(c); };
[["dirt", T.dirt], ["grass-top", T.grassTop], ["grass-side", T.grassSide], ["stone", T.stone], ["planks", T.planks], ["cobble", T.cobble], ["obsidian", T.obsidian]].forEach(([n, c]) => document.documentElement.style.setProperty(`--tex-${n}`, url(c)));

function buildCube(cube, key) {
  const b = BL[key]; cube.innerHTML = "";
  ["top", "bottom", "front", "back", "left", "right"].forEach(f => {
    const src = b.all || (f === "top" ? b.top : f === "bottom" ? b.bottom : b.side);
    const d = el("span", `face ${f}`); d.style.backgroundImage = url(src); cube.appendChild(d);
  });
}
$$(".cube[data-block]").forEach(c => buildCube(c, c.dataset.block));
const ICONS = { grassSide: T.grassSide, heart: I.heart, obsidian: T.obsidian, creeperFace: I.creeperFace, cobble: T.cobble, leaves: T.leaves, tableSide: T.tableSide, torch: I.torch, book: I.book };
$$("canvas[data-icon]").forEach(c => ICONS[c.dataset.icon] && put(c, ICONS[c.dataset.icon]));
$$("canvas[data-sprite]").forEach(c => S[c.dataset.sprite] && put(c, S[c.dataset.sprite]));

const stars = $(".stars");
for (let i = 0; i < 70; i++) {
  const s = el("i");
  s.style.left = (rand(i, 1, 300) * 100).toFixed(2) + "%";
  s.style.top = (rand(i, 2, 301) * 62).toFixed(2) + "%";
  s.style.animationDelay = (-rand(i, 3, 302) * 3).toFixed(2) + "s";
  if (rand(i, 4, 303) < .35) s.style.width = s.style.height = "2px";
  stars.appendChild(s);
}

MODES.forEach(m => {
  const c = el("article", "mode gui reveal"); c.id = "mode-" + m.key;
  c.append(cv(m.icon), el("h3", null, esc(m.name)), el("p", null, esc(m.desc)));
  $("#modesGrid").appendChild(c);
});
DIMS.forEach(d => {
  const c = el("article", "dim reveal"); c.id = "dim-" + d.key;
  const art = el("div", ("dim-art " + d.cls).trim()); art.appendChild(cv(d.art()));
  c.append(art, el("div", "dim-body", `<h3>${esc(d.name)}</h3><p>${esc(d.desc)}</p><p class="how"><b>Как попасть:</b> ${esc(d.how)}</p>`));
  $("#dimsGrid").appendChild(c);
});
MOBS.forEach(m => {
  const b = el("button", "mob gui reveal"); b.type = "button"; b.id = "mob-" + m.key; b.setAttribute("aria-haspopup", "dialog");
  const art = el("span", "mob-art msky"); art.appendChild(cv(S[m.key], "sprite", m.k));
  const meta = el("span", "mob-meta"); meta.appendChild(el("span", "tag " + m.type, esc(m.typeName)));
  const hp = el("span", "hp"); hp.append(cv(I.heart), document.createTextNode(m.hp + " HP")); meta.appendChild(hp);
  b.append(art, el("span", "mob-name", esc(m.name)), meta, el("span", "mob-more", "Подробнее →"));
  b.addEventListener("click", () => openMob(m));
  $("#mobsGrid").appendChild(b);
});

function burst(x, y, colors, n = 18, spread = 120) {
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const p = el("i", "particle"); const s = 6 + Math.floor(Math.random() * 6);
    p.style.cssText = `left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;background:${colors[i % colors.length]}`;
    document.body.appendChild(p);
    const dx = (Math.random() - .5) * spread * 2, up = 40 + Math.random() * 80, fall = 60 + Math.random() * 120;
    const a = p.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${dx * .5}px,${-up}px)`, opacity: 1, offset: .35 }, { transform: `translate(${dx}px,${fall}px)`, opacity: 0 }], { duration: 700 + Math.random() * 500, easing: "cubic-bezier(.25,.6,.45,1)" });
    a.onfinish = () => p.remove();
  }
}
let broken = 0;
BLOCKS.forEach(bk => {
  const c = el("article", "block gui reveal"); c.id = "block-" + bk.key;
  const stage = el("button", "cube-stage"); stage.type = "button"; stage.setAttribute("aria-label", `Сломать блок «${bk.name}»`);
  const holder = el("span", "cube-holder"); const cube = el("span", "cube"); buildCube(cube, bk.key);
  holder.appendChild(cube); stage.appendChild(holder);
  c.append(stage, el("h3", null, esc(bk.name)), el("p", null, esc(bk.desc)));
  const colors = sample(BL[bk.key].side || BL[bk.key].all, 10);
  stage.addEventListener("click", () => {
    if (holder.dataset.busy) return; holder.dataset.busy = "1";
    const r = holder.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, colors);
    broken++; $("#broken").textContent = broken;
    holder.animate([{ transform: "scale(1)" }, { transform: "scale(1.12) rotate(4deg)", offset: .3 }, { transform: "scale(0)" }], { duration: reduce ? 1 : 320, fill: "forwards" });
    setTimeout(() => { holder.animate([{ transform: "scale(0)" }, { transform: "scale(1.1)", offset: .7 }, { transform: "scale(1)" }], { duration: reduce ? 1 : 360, fill: "forwards" }); delete holder.dataset.busy; }, reduce ? 60 : 1000);
  });
  $("#blocksGrid").appendChild(c);
});
BIOMES.forEach(bi => {
  bi.canvas = scene(bi.o);
  const c = el("article", "biome gui reveal"); c.id = "biome-" + bi.key;
  c.append(cv(bi.canvas), el("div", "b-body", `<h3>${esc(bi.name)}</h3><span class="temp">Климат: ${esc(bi.temp)}</span><p>${esc(bi.desc)}</p>`));
  $("#biomesGrid").appendChild(c);
});

/* Crafting */
const grid = $("#craftGrid"), out = $("#craftOut");
for (let i = 0; i < 9; i++) grid.appendChild(el("div", "slot"));
let craftTimer;
function selectRecipe(key, focus) {
  const r = RECIPES.find(x => x.key === key) || RECIPES[0];
  $$("#recipeList button").forEach(b => { const on = b.dataset.key === r.key; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  $("#craftPanel").setAttribute("aria-label", "Рецепт: " + r.name);
  [...grid.children].forEach((s, i) => {
    s.innerHTML = ""; s.classList.remove("pop"); s.removeAttribute("role"); s.removeAttribute("aria-label");
    const ing = ING[r.grid[i]];
    if (ing) { s.appendChild(cv(ing.src)); s.setAttribute("role", "img"); s.setAttribute("aria-label", ing.name); s.style.setProperty("--d", i * 70 + "ms"); s.classList.add("pop"); }
  });
  out.innerHTML = ""; out.classList.remove("ready", "pop"); out.removeAttribute("aria-label");
  clearTimeout(craftTimer);
  const show = () => { out.appendChild(cv(r.out)); if (r.n > 1) out.appendChild(el("span", "count", r.n)); out.classList.add("ready", "pop"); out.setAttribute("role", "img"); out.setAttribute("aria-label", `Результат: ${r.name}${r.n > 1 ? " × " + r.n : ""}`); };
  if (staticMode) show(); else craftTimer = setTimeout(show, 700);
  $("#recipeDesc").textContent = r.desc;
}
RECIPES.forEach(r => {
  const b = el("button"); b.type = "button"; b.setAttribute("role", "tab"); b.dataset.key = r.key; b.setAttribute("aria-controls", "craftPanel");
  b.append(cv(r.out), document.createTextNode(r.name));
  b.addEventListener("click", () => selectRecipe(r.key));
  $("#recipeList").appendChild(b);
});
$("#recipeList").addEventListener("keydown", e => {
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!step) return;
  e.preventDefault();
  const cur = Math.max(0, RECIPES.findIndex(r => r.key === document.activeElement.dataset.key));
  selectRecipe(RECIPES[(cur + step + RECIPES.length) % RECIPES.length].key, true);
});
selectRecipe("table");

TIMELINE.forEach(([y, t, d], i) => { const li = el("li", "reveal", `<span class="t-year">${y}</span><h3>${esc(t)}</h3><p>${esc(d)}</p>`); li.id = "ver-" + i; $("#timeline").appendChild(li); });

let factI = 0;
$("#factBtn").addEventListener("click", () => {
  factI = (factI + 1 + Math.floor(Math.random() * (FACTS.length - 1))) % FACTS.length;
  const p = $("#fact"); p.textContent = FACTS[factI]; p.classList.remove("flash"); void p.offsetWidth; p.classList.add("flash");
});

/* Mob dialog */
const dlg = $("#mobDialog");
function openMob(m) {
  $("#mobTitle").textContent = m.name;
  $("#dlgTag").innerHTML = `<span class="tag ${m.type}">${esc(m.typeName)}</span>`;
  $("#dlgDesc").textContent = m.desc;
  $("#dlgTable").innerHTML = `<tr><th scope="row">Здоровье</th><td>${m.hp} HP (${m.hp / 2} сердец)</td></tr><tr><th scope="row">Где встречается</th><td>${esc(m.where)}</td></tr><tr><th scope="row">Добыча</th><td>${esc(m.drop)}</td></tr>`;
  $("#dlgFact").innerHTML = `<b>Интересный факт:</b> ${esc(m.fact)}`;
  const art = $("#dlgArt"); art.innerHTML = ""; art.appendChild(cv(S[m.key], "sprite", m.k * 1.25));
  if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
}
$(".dlg-close").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

/* Creeper easter egg */
const creeper = $(".creeper-btn");
creeper.addEventListener("click", () => {
  if (creeper.classList.contains("fuse") || creeper.classList.contains("gone")) return;
  creeper.classList.add("fuse");
  setTimeout(() => {
    const r = creeper.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, ["#ffffff", "#e0e0e0", "#bdbdbd", "#8a8a8a", "#5cb85c", "#ffcf4a"], 40, 220);
    creeper.classList.remove("fuse"); creeper.classList.add("gone");
    setTimeout(() => creeper.classList.remove("gone"), 2500);
  }, reduce ? 0 : 900);
});

/* Reveal, counters, scroll spy */
const revealEls = $$(".reveal");
if (staticMode || !("IntersectionObserver" in window)) revealEls.forEach(e => e.classList.add("in"));
else {
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const t = en.target; t.classList.add("in"); io.unobserve(t);
    setTimeout(() => { t.classList.remove("reveal", "in"); t.style.transitionDelay = ""; }, 900);
  }), { rootMargin: "0px 0px -8% 0px" });
  revealEls.forEach((e, i) => { e.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(e); });
}
function countUp(b) {
  const t = +b.dataset.count, suf = b.dataset.suffix || "", from = t > 1000 ? t - 60 : 0, t0 = performance.now(), dur = 1400;
  const step = now => { const p = Math.min(1, (now - t0) / dur); b.textContent = Math.round(from + (t - from) * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
if (!staticMode && "IntersectionObserver" in window) {
  const cio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { $$("[data-count]", en.target).forEach(countUp); cio.disconnect(); } }), { threshold: .4 });
  cio.observe($(".stats"));
}
const navLinks = $$(".sidenav a[href^='#']").filter(a => a.getAttribute("href") !== "#top");
if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) navLinks.forEach(a => a.getAttribute("href") === "#" + en.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
  }), { rootMargin: "-30% 0px -65% 0px" });
  navLinks.forEach(a => { const s = document.getElementById(a.getAttribute("href").slice(1)); if (s) spy.observe(s); });
}

/* Search */
function jump(id, center = true) {
  const t = document.getElementById(id); if (!t) return;
  t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: center ? "center" : "start" });
  t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash");
  setTimeout(() => t.classList.remove("flash"), 1700);
}
const norm = s => s.toLowerCase().replace(/ё/g, "е");
const SECTIONS = [["about", "Об игре", T.grassSide], ["modes", "Режимы игры", I.heart], ["dimensions", "Измерения", T.obsidian], ["mobs", "Мобы и персонажи", I.creeperFace], ["blocks", "Блоки", T.cobble], ["biomes", "Биомы", T.leaves], ["craft", "Крафт", T.tableSide], ["history", "История версий", I.torch]];
const INDEX = [
  ...SECTIONS.map(([id, t, icon]) => ({ t, type: "Раздел", icon, kw: "", go: () => jump(id, false) })),
  ...MODES.map(m => ({ t: m.name, type: "Режим", icon: m.icon, kw: m.desc, go: () => jump("mode-" + m.key) })),
  ...DIMS.map(d => ({ t: d.name, type: "Измерение", icon: d.key === "nether" ? T.nether : d.key === "end" ? T.endstone : T.grassSide, kw: d.desc, go: () => jump("dim-" + d.key) })),
  ...MOBS.map(m => ({ t: m.name, type: "Моб", icon: S[m.key], kw: m.desc + " " + m.drop, go: () => { jump("mob-" + m.key); setTimeout(() => openMob(m), reduce ? 0 : 500); } })),
  ...BLOCKS.map(b => ({ t: b.name, type: "Блок", icon: BL[b.key].side || BL[b.key].all, kw: b.desc, go: () => jump("block-" + b.key) })),
  ...BIOMES.map(b => ({ t: b.name, type: "Биом", icon: b.canvas, kw: b.desc, go: () => jump("biome-" + b.key) })),
  ...RECIPES.map(r => ({ t: r.name, type: "Рецепт", icon: r.out, kw: r.desc, go: () => { selectRecipe(r.key); jump("craft", false); } })),
  ...TIMELINE.map(([y, t, d], i) => ({ t: `${t} (${y})`, type: "Версия", icon: I.torch, kw: d, go: () => jump("ver-" + i) })),
];
const q = $("#q"), res = $("#results");
let items = [], sel = -1;
function closeResults() { res.classList.remove("open"); q.setAttribute("aria-expanded", "false"); q.removeAttribute("aria-activedescendant"); }
function renderResults() {
  const v = norm(q.value.trim());
  res.innerHTML = ""; sel = -1; items = [];
  if (!v) { closeResults(); return; }
  items = INDEX.map(it => { const t = norm(it.t); return { it, s: t.startsWith(v) ? 0 : t.includes(v) ? 1 : norm(it.kw).includes(v) ? 2 : -1 }; })
    .filter(x => x.s >= 0).sort((a, b) => a.s - b.s).slice(0, 8).map(x => x.it);
  if (!items.length) res.appendChild(el("div", "empty", "Ничего не найдено. Попробуйте «крипер» или «алмаз»."));
  items.forEach((it, i) => {
    const b = el("button"); b.type = "button"; b.id = "r-" + i; b.tabIndex = -1;
    b.setAttribute("role", "option"); b.setAttribute("aria-selected", "false");
    b.append(cv(it.icon), el("span", "rname", esc(it.t)), el("span", "rtype", esc(it.type)));
    b.addEventListener("mousedown", e => e.preventDefault());
    b.addEventListener("click", () => choose(i));
    res.appendChild(b);
  });
  res.classList.add("open"); q.setAttribute("aria-expanded", "true");
}
function highlight(i) {
  const bs = $$("button", res); sel = i;
  bs.forEach((b, j) => b.setAttribute("aria-selected", j === i));
  if (bs[i]) { q.setAttribute("aria-activedescendant", bs[i].id); bs[i].scrollIntoView({ block: "nearest" }); }
}
function choose(i) { const it = items[i]; if (!it) return; closeResults(); q.value = ""; q.blur(); it.go(); }
q.addEventListener("input", renderResults);
q.addEventListener("focus", () => { if (q.value.trim()) renderResults(); });
q.addEventListener("keydown", e => {
  const n = items.length;
  if (e.key === "ArrowDown" && n) { e.preventDefault(); res.classList.add("open"); highlight((sel + 1) % n); }
  else if (e.key === "ArrowUp" && n) { e.preventDefault(); highlight((sel - 1 + n) % n); }
  else if (e.key === "Enter") { e.preventDefault(); if (n) choose(sel >= 0 ? sel : 0); }
  else if (e.key === "Escape") closeResults();
});
q.addEventListener("blur", () => setTimeout(closeResults, 150));
})();
