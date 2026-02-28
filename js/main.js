// ============================================================
//  main.js — Golden Sound v3.0
//  Точка входа. Запускает рендеринг, анимации, UX-логику.
//  Данные: MOCK_DB (config.js) или Supabase — USE_SUPABASE.
//
//  Новое по сравнению с v2.0:
//  • Подсветка активного пункта навигации при скролле
//  • Header.scrolled — чуть темнее после первых 20px
//  • Передача координат мыши в StarlightSystem (параллакс)
// ============================================================

import { renderArtists, getSwiperInstance } from './artists.js';
import {
    resizeCanvas,
    animateParticles,
    initStars,
    animateStars,
    setCanvasMousePosition,
} from './canvas.js';
import { initReveal } from './animations.js';
import {
    renderServices,
    renderSocials,
    renderContacts,
    renderContactSocials,
    renderSiteConfig,
} from './content.js';

// ─── Константы ───────────────────────────────────────────────
const prefersReducedMotion = false; // принудительно включаем анимации

// ─── Состояние ───────────────────────────────────────────────
let lenis       = null;
let globalRafId = null;
let lastTime    = performance.now();

// ═══════════════════════════════════════════════════════════
//  LENIS — плавный скролл
// ═══════════════════════════════════════════════════════════
if (!prefersReducedMotion) {
    try {
        lenis = new Lenis({
            duration:        1.2,
            easing:          (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel:     true,
            touchMultiplier: 2,
        });
    } catch (e) {
        console.warn('Lenis недоступен, используем нативный скролл.');
        lenis = null;
    }
}

// ═══════════════════════════════════════════════════════════
//  RENDER LOOP — единый RAF: canvas + lenis
// ═══════════════════════════════════════════════════════════
function renderLoop(time) {
    let dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 16.6; // cap после tab-switch / долгого фрейма

    if (!prefersReducedMotion) {
        if (lenis) lenis.raf(time);
        animateParticles(dt);
        animateStars(dt);
    }

    globalRafId = requestAnimationFrame(renderLoop);
}

// ═══════════════════════════════════════════════════════════
//  VISIBILITY — пауза при неактивной вкладке
// ═══════════════════════════════════════════════════════════
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(globalRafId);
    } else if (!prefersReducedMotion) {
        lastTime    = performance.now();
        globalRafId = requestAnimationFrame(renderLoop);
    }
});

// ═══════════════════════════════════════════════════════════
//  RESIZE — debounced
// ═══════════════════════════════════════════════════════════
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas(prefersReducedMotion);
        initStars(prefersReducedMotion);
        const swiper = getSwiperInstance();
        if (swiper) swiper.update();
    }, 250);
}, { passive: true });

// ═══════════════════════════════════════════════════════════
//  HEADER — становится плотнее после скролла
// ═══════════════════════════════════════════════════════════
const headerEl = document.querySelector('.header');
if (headerEl) {
    window.addEventListener('scroll', () => {
        headerEl.classList.toggle('scrolled', window.scrollY > 24);
    }, { passive: true });
}

// ═══════════════════════════════════════════════════════════
//  ACTIVE NAV — подсвечиваем текущую секцию
// ═══════════════════════════════════════════════════════════
const navLinks = document.querySelectorAll('.header-nav a[href^="#"]');
const sections  = document.querySelectorAll('section[id]');

if (navLinks.length && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navLinks.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
            });
        });
    }, {
        threshold:    0,
        rootMargin:   '-40% 0px -40% 0px', // срабатывает когда секция в центре экрана
    });
    sections.forEach(s => navObserver.observe(s));
}

// ═══════════════════════════════════════════════════════════
//  ПАРАЛЛАКС МЫШИ — секция Артистов
//  Только на не-тач устройствах (десктоп)
// ═══════════════════════════════════════════════════════════
const artistsSec = document.getElementById('artists');
const isTouch    = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (artistsSec && !isTouch) {
    artistsSec.addEventListener('mousemove', (e) => {
        const rect = artistsSec.getBoundingClientRect();
        setCanvasMousePosition(e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: true });

    artistsSec.addEventListener('mouseleave', () => {
        setCanvasMousePosition(-1, -1); // вернуть в центр
    }, { passive: true });
}

// ═══════════════════════════════════════════════════════════
//  ЗАПУСК Canvas сразу (до рендера контента)
// ═══════════════════════════════════════════════════════════
resizeCanvas(prefersReducedMotion);
initStars(prefersReducedMotion);

if (!prefersReducedMotion) {
    globalRafId = requestAnimationFrame(renderLoop);
}

// ═══════════════════════════════════════════════════════════
//  ПОСЛЕДОВАТЕЛЬНОСТЬ ЗАГРУЗКИ:
//  1. Параллельный рендер всего контента
//  2. Статичные тексты (заголовки, футер)
//  3. Пересчёт canvas (секции теперь заполнены) + reveal
// ═══════════════════════════════════════════════════════════
Promise.allSettled([
    renderArtists(),
    renderSocials(),
    renderServices(),
    renderContacts(),
    renderContactSocials(),
])
    .then(() => renderSiteConfig())
    .then(() => {
        resizeCanvas(prefersReducedMotion);
        initStars(prefersReducedMotion);
        initReveal(prefersReducedMotion);
    });
