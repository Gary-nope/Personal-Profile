/**
 * Cloudflare Pages Function: /api/bilibili-audio
 * Proxies Bilibili audio streams (Bilibili requires Referer header)
 * Params: bvid, aid
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

async function biliGetCid(bvid, aid) {
    const params = bvid ? 'bvid=' + bvid : 'aid=' + aid;
    const res = await fetch('https://api.bilibili.com/x/web-interface/view?' + params, {
        headers: { 'User-Agent': UA },
    });
    const d = await res.json();
    return d.data?.cid;
}

async function biliGetAudioUrl(bvid, aid, cid) {
    if (!cid) cid = await biliGetCid(bvid, aid);
    if (!cid) return null;

    const params = (bvid ? 'bvid=' + bvid : 'aid=' + aid) + '&cid=' + cid + '&fnval=16';
    const res = await fetch('https://api.bilibili.com/x/player/playurl?' + params, {
        headers: { 'User-Agent': UA, 'Referer': 'https://www.bilibili.com' },
    });
    const d = await res.json();

    if (d.data?.dash?.audio?.length) {
        const audios = d.data.dash.audio.sort((a, b) => b.bandwidth - a.bandwidth);
        return audios[0].baseUrl || audios[0].base_url;
    }
    if (d.data?.durl?.[0]?.url) return d.data.durl[0].url;
    return null;
}

// ===== Handler =====
export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const bvid = url.searchParams.get('bvid') || '';
    const aid = url.searchParams.get('aid') || '';

    if (!bvid && !aid) {
        return new Response('Missing bvid or aid', {
            status: 400, headers: { 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        const audioUrl = await biliGetAudioUrl(bvid, aid);
        if (!audioUrl) {
            return new Response('No audio found', {
                status: 404, headers: { 'Access-Control-Allow-Origin': '*' },
            });
        }

        // Proxy the audio stream with required Bilibili headers
        const bvRef = bvid ? bvid : 'av' + aid;
        const audioRes = await fetch(audioUrl, {
            headers: {
                'User-Agent': UA,
                'Referer': 'https://www.bilibili.com/video/' + bvRef,
                'Accept': '*/*',
            },
        });

        // Stream the response back with proper CORS headers
        const headers = new Headers(audioRes.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=3600');
        // Ensure content type
        if (!headers.get('Content-Type')) {
            headers.set('Content-Type', 'audio/mp4');
        }

        return new Response(audioRes.body, {
            status: audioRes.status,
            headers,
        });
    } catch (err) {
        return new Response('Proxy error: ' + err.message, {
            status: 500, headers: { 'Access-Control-Allow-Origin': '*' },
        });
    }
}
