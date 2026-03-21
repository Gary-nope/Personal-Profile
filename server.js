/**
 * Local Development Server — Music API Proxy
 * Sources: 网易云 (Netease) + B站 (Bilibili)
 * Run: node server.js → http://localhost:8080
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = 8080;
const STATIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
};

// ===== HTTP/HTTPS helper =====
function httpReq(targetUrl, opts = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(targetUrl);
        const isHttps = u.protocol === 'https:';
        const proto = isHttps ? https : http;
        const reqOpts = {
            hostname: u.hostname, port: u.port || (isHttps ? 443 : 80),
            path: u.pathname + u.search, method: opts.method || 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', ...(opts.headers || {}) },
        };
        const req = proto.request(reqOpts, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                httpReq(res.headers.location, opts).then(resolve).catch(reject); return;
            }
            let data = ''; res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
        if (opts.body) {
            const b = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
            req.setHeader('Content-Length', Buffer.byteLength(b));
            if (!opts.headers?.['Content-Type']) req.setHeader('Content-Type', 'application/json');
            req.write(b);
        }
        req.end();
    });
}

// Raw stream proxy — pipes response directly
function proxyStream(targetUrl, headers, res) {
    const u = new URL(targetUrl);
    const isHttps = u.protocol === 'https:';
    const proto = isHttps ? https : http;
    const reqOpts = {
        hostname: u.hostname, port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + u.search, method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', ...headers },
    };
    const req = proto.request(reqOpts, upstream => {
        if (!res.headersSent) {
            res.writeHead(upstream.statusCode, {
                'Content-Type': upstream.headers['content-type'] || 'audio/mp4',
                'Content-Length': upstream.headers['content-length'] || '',
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600',
            });
        }
        upstream.pipe(res);
    });
    req.on('error', err => {
        console.error('Proxy request error:', err.message);
        if (!res.headersSent) { res.writeHead(502); res.end('Proxy error'); }
        else { res.end(); }
    });
    req.setTimeout(30000, () => {
        console.warn('Proxy request timeout');
        req.destroy();
        if (!res.headersSent) { res.writeHead(504); res.end('Timeout'); }
        else { res.end(); }
    });
    req.end();
}

// ═══════════════════════════════════════════════
// 1. 网易云 (Netease)
// ═══════════════════════════════════════════════
async function neteaseSearch(keyword, page = 1) {
    const p = new URLSearchParams({ s: keyword, type: '1', limit: '20', offset: String((page - 1) * 20) });
    const r = await httpReq('http://music.163.com/api/search/get/web?' + p, {
        headers: { Referer: 'https://music.163.com', Cookie: 'appver=2.7.1.198277; os=pc;' },
    });
    const d = JSON.parse(r.data);
    return {
        songs: (d.result?.songs || []).map(s => ({
            id: s.id, name: s.name || '未知',
            artist: s.artists?.map(a => a.name).join(', ') || '未知',
            album: s.album?.name || '', artwork: s.album?.picUrl || '',
            duration: Math.floor((s.duration || 0) / 1000), source: 'netease',
        })),
        total: d.result?.songCount || 0,
    };
}

async function neteaseGetUrl(id) {
    const r = await httpReq('http://music.163.com/api/song/enhance/player/url?ids=[' + id + ']&br=320000', {
        headers: { Referer: 'https://music.163.com', Cookie: 'appver=2.7.1.198277; os=pc;' },
    });
    const d = JSON.parse(r.data);
    if (d.data?.[0]?.url) return d.data[0].url;
    return 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3';
}

// ═══════════════════════════════════════════════
// 2. Bilibili (B站)
// ═══════════════════════════════════════════════
let biliCookie = null;

async function getBiliCookie() {
    if (!biliCookie) {
        const r = await httpReq('https://api.bilibili.com/x/frontend/finger/spi', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        biliCookie = JSON.parse(r.data).data;
    }
    return biliCookie;
}

function getBiliCookieStr() {
    if (!biliCookie) return '';
    return 'buvid3=' + biliCookie.b_3 + ';buvid4=' + biliCookie.b_4;
}

function htmlDecode(str) {
    if (!str) return '';
    return str.replace(/<em[^>]*>/g, '').replace(/<\/em>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function biliSearch(keyword, page = 1) {
    await getBiliCookie();
    const p = new URLSearchParams({
        context: '', page: String(page), order: '', page_size: '20',
        keyword, duration: '', tids_1: '3', tids_2: '', __refresh__: 'true',
        _extra: '', highlight: '1', single_column: '0', platform: 'pc',
        from_source: '', search_type: 'video', dynamic_offset: '0',
    });
    const r = await httpReq('https://api.bilibili.com/x/web-interface/search/type?' + p, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            accept: 'application/json', origin: 'https://search.bilibili.com',
            referer: 'https://search.bilibili.com/', cookie: getBiliCookieStr(),
        },
    });
    const d = JSON.parse(r.data);
    const results = d.data?.result || [];
    return {
        songs: results.map(v => ({
            id: v.bvid || v.aid, bvid: v.bvid, aid: v.aid,
            name: htmlDecode(v.title),
            artist: v.author || '未知',
            album: v.bvid || '', artwork: v.pic?.startsWith('//') ? 'http:' + v.pic : v.pic || '',
            duration: typeof v.duration === 'string' ? v.duration.split(':').reduce((a, b) => 60 * a + +b, 0) : (v.duration || 0),
            source: 'bilibili',
        })),
        total: d.data?.numResults || 0,
    };
}

async function biliGetCid(bvid, aid) {
    const params = bvid ? 'bvid=' + bvid : 'aid=' + aid;
    const r = await httpReq('https://api.bilibili.com/x/web-interface/view?' + params, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const d = JSON.parse(r.data);
    return d.data?.cid;
}

async function biliGetAudioUrl(bvid, aid, cid) {
    if (!cid) cid = await biliGetCid(bvid, aid);
    if (!cid) return null;

    const params = (bvid ? 'bvid=' + bvid : 'aid=' + aid) + '&cid=' + cid + '&fnval=16';
    const r = await httpReq('https://api.bilibili.com/x/player/playurl?' + params, {
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.bilibili.com' },
    });
    const d = JSON.parse(r.data);

    if (d.data?.dash?.audio?.length) {
        const audios = d.data.dash.audio.sort((a, b) => b.bandwidth - a.bandwidth);
        return audios[0].baseUrl || audios[0].base_url;
    }
    if (d.data?.durl?.[0]?.url) return d.data.durl[0].url;
    return null;
}

// ═══════════════════════════════════════════════
// Play URL dispatcher
// ═══════════════════════════════════════════════
async function getPlayUrl(source, track) {
    // Bilibili: return a local proxy URL (since Bilibili audio needs Referer header)
    if (source === 'bilibili') {
        const bvid = track.bvid || '';
        const aid = track.aid || '';
        // Return a server-side proxy path
        return '/api/bilibili-audio?bvid=' + encodeURIComponent(bvid) + '&aid=' + encodeURIComponent(aid);
    }

    // Netease: direct URL
    if (source === 'netease' && track.id) {
        try {
            const url = await neteaseGetUrl(track.id);
            if (url) { console.log('✅ Netease:', track.name); return url; }
        } catch (e) { console.log('Netease failed:', e.message); }
    }

    // Fallback: bridge via Netease search
    if (track.name) {
        try {
            const kw = track.artist ? track.name + ' ' + track.artist : track.name;
            const nr = await neteaseSearch(kw);
            if (nr.songs.length > 0) {
                const url = await neteaseGetUrl(nr.songs[0].id);
                if (url) { console.log('✅ Netease bridge:', track.name); return url; }
            }
        } catch (e) { console.log('Netease bridge failed:', e.message); }
    }

    return null;
}

// ═══════════════════════════════════════════════
// HTTP Server
// ═══════════════════════════════════════════════
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const baseUrl = `http://${req.headers.host || 'localhost'}`;
    const p = new URL(req.url, baseUrl);
    const pathname = p.pathname;
    const searchParams = p.searchParams;

    // === Search ===
    if (pathname === '/api/search') {
        const keyword = searchParams.get('keyword') || searchParams.get('q') || '';
        const source = searchParams.get('source') || 'netease';
        if (!keyword) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"Missing keyword"}'); return; }

        try {
            const result = source === 'bilibili' ? await biliSearch(keyword) : await neteaseSearch(keyword);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(result));
        } catch (err) {
            console.error('Search error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message, songs: [] }));
        }
        return;
    }

    // === Play URL ===
    if (pathname === '/api/play-url') {
        const source = searchParams.get('source') || 'netease';
        const trackJson = searchParams.get('track');
        if (!trackJson) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"Missing track"}'); return; }

        try {
            const track = JSON.parse(decodeURIComponent(trackJson));
            const playUrl = await getPlayUrl(source, track);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ url: playUrl }));
        } catch (err) {
            console.error('Play URL error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message, url: null }));
        }
        return;
    }

    // === Bilibili Audio Proxy ===
    if (pathname === '/api/bilibili-audio') {
        const bvid = searchParams.get('bvid') || '';
        const aid = searchParams.get('aid') || '';
        if (!bvid && !aid) { res.writeHead(400); res.end('Missing bvid or aid'); return; }

        try {
            const audioUrl = await biliGetAudioUrl(bvid, aid);
            if (!audioUrl) { res.writeHead(404); res.end('No audio found'); return; }

            console.log('✅ Bilibili audio proxy:', bvid || aid);
            const bvRef = bvid ? bvid : 'av' + aid;
            proxyStream(audioUrl, {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/video/' + bvRef,
                'Accept': '*/*',
                'Accept-Encoding': 'identity',
            }, res);
        } catch (err) {
            console.error('Bilibili proxy error:', err.message);
            if (!res.headersSent) { res.writeHead(500); res.end('Proxy error'); }
        }
        return;
    }

    // === Static files ===
    let relPath = pathname === '/' ? 'index.html' : pathname;
    let filePath = path.join(STATIC_DIR, decodeURIComponent(relPath));

    if (!filePath.startsWith(STATIC_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }

    try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } catch {
        res.writeHead(404); res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   Giaory's Digital Space — Dev Server        ║
║                                              ║
║   🌐  http://localhost:${PORT}                 ║
║   📡  Sources: 网易云 / B站                   ║
║   🎵  /api/search?keyword=&source=           ║
║   🎵  /api/play-url?source=&track=           ║
║   🎵  /api/bilibili-audio?bvid=              ║
║                                              ║
║   Press Ctrl+C to stop                       ║
╚══════════════════════════════════════════════╝
`);
});
