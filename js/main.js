/* ============================================
   Main JS — Particles, Typewriter, Scroll FX
   ============================================ */

// ====== Particle Canvas Background ======
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, particles, mouse;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    mouse = { x: -1000, y: -1000 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse interaction
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const force = (120 - dist) / 120;
                this.x -= dx * force * 0.02;
                this.y -= dy * force * 0.02;
            }

            // Wrap around
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    function init() {
        resize();
        const count = Math.min(Math.floor((width * height) / 12000), 120);
        particles = Array.from({ length: count }, () => new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    const opacity = (1 - dist / 100) * 0.15;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawConnections();
        requestAnimationFrame(animate);
    }

    init();
    animate();
    window.addEventListener('resize', () => {
        resize();
        // Reinitialize count on resize
        const count = Math.min(Math.floor((width * height) / 12000), 120);
        while (particles.length < count) particles.push(new Particle());
        while (particles.length > count) particles.pop();
    });
})();


// ====== Typewriter Effect ======
(function initTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;

    const phrases = [
        '// 在代码与创意之间探索无限可能',
        '> Full-stack developer & creator',
        '$ echo "Open source enthusiast"',
        '/* 用技术构建，用热情驱动 */',
        '> Debugging life, one commit at a time',
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const current = phrases[phraseIndex];

        if (isDeleting) {
            el.textContent = current.substring(0, charIndex - 1);
            charIndex--;
        } else {
            el.textContent = current.substring(0, charIndex + 1);
            charIndex++;
        }

        let delay = isDeleting ? 30 : 60;

        if (!isDeleting && charIndex === current.length) {
            delay = 2500; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            delay = 500; // Pause before new phrase
        }

        setTimeout(type, delay);
    }

    // Start after a small delay
    setTimeout(type, 800);
})();


// ====== Navbar Scroll Effect ======
(function initNavScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Active link highlighting
    const links = document.querySelectorAll('.nav-link');
    const sections = ['home', 'github-section', 'social-section', 'tech-section'];

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section && window.scrollY >= section.offsetTop - 150) {
                current = id;
            }
        });

        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
})();


// ====== Copy WeChat Name ======
(function initCopyBtn() {
    const copyBtn = document.getElementById('copy-wechat-name');
    const toast = document.getElementById('copy-toast');
    if (!copyBtn || !toast) return;

    copyBtn.addEventListener('click', async () => {
        const text = copyBtn.getAttribute('data-copy');
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }

        copyBtn.classList.add('copied');
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            copyBtn.classList.remove('copied');
        }, 2000);
    });
})();


// ====== Scroll Reveal Animation ======
(function initScrollReveal() {
    const cards = document.querySelectorAll('.bento-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(card => observer.observe(card));
})();

