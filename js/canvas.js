// ============================================================
//  canvas.js — Golden Sound v2.0
//
//  Четыре уникальные системы:
//
//  1. GSLogoParticles  — Hero / Services
//     Частицы формируют логотип GS (как Check Engine на приборке).
//     Hero: яркий, динамичный. Services: призрачный, дрейфующий.
//
//  2. StarlightSystem  — Artists
//     Rolls-Royce Starlight Headliner. Глубокое звёздное небо,
//     сотни точек, индивидуальное мерцание. Без пыли.
//
//  3. NebulaeSystem    — Contacts / Stats
//     Starlight + редкие падающие звёзды + туманный дрейф.
//
//  Экспорт совместим с main.js:
//  resizeCanvas, animateParticles, initStars, animateStars
// ============================================================

// ============================================================
//  УТИЛИТЫ
// ============================================================
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

// ============================================================
//  1. GS-ЧАСТИЦЫ — логотип "буква G + буква S" (Check Engine)
// ============================================================
class GSParticle {
    constructor(tx, ty, w, h) {
        this.tx = tx;
        this.ty = ty;
        this.w  = w;
        this.h  = h;

        // Стартовая позиция: случайно разбросана
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;

        this.size = Math.random() * 1.4 + 0.4;
        this.alpha = 0;
        this.alphaTarget = Math.random() * 0.55 + 0.35;

        // Золотой спектр: тёплые оттенки
        const r = 170 + Math.floor(Math.random() * 65);
        const g = 130 + Math.floor(Math.random() * 60);
        const b = 8   + Math.floor(Math.random() * 35);
        this.rgb = `${r},${g},${b}`;

        this.osc      = Math.random() * Math.PI * 2;
        this.oscSpeed = 0.008 + Math.random() * 0.015;
        this.oscAmp   = 0.15 + Math.random() * 0.25;

        this.settled  = false;
    }

    update(ts, converging) {
        this.osc += this.oscSpeed * ts;

        if (converging) {
            const dx = this.tx - this.x;
            const dy = this.ty - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const spring = dist > 60 ? 0.06 : 0.04;
            const damp   = 0.86;

            this.vx = (this.vx + dx * spring) * damp;
            this.vy = (this.vy + dy * spring) * damp;

            if (dist < 6) {
                this.settled = true;
                // Дышит на месте
                this.x += Math.sin(this.osc) * this.oscAmp * ts;
                this.y += Math.cos(this.osc * 0.71) * (this.oscAmp * 0.7) * ts;
            }

            // Появляемся
            this.alpha = Math.min(this.alpha + 0.018 * ts, this.alphaTarget);
        } else {
            // Scatter mode
            this.vx += (Math.random() - 0.5) * 0.06;
            this.vy += (Math.random() - 0.5) * 0.06;
            this.vx *= 0.97;
            this.vy *= 0.97;
            this.alpha = Math.max(0, this.alpha - 0.01 * ts);
        }

        // Мерцание у осевших частиц
        if (this.settled) {
            this.alpha = this.alphaTarget * (0.65 + 0.35 * Math.sin(this.osc));
        }

        this.x += this.vx * ts;
        this.y += this.vy * ts;
    }

