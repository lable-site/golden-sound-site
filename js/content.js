// ============================================================
//  content.js — Golden Sound v5.0 LUXURY 2026
//
//  Supabase-ready luxury template 2026
//
//  Переключается через USE_SUPABASE в config.js:
//  false → MOCK_DB (без бэкенда, сейчас)
//  true  → реальный Supabase fetch
// ============================================================

import { USE_SUPABASE, SUPABASE_URL, SUPABASE_KEY, MOCK_DB } from './config.js';

// ── Universal fetcher ──────────────────────────────────────
async function getData(table, orderBy) {
    if (!USE_SUPABASE) return MOCK_DB[table] || [];

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
        console.error(`Supabase ${table} error, falling back to mock:`, err);
        return MOCK_DB[table] || [];
    }
}

async function getConfig(key) {
    if (!USE_SUPABASE) return MOCK_DB.site_config[key] || '';
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
        console.error('Supabase site_config error:', err);
        return MOCK_DB.site_config[key] || '';
    }
}

// ── 1. Services ────────────────────────────────────────────
export async function renderServices() {
    const grid = document.querySelector('.services-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const services = await getData('services', 'sort_order');

    if (!services || services.length === 0) {
        for (let i = 0; i < 4; i++) grid.appendChild(makePlaceholderCard(i + 1));
        return;
    }

    services.forEach(svc => {
        const card = document.createElement('div');
        card.className = 'service-card reveal';
        card.setAttribute('role', 'listitem');

        const safeIcon = (svc.icon || 'fa-solid fa-plus').replace(/[^a-zA-Z0-9\-\s]/g, '');

        card.innerHTML = `
            <div class="service-slot-inner">
                <div class="service-slot-icon" aria-hidden="true">
                    <i class="${safeIcon}"></i>
                </div>
                <p class="service-slot-label">${svc.title || `Услуга ${svc.id}`}</p>
                <p class="service-slot-hint">${svc.description || 'Сюда можно добавить всё что угодно'}</p>
            </div>
        `;

        grid.appendChild(card);
    });
}

function makePlaceholderCard(n) {
    const card = document.createElement('div');
    card.className = 'service-card reveal';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
        <div class="service-slot-inner">
            <div class="service-slot-icon" aria-hidden="true">
                <i class="fa-solid fa-plus"></i>
            </div>
            <p class="service-slot-label">Услуга ${n}</p>
            <p class="service-slot-hint">Сюда можно добавить всё что угодно</p>
        </div>
    `;
    return card;
}

// ── 2. Contacts ────────────────────────────────────────────
export async function renderContacts() {
    const list = document.getElementById('contacts-list');
    if (!list) return;
    list.innerHTML = '';

    const contacts = await getData('contacts');

    contacts.forEach(item => {
        const li = document.createElement('li');
        li.className = 'contacts-item';
        li.setAttribute('role', 'listitem');

        const safeIcon = (item.icon || 'fa-circle').replace(/[^a-zA-Z0-9\-\s]/g, '');

        const iconDiv = document.createElement('div');
        iconDiv.className = 'contacts-item-icon';
        iconDiv.setAttribute('aria-hidden', 'true');
        iconDiv.innerHTML = `<i class="fa-solid ${safeIcon}"></i>`;

        const body = document.createElement('div');

        const lbl = document.createElement('p');
        lbl.className   = 'contacts-item-label';
        lbl.textContent = item.label;

        let val;
        if (item.href) {
            val      = document.createElement('a');
            val.href = item.href;
            val.className = 'contacts-item-value contacts-item-link';
            val.setAttribute('aria-label', `${item.label}: ${item.value}`);
        } else {
            val = document.createElement('p');
            val.className = 'contacts-item-value';
        }
        val.textContent = item.value;

        body.appendChild(lbl);
        body.appendChild(val);
        li.appendChild(iconDiv);
        li.appendChild(body);
        list.appendChild(li);
    });
}

// ── 3. Contact socials ─────────────────────────────────────
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
        a.setAttribute('aria-label', `${soc.name} — ${soc.handle}`);
        a.setAttribute('role', 'listitem');

        const safeClass = (soc.icon || '').replace(/[^a-zA-Z0-9\-\s]/g, '');

        a.innerHTML = `
            <div class="contacts-social-icon" aria-hidden="true">
                <i class="${safeClass}"></i>
            </div>
            <div class="contacts-social-info">
                <p class="contacts-social-name">${soc.name}</p>
                <p class="contacts-social-handle">@${soc.handle}</p>
            </div>
            <i class="fa-solid fa-arrow-right contacts-social-arrow" aria-hidden="true"></i>
        `;

        container.appendChild(a);
    });
}

// ── 4. renderSocials — kept for main.js compat ────────────
export async function renderSocials() {
    // Social-block removed from HTML per design brief.
    // Function kept for main.js compatibility — exits silently.
    const container = document.getElementById('social-links-container');
    if (!container) return;
}

// ── 5. Site config texts ───────────────────────────────────
export async function renderSiteConfig() {
    const btn = document.querySelector('.btn-primary');
    if (btn) {
        const text = USE_SUPABASE
            ? await getConfig('cta_text')
            : MOCK_DB.site_config.cta_text;
        const href = USE_SUPABASE
            ? await getConfig('cta_href')
            : MOCK_DB.site_config.cta_href;
        btn.textContent = text || 'ОТПРАВИТЬ ДЕМО';
        btn.href        = href || 'mailto:gsp.sound@mail.ru';
    }

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
