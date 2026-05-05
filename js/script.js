// ===== PARTICLE CANVAS BACKGROUND =====
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPowerMode = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Mouse tracking
const mouse = { x: -500, y: -500 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// --- Particles ---
const particles = [];
const PARTICLE_COUNT = reducedMotion ? 0 : (lowPowerMode ? 55 : 90);

for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2.2 + 0.5,
        alpha: Math.random() * 0.5 + 0.15,
    });
}

// --- Floating crypto shapes ---
const shapes = [];
const SHAPE_COUNT = reducedMotion ? 0 : (lowPowerMode ? 10 : 18);
const shapeTypes = ['hex', 'diamond', 'ring', 'triangle'];

for (let i = 0; i < SHAPE_COUNT; i++) {
    shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -Math.random() * 0.2 - 0.06,
        size: Math.random() * 22 + 10,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.006,
        alpha: Math.random() * 0.2 + 0.08,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
    });
}

// --- Ambient floating orbs ---
const orbs = [];
const ORB_COUNT = reducedMotion ? 0 : (lowPowerMode ? 3 : 5);
for (let i = 0; i < ORB_COUNT; i++) {
    orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        radius: Math.random() * 120 + 80,
        alpha: Math.random() * 0.04 + 0.02,
    });
}

function drawHex(x, y, size, rotation) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + rotation;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawDiamond(x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();
    ctx.restore();
}

function drawTriangle(x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const px = size * Math.cos(angle);
        const py = size * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.restore();
}

function drawRing(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
}

let time = 0;
let isPageVisible = true;
let lastFrameTime = 0;
const targetFrameMs = lowPowerMode ? 40 : 30;

document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
});

function drawParticles(now = 0) {
    if (!isPageVisible) {
        requestAnimationFrame(drawParticles);
        return;
    }

    if (now - lastFrameTime < targetFrameMs) {
        requestAnimationFrame(drawParticles);
        return;
    }

    lastFrameTime = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += 0.005;

    // --- Ambient orbs (large soft glowing circles) ---
    orbs.forEach(o => {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -o.radius) o.x = canvas.width + o.radius;
        if (o.x > canvas.width + o.radius) o.x = -o.radius;
        if (o.y < -o.radius) o.y = canvas.height + o.radius;
        if (o.y > canvas.height + o.radius) o.y = -o.radius;

        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
        grad.addColorStop(0, `rgba(200, 169, 106, ${o.alpha * 1.5})`);
        grad.addColorStop(0.5, `rgba(200, 169, 106, ${o.alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(200, 169, 106, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // --- Hex grid near mouse (brighter) ---
    const gridSize = 48;
    const mouseRadius = 280;
    const startCol = Math.max(0, Math.floor((mouse.x - mouseRadius) / gridSize));
    const endCol = Math.min(Math.ceil(canvas.width / gridSize), Math.ceil((mouse.x + mouseRadius) / gridSize));
    const startRow = Math.max(0, Math.floor((mouse.y - mouseRadius) / (gridSize * 0.866)));
    const endRow = Math.min(Math.ceil(canvas.height / (gridSize * 0.866)), Math.ceil((mouse.y + mouseRadius) / (gridSize * 0.866)));

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const x = col * gridSize + (row % 2 ? gridSize * 0.5 : 0);
            const y = row * gridSize * 0.866;
            const distToMouse = Math.sqrt((x - mouse.x) ** 2 + (y - mouse.y) ** 2);
            if (distToMouse < mouseRadius) {
                const alpha = 0.18 * (1 - distToMouse / mouseRadius);
                drawHex(x, y, 14, 0);
                ctx.strokeStyle = `rgba(200, 169, 106, ${alpha})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }
    }

    // --- Connections between nearby particles ---
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(200, 169, 106, ${0.15 * (1 - dist / 160)})`;
                ctx.lineWidth = 0.6;
                ctx.stroke();
            }
        }
    }

    // --- Dust particles with mouse interaction ---
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const distToMouse = Math.sqrt((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2);
        const mouseBoost = distToMouse < 200 ? (1 - distToMouse / 200) * 0.5 : 0;

        // Glow effect for each particle
        if (p.size > 1.2 || mouseBoost > 0.1) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4 + mouseBoost * 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 169, 106, ${(p.alpha * 0.08) + mouseBoost * 0.06})`;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + mouseBoost * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 169, 106, ${p.alpha + mouseBoost})`;
        ctx.fill();

        // Lines to mouse
        if (distToMouse < 180) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(200, 169, 106, ${0.2 * (1 - distToMouse / 180)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    });

    // --- Floating geometric shapes ---
    shapes.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;

        if (s.y < -s.size * 2) { s.y = canvas.height + s.size * 2; s.x = Math.random() * canvas.width; }
        if (s.x < -s.size * 2) s.x = canvas.width + s.size * 2;
        if (s.x > canvas.width + s.size * 2) s.x = -s.size * 2;

        // Shape glow
        const glowGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2);
        glowGrad.addColorStop(0, `rgba(200, 169, 106, ${s.alpha * 0.3})`);
        glowGrad.addColorStop(1, 'rgba(200, 169, 106, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(200, 169, 106, ${s.alpha})`;
        ctx.lineWidth = 1;

        if (s.type === 'hex') {
            drawHex(s.x, s.y, s.size, s.rotation);
            ctx.stroke();
        } else if (s.type === 'diamond') {
            drawDiamond(s.x, s.y, s.size, s.rotation);
            ctx.stroke();
        } else if (s.type === 'triangle') {
            drawTriangle(s.x, s.y, s.size, s.rotation);
            ctx.stroke();
        } else {
            drawRing(s.x, s.y, s.size);
            ctx.stroke();
        }
    });

    // --- Large mouse glow ---
    if (mouse.x > 0 && mouse.y > 0) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
        grad.addColorStop(0, 'rgba(200, 169, 106, 0.1)');
        grad.addColorStop(0.4, 'rgba(200, 169, 106, 0.04)');
        grad.addColorStop(1, 'rgba(200, 169, 106, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(drawParticles);
}

