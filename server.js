const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-HRFlow-Source, Accept');
}

function sendJson(res, status, payload) {
  setCorsHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.normalize(path.join(PUBLIC_DIR, filePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return sendJson(res, 404, { error: 'Not found' });
    }

    const ext = path.extname(filePath).toLowerCase();
    const map = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': map[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function proxyRequest(req, res, targetUrl) {
  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    body = Buffer.concat(body);

    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid target URL' });
    }

    const transport = parsed.protocol === 'https:' ? https : http;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': body.length
      }
    };

    const proxyReq = transport.request(parsed, options, proxyRes => {
      let responseBody = [];
      proxyRes.on('data', chunk => responseBody.push(chunk));
      proxyRes.on('end', () => {
        const payload = {
          proxyStatus: proxyRes.statusCode,
          proxyHeaders: proxyRes.headers,
          responseBody: Buffer.concat(responseBody).toString('utf8')
        };
        sendJson(res, 200, payload);
      });
    });

    proxyReq.on('error', err => {
      sendJson(res, 502, { error: 'Proxy request failed', message: err.message });
    });

    proxyReq.write(body);
    proxyReq.end();
  });
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  if (reqUrl.pathname === '/proxy' && req.method === 'POST') {
    const target = reqUrl.searchParams.get('target');
    if (!target) {
      return sendJson(res, 400, { error: 'Missing target parameter' });
    }
    return proxyRequest(req, res, target);
  }

  serveStatic(req, res, reqUrl.pathname);
});

server.listen(PORT, () => {
  console.log(`CORS proxy server running on http://localhost:${PORT}`);
  console.log('Serving files from', PUBLIC_DIR);
});
