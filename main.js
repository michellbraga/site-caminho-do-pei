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
  desktop: "(min-width: 1100px) and (hover: hover) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 1099px) and (prefers-reduced-motion: no-preference)",
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

  // The hero stays static; no pin or scroll-driven form typing.
  if (mobile) {
    const mobileRoute = document.querySelector("#route");
    mobileRoute.setAttribute("d", "M25 8 C3 90 47 150 25 235 S5 390 25 475 S47 630 25 740");
    document.querySelector(".route-svg").setAttribute("viewBox", "0 0 50 760");
    const mobileLength = mobileRoute.getTotalLength();
    gsap.set(mobileRoute, { strokeDasharray: mobileLength, strokeDashoffset: mobileLength });
    gsap.to(mobileRoute, { strokeDashoffset: 0, duration: 2.8, ease: "none", scrollTrigger: { trigger: ".path-map", start: "top 76%", once: true } });
    gsap.to("#route-pencil", { motionPath: { path: "#route", align: "#route", alignOrigin: [.5, .5], autoRotate: true }, duration: 2.8, ease: "none", scrollTrigger: { trigger: ".path-map", start: "top 76%", once: true } });
  } else { routePath.setAttribute("d", desktopRouteData); routeSvg.setAttribute("viewBox", desktopRouteViewBox); }
  // Marker fill is the only animated background-size property.
  gsap.utils.toArray(".marker").forEach((el) => gsap.to(el, { backgroundSize: "100% 100%", duration: .7, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } }));
  gsap.utils.toArray(".stamp:not(.hero-stamp):not(.mini-stamp):not(.update-stamp):not(.mini-stamp)").forEach((el) => {
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
    gsap.utils.toArray(".gline ellipse").forEach((el, i) => gsap.fromTo(el, { strokeDashoffset: 320 }, { strokeDashoffset: 0, duration: .45, delay: i * .22, ease: "none", scrollTrigger: { trigger: ".generic-lines", start: "top 70%", once: true } }));
  } else if (mobile) {
    gsap.utils.toArray(".gline ellipse").forEach((el, i) => gsap.fromTo(el, { strokeDashoffset: 320 }, { strokeDashoffset: 0, duration: .45, delay: i * .22, ease: "none", scrollTrigger: { trigger: ".generic-lines", start: "top 70%", once: true } }));
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
  let footerVisible = false;
  const syncSticky = () => sticky.classList.toggle("is-visible", heroPassed && !offerVisible && !footerVisible);
  const heroObserver = new IntersectionObserver(([entry]) => { heroPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0; syncSticky(); }, { threshold: 0 });
  const offerObserver = new IntersectionObserver(([entry]) => { offerVisible = entry.isIntersecting; syncSticky(); }, { threshold: 0 });
  heroObserver.observe(document.querySelector("#hero"));
  offerObserver.observe(document.querySelector("#oferta"));
  const footerObserver = new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; syncSticky(); }, { threshold: 0 });
  footerObserver.observe(document.querySelector(".site-footer"));
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

// Static checkout links work without JavaScript and stay synchronized to config.
document.querySelectorAll("[data-cta]").forEach((link) => { link.href = config.checkoutUrl; link.removeAttribute("target"); link.rel = "noopener"; });

if (config.showBonusReference) document.querySelector(".receipt-reference").hidden = false;
document.querySelector(".receipt-reference").textContent = `Os 7 bônus têm valor de referência de ${config.bonusReferenceValue}.`;
if (config.demoMinutes !== null) document.querySelector(".demo-time").textContent = `Preenchido em ${config.demoMinutes} minutos.`;
else document.querySelector(".demo-time").textContent = "Do campo vazio ao plano completo.";
const supportEmail = document.querySelector(".support-email-row");
if (config.supportEmail && supportEmail) { supportEmail.href = `mailto:${config.supportEmail}`; supportEmail.textContent = config.supportEmail; supportEmail.hidden = false; }
const whatsappLink = document.querySelector(".whatsapp-row");
if (config.whatsapp && whatsappLink) { whatsappLink.href = config.whatsapp; whatsappLink.hidden = false; }
const companyLegal = document.querySelector(".company-legal");
if (config.company?.name && config.company?.cnpj && companyLegal) { companyLegal.textContent = `${config.company.name} · CNPJ ${config.company.cnpj}`; companyLegal.hidden = false; }
const priceFrom = document.querySelector(".price-from");
if (config.priceFrom && priceFrom) { priceFrom.textContent = `De R$ ${config.priceFrom}`; priceFrom.hidden = false; }
const bonusReference = document.querySelector(".bonus-reference");
if (config.showBonusReference && bonusReference) bonusReference.hidden = false;

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

