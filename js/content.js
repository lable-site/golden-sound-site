// ============================================================
//  content.js — загрузка данных из Supabase
//  Golden Sound edition: добавлены renderContacts + renderContactSocials
// ============================================================

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// ============================================================
//  КЭШ-ПРОСЛОЙКА — sessionStorage
//
//  Как это работает (простыми словами):
//  Браузер запоминает данные пока вкладка открыта.
//  Закрыл вкладку — всё сброшено, при следующем визите
//  данные снова подтянутся из Supabase.
//  Зачем: экономим запросы к базе. На бесплатном плане
//  Supabase лимит ~500k/месяц — при кэше хватает на долго.
// ============================================================

async function supabaseFetch(path) {
    const cacheKey = 'gs_v1_' + path; // gs_v1_ = Golden Sound namespace

    // Шаг 1: Проверяем кэш
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch (e) {
        // sessionStorage может быть недоступен в режиме инкогнито — не страшно
    }

    // Шаг 2: Кэша нет — идём в Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: { 'apikey': SUPABASE_KEY }
    });
    if (!res.ok) throw new Error(`Supabase ошибка ${res.status} на /${path}`);
    const data = await res.json();

    // Шаг 3: Сохраняем в кэш
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
        // Кэш переполнен — не критично, данные уже в памяти
    }

    return data;
}

// ============================================================
//  1. Услуги
// ============================================================
export async function renderServices() {
    const wrapper = document.querySelector('.services-grid');
    if (!wrapper) return;

    try {
        const services = await supabaseFetch('services?select=*&order=id');

        if (!services || services.length === 0) {
            const section = document.getElementById('services');
            if (section) section.style.display = 'none';
            return;
        }

        wrapper.innerHTML = '';

        services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card reveal';

            const icon = document.createElement('i');
            const safeIconClass = (service.icon || 'fa-solid fa-star').replace(/[^a-zA-Z0-9\-\s]/g, '');
            icon.className = safeIconClass + ' service-icon';
            icon.setAttribute('aria-hidden', 'true');

            const title = document.createElement('h3');
            title.textContent = service.title || '';

            const ul = document.createElement('ul');
            if (service.description) {
                service.description
                    .split('\n')
                    .map(t => t.trim())
                    .filter(t => t !== '')
                    .forEach(t => {
                        const li = document.createElement('li');
                        li.textContent = t;
                        ul.appendChild(li);
                    });
            }

            card.appendChild(icon);
            card.appendChild(title);
            card.appendChild(ul);
            wrapper.appendChild(card);
        });

    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
    }
}

