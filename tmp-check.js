const https = require('https');

https.get('https://api.github.com/users/Gary-nope', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const user = JSON.parse(data);
            console.log('Public repos according to api.github.com/users:', user.public_repos);
        } catch(e) { console.log(e); }
    });
}).on('error', console.error);

https.get('https://api.github.com/users/Gary-nope/repos?per_page=100', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const repos = JSON.parse(data);
            console.log('Total repos returned in list API:', repos.length);
            console.log('Repo names:', repos.map(r => r.name).join(', '));
            console.log('Forks:', repos.map(r => r.fork).join(', '));
        } catch(e) { console.log(e); }
    });
}).on('error', console.error);
