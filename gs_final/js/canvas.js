// ============================================================
//  canvas.js — Golden Sound
//
//  ДИЗАЙН: золотая пыль, поднимающаяся вверх.
//  Полностью отличается от NATIVE (там падающие/летящие звёзды).
//
//  GoldMote  — пылинка, поднимается вверх с лёгким покачиванием
//  GoldMoteSystem — система пылинок для секций с .stars-canvas-bg
//  GoldShimmer — едва заметное мерцание для секции услуг
//
//  Экспорт совпадает с NATIVE по именам (чтобы main.js работал):
//  resizeCanvas, animateParticles, initStars, animateStars
// ============================================================

// ============================================================
//  ЗОЛОТАЯ ПЫЛИНКА — поднимается вверх, медленно покачивается
// ============================================================
class GoldMote {
    constructor(w, h, density) {
        this.w = w;
        this.h = h;
        this.density = density || 'normal';
        this.reset(true);
    }

    reset(initial) {
        this.x     = Math.random() * this.w;
        this.y     = initial ? Math.random() * this.h : this.h + 5;

        // Скорость: медленно вверх + лёгкий горизонтальный дрейф
        this.vy    = -(Math.random() * 0.35 + 0.08); // вверх
        this.vx    = (Math.random() - 0.5) * 0.12;

        // Покачивание по синусоиде
        this.wobbleAngle = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.018 + 0.005;
        this.wobbleAmp   = Math.random() * 0.5 + 0.15;

        // Размер — пылинка, ничего крупного
        if (this.density === 'light') {
            this.size  = Math.random() * 0.8 + 0.2;
            this.alpha = Math.random() * 0.18 + 0.04;
        } else {
            this.size  = Math.random() * 1.5 + 0.3;
            this.alpha = Math.random() * 0.40 + 0.08;
        }

        this.alphaBase  = this.alpha;
        this.flickAngle = Math.random() * Math.PI * 2;
        this.flickSpeed = Math.random() * 0.02 + 0.005;

        // Золотой диапазон: тёплые R/G, минимальный B
        // R: 175–225 | G: 130–180 | B: 15–55
        const r = 175 + Math.floor(Math.random() * 50);
        const g = 130 + Math.floor(Math.random() * 50);
        const b = 15  + Math.floor(Math.random() * 40);
        this.rgb = `${r},${g},${b}`;
    }