// ============================================================
//  2. Статистика
// ============================================================
export async function renderStats() {
    const grid = document.querySelector('.stats-grid');
    if (!grid) return;

    try {
        const stats = await supabaseFetch('stats?select=*&order=order_id');

        if (!stats || stats.length === 0) return;

        grid.innerHTML = '';

        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card reveal';

            const number = document.createElement('div');
            number.className = 'stat-number';
            number.dataset.target = stat.value || 0;
            number.dataset.suffix = stat.suffix || '';
            number.textContent = '0';

            const label = document.createElement('div');
            label.className = 'stat-label';
            label.textContent = stat.label || '';

            card.appendChild(number);
            card.appendChild(label);
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// ============================================================
//  3. Соцсети — большие кнопки секции "Присоединяйся"
//  Fallback: Golden Sound соцсети (на случай если Supabase упал)
// ============================================================
const fallbackSocials = [
    { name: 'YouTube',    url: 'https://www.youtube.com/channel/UCy8MBNS-yBok_3nbCHJ0H3w', icon_class: 'fa-brands fa-youtube' },
    { name: 'ВКонтакте',  url: 'https://vk.com/goldensound_official',                       icon_class: 'fa-brands fa-vk' },
    { name: 'Instagram',  url: 'https://www.instagram.com/goldensound.18',                   icon_class: 'fa-brands fa-instagram' },
];

export async function renderSocials() {
    const container = document.getElementById('social-links-container');
    if (!container) return;

    let socials = fallbackSocials;

    try {
        const data = await supabaseFetch('social_links?select=*&order=order_id');
        if (data && data.length > 0) socials = data;
    } catch (error) {
        // Таблица social_links не создана или ошибка сети — используем fallback
        console.warn('social_links недоступен, используем fallback:', error.message);
    }

    container.innerHTML = '';

    socials.forEach(social => {
        const a = document.createElement('a');
        a.setAttribute('aria-label', social.name || '');
        a.href = social.url || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'social-btn';

        const icon = document.createElement('i');
        const safeClass = (social.icon_class || 'fa-solid fa-link').replace(/[^a-zA-Z0-9\-\s]/g, '');
        icon.className = safeClass;
        icon.setAttribute('aria-hidden', 'true');

        const text = document.createTextNode(' ' + (social.name || ''));

        a.appendChild(icon);
        a.appendChild(text);
        container.appendChild(a);
    });
}

// ============================================================
//  4. Контакты — секция "Ждём вас"
//  Пытается читать из site_config (ключи address_1, address_2, phone, email).
//  Если Supabase не дал эти ключи — показываем Golden Sound контакты.
// ============================================================
const fallbackContacts = [
    { icon: 'fa-location-dot', label: 'Адрес',    value: 'Москва, 109012, Театральный проезд, 3с3' },
    { icon: 'fa-location-dot', label: 'Офис',     value: 'Москва, 109052, Смирновская 25, стр.16, 3 этаж, офис 317' },
    { icon: 'fa-phone',        label: 'Телефон',  value: '+7 999 904-88-86', href: 'tel:+79999048886' },
    { icon: 'fa-envelope',     label: 'Email',    value: 'gsp.sound@mail.ru', href: 'mailto:gsp.sound@mail.ru' },
];

export async function renderContacts(configData) {
    const list = document.getElementById('contacts-list');
    if (!list) return;

    // Если нам передали данные из site_config — используем их,
    // иначе берём fallback Golden Sound
    let contacts = fallbackContacts;

    if (configData) {
        const s = configData;
        const fromSupabase = [];
        if (s.address_1) fromSupabase.push({ icon: 'fa-location-dot', label: 'Адрес', value: s.address_1 });
        if (s.address_2) fromSupabase.push({ icon: 'fa-location-dot', label: 'Офис',  value: s.address_2 });
        if (s.phone)     fromSupabase.push({ icon: 'fa-phone',        label: 'Телефон', value: s.phone, href: `tel:${s.phone.replace(/\s/g,'')}` });
        if (s.email)     fromSupabase.push({ icon: 'fa-envelope',     label: 'Email',   value: s.email, href: `mailto:${s.email}` });
        if (fromSupabase.length > 0) contacts = fromSupabase;
    }

    list.innerHTML = '';

    contacts.forEach(item => {
        const li = document.createElement('li');
        li.className = 'contacts-item';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'contacts-item-icon';
        iconDiv.innerHTML = `<i class="fa-solid ${item.icon}" aria-hidden="true"></i>`;

        const textDiv = document.createElement('div');

        const label = document.createElement('p');
        label.className = 'contacts-item-label';
        label.textContent = item.label;

        let valueEl;
        if (item.href) {
            valueEl = document.createElement('a');
            valueEl.href = item.href;
            valueEl.className = 'contacts-item-value';
        } else {
            valueEl = document.createElement('p');
            valueEl.className = 'contacts-item-value';
        }
        valueEl.textContent = item.value;

        textDiv.appendChild(label);
        textDiv.appendChild(valueEl);

        li.appendChild(iconDiv);
        li.appendChild(textDiv);
        list.appendChild(li);
    });
}

// ============================================================
//  5. Соцсети в блоке КОНТАКТОВ (список с иконками и стрелкой)
//  Отличается от renderSocials — другой стиль отображения
// ============================================================
const fallbackContactSocials = [
    { name: 'YouTube',   handle: 'Golden Sound',           icon: 'fa-brands fa-youtube',   url: 'https://www.youtube.com/channel/UCy8MBNS-yBok_3nbCHJ0H3w' },
    { name: 'VKontakte', handle: 'goldensound_official',   icon: 'fa-brands fa-vk',        url: 'https://vk.com/goldensound_official' },
    { name: 'Instagram', handle: 'goldensound.18',         icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/goldensound.18' },
];

export async function renderContactSocials() {
    const container = document.getElementById('contacts-social-list');
    if (!container) return;

    // Пока используем fallback данные.
    // В будущем можно читать из той же таблицы social_links.
    const socials = fallbackContactSocials;

    container.innerHTML = '';

    socials.forEach(soc => {
        const a = document.createElement('a');
        a.className = 'contacts-social-link';
        a.href = soc.url || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'contacts-social-icon';
        const safeClass = (soc.icon || 'fa-solid fa-link').replace(/[^a-zA-Z0-9\-\s]/g, '');
        iconDiv.innerHTML = `<i class="${safeClass}" aria-hidden="true"></i>`;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'contacts-social-info';
        infoDiv.innerHTML = `
            <p class="contacts-social-name">${soc.name || ''}</p>
            <p class="contacts-social-handle">@${soc.handle || ''}</p>
        `;

        const arrow = document.createElement('i');
        arrow.className = 'fa-solid fa-arrow-right contacts-social-arrow';
        arrow.setAttribute('aria-hidden', 'true');

        a.appendChild(iconDiv);
        a.appendChild(infoDiv);
        a.appendChild(arrow);
        container.appendChild(a);
    });
}

// ============================================================
//  6. Настройки сайта — site_config
//
//  ВАЖНО: эта функция вызывается В .then() после renderSocials.
//  Это гарантирует что кнопки соцсетей уже в DOM когда мы
//  ищем их через .querySelector (исправление гонки данных).
// ============================================================
export async function renderSiteConfig() {
    try {
        const config = await supabaseFetch('site_config?select=*');

        const s = {};
        config.forEach(item => { if (item.key) s[item.key] = item.value; });

        // --- Hero: вступительный текст (под цитатой) ---
        const heroIntro = document.querySelector('.hero-intro');
        if (heroIntro && s.hero_text) {
            heroIntro.innerHTML = '';
            s.hero_text.split('\n').forEach((line, i, arr) => {
                heroIntro.appendChild(document.createTextNode(line));
                if (i < arr.length - 1) heroIntro.appendChild(document.createElement('br'));
            });
        }

        // --- Заголовок секции соцсетей ("Присоединяйся" и т.п.) ---
        const joinTitle = document.querySelector('.socials-title');
        if (joinTitle && s.join_text) joinTitle.textContent = s.join_text;

        // --- Кнопка "Отправить демо" ---
        const demoBtn = document.querySelector('.btn-primary');
        if (demoBtn) {
            if (s.demo_link) demoBtn.href = s.demo_link;
            if (s.demo_text) demoBtn.textContent = s.demo_text;
        }

        // --- Ссылки соцсетей в секции "Присоединяйся" ---
        if (s.vk_link) {
            const vk = document.querySelector('.social-btn[aria-label="ВКонтакте"]');
            if (vk) vk.href = s.vk_link;
        }
        if (s.tg_link) {
            const tg = document.querySelector('.social-btn[aria-label="Telegram"]');
            if (tg) tg.href = s.tg_link;
        }
        if (s.yt_link) {
            const yt = document.querySelector('.social-btn[aria-label="YouTube"]');
            if (yt) yt.href = s.yt_link;
        }

        // --- Заголовки секций (редактируются из Supabase) ---
        const titleArtists = document.getElementById('title-artists');
        if (titleArtists && s.artists_title) titleArtists.textContent = s.artists_title;

        const titleServices = document.getElementById('title-services');
        if (titleServices && s.services_title) titleServices.textContent = s.services_title;

        // --- Футер ---
        const footerCopyright = document.getElementById('footer-copyright');
        if (footerCopyright && s.footer_copyright) footerCopyright.textContent = s.footer_copyright;

        const footerTagline = document.getElementById('footer-tagline');
        if (footerTagline && s.footer_tagline) footerTagline.textContent = s.footer_tagline;

        // Возвращаем объект s — чтобы renderContacts мог взять адреса из конфига
        return s;

    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        // Возвращаем null — renderContacts будет использовать fallback
        return null;
    }
}
