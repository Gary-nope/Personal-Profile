/* ============================================
   GitHub API Integration
   ============================================ */

(function initGitHub() {
    const GITHUB_USERNAME = 'Gary-nope';
    const API_BASE = 'https://api.github.com';

    // Language colors mapping
    const LANG_COLORS = {
        'JavaScript': '#f7df1e',
        'TypeScript': '#3178c6',
        'Python': '#3776ab',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Java': '#b07219',
        'C++': '#f34b7d',
        'C#': '#239120',
        'Go': '#00add8',
        'Rust': '#dea584',
        'Ruby': '#cc342d',
        'PHP': '#777bb4',
        'Swift': '#ffac45',
        'Kotlin': '#a97bff',
        'Vue': '#41b883',
        'Shell': '#89e051',
        'Dart': '#00b4ab',
        'Jupyter Notebook': '#da5b0b',
    };

    // Fetch user stats
    async function fetchUserStats() {
        try {
            const response = await fetch(`${API_BASE}/users/${GITHUB_USERNAME}`);
            if (!response.ok) throw new Error('API limit');
            const data = await response.json();

            animateNumber('stat-repos', data.public_repos || 0);
            animateNumber('stat-followers', data.followers || 0);
            animateNumber('stat-following', data.following || 0);

            // Fetch total stars
            fetchTotalStars();
        } catch (err) {
            console.warn('GitHub API rate limited or unavailable:', err);
            setFallbackStats();
        }
    }

    // Fetch total stars across all repos
    async function fetchTotalStars() {
        try {
            const response = await fetch(`${API_BASE}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
            if (!response.ok) throw new Error('API limit');
            const repos = await response.json();

            const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
            animateNumber('stat-stars', totalStars);
        } catch (err) {
            console.warn('Could not fetch stars:', err);
        }
    }

    // Animate number counting up
    function animateNumber(elementId, target) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const duration = 1200;
        const startTime = performance.now();
        const startVal = 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startVal + (target - startVal) * eased);
            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // Set fallback stats if API fails
    function setFallbackStats() {
        document.getElementById('stat-repos').textContent = '—';
        document.getElementById('stat-stars').textContent = '—';
        document.getElementById('stat-followers').textContent = '—';
        document.getElementById('stat-following').textContent = '—';
    }

    // Fetch and render projects
    async function fetchProjects() {
        const container = document.getElementById('github-projects');
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE}/users/${GITHUB_USERNAME}/repos?per_page=10&sort=updated&direction=desc`);
            if (!response.ok) throw new Error('API limit');
            const repos = await response.json();

            // Filter out forks and profile repos, take top items
            const projects = repos
                .filter(r => !r.fork)
                .slice(0, 6);

            if (projects.length === 0) {
                container.innerHTML = `
                    <div class="project-placeholder">
                        <p>还没有公开项目，敬请期待！ 🚀</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = projects.map(repo => {
                const lang = repo.language || '';
                const langColor = LANG_COLORS[lang] || '#8b5cf6';
                const description = repo.description || '暂无描述';
                const stars = repo.stargazers_count || 0;

                return `
                    <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-item">
                        <div class="project-name">${repo.name}</div>
                        <div class="project-desc">${description}</div>
                        <div class="project-meta">
                            ${lang ? `
                                <span class="project-lang">
                                    <span class="tech-dot" style="background:${langColor}"></span>
                                    ${lang}
                                </span>
                            ` : ''}
                            ${stars > 0 ? `
                                <span class="project-stars">⭐ ${stars}</span>
                            ` : ''}
                        </div>
                    </a>
                `;
            }).join('');
        } catch (err) {
            console.warn('Could not fetch projects:', err);
            container.innerHTML = `
                <div class="project-placeholder">
                    <p>项目加载失败，请稍后再试 🔄</p>
                </div>
            `;
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
                wrapper.innerHTML = `
                    <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;">
                        贡献热力图加载失败，<a href="https://github.com/${GITHUB_USERNAME}" target="_blank">在 GitHub 上查看</a>
                    </div>
                `;
            }
        };
    }

    // Initialize
    fetchUserStats();
    fetchProjects();
    initHeatmap();
})();
