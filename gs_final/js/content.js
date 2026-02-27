// ============================================================
//  content.js — Golden Sound
//  Все данные из config.js — Supabase НЕ используется.
//  Для подключения своей базы: замените массивы на fetch-запросы.
// ============================================================

import { GS_CONTACTS, GS_SOCIALS, GS_SERVICES_SLOTS } from './config.js';

// ============================================================
//  1. Услуги — карточки-заглушки с плюсиком
//  Когда подключите Supabase — замените эту функцию на fetch
// ============================================================
export function renderServices() {
    const grid = document.querySelector('.services-grid');
    if (!grid) return;

    grid.innerHTML = '';

    for (let i = 0; i < GS_SERVICES_SLOTS; i++) {
        const card = document.createElement('div');
        card.className = 'service-card service-placeholder reveal';

        card.innerHTML = `
            <div class="service-slot-inner">
                <div class="service-slot-icon">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i>
                </div>
                <p class="service-slot-label">Услуга ${i + 1}</p>
                <p class="service-slot-hint">Контент появится после<br>подключения Supabase</p>
            </div>
        `;

        grid.appendChild(card);
    }
}

// ============================================================
//  2. Контакты — адреса, телефон, email
// ============================================================
export function renderContacts() {
    const list = document.getElementById('contacts-list');
    if (!list) return;

    list.innerHTML = '';

    GS_CONTACTS.forEach(item => {
        const li = document.createElement('li');
        li.className = 'contacts-item';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'contacts-item-icon';
        iconDiv.innerHTML = `<i class="fa-solid ${item.icon}" aria-hidden="true"></i>`;

        const body = document.createElement('div');

        const label = document.createElement('p');
        label.className = 'contacts-item-label';
        label.textContent = item.label;

        let valueEl;
        if (item.href) {
            valueEl = document.createElement('a');
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
//  3. Соцсети в блоке контактов (с иконками и стрелкой)
// ============================================================
export function renderContactSocials() {
    const container = document.getElementById('contacts-social-list');
    if (!container) return;

    container.innerHTML = '';

    GS_SOCIALS.forEach(soc => {
        const a = document.createElement('a');
        a.className = 'contacts-social-link';
        a.href = soc.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

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
//  4. Большие кнопки соцсетей (секция «Подписывайтесь»)
// ============================================================
export function renderSocials() {
    const container = document.getElementById('social-links-container');
    if (!container) return;

    container.innerHTML = '';

    GS_SOCIALS.forEach(soc => {
        const a = document.createElement('a');
        a.className = 'social-btn';
        a.href = soc.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('aria-label', soc.name);

        const safeClass = (soc.icon || '').replace(/[^a-zA-Z0-9\-\s]/g, '');

        a.innerHTML = `<i class="${safeClass}" aria-hidden="true"></i><span>${soc.name}</span>`;
        container.appendChild(a);
    });
}

// ============================================================
//  5. Хардкод текстов сайта (заголовки, футер)
//  В будущем — замените на fetch из site_config в Supabase
// ============================================================
export function renderSiteConfig() {
    // Заголовок секции соцсетей
    const joinTitle = document.querySelector('.socials-title');
    if (joinTitle) joinTitle.textContent = 'ПОДПИСЫВАЙТЕСЬ';

    // Кнопка в хедере
    const demoBtn = document.querySelector('.btn-primary');
    if (demoBtn) {
        demoBtn.textContent = 'Отправить демо';
        demoBtn.href = 'mailto:gsp.sound@mail.ru';
    }

    // Футер
    const copyright = document.getElementById('footer-copyright');
    if (copyright) copyright.textContent = '© 2026 Golden Sound. All rights reserved.';

    const tagline = document.getElementById('footer-tagline');
    if (tagline) tagline.textContent = 'Москва, Россия';
}
