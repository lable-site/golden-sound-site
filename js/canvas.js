// ============================================================
//  canvas.js — Golden Sound v4.0
//
//  СИСТЕМЫ:
//
//  ① HeroParticleSystem  — Hero
//     ~200 частиц, spring-физика, разлёт от курсора,
//     плавный возврат на «домашние» позиции.
//     Тонкие constellation-линии между соседними частицами.
//     FIX мобилки: canvas высота = max(section, viewport).
//
//  ② GoldWaveSystem       — Services
//     Медленные золотые синус-волны + пыль.
//
//  ③ StarlightCometSystem — Artists
//     3 слоя звёзд + параллакс мыши +
//     диагональные золотые кометы (лево-вправо-вниз).
//
//  ④ CometSystem          — Contacts / Stats
//     Звёздное небо + золотые кометы.
//
//  API (совместим с main.js v3.0):
//    resizeCanvas(pRM)
//    animateParticles(dt)
//    initStars(pRM)
//    animateStars(dt)
//    setCanvasMousePosition(mx, my)   ← Starlight parallax
//    setHeroMouse(mx, my)             ← Hero particles
//    clearHeroMouse()
// ============================================================

// ─────────────────────────────────────────────────────────────
//  СИСТЕМА 1 — HERO PARTICLES (spring physics + mouse)
// ─────────────────────────────────────────────────────────────

class HeroParticle {
    /**
     * @param {number} homeX,homeY — «домашняя» позиция
     * @param {number} w,h          — размеры канваса
     */
    constructor(homeX, homeY, w, h) {
        this.homeX = homeX;
        this.homeY = homeY;
        this.w = w;
        this.h = h;

        // Стартовая позиция — рядом с домом (небольшой рандом)
        this.x = homeX + (Math.random() - 0.5) * 120;
        this.y = homeY + (Math.random() - 0.5) * 120;
        this.vx = 0;
        this.vy = 0;

        // Медленный дрейф домашней точки (имитирует «дыхание»)
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.00018 + Math.random() * 0.00022;
        this.driftR     = 8 + Math.random() * 18;

        // Визуал
        this.size      = 0.7 + Math.random() * 1.6;
        this.baseAlpha = 0.22 + Math.random() * 0.44;
        this.phase     = Math.random() * Math.PI * 2;
        this.phaseSpd  = 0.006 + Math.random() * 0.014;

        // Тёплый золотой спектр
        const r = 178 + Math.floor(Math.random() * 77);
        const g = 132 + Math.floor(Math.random() * 72);
        const b = 12  + Math.floor(Math.random() * 52);
        this.r = r; this.g = g; this.b = b;
        this.rgb = `${r},${g},${b}`;

        // Флаг «сильно разлетелась» — возвращаемся мягче
        this.displaced = false;
    }

    update(ts, mouseX, mouseY) {
        // ── Дрейф «домашней» позиции ─────────────────────
        this.driftAngle += this.driftSpeed * ts;
        const dx0 = this.homeX + Math.cos(this.driftAngle) * this.driftR;
        const dy0 = this.homeY + Math.sin(this.driftAngle) * this.driftR;

        // ── Spring к «дому» ───────────────────────────────
        const springK = this.displaced ? 0.018 : 0.025;
        this.vx += (dx0 - this.x) * springK * ts;
        this.vy += (dy0 - this.y) * springK * ts;

        // ── Мышь: отталкивание ────────────────────────────
        if (mouseX !== null && mouseY !== null) {
            const mdx  = this.x - mouseX;
            const mdy  = this.y - mouseY;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);
            const rep  = 145; // радиус влияния
            if (dist < rep && dist > 0.5) {
                const force = ((rep - dist) / rep) * 3.8;
                this.vx += (mdx / dist) * force;
                this.vy += (mdy / dist) * force;
                this.displaced = true;
            }
        } else {
            this.displaced = false;
        }

        // ── Затухание ─────────────────────────────────────
        this.vx *= 0.87;
        this.vy *= 0.87;

