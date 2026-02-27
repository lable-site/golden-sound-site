// ============================================================
//  config.js — Golden Sound
//  Все данные жёстко вшиты в код. Supabase НЕ подключён.
//  Когда придёт время — добавьте свой SUPABASE_URL/KEY сюда
//  и подключите fetch в content.js и artists.js.
// ============================================================

export const GS_ARTISTS = [
    {
        name: 'MACAN',
        img:  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaExQ6Cr4qYMIeQ1xUpMutPxSTgB-Cn2ylFpUvvBd1kK5aTOnnb3GY8ml4fju3URApowGG4NuTgPxDEY3cfwZaUiChBI2mIJoCgN1ANZo&s=10'
    },
    {
        name: 'SCIRENA',
        img:  'https://i.scdn.co/image/ab6761610000e5ebfc18a28db81258fd88902790'
    },
    {
        name: 'A.V.G.',
        img:  'https://multi-admin.ru/mediabank_blog/11/323289/29c45b8df4f38a786e184b1c3d11bf05.jpg'
    }
];

export const GS_CONTACTS = [
    { icon: 'fa-location-dot', label: 'Адрес',   value: 'Москва, 109012, Театральный проезд, 3с3' },
    { icon: 'fa-location-dot', label: 'Офис',    value: 'Москва, 109052, Смирновская 25, стр.16, 3 этаж, офис 317' },
    { icon: 'fa-phone',        label: 'Телефон', value: '+7 999 904-88-86', href: 'tel:+79999048886' },
    { icon: 'fa-envelope',     label: 'Email',   value: 'gsp.sound@mail.ru', href: 'mailto:gsp.sound@mail.ru' }
];

export const GS_SOCIALS = [
    { name: 'YouTube',   handle: 'Golden Sound',          icon: 'fa-brands fa-youtube',   url: 'https://www.youtube.com/channel/UCy8MBNS-yBok_3nbCHJ0H3w' },
    { name: 'VKontakte', handle: 'goldensound_official',  icon: 'fa-brands fa-vk',        url: 'https://vk.com/goldensound_official' },
    { name: 'Instagram', handle: 'goldensound.18',        icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/goldensound.18' }
];

// Сколько слотов «Услуга» показывать в секции (с плюсиком).
// Когда подключите свой Supabase — замените на реальный fetch.
export const GS_SERVICES_SLOTS = 4;
