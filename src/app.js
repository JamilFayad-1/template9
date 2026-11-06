import Lenis from '/vendor/lenis.mjs';
import { createDisclosures } from '/disclosures.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let effectsPaused = sessionStorage.getItem('sole-motion') === 'paused';
const motionAllowed = () => !reduced.matches && !effectsPaused;
let lenis, cleanupPage = () => {}, visuals = [], routeBusy = false, pendingRoute = null;
let userPaused = reduced.matches, projectOpener, briefURLs = [];
const pageCache = new Map();
const pages = { '/': ['Home', 'home', '00'], '/work/': ['Work', 'work', '01'], '/studio/': ['Studio', 'studio', '02'], '/contact/': ['Let’s talk', 'contact', '03'] };
const menu = $('.menu-dialog'), projectDialog = $('.project-dialog'), film = $('.film-dialog');
const header = $('.site-header');
const headerObserver = new ResizeObserver(() => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`));
headerObserver.observe(header);
const projects = [
  { id: 'soft-focus', title: 'Soft Focus', type: 'Fashion / Creative direction', image: '/assets/editorial-olive.webp', alt: 'Sunlit portrait in an olive jacket', description: 'An exploration of texture, movement, and the light between moments. A fashion story built around the beauty of looking twice.', note: 'Visual study. Reference imagery discovered through Tatiana + Karol on Cosmos.' },
  { id: 'salt-and-sun', title: 'Salt & Sun', type: 'Editorial / Photography', image: '/assets/editorial-salt.webp', secondary: '/assets/editorial-silhouette.webp', alt: 'An editorial fashion portrait beside a pink salt lake', description: 'Warm light, open space, and a character who makes the whole scene her own. An editorial study in colour and confidence.', note: 'Visual study. Editorial references curated through Paul Drozdowski Retouch on Cosmos.' },
  { id: 'after-hours', title: 'After Hours', type: 'Image-making / Art direction', image: '/assets/editorial-monochrome.webp', alt: 'Black and white fashion contact sheet', description: 'A simple set. A little attitude. A study in repetition and the small gestures that give an image its character.', note: 'Visual study. Reference imagery discovered through Daria on Cosmos.' },
  { id: 'off-script', title: 'Off Script', type: 'Film / Behind the scenes', image: '/assets/studio-detail.jpg', alt: 'Behind the scenes at a creative production', description: 'Before the finished image, there’s the energy in the room. A glimpse of the people, movement, and instinct behind a production.', note: 'Film study using the supplied Cosmos reference clip. Original footage belongs to its creator.', film: true }
];

const grain = document.createElement('div'); grain.className = 'site-grain'; grain.setAttribute('aria-hidden', 'true'); document.body.append(grain);
const shutter = document.createElement('div'); shutter.className = 'route-shutter'; shutter.setAttribute('aria-hidden', 'true');
shutter.innerHTML = `${'<div class="shutter-blade"></div>'.repeat(8)}<div class="shutter-label"><span class="shutter-wordmark">SOLË</span><div class="shutter-caption"><span>PRODUCTION / <b>01</b></span><span class="shutter-destination">WORK</span></div></div>`;
document.body.append(shutter);
const announcement = document.createElement('div'); announcement.className = 'route-announcement'; announcement.setAttribute('role', 'status'); document.body.append(announcement);

function setupScroll() {
  lenis?.destroy(); lenis = null;
  if (!motionAllowed()) return;
  lenis = new Lenis({ autoRaf: true, lerp: .105, smoothWheel: true, syncTouch: false, anchors: true, prevent: node => node.hasAttribute?.('data-lenis-prevent') });
  if ($('dialog[open]')) lenis.stop();
}
function syncHero() {
  const video = $('#hero-video'), button = $('.motion-toggle'); if (!video || !button) return;
  const paused = userPaused || !motionAllowed() || document.hidden || !!$('dialog[open]') || routeBusy;
  if (paused) video.pause(); else video.play().catch(() => { userPaused = true; syncHero(); });
  const selected = userPaused || !motionAllowed(); button.setAttribute('aria-pressed', String(selected));
  button.innerHTML = selected ? 'Play motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
}
function updateEffects() {
  document.documentElement.classList.toggle('effects-paused', !motionAllowed());
  $$('[data-effects]').forEach(b => { b.setAttribute('aria-pressed', String(effectsPaused)); b.textContent = motionAllowed() ? 'Motion on' : 'Motion off'; });
  setupScroll(); syncHero(); visuals.forEach(effect => effect.refresh());
  if (!motionAllowed()) $$('.reveal').forEach(e => e.classList.add('revealed'));
}
function openDialog(dialog) {
  $$('dialog[open]').forEach(d => d.close()); dialog.showModal();
  document.body.classList.add('dialog-open'); lenis?.stop(); syncHero();
}
// The reveal originates at the actual icon, including on narrow screens.
let menuAnimation, menuSpin, menuReturnSpin, menuClosing;
function menuCircle(radius) {
  return `circle(${radius}px at ${menu.dataset.originX}px ${menu.dataset.originY}px)`;
}
function openMenu() {
  if (menu.open) return;
  const opener = $('.menu-glyph');
  menuReturnSpin?.cancel();
  // Sample the live hover transition, including clicks before it has finished.
  const matrix = new DOMMatrixReadOnly(getComputedStyle(opener).transform);
  const startAngle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  const endAngle = startAngle > .01 ? 315 : 135;
  opener.style.transform = `rotate(${startAngle}deg)`;
  const rect = opener.getBoundingClientRect();
  const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
  menu.dataset.originX = x; menu.dataset.originY = y;
  menu.style.setProperty('--menu-x', `${x}px`); menu.style.setProperty('--menu-y', `${y}px`);
  menu.style.clipPath = menuCircle(0);
  openDialog(menu);
  $('.menu-toggle').setAttribute('aria-expanded', 'true');
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 2;
  const glyph = $('.close-button span', menu);
  glyph.style.transform = `rotate(${endAngle}deg)`;
  if (!motionAllowed()) { menu.style.clipPath = 'none'; return; }
  menuAnimation = menu.animate([{ clipPath: menuCircle(0) }, { clipPath: menuCircle(radius) }], { duration: 760, easing: 'cubic-bezier(.65,0,.2,1)' });
  menu.style.clipPath = menuCircle(radius);
  const opening = menuAnimation;
  opening.finished.then(() => { if (menuAnimation === opening && !menuClosing) menu.style.clipPath = 'none'; }).catch(() => {});
  menuSpin = glyph.animate([{ transform: `rotate(${startAngle}deg)` }, { transform: `rotate(${endAngle}deg)` }], { duration: 760, easing: 'cubic-bezier(.65,0,.2,1)' });
}
function closeMenu() {
  if (!menu.open) return Promise.resolve();
  if (menuClosing) return menuClosing;
  const from = getComputedStyle(menu).clipPath;
  const glyph = $('.close-button span', menu), opener = $('.menu-glyph');
  const matrix = new DOMMatrixReadOnly(getComputedStyle(glyph).transform);
  const angle = (Math.atan2(matrix.b, matrix.a) * 180 / Math.PI + 360) % 360;
  const restingAngle = Math.ceil((angle + 180) / 360) * 360;
  const frames = [{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${restingAngle}deg)` }];
  menuAnimation?.cancel(); menuSpin?.cancel();
  $('.menu-toggle').classList.add('menu-returned');
  glyph.style.transform = opener.style.transform = `rotate(${restingAngle}deg)`;
  if (!motionAllowed()) { menu.close(); return Promise.resolve(); }
  const radius = Math.hypot(innerWidth, innerHeight) + 2;
  menuAnimation = menu.animate([{ clipPath: from === 'none' ? menuCircle(radius) : from }, { clipPath: menuCircle(0) }], { duration: 700, easing: 'cubic-bezier(.65,0,.3,1)', fill: 'forwards' });
  const timing = { duration: 700, easing: 'cubic-bezier(.65,0,.3,1)' };
  menuSpin = glyph.animate(frames, timing);
  // Both copies turn together as the shrinking circle uncovers the header.
  menuReturnSpin = opener.animate(frames, timing);
  menuClosing = menuAnimation.finished.catch(() => {}).then(() => {
    if (menu.open) menu.close();
    menuAnimation?.cancel(); menuClosing = null;
  });
  return menuClosing;
}
$('.menu-toggle').addEventListener('pointerleave', () => { if (!menu.open) $('.menu-toggle').classList.remove('menu-returned'); });
document.addEventListener('pointerover', event => { if (!menu.open && !event.target.closest('.menu-toggle')) $('.menu-toggle').classList.remove('menu-returned'); }, { passive: true });
menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
$$('dialog').forEach(dialog => {
  $('[data-close]', dialog)?.addEventListener('click', () => dialog === menu ? closeMenu() : dialog.close());
  dialog.addEventListener('close', () => {
    if (dialog === menu) { $('.menu-glyph').style.removeProperty('transform'); $('.menu-toggle').setAttribute('aria-expanded', 'false'); menuAnimation?.cancel(); menuSpin?.cancel(); menuReturnSpin?.cancel();
    }
    if (dialog === film) $('video', dialog).pause();
    if (dialog === projectDialog && location.hash.startsWith('#project/')) {
      history.replaceState({ path: location.pathname }, '', location.pathname + (location.pathname === '/' ? '#work' : '#archive'));
      if (projectOpener?.isConnected) projectOpener.focus({ preventScroll: true });
    }
    if (!$('dialog[open]')) { document.body.classList.remove('dialog-open'); if (!routeBusy) lenis?.start(); }
    syncHero();
  });
});
function showFilm() { openDialog(film); const player = $('video', film); player.currentTime = 0; player.play().catch(() => {}); }
function showProject(id, updateHash = true) {
  const p = projects.find(p => p.id === id); if (!p) return;
  const next = projects[(projects.indexOf(p) + 1) % projects.length];
  $('.project-dialog-content').innerHTML = `<div class="project-dialog-head"><h2 id="project-title">${p.title}</h2><div class="project-dialog-description"><p>${p.description}</p><div class="project-meta"><span>${p.type}</span><span>Concept / 2026</span></div></div></div><img class="project-hero" src="${p.image}" alt="${p.alt}">${p.film ? '<button class="project-film-cta" data-film>Play the studio film ↗</button>' : ''}${p.secondary ? `<img class="project-secondary" src="${p.secondary}" alt="A second portrait from the Salt & Sun editorial study">` : ''}<div class="project-dialog-foot"><p>${p.note}</p><button class="project-next" data-next="${next.id}">Next up: ${next.title} ↗</button></div>`;
  if (!projectDialog.open) openDialog(projectDialog);
  projectDialog.scrollTop = 0; $('[data-close]', projectDialog).focus({ preventScroll: true });
  if (updateHash) history.replaceState({ path: location.pathname }, '', `${location.pathname}#project/${id}`);
}

