import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Flip } from "gsap/Flip";
import Lenis from "lenis";
import { config } from "./config.js";
import "./styles.css";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, Flip);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const heroTypeValues = [...document.querySelectorAll("[data-type]")].map((el) => [el, el.textContent]);
const routePath = document.querySelector("#route");
const routeSvg = document.querySelector(".route-svg");
const desktopRouteData = routePath.getAttribute("d");
const desktopRouteViewBox = routeSvg.getAttribute("viewBox");

// Matched contexts own their scroll triggers and clean up on breakpoint changes.
const mm = gsap.matchMedia();
mm.add({
  desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
}, ({ conditions }) => {
  const { desktop, mobile, reduce: reduced } = conditions;
  if (reduced) {
    gsap.set("[data-anim], .stamp, .marker, .bar, .red-circles, #route, #route-pencil", { clearProps: "all", opacity: 1 });
    gsap.set("[data-type]", { clearProps: "all" });
    gsap.set(".marker", { backgroundSize: "100% 100%" });
    heroTypeValues.forEach(([el, text]) => { el.textContent = text; });
    routePath.setAttribute("d", desktopRouteData);
    routeSvg.setAttribute("viewBox", desktopRouteViewBox);
    return;
  }

  // The hero form is typed in sync on paper and on the screen.
  const originals = heroTypeValues;
  if (desktop) {
    routePath.setAttribute("d", desktopRouteData);
    routeSvg.setAttribute("viewBox", desktopRouteViewBox);
    originals.forEach(([el]) => { el.textContent = ""; });
    const state = { progress: 0 };
    const fields = [...new Set(originals.map(([el]) => el.dataset.type))];
    const content = Object.fromEntries(fields.map((key) => [key, originals.find(([el]) => el.dataset.type === key)[1]]));
    const total = Object.values(content).reduce((sum, value) => sum + value.length, 0);
    gsap.to(state, { progress: 1, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "+=1200", scrub: true, pin: true, refreshPriority: 3 }, onUpdate: () => {
      let chars = Math.round(total * state.progress);
      for (const key of fields) {
        const count = Math.max(0, Math.min(content[key].length, chars));
        document.querySelectorAll(`[data-type="${key}"]`).forEach((el) => { el.textContent = content[key].slice(0, count); });
        chars -= content[key].length;
      }
    }});
    gsap.fromTo(".hero-stamp", { scale: 1.8, rotation: -14, opacity: 0 }, { scale: 1, rotation: -5, opacity: .95, duration: .3, ease: "power4.in", scrollTrigger: { trigger: "#hero", start: "top+=1100 top", toggleActions: "play none none none" } });
    gsap.to(".desk-scene", { y: -12, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
  } else if (mobile) {
    const mobileRoute = document.querySelector("#route");
    mobileRoute.setAttribute("d", "M25 8 C3 90 47 150 25 235 S5 390 25 475 S47 630 25 740");
    document.querySelector(".route-svg").setAttribute("viewBox", "0 0 50 760");
    const mobileLength = mobileRoute.getTotalLength();
    gsap.set(mobileRoute, { strokeDasharray: mobileLength, strokeDashoffset: mobileLength });
    gsap.to(mobileRoute, { strokeDashoffset: 0, duration: 2.8, ease: "none", scrollTrigger: { trigger: ".path-map", start: "top 76%", once: true } });
    gsap.to("#route-pencil", { motionPath: { path: "#route", align: "#route", alignOrigin: [.5, .5], autoRotate: true }, duration: 2.8, ease: "none", scrollTrigger: { trigger: ".path-map", start: "top 76%", once: true } });
    originals.forEach(([el]) => { el.textContent = ""; });
    const values = Object.fromEntries([...new Set(originals.map(([el]) => el.dataset.type))].map((key) => [key, originals.find(([el]) => el.dataset.type === key)[1]]));
    const fields = Object.keys(values);
    const total = Object.values(values).reduce((sum, value) => sum + value.length, 0);
    const state = { progress: 0 };
    gsap.to(state, { progress: 1, duration: 2.4, ease: "none", scrollTrigger: { trigger: ".hero-paper", start: "top 78%", once: true }, onUpdate: () => {
      let chars = Math.round(total * state.progress);
      for (const key of fields) {
        const count = Math.max(0, Math.min(values[key].length, chars));
        document.querySelectorAll(`[data-type="${key}"]`).forEach((el) => { el.textContent = values[key].slice(0, count); });
        chars -= values[key].length;
      }
    }});
    gsap.fromTo(".hero-stamp", { scale: 1.6, rotation: -12, opacity: 0 }, { scale: 1, rotation: -5, opacity: .95, duration: .35, ease: "power4.in", scrollTrigger: { trigger: ".hero-paper", start: "top 70%", once: true } });
  }

  // Marker fill is the only animated background-size property.
  gsap.utils.toArray(".marker").forEach((el) => gsap.to(el, { backgroundSize: "100% 100%", duration: .7, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } }));
  gsap.utils.toArray(".stamp:not(.hero-stamp)").forEach((el) => {
    gsap.fromTo(el, { scale: 1.7, rotation: -14, opacity: 0 }, { scale: 1, rotation: -6, opacity: .95, duration: .3, ease: "power4.in", scrollTrigger: { trigger: el, start: "top 82%", once: true } });
  });
  gsap.utils.toArray(".section-heading").forEach((el) => gsap.from(el.children, { y: 26, opacity: 0, stagger: .08, duration: .55, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 82%", once: true } }));
  gsap.fromTo(".bar-2025", { scaleY: 0 }, { scaleY: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".stats-art", start: "top 75%", once: true } });
  const counter = { value: 0 };
  gsap.to(counter, { value: 2.5, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: ".stats-art", start: "top 70%", once: true }, onUpdate: () => { const el = document.querySelector(".chart-caption"); if (el) el.firstChild.textContent = counter.value.toFixed(1).replace(".", ","); } });

  if (desktop) {
    // Desktop-only horizontal document timeline.
    const track = document.querySelector("#timeline-track");
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 120);
    const timelineTl = gsap.timeline({ scrollTrigger: { trigger: "#datas", pin: true, scrub: 1, start: "top top", end: () => `+=${distance()}`, invalidateOnRefresh: true, refreshPriority: 2 } }).to(track, { x: () => -distance(), ease: "none" });
    gsap.utils.toArray(".law-paper .mini-stamp").forEach((stamp) => gsap.fromTo(stamp, { scale: 1.7, rotation: -14, opacity: 0 }, { scale: 1, rotation: -6, opacity: .95, duration: .3, ease: "power4.in", scrollTrigger: { trigger: stamp.closest(".law-paper"), containerAnimation: timelineTl, start: "left center", once: true } }));
    // Pencil and path stay aligned over the four stops.
    const route = document.querySelector("#route");
    const pathLength = route.getTotalLength();
    gsap.set(route, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    const pathTl = gsap.timeline({ scrollTrigger: { trigger: "#caminho", pin: true, scrub: 1, start: "top top", end: "+=1800", refreshPriority: 1 } });
    pathTl.to(route, { strokeDashoffset: 0, ease: "none", duration: 4 }, 0).to("#route-pencil", { motionPath: { path: "#route", align: "#route", alignOrigin: [.5, .5], autoRotate: true }, ease: "none", duration: 4 }, 0);
    gsap.fromTo(".doc-card", { y: 25, rotation: 5, opacity: .3 }, { y: 0, rotation: 0, opacity: 1, stagger: .25, duration: .5, ease: "back.out(1.4)", scrollTrigger: { trigger: ".path-map", start: "top 60%", once: true } });
    gsap.fromTo(".red-circles", { strokeDashoffset: 800 }, { strokeDashoffset: 0, duration: 1.6, ease: "none", scrollTrigger: { trigger: ".autopsy-layout", start: "top 65%", once: true } });
  } else if (mobile) {
    gsap.fromTo(".red-circles", { strokeDashoffset: 800 }, { strokeDashoffset: 0, duration: 1.5, ease: "none", scrollTrigger: { trigger: ".autopsy-layout", start: "top 70%", once: true } });
    gsap.utils.toArray(".path-stop").forEach((el) => gsap.from(el.querySelectorAll(".stop-number,.doc-card,.postit"), { y: 20, opacity: 0, stagger: .08, duration: .5, scrollTrigger: { trigger: el, start: "top 82%", once: true } }));
  }

  // Window fall and page reveals.
  gsap.from(".folder-window", { y: -35, rotationX: 5, opacity: 0, duration: .7, ease: "back.out(1.2)", scrollTrigger: { trigger: ".folder-window", start: "top 85%", once: true } });
  gsap.from(".day-note", { y: 25, rotation: -8, opacity: 0, stagger: .2, duration: .55, ease: "back.out(1.2)", scrollTrigger: { trigger: ".week-board", start: "top 78%", once: true } });
  gsap.from(".book-cover", { y: 45, rotation: 8, opacity: 0, stagger: .08, duration: .55, ease: "back.out(1.4)", scrollTrigger: { trigger: ".bonus-covers", start: "top 80%", once: true } });
  gsap.fromTo(".guarantee-seal", { rotation: -25, scale: .8, opacity: 0 }, { rotation: 0, scale: 1, opacity: 1, duration: .8, ease: "back.out(1.5)", scrollTrigger: { trigger: ".guarantee-section", start: "top 75%", once: true } });

});

// Show the mobile CTA after the hero, and hide it while the offer is on screen.
const sticky = document.querySelector(".mobile-sticky-cta");
if (sticky && "IntersectionObserver" in window) {
  let heroPassed = false;
  let offerVisible = false;
  const syncSticky = () => sticky.classList.toggle("is-visible", heroPassed && !offerVisible);
  const heroObserver = new IntersectionObserver(([entry]) => { heroPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0; syncSticky(); }, { threshold: 0 });
  const offerObserver = new IntersectionObserver(([entry]) => { offerVisible = entry.isIntersecting; syncSticky(); }, { threshold: 0 });
  heroObserver.observe(document.querySelector("#hero"));
  offerObserver.observe(document.querySelector("#oferta"));
}

// Refresh after web fonts settle so pinned sections use final dimensions.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

// Folder selector updates the illustrated file listing from config.js.
const fileRows = [...document.querySelectorAll(".file-row span")];
document.querySelectorAll(".folder-choice").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".folder-choice").forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  document.querySelector(".folder-current").textContent = button.dataset.folder;
  const names = config.fileExamples;
  fileRows.forEach((row, index) => { row.textContent = names[index % names.length]; });
}));
document.querySelectorAll(".format-switch button").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".format-switch button").forEach((item) => item.classList.toggle("selected", item === button));
}));

