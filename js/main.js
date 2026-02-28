// ============================================================
//  main.js — Golden Sound v4.0
//  Точка входа. RAF-цикл, UX-логика, координация модулей.
//
//  Новое в v4.0:
//  • setHeroMouse / clearHeroMouse → HeroParticleSystem
//  • Параллакс мыши для секции Артистов
//  • Подсветка активного пункта nav
//  • Header.scrolled
// ============================================================

import { renderArtists, getSwiperInstance } from './artists.js';
import {
    resizeCanvas,
    animateParticles,
    initStars,
    animateStars,
    setCanvasMousePosition,
    setHeroMouse,
    clearHeroMouse,
} from './canvas.js';
import { initReveal } from './animations.js';
import {
    renderServices,
    renderSocials,
    renderContacts,
    renderContactSocials,
    renderSiteConfig,
} from './content.js';

// ── Константы ─────────────────────────────────────────────
const prefersReducedMotion = false;

// ── Состояние RAF ─────────────────────────────────────────
let lenis       = null;
let globalRafId = null;
let lastTime    = performance.now();

// ══════════════════════════════════════════════════════════
//  LENIS — плавный скролл
// ══════════════════════════════════════════════════════════
if (!prefersReducedMotion) {
    try {
        lenis = new Lenis({
            duration:        1.2,
            easing:          (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel:     true,
            touchMultiplier: 2,
        });
    } catch (e) {
        console.warn('Lenis недоступен, нативный скролл.');
        lenis = null;
    }
}

// ══════════════════════════════════════════════════════════
//  RENDER LOOP — единый RAF
// ══════════════════════════════════════════════════════════
function renderLoop(time) {
    let dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 16.6; // cap после tab-switch

    if (!prefersReducedMotion) {
        if (lenis) lenis.raf(time);
        animateParticles(dt);
        animateStars(dt);
    }

    globalRafId = requestAnimationFrame(renderLoop);
}

// ══════════════════════════════════════════════════════════
//  VISIBILITY — пауза при неактивной вкладке
// ══════════════════════════════════════════════════════════
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(globalRafId);
    } else if (!prefersReducedMotion) {
        lastTime    = performance.now();
        globalRafId = requestAnimationFrame(renderLoop);
    }
});

// ══════════════════════════════════════════════════════════
//  RESIZE — debounced 250ms
// ══════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════
//  HEADER — класс .scrolled после первых 24px
// ══════════════════════════════════════════════════════════
const headerEl = document.querySelector('.header');
if (headerEl) {
    const onScroll = () => {
        headerEl.classList.toggle('scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // применяем сразу при загрузке
}

// ══════════════════════════════════════════════════════════
//  ACTIVE NAV — подсвечиваем секцию в центре viewport
// ══════════════════════════════════════════════════════════
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
        threshold:   0,
        rootMargin: '-40% 0px -40% 0px',
    });
    sections.forEach(s => navObserver.observe(s));
}

// ══════════════════════════════════════════════════════════
//  HERO MOUSE — интерактивные частицы
//  pointer-events: none на canvas → слушаем секцию
// ══════════════════════════════════════════════════════════
const heroSec = document.querySelector('.hero');
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (heroSec && !isTouch) {
    heroSec.addEventListener('mousemove', (e) => {
        const rect = heroSec.getBoundingClientRect();
        setHeroMouse(e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: true });

    heroSec.addEventListener('mouseleave', () => {
        clearHeroMouse();
    }, { passive: true });
}

// ══════════════════════════════════════════════════════════
//  ARTISTS PARALLAX — передаём мышь в StarlightCometSystem
// ══════════════════════════════════════════════════════════
const artistsSec = document.getElementById('artists');

if (artistsSec && !isTouch) {
    artistsSec.addEventListener('mousemove', (e) => {
        const rect = artistsSec.getBoundingClientRect();
        setCanvasMousePosition(e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: true });

    artistsSec.addEventListener('mouseleave', () => {
        setCanvasMousePosition(-1, -1);
    }, { passive: true });
}

// ══════════════════════════════════════════════════════════
//  ЗАПУСК Canvas сразу (до рендера динамического контента)
// ══════════════════════════════════════════════════════════
resizeCanvas(prefersReducedMotion);
initStars(prefersReducedMotion);

if (!prefersReducedMotion) {
    globalRafId = requestAnimationFrame(renderLoop);
}

// ══════════════════════════════════════════════════════════
//  ПОРЯДОК ЗАГРУЗКИ КОНТЕНТА:
//  1. Параллельный рендер всего контента
//  2. Тексты из конфига/БД
//  3. Пересчёт canvas (секции заполнены) + reveal-анимации
// ══════════════════════════════════════════════════════════
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
