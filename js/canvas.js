// ============================================================
//  canvas.js — Golden Sound v5.0 LUXURY 2026
//
//  Supabase-ready luxury template 2026
//
//  СИСТЕМЫ:
//  ① HeroParticleSystem     — spring particles + constellation lines
//                             + refraction glow + faint trails
//  ② GoldWaveSystem         — Services: gold sine waves + dust
//  ③ StarlightCometSystem   — Artists: 3-layer Starlight + parallax
//                             + diagonal gold comets
//  ④ CometSystem            — Contacts: starfield + gold comets
//
//  ОПТИМИЗАЦИИ v5:
//  • IntersectionObserver — canvas pauses when out of viewport
//  • requestIdleCallback  — heavy resize scheduled on idle
//  • Adaptive density     — ×0.65 on screens <768px
//  • Tab-out pause        — via visibilitychange in main.js
//  • RAF timestamp cap    — dt max 100ms after tab-switch
//  • DPR clamped to 2
//
//  API (совместим с main.js):
//    resizeCanvas(pRM)
//    animateParticles(dt)
//    initStars(pRM)
//    animateStars(dt)
//    setCanvasMousePosition(mx, my)
//    setHeroMouse(mx, my)
//    clearHeroMouse()
// ============================================================

const IS_MOBILE = () => window.innerWidth < 768;

// ═══════════════════════════════════════════════════════════
//  СИСТЕМА 1 — HERO PARTICLES
//  Spring physics + mouse repulsion + constellation lines
//  + refraction glow layers + faint light trails
// ═══════════════════════════════════════════════════════════

class HeroParticle {
    constructor(homeX, homeY, w, h) {
        this.homeX = homeX;
        this.homeY = homeY;
        this.w = w; this.h = h;

        this.x = homeX + (Math.random() - 0.5) * 120;
        this.y = homeY + (Math.random() - 0.5) * 120;
        this.vx = 0; this.vy = 0;

        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.00016 + Math.random() * 0.00022;
        this.driftR     = 8 + Math.random() * 18;

        this.size      = 0.6 + Math.random() * 1.7;
        this.baseAlpha = 0.20 + Math.random() * 0.44;
        this.phase     = Math.random() * Math.PI * 2;
        this.phaseSpd  = 0.005 + Math.random() * 0.013;

        // Trail history
        this.trailLen = this.size > 1.2 ? 6 : 0;
        this.trail    = [];

        // Warm gold spectrum
        this.r = 178 + ~~(Math.random() * 77);
        this.g = 128 + ~~(Math.random() * 72);
        this.b = 10  + ~~(Math.random() * 52);
        this.rgb = `${this.r},${this.g},${this.b}`;

        this.displaced = false;
    }

    update(ts, mouseX, mouseY) {
        // Drift home
        this.driftAngle += this.driftSpeed * ts;
        const dx0 = this.homeX + Math.cos(this.driftAngle) * this.driftR;
        const dy0 = this.homeY + Math.sin(this.driftAngle) * this.driftR;

        // Spring
        const k  = this.displaced ? 0.016 : 0.024;
        this.vx += (dx0 - this.x) * k * ts;
        this.vy += (dy0 - this.y) * k * ts;

        // Mouse repulsion
        if (mouseX !== null && mouseY !== null) {
            const mdx = this.x - mouseX;
            const mdy = this.y - mouseY;
            const d   = Math.sqrt(mdx * mdx + mdy * mdy);
            const rep = 155;
            if (d < rep && d > 0.5) {
                const f = ((rep - d) / rep) * 4.2;
                this.vx += (mdx / d) * f;
                this.vy += (mdy / d) * f;
                this.displaced = true;
            }
        } else {
            this.displaced = false;
        }

        this.vx *= 0.86;
        this.vy *= 0.86;

        // Trail snapshot
        if (this.trailLen > 0) {
            this.trail.unshift({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLen) this.trail.pop();
        }

        this.x += this.vx * ts;
        this.y += this.vy * ts;

        this.phase += this.phaseSpd * ts;
    }

    get alpha() {
        return this.baseAlpha * (0.50 + 0.50 * Math.sin(this.phase));
    }

    draw(ctx) {
        const a = this.alpha;
        if (a < 0.01) return;

        // Faint trail
        if (this.trail.length > 1 && a > 0.15) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const t = this.trail[i];
                const ta = a * (1 - i / this.trail.length) * 0.28;
                if (ta < 0.008) continue;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.size * (1 - i / this.trail.length) * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.rgb},${ta})`;
                ctx.fill();
            }
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${a})`;
        ctx.fill();