// Tabs support arrow-key navigation and expose the selected role.
const audience = [
  ["Professor regular", "Adaptar a aula sem inventar o documento do zero."],
  ["Professor de AEE", "PAEE e estudo de caso estruturados, prontos para editar."],
  ["Coordenação", "Padronizar os planos da escola sem engessar cada aluno."],
  ["Profissional de apoio", "A lei diz que você atua de acordo com o PEI e o PAEE. Agora você sabe como é um."],
  ["Educação Infantil", "Modelos pensados para a primeira etapa, com linguagem e objetivos da faixa etária."],
];
const tabs = [...document.querySelectorAll('[role="tab"]')];
function activateTab(index) {
  const tab = tabs[index];
  const marker = document.querySelector("#tab-marker");
  if (marker) { const state = Flip.getState(marker); tab.append(marker); Flip.from(state, { duration: .35, ease: "power2.inOut" }); }
  tabs.forEach((item, i) => { item.setAttribute("aria-selected", String(i === index)); item.tabIndex = i === index ? 0 : -1; });
  const [title, copy] = audience[index];
  const panel = document.querySelector("#audience-panel");
  if (!reduce) gsap.fromTo(panel, { rotationY: -12, opacity: .5 }, { rotationY: 0, opacity: 1, duration: .45, clearProps: "transform" });
  document.querySelector("#audience-title").textContent = title;
  document.querySelector("#audience-copy").textContent = copy;
  panel.setAttribute("aria-labelledby", tab.id);
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(index));
  tab.addEventListener("keydown", (event) => {
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : null;
    if (next !== null) { event.preventDefault(); tabs[next].focus(); activateTab(next); }
  });
});