drawParticles();

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(11, 15, 26, 0.98)';
    } else {
        navbar.style.background = 'rgba(11, 15, 26, 0.9)';
    }
});

// ===== MOBILE NAV TOGGLE =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    const isOpen = navLinks.style.display === 'flex';
    navLinks.style.display = isOpen ? 'none' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '60px';
    navLinks.style.right = '1.5rem';
    navLinks.style.background = 'rgba(11, 15, 26, 0.98)';
    navLinks.style.padding = '1rem 2rem';
    navLinks.style.border = '1px solid rgba(200, 169, 106, 0.18)';
    navLinks.style.borderRadius = '8px';
    navLinks.style.gap = '1rem';
});

// Close nav on link click (mobile)
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
            navLinks.style.display = 'none';
        }
    });
});

// ===== SCROLL REVEAL ANIMATION =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.glass-card, .section-title').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 120) {
            current = section.getAttribute('id');
        }
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.style.color = a.getAttribute('href') === `#${current}`
            ? 'var(--accent)'
            : 'var(--text-muted)';
    });
});

// ===== IMAGE LOADING STABILITY =====
const mediaImages = Array.from(document.querySelectorAll('.artifact-photo, .restoration-photo, .gallery-photo'));

function markImageLoaded(img) {
    img.classList.remove('is-error');
    img.classList.add('is-loaded');
}

function markImageError(img) {
    img.classList.add('is-error');
}

function buildRetryUrl(src, attempt) {
    const url = new URL(src, window.location.href);
    url.searchParams.set('img-retry', String(attempt));
    return url.toString();
}

function retryImageLoad(img) {
    const currentAttempt = Number(img.dataset.retryAttempt || '0');
    if (currentAttempt >= 2) {
        markImageError(img);
        return;
    }

    const nextAttempt = currentAttempt + 1;
    const source = img.currentSrc || img.getAttribute('src');
    if (!source) {
        markImageError(img);
        return;
    }

    img.dataset.retryAttempt = String(nextAttempt);
    img.src = buildRetryUrl(source, nextAttempt);
}

const galleryImages = mediaImages.filter(img => img.classList.contains('gallery-photo'));

