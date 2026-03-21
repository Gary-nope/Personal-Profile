/**
 * Cloudflare Pages Function: /api/play-url
 * Params: source (netease | bilibili), track (JSON-encoded track object)
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// ===== Netease Play URL =====
async function neteaseGetUrl(id) {
    const res = await fetch('http://music.163.com/api/song/enhance/player/url?ids=[' + id + ']&br=320000', {
        headers: { 'User-Agent': UA, 'Referer': 'https://music.163.com', 'Cookie': 'appver=2.7.1.198277; os=pc;' },
    });
    const d = await res.json();
    if (d.data?.[0]?.url) return d.data[0].url;
    return 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3';
}

// ===== Netease Search (for bridge) =====
async function neteaseSearch(keyword) {
    const params = new URLSearchParams({ s: keyword, type: '1', limit: '5', offset: '0' });
    const res = await fetch('http://music.163.com/api/search/get/web?' + params, {
        headers: { 'User-Agent': UA, 'Referer': 'https://music.163.com', 'Cookie': 'appver=2.7.1.198277; os=pc;' },
    });
    const d = await res.json();
    return d.result?.songs || [];
}

// ===== Play URL Dispatcher =====
async function getPlayUrl(source, track) {
    // Bilibili → return proxy path
    if (source === 'bilibili') {
        const bvid = track.bvid || '';
        const aid = track.aid || '';
        return '/api/bilibili-audio?bvid=' + encodeURIComponent(bvid) + '&aid=' + encodeURIComponent(aid);
    }

    // Netease direct
    if (source === 'netease' && track.id) {
        try {
            const url = await neteaseGetUrl(track.id);
            if (url) return url;
        } catch (e) { /* fall through */ }
    }

    // Fallback: bridge via Netease search
    if (track.name) {
        try {
            const kw = track.artist ? track.name + ' ' + track.artist : track.name;
            const songs = await neteaseSearch(kw);
            if (songs.length > 0) {
                const url = await neteaseGetUrl(songs[0].id);
                if (url) return url;
            }
        } catch (e) { /* no fallback */ }
    }

    return null;
}

// ===== Handler =====
export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const source = url.searchParams.get('source') || 'netease';
    const trackJson = url.searchParams.get('track');

    if (!trackJson) {
        return new Response(JSON.stringify({ error: 'Missing track' }), {
            status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        const track = JSON.parse(decodeURIComponent(trackJson));
        const playUrl = await getPlayUrl(source, track);
        return new Response(JSON.stringify({ url: playUrl }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message, url: null }), {
            status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
}
