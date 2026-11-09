/* 3D-модель Стива на CSS 3D: без библиотек, быстро работает на телефонах и ПК */
(() => {
"use strict";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- текстуры ---------- */
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const C = {
  skin: ["#c4967a", "#b98b6e", "#c99f84", "#bf9174"],
  skinD: ["#a5755a", "#9c6d53"],
  hair: ["#3d2a1b", "#33231a", "#2c1e14", "#45301f"],
  shirt: ["#14a8a8", "#0fa0a0", "#1cb0b0", "#12a4a4"],
  shirtD: ["#0c8686", "#0a7c7c"],
  pants: ["#3b3a9e", "#34338f", "#4241a8", "#38379a"],
  shoe: ["#6a6a6a", "#5c5c5c", "#737373"],
  white: ["#ffffff"], eye: ["#4b3b96"], mouth: ["#6e3f2a"], nose: ["#9a6547"],
  grass: ["#5d9e34", "#559530", "#67a83b", "#4f8c2c", "#6aae40"]
};
let seed = 1;
function tex(w, h, fn) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); const s = seed++;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = C[fn(x, y)]; g.fillStyle = p[Math.floor(hash(x, y, s) * p.length)]; g.fillRect(x, y, 1, 1);
  }
  return "url(" + c.toDataURL() + ")";
}
const headFront = (x, y) => {
  if (y < 2 || (y === 2 && (x === 0 || x === 7))) return "hair";
  if (y === 4 && (x === 1 || x === 6)) return "white";
  if (y === 4 && (x === 2 || x === 5)) return "eye";
  if (y === 5 && (x === 3 || x === 4)) return "nose";
  if (y === 6 && x >= 2 && x <= 5) return "mouth";
  if (y === 7 && (x === 3 || x === 4)) return "skinD";
  return "skin";
};
const headSide = frontAt0 => (x, y) => {
  const f = frontAt0 ? x : 7 - x;
  if (y < 2 || (y === 2 && f >= 2) || (y === 3 && f >= 5) || (y === 4 && f >= 7)) return "hair";
  return "skin";
};
const body = (x, y) => y >= 11 ? "pants" : (y === 10 ? "shirtD" : "shirt");
const arm = (x, y) => y < 3 ? "shirt" : (y === 3 ? "shirtD" : "skin");
const leg = (x, y) => y < 10 ? "pants" : "shoe";

const T = {
  head: { front: tex(8, 8, headFront), back: tex(8, 8, (x, y) => y < 7 ? "hair" : "skin"), right: tex(8, 8, headSide(true)), left: tex(8, 8, headSide(false)), top: tex(8, 8, () => "hair"), bottom: tex(8, 8, () => "skin") },
  body: { front: tex(8, 12, body), back: tex(8, 12, body), right: tex(4, 12, body), left: tex(4, 12, body), top: tex(8, 4, () => "shirt"), bottom: tex(8, 4, () => "pants") },
  arm: { front: tex(4, 12, arm), back: tex(4, 12, arm), right: tex(4, 12, arm), left: tex(4, 12, arm), top: tex(4, 4, () => "shirt"), bottom: tex(4, 4, () => "skinD") },
  leg: { front: tex(4, 12, leg), back: tex(4, 12, leg), right: tex(4, 12, leg), left: tex(4, 12, leg), top: tex(4, 4, () => "pants"), bottom: tex(4, 4, () => "shoe") },
  grass: tex(16, 16, () => "grass")
};