    draw(ctx) {
        if (this.alpha < 0.01) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${Math.min(1, this.alpha)})`;
        ctx.fill();
    }
}

// ---- Сэмплируем логотип GS с offscreen-канваса ----
function sampleGSLogo(w, h, variant) {
    const oc  = document.createElement('canvas');
    oc.width  = w;
    oc.height = h;
    const octx = oc.getContext('2d');

    const fontSize = Math.min(w * 0.38, h * 0.65, 220);
    octx.font       = `700 ${fontSize}px 'Syncopate', 'Arial Black', sans-serif`;
    octx.textBaseline = 'middle';
    octx.textAlign    = 'center';

    const cx = w / 2;
    const cy = h / 2;

    // G — чуть сдвинута влево и назад (Check Engine: одно поверх другого)
    octx.globalAlpha = variant === 'services' ? 0.55 : 0.75;
    octx.fillStyle   = '#fff';
    octx.fillText('G', cx - fontSize * 0.22, cy);

    // S — поверх, чуть правее
    octx.globalAlpha = variant === 'services' ? 0.45 : 0.90;
    octx.fillText('S', cx + fontSize * 0.22, cy);

    const imageData = octx.getImageData(0, 0, w, h);
    const data      = imageData.data;
    const targets   = [];

    // Шаг сэмплирования — крупнее = меньше частиц
    const step = variant === 'services' ? 6 : 5;

    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const idx = (y * w + x) * 4;
            if (data[idx + 3] > 100) {
                targets.push({ x, y });
            }
        }
    }

    return targets;
}

class GSLogoSystem {
    constructor(canvas, variant) {
        this.canvas   = canvas;
        this.ctx      = canvas.getContext('2d', { alpha: true });
        this.variant  = variant || 'hero'; // 'hero' | 'services'
        this.particles = [];
        this.w = 0;
        this.h = 0;
        this.converging  = false;
        this.scatterTimer = 0;
        this.phaseTimer  = 0;
    }

    resize(prefersReducedMotion) {
        const dpr     = Math.min(window.devicePixelRatio || 1, 2);
        const section = this.canvas.parentElement;
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width  = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width  = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.particles = [];
        if (prefersReducedMotion) return;

        const targets = sampleGSLogo(this.w, this.h, this.variant);

        // Максимальное количество частиц
        const maxP = this.variant === 'hero' ? 700 : 450;
        const step = Math.max(1, Math.ceil(targets.length / maxP));

        for (let i = 0; i < targets.length; i += step) {
            this.particles.push(
                new GSParticle(targets[i].x, targets[i].y, this.w, this.h)
            );
        }

        this.scatterTimer = 0;
        this.converging   = false;

        // Задержка перед схождением: hero быстрее, services медленнее
        const delay = this.variant === 'hero' ? 600 : 1200;
        setTimeout(() => { this.converging = true; }, delay);
    }

    animate(dt) {
        if (this.particles.length === 0) return;

        const ts = dt / 16.66;
        this.ctx.clearRect(0, 0, this.w, this.h);

        // Services: периодическое рассеивание и схождение
        if (this.variant === 'services') {
            this.phaseTimer += dt;
            // Цикл: 8с собран → 3с рассеян
            const cycle = 11000;
            const t = this.phaseTimer % cycle;
            this.converging = t < 8000;
        }

        for (const p of this.particles) {
            p.update(ts, this.converging);
            p.draw(this.ctx);
        }
    }
}

// ============================================================
//  2. ЗВЁЗДНОЕ НЕБО ROLLS-ROYCE — для секции Артистов
// ============================================================
class RRStar {
    constructor(w, h, density) {
        this.w = w;
        this.h = h;
        this.density = density;
        this.reset(true);
    }

    reset(initial) {
        this.x    = Math.random() * this.w;
        this.y    = Math.random() * this.h;

        // Микро-размер как настоящие звёзды
        this.size = Math.random() < 0.85
            ? Math.random() * 0.7 + 0.15  // большинство — пылинки
            : Math.random() * 1.3 + 0.7;  // немного крупнее

        this.baseAlpha = Math.random() * 0.65 + 0.15;
        this.alpha     = initial ? this.baseAlpha : 0;

        // Индивидуальное мерцание
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.004 + Math.random() * 0.018;
        this.twinkleDepth = Math.random() * 0.45 + 0.10;

        // Цвет: 85% белые/голубоватые, 15% с золотым оттенком
        if (Math.random() < 0.15) {
            const r = 215 + Math.floor(Math.random() * 40);
            const g = 190 + Math.floor(Math.random() * 40);
            const b = 120 + Math.floor(Math.random() * 50);
            this.rgb = `${r},${g},${b}`;
        } else {
            const v = 195 + Math.floor(Math.random() * 60);
            this.rgb = `${v},${v},${Math.min(255, v + 25)}`;
        }

        this.hasGlow = this.baseAlpha > 0.60 && this.size > 0.80;
    }

    update(ts) {
        this.twinklePhase += this.twinkleSpeed * ts;
        const t = 0.5 + 0.5 * Math.sin(this.twinklePhase);
        this.alpha = this.baseAlpha * (1 - this.twinkleDepth + this.twinkleDepth * t);
    }

    draw(ctx) {
        if (this.alpha < 0.005) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${this.alpha})`;
        ctx.fill();

