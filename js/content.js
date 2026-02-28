// ============================================================
//  content.js — Golden Sound v2.0
//
//  Переключается между MOCK_DB и Supabase через USE_SUPABASE.
//  Когда USE_SUPABASE = false — всё работает без бэкенда.
//  Когда USE_SUPABASE = true  — данные тянутся из базы.
// ============================================================

import { USE_SUPABASE, SUPABASE_URL, SUPABASE_KEY, MOCK_DB } from './config.js';

// ============================================================
//  УНИВЕРСАЛЬНЫЙ FETCH-ХЕЛПЕР
//  Если USE_SUPABASE=false → возвращает мок
//  Если USE_SUPABASE=true  → делает fetch в Supabase
// ============================================================
async function getData(table, orderBy) {
    if (!USE_SUPABASE) {
        return MOCK_DB[table] || [];
    }

    const order = orderBy ? `?select=*&order=${orderBy}.asc` : '?select=*';
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${order}`, {
            headers: {
                'apikey':        SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
        });
        if (!res.ok) throw new Error(`Supabase ${table}: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Ошибка загрузки ${table} из Supabase, используем мок:`, err);
        return MOCK_DB[table] || [];
    }
}

async function getConfig(key) {
    if (!USE_SUPABASE) {
        return MOCK_DB.site_config[key] || '';
    }
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/site_config?key=eq.${key}&select=value`,
            {
                headers: {
                    'apikey':        SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                }
            }
        );
        if (!res.ok) throw new Error(`Supabase site_config: ${res.status}`);
        const rows = await res.json();
        return rows[0]?.value || MOCK_DB.site_config[key] || '';
    } catch (err) {
        console.error('Ошибка site_config:', err);
        return MOCK_DB.site_config[key] || '';
    }
}

// ============================================================
//  1. УСЛУГИ — Liquid Glass карточки
// ============================================================
export async function renderServices() {
    const grid = document.querySelector('.services-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const services = await getData('services', 'sort_order');

    if (!services || services.length === 0) {
        // Fallback: 4 пустых слота
        for (let i = 0; i < 4; i++) {
            grid.appendChild(makePlaceholderServiceCard(i + 1));
        }
        return;
    }

    services.forEach(svc => {
        const card = document.createElement('div');
        card.className = 'service-card service-placeholder reveal';

        const safeIcon = (svc.icon || 'fa-solid fa-plus').replace(/[^a-zA-Z0-9\-\s]/g, '');

        card.innerHTML = `
            <div class="service-slot-inner">
                <div class="service-slot-icon">
                    <i class="${safeIcon}" aria-hidden="true"></i>
                </div>
                <p class="service-slot-label">${svc.title || `Услуга ${svc.id}`}</p>
                <p class="service-slot-hint">${svc.description || 'Сюда можно добавить всё что угодно'}</p>
            </div>
        `;

        grid.appendChild(card);
    });
}

function makePlaceholderServiceCard(n) {
    const card = document.createElement('div');
    card.className = 'service-card service-placeholder reveal';
    card.innerHTML = `
        <div class="service-slot-inner">
            <div class="service-slot-icon">
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
            </div>
            <p class="service-slot-label">Услуга ${n}</p>
            <p class="service-slot-hint">Сюда можно добавить всё что угодно</p>
        </div>
    `;
    return card;
}

// ============================================================
//  2. КОНТАКТЫ — адрес / телефон / email
// ============================================================
export async function renderContacts() {
    const list = document.getElementById('contacts-list');
    if (!list) return;

    list.innerHTML = '';

    const contacts = await getData('contacts');

    contacts.forEach(item => {
        const li = document.createElement('li');
        li.className = 'contacts-item';

        const safeIcon = (item.icon || 'fa-solid fa-circle').replace(/[^a-zA-Z0-9\-\s]/g, '');

        const iconDiv = document.createElement('div');
        iconDiv.className = 'contacts-item-icon';
        iconDiv.innerHTML = `<i class="fa-solid ${safeIcon}" aria-hidden="true"></i>`;

        const body = document.createElement('div');

        const label = document.createElement('p');
        label.className   = 'contacts-item-label';
        label.textContent = item.label;

        let valueEl;
        if (item.href) {
            valueEl      = document.createElement('a');
            valueEl.href = item.href;
            valueEl.className = 'contacts-item-value contacts-item-link';
        } else {
            valueEl = document.createElement('p');
            valueEl.className = 'contacts-item-value';
        }
        valueEl.textContent = item.value;

        body.appendChild(label);
        body.appendChild(valueEl);
        li.appendChild(iconDiv);
        li.appendChild(body);
        list.appendChild(li);
    });
}

// ============================================================
//  3. СОЦСЕТИ В КОНТАКТАХ
// ============================================================
export async function renderContactSocials() {
    const container = document.getElementById('contacts-social-list');
    if (!container) return;

    container.innerHTML = '';

    const socials = await getData('socials', 'sort_order');

    socials.forEach(soc => {
        const a = document.createElement('a');
        a.className = 'contacts-social-link';
        a.href      = soc.url;
        a.target    = '_blank';
        a.rel       = 'noopener noreferrer';

        const safeClass = (soc.icon || '').replace(/[^a-zA-Z0-9\-\s]/g, '');

        a.innerHTML = `
            <div class="contacts-social-icon"><i class="${safeClass}" aria-hidden="true"></i></div>
            <div class="contacts-social-info">
                <p class="contacts-social-name">${soc.name}</p>
                <p class="contacts-social-handle">@${soc.handle}</p>
            </div>
            <i class="fa-solid fa-arrow-right contacts-social-arrow" aria-hidden="true"></i>
        `;

        container.appendChild(a);
    });
}

// ============================================================
//  4. renderSocials — оставлен для совместимости с main.js,
//     но секция "ПОДПИСЫВАЙТЕСЬ" удалена из HTML.
//     Функция тихо завершается если контейнер не найден.
// ============================================================
export async function renderSocials() {
    const container = document.getElementById('social-links-container');
    if (!container) return; // Секция удалена — ок
}

// ============================================================
//  5. ТЕКСТЫ САЙТА — заголовок хедера, футер, кнопки
// ============================================================
export async function renderSiteConfig() {
    // Кнопка в хедере
    const demoBtn = document.querySelector('.btn-primary');
    if (demoBtn) {
        const text = USE_SUPABASE
            ? await getConfig('cta_text')
            : MOCK_DB.site_config.cta_text;
        const href = USE_SUPABASE
            ? await getConfig('cta_href')
            : MOCK_DB.site_config.cta_href;

        demoBtn.textContent = text || 'ОТПРАВИТЬ ДЕМО';
        demoBtn.href        = href || 'mailto:gsp.sound@mail.ru';
    }

    // Футер
    const copyright = document.getElementById('footer-copyright');
    if (copyright) {
        const text = USE_SUPABASE
            ? await getConfig('footer_copyright')
            : MOCK_DB.site_config.footer_copyright;
        copyright.textContent = text;
    }

    const tagline = document.getElementById('footer-tagline');
    if (tagline) {
        const text = USE_SUPABASE
            ? await getConfig('footer_tagline')
            : MOCK_DB.site_config.footer_tagline;
        tagline.textContent = text;
    }
}
