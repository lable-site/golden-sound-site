// ============================================================
//  config.js — Golden Sound v2.0
//
//  ⚙️  ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМА ДАННЫХ:
//  USE_SUPABASE = false → данные берутся из MOCK_DB (работает без бэкенда)
//  USE_SUPABASE = true  → данные тянутся из реального Supabase
//
//  🔑  НАСТРОЙКА SUPABASE (когда будет куплена база):
//  1. Поменяй USE_SUPABASE на true
//  2. Вставь свои SUPABASE_URL и SUPABASE_KEY ниже
// ============================================================

export const USE_SUPABASE = false;  // ← ПЕРЕКЛЮЧАТЕЛЬ: false = мок, true = Supabase

export const SUPABASE_URL = 'https://ВАШ_ПРОЕКТ_ID.supabase.co';  // ← сюда ваш URL
export const SUPABASE_KEY = 'ВАШ_ANON_KEY_ОТ_SUPABASE';            // ← сюда ваш ключ

// ============================================================
//  MOCK_DB — полная имитация базы данных Supabase
//  Именно отсюда сайт работает прямо сейчас, без бэкенда.
//  Структура таблиц точно совпадает с реальной Supabase схемой.
// ============================================================
export const MOCK_DB = {

    // Таблица: artists
    // Поддерживает до 30 артистов. name=null → карточка-заглушка с "+"
    artists: [
        { id: 1, name: 'MACAN',   img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaExQ6Cr4qYMIeQ1xUpMutPxSTgB-Cn2ylFpUvvBd1kK5aTOnnb3GY8ml4fju3URApowGG4NuTgPxDEY3cfwZaUiChBI2mIJoCgN1ANZo&s=10', sort_order: 1 },
        { id: 2, name: 'SCIRENA', img: 'https://i.scdn.co/image/ab6761610000e5ebfc18a28db81258fd88902790', sort_order: 2 },
        { id: 3, name: 'A.V.G.',  img: 'https://multi-admin.ru/mediabank_blog/11/323289/29c45b8df4f38a786e184b1c3d11bf05.jpg', sort_order: 3 },
        // Три пустых слота-заглушки
        { id: 4, name: null, img: null, sort_order: 4 },
        { id: 5, name: null, img: null, sort_order: 5 },
        { id: 6, name: null, img: null, sort_order: 6 },
    ],

    // Таблица: services
    services: [
        { id: 1, icon: 'fa-solid fa-microphone',   title: 'Звукозапись',   description: 'Сюда можно добавить всё что угодно', sort_order: 1 },
        { id: 2, icon: 'fa-solid fa-music',         title: 'Продюсирование', description: 'Сюда можно добавить всё что угодно', sort_order: 2 },
        { id: 3, icon: 'fa-solid fa-record-vinyl',  title: 'Дистрибьюция',  description: 'Сюда можно добавить всё что угодно', sort_order: 3 },
        { id: 4, icon: 'fa-solid fa-bullhorn',      title: 'Промоушен',     description: 'Сюда можно добавить всё что угодно', sort_order: 4 },
    ],

    // Таблица: stats
    stats: [
        { id: 1, number: 12,  suffix: '+',  label: 'артистов' },
        { id: 2, number: 120, suffix: 'M+', label: 'прослушиваний' },
        { id: 3, number: 300, suffix: '+',  label: 'релизов' },
    ],

    // Таблица: contacts
    contacts: [
        { id: 1, icon: 'fa-location-dot', label: 'Адрес',   value: 'Москва, 109012, Театральный проезд, 3с3',                    href: null },
        { id: 2, icon: 'fa-location-dot', label: 'Офис',    value: 'Москва, 109052, Смирновская 25, стр.16, 3 эт., офис 317',    href: null },
        { id: 3, icon: 'fa-phone',        label: 'Телефон', value: '+7 999 904-88-86', href: 'tel:+79999048886' },
        { id: 4, icon: 'fa-envelope',     label: 'Email',   value: 'gsp.sound@mail.ru', href: 'mailto:gsp.sound@mail.ru' },
    ],

    // Таблица: socials
    // ИЗМЕНЕНИЕ: name 'VKONTAKTE' → 'ВКонтакте'
    socials: [
        { id: 1, name: 'YouTube',    handle: 'Golden Sound',         icon: 'fa-brands fa-youtube',   url: 'https://www.youtube.com/channel/UCy8MBNS-yBok_3nbCHJ0H3w', sort_order: 1 },
        { id: 2, name: 'ВКонтакте', handle: 'goldensound_official', icon: 'fa-brands fa-vk',        url: 'https://vk.com/goldensound_official',                     sort_order: 2 },
        { id: 3, name: 'Instagram',  handle: 'goldensound.18',       icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/goldensound.18',                sort_order: 3 },
    ],

    // Таблица: site_config
    // Все текстовые строки, кнопки, футер
    site_config: {
        cta_text:          'ОТПРАВИТЬ ДЕМО',
        cta_href:          'mailto:gsp.sound@mail.ru',
        footer_copyright:  '© 2026 Golden Sound. All rights reserved.',
        footer_tagline:    'Москва, Россия',
    },
};

// ============================================================
//  Обратная совместимость: GS_ARTISTS, GS_CONTACTS, GS_SOCIALS
//  используются в artists.js и content.js когда USE_SUPABASE=false
// ============================================================
export const GS_ARTISTS  = MOCK_DB.artists;
export const GS_CONTACTS = MOCK_DB.contacts;
export const GS_SOCIALS  = MOCK_DB.socials;
