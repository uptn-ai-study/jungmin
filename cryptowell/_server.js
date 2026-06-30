const http = require('http');
const fs   = require('fs');
const path = require('path');
const ROOT = 'D:/claudestudy/cryptowell';
const MIME = { html:'text/html', js:'application/javascript', css:'text/css', png:'image/png', json:'application/json' };

http.createServer((req, res) => {
  const url      = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(ROOT, url);
  try {
    const data = fs.readFileSync(filePath);
    const ext  = filePath.split('.').pop();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  } catch(e) {
    res.writeHead(404); res.end('Not found');
  }
}).listen(3000, () => console.log('running'));
