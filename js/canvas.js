// ============================================================
//  canvas.js — Golden Sound v3.0
//
//  ① GoldWaveSystem  — Hero & Services
//     Плавные золотые синус-волны (аудиовизуализатор).
//     Hero: 5 слоёв, ярче, золотая пыль.
//     Services: 3 слоя, тише, другая фаза/скорость.
//
//  ② StarlightSystem — Artists
//     Rolls-Royce Starlight: 3 слоя глубины, дрейф + параллакс мышью.
//
//  ③ CometSystem     — Contacts / Stats
//     Звёздное небо + золотые кометы с trail-хвостами.
//
//  API ПОЛНОСТЬЮ СОВМЕСТИМ с main.js v2.0:
//  resizeCanvas()  animateParticles()  initStars()  animateStars()
//  NEW: setCanvasMousePosition(x, y) — вызывается из main.js
// ============================================================

// ─────────────────────────────────────────────────────────────
//  СИСТЕМА 1 — GOLD WAVE (Hero & Services)
// ─────────────────────────────────────────────────────────────

/**
 * GoldDust — одна плавающая золотая пылинка,
 * поднимается вверх и медленно мерцает.
 */
class GoldDust {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this._reset(true);
    }

    _reset(initial) {
        this.x    = Math.random() * this.w;
        this.y    = initial ? Math.random() * this.h : this.h + 4;
        this.vx   = (Math.random() - 0.5) * 0.14;
        this.vy   = -(Math.random() * 0.18 + 0.05);
        this.size = Math.random() * 1.1 + 0.2;
        this.baseA = Math.random() * 0.18 + 0.04;
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpd = 0.010 + Math.random() * 0.014;
        const r = 182 + Math.floor(Math.random() * 58);
        const g = 140 + Math.floor(Math.random() * 55);
        const b = 18  + Math.floor(Math.random() * 38);
        this.rgb = `${r},${g},${b}`;
        this.alpha = 0;
    }

    update(ts) {
        this.phase += this.phaseSpd * ts;
        this.x += this.vx * ts;
        this.y += this.vy * ts;
        let a = this.baseA * (0.5 + 0.5 * Math.sin(this.phase));
        if (this.y < this.h * 0.18) a *= this.y / (this.h * 0.18);
        this.alpha = Math.max(0, a);
        if (this.y < -5 || this.x < -5 || this.x > this.w + 5) this._reset(false);
    }

    draw(ctx) {
        if (this.alpha < 0.01) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${this.alpha})`;
        ctx.fill();
    }
}

// Пресеты волн.  Каждая волна — отдельная синусоида.
// freq: пространственная частота (рад/пкс)
// amp:  амплитуда (доля высоты канваса)
// speed:фазовая скорость (рад/мс)
// yOff: смещение центра по Y (доля высоты)
// aLine/aGlow: opacity основной линии и ореола
const WAVE_PRESETS = {
    hero: [
        { freq:0.0026, amp:0.090, speed:0.00036, phase:0.00, yOff: 0.000, r:201,g:168,b:76,  aLine:0.145, aGlow:0.040 },
        { freq:0.0042, amp:0.058, speed:0.00058, phase:1.20, yOff: 0.022, r:232,g:198,b:92,  aLine:0.100, aGlow:0.028 },
        { freq:0.0075, amp:0.038, speed:0.00092, phase:2.40, yOff:-0.025, r:178,g:128,b:38,  aLine:0.080, aGlow:0.022 },
        { freq:0.0016, amp:0.115, speed:0.00024, phase:3.50, yOff: 0.042, r:242,g:212,b:112, aLine:0.058, aGlow:0.016 },
        { freq:0.0115, amp:0.022, speed:0.00135, phase:0.80, yOff:-0.042, r:255,g:238,b:145, aLine:0.045, aGlow:0.013 },
    ],
    services: [
        { freq:0.0031, amp:0.068, speed:0.00028, phase:1.00, yOff: 0.000, r:201,g:168,b:76,  aLine:0.100, aGlow:0.028 },
        { freq:0.0052, amp:0.043, speed:0.00043, phase:3.00, yOff: 0.050, r:220,g:182,b:82,  aLine:0.072, aGlow:0.020 },
        { freq:0.0094, amp:0.028, speed:0.00068, phase:5.00, yOff:-0.050, r:168,g:118,b:33,  aLine:0.058, aGlow:0.016 },
    ],
};

class GoldWaveSystem {
    constructor(canvas, variant) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d', { alpha: true });
        this.variant = variant || 'hero';
        // Deep-copy чтобы фазы не шарились между экземплярами
        this.waves   = WAVE_PRESETS[this.variant].map(w => ({ ...w }));
        this.dust    = [];
        this.w = 0;
        this.h = 0;
    }

    resize(pRM) {
        const dpr     = Math.min(window.devicePixelRatio || 1, 2);
        const section = this.canvas.parentElement;
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.dust = [];
        if (pRM) return;

        const n = this.variant === 'hero' ? 38 : 24;
        for (let i = 0; i < n; i++) this.dust.push(new GoldDust(this.w, this.h));
    }

    _drawWave(wave, ts) {
        const { ctx, w, h } = this;
        wave.phase += wave.speed * ts;
        const cy   = h * (0.5 + wave.yOff);
        const amp  = wave.amp * h;
        const step = Math.max(2, Math.floor(w / 480)); // адаптивный шаг

        // ── Ореол (широкая полупрозрачная линия) ──────
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
            const y = cy + Math.sin(x * wave.freq + wave.phase) * amp;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${wave.r},${wave.g},${wave.b},${wave.aGlow})`;
        ctx.lineWidth   = 6;
        ctx.lineJoin    = 'round';
        ctx.stroke();

        // ── Основная линия ────────────────────────────
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
            const y = cy + Math.sin(x * wave.freq + wave.phase) * amp;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${wave.r},${wave.g},${wave.b},${wave.aLine})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
    }

    animate(dt) {
        if (!this.canvas) return;
        const ts = dt / 16.66;
        this.ctx.clearRect(0, 0, this.w, this.h);

        for (const wave of this.waves) this._drawWave(wave, ts);
        for (const d    of this.dust)  { d.update(ts); d.draw(this.ctx); }
    }
}

