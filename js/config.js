// ============================================================
//  config.js — данные и настройки
// ============================================================

// USE_MOCK = true  → сайт берёт данные из mockArtists ниже (заглушки)
// USE_MOCK = false → сайт идёт в Supabase за реальными данными
//
// Сейчас стоит false — сайт работает с реальной базой Supabase.
// Если база упала или ты хочешь тестировать без интернета —
// временно поставь true.
export const USE_MOCK = false;

// Ключи доступа к базе данных Supabase (НЕ ПУБЛИКОВАТЬ В ОТКРЫТЫЙ ДОСТУП)
export const SUPABASE_URL = 'https://tazsewyhrqncymqwqffb.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhenNld3locnFuY3ltcXdxZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTE4MzEsImV4cCI6MjA4NzY4NzgzMX0.6epTAUZAcbgT9FTvYyPEXGafbdOSyU4pTdm2ILRIlc8';

// Резервные артисты — показываются если USE_MOCK=true или Supabase недоступен
export const mockArtists = [
    {
        name: "MACAN",
        img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaExQ6Cr4qYMIeQ1xUpMutPxSTgB-Cn2ylFpUvvBd1kK5aTOnnb3GY8ml4fju3URApowGG4NuTgPxDEY3cfwZaUiChBI2mIJoCgN1ANZo&s=10"
    },
    {
        name: "SCIRENA",
        img: "https://i.scdn.co/image/ab6761610000e5ebfc18a28db81258fd88902790"
    },
    {
        name: "A.V.G.",
        img: "https://multi-admin.ru/mediabank_blog/11/323289/29c45b8df4f38a786e184b1c3d11bf05.jpg"
    }
];
