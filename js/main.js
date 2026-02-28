// ============================================================
//  main.js — Golden Sound v5.0 LUXURY 2026
//
//  Supabase-ready luxury template 2026
//
//  Новое в v5.0:
//  • Cursor glow — tracks pointer via CSS custom properties
//  • Active nav — IntersectionObserver on sections
//  • Header.scrolled after 24px
//  • Hero + Artists mouse parallax
//  • Visibility pause / resume
//  • Resize debounced 250ms
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

// ── Motion preference ──────────────────────────────────────
const pRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Touch detection ────────────────────────────────────────
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// ── Lenis smooth scroll ────────────────────────────────────
let lenis = null;
if (!pRM) {
    try {
        lenis = new Lenis({
            duration:        1.2,
            easing:          (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel:     true,
            touchMultiplier: 2,
        });
    } catch (e) {
        console.warn('Lenis unavailable, native scroll active.');
        lenis = null;
    }
}

// ── RAF loop ───────────────────────────────────────────────
let globalRafId = null;
let lastTime    = performance.now();

function renderLoop(time) {
    let dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 16.6; // cap after tab-switch

    if (!pRM) {
        if (lenis) lenis.raf(time);
        animateParticles(dt);
        animateStars(dt);
    }

    globalRafId = requestAnimationFrame(renderLoop);
}

// Pause on hidden tab
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(globalRafId);
    } else if (!pRM) {
        lastTime    = performance.now();
        globalRafId = requestAnimationFrame(renderLoop);
    }
});

// ── Resize (debounced) ─────────────────────────────────────
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas(pRM);
        initStars(pRM);
        getSwiperInstance()?.update();
    }, 250);
}, { passive: true });

// ── Header scroll state ────────────────────────────────────
const headerEl = document.querySelector('.header');
if (headerEl) {
    const onScroll = () => {
        headerEl.classList.toggle('scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// ── Active nav highlight ────────────────────────────────────
const navLinks = document.querySelectorAll('.header-nav a[href^="#"]');
const sections  = document.querySelectorAll('section[id]');

if (navLinks.length && sections.length) {
    const navIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navLinks.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
            });
        });
    }, { threshold: 0, rootMargin: '-40% 0px -40% 0px' });

    sections.forEach(s => navIO.observe(s));
}

// ── Cursor Glow ────────────────────────────────────────────
if (!isTouch) {
    const glowEl = document.getElementById('cursor-glow');
    if (glowEl) {
        let gx = -999, gy = -999;
        let cgx = -999, cgy = -999;
        const LF = 0.14; // lerp factor — smooth lag

        function animateCursor() {
            cgx += (gx - cgx) * LF;
            cgy += (gy - cgy) * LF;
            glowEl.style.left = cgx + 'px';
            glowEl.style.top  = cgy + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        window.addEventListener('mousemove', (e) => {
            gx = e.clientX;
            gy = e.clientY;
        }, { passive: true });

        // Grow on interactive elements
        const growTargets = 'a, button, .artist-card, .service-card, .contacts-social-link, .btn-primary';
        document.querySelectorAll(growTargets).forEach(el => {
            el.addEventListener('mouseenter', () => {
                glowEl.style.width  = '480px';
                glowEl.style.height = '480px';
                glowEl.style.background = `radial-gradient(circle,
                    rgba(201,168,76,0.16) 0%,
                    rgba(201,168,76,0.06) 40%,
                    transparent 70%
                )`;
            });
            el.addEventListener('mouseleave', () => {
                glowEl.style.width  = '320px';
                glowEl.style.height = '320px';
                glowEl.style.background = `radial-gradient(circle,
                    rgba(201,168,76,0.10) 0%,
                    rgba(201,168,76,0.04) 40%,
                    transparent 70%
                )`;
            });
        });
    }
}

// ── Hero mouse → canvas particles ─────────────────────────
const heroSec = document.querySelector('.hero');
if (heroSec && !isTouch) {
    heroSec.addEventListener('mousemove', (e) => {
        const rect = heroSec.getBoundingClientRect();
        setHeroMouse(e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: true });
    heroSec.addEventListener('mouseleave', clearHeroMouse, { passive: true });
}

// ── Artists parallax ───────────────────────────────────────
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

// ── Boot canvas immediately ────────────────────────────────
resizeCanvas(pRM);
initStars(pRM);

if (!pRM) {
    globalRafId = requestAnimationFrame(renderLoop);
}

// ── Content → config → reveal ─────────────────────────────
Promise.allSettled([
    renderArtists(),
    renderSocials(),
    renderServices(),
    renderContacts(),
    renderContactSocials(),
])
    .then(() => renderSiteConfig())
    .then(() => {
        resizeCanvas(pRM);
        initStars(pRM);
        initReveal(pRM);
    });
