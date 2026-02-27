// ============================================================
//  artists.js — Golden Sound
//  Источник данных: GS_ARTISTS из config.js (без Supabase)
//
//  🚫 НАСТРОЙКИ SWIPER НЕ ТРОГАТЬ — механика NATIVE, вылизана
// ============================================================

import { GS_ARTISTS } from './config.js';

// ---- Создание слайда ----
function createArtistSlide(artist) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';

    const card = document.createElement('div');
    card.className = 'artist-card';

    const img = document.createElement('img');
    img.src = artist.img || '';
    img.alt = artist.name || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;

    // Золотое свечение по краям активной карточки
    const glowRing = document.createElement('div');
    glowRing.className = 'artist-card-glow';

    const overlay = document.createElement('div');
    overlay.className = 'artist-overlay';

    const info = document.createElement('div');
    info.className = 'artist-info';

    // Золотая черта над именем
    const nameLine = document.createElement('div');
    nameLine.className = 'artist-name-line';

    const title = document.createElement('h3');
    title.textContent = artist.name || '';

    info.appendChild(nameLine);
    info.appendChild(title);

    card.appendChild(img);
    card.appendChild(glowRing);
    card.appendChild(overlay);
    card.appendChild(info);
    slide.appendChild(card);

    return slide;
}

// ---- Swiper instance ----
let swiperInstance = null;

function initSwiper(count) {
    // Защита: если CDN с Swiper не загрузился
    if (typeof Swiper === 'undefined') {
        console.warn('Swiper не загрузился (CDN недоступен).');
        return;
    }

    if (swiperInstance) {
        swiperInstance.destroy(true, true);
        swiperInstance = null;
    }

    if (count === 0) return;

    // 🚫 НАСТРОЙКИ SWIPER — НЕ ТРОГАТЬ 🚫
    swiperInstance = new Swiper('.artistSwiper', {
        effect: 'coverflow',
        loop: false,
        rewind: true,
        grabCursor: true,
        allowTouchMove: true,
        simulateTouch: true,
        watchSlidesProgress: true,
        watchOverflow: false,
        initialSlide: 0,
        speed: 800,
        touchRatio: 1.5,
        resistanceRatio: 0.85,
        threshold: 5,

        coverflowEffect: {
            rotate: 0,
            depth: 200,
            modifier: 1,
            slideShadows: false,
            stretch: 30
        },

        keyboard: {
            enabled: true,
            onlyInViewport: true,
        },

        breakpoints: {
            0: {
                slidesPerView: count === 1 ? 1 : 1.2,
                centeredSlides: true,
                coverflowEffect: { stretch: 30, depth: 200 }
            },
            768: {
                slidesPerView: count === 1 ? 1 : (count === 2 ? 1.5 : 2),
                centeredSlides: true,
                coverflowEffect: { stretch: 20, depth: 80 }
            },
            1024: {
                slidesPerView: count === 1 ? 1 : 2.6,
                centeredSlides: false,
                spaceBetween: 30,
                slidesOffsetAfter: count > 1 ? 800 : 0,
                coverflowEffect: { stretch: 0, depth: 0 }
            }
        }
    });
    // 🚫 КОНЕЦ ЗАЩИЩЁННОЙ ЗОНЫ 🚫
}

export async function renderArtists() {
    const wrapper = document.getElementById('artists-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '';

    if (!GS_ARTISTS || GS_ARTISTS.length === 0) {
        const section = document.getElementById('artists');
        if (section) section.style.display = 'none';
        return;
    }

    GS_ARTISTS.forEach(artist => {
        wrapper.appendChild(createArtistSlide(artist));
    });

    initSwiper(GS_ARTISTS.length);
}

export function getSwiperInstance() {
    return swiperInstance;
}
