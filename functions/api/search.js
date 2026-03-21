/**
 * Cloudflare Pages Function: /api/search
 * Params: keyword, source (netease | bilibili)
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// ===== Netease =====
async function neteaseSearch(keyword, page = 1) {
    const params = new URLSearchParams({ s: keyword, type: '1', limit: '20', offset: String((page - 1) * 20) });
    const res = await fetch('http://music.163.com/api/search/get/web?' + params, {
        headers: { 'User-Agent': UA, 'Referer': 'https://music.163.com', 'Cookie': 'appver=2.7.1.198277; os=pc;' },
    });
    const d = await res.json();
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

// ===== Bilibili =====
let biliCookie = null;

async function getBiliCookie() {
    if (!biliCookie) {
        const res = await fetch('https://api.bilibili.com/x/frontend/finger/spi', {
            headers: { 'User-Agent': UA },
        });
        const d = await res.json();
        biliCookie = d.data;
    }
    return biliCookie;
}

function getBiliCookieStr() {
    if (!biliCookie) return '';
    return 'buvid3=' + biliCookie.b_3 + ';buvid4=' + biliCookie.b_4;
}

function htmlDecode(str) {
    if (!str) return '';
    return str.replace(/<em[^>]*>/g, '').replace(/<\/em>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function biliSearch(keyword, page = 1) {
    await getBiliCookie();
    const params = new URLSearchParams({
        context: '', page: String(page), order: '', page_size: '20',
        keyword, duration: '', tids_1: '3', tids_2: '', __refresh__: 'true',
        _extra: '', highlight: '1', single_column: '0', platform: 'pc',
        from_source: '', search_type: 'video', dynamic_offset: '0',
    });
    const res = await fetch('https://api.bilibili.com/x/web-interface/search/type?' + params, {
        headers: {
            'User-Agent': UA, accept: 'application/json',
            origin: 'https://search.bilibili.com', referer: 'https://search.bilibili.com/',
            cookie: getBiliCookieStr(),
        },
    });
    const d = await res.json();
    const results = d.data?.result || [];
    return {
        songs: results.map(v => ({
            id: v.bvid || v.aid, bvid: v.bvid, aid: v.aid,
            name: htmlDecode(v.title), artist: v.author || '未知',
            album: v.bvid || '',
            artwork: v.pic?.startsWith('//') ? 'http:' + v.pic : v.pic || '',
            duration: typeof v.duration === 'string'
                ? v.duration.split(':').reduce((a, b) => 60 * a + +b, 0)
                : (v.duration || 0),
            source: 'bilibili',
        })),
        total: d.data?.numResults || 0,
    };
}

// ===== Handler =====
export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const keyword = url.searchParams.get('keyword') || url.searchParams.get('q') || '';
    const source = url.searchParams.get('source') || 'netease';

    if (!keyword) {
        return new Response(JSON.stringify({ error: 'Missing keyword' }), {
            status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        const result = source === 'bilibili' ? await biliSearch(keyword) : await neteaseSearch(keyword);
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message, songs: [] }), {
            status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
}
