// ============================================================
//  artists.js — Golden Sound v2.0
//
//  🚫 НАСТРОЙКИ SWIPER НЕ ТРОГАТЬ — механика NATIVE, вылизана
//
//  ИЗМЕНЕНИЯ:
//  • Поддержка placeholder-карточек (artist.name === null)
//  • border-radius 28px (визуал через CSS, не JS)
//  • Использует MOCK_DB / Supabase через config.js
// ============================================================

import { USE_SUPABASE, SUPABASE_URL, SUPABASE_KEY, GS_ARTISTS } from './config.js';

// ---- Получение данных артистов ----
async function fetchArtists() {
    if (!USE_SUPABASE) {
        return GS_ARTISTS;
    }

    // ---- SUPABASE путь ----
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/artists?select=*&order=sort_order.asc`,
            {
                headers: {
                    'apikey':        SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                }
            }
        );
        if (!res.ok) throw new Error(`Supabase artists: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Ошибка загрузки артистов из Supabase, используем мок:', err);
        return GS_ARTISTS;
    }
}

// ---- Создание обычного слайда ----
function createArtistSlide(artist) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';

    const card = document.createElement('div');
    card.className = 'artist-card';

    const img = document.createElement('img');
    img.src       = artist.img || '';
    img.alt       = artist.name || '';
    img.loading   = 'lazy';
    img.decoding  = 'async';
    img.draggable = false;

    const glowRing = document.createElement('div');
    glowRing.className = 'artist-card-glow';

    const overlay = document.createElement('div');
    overlay.className = 'artist-overlay';

    const info = document.createElement('div');
    info.className = 'artist-info';

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

// ---- Создание слайда-заглушки (artist.name === null) ----
function createPlaceholderSlide() {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';

    const card = document.createElement('div');
    card.className = 'artist-card';

    // Золотое кольцо-свечение
    const glowRing = document.createElement('div');
    glowRing.className = 'artist-card-glow';

    // Контент заглушки
    const placeholder = document.createElement('div');
    placeholder.className = 'artist-card-placeholder';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'artist-placeholder-icon';
    iconWrap.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';

    const label = document.createElement('p');
    label.className   = 'artist-placeholder-label';
    label.textContent = 'ARTIST NAME';

    placeholder.appendChild(iconWrap);
    placeholder.appendChild(label);

    card.appendChild(glowRing);
    card.appendChild(placeholder);
    slide.appendChild(card);

    return slide;
}

// ---- Swiper instance ----
let swiperInstance = null;

function initSwiper(count) {
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

    const artists = await fetchArtists();

    if (!artists || artists.length === 0) {
        const section = document.getElementById('artists');
        if (section) section.style.display = 'none';
        return;
    }

    artists.forEach(artist => {
        if (!artist.name && !artist.img) {
            wrapper.appendChild(createPlaceholderSlide());
        } else {
            wrapper.appendChild(createArtistSlide(artist));
        }
    });

    initSwiper(artists.length);
}

export function getSwiperInstance() {
    return swiperInstance;
}
