// ============================================================
//  main.js — Golden Sound
//  Точка входа. Запускает рендеринг и анимации.
//  Supabase НЕ используется — все данные из config.js.
// ============================================================

import { renderArtists, getSwiperInstance } from './artists.js';
import { resizeCanvas, animateParticles, initStars, animateStars } from './canvas.js';
import { initReveal } from './animations.js';
import { renderServices, renderSocials, renderContacts, renderContactSocials, renderSiteConfig } from './content.js';

const prefersReducedMotion = false; // принудительно включаем анимации
let lenis = null;
let globalRafId = null;
let lastTime = performance.now();

// ---- Lenis (плавный скролл) ----
// Обёрнуто в try/catch: если CDN не загрузился — работаем без него
if (!prefersReducedMotion) {
    try {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            touchMultiplier: 2,
        });
    } catch (e) {
        console.warn('Lenis недоступен, скролл стандартный.');
        lenis = null;
    }
}

// ---- Единый RAF — canvas + скролл ----
function renderLoop(time) {
    let dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 16.6;

    if (!prefersReducedMotion) {
        if (lenis) lenis.raf(time);
        animateParticles(dt);
        animateStars(dt);
    }

    globalRafId = requestAnimationFrame(renderLoop);
}

// ---- Пауза когда вкладка неактивна ----
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(globalRafId);
    } else if (!prefersReducedMotion) {
        lastTime = performance.now();
        globalRafId = requestAnimationFrame(renderLoop);
    }
});

// ---- Resize с debounce ----
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas(prefersReducedMotion);
        initStars(prefersReducedMotion);
        const swiper = getSwiperInstance();
        if (swiper) swiper.update();
    }, 250);
});

// ---- Canvas запускаем сразу ----
resizeCanvas(prefersReducedMotion);
initStars(prefersReducedMotion);

if (!prefersReducedMotion) {
    globalRafId = requestAnimationFrame(renderLoop);
}

// ============================================================
//  Порядок загрузки:
//  Шаг 1 — параллельно рендерим всё
//  Шаг 2 — статичные тексты (заголовки, футер)
//  Шаг 3 — пересчитываем canvas (секции теперь полные) + reveal
// ============================================================
Promise.allSettled([
    renderArtists(),
    Promise.resolve(renderSocials()),
    Promise.resolve(renderServices()),
    Promise.resolve(renderContacts()),
    Promise.resolve(renderContactSocials()),
])
.then(() => {
    renderSiteConfig();
})
.then(() => {
    resizeCanvas(prefersReducedMotion);
    initStars(prefersReducedMotion);
    initReveal(prefersReducedMotion);
});