/* ---------- разметка ---------- */
const u = n => `calc(var(--s) * ${n})`;
const div = (cls, html) => { const d = document.createElement("div"); d.className = cls; if (html) d.innerHTML = html; return d; };
function part(name, W, H, D, cx, cy, tx, origin) {
  const p = div("s3d-part p-" + name);
  p.style.width = u(W); p.style.height = u(H);
  p.style.setProperty("--tx", u(cx - W / 2)); p.style.setProperty("--ty", u(cy - H / 2));
  p.style.transformOrigin = origin;
  const faces = [
    ["front", W, H, 0, 0, `translateZ(${u(D / 2)})`],
    ["back", W, H, 0, 0, `rotateY(180deg) translateZ(${u(D / 2)})`],
    ["right", D, H, (W - D) / 2, 0, `rotateY(90deg) translateZ(${u(W / 2)})`],
    ["left", D, H, (W - D) / 2, 0, `rotateY(-90deg) translateZ(${u(W / 2)})`],
    ["top", W, D, 0, (H - D) / 2, `rotateX(90deg) translateZ(${u(H / 2)})`],
    ["bottom", W, D, 0, (H - D) / 2, `rotateX(-90deg) translateZ(${u(H / 2)})`]
  ];
  for (const [k, w, h, l, t, tr] of faces) {
    const f = div("s3d-face " + k);
    f.style.cssText = `width:${u(w)};height:${u(h)};left:${u(l)};top:${u(t)};transform:${tr};background-image:${tx[k]}`;
    p.appendChild(f);
  }
  return p;
}

const dlg = document.createElement("dialog");
dlg.className = "s3d";
dlg.setAttribute("aria-labelledby", "s3dTitle");
dlg.innerHTML = `
  <div class="s3d-top">
    <h2 id="s3dTitle">Стив в 3D</h2>
    <button type="button" class="s3d-x" aria-label="Закрыть">×</button>
  </div>
  <div class="s3d-stage" tabindex="0" role="img" aria-label="3D-модель Стива. Перетаскивайте, чтобы вращать. Колесо или щипок — масштаб. На клавиатуре: стрелки и плюс/минус.">
    <div class="s3d-world"></div>
    <p class="s3d-help" aria-hidden="true"><span class="desk">Тяните мышью, чтобы крутить · колесо — зум</span><span class="touch">Крутите пальцем · два пальца — зум</span></p>
  </div>
  <div class="s3d-ctrl">
    <button type="button" class="mc-btn" data-act="walk" aria-pressed="false">🚶 Ходьба</button>
    <button type="button" class="mc-btn" data-act="wave">👋 Помахать</button>
    <button type="button" class="mc-btn" data-act="jump">⬆️ Прыжок</button>
    <button type="button" class="mc-btn" data-act="spin" aria-pressed="${!reduce}">🔄 Автоповорот</button>
    <button type="button" class="mc-btn" data-act="reset">🎯 Сброс</button>
  </div>`;
document.body.appendChild(dlg);

const stage = dlg.querySelector(".s3d-stage");
const world = dlg.querySelector(".s3d-world");
const ground = div("s3d-ground"); ground.style.cssText = `width:${u(34)};height:${u(34)};--tx:${u(-17)};--ty:${u(16.05 - 17)};background-image:${T.grass};background-size:${u(8)} ${u(8)}`;
const shadow = div("s3d-shadow"); shadow.style.cssText = `width:${u(18)};height:${u(10)};--tx:${u(-9)};--ty:${u(15.9 - 5)}`;
const rig = div("s3d-rig");
const P = {
  head: part("head", 8, 8, 8, 0, -12, T.head, "50% 100%"),
  body: part("body", 8, 12, 4, 0, -2, T.body, "50% 50%"),
  armR: part("arm", 4, 12, 4, -6, -2, T.arm, "50% 8%"),
  armL: part("arm", 4, 12, 4, 6, -2, T.arm, "50% 8%"),
  legR: part("leg", 4, 12, 4, -2, 10, T.leg, "50% 0"),
  legL: part("leg", 4, 12, 4, 2, 10, T.leg, "50% 0")
};
Object.values(P).forEach(p => rig.appendChild(p));
world.append(ground, shadow, rig);

/* ---------- состояние ---------- */
const DEF = { yaw: -28, pitch: -14, zoom: 1 };
let yaw = DEF.yaw, pitch = DEF.pitch, zoom = DEF.zoom, vYaw = 0, vPitch = 0;
let walking = false, spinning = !reduce, waveT = -1, jumpT = -1, phase = 0, time = 0;
let look = { x: 0, y: 0 }, lookT = { x: 0, y: 0 };
let raf = 0, last = 0, interacted = false;
const pointers = new Map();
let drag = null, pinch = null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const setRot = (el, rx, ry, rz) => { el.style.setProperty("--rx", rx + "deg"); el.style.setProperty("--ry", ry + "deg"); el.style.setProperty("--rz", rz + "deg"); };

