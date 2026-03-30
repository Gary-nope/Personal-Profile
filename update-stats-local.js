const fs = require('fs');
const https = require('https');

function httpsGet(url, options = {}) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', ...options.headers } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return resolve(httpsGet(res.headers.location, options));
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status ${res.statusCode} from ${url}`));
            }
            let data = Buffer.alloc(0);
            res.on('data', chunk => data = Buffer.concat([data, chunk]));
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

(async () => {
    try {
        const username = 'Gary-nope';
        
        console.log('Fetching user profile...');
        const userBuf = await httpsGet(`https://api.github.com/users/${username}`);
        const user = JSON.parse(userBuf.toString());
        
        console.log('Fetching repos...');
        const reposBuf = await httpsGet(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated&direction=desc`);
        const repos = JSON.parse(reposBuf.toString());
        
        let totalStars = 0;
        repos.forEach(r => totalStars += (r.stargazers_count || 0));
        
        const projects = repos
            .filter(r => !r.fork)
            .slice(0, 6)
            .map(r => ({
                name: r.name,
                description: r.description || 'No description',
                html_url: r.html_url,
                language: r.language || '',
                stars: r.stargazers_count || 0
            }));
            
        const data = {
            stats: {
                public_repos: user.public_repos || 0,
                followers: user.followers || 0,
                following: user.following || 0,
                stars: totalStars,
            },
            projects,
            updated_at: new Date().toISOString(),
        };
        
        fs.writeFileSync('data/github-stats.json', JSON.stringify(data, null, 2));
        console.log('✅ github-stats.json updated successfully!');
        
        console.log('Downloading heatmap...');
        try {
            const svgBuf = await httpsGet(`https://ghchart.rshah.org/006d32/${username}`);
            fs.writeFileSync('data/heatmap.svg', svgBuf);
            console.log('✅ heatmap.svg updated successfully!');
        } catch (e) {
            console.log('⚠️ Heatmap download failed:', e.message);
        }
        
    } catch (e) {
        console.error('Error:', e);
    }
})();