// Flip FAQ cards; keep only one answer open.
const faqItems = [...document.querySelectorAll(".faq-item")];
faqItems.forEach((item) => { item.querySelector(".faq-answer").setAttribute("aria-hidden", "true"); item.addEventListener("click", () => {
  const open = item.getAttribute("aria-expanded") === "true";
  faqItems.forEach((card) => card.setAttribute("aria-expanded", "false"));
  item.setAttribute("aria-expanded", String(!open));
  faqItems.forEach((card) => card.querySelector(".faq-answer").setAttribute("aria-hidden", String(card !== item || open)));
}); });

// Every checkout destination comes from config.js. Unconfirmed stage links stay unavailable.
const checkoutButton = document.querySelector(".checkout-link");
document.querySelectorAll("[data-offer]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-offer]").forEach((item) => { item.classList.toggle("is-selected", item === button); item.setAttribute("aria-pressed", String(item === button)); });
  const selectedDestination = config.checkout[button.dataset.offer];
  const destination = selectedDestination && selectedDestination !== "TODO"
    ? selectedDestination
    : config.checkout[config.fallbackCheckout];
  if (destination && destination !== "TODO") {
    checkoutButton.href = destination; checkoutButton.removeAttribute("aria-disabled"); checkoutButton.classList.remove("is-disabled");
  } else {
    checkoutButton.removeAttribute("href"); checkoutButton.setAttribute("aria-disabled", "true"); checkoutButton.classList.add("is-disabled");
  }
}));
if (config.showBonusReference) document.querySelector(".receipt-reference").hidden = false;
document.querySelector(".receipt-reference").textContent = `Os 7 bônus têm valor de referência de ${config.bonusReferenceValue}.`;
if (config.demoMinutes !== null) document.querySelector(".demo-time").textContent = `Preenchido em ${config.demoMinutes} minutos.`;
else document.querySelector(".demo-time").textContent = "Do campo vazio ao plano completo.";
if (config.supportEmail !== "TODO") {
  const support = document.querySelector(".support-link"); support.href = `mailto:${config.supportEmail}`; support.textContent = config.supportEmail;
} else document.querySelector(".support-link").removeAttribute("href");

// One click loads each YouTube embed, avoiding third-party requests before consent.
document.querySelector(".video-note")?.addEventListener("click", (event) => {
  const index = Number(event.currentTarget.dataset.videoIndex || 0);
  const id = config.testimonialVideos[index];
  if (!id) return;
  const frame = document.createElement("iframe");
  frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`;
  frame.title = "Vídeo de depoimento"; frame.loading = "lazy"; frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"; frame.allowFullscreen = true;
  const note = document.querySelector(".video-note"); note.replaceChildren(frame);
});

// Update the pencil shaped progress marker along the document.
const progressPencil = document.querySelector(".progress-pencil");
if (!reduce && progressPencil) gsap.to(progressPencil, { y: () => Math.max(0, document.querySelector(".progress-rail").clientHeight - 60), ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: .3 } });