        // Refraction glow layers — concentric halos
        if (this.size > 1.3 && a > 0.28) {
            // Inner halo
            const gr1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5);
            gr1.addColorStop(0, `rgba(${this.rgb},${a * 0.24})`);
            gr1.addColorStop(0.4, `rgba(${this.rgb},${a * 0.08})`);
            gr1.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
            ctx.fillStyle = gr1;
            ctx.fill();

            // Outer diffuse halo (refraction effect)
            if (a > 0.40) {
                const gr2 = ctx.createRadialGradient(this.x, this.y, this.size * 4, this.x, this.y, this.size * 12);
                gr2.addColorStop(0, `rgba(255,220,120,${a * 0.06})`);
                gr2.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 12, 0, Math.PI * 2);
                ctx.fillStyle = gr2;
                ctx.fill();
            }
        }
    }
}

class HeroParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d', { alpha: true });
        this.parts  = [];
        this.mouseX = null; this.mouseY = null;
        this.w = 0; this.h = 0;
        this._isVisible = true;
        this._setupObserver();
    }

    _setupObserver() {
        if (!('IntersectionObserver' in window)) return;
        const io = new IntersectionObserver(
            ([entry]) => { this._isVisible = entry.isIntersecting; },
            { threshold: 0.05 }
        );
        io.observe(this.canvas);
    }

    setMouse(x,y) { this.mouseX = x; this.mouseY = y; }
    clearMouse()   { this.mouseX = null; this.mouseY = null; }

    resize(pRM) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const sec = this.canvas.parentElement;
        this.w = sec.offsetWidth  || window.innerWidth;
        this.h = Math.max(sec.offsetHeight || 0, window.innerHeight);

        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.parts = [];
        if (pRM) return;

        const area   = this.w * this.h;
        const mobile = IS_MOBILE();
        const count  = Math.min(mobile ? 110 : 190, Math.max(50, ~~(area / 5200)));
        const mul    = mobile ? 0.65 : 1.0;
        const final  = ~~(count * mul);

        const cx = this.w * 0.5;
        const cy = this.h * 0.48;

        for (let i = 0; i < final; i++) {
            let hx, hy;
            if (i < final * 0.70) {
                const ang = Math.random() * Math.PI * 2;
                const rn  = Math.sqrt(Math.random());
                hx = cx + Math.cos(ang) * rn * Math.min(this.w * 0.40, 420);
                hy = cy + Math.sin(ang) * rn * Math.min(this.h * 0.32, 260);
            } else {
                hx = Math.random() * this.w;
                hy = Math.random() * this.h;
            }
            this.parts.push(new HeroParticle(hx, hy, this.w, this.h));
        }
    }

    animate(dt) {
        if (!this._isVisible || !this.parts.length) return;
        const ts = dt / 16.66;

        this.ctx.clearRect(0, 0, this.w, this.h);

        // Constellation lines
        const MAX = 78;
        for (let i = 0; i < this.parts.length; i++) {
            const pi = this.parts[i];
            for (let j = i + 1; j < this.parts.length; j++) {
                const pj = this.parts[j];
                const dx = pi.x - pj.x;
                const dy = pi.y - pj.y;
                const d2 = dx*dx + dy*dy;
                if (d2 > MAX * MAX) continue;
                const a = (1 - Math.sqrt(d2)/MAX) * 0.065 * Math.min(pi.alpha, pj.alpha) * 3.5;
                if (a < 0.003) continue;
                this.ctx.beginPath();
                this.ctx.moveTo(pi.x, pi.y);
                this.ctx.lineTo(pj.x, pj.y);
                this.ctx.strokeStyle = `rgba(201,168,76,${a})`;
                this.ctx.lineWidth   = 0.45;
                this.ctx.stroke();
            }
        }

        for (const p of this.parts) {
            p.update(ts, this.mouseX, this.mouseY);
            p.draw(this.ctx);
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  СИСТЕМА 2 — GOLD WAVE (Services)
// ═══════════════════════════════════════════════════════════

class GoldDust {
    constructor(w,h) { this.w=w; this.h=h; this._reset(true); }
    _reset(init) {
        this.x = Math.random() * this.w;
        this.y = init ? Math.random() * this.h : this.h + 4;
        this.vx = (Math.random()-.5) * 0.12;
        this.vy = -(Math.random() * 0.16 + 0.04);
        this.size  = Math.random() * 1.0 + 0.2;
        this.baseA = Math.random() * 0.14 + 0.04;
        this.phase = Math.random() * Math.PI * 2;
        this.phSpd = 0.009 + Math.random() * 0.012;
        const r = 182 + ~~(Math.random() * 60);
        const g = 138 + ~~(Math.random() * 58);
        const b = 14  + ~~(Math.random() * 40);
        this.rgb = `${r},${g},${b}`;
    }
    update(ts) {
        this.phase += this.phSpd * ts;
        this.x += this.vx * ts;
        this.y += this.vy * ts;
        let a = this.baseA * (.5 + .5 * Math.sin(this.phase));
        if (this.y < this.h * 0.16) a *= this.y / (this.h * 0.16);
        this.alpha = Math.max(0, a);
        if (this.y < -5 || this.x < -6 || this.x > this.w+6) this._reset(false);
    }
    draw(ctx) {
        if (this.alpha < 0.01) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${this.rgb},${this.alpha})`;
        ctx.fill();
    }
}

const SVC_WAVES = [
    { freq:.0028, amp:.080, speed:.00022, phase:.60, yOff: .000, r:201,g:168,b:76,  aL:.120, aG:.035 },
    { freq:.0048, amp:.052, speed:.00038, phase:2.50, yOff: .055, r:228,g:190,b:84,  aL:.088, aG:.024 },
    { freq:.0085, amp:.032, speed:.00058, phase:4.80, yOff:-.055, r:165,g:115,b:30,  aL:.065, aG:.018 },
    { freq:.0018, amp:.105, speed:.00016, phase:1.20, yOff: .095, r:242,g:210,b:108, aL:.042, aG:.012 },
];

class GoldWaveSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d', { alpha: true });
        this.waves  = SVC_WAVES.map(w => ({ ...w }));
        this.dust   = [];
        this.w = 0; this.h = 0;
        this._isVisible = true;
        this._setupObserver();
    }
    _setupObserver() {
        if (!('IntersectionObserver' in window)) return;
        new IntersectionObserver(
            ([e]) => { this._isVisible = e.isIntersecting; },
            { threshold: 0.05 }
        ).observe(this.canvas);
    }
    resize(pRM) {
        const dpr = Math.min(window.devicePixelRatio||1,2);
        const sec = this.canvas.parentElement;
        this.w = sec.offsetWidth;
        this.h = sec.offsetHeight;
        this.canvas.width        = this.w * dpr;
        this.canvas.height       = this.h * dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr,0,0,dpr,0,0);
        this.dust = [];
        if (pRM) return;
        const n = Math.min(28, ~~(this.w*this.h/22000));
        for (let i=0;i<n;i++) this.dust.push(new GoldDust(this.w,this.h));
    }
    _drawWave(wave, ts) {
        const {ctx,w,h} = this;
        wave.phase += wave.speed * ts;
        const cy   = h * (.5 + wave.yOff);
        const amp  = wave.amp * h;
        const step = Math.max(2, ~~(w/520));
        ctx.beginPath();
        for (let x=0;x<=w;x+=step) {
            const y = cy + Math.sin(x*wave.freq + wave.phase) * amp;
            x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = `rgba(${wave.r},${wave.g},${wave.b},${wave.aG})`;
        ctx.lineWidth = 7; ctx.lineJoin='round'; ctx.stroke();
        ctx.beginPath();
        for (let x=0;x<=w;x+=step) {
            const y = cy + Math.sin(x*wave.freq + wave.phase) * amp;
            x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = `rgba(${wave.r},${wave.g},${wave.b},${wave.aL})`;
        ctx.lineWidth=1; ctx.stroke();
    }
    animate(dt) {
        if (!this._isVisible || !this.canvas) return;
        const ts = dt/16.66;
        this.ctx.clearRect(0,0,this.w,this.h);
        for (const w of this.waves) this._drawWave(w, ts);
        for (const d of this.dust)  { d.update(ts); d.draw(this.ctx); }
    }
}

// ═══════════════════════════════════════════════════════════
//  Shared Star class
// ═══════════════════════════════════════════════════════════

class Star {
    constructor(w,h,layerIdx,totalLayers) {
        this.w=w; this.h=h;
        this.lf = totalLayers>1 ? layerIdx/(totalLayers-1) : 0.5;
        this._reset(true);
    }
    _reset(init) {
        this.x = Math.random()*this.w;
        this.y = init ? Math.random()*this.h : Math.random()*this.h;
        this.size = (.10 + this.lf*.32) + Math.random()*(.18 + this.lf*1.05);
        this.baseAlpha = .12 + this.lf*.44 + Math.random()*.20;
        this.alpha = this.baseAlpha;
        this.twPhase = Math.random()*Math.PI*2;
        this.twSpeed = .003 + Math.random()*.013;
        this.twDepth = .18 + Math.random()*.38;
        const spd = .014 + this.lf*.052;
        const ang = Math.random()*Math.PI*2;
        this.vx = Math.cos(ang)*spd*(.5+Math.random()*.5);
        this.vy = Math.sin(ang)*spd*(.5+Math.random()*.5);
        if (Math.random() < .13) {
            this.rgb = `${210+~~(Math.random()*45)},${183+~~(Math.random()*42)},${95+~~(Math.random()*55)}`;
        } else {
            const v = 192 + ~~(Math.random()*63);
            this.rgb = `${v},${v},${Math.min(255,v+22)}`;
        }
        this.hasGlow = this.lf > .55 && this.size > .68;
    }
    update(ts) {
        this.twPhase += this.twSpeed*ts;
        this.alpha = this.baseAlpha*(1-this.twDepth+this.twDepth*(.5+.5*Math.sin(this.twPhase)));
        this.x += this.vx*ts; this.y += this.vy*ts;
        if (this.x<-2) this.x=this.w+2;
        if (this.x>this.w+2) this.x=-2;
        if (this.y<-2) this.y=this.h+2;
        if (this.y>this.h+2) this.y=-2;
    }
    draw(ctx, ox, oy) {
        if (this.alpha<.008) return;
        const x=this.x+(ox||0), y=this.y+(oy||0);
        if (x<-3||x>this.w+3||y<-3||y>this.h+3) return;
        ctx.beginPath();
        ctx.arc(x,y,this.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(${this.rgb},${this.alpha})`;
        ctx.fill();
        if (this.hasGlow && this.alpha>.32) {
            const gr=ctx.createRadialGradient(x,y,0,x,y,this.size*3.5);
            gr.addColorStop(0,`rgba(${this.rgb},${this.alpha*.22})`);
            gr.addColorStop(1,'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(x,y,this.size*3.5,0,Math.PI*2);
            ctx.fillStyle=gr; ctx.fill();
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  Shared GoldComet
// ═══════════════════════════════════════════════════════════

class GoldComet {
    constructor(w,h) { this.w=w; this.h=h; this.active=false; this.trail=[]; }
    reset() {
        this.x = -10 + Math.random()*this.w*.35;
        this.y = -10 + Math.random()*this.h*.30;
        const spd = 9 + Math.random()*12;
        const ang = Math.PI/6 + Math.random()*(Math.PI/5.5);
        this.vx = Math.cos(ang)*spd;
        this.vy = Math.sin(ang)*spd;
        this.trail=[];
        this.maxTrail = 16 + ~~(Math.random()*14);
        this.life=0; this.maxLife=50+Math.random()*40;
        this.maxAlpha=.55+Math.random()*.40; this.alpha=0;
        this.width=1.1+Math.random()*1.2;
        this.r=220+~~(Math.random()*35);
        this.g=172+~~(Math.random()*56);
        this.b=44+~~(Math.random()*72);
        this.active=true;
    }
    update(ts) {
        if (!this.active) return;
        this.trail.unshift({x:this.x,y:this.y});
        if (this.trail.length>this.maxTrail) this.trail.pop();
        this.life+=ts;
        const t=this.life/this.maxLife;
        this.alpha = t<.12
            ? this.maxAlpha*(t/.12)
            : this.maxAlpha*(1-(t-.12)/.88);
        this.alpha=Math.max(0,this.alpha);
        this.x+=this.vx*ts; this.y+=this.vy*ts;
        if (this.life>=this.maxLife) this.active=false;
    }
    draw(ctx) {
        if (!this.active||this.alpha<.005||this.trail.length<2) return;
        for (let i=0;i<this.trail.length-1;i++) {
            const p1=this.trail[i],p2=this.trail[i+1];
            const frac=1-i/this.trail.length;
            const a=this.alpha*frac*frac;
            ctx.beginPath();
            ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
            ctx.strokeStyle=`rgba(${this.r},${this.g},${this.b},${a})`;
            ctx.lineWidth=Math.max(.3,this.width*frac);
            ctx.lineCap='round'; ctx.stroke();
        }
        if (this.alpha>.04) {
            const gr=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.width*5.5);
            gr.addColorStop(0,`rgba(255,255,255,${this.alpha*.92})`);
            gr.addColorStop(.28,`rgba(${this.r},${this.g},${this.b},${this.alpha*.52})`);
            gr.addColorStop(1,'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(this.x,this.y,this.width*5.5,0,Math.PI*2);
            ctx.fillStyle=gr; ctx.fill();
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  СИСТЕМА 3 — STARLIGHT COMET (Artists)
//  3 слоя + параллакс + диагональные кометы
// ═══════════════════════════════════════════════════════════

class StarlightCometSystem {
    constructor(canvas, density) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d', { alpha:true });
        this.density = density||'normal';
        this.layers  = [];
        this.comets  = [];
        this.cometTimer    = 0;
        this.cometInterval = 5000+Math.random()*6000;
        this.targX=0; this.targY=0; this.currX=0; this.currY=0;
        this.w=0; this.h=0;
        this._isVisible=true;
        this._setupObserver();
    }
    _setupObserver() {
        if (!('IntersectionObserver' in window)) return;
        new IntersectionObserver(
            ([e]) => { this._isVisible=e.isIntersecting; },
            { threshold:0.05 }
        ).observe(this.canvas);
    }
    setMouse(mx,my) {
        if (!this.w) return;
        if (mx<0||my<0) { this.targX=0; this.targY=0; return; }
        this.targX=mx/this.w-.5; this.targY=my/this.h-.5;
    }
    resize(pRM) {
        const dpr = Math.min(window.devicePixelRatio||1,2);
        const sec = this.canvas.parentElement;
        this.w=sec.offsetWidth; this.h=sec.offsetHeight;
        this.canvas.width        = this.w*dpr;
        this.canvas.height       = this.h*dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr,0,0,dpr,0,0);
        this.layers=[]; this.comets=[];
        if (pRM) return;
        const mobile = IS_MOBILE();
        const mul = (this.density==='light'?.50:1.0) * (mobile?.65:1.0);
        const base = Math.min(520, ~~(this.w*this.h/2900));
        const counts=[.55,.30,.15].map(f => ~~(base*f*mul));
        const parallax=[5,12,26];
        this.layers=counts.map((n,i) => {
            const stars=[];
            for (let j=0;j<n;j++) stars.push(new Star(this.w,this.h,i,3));
            return {stars,pf:parallax[i]};
        });
        for (let i=0;i<5;i++) this.comets.push(new GoldComet(this.w,this.h));
    }
    animate(dt) {
        if (!this._isVisible||!this.layers.length) return;
        const ts=dt/16.66;
        const lf=Math.min(1,.038*ts);
        this.currX+=(this.targX-this.currX)*lf;
        this.currY+=(this.targY-this.currY)*lf;
        this.ctx.clearRect(0,0,this.w,this.h);
        for (const layer of this.layers) {
            const ox=this.currX*layer.pf;
            const oy=this.currY*layer.pf;
            for (const s of layer.stars) { s.update(ts); s.draw(this.ctx,ox,oy); }
        }
        this.cometTimer+=dt;
        if (this.cometTimer>=this.cometInterval) {
            this.cometTimer=0;
            this.cometInterval=4500+Math.random()*7000;
            const free=this.comets.find(c=>!c.active);
            if (free) free.reset();
        }
        for (const c of this.comets) if (c.active) { c.update(ts); c.draw(this.ctx); }
    }
}

// ═══════════════════════════════════════════════════════════
//  СИСТЕМА 4 — COMET SYSTEM (Contacts)
// ═══════════════════════════════════════════════════════════

class CometSystem {
    constructor(canvas, density) {
        this.canvas=canvas;
        this.ctx=canvas.getContext('2d',{alpha:true});
        this.density=density||'normal';
        this.stars=[]; this.comets=[];
        this.timer=0; this.nextIn=1400+Math.random()*2800;
        this.w=0; this.h=0;
        this._isVisible=true;
        this._setupObserver();
    }
    _setupObserver() {
        if (!('IntersectionObserver' in window)) return;
        new IntersectionObserver(
            ([e]) => { this._isVisible=e.isIntersecting; },
            { threshold:0.05 }
        ).observe(this.canvas);
    }
    resize(pRM) {
        const dpr=Math.min(window.devicePixelRatio||1,2);
        const sec=this.canvas.parentElement;
        this.w=sec.offsetWidth; this.h=sec.offsetHeight;
        this.canvas.width        = this.w*dpr;
        this.canvas.height       = this.h*dpr;
        this.canvas.style.width  = `${this.w}px`;
        this.canvas.style.height = `${this.h}px`;
        this.ctx.setTransform(dpr,0,0,dpr,0,0);
        this.stars=[]; this.comets=[];
        if (pRM) return;
        const mobile=IS_MOBILE();
        const mul=(this.density==='light'?.55:1.0)*(mobile?.65:1.0);
        let count=Math.min(320, ~~(this.w*this.h/4600));
        count=~~(count*mul);
        for (let i=0;i<count;i++) this.stars.push(new Star(this.w,this.h,1,3));
        for (let i=0;i<8;i++) this.comets.push(new GoldComet(this.w,this.h));
    }
    animate(dt) {
        if (!this._isVisible||!this.canvas) return;
        const ts=dt/16.66;
        this.ctx.clearRect(0,0,this.w,this.h);
        for (const s of this.stars) { s.update(ts); s.draw(this.ctx,0,0); }
        this.timer+=dt;
        if (this.timer>=this.nextIn) {
            this.timer=0; this.nextIn=1600+Math.random()*2600;
            const free=this.comets.find(c=>!c.active);
            if (free) free.reset();
        }
        for (const c of this.comets) if (c.active) { c.update(ts); c.draw(this.ctx); }
    }
}

// ═══════════════════════════════════════════════════════════
//  Registry
// ═══════════════════════════════════════════════════════════
let heroSys      = null;
let servicesSys  = null;
let starSystems  = [];
let _starlightRef= null;

// ── Helpers: scheduled resize via requestIdleCallback ──
function scheduleResize(fn) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(fn, { timeout: 300 });
    } else {
        setTimeout(fn, 0);
    }
}

export function resizeCanvas(pRM) {
    const heroEl = document.getElementById('hero-canvas');
    if (heroEl) {
        if (!heroSys) heroSys = new HeroParticleSystem(heroEl);
        heroSys.resize(pRM);
    }
    const svcEl = document.getElementById('services-canvas');
    if (svcEl) {
        if (!servicesSys) servicesSys = new GoldWaveSystem(svcEl);
        scheduleResize(() => servicesSys.resize(pRM));
    }
}

export function animateParticles(dt) {
    if (heroSys)     heroSys.animate(dt);
    if (servicesSys) servicesSys.animate(dt);
}

export function initStars(pRM) {
    starSystems  = [];
    _starlightRef= null;

    document.querySelectorAll('.stars-canvas-bg').forEach(canvas => {
        const style   = canvas.dataset.style   || 'starlight';
        const density = canvas.dataset.density || 'normal';
        let sys;
        if (style === 'nebula') {
            sys = new CometSystem(canvas, density);
        } else {
            sys = new StarlightCometSystem(canvas, density);
        }
        scheduleResize(() => sys.resize(pRM));
        starSystems.push(sys);
        if (!_starlightRef && sys instanceof StarlightCometSystem) _starlightRef = sys;
    });
}

export function animateStars(dt) {
    for (const sys of starSystems) sys.animate(dt);
}

export function setCanvasMousePosition(mx,my) {
    if (_starlightRef) _starlightRef.setMouse(mx,my);
}

export function setHeroMouse(mx,my) {
    if (heroSys) heroSys.setMouse(mx,my);
}

export function clearHeroMouse() {
    if (heroSys) heroSys.clearMouse();
}