    update(timeScale) {
        this.wobbleAngle += this.wobbleSpeed * timeScale;
        this.flickAngle  += this.flickSpeed  * timeScale;

        // Движение: вверх + синусоидальное покачивание
        this.x += (this.vx + Math.sin(this.wobbleAngle) * this.wobbleAmp) * timeScale;
        this.y += this.vy * timeScale;

        // Мерцание alpha
        this.alpha = this.alphaBase + Math.sin(this.flickAngle) * (this.alphaBase * 0.3);

        // Плавное затухание при приближении к верху
        const fadeZone = this.h * 0.25;
        if (this.y < fadeZone) {
            const t = this.y / fadeZone;
            this.alpha *= Math.max(0, t);
        }

        // Respawn: ушла за верх или за боковой край
        if (this.y < -8 || this.x < -8 || this.x > this.w + 8) {
            this.reset(false);
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${Math.max(0, Math.min(1, this.alpha))})`;
        ctx.fill();
    }
}

// ============================================================
//  СИСТЕМА ЗОЛОТОЙ ПЫЛИ
//  Используется для: artists / stats / contacts / socials
// ============================================================
class GoldMoteSystem {
    constructor(canvas) {
        this.canvas    = canvas;
        this.ctx       = canvas.getContext('2d', { alpha: true });
        this.motes     = [];
        this.w         = 0;
        this.h         = 0;
        this.sectionId = canvas.parentElement?.id || '';
        this.density   = canvas.dataset?.density || 'normal';
    }

    resize(prefersReducedMotion) {
        const section = this.canvas.parentElement;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width  = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width  = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.motes = [];
        if (prefersReducedMotion) return;

        // Количество пылинок по плотности
        let base = Math.max(40, Math.min(Math.floor(this.w * this.h / 12000), 200));
        if (this.density === 'light') base = Math.floor(base * 0.4);

        for (let i = 0; i < base; i++) {
            this.motes.push(new GoldMote(this.w, this.h, this.density));
        }
    }

    animate(dt) {
        if (this.motes.length === 0) return;
        const ts = dt / 16.66;

        this.ctx.clearRect(0, 0, this.w, this.h);

        for (const mote of this.motes) {
            mote.update(ts);
            mote.draw(this.ctx);
        }
    }
}

// ============================================================
//  ЗОЛОТОЕ МЕРЦАНИЕ — для секции услуг
//  Почти статичные точки света — едва видимое "дыхание" фона
// ============================================================
class ShimmerDot {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
    }
    reset() {
        this.x     = Math.random() * this.w;
        this.y     = Math.random() * this.h;
        this.size  = Math.random() * 0.9 + 0.1;
        this.alpha = 0;
        this.maxA  = Math.random() * 0.12 + 0.02;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.008 + 0.002;
        const r = 180 + Math.floor(Math.random() * 40);
        const g = 140 + Math.floor(Math.random() * 40);
        const b = 20  + Math.floor(Math.random() * 30);
        this.rgb = `${r},${g},${b}`;
    }
    update(ts) {
        this.phase += this.speed * ts;
        this.alpha = this.maxA * (0.5 + 0.5 * Math.sin(this.phase));
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${this.alpha})`;
        ctx.fill();
    }
}

class GoldShimmerSystem {
    constructor(canvas) {
        this.canvas = canvas;
        if (!canvas) return;
        this.ctx    = canvas.getContext('2d', { alpha: true });
        this.dots   = [];
        this.w = 0;
        this.h = 0;
    }

    resize(prefersReducedMotion) {
        if (!this.canvas) return;
        const section = this.canvas.parentElement;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width  = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width  = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.dots = [];
        if (prefersReducedMotion) return;

        const count = Math.max(30, Math.min(Math.floor(this.w * this.h / 15000), 120));
        for (let i = 0; i < count; i++) {
            this.dots.push(new ShimmerDot(this.w, this.h));
        }
    }

    animate(dt) {
        if (!this.canvas || this.dots.length === 0) return;
        const ts = dt / 16.66;
        this.ctx.clearRect(0, 0, this.w, this.h);
        for (const dot of this.dots) {
            dot.update(ts);
            dot.draw(this.ctx);
        }
    }
}

// ============================================================
//  Экспортируемый интерфейс (совместим с main.js)
// ============================================================
let goldShimmer = null;
let moteSystems = [];

// resizeCanvas — инициализирует/пересчитывает canvas для #services-canvas
export function resizeCanvas(prefersReducedMotion) {
    if (!goldShimmer) {
        const c = document.getElementById('services-canvas');
        if (c) goldShimmer = new GoldShimmerSystem(c);
    }
    if (goldShimmer) goldShimmer.resize(prefersReducedMotion);
}

// animateParticles — анимирует мерцание услуг
export function animateParticles(dt) {
    if (goldShimmer) goldShimmer.animate(dt);
}

// initStars — создаёт GoldMoteSystem для каждого .stars-canvas-bg
export function initStars(prefersReducedMotion) {
    moteSystems = [];
    document.querySelectorAll('.stars-canvas-bg').forEach(canvas => {
        const sys = new GoldMoteSystem(canvas);
        sys.resize(prefersReducedMotion);
        moteSystems.push(sys);
    });
}

// animateStars — анимирует все системы пыли
export function animateStars(dt) {
    for (const sys of moteSystems) {
        sys.animate(dt);
    }
}