        this.x += this.vx * ts;
        this.y += this.vy * ts;

        // ── Мерцание ──────────────────────────────────────
        this.phase += this.phaseSpd * ts;
    }

    get alpha() {
        return this.baseAlpha * (0.55 + 0.45 * Math.sin(this.phase));
    }

    draw(ctx) {
        const a = this.alpha;
        if (a < 0.01) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${a})`;
        ctx.fill();

        // Soft glow вокруг крупных частиц
        if (this.size > 1.4 && a > 0.32) {
            const gr = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size * 4.5
            );
            gr.addColorStop(0, `rgba(${this.rgb},${a * 0.22})`);
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 4.5, 0, Math.PI * 2);
            ctx.fillStyle = gr;
            ctx.fill();
        }
    }
}

class HeroParticleSystem {
    constructor(canvas) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d', { alpha: true });
        this.parts   = [];
        this.mouseX  = null;
        this.mouseY  = null;
        this.w = 0;
        this.h = 0;
    }

    setMouse(x, y) { this.mouseX = x; this.mouseY = y; }
    clearMouse()    { this.mouseX = null; this.mouseY = null; }

    resize(pRM) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const sec = this.canvas.parentElement;

        // FIX мобилки: берём максимум из высоты секции и viewport
        this.w = sec.offsetWidth  || window.innerWidth;
        this.h = Math.max(sec.offsetHeight || 0, window.innerHeight);

        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.parts = [];
        if (pRM) return;

        // Количество частиц: адаптивно, но меньше на мобилке
        const area  = this.w * this.h;
        const count = Math.min(190, Math.max(60, Math.floor(area / 5200)));

        const cx = this.w * 0.5;
        const cy = this.h * 0.48;

        for (let i = 0; i < count; i++) {
            // Распределение: смешанное — часть по эллипсу, часть случайно
            let hx, hy;
            if (i < count * 0.70) {
                // Эллиптическое облако в центре
                const ang = Math.random() * Math.PI * 2;
                // √ даёт равномерное заполнение диска
                const rn  = Math.sqrt(Math.random());
                const rx  = Math.min(this.w * 0.40, 420);
                const ry  = Math.min(this.h * 0.32, 260);
                hx = cx + Math.cos(ang) * rn * rx;
                hy = cy + Math.sin(ang) * rn * ry;
            } else {
                // Разброс по всему канвасу — «фоновые» частицы
                hx = Math.random() * this.w;
                hy = Math.random() * this.h;
            }
            this.parts.push(new HeroParticle(hx, hy, this.w, this.h));
        }
    }

    animate(dt) {
        if (!this.canvas || !this.parts.length) return;
        const ts = dt / 16.66;

        this.ctx.clearRect(0, 0, this.w, this.h);

        // ── Constellation lines (очень тонкие) ───────────
        const MAX_DIST = 80;
        for (let i = 0; i < this.parts.length; i++) {
            const pi = this.parts[i];
            for (let j = i + 1; j < this.parts.length; j++) {
                const pj  = this.parts[j];
                const dx  = pi.x - pj.x;
                const dy  = pi.y - pj.y;
                const d2  = dx * dx + dy * dy;
                if (d2 > MAX_DIST * MAX_DIST) continue;

                const dist = Math.sqrt(d2);
                const a    = (1 - dist / MAX_DIST) * 0.055 * Math.min(pi.alpha, pj.alpha) * 4;
                if (a < 0.002) continue;

                this.ctx.beginPath();
                this.ctx.moveTo(pi.x, pi.y);
                this.ctx.lineTo(pj.x, pj.y);
                this.ctx.strokeStyle = `rgba(201,168,76,${a})`;
                this.ctx.lineWidth   = 0.5;
                this.ctx.stroke();
            }
        }

        // ── Частицы ───────────────────────────────────────
        for (const p of this.parts) {
            p.update(ts, this.mouseX, this.mouseY);
            p.draw(this.ctx);
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  СИСТЕМА 2 — GOLD WAVE (Services) — глубокие волны + пыль
// ─────────────────────────────────────────────────────────────

class GoldDust {
    constructor(w, h) {
        this.w = w; this.h = h;
        this._reset(true);
    }
    _reset(init) {
        this.x     = Math.random() * this.w;
        this.y     = init ? Math.random() * this.h : this.h + 4;
        this.vx    = (Math.random() - 0.5) * 0.12;
        this.vy    = -(Math.random() * 0.16 + 0.04);
        this.size  = Math.random() * 1.0 + 0.2;
        this.baseA = Math.random() * 0.15 + 0.04;
        this.phase = Math.random() * Math.PI * 2;
        this.phSpd = 0.009 + Math.random() * 0.013;
        const r = 182 + Math.floor(Math.random() * 60);
        const g = 138 + Math.floor(Math.random() * 58);
        const b = 14  + Math.floor(Math.random() * 40);
        this.rgb = `${r},${g},${b}`;
    }
    update(ts) {
        this.phase += this.phSpd * ts;
        this.x += this.vx * ts;
        this.y += this.vy * ts;
        let a = this.baseA * (0.5 + 0.5 * Math.sin(this.phase));
        if (this.y < this.h * 0.16) a *= this.y / (this.h * 0.16);
        this.alpha = Math.max(0, a);
        if (this.y < -5 || this.x < -6 || this.x > this.w + 6) this._reset(false);
    }
    draw(ctx) {
        if (this.alpha < 0.01) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${this.alpha})`;
        ctx.fill();
    }
}