function frame(now) {
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; time += dt;
  if (!drag && !pinch) {
    yaw += vYaw; pitch = clamp(pitch + vPitch, -70, 40); vYaw *= 0.92; vPitch *= 0.88;
    if (spinning && Math.abs(vYaw) < 0.05) yaw += 22 * dt;
  }
  /* анимации конечностей */
  let a = 0, sway = 0, bob = 0;
  if (walking) { phase += dt * 7.5; a = Math.sin(phase) * 34; bob = Math.abs(Math.cos(phase)) * 0.6; }
  else if (!reduce) { sway = Math.sin(time * 1.7) * 2.5; a = Math.sin(time * 1.2) * 2; }
  let armRz = sway, armRx = -a;
  if (waveT >= 0) {
    waveT += dt; const k = waveT < 0.3 ? waveT / 0.3 : waveT > 1.9 ? Math.max(0, (2.2 - waveT) / 0.3) : 1;
    armRz = sway * (1 - k) + k * (150 + Math.sin(waveT * 13) * 20); armRx = armRx * (1 - k);
    if (waveT > 2.2) waveT = -1;
  }
  setRot(P.armR, armRx, 0, armRz);
  setRot(P.armL, a, 0, -sway);
  setRot(P.legR, a, 0, 0);
  setRot(P.legL, -a, 0, 0);
  look.x += (lookT.x - look.x) * Math.min(1, dt * 6); look.y += (lookT.y - look.y) * Math.min(1, dt * 6);
  const idleLook = reduce || drag ? 0 : Math.sin(time * 0.6) * 6;
  setRot(P.head, -look.y * 22, look.x * 38 + idleLook, 0);
  /* прыжок */
  let h = bob;
  if (jumpT >= 0) { jumpT += dt; const d = 0.62; h += Math.sin(Math.PI * Math.min(1, jumpT / d)) * 7; if (jumpT > d) jumpT = -1; }
  rig.style.setProperty("--j", h.toFixed(3));
  shadow.style.setProperty("--sc", (1 - h / 16).toFixed(3));
  world.style.transform = `scale(${zoom.toFixed(3)}) rotateX(${pitch.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg)`;
  raf = requestAnimationFrame(frame);
}

/* ---------- ввод ---------- */
const hideHelp = () => { if (!interacted) { interacted = true; stage.classList.add("used"); } };
stage.addEventListener("pointerdown", e => {
  if (e.button > 0) return;
  stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  hideHelp();
  if (pointers.size === 1) { drag = { x: e.clientX, y: e.clientY, t: performance.now() }; vYaw = vPitch = 0; stage.classList.add("grab"); }
  if (pointers.size === 2) { const [p1, p2] = [...pointers.values()]; pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1, z: zoom }; drag = null; }
});
stage.addEventListener("pointermove", e => {
  const r = stage.getBoundingClientRect();
  if (e.pointerType === "mouse") { lookT.x = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1); lookT.y = clamp(((e.clientY - r.top) / r.height - 0.45) * 2, -1, 1); }
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size >= 2) {
    const [p1, p2] = [...pointers.values()];
    zoom = clamp(pinch.z * Math.hypot(p1.x - p2.x, p1.y - p2.y) / pinch.d, 0.5, 2.4);
  } else if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    yaw += dx * 0.45; pitch = clamp(pitch - dy * 0.35, -70, 40);
    vYaw = dx * 0.45 * 0.6; vPitch = -dy * 0.35 * 0.4;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = performance.now();
  }
});
const endPointer = e => {
  pointers.delete(e.pointerId);
  if (drag && performance.now() - drag.t > 90) { vYaw = 0; vPitch = 0; }
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 0) { drag = null; stage.classList.remove("grab"); }
  else if (pointers.size === 1) { const [p] = [...pointers.values()]; drag = { x: p.x, y: p.y, t: performance.now() }; }
};
stage.addEventListener("pointerup", endPointer);
stage.addEventListener("pointercancel", endPointer);
stage.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") lookT.x = lookT.y = 0; });
stage.addEventListener("wheel", e => { e.preventDefault(); hideHelp(); zoom = clamp(zoom * Math.exp(-e.deltaY * 0.0015), 0.5, 2.4); }, { passive: false });
stage.addEventListener("dblclick", () => reset());
stage.addEventListener("keydown", e => {
  const k = e.key; let used = true;
  if (k === "ArrowLeft") yaw -= 12; else if (k === "ArrowRight") yaw += 12;
  else if (k === "ArrowUp") pitch = clamp(pitch - 8, -70, 40); else if (k === "ArrowDown") pitch = clamp(pitch + 8, -70, 40);
  else if (k === "+" || k === "=") zoom = clamp(zoom * 1.15, 0.5, 2.4); else if (k === "-") zoom = clamp(zoom / 1.15, 0.5, 2.4);
  else used = false;
  if (used) { e.preventDefault(); hideHelp(); vYaw = 0; }
});