mediaImages.forEach((img) => {
    const galleryIndex = galleryImages.indexOf(img);
    if (galleryIndex > -1 && galleryIndex < 6) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
    }

    img.addEventListener('load', () => {
        if (img.naturalWidth > 0) {
            markImageLoaded(img);
        } else {
            retryImageLoad(img);
        }
    });

    img.addEventListener('error', () => {
        retryImageLoad(img);
    });

    if (img.complete) {
        if (img.naturalWidth > 0) {
            markImageLoaded(img);
        } else {
            retryImageLoad(img);
        }
    }
});

if ('IntersectionObserver' in window) {
    const preloadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const img = entry.target;
            const prefetch = new Image();
            prefetch.src = img.currentSrc || img.src;
            observer.unobserve(img);
        });
    }, { rootMargin: '700px 0px' });

    mediaImages.forEach(img => preloadObserver.observe(img));
}

// ===== LIGHTBOX =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');

let lightboxItems = [];
let lightboxIndex = 0;

function openLightbox(index) {
    lightboxIndex = index;
    const item = lightboxItems[index];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    lightboxCaption.textContent = item.alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateArrows();
}

function closeLightbox() {
    lightbox.classList.remove('active');
    lightboxImg.src = '';
    document.body.style.overflow = '';
}

function showPrev() {
    if (lightboxIndex > 0) openLightbox(lightboxIndex - 1);
}

function showNext() {
    if (lightboxIndex < lightboxItems.length - 1) openLightbox(lightboxIndex + 1);
}

function updateArrows() {
    document.querySelector('.lightbox-prev').style.opacity = lightboxIndex === 0 ? '0.25' : '1';
    document.querySelector('.lightbox-next').style.opacity = lightboxIndex === lightboxItems.length - 1 ? '0.25' : '1';
}

lightboxItems = Array.from(document.querySelectorAll('.artifact-photo, .restoration-photo, .gallery-photo'));

lightboxItems.forEach((img, index) => {
    img.addEventListener('click', () => openLightbox(index));
});

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-prev').addEventListener('click', showPrev);
document.querySelector('.lightbox-next').addEventListener('click', showNext);

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
});

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
const contactFormStatus = document.getElementById('contactFormStatus');

if (contactForm && contactFormStatus) {
    const submitButton = contactForm.querySelector('.form-submit');

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = String(formData.get('name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const phone = String(formData.get('phone') || '').trim();
        const subject = String(formData.get('subject') || '').trim();
        const message = String(formData.get('message') || '').trim();

        contactFormStatus.classList.remove('is-success', 'is-error');

        if (!name || !email || !subject || !message) {
            contactFormStatus.textContent = 'Будь ласка, заповніть усі обов\'язкові поля.';
            contactFormStatus.classList.add('is-error');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            contactFormStatus.textContent = 'Вкажіть коректну адресу email.';
            contactFormStatus.classList.add('is-error');
            return;
        }

        const telegramConfig = window.TELEGRAM_CONFIG || {};
        const botToken = String(telegramConfig.botToken || '').trim();
        const chatId = String(telegramConfig.chatId || '').trim();

        if (!botToken || !chatId) {
            contactFormStatus.textContent = 'Не налаштовано Telegram Bot. Перевірте js/env.js';
            contactFormStatus.classList.add('is-error');
            return;
        }

        const telegramMessage = [
            'Нове повідомлення з сайту:',
            `Ім\'я: ${name}`,
            `Email: ${email}`,
            `Телефон: ${phone || 'не вказано'}`,
            `Тема: ${subject}`,
            '',
            message,
        ].join('\n');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Відправляю...';
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: telegramMessage,
                }),
            });

            if (!response.ok) {
                throw new Error('Telegram request failed');
            }

            const result = await response.json();
            if (!result.ok) {
                throw new Error('Telegram API returned not ok');
            }

            contactFormStatus.textContent = 'Повідомлення успішно надіслано в Telegram.';
            contactFormStatus.classList.add('is-success');
            contactForm.reset();
        } catch (error) {
            contactFormStatus.textContent = 'Не вдалося відправити в Telegram. Спробуйте ще раз.';
            contactFormStatus.classList.add('is-error');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Надіслати';
            }
        }
    });
}