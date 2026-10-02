
const canvas = document.querySelector("#stars");
const ctx = canvas.getContext("2d");
let stars = [], mouse = { x: -9999, y: -9999, active: false }, dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(2600, Math.floor(innerWidth * innerHeight / 650));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    ox: 0, oy: 0, r: .4 + Math.random() * 1.4, a: .3 + Math.random() * .55,
    phase: Math.random() * Math.PI * 2
  }));
  stars.forEach(s => { s.ox = s.x; s.oy = s.y });
}
function draw(t) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const s of stars) {
    let tx = s.ox, ty = s.oy;
    const dx = mouse.x - s.x, dy = mouse.y - s.y, dist = Math.hypot(dx, dy);
    // 반경 250px 안에서만 마우스 쪽으로 모여들고, 250px 밖으로 벗어나면 더 이상 따라가지 않습니다.
    if (mouse.active && dist < 250) {
      const force = (1 - dist / 250) * .95;
      tx = s.x + dx * force; ty = s.y + dy * force;
    }
    s.x += (tx - s.x) * .14; s.y += (ty - s.y) * .14;
    const pulse = s.a * (.85 + .15 * Math.sin(t * .001 + s.phase));
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(225,232,248,${pulse})`; ctx.fill();
  }
  requestAnimationFrame(draw);
}
window.addEventListener("resize", resize);
window.addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true });
window.addEventListener("pointerleave", () => mouse.active = false);
resize(); requestAnimationFrame(draw);

document.querySelector(".menu").addEventListener("click", () => document.querySelector("nav ul").classList.toggle("open"));
document.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => document.querySelector("nav ul").classList.remove("open")));

// Demo Desktop / Mobile 화면 전환
document.querySelectorAll(".demo").forEach(demo => {
  const btns = demo.querySelectorAll(".deviceBtn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected", "false") });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      demo.classList.toggle("mobileView", btn.dataset.device === "mobile");
    });
  });
});

/* ===== 100vh 페이지 + 3D 큐브 롤 전환 ===== */
const root = document.documentElement;
const cube = document.querySelector(".cube");
const faces = [...document.querySelectorAll(".face")];
const scrollers = faces.map(f => f.querySelector(".scroll"));
const labels = ["Home", "Projects", "Live Demo", "Skills", "Process", "Contact"];
const DUR = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1000; // 전환 속도(ms)
let cur = Math.max(0, faces.findIndex(f => "#" + f.id === location.hash));
let busy = false, lockUntil = 0, lastScroll = 0;
root.style.setProperty("--dur", DUR + "ms");

function setSize() {
  root.style.setProperty("--hw", innerWidth / 2 + "px");
  root.style.setProperty("--persp", Math.max(1800, innerWidth * 1.7) + "px");
}
setSize(); window.addEventListener("resize", setSize);

const pager = document.createElement("div");
pager.className = "pager";
faces.forEach((f, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.title = labels[i]; b.setAttribute("aria-label", labels[i]);
  b.addEventListener("click", () => go(i));
  pager.appendChild(b);
});
document.body.appendChild(pager);

function sync() {
  [...pager.children].forEach((b, i) => b.classList.toggle("active", i === cur));
  document.querySelectorAll("nav ul a").forEach(a => {
    a.classList.toggle("active", faces.findIndex(f => "#" + f.id === a.getAttribute("href")) === cur);
  });
}

function go(n) {
  if (busy || n === cur || n < 0 || n >= faces.length) return;
  const d = n > cur ? 1 : -1, from = faces[cur], to = faces[n];
  busy = true; lockUntil = performance.now() + DUR + 350;
  to.classList.add("vis", d > 0 ? "at-next" : "at-prev", "snap", "shade", "on");
  scrollers[n].scrollTop = d > 0 ? 0 : scrollers[n].scrollHeight;
  from.classList.remove("cur");
  void to.offsetWidth;
  to.classList.remove("snap", "shade");
  from.classList.add("shade");
  cube.classList.add(d > 0 ? "roll-next" : "roll-prev"); // 다음: 오른쪽 → 왼쪽
  setTimeout(() => {
    cube.classList.add("noanim");
    cube.classList.remove("roll-next", "roll-prev");
    from.classList.remove("vis", "shade", "on");
    to.classList.remove("at-next", "at-prev");
    to.classList.add("cur");
    void cube.offsetWidth;
    cube.classList.remove("noanim");
    cur = n; busy = false; sync();
    history.replaceState(null, "", "#" + to.id);
  }, DUR + 40);
}

// 현재 페이지 내부가 100vh보다 길면 끝까지 스크롤한 뒤에만 넘어감
function canScroll(d) {
  const s = scrollers[cur];
  if (s.scrollHeight <= s.clientHeight + 1) return false;
  return d > 0 ? s.scrollTop + s.clientHeight < s.scrollHeight - 2 : s.scrollTop > 2;
}
scrollers.forEach(s => s.addEventListener("scroll", () => lastScroll = performance.now(), { passive: true }));

window.addEventListener("wheel", e => {
  const d = e.deltaY > 0 ? 1 : -1;
  if (canScroll(d)) return;
  e.preventDefault();
  const now = performance.now();
  if (busy || now < lockUntil || Math.abs(e.deltaY) < 4 || now - lastScroll < 200) return;
  go(cur + d);
}, { passive: false });

window.addEventListener("keydown", e => {
  const d = ["ArrowDown", "PageDown"].includes(e.key) ? 1 : ["ArrowUp", "PageUp"].includes(e.key) ? -1 : 0;
  if (!d || canScroll(d)) return;
  e.preventDefault(); go(cur + d);
});

let ty = 0, ts = 0;
window.addEventListener("touchstart", e => { ty = e.touches[0].clientY; ts = scrollers[cur].scrollTop }, { passive: true });
window.addEventListener("touchend", e => {
  const dy = ty - e.changedTouches[0].clientY, d = dy > 0 ? 1 : -1;
  if (Math.abs(dy) < 70 || scrollers[cur].scrollTop !== ts || canScroll(d)) return;
  go(cur + d);
}, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  const i = faces.findIndex(f => "#" + f.id === a.getAttribute("href"));
  if (i >= 0) go(i);
}));

// 시연 사이트 전환 버튼 (Haevichi / BYHEYDEY)
const siteBtns = document.querySelectorAll(".siteBtn"), siteDemos = document.querySelectorAll(".siteDemo");
siteBtns.forEach(btn => btn.addEventListener("click", () => {
  siteBtns.forEach(b => { b.classList.toggle("active", b === btn); b.setAttribute("aria-selected", b === btn) });
  siteDemos.forEach((d, i) => d.classList.toggle("off", i !== +btn.dataset.site));
}));

// 데모 iframe: 기본은 휠이 페이지 전환에 쓰이고, 클릭하면 사이트 조작 모드
document.querySelectorAll(".demoBody").forEach(b => {
  const s = b.querySelector(".shield");
  s.addEventListener("click", () => s.classList.add("off"));
  b.addEventListener("mouseleave", () => s.classList.remove("off"));
});

faces[cur].classList.add("vis", "cur"); sync();
setTimeout(() => faces[cur].classList.add("on"), 150);