// ─────────────────────────────────────────────────────────────
//  SHARED — класс Star (используется в Starlight и Comet)
// ─────────────────────────────────────────────────────────────

class Star {
    /**
     * @param {number} w,h        — размеры канваса
     * @param {number} layerIndex — 0=дальний, 2=ближний
     * @param {number} totalLayers
     */
    constructor(w, h, layerIndex, totalLayers) {
        this.w = w;
        this.h = h;
        this.layerFrac = totalLayers > 1 ? layerIndex / (totalLayers - 1) : 0.5;
        this._reset(true);
    }

    _reset(initial) {
        this.x = Math.random() * this.w;
        this.y = initial ? Math.random() * this.h : Math.random() * this.h;

        // Размер и яркость зависят от слоя (ближе = крупнее и ярче)
        const sMin = 0.10 + this.layerFrac * 0.34;
        const sMax = 0.30 + this.layerFrac * 1.10;
        this.size  = sMin + Math.random() * (sMax - sMin);

        this.baseAlpha = 0.12 + this.layerFrac * 0.48 + Math.random() * 0.20;
        this.alpha     = this.baseAlpha;

        // Мерцание
        this.twPhase = Math.random() * Math.PI * 2;
        this.twSpeed = 0.003 + Math.random() * 0.013;
        this.twDepth = 0.18 + Math.random() * 0.38;

        // Медленный дрейф — ближние слои быстрее
        const spd = 0.014 + this.layerFrac * 0.055;
        const ang = Math.random() * Math.PI * 2;
        this.vx = Math.cos(ang) * spd * (0.5 + Math.random() * 0.5);
        this.vy = Math.sin(ang) * spd * (0.5 + Math.random() * 0.5);

        // 87% холодно-белые/голубые, 13% тёплые золотистые
        if (Math.random() < 0.13) {
            const r = 212 + Math.floor(Math.random() * 43);
            const g = 185 + Math.floor(Math.random() * 40);
            const b = 98  + Math.floor(Math.random() * 52);
            this.rgb = `${r},${g},${b}`;
        } else {
            const v = 192 + Math.floor(Math.random() * 63);
            this.rgb = `${v},${v},${Math.min(255, v + 22)}`;
        }

        this.hasGlow = this.layerFrac > 0.55 && this.size > 0.72;
    }

