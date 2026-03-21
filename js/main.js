/* ============================================
   Main JS — Particles, Typewriter, Scroll FX, i18n
   ============================================ */

// ====== i18n Translation System ======
const I18N = {
    zh: {
        'nav.site': 'Giaory 的个人站点',
        'nav.home': '首页',
        'nav.social': '社交',
        'nav.tech': '技术栈',
        'card.aboutMe': '关于我 - Giaory',
        'card.stats': 'GitHub 统计',
        'hero.bio': '一个热爱技术与创作的探索者。日常穿梭于代码与内容之间，专注于开源项目开发、效率工具构建和跨平台内容创作。相信技术可以改变生活，也乐于分享一路上的发现与思考。',
        'card.music': '音乐播放器',
        'music.clickPlay': '点击播放',
        'music.source': '📡 音源：',
        'music.netease': '网易云',
        'music.bilibili': 'B站',
        'music.openPlayer': '🎧 打开悬浮窗播放器',
        'card.contributions': 'GitHub 贡献',
        'heatmap.note': '⚠ 注意：私有仓库的贡献不会在此图表中显示',
        'card.xhs': '小红书',
        'xhs.title': '小红书',
        'xhs.visit': '访问主页 →',
        'xhs.empty': '📝 暂无笔记，敬请期待首次内容更新！',
        'card.wechat': '微信公众号',
        'wechat.label': '公众号名称',
        'wechat.desc': '微信搜索关注，获取更多精彩内容 ✨',
        'card.bilibili': 'B站',
        'bili.badge': '即将入驻',
        'bili.text': '敬请期待 Giaory 的视频内容 🎬',
        'card.tech': '技术栈与探索',
        'tech.opensource': '开源贡献',
        'card.projects': '近期项目',
        'projects.title': '近期项目',
        'projects.viewAll': '查看全部 →',
        'projects.loading': '加载中...',
        'footer.main': '由 <strong>Giaory</strong> 用 ❤️ 构建 &copy; 2026',
        'footer.sub': '由好奇心和深夜调试驱动 ☕',
        'player.title': '🎵 音乐播放器',
        'player.searchPlaceholder': '搜索歌曲...',
        'player.search': '搜索',
        'player.notPlaying': '未在播放',
        'toast.copied': '已复制到剪贴板！',
        'typewriter': [
            '// 在代码与创意之间探索无限可能',
            '> Full-stack developer & creator',
            '$ echo "Open source enthusiast"',
            '/* 用技术构建，用热情驱动 */',
            '> Debugging life, one commit at a time',
        ],
    },
    en: {
        'nav.site': "Giaory's Site",
        'nav.home': 'Home',
        'nav.social': 'Social',
        'nav.tech': 'Tech',
        'card.aboutMe': 'About Me - Giaory',
        'card.stats': 'GitHub Stats',
        'hero.bio': 'A passionate explorer of technology and creation. I navigate between code and content daily, focusing on open-source development, productivity tools, and cross-platform content creation. I believe technology can change lives, and I love sharing my discoveries along the way.',
        'card.music': 'Music Player',
        'music.clickPlay': 'Click to play',
        'music.source': '📡 Source:',
        'music.netease': 'NetEase',
        'music.bilibili': 'Bilibili',
        'music.openPlayer': '🎧 Open Player',
        'card.contributions': 'GitHub Contributions',
        'heatmap.note': '⚠ Note: Contributions from private repos are not shown',
        'card.xhs': 'Xiaohongshu (RED)',
        'xhs.title': 'Xiaohongshu',
        'xhs.visit': 'Visit →',
        'xhs.empty': '📝 No posts yet. Stay tuned for updates!',
        'card.wechat': 'WeChat Official',
        'wechat.label': 'Account Name',
        'wechat.desc': 'Search and follow on WeChat for more ✨',
        'card.bilibili': 'Bilibili',
        'bili.badge': 'Coming Soon',
        'bili.text': 'Stay tuned for video content by Giaory 🎬',
        'card.tech': 'Tech Stack & Exploration',
        'tech.opensource': 'Open Source',
        'card.projects': 'Recent Projects',
        'projects.title': 'Recent Projects',
        'projects.viewAll': 'View All →',
        'projects.loading': 'Loading...',
        'footer.main': 'Built with ❤️ by <strong>Giaory</strong> &copy; 2026',
        'footer.sub': 'Powered by curiosity and late-night debugging ☕',
        'player.title': '🎵 Music Player',
        'player.searchPlaceholder': 'Search songs...',
        'player.search': 'Search',
        'player.notPlaying': 'Not playing',
        'toast.copied': 'Copied to clipboard!',
        'typewriter': [
            '// Exploring infinite possibilities',
            '> Full-stack developer & creator',
            '$ echo "Open source enthusiast"',
            '/* Build with tech, drive with passion */',
            '> Debugging life, one commit at a time',
        ],
    },
};

let currentLang = localStorage.getItem('site-lang') || 'zh';

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('site-lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    const dict = I18N[lang];

    // Update all data-i18n elements (textContent)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined && typeof dict[key] === 'string') {
            el.textContent = dict[key];
        }
    });

    // Update all data-i18n-html elements (innerHTML)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (dict[key] !== undefined) {
            el.innerHTML = dict[key];
        }
    });

    // Update all data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key] !== undefined) {
            el.placeholder = dict[key];
        }
    });

    // Update toggle button text
    const langText = document.getElementById('lang-text');
    if (langText) langText.textContent = lang === 'zh' ? 'EN' : '中';
}

// Init language toggle
(function initI18n() {
    const btn = document.getElementById('lang-toggle');
    if (btn) {
        btn.addEventListener('click', () => {
            applyLanguage(currentLang === 'zh' ? 'en' : 'zh');
            // Restart typewriter with new phrases
            restartTypewriter();
        });
    }
    // Apply saved language on load
    applyLanguage(currentLang);
})();


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
        const count = Math.min(Math.floor((width * height) / 12000), 120);
        while (particles.length < count) particles.push(new Particle());
        while (particles.length > count) particles.pop();
    });
})();


// ====== Typewriter Effect ======
let typewriterTimeout = null;

function restartTypewriter() {
    if (typewriterTimeout) clearTimeout(typewriterTimeout);
    const el = document.getElementById('typewriter');
    if (el) el.textContent = '';
    startTypewriter();
}

function startTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;

    const phrases = I18N[currentLang].typewriter;
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
            delay = 2500;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            delay = 500;
        }

        typewriterTimeout = setTimeout(type, delay);
    }

    typewriterTimeout = setTimeout(type, 800);
}

// Start typewriter on load
startTypewriter();


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