        // Мягкий ореол вокруг ярких звёзд
        if (this.hasGlow && this.alpha > 0.40) {
            const glowR = this.size * 3;
            const grad  = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, glowR
            );
            grad.addColorStop(0, `rgba(${this.rgb},${this.alpha * 0.28})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.beginPath();
            ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }
}

class StarlightSystem {
    constructor(canvas, density) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d', { alpha: true });
        this.density = density || 'normal';
        this.stars   = [];
        this.w = 0;
        this.h = 0;
    }

    resize(prefersReducedMotion) {
        const dpr     = Math.min(window.devicePixelRatio || 1, 2);
        const section = this.canvas.parentElement;
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width  = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width  = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.stars = [];
        if (prefersReducedMotion) return;

        // Rolls-Royce плотность — много мелких звёзд
        let count = Math.min(550, Math.floor(this.w * this.h / 3200));
        if (this.density === 'light') count = Math.floor(count * 0.5);

        for (let i = 0; i < count; i++) {
            this.stars.push(new RRStar(this.w, this.h, this.density));
        }
    }

    animate(dt) {
        if (this.stars.length === 0) return;
        const ts = dt / 16.66;

        this.ctx.clearRect(0, 0, this.w, this.h);
        for (const s of this.stars) {
            s.update(ts);
            s.draw(this.ctx);
        }
    }
}

// ============================================================
//  3. NEBULAE SYSTEM — Контакты: звёзды + падающие звёзды
// ============================================================
class ShootingStar {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.active = false;
        this.reset();
        this.active = false;
    }

    reset() {
        // Стартует из верхней трети
        this.x = Math.random() * this.w * 0.6 + this.w * 0.1;
        this.y = Math.random() * this.h * 0.35;

        const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.6;
        const speed = 6 + Math.random() * 8;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.trailLen  = 50 + Math.random() * 90;
        this.alpha     = 0;
        this.maxAlpha  = 0.55 + Math.random() * 0.35;
        this.life      = 0;
        this.maxLife   = 55 + Math.random() * 45;
        this.width     = 1.0 + Math.random() * 0.8;
        this.active    = true;
    }

    update(ts) {
        if (!this.active) return;
        this.life += ts;

        const t = this.life / this.maxLife;
        if (t < 0.15) {
            this.alpha = this.maxAlpha * (t / 0.15);
        } else {
            this.alpha = this.maxAlpha * (1 - (t - 0.15) / 0.85);
        }
        this.alpha = Math.max(0, this.alpha);

        this.x += this.vx * ts;
        this.y += this.vy * ts;

        if (this.life >= this.maxLife) this.active = false;
    }

    draw(ctx) {
        if (!this.active || this.alpha < 0.01) return;

        const tailX = this.x - this.vx * (this.trailLen / 10);
        const tailY = this.y - this.vy * (this.trailLen / 10);

        const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.6, `rgba(220,210,180,${this.alpha * 0.5})`);
        grad.addColorStop(1, `rgba(255,255,240,${this.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = this.width;
        ctx.lineCap     = 'round';
        ctx.stroke();

        // Яркая голова
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
        ctx.fill();
    }
}

class NebulaeSystem {
    constructor(canvas, density) {
        this.canvas   = canvas;
        this.ctx      = canvas.getContext('2d', { alpha: true });
        this.density  = density || 'normal';
        this.stars    = [];
        this.shooters = [];
        this.shootTimer    = 0;
        this.shootInterval = 4000 + Math.random() * 8000;
        this.w = 0;
        this.h = 0;
    }

    resize(prefersReducedMotion) {
        const dpr     = Math.min(window.devicePixelRatio || 1, 2);
        const section = this.canvas.parentElement;
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width  = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width  = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.stars    = [];
        this.shooters = [];
        if (prefersReducedMotion) return;

        let count = Math.min(420, Math.floor(this.w * this.h / 4200));
        if (this.density === 'light') count = Math.floor(count * 0.55);

        for (let i = 0; i < count; i++) {
            this.stars.push(new RRStar(this.w, this.h, this.density));
        }

        // Пул падающих звёзд
        for (let i = 0; i < 4; i++) {
            this.shooters.push(new ShootingStar(this.w, this.h));
        }
    }

    animate(dt) {
        if (!this.canvas) return;
        const ts = dt / 16.66;

        this.ctx.clearRect(0, 0, this.w, this.h);

        // Звёзды
        for (const s of this.stars) {
            s.update(ts);
            s.draw(this.ctx);
        }

        // Падающие звёзды
        this.shootTimer += dt;
        if (this.shootTimer > this.shootInterval) {
            this.shootTimer    = 0;
            this.shootInterval = 4000 + Math.random() * 9000;
            const free = this.shooters.find(s => !s.active);
            if (free) free.reset();
        }
        for (const ss of this.shooters) {
            if (ss.active) {
                ss.update(ts);
                ss.draw(this.ctx);
            }
        }
    }
}

// ============================================================
//  РЕЕСТР СИСТЕМ
// ============================================================
let heroSystem     = null;   // GSLogoSystem для #hero-canvas
let servicesSystem = null;   // GSLogoSystem для #services-canvas
let starSystems    = [];     // StarlightSystem / NebulaeSystem для .stars-canvas-bg

// ============================================================
//  ЭКСПОРТ (совместимость с main.js)
// ============================================================

/**
 * resizeCanvas — инициализирует/пересчитывает:
 *   • #hero-canvas     → GS logo, hero variant
 *   • #services-canvas → GS logo, services variant
 */
export function resizeCanvas(prefersReducedMotion) {
    // Hero canvas
    const heroEl = document.getElementById('hero-canvas');
    if (heroEl) {
        if (!heroSystem) heroSystem = new GSLogoSystem(heroEl, 'hero');
        heroSystem.resize(prefersReducedMotion);
    }

    // Services canvas
    const svcEl = document.getElementById('services-canvas');
    if (svcEl) {
        if (!servicesSystem) servicesSystem = new GSLogoSystem(svcEl, 'services');
        servicesSystem.resize(prefersReducedMotion);
    }
}

/**
 * animateParticles — анимирует hero и services canvas
 */
export function animateParticles(dt) {
    if (heroSystem)     heroSystem.animate(dt);
    if (servicesSystem) servicesSystem.animate(dt);
}

/**
 * initStars — создаёт системы для всех .stars-canvas-bg
 *   data-style="starlight" → StarlightSystem (Артисты)
 *   data-style="nebula"    → NebulaeSystem   (Контакты, Стата)
 */
export function initStars(prefersReducedMotion) {
    starSystems = [];

    document.querySelectorAll('.stars-canvas-bg').forEach(canvas => {
        const style   = canvas.dataset.style   || 'starlight';
        const density = canvas.dataset.density || 'normal';

        let sys;
        if (style === 'nebula') {
            sys = new NebulaeSystem(canvas, density);
        } else {
            sys = new StarlightSystem(canvas, density);
        }

        sys.resize(prefersReducedMotion);
        starSystems.push(sys);
    });
}

/**
 * animateStars — анимирует все звёздные системы
 */
export function animateStars(dt) {
    for (const sys of starSystems) {
        sys.animate(dt);
    }
}
