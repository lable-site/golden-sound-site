// ============================================================
//  animations.js — появление элементов и счётчики
// ============================================================

// ---- Анимация счётчиков ----
function animateValue(el, start, end, duration, prefersReducedMotion) {
    if (prefersReducedMotion) {
        el.innerHTML = end + (el.dataset.suffix || '');
        return;
    }

    let startTimestamp = null;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const eased = progress * (2 - progress); // ease-out
        const current = Math.floor(eased * (end - start) + start);
        el.innerHTML = current + (el.dataset.suffix || '');
        if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
}

// ---- Intersection Observer: reveal + запуск счётчиков ----
export function initReveal(prefersReducedMotion) {
    const elements = document.querySelectorAll('.reveal');

    if (prefersReducedMotion) {
        elements.forEach(el => {
            el.classList.add('active');
            const statNum = el.querySelector('.stat-number');
            if (statNum) {
                statNum.innerHTML = statNum.dataset.target + (statNum.dataset.suffix || '');
            }
        });
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add('active');

            // Если внутри есть счётчик — запускаем его
            const statNum = entry.target.querySelector('.stat-number');
            if (statNum && !statNum.dataset.animated) {
                statNum.dataset.animated = 'true';
                animateValue(
                    statNum,
                    0,
                    parseInt(statNum.dataset.target, 10),
                    2000,
                    prefersReducedMotion
                );
            }

            // Убираем will-change после завершения анимации
            setTimeout(() => {
                entry.target.style.willChange = 'auto';
            }, 1000);

            obs.unobserve(entry.target);
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
}
