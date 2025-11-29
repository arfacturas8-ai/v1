const http = require('http');
const https = require('https');

function proxyAPI(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.url.startsWith('/api/')) {
        // Proxy to api.cryb.ai
        const apiUrl = 'https://api.cryb.ai' + req.url;
        
        https.get(apiUrl, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                res.writeHead(200);
                res.end(data);
            });
        }).on('error', (err) => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
}

module.exports = proxyAPI;