// Пресеты волн для секции Услуг — глубже, медленнее
const SVC_WAVES = [
    { freq:0.0028, amp:0.080, speed:0.00022, phase:0.60, yOff: 0.000, r:201,g:168,b:76,  aLine:0.120, aGlow:0.035 },
    { freq:0.0048, amp:0.052, speed:0.00038, phase:2.50, yOff: 0.055, r:228,g:190,b:84,  aLine:0.088, aGlow:0.024 },
    { freq:0.0085, amp:0.032, speed:0.00058, phase:4.80, yOff:-0.055, r:165,g:115,b:30,  aLine:0.065, aGlow:0.018 },
    { freq:0.0018, amp:0.105, speed:0.00016, phase:1.20, yOff: 0.095, r:242,g:210,b:108, aLine:0.042, aGlow:0.012 },
];

class GoldWaveSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d', { alpha: true });
        this.waves  = SVC_WAVES.map(w => ({ ...w }));
        this.dust   = [];
        this.w = 0; this.h = 0;
    }

    resize(pRM) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const sec = this.canvas.parentElement;
        this.w = sec.offsetWidth;
        this.h = sec.offsetHeight;

        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.dust = [];
        if (pRM) return;
        const n = Math.min(32, Math.floor(this.w * this.h / 22000));
        for (let i = 0; i < n; i++) this.dust.push(new GoldDust(this.w, this.h));
    }

    _drawWave(wave, ts) {
        const { ctx, w, h } = this;
        wave.phase += wave.speed * ts;
        const cy   = h * (0.5 + wave.yOff);
        const amp  = wave.amp * h;
        const step = Math.max(2, Math.floor(w / 520));

        // Ореол
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
            const y = cy + Math.sin(x * wave.freq + wave.phase) * amp;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${wave.r},${wave.g},${wave.b},${wave.aGlow})`;
        ctx.lineWidth   = 7;
        ctx.lineJoin    = 'round';
        ctx.stroke();

        // Основная линия
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
        for (const w of this.waves) this._drawWave(w, ts);
        for (const d of this.dust)  { d.update(ts); d.draw(this.ctx); }
    }
}

// ─────────────────────────────────────────────────────────────
//  SHARED — базовый класс Star
// ─────────────────────────────────────────────────────────────

class Star {
    constructor(w, h, layerIdx, totalLayers) {
        this.w = w; this.h = h;
        this.layerFrac = totalLayers > 1 ? layerIdx / (totalLayers - 1) : 0.5;
        this._reset(true);
    }

    _reset(init) {
        this.x = Math.random() * this.w;
        this.y = init ? Math.random() * this.h : Math.random() * this.h;

        const sMin = 0.10 + this.layerFrac * 0.32;
        const sMax = 0.28 + this.layerFrac * 1.05;
        this.size = sMin + Math.random() * (sMax - sMin);

        this.baseAlpha = 0.12 + this.layerFrac * 0.46 + Math.random() * 0.20;
        this.alpha     = this.baseAlpha;

        this.twPhase = Math.random() * Math.PI * 2;
        this.twSpeed = 0.003 + Math.random() * 0.013;
        this.twDepth = 0.18 + Math.random() * 0.38;

        const spd = 0.014 + this.layerFrac * 0.052;
        const ang = Math.random() * Math.PI * 2;
        this.vx = Math.cos(ang) * spd * (0.5 + Math.random() * 0.5);
        this.vy = Math.sin(ang) * spd * (0.5 + Math.random() * 0.5);

        if (Math.random() < 0.13) {
            const r = 210 + Math.floor(Math.random() * 45);
            const g = 183 + Math.floor(Math.random() * 42);
            const b = 95  + Math.floor(Math.random() * 55);
            this.rgb = `${r},${g},${b}`;
        } else {
            const v = 190 + Math.floor(Math.random() * 65);
            this.rgb = `${v},${v},${Math.min(255, v + 24)}`;
        }

        this.hasGlow = this.layerFrac > 0.55 && this.size > 0.70;
    }

    update(ts) {
        this.twPhase += this.twSpeed * ts;
        const t    = 0.5 + 0.5 * Math.sin(this.twPhase);
        this.alpha = this.baseAlpha * (1 - this.twDepth + this.twDepth * t);

        this.x += this.vx * ts;
        this.y += this.vy * ts;
        if (this.x < -2)         this.x = this.w + 2;
        if (this.x > this.w + 2) this.x = -2;
        if (this.y < -2)         this.y = this.h + 2;
        if (this.y > this.h + 2) this.y = -2;
    }

    draw(ctx, ox, oy) {
        if (this.alpha < 0.008) return;
        const x = this.x + (ox || 0);
        const y = this.y + (oy || 0);
        if (x < -3 || x > this.w + 3 || y < -3 || y > this.h + 3) return;

        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${this.alpha})`;
        ctx.fill();

        if (this.hasGlow && this.alpha > 0.33) {
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
//  Shared — класс диагональной кометы (Artist + Contacts)
// ─────────────────────────────────────────────────────────────

class GoldComet {
    constructor(w, h) {
        this.w = w; this.h = h;
        this.active = false;
        this.trail  = [];
    }

    reset() {
        // Старт из верхнего-левого квадранта (диагональ лево-право-вниз)
        this.x = -10 + Math.random() * this.w * 0.35;
        this.y = -10 + Math.random() * this.h * 0.30;

        const speed = 9 + Math.random() * 12;
        // Угол: ~30–55° (вправо-вниз)
        const angle = (Math.PI / 6) + Math.random() * (Math.PI / 5.5);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.trail    = [];
        this.maxTrail = 16 + Math.floor(Math.random() * 14);
        this.life     = 0;
        this.maxLife  = 50 + Math.random() * 40;
        this.maxAlpha = 0.60 + Math.random() * 0.40;
        this.alpha    = 0;
        this.width    = 1.2 + Math.random() * 1.3;

        this.r = 220 + Math.floor(Math.random() * 35);
        this.g = 172 + Math.floor(Math.random() * 56);
        this.b = 44  + Math.floor(Math.random() * 72);

        this.active = true;
    }

    update(ts) {
        if (!this.active) return;

        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.pop();

        this.life += ts;
        const t = this.life / this.maxLife;

        this.alpha = t < 0.12
            ? this.maxAlpha * (t / 0.12)
            : this.maxAlpha * (1 - (t - 0.12) / 0.88);
        this.alpha = Math.max(0, this.alpha);

        this.x += this.vx * ts;
        this.y += this.vy * ts;

        if (this.life >= this.maxLife) this.active = false;
    }

    draw(ctx) {
        if (!this.active || this.alpha < 0.005 || this.trail.length < 2) return;

        // Хвост
        for (let i = 0; i < this.trail.length - 1; i++) {
            const p1   = this.trail[i];
            const p2   = this.trail[i + 1];
            const frac = 1 - i / this.trail.length;
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

        // Сияющая голова
        if (this.alpha > 0.04) {
            const gr = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.width * 5.5
            );
            gr.addColorStop(0,    `rgba(255,255,255,${this.alpha * 0.95})`);
            gr.addColorStop(0.28, `rgba(${this.r},${this.g},${this.b},${this.alpha * 0.55})`);
            gr.addColorStop(1,    'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 5.5, 0, Math.PI * 2);
            ctx.fillStyle = gr;
            ctx.fill();
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  СИСТЕМА 3 — STARLIGHT COMET (Artists)
//  3 слоя звёзд + параллакс мыши + диагональные кометы
// ─────────────────────────────────────────────────────────────

class StarlightCometSystem {
    constructor(canvas, density) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d', { alpha: true });
        this.density = density || 'normal';
        this.layers  = [];
        this.comets  = [];
        this.cometTimer    = 0;
        this.cometInterval = 5000 + Math.random() * 6000;
        // Параллакс
        this.targX = 0; this.targY = 0;
        this.currX = 0; this.currY = 0;
        this.w = 0; this.h = 0;
    }

    setMouse(mx, my) {
        if (!this.w) return;
        if (mx < 0 || my < 0) { this.targX = 0; this.targY = 0; return; }
        this.targX = mx / this.w - 0.5;
        this.targY = my / this.h - 0.5;
    }

    resize(pRM) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const sec = this.canvas.parentElement;
        this.w = sec.offsetWidth;
        this.h = sec.offsetHeight;

        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.layers = [];
        this.comets = [];
        if (pRM) return;

        const base = Math.min(580, Math.floor(this.w * this.h / 2900));
        const mult = this.density === 'light' ? 0.50 : 1.0;
        const counts = [0.55, 0.30, 0.15].map(f => Math.floor(base * f * mult));
        const parallax = [5, 12, 26];

        this.layers = counts.map((n, i) => {
            const stars = [];
            for (let j = 0; j < n; j++) stars.push(new Star(this.w, this.h, i, 3));
            return { stars, pf: parallax[i] };
        });

        // 5 слотов комет
        for (let i = 0; i < 5; i++) this.comets.push(new GoldComet(this.w, this.h));
    }

    animate(dt) {
        if (!this.layers.length) return;
        const ts = dt / 16.66;

        // Параллакс lerp
        const lf = Math.min(1, 0.038 * ts);
        this.currX += (this.targX - this.currX) * lf;
        this.currY += (this.targY - this.currY) * lf;

        this.ctx.clearRect(0, 0, this.w, this.h);

        for (const layer of this.layers) {
            const ox = this.currX * layer.pf;
            const oy = this.currY * layer.pf;
            for (const s of layer.stars) { s.update(ts); s.draw(this.ctx, ox, oy); }
        }

        // Кометы
        this.cometTimer += dt;
        if (this.cometTimer >= this.cometInterval) {
            this.cometTimer    = 0;
            this.cometInterval = 4500 + Math.random() * 7000;
            const free = this.comets.find(c => !c.active);
            if (free) free.reset();
        }
        for (const c of this.comets) {
            if (c.active) { c.update(ts); c.draw(this.ctx); }
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  СИСТЕМА 4 — COMET SYSTEM (Contacts / Stats)
//  Звёзды + золотые кометы (высокая частота)
// ─────────────────────────────────────────────────────────────

class CometSystem {
    constructor(canvas, density) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d', { alpha: true });
        this.density = density || 'normal';
        this.stars   = [];
        this.comets  = [];
        this.timer   = 0;
        this.nextIn  = 1400 + Math.random() * 2800;
        this.w = 0; this.h = 0;
    }

    resize(pRM) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const sec = this.canvas.parentElement;
        this.w = sec.offsetWidth;
        this.h = sec.offsetHeight;

        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.stars  = [];
        this.comets = [];
        if (pRM) return;

        let count = Math.min(340, Math.floor(this.w * this.h / 4600));
        if (this.density === 'light') count = Math.floor(count * 0.55);
        for (let i = 0; i < count; i++) this.stars.push(new Star(this.w, this.h, 1, 3));

        // Больше комет для эффектности
        for (let i = 0; i < 8; i++) this.comets.push(new GoldComet(this.w, this.h));
    }

    animate(dt) {
        if (!this.canvas) return;
        const ts = dt / 16.66;

        this.ctx.clearRect(0, 0, this.w, this.h);

        for (const s of this.stars)  { s.update(ts); s.draw(this.ctx, 0, 0); }

        this.timer += dt;
        if (this.timer >= this.nextIn) {
            this.timer  = 0;
            this.nextIn = 1600 + Math.random() * 2600;
            const free  = this.comets.find(c => !c.active);
            if (free) free.reset();
        }
        for (const c of this.comets) {
            if (c.active) { c.update(ts); c.draw(this.ctx); }
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  РЕЕСТР СИСТЕМ
// ─────────────────────────────────────────────────────────────
let heroSys     = null;
let servicesSys = null;
let starSystems = [];
let _starlightRef = null;  // для параллакса мыши (Artists)

// ─────────────────────────────────────────────────────────────
//  ЭКСПОРТ — полная совместимость с main.js v3.0
// ─────────────────────────────────────────────────────────────

/**
 * resizeCanvas — инициализирует/пересчитывает hero-canvas и services-canvas.
 */
export function resizeCanvas(pRM) {
    const heroEl = document.getElementById('hero-canvas');
    if (heroEl) {
        if (!heroSys) heroSys = new HeroParticleSystem(heroEl);
        heroSys.resize(pRM);
    }

    const svcEl = document.getElementById('services-canvas');
    if (svcEl) {
        if (!servicesSys) servicesSys = new GoldWaveSystem(svcEl);
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
 * initStars — создаёт системы для всех .stars-canvas-bg.
 *   data-style="starlight-comet" → StarlightCometSystem (Артисты)
 *   data-style="starlight"       → простой StarlightCometSystem без комет
 *   data-style="nebula"          → CometSystem (Контакты)
 */
export function initStars(pRM) {
    starSystems   = [];
    _starlightRef = null;

    document.querySelectorAll('.stars-canvas-bg').forEach(canvas => {
        const style   = canvas.dataset.style   || 'starlight';
        const density = canvas.dataset.density || 'normal';

        let sys;
        if (style === 'nebula') {
            sys = new CometSystem(canvas, density);
        } else {
            // starlight и starlight-comet — оба StarlightCometSystem
            // (кометы добавляются на canvas артистов data-style="starlight-comet")
            sys = new StarlightCometSystem(canvas, density);
        }

        sys.resize(pRM);
        starSystems.push(sys);

        if (!_starlightRef && sys instanceof StarlightCometSystem) {
            _starlightRef = sys;
        }
    });
}

/**
 * animateStars — анимирует все star/comet системы.
 */
export function animateStars(dt) {
    for (const sys of starSystems) sys.animate(dt);
}

/**
 * setCanvasMousePosition — параллакс для секции Артистов.
 * Вызвать с (-1,-1) при mouseleave.
 */
export function setCanvasMousePosition(mx, my) {
    if (_starlightRef) _starlightRef.setMouse(mx, my);
}

/**
 * setHeroMouse — передаёт координаты курсора в HeroParticleSystem.
 */
export function setHeroMouse(mx, my) {
    if (heroSys) heroSys.setMouse(mx, my);
}

/**
 * clearHeroMouse — убирает курсор из зоны Hero.
 */
export function clearHeroMouse() {
    if (heroSys) heroSys.clearMouse();
}
