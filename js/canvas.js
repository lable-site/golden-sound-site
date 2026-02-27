// ============================================================
//  canvas.js — частицы (hero, services) + звёзды (artists, stats, socials)
// ============================================================

const mouse = { x: 0, y: 0, radius: 150 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// ============================================================
//  PARTICLES SYSTEM (Hero & Services) — не тронуто
// ============================================================

class ParticleSystem {
    constructor(canvasId, type) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.section = this.canvas.parentElement;
        this.ctx = this.canvas.getContext('2d', { alpha: type === 'services' });
        this.type = type;
        this.particles = [];
        this.w = 0;
        this.h = 0;
        this.bgColor = type === 'hero' ? '#030303' : null;
    }

    resize(prefersReducedMotion) {
        if (!this.canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = this.section.offsetWidth;
        this.h = this.section.offsetHeight;

        this.canvas.width = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (this.bgColor) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.w, this.h);
        } else {
            this.ctx.clearRect(0, 0, this.w, this.h);
        }

        this.particles = [];
        if (prefersReducedMotion) return;

        let amount = Math.max(80, Math.min(Math.floor(this.w * this.h / 10000), 300));
        if (this.type === 'services') amount = Math.floor(amount * 0.7);

        for (let i = 0; i < amount; i++) {
            const x = Math.random() * this.w;
            let y;
            if (this.type === 'hero') {
                const wave1 = this.h / 2 + Math.sin(x * 0.005) * 150;
                const wave2 = this.h / 2 + Math.cos(x * 0.005) * 150;
                y = (Math.random() > 0.5 ? wave1 : wave2) + (Math.random() * 100 - 50);
            } else {
                y = Math.random() * this.h;
            }
            this.particles.push(new Particle(x, y, this.ctx, this.type));
        }

        if (prefersReducedMotion) {
            this.particles.forEach(p => p.draw());
        }
    }

    animate(dt) {
        if (!this.canvas || this.particles.length === 0) return;
        const timeScale = dt / 16.66;

        if (this.bgColor) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.w, this.h);
        } else {
            this.ctx.clearRect(0, 0, this.w, this.h);
        }

        const rect = this.canvas.getBoundingClientRect();
        const localMouseX = mouse.x - rect.left;
        const localMouseY = mouse.y - rect.top;

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update(timeScale, localMouseX, localMouseY);
            this.particles[i].draw();
        }
    }
}

class Particle {
    constructor(x, y, ctx, type) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.type = type;
        this.size = Math.random() * 2.5 + 0.5;
        this.density = (Math.random() * 30) + 1;
        this.angle = Math.random() * 360;
        this.color = `rgba(${175 + Math.random()*40}, ${130 + Math.random()*45}, ${20 + Math.random()*40}, ${Math.random() * 0.8 + 0.2})`;
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    update(timeScale, mx, my) {
        this.angle += 0.02 * timeScale;

        const dx = mx - this.x;
        const dy = my - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius && distance > 0) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= (dx / distance) * force * this.density * timeScale;
            this.y -= (dy / distance) * force * this.density * timeScale;
        } else {
            const targetX = this.baseX;
            const amplitude = this.type === 'hero' ? 15 : 40;
            const targetY = this.baseY + Math.sin(this.angle) * amplitude;

            this.x -= ((this.x - targetX) / 15) * timeScale;
            this.y -= ((this.y - targetY) / 15) * timeScale;
        }
    }
}

// ============================================================
//  STARS SYSTEM
//  ЗАДАЧА 8: Звёзды в Artists — летят слева направо + trail
//  ЗАДАЧА 10: data-density="light" — мельче, тусклее, реже
// ============================================================

class Star {
    constructor(w, h, sectionId, density) {
        this.sectionId = sectionId;
        this.density = density || 'normal';
        // ЗАДАЧА 8: след только для секции артистов
        this.trailLength = (sectionId === 'artists') ? 5 : 0;
        this.trail = [];
        this.w = w;
        this.h = h;
        this.reset(true);
    }

