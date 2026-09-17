
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

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("show") }), { threshold: .1 });
document.querySelectorAll(".reveal").forEach(e => io.observe(e));
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