// Optional real offer deadline; null leaves the banner hidden.
const deadlineBanner = document.querySelector(".offer-deadline");
if (deadlineBanner && config.offer?.endsAt) {
  const deadline = new Date(config.offer.endsAt).getTime();
  if (Number.isFinite(deadline) && deadline > Date.now()) {
    const dateLabel = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(deadline);
    deadlineBanner.hidden = false;
    const updateDeadline = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) { deadlineBanner.hidden = true; clearInterval(deadlineTimer); return; }
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      deadlineBanner.textContent = `Condição especial até ${dateLabel} · ${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
    };
    updateDeadline();
    const deadlineTimer = setInterval(updateDeadline, 1000);
  }
}

// Type the example once after the mockup entrance.
if (!reduce) {
  const typeFields = [...document.querySelectorAll(".hero-word-page [data-type]")].map((el) => ({ el, text: el.textContent, row: el.closest(".mock-field") }));
  if (typeFields.length) {
    typeFields.forEach(({ el }) => { el.textContent = ""; });
    const typing = gsap.timeline({ delay: 1.2 });
    typeFields.forEach(({ el, text, row }) => {
      typing.add(() => row.classList.add("is-typing"));
      const state = { chars: 0 };
      typing.to(state, { chars: text.length, duration: Math.max(.25, text.length * .028), ease: "none", onUpdate: () => { el.textContent = text.slice(0, Math.floor(state.chars)); } });
      typing.add(() => row.classList.remove("is-typing"));
    });
    typing.fromTo(".hero-stamp", { scale: 1.55, rotation: -12, opacity: 0 }, { scale: 1, rotation: -5, opacity: .95, duration: .28, ease: "power4.in" });
  }
}

// Hero mockup motion only; copy and LCP heading remain visible from the first frame.
const heroStage = document.querySelector(".hero-stage");
if (!reduce && heroStage) {
  const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
  entrance.from(".hero-glow", { opacity: 0, duration: .55 })
    .from(".fan-sheet", { y: 24, scale: .92, rotation: 0, opacity: 0, stagger: .08, duration: .55 }, 0)
    .from(".hero-laptop", { y: 38, opacity: 0, duration: .55 }, .18)
    .from(".hero-tablet", { x: 25, opacity: 0, duration: .45 }, .35)
    .from(".hero-phone", { x: -20, opacity: 0, duration: .45 }, .35)
    .from(".hero-bonus", { y: -22, rotation: 0, opacity: 0, stagger: .06, duration: .42, ease: "back.out(1.5)" }, .6)
    .from(".models-seal,.gift-seal,.update-stamp", { scale: .65, rotation: -12, opacity: 0, stagger: .12, duration: .35, ease: "back.out(1.7)" }, .9)
    .from(".hero-primary-cta", { y: 14, opacity: 0, duration: .35 }, 1.25);
  const heroObserver = new IntersectionObserver(([entry]) => { heroStage.classList.toggle("is-in-view", entry.isIntersecting); }, { threshold: .05 });
  heroObserver.observe(heroStage);
  if (window.matchMedia("(min-width: 1100px) and (hover: hover)").matches) {
    const layers = [...heroStage.querySelectorAll(".hero-laptop[data-depth]")].map((el) => ({ el, depth: Number(el.dataset.depth), x: gsap.quickTo(el, "x", { duration: .35, ease: "power2.out" }), y: gsap.quickTo(el, "y", { duration: .35, ease: "power2.out" }) }));
    heroStage.addEventListener("pointermove", (event) => { const r = heroStage.getBoundingClientRect(); const px = (event.clientX - r.left) / r.width - .5; const py = (event.clientY - r.top) / r.height - .5; layers.forEach((layer) => { layer.x(px * layer.depth); layer.y(py * layer.depth); }); });
    heroStage.addEventListener("pointerleave", () => layers.forEach((layer) => { layer.x(0); layer.y(0); }));
  }
  const shine = document.querySelector(".hero-cta-shine");
  if (shine) gsap.fromTo(shine, { xPercent: -180, opacity: 0 }, { xPercent: 260, opacity: .6, duration: .7, delay: 1.6, ease: "power1.inOut" });
}