    update(ts) {
        // Мерцание
        this.twPhase += this.twSpeed * ts;
        const t    = 0.5 + 0.5 * Math.sin(this.twPhase);
        this.alpha = this.baseAlpha * (1 - this.twDepth + this.twDepth * t);

        // Дрейф с wrap-around
        this.x += this.vx * ts;
        this.y += this.vy * ts;
        if (this.x < -2)         this.x = this.w + 2;
        if (this.x > this.w + 2) this.x = -2;
        if (this.y < -2)         this.y = this.h + 2;
        if (this.y > this.h + 2) this.y = -2;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} ox,oy — offset параллакса
     */
    draw(ctx, ox, oy) {
        if (this.alpha < 0.008) return;

        const x = this.x + (ox || 0);
        const y = this.y + (oy || 0);

        // Не рисуем за пределами канваса (с запасом 3px)
        if (x < -3 || x > this.w + 3 || y < -3 || y > this.h + 3) return;

        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${this.alpha})`;
        ctx.fill();

        // Мягкий ореол для ярких ближних звёзд
        if (this.hasGlow && this.alpha > 0.35) {
            const gr = ctx.createRadialGradient(x, y, 0, x, y, this.size * 3.2);
            gr.addColorStop(0, `rgba(${this.rgb},${this.alpha * 0.22})`);
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(x, y, this.size * 3.2, 0, Math.PI * 2);
            ctx.fillStyle = gr;
            ctx.fill();
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  СИСТЕМА 2 — STARLIGHT (Артисты) — дрейф + параллакс мышью
// ─────────────────────────────────────────────────────────────

class StarlightSystem {
    constructor(canvas, density) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d', { alpha: true });
        this.density = density || 'normal';
        this.layers  = [];   // [{ stars: Star[], parallaxFactor }]
        // Параллакс: нормализованные координаты -0.5…+0.5
        this.targX = 0;
        this.targY = 0;
        this.currX = 0;
        this.currY = 0;
        this.w = 0;
        this.h = 0;
    }

    /**
     * Вызывается из main.js при mousemove над секцией.
     * mx, my — координаты относительно секции (не window).
     * Передай (-1, -1) при mouseleave для возврата в центр.
     */
    setMouse(mx, my) {
        if (this.w === 0 || this.h === 0) return;
        if (mx < 0 || my < 0) {
            this.targX = 0;
            this.targY = 0;
            return;
        }
        this.targX = mx / this.w - 0.5;   // -0.5 … +0.5
        this.targY = my / this.h - 0.5;
    }

    resize(pRM) {
        const dpr     = Math.min(window.devicePixelRatio || 1, 2);
        const section = this.canvas.parentElement;
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.layers = [];
        if (pRM) return;

        const base = Math.min(620, Math.floor(this.w * this.h / 2800));
        const mult = this.density === 'light' ? 0.50 : 1.0;

        // 3 слоя: дальний / средний / ближний
        const counts          = [0.55, 0.30, 0.15].map(f => Math.floor(base * f * mult));
        const parallaxFactors = [5, 13, 28]; // макс. смещение (px) при max мыши

        this.layers = counts.map((count, i) => {
            const stars = [];
            for (let j = 0; j < count; j++) stars.push(new Star(this.w, this.h, i, 3));
            return { stars, parallaxFactor: parallaxFactors[i] };
        });
    }

    animate(dt) {
        if (!this.layers.length) return;
        const ts = dt / 16.66;

        // Плавно лерпим к цели
        const lf = Math.min(1, 0.038 * ts);
        this.currX += (this.targX - this.currX) * lf;
        this.currY += (this.targY - this.currY) * lf;

        this.ctx.clearRect(0, 0, this.w, this.h);

        // Рисуем назад-вперёд (дальний слой первым)
        for (const layer of this.layers) {
            const ox = this.currX * layer.parallaxFactor;
            const oy = this.currY * layer.parallaxFactor;
            for (const star of layer.stars) {
                star.update(ts);
                star.draw(this.ctx, ox, oy);
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  СИСТЕМА 3 — COMET (Контакты) — звёзды + золотые кометы
// ─────────────────────────────────────────────────────────────

class GoldComet {
    constructor(w, h) {
        this.w     = w;
        this.h     = h;
        this.active = false;
        this.trail  = []; // история позиций для хвоста
    }

    reset() {
        const fromTop = Math.random() < 0.65;
        if (fromTop) {
            this.x  = Math.random() * this.w;
            this.y  = -6;
            const speed = 9 + Math.random() * 11;
            const angle = Math.PI * 0.25 * (0.55 + Math.random() * 0.90);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            this.x  = -6;
            this.y  = Math.random() * this.h * 0.55;
            const speed = 8 + Math.random() * 10;
            this.vx = speed * (0.75 + Math.random() * 0.50);
            this.vy = speed * (0.20 + Math.random() * 0.45);
        }

        this.trail    = [];
        this.maxTrail = 14 + Math.floor(Math.random() * 12); // 14–25 точек
        this.life     = 0;
        this.maxLife  = 44 + Math.random() * 38;
        this.maxAlpha = 0.65 + Math.random() * 0.35;
        this.alpha    = 0;
        this.width    = 1.3 + Math.random() * 1.1;

        // Тёплый золотой оттенок — чуть варьируется для каждой кометы
        this.r = 218 + Math.floor(Math.random() * 37);
        this.g = 174 + Math.floor(Math.random() * 52);
        this.b = 48  + Math.floor(Math.random() * 68);

        this.active = true;
    }

    update(ts) {
        if (!this.active) return;

        // Запоминаем позицию для хвоста
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.pop();

        this.life += ts;
        const t = this.life / this.maxLife;

        // Огибающая: быстрый attack (10%), медленный decay
        this.alpha = t < 0.10
            ? this.maxAlpha * (t / 0.10)
            : this.maxAlpha * (1 - (t - 0.10) / 0.90);
        this.alpha = Math.max(0, this.alpha);

        this.x += this.vx * ts;
        this.y += this.vy * ts;

        if (this.life >= this.maxLife) this.active = false;
    }

    draw(ctx) {
        if (!this.active || this.alpha < 0.005 || this.trail.length < 2) return;

        // ── Хвост — линии между сохранёнными точками ──
        for (let i = 0; i < this.trail.length - 1; i++) {
            const p1   = this.trail[i];
            const p2   = this.trail[i + 1];
            const frac = 1 - i / this.trail.length; // 1 у головы, 0 у хвоста
            const a    = this.alpha * frac * frac;
            const lw   = Math.max(0.3, this.width * frac);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${this.r},${this.g},${this.b},${a})`;
            ctx.lineWidth   = lw;
            ctx.lineCap     = 'round';
            ctx.stroke();
        }

        // ── Сияющая голова ────────────────────────────
        if (this.alpha > 0.04) {
            const gr = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.width * 5.5
            );
            gr.addColorStop(0,    `rgba(255,255,255,${this.alpha * 0.95})`);
            gr.addColorStop(0.30, `rgba(${this.r},${this.g},${this.b},${this.alpha * 0.55})`);
            gr.addColorStop(1,    'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 5.5, 0, Math.PI * 2);
            ctx.fillStyle = gr;
            ctx.fill();
        }
    }
}

