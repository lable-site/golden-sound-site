// ============================================================
//  artists.js — загрузка артистов и инициализация слайдера
//  🚫 НАСТРОЙКИ SWIPER НЕ ТРОГАТЬ — вылизаны до пикселя
// ============================================================

import { USE_MOCK, mockArtists, SUPABASE_URL, SUPABASE_KEY } from './config.js';

// ---- Сервис данных (с кэшированием в sessionStorage) ----
const ArtistService = {
    async getArtists() {
        if (USE_MOCK) return mockArtists;

        // КЭШ: та же логика что в content.js — сначала проверяем память,
        // потом идём в сеть. Подробное объяснение в content.js.
        const cacheKey = 'native_v1_artists';
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            // sessionStorage недоступен — продолжаем без кэша
        }

        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/artists?select=*&order=id`,
            { headers: { 'apikey': SUPABASE_KEY } }
        );
        if (!res.ok) throw new Error('Supabase: не удалось загрузить артистов');
        const data = await res.json();

        try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            // Кэш переполнен — не критично
        }

        return data;
    }
};

// ---- Создание слайда (защита от XSS) ----
function createArtistSlide(artist) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';

    const card = document.createElement('div');
    card.className = 'artist-card';

    const img = document.createElement('img');
    img.src = artist.img || artist.photo_url || '';
    img.alt = artist.name || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    // ⚠️  width/height НЕ СТАВИМ — сломает CSS aspect-ratio
    img.draggable = false;

    const info = document.createElement('div');
    info.className = 'artist-info';

    const title = document.createElement('h3');
    title.textContent = artist.name || '';

    info.appendChild(title);
    card.appendChild(img);
    card.appendChild(info);
    slide.appendChild(card);

    return slide;
}

// ---- Swiper instance ----
let swiperInstance = null;

function initSwiper(count) {
    // ЗАЩИТА ОТ УПАВШЕГО CDN:
    // Если скрипт swiper-bundle.min.js не загрузился (плохой интернет,
    // CDN лёг, корпоративный файрвол заблокировал) — переменная Swiper
    // будет undefined. Без этой проверки "new Swiper(...)" бросит ошибку
    // и весь сайт замёрзнет. С проверкой — просто нет слайдера, всё остальное живо.
    if (typeof Swiper === 'undefined') {
        console.warn('Swiper не загрузился (CDN недоступен). Слайдер артистов отключён.');
        return;
    }

    if (swiperInstance) {
        swiperInstance.destroy(true, true);
        swiperInstance = null;
    }

    if (count === 0) return;

    // 🚫 ВСЁ НИЖЕ — НАСТРОЙКИ SWIPER. НЕ ТРОГАТЬ. 🚫
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
                // Секретный фикс: удлиняем трассу, чтобы слайды могли дотянуться до левого края без отскока
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

    try {
        wrapper.innerHTML = '';
        const artists = await ArtistService.getArtists();

        if (!artists || artists.length === 0) {
            const section = document.getElementById('artists');
            if (section) section.style.display = 'none';
            return;
        }

        artists.forEach(artist => {
            wrapper.appendChild(createArtistSlide(artist));
        });

        initSwiper(artists.length);

    } catch (error) {
        console.error('Ошибка загрузки артистов:', error);
        const section = document.getElementById('artists');
        if (section) section.style.display = 'none';
    }
}

export function getSwiperInstance() {
    return swiperInstance;
}
