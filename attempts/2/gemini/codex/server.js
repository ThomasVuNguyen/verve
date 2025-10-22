const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5173;
const root = process.cwd();

const mime = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
}));

function send(res, code, data, headers = {}) {
  res.writeHead(code, headers);
  res.end(data);
}

const server = http.createServer((req, res) => {
  const url = decodeURI(req.url.split('?')[0]);
  let filePath = path.join(root, url);

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err2, data) => {
      if (err2) {
        // Try index.html fallback (SPA-style)
        const fallback = path.join(root, 'index.html');
        fs.readFile(fallback, (err3, data2) => {
          if (err3) return send(res, 404, 'Not Found');
          send(res, 200, data2, { 'Content-Type': 'text/html; charset=utf-8' });
        });
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const type = mime.get(ext) || 'application/octet-stream';
      send(res, 200, data, { 'Content-Type': type });
    });
  });
});

server.listen(port, () => {
  console.log(`Static server listening on http://localhost:${port}`);
});

