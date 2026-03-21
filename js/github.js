/* ============================================
   GitHub Stats & Projects (Cached via /api/github-stats)
   Data refreshes every 30 minutes server-side.
   ============================================ */

(function initGitHub() {
    const GITHUB_USERNAME = 'Gary-nope';

    // Language colors mapping
    const LANG_COLORS = {
        'JavaScript': '#f7df1e', 'TypeScript': '#3178c6', 'Python': '#3776ab',
        'HTML': '#e34c26', 'CSS': '#563d7c', 'Java': '#b07219',
        'C++': '#f34b7d', 'C#': '#239120', 'Go': '#00add8',
        'Rust': '#dea584', 'Ruby': '#cc342d', 'PHP': '#777bb4',
        'Swift': '#ffac45', 'Kotlin': '#a97bff', 'Vue': '#41b883',
        'Shell': '#89e051', 'Dart': '#00b4ab', 'Jupyter Notebook': '#da5b0b',
    };

    // Animate number counting up
    function animateNumber(elementId, target) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const duration = 1200;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    }

    // Set fallback stats if API fails
    function setFallbackStats() {
        ['stat-repos', 'stat-stars', 'stat-followers', 'stat-following'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });
    }

    // Render projects list
    function renderProjects(projects) {
        const container = document.getElementById('github-projects');
        if (!container) return;

        if (!projects || projects.length === 0) {
            const msg = (typeof I18N !== 'undefined' && typeof currentLang !== 'undefined') ? I18N[currentLang]['projects.empty'] : '还没有公开项目，敬请期待！ 🚀';
            container.innerHTML = '<div class="project-placeholder"><p data-i18n="projects.empty">' + msg + '</p></div>';
            return;
        }

        container.innerHTML = projects.map(repo => {
            const langColor = LANG_COLORS[repo.language] || '#8b5cf6';
            return `
                <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-item">
                    <div class="project-name">${repo.name}</div>
                    <div class="project-desc">${repo.description}</div>
                    <div class="project-meta">
                        ${repo.language ? `
                            <span class="project-lang">
                                <span class="tech-dot" style="background:${langColor}"></span>
                                ${repo.language}
                            </span>
                        ` : ''}
                        ${repo.stars > 0 ? `<span class="project-stars">⭐ ${repo.stars}</span>` : ''}
                    </div>
                </a>
            `;
        }).join('');
    }

    // Fetch everything from cached endpoint (single request!)
    async function fetchAll() {
        try {
            const res = await fetch('/api/github-stats');
            if (!res.ok) throw new Error('API error ' + res.status);
            const data = await res.json();

            // Stats
            animateNumber('stat-repos', data.stats.public_repos);
            animateNumber('stat-stars', data.stats.stars);
            animateNumber('stat-followers', data.stats.followers);
            animateNumber('stat-following', data.stats.following);

            // Projects
            renderProjects(data.projects);
        } catch (err) {
            console.warn('GitHub data fetch failed:', err);
            setFallbackStats();
            const container = document.getElementById('github-projects');
            if (container) {
                const msg = (typeof I18N !== 'undefined' && typeof currentLang !== 'undefined') ? I18N[currentLang]['projects.loadFail'] : '项目加载失败，请稍后再试 🔄';
                container.innerHTML = '<div class="project-placeholder"><p data-i18n="projects.loadFail">' + msg + '</p></div>';
            }
        }
    }

    // Heatmap error handling
    function initHeatmap() {
        const img = document.getElementById('heatmap-img');
        if (!img) return;

        img.onerror = function () {
            this.style.display = 'none';
            const wrapper = document.getElementById('github-heatmap');
            if (wrapper) {
                        const failMsg = (typeof I18N !== 'undefined' && typeof currentLang !== 'undefined') ? I18N[currentLang]['heatmap.fail'] : '贡献热力图加载失败';
                        const viewMsg = (typeof I18N !== 'undefined' && typeof currentLang !== 'undefined') ? I18N[currentLang]['heatmap.viewOnGH'] : '在 GitHub 上查看';
                        wrapper.innerHTML = `
                    <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;">
                        <span data-i18n="heatmap.fail">${failMsg}</span>，<a href="https://github.com/${GITHUB_USERNAME}" target="_blank" data-i18n="heatmap.viewOnGH">${viewMsg}</a>
                    </div>
                `;
            }
        };
    }

    // Initialize
    fetchAll();
    initHeatmap();
})();
