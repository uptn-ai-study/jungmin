const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = 'D:/claudestudy';
const MIME = { html:'text/html', js:'application/javascript', css:'text/css', png:'image/png', json:'application/json' };

http.createServer((req, res) => {
  const filePath = path.join(ROOT, req.url === '/' ? '/crypto_wishing_well_v2.html' : req.url);
  try {
    const data = fs.readFileSync(filePath);
    const ext  = filePath.split('.').pop();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  } catch(e) {
    res.writeHead(404); res.end('Not found: ' + filePath);
  }
}).listen(3000, () => console.log('OK'));