class CometSystem {
    constructor(canvas, density) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d', { alpha: true });
        this.density = density || 'normal';
        this.stars   = [];
        this.comets  = [];
        this.timer   = 0;
        this.nextIn  = 1600 + Math.random() * 3000; // 1.6–4.6с до первого
        this.w = 0;
        this.h = 0;
    }

    resize(pRM) {
        const dpr     = Math.min(window.devicePixelRatio || 1, 2);
        const section = this.canvas.parentElement;
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.stars  = [];
        this.comets = [];
        if (pRM) return;

        let count = Math.min(360, Math.floor(this.w * this.h / 4800));
        if (this.density === 'light') count = Math.floor(count * 0.55);

        for (let i = 0; i < count; i++) this.stars.push(new Star(this.w, this.h, 1, 3));

        // Пул из 7 комет (неактивны по умолчанию)
        for (let i = 0; i < 7; i++) this.comets.push(new GoldComet(this.w, this.h));
    }

    animate(dt) {
        if (!this.canvas) return;
        const ts = dt / 16.66;

        this.ctx.clearRect(0, 0, this.w, this.h);

        // Звёзды
        for (const s of this.stars) { s.update(ts); s.draw(this.ctx, 0, 0); }

        // Спавн комет
        this.timer += dt;
        if (this.timer >= this.nextIn) {
            this.timer  = 0;
            this.nextIn = 1800 + Math.random() * 3200; // следующая через 1.8–5с
            const free  = this.comets.find(c => !c.active);
            if (free) free.reset();
        }

        // Кометы
        for (const c of this.comets) {
            if (c.active) { c.update(ts); c.draw(this.ctx); }
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  СОСТОЯНИЕ МОДУЛЯ
// ─────────────────────────────────────────────────────────────
let heroSys     = null;  // GoldWaveSystem  → #hero-canvas
let servicesSys = null;  // GoldWaveSystem  → #services-canvas
let starSystems = [];    // StarlightSystem | CometSystem → .stars-canvas-bg

// Ссылка на первый StarlightSystem для обработки параллакса мышью
let _starlightRef = null;

// ─────────────────────────────────────────────────────────────
//  ЭКСПОРТ (API идентичен v2.0)
// ─────────────────────────────────────────────────────────────

/**
 * resizeCanvas — инициализирует/обновляет #hero-canvas и #services-canvas.
 */
export function resizeCanvas(pRM) {
    const heroEl = document.getElementById('hero-canvas');
    if (heroEl) {
        if (!heroSys) heroSys = new GoldWaveSystem(heroEl, 'hero');
        heroSys.resize(pRM);
    }

    const svcEl = document.getElementById('services-canvas');
    if (svcEl) {
        if (!servicesSys) servicesSys = new GoldWaveSystem(svcEl, 'services');
        servicesSys.resize(pRM);
    }
}

/**
 * animateParticles — анимирует hero и services canvas.
 */
export function animateParticles(dt) {
    if (heroSys)     heroSys.animate(dt);
    if (servicesSys) servicesSys.animate(dt);
}

/**
 * initStars — создаёт системы для каждого .stars-canvas-bg.
 *   data-style="starlight" → StarlightSystem (Артисты, Статистика)
 *   data-style="nebula"    → CometSystem     (Контакты)
 */
export function initStars(pRM) {
    starSystems   = [];
    _starlightRef = null;

    document.querySelectorAll('.stars-canvas-bg').forEach(canvas => {
        const style   = canvas.dataset.style   || 'starlight';
        const density = canvas.dataset.density || 'normal';

        const sys = (style === 'nebula')
            ? new CometSystem(canvas, density)
            : new StarlightSystem(canvas, density);

        sys.resize(pRM);
        starSystems.push(sys);

        // Первый starlight-канвас получает параллакс от мыши
        if (style === 'starlight' && !_starlightRef) _starlightRef = sys;
    });
}

/**
 * animateStars — анимирует все star/comet системы.
 */
export function animateStars(dt) {
    for (const sys of starSystems) sys.animate(dt);
}

/**
 * setCanvasMousePosition — передаёт позицию мыши в StarlightSystem.
 * mx, my — координаты относительно секции Артистов.
 * Вызвать с (-1, -1) при mouseleave для возврата центра.
 */
export function setCanvasMousePosition(mx, my) {
    if (_starlightRef) _starlightRef.setMouse(mx, my);
}