function reset() { yaw = DEF.yaw; pitch = DEF.pitch; zoom = DEF.zoom; vYaw = vPitch = 0; }
const btn = act => dlg.querySelector(`[data-act="${act}"]`);
dlg.querySelector(".s3d-ctrl").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const act = b.dataset.act;
  if (act === "walk") { walking = !walking; b.setAttribute("aria-pressed", walking); }
  if (act === "spin") { spinning = !spinning; b.setAttribute("aria-pressed", spinning); }
  if (act === "wave") waveT = 0;
  if (act === "jump" && jumpT < 0) jumpT = 0;
  if (act === "reset") reset();
});

/* ---------- открытие / закрытие ---------- */
let opener = null;
function open(from) {
  opener = from || document.activeElement;
  if (!dlg.open) dlg.showModal();
  yaw = reduce ? DEF.yaw : DEF.yaw - 160; vYaw = reduce ? 0 : 7;
  if (!reduce) { waveT = 0; }
  last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  stage.focus({ preventScroll: true });
}
function close() { dlg.close(); }
dlg.addEventListener("close", () => { cancelAnimationFrame(raf); raf = 0; pointers.clear(); drag = pinch = null; if (opener && opener.focus) opener.focus({ preventScroll: true }); });
dlg.querySelector(".s3d-x").addEventListener("click", close);
dlg.addEventListener("click", e => { if (e.target === dlg) close(); });

/* Стив на главном экране */
const hero = document.querySelector(".actor.steve");
if (hero) {
  hero.removeAttribute("aria-hidden");
  hero.setAttribute("role", "button"); hero.tabIndex = 0;
  hero.setAttribute("aria-label", "Открыть 3D-модель Стива");
  hero.classList.add("s3d-open");
  const badge = document.createElement("span"); badge.className = "s3d-badge"; badge.setAttribute("aria-hidden", "true"); badge.textContent = "3D";
  hero.appendChild(badge);
  hero.addEventListener("click", () => open(hero));
  hero.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(hero); } });
}

/* Кнопка в карточке моба «Стив» */
const mobDlg = document.getElementById("mobDialog");
const mobTitle = document.getElementById("mobTitle");
const fact = document.getElementById("dlgFact");
if (mobDlg && mobTitle && fact) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "mc-btn green s3d-from-mob"; b.textContent = "🧊 Открыть в 3D"; b.hidden = true;
  fact.insertAdjacentElement("afterend", b);
  const sync = () => { b.hidden = mobTitle.textContent.trim() !== "Стив"; };
  new MutationObserver(sync).observe(mobTitle, { childList: true, characterData: true, subtree: true });
  sync();
  b.addEventListener("click", () => { const back = document.getElementById("mob-steve"); mobDlg.close(); open(back); });
}
window.openSteve3D = open;
})();