function initPage({ entering = false } = {}) {
  const main = $('main'), controller = new AbortController(); visuals = [];
  if (entering && $('.hero', main) && motionAllowed()) document.documentElement.classList.add('hero-pending');
  $$('.desktop-nav a,.menu-dialog nav a').forEach(link => {
    if (new URL(link.href).pathname === location.pathname) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  document.documentElement.classList.toggle('js-motion', motionAllowed());
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
  }), { threshold: .06, rootMargin: '0px 0px -20px 0px' });
  $$('.reveal', main).forEach(e => motionAllowed() ? observer.observe(e) : e.classList.add('revealed'));
  visuals.push(createDisclosures(main, { motionAllowed, onResize: () => lenis?.resize() }));
  document.fonts.ready.then(() => {
    if (controller.signal.aborted) return;
    clearTimeout(window.soleHeroFallback);
    const hero = $('.hero', main);
    if (!hero || !motionAllowed() || !document.documentElement.classList.contains('hero-pending')) {
      document.documentElement.classList.remove('hero-pending'); return;
    }
    hero.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-out', fill: 'backwards' });
    $$('.hero-type h1 span', main).forEach((letter, i) => letter.animate([{ transform: 'translateY(105%) rotate(4deg)', opacity: 0 }, { transform: 'translateY(0) rotate(0)', opacity: 1 }], { duration: 1100, delay: (entering ? 60 : 100) + i * 90, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
    $('.hero-media', main)?.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0)' }], { duration: 1200, delay: 250, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    document.documentElement.classList.remove('hero-pending');
  });
  $$('[data-effects]').forEach(b => { b.setAttribute('aria-pressed', String(effectsPaused)); b.textContent = motionAllowed() ? 'Motion on' : 'Motion off'; }); syncHero();
  cleanupPage = () => {
    controller.abort(); observer.disconnect(); visuals.forEach(effect => effect.destroy()); visuals = [];
    main.querySelectorAll('video').forEach(video => video.pause());
    briefURLs.forEach(url => URL.revokeObjectURL(url)); briefURLs = [];
  };
}
function loadPage(path) {
  if (!pageCache.has(path)) {
    pageCache.set(path, fetch(path, { signal: AbortSignal.timeout(10000), headers: { 'X-SOLE-Navigation': '1' } }).then(response => {
      if (!response.ok) throw new Error('Page unavailable'); return response.text();
    }).then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (!doc.querySelector('main') || !doc.body.dataset.page) throw new Error('Invalid page');
      return { main: doc.querySelector('main').outerHTML, title: doc.title, page: doc.body.dataset.page, description: doc.querySelector('meta[name="description"]')?.content || '' };
    }).catch(error => { pageCache.delete(path); throw error; }));
  }
  return pageCache.get(path);
}
const ease = 'cubic-bezier(.76,0,.24,1)';
async function cover(path) {
  if (!motionAllowed()) return;
  shutter.classList.add('is-active'); $('.shutter-destination').textContent = pages[path][0].toUpperCase(); $('.shutter-caption b').textContent = pages[path][2];
  const animations = $$('.shutter-blade').map((blade, i) => blade.animate([{ transform: `translateY(${i % 2 ? 101 : -101}%)` }, { transform: 'translateY(0)' }], { duration: 420, delay: i * 20, easing: ease, fill: 'forwards' }));
  $('.shutter-label').animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, delay: 330, fill: 'forwards' });
  await Promise.all(animations.map(a => a.finished));
}
async function uncover() {
  if (!shutter.classList.contains('is-active')) return;
  $('.shutter-label').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, fill: 'forwards' });
  await Promise.all($$('.shutter-blade').map((blade, i) => blade.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${i % 2 ? -101 : 101}%)` }], { duration: 560, delay: i * 18, easing: ease, fill: 'forwards' }).finished));
  shutter.classList.remove('is-active'); shutter.getAnimations({ subtree: true }).forEach(a => a.cancel());
}
async function navigate(url, { pop = false } = {}) {
  if (routeBusy) { pendingRoute = { url, pop }; return; }
  const target = new URL(url, location.origin); if (!pages[target.pathname]) { location.href = target.href; return; }
  routeBusy = true; document.body.classList.add('route-loading'); announcement.textContent = `Opening ${pages[target.pathname][0]}`;
  $$('dialog[open]').forEach(d => d.close()); lenis?.stop(); syncHero();
  try {
    const [page] = await Promise.all([loadPage(target.pathname), cover(target.pathname)]);
    cleanupPage(); $('main').outerHTML = page.main; document.title = page.title; document.body.dataset.page = page.page;
    $('meta[name="description"]').content = page.description; $('meta[property="og:title"]').content = page.title;
    if (!pop) history.pushState({ path: target.pathname }, '', target.pathname + target.hash);
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); else window.scrollTo({ top: 0, behavior: 'instant' });
    initPage({ entering: true }); lenis?.resize(); $('main').setAttribute('tabindex', '-1'); $('main').focus({ preventScroll: true });
    await uncover();
    if (target.hash.startsWith('#project/')) showProject(target.hash.slice(9), false); else if (target.hash) scrollAnchor(target.hash, true);
    announcement.textContent = `${pages[target.pathname][0]} page`;
  } catch { location.href = target.href; }
  finally { routeBusy = false; document.body.classList.remove('route-loading'); if (!$('dialog[open]')) lenis?.start(); syncHero(); if (pendingRoute) { const next = pendingRoute; pendingRoute = null; navigate(next.url, { pop: next.pop }); } }
}
function scrollAnchor(hash, immediate = false) {
  let destination; try { destination = $(hash); } catch { return; } if (!destination) return;
  if (lenis) lenis.scrollTo(destination, { immediate }); else destination.scrollIntoView({ behavior: motionAllowed() && !immediate ? 'smooth' : 'instant' });
}

// One delegated listener keeps fetched pages interactive without retaining detached nodes.
document.addEventListener('click', async event => {
  const target = event.target.closest('a,button'); if (!target) return;
  if (target.matches('.menu-toggle')) return openMenu();
  if (target.hasAttribute('data-effects')) { effectsPaused = !effectsPaused; sessionStorage.setItem('sole-motion', effectsPaused ? 'paused' : 'on'); updateEffects(); return; }
  if (target.hasAttribute('data-film')) return showFilm();
  if (target.hasAttribute('data-credits')) return openDialog($('.credits-dialog'));
  if (target.hasAttribute('data-project')) { projectOpener = target; showProject(target.dataset.project); return; }
  if (target.hasAttribute('data-next')) return showProject(target.dataset.next);
  if (target.matches('.motion-toggle')) {
    const video = $('#hero-video');
    if (!motionAllowed() && video) {
      const play = video.paused; if (play) video.play().catch(() => {}); else video.pause();
      target.setAttribute('aria-pressed', String(!play)); target.innerHTML = play ? 'Pause motion <span aria-hidden="true">Ⅱ</span>' : 'Play motion <span aria-hidden="true">▷</span>';
    } else { userPaused = !userPaused; syncHero(); }
    return;
  }
  if (target.hasAttribute('data-filter')) {
    const grid = $('.project-grid'), filter = target.dataset.filter;
    $$('[data-filter]').forEach(b => { b.classList.toggle('active', b === target); b.setAttribute('aria-pressed', String(b === target)); });
    grid.classList.toggle('is-filtered', filter !== 'all'); $$('.project', grid).forEach(p => { p.hidden = filter !== 'all' && p.dataset.kind !== filter; if (!p.hidden) p.classList.add('revealed'); }); lenis?.resize(); return;
  }
  if (target.matches('.marquee-toggle')) {
    const paused = $('.manifesto').classList.toggle('paused'); target.setAttribute('aria-pressed', String(paused)); target.setAttribute('aria-label', paused ? 'Play moving text' : 'Pause moving text'); target.innerHTML = paused ? 'Play ▷' : 'Pause Ⅱ'; return;
  }
  if (target.tagName !== 'A' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target.target || target.hasAttribute('download')) return;
  const url = new URL(target.href); if (url.origin !== location.origin || !pages[url.pathname]) return;
  if (menu.open) { event.preventDefault(); await closeMenu(); }
  if (url.pathname !== location.pathname) { event.preventDefault(); navigate(url.href); }
  else if (url.hash && !url.hash.startsWith('#project/')) { event.preventDefault(); history.pushState({ path: location.pathname }, '', url.href); scrollAnchor(url.hash); }
  else if (!url.hash) { event.preventDefault(); if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: motionAllowed() ? 'smooth' : 'instant' }); }
});
document.addEventListener('submit', event => {
  const form = event.target; if (!form.matches('.brief-form')) return;
  event.preventDefault(); if (!form.reportValidity()) return;
  const data = new FormData(form);
  const text = `SOLË / PROJECT BRIEF\nIndependent portfolio concept\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nDirection: ${data.get('type')}\n\nTHE IDEA\n${data.get('idea')}\n\nNo message has been sent. Share this brief with your creative team.\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); briefURLs.push(url);
  const result = $('.form-result', form); result.hidden = false; result.replaceChildren(document.createTextNode('Your brief is ready. Save it and start the conversation. '));
  const link = document.createElement('a'); link.href = url; link.download = 'SOLE-project-brief.txt'; link.textContent = 'Download your project brief ↗'; result.append(link);
});
const prefetch = event => {
  const link = event.target.closest('a'); if (!link) return;
  const url = new URL(link.href); if (url.origin === location.origin && pages[url.pathname] && url.pathname !== location.pathname) loadPage(url.pathname).catch(() => {});
};
document.addEventListener('pointerover', prefetch, { passive: true }); document.addEventListener('focusin', prefetch);
window.addEventListener('popstate', () => {
  if (document.body.dataset.page !== pages[location.pathname]?.[1]) navigate(location.href, { pop: true });
  else if (location.hash.startsWith('#project/')) showProject(location.hash.slice(9), false);
  else { if (projectDialog.open) projectDialog.close(); if (location.hash) scrollAnchor(location.hash); }
});
window.addEventListener('hashchange', () => { if (location.hash.startsWith('#project/')) showProject(location.hash.slice(9), false); });
reduced.addEventListener('change', updateEffects);
document.addEventListener('visibilitychange', () => { document.documentElement.classList.toggle('page-hidden', document.hidden); syncHero(); });
history.scrollRestoration = 'manual';
history.replaceState({ path: location.pathname }, '', location.href); setupScroll(); initPage();
document.documentElement.classList.toggle('effects-paused', !motionAllowed());
if (location.hash.startsWith('#project/')) showProject(location.hash.slice(9), false);
