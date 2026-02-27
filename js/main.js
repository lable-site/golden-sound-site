// ============================================================
//  main.js — точка входа. Запускает всё остальное.
//  Golden Sound edition: добавлены renderContacts + renderContactSocials
// ============================================================

import { renderArtists, getSwiperInstance } from './artists.js';
import { resizeCanvas, animateParticles, initStars, animateStars } from './canvas.js';
import { initReveal } from './animations.js';
import { renderServices, renderStats, renderSocials, renderSiteConfig, renderContacts, renderContactSocials } from './content.js';

// Принудительно включаем анимации для всех (не зависим от системных настроек)
const prefersReducedMotion = false;
let lenis = null;
let globalRafId = null;
let lastTime = performance.now();

// ---- Lenis (плавный скролл) ----
// Обёрнуто в try/catch: если CDN не загрузился — работаем без Lenis
if (!prefersReducedMotion) {
    try {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            touchMultiplier: 2,
        });
    } catch (e) {
        console.warn('Lenis недоступен (CDN не загрузился). Скролл работает в стандартном режиме.');
        lenis = null;
    }
}

// ---- Единый RAF loop — canvas + звёзды + плавный скролл ----
function renderLoop(time) {
    let dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 16.6; // защита от "прыжка" после свёрнутой вкладки

    if (!prefersReducedMotion) {
        if (lenis) lenis.raf(time);
        animateParticles(dt);
        animateStars(dt);
    }

    globalRafId = requestAnimationFrame(renderLoop);
}

// ---- Пауза когда вкладка неактивна (экономим CPU и батарею) ----
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

// ---- Canvas запускаем сразу — не зависит от данных Supabase ----
resizeCanvas(prefersReducedMotion);
initStars(prefersReducedMotion);

if (!prefersReducedMotion) {
    globalRafId = requestAnimationFrame(renderLoop);
}

// ============================================================
//  ПОРЯДОК ЗАГРУЗКИ ДАННЫХ (исправление гонки данных)
//
//  Шаг 1: Параллельно грузим всё независимое:
//          артисты, соцсети (создаются кнопки), услуги, статистика,
//          контакты (информация), соцсети в блоке контактов.
//
//  Шаг 2: .then() — строго ПОСЛЕ того как кнопки соцсетей
//          уже в DOM. renderSiteConfig находит их и вставляет ссылки.
//          Также передаём данные конфига в renderContacts.
//
//  Шаг 3: второй .then() — контент загружен. Пересчитываем
//          canvas (секции выросли) и запускаем reveal-анимации.
// ============================================================
Promise.allSettled([
    renderArtists(),
    renderSocials(),          // создаёт кнопки соцсетей — должна быть до renderSiteConfig
    renderServices(),
    renderStats(),
    renderContactSocials(),   // соцсети в блоке контактов
])
.then(() => {
    // Шаг 2: кнопки соцсетей в DOM — вставляем ссылки.
    // renderSiteConfig теперь возвращает объект с данными конфига.
    return renderSiteConfig();
})
.then((configData) => {
    // Шаг 2b: передаём данные конфига в renderContacts
    // (там могут быть адреса address_1, address_2, phone, email из Supabase)
    return renderContacts(configData);
})
.then(() => {
    // Шаг 3: весь контент загружен — перемеряем canvas и запускаем анимации
    resizeCanvas(prefersReducedMotion);
    initStars(prefersReducedMotion);
    initReveal(prefersReducedMotion);
});