    reset(initial = false) {
        if (this.sectionId === 'artists') {
            // ЗАДАЧА 8: Появляются слева, летят вправо и чуть вниз
            this.x = initial ? Math.random() * this.w : -10;
            this.y = Math.random() * this.h;
            this.speedX = Math.random() * 0.3 + 0.12;  // вправо
            this.speedY = (Math.random() - 0.3) * 0.07; // чуть вниз, иногда вверх
        } else {
            // Стандартное падение сверху вниз
            this.x = Math.random() * this.w;
            this.y = initial ? Math.random() * this.h : -5;
            this.speedX = (Math.random() - 0.5) * 0.15;
            this.speedY = Math.random() * 0.3 + 0.1;
        }

        // ЗАДАЧА 10: data-density="light" — мельче и тусклее
        if (this.density === 'light') {
            this.size = Math.random() * 0.6 + 0.2;
            this.alpha = Math.random() * 0.18 + 0.06;
        } else {
            this.size = Math.random() * 1.5 + 0.5;
            this.alpha = Math.random() * 0.4 + 0.2;
        }

        this.twinkleSpeed = Math.random() * 0.01 + 0.003;
        this.twinkleAngle = Math.random() * Math.PI * 2;
        this.trail = [];
    }

    update(timeScale) {
        // ЗАДАЧА 8: Сохраняем позиции для следа
        if (this.trailLength > 0) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) this.trail.shift();
        }

        this.x += this.speedX * timeScale;
        this.y += this.speedY * timeScale;
        this.twinkleAngle += this.twinkleSpeed * timeScale;

        if (this.sectionId === 'artists') {
            // Respawn слева когда ушла за правый край
            if (this.x > this.w + 15) this.reset(false);
        } else {
            // Respawn сверху когда ушла за низ или за бока
            if (this.y > this.h + 5 || this.x < -5 || this.x > this.w + 5) {
                this.reset(false);
            }
        }
    }

    draw(ctx) {
        // ЗАДАЧА 8: Рисуем след (только для artists)
        for (let i = 0; i < this.trail.length; i++) {
            const ratio = (i + 1) / this.trail.length;
            // Размер и прозрачность нарастают к голове звезды
            const trailA = this.alpha * ratio * 0.35;
            const trailSize = Math.max(0.1, this.size * ratio * 0.55);
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, trailSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 190, 80, ${trailA})`;
            ctx.fill();
        }

        // Основная звезда с мерцанием
        const flickerAmp = this.density === 'light' ? 0.05 : 0.14;
        const a = Math.max(0, Math.min(1, this.alpha + Math.sin(this.twinkleAngle) * flickerAmp));

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 220, 150, ${a})`;
        ctx.fill();
    }
}

class StarSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.stars = [];
        this.w = 0;
        this.h = 0;
        // Читаем секцию и плотность из атрибутов
        this.sectionId = canvas.parentElement?.id || '';
        this.density = canvas.dataset?.density || 'normal';
    }

    resize(prefersReducedMotion) {
        const section = this.canvas.parentElement;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = section.offsetWidth;
        this.h = section.offsetHeight;

        this.canvas.width = this.w * dpr;
        this.canvas.height = this.h * dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.stars = [];
        if (prefersReducedMotion) return;

        // ЗАДАЧА 10: Базовое количество звёзд, урезается при density=light
        let amount = Math.min(50, Math.floor(this.w * this.h / 20000));
        if (this.density === 'light') amount = Math.max(6, Math.floor(amount * 0.35));

        for (let i = 0; i < amount; i++) {
            this.stars.push(new Star(this.w, this.h, this.sectionId, this.density));
        }
    }

    animate(dt) {
        if (this.stars.length === 0) return;
        const timeScale = dt / 16.66;

        this.ctx.clearRect(0, 0, this.w, this.h);

        for (let i = 0; i < this.stars.length; i++) {
            this.stars[i].update(timeScale);
            this.stars[i].draw(this.ctx);
        }
    }
}

// ============================================================
//  EXPORTS — совместимы с main.js, ничего не удалено
// ============================================================

let heroSystem = null;
let servicesSystem = null;
let starSystems = [];

export function resizeCanvas(prefersReducedMotion) {
    if (!heroSystem) heroSystem = new ParticleSystem('hero-canvas', 'hero');
    heroSystem.resize(prefersReducedMotion);

    if (!servicesSystem) servicesSystem = new ParticleSystem('services-canvas', 'services');
    servicesSystem.resize(prefersReducedMotion);
}

export function animateParticles(dt) {
    if (heroSystem) heroSystem.animate(dt);
    if (servicesSystem) servicesSystem.animate(dt);
}

export function initStars(prefersReducedMotion) {
    if (starSystems.length === 0) {
        const canvases = document.querySelectorAll('.stars-canvas-bg');
        canvases.forEach(canvas => {
            starSystems.push(new StarSystem(canvas));
        });
    }
    starSystems.forEach(sys => sys.resize(prefersReducedMotion));
}

export function animateStars(dt) {
    starSystems.forEach(sys => sys.animate(dt));
}
