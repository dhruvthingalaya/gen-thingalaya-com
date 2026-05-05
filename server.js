const http = require('http');
const { URL } = require('url');
const bwipjs = require('bwip-js');

const PORT = process.env.PORT || 5500;
const HOST = process.env.HOST || '0.0.0.0';

const typeMap = {
  qr: 'qrcode',
  qrcode: 'qrcode',
  microqr: 'microqrcode',
  microqrcode: 'microqrcode',
  aztec: 'azteccode',
  azteccode: 'azteccode',
  aztecrunes: 'aztecrune',
  aztecrune: 'aztecrune',
  datamatrix: 'datamatrix',
  gridmatrix: 'hanxin',
  maxicode: 'maxicode',
  pdf417: 'pdf417',
  code128: 'code128',
  ean13: 'ean13',
};

function buildOptions(data, type) {
  const bcid = typeMap[(type || '').toLowerCase()];
  if (!bcid) throw new Error('Unsupported type');
  const text = data == null ? '' : String(data);
  if (!text.trim()) throw new Error('Data is required');

  if (bcid === 'aztecrune') {
    if (!/^\d+$/.test(text.trim())) throw new Error('Aztec Runes requires integer 0-255');
    const n = Number(text.trim());
    if (n < 0 || n > 255) throw new Error('Aztec Runes value must be between 0 and 255');
  }

  return {
    bcid,
    text,
    scale: 4,
    includetext: false,
    paddingwidth: 8,
    paddingheight: 8,
    backgroundcolor: 'FFFFFF',
  };
}

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }  if (url.pathname === '/') {
    res.writeHead(302, { Location: '/index.html' });
    res.end();
    return;
  }

  if (url.pathname === '/index.html') {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (url.pathname === '/style.css') {
    const fs = require('fs');
    const path = require('path');
    const css = fs.readFileSync(path.join(__dirname, 'style.css'));
    res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
    res.end(css);
    return;
  }

  if (url.pathname === '/site.webmanifest') {
    const fs = require('fs');
    const path = require('path');
    const manifest = fs.readFileSync(path.join(__dirname, 'site.webmanifest'));
    res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8' });
    res.end(manifest);
    return;
  }

  if (
    [
      '/favicon.ico',
      '/favicon.svg',
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/apple-touch-icon.png',
      '/android-chrome-192x192.png',
      '/android-chrome-512x512.png',
    ].includes(url.pathname)
  ) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, url.pathname.slice(1));
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.ico' ? 'image/x-icon' :
      ext === '.svg' ? 'image/svg+xml; charset=utf-8' :
      'image/png';
    const file = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(file);
    return;
  }

  if (!['/code'].includes(url.pathname)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  try {
    const data = url.searchParams.get('data') || '';
    const type = url.searchParams.get('type') || 'qrcode';
    const format = (url.searchParams.get('format') || 'svg').toLowerCase();
    const opts = buildOptions(data, type);

    if (format === 'svg') {
      let svg = bwipjs.toSVG(opts);
      svg = svg.replace(
        /<svg\b([^>]*)>/i,
        '<svg$1><rect width="100%" height="100%" fill="#ffffff"/>'
      );
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline; filename="code.svg"',
      });
      res.end(svg);
      return;
    }

    if (format === 'png') {
      const png = await bwipjs.toBuffer({ ...opts, encoding: 'png' });
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline; filename="code.png"',
      });
      res.end(png);
      return;
    }

    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Unsupported format. Use svg or png.');
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(err.message || 'Bad request');
  }
}

const server = http.createServer((req, res) => {
  handler(req, res).catch((err) => {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(err.message || 'Internal server error');
  });
});

server.on('error', (err) => {
  console.error(`Server failed to start on ${HOST}:${PORT}`);
  console.error(err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at:`);
  console.log(`- http://127.0.0.1:${PORT}`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://${HOST}:${PORT}`);});
