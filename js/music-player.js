/* ============================================
   Draggable Floating Music Player (Win95 Style)
   Multi-Source: 酷狗 / QQ音乐 / 网易云
   Source selection via #music-source-select
   ============================================ */

(function initMusicPlayer() {
    const player = document.getElementById('music-player');
    const triggerCard = document.getElementById('music-trigger-card');
    const closeBtn = document.getElementById('player-close');
    const dragHandle = document.getElementById('player-drag-handle');
    const playBtn = document.getElementById('player-play');
    const prevBtn = document.getElementById('player-prev');
    const nextBtn = document.getElementById('player-next');
    const downloadBtn = document.getElementById('player-download');
    const loopModeBtn = document.getElementById('player-loop-mode');
    const progressBar = document.getElementById('player-progress-bar');
    const progressFill = document.getElementById('player-progress-fill');
    const currentTimeEl = document.getElementById('player-current-time');
    const totalTimeEl = document.getElementById('player-total-time');
    const volumeSlider = document.getElementById('player-volume');
    const songNameEl = document.getElementById('player-song-name');
    const artistEl = document.getElementById('player-artist');
    const triggerTitleEl = document.getElementById('music-trigger-title');
    const searchInput = document.getElementById('player-search-input');
    const searchBtn = document.getElementById('player-search-btn');
    const searchResults = document.getElementById('player-search-results');
    const sourceSelect = document.getElementById('music-source-select');
    const openPlayerBtn = document.getElementById('music-open-player-btn');

    if (!player || !triggerCard) return;

    // ====== State ======
    let playlist = [];
    let currentIndex = -1;
    let isPlaying = false;
    let currentSongUrl = '';
    let loopMode = 'list'; // 'list' = sequential/list loop, 'single' = single repeat
    const audio = new Audio();
    audio.volume = 0.6;
    audio.preload = 'metadata';

    // ====== Win95 Pixel SVG Icons ======
    const SVG_PLAY = '<svg viewBox="0 0 14 14" width="16" height="16" fill="currentColor" style="shape-rendering:crispEdges"><polygon points="4,2 4,12 12,7"/></svg>';
    const SVG_PAUSE = '<svg viewBox="0 0 14 14" width="16" height="16" fill="currentColor" style="shape-rendering:crispEdges"><rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/></svg>';
    const SVG_LOOP_LIST = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="shape-rendering:crispEdges"><rect x="1" y="1" width="9" height="2"/><polygon points="10,0 14,2 10,4"/><rect x="12" y="4" width="2" height="3"/><rect x="6" y="13" width="9" height="2"/><polygon points="6,12 6,16 2,14"/><rect x="2" y="9" width="2" height="3"/></svg>';
    const SVG_LOOP_SINGLE = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="shape-rendering:crispEdges"><rect x="1" y="1" width="9" height="2"/><polygon points="10,0 14,2 10,4"/><rect x="12" y="4" width="2" height="3"/><rect x="6" y="13" width="9" height="2"/><polygon points="6,12 6,16 2,14"/><rect x="2" y="9" width="2" height="3"/><rect x="6" y="5" width="2" height="1"/><rect x="7" y="5" width="2" height="7"/><rect x="5" y="11" width="6" height="1"/></svg>';

    // ====== Get selected source ======
    function getSource() {
        return sourceSelect ? sourceSelect.value : 'netease';
    }

    // ====== Player Toggle via button ======
    if (openPlayerBtn) {
        openPlayerBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (player.style.display === 'none' || !player.style.display) {
                player.style.display = 'block';
            } else {
                player.style.display = 'none';
            }
        });
    }

    closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        player.style.display = 'none';
    });

    // ====== Search ======
    async function searchMusic(query) {
        const source = getSource();
        try {
            const res = await fetch(`/api/search?keyword=${encodeURIComponent(query)}&source=${source}`);
            if (res.ok) {
                const data = await res.json();
                return data.songs || [];
            }
        } catch (e) { console.error('Search error:', e.message); }
        return [];
    }

    // ====== Get Play URL ======
    async function getPlayUrl(track) {
        const source = getSource();
        const trackData = encodeURIComponent(JSON.stringify(track));
        try {
            const res = await fetch(`/api/play-url?source=${source}&track=${trackData}`);
            if (res.ok) {
                const data = await res.json();
                if (data.url) return data.url;
            }
        } catch (e) { console.warn('Play URL failed:', e.message); }
        return null;
    }

    // ====== Search UI ======
    let searchTimeout = null;

    async function performSearch(query) {
        if (!query.trim()) {
            searchResults.classList.remove('visible');
            searchResults.innerHTML = '';
            return;
        }

        const sourceName = sourceSelect?.selectedOptions[0]?.text || '酷狗';
        searchResults.innerHTML = `<div class="search-result-item" style="cursor:default;color:#808080;">🔍 正在从 ${esc(sourceName)} 搜索...</div>`;
        searchResults.classList.add('visible');

        const results = await searchMusic(query);

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item" style="cursor:default;color:#808080;">未找到匹配歌曲</div>';
            return;
        }

        playlist = results;

        searchResults.innerHTML = results.map((t, i) => `
            <div class="search-result-item" data-index="${i}">
                <span class="result-title">${esc(t.name)}</span>
                <span class="result-artist"> — ${esc(t.artist)}</span>
            </div>
        `).join('');

        searchResults.querySelectorAll('.search-result-item[data-index]').forEach(item => {
            item.addEventListener('click', async () => {
                await playSong(parseInt(item.getAttribute('data-index')));
                searchResults.classList.remove('visible');
            });
        });
    }

    function esc(text) {
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    searchBtn.addEventListener('click', () => performSearch(searchInput.value));
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(searchInput.value); });
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (searchInput.value.trim()) performSearch(searchInput.value);
            else searchResults.classList.remove('visible');
        }, 600);
    });

    document.addEventListener('click', e => {
        if (!player.contains(e.target)) searchResults.classList.remove('visible');
    });

    // ====== Play a Song ======
    async function playSong(index) {
        if (index < 0 || index >= playlist.length) return;
        currentIndex = index;
        const track = playlist[index];

        songNameEl.textContent = track.name;
        artistEl.textContent = track.artist;
        triggerTitleEl.textContent = track.name;
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = formatTime(track.duration);
        playBtn.innerHTML = '<svg viewBox="0 0 14 14" width="16" height="16" fill="currentColor" style="shape-rendering:crispEdges"><rect x="5" y="1" width="4" height="1"/><rect x="4" y="2" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="3" y="3" width="1" height="4"/><rect x="10" y="3" width="1" height="4"/><rect x="3" y="7" width="1" height="4"/><rect x="10" y="7" width="1" height="4"/><rect x="4" y="11" width="1" height="1"/><rect x="9" y="11" width="1" height="1"/><rect x="5" y="12" width="4" height="1"/><rect x="7" y="3" width="1" height="4"/><rect x="6" y="7" width="1" height="1"/><rect x="7" y="8" width="2" height="1"/></svg>';

        const url = await getPlayUrl(track);

        if (!url) {
            songNameEl.textContent = '⚠ 无法获取播放链接';
            playBtn.innerHTML = SVG_PLAY;
            return;
        }

        currentSongUrl = url;
        audio.src = url;

        try {
            await audio.play();
            isPlaying = true;
            playBtn.innerHTML = SVG_PAUSE;
            triggerCard.classList.add('playing');
        } catch (err) {
            console.error('Playback error:', err);
            songNameEl.textContent = '⚠ 播放失败';
            playBtn.innerHTML = SVG_PLAY;
            isPlaying = false;
        }
    }

    // ====== Controls ======
    playBtn.addEventListener('click', () => {
        if (currentIndex < 0) return;
        if (isPlaying) { audio.pause(); isPlaying = false; playBtn.innerHTML = SVG_PLAY; triggerCard.classList.remove('playing'); }
        else { audio.play().catch(() => { songNameEl.textContent = '⚠ 播放失败'; }); isPlaying = true; playBtn.innerHTML = SVG_PAUSE; triggerCard.classList.add('playing'); }
    });

    prevBtn.addEventListener('click', () => { if (playlist.length) playSong((currentIndex - 1 + playlist.length) % playlist.length); });
    nextBtn.addEventListener('click', () => { if (playlist.length) playSong((currentIndex + 1) % playlist.length); });

    // ====== Loop Mode Toggle ======
    if (loopModeBtn) {
        loopModeBtn.addEventListener('click', () => {
            if (loopMode === 'list') {
                loopMode = 'single';
                loopModeBtn.innerHTML = SVG_LOOP_SINGLE;
                loopModeBtn.title = '单曲循环';
            } else {
                loopMode = 'list';
                loopModeBtn.innerHTML = SVG_LOOP_LIST;
                loopModeBtn.title = '列表循环';
            }
        });
    }

    downloadBtn.addEventListener('click', () => {
        if (!currentSongUrl || currentIndex < 0) { alert('请先搜索并播放一首歌曲'); return; }
        window.open(currentSongUrl, '_blank');
    });

    // ====== Progress ======
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            progressFill.style.width = (audio.currentTime / audio.duration) * 100 + '%';
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    });
    audio.addEventListener('loadedmetadata', () => { totalTimeEl.textContent = formatTime(audio.duration); });
    progressBar.addEventListener('click', e => {
        const rect = progressBar.getBoundingClientRect();
        if (audio.duration) audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });
    audio.addEventListener('ended', () => {
        if (!playlist.length) return;
        if (loopMode === 'single') {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        } else {
            playSong((currentIndex + 1) % playlist.length);
        }
    });
    volumeSlider.addEventListener('input', e => { audio.volume = e.target.value / 100; });

    function formatTime(s) { if (isNaN(s)) return '0:00'; return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`; }

    // ====== Drag ======
    let isDragging = false, dx = 0, dy = 0;
    dragHandle.addEventListener('mousedown', startDrag);
    dragHandle.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
        if (e.target === closeBtn || closeBtn.contains(e.target)) return;
        isDragging = true;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const r = player.getBoundingClientRect();
        dx = cx - r.left; dy = cy - r.top;
        player.style.left = r.left + 'px'; player.style.top = r.top + 'px';
        player.style.right = 'auto'; player.style.bottom = 'auto';
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        e.preventDefault();
    }

    function onDrag(e) {
        if (!isDragging) return;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        player.style.left = Math.max(0, Math.min(cx - dx, window.innerWidth - player.offsetWidth)) + 'px';
        player.style.top = Math.max(0, Math.min(cy - dy, window.innerHeight - player.offsetHeight)) + 'px';
        e.preventDefault();
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('touchend', stopDrag);
    }
})();
