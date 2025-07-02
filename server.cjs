const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8080;
const hostname = '127.0.0.1';

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  const parsedUrl = url.parse(req.url);
  let pathname = `.${parsedUrl.pathname}`;
  
  // Default to index.html for root path
  if (pathname === './') {
    pathname = './index.html';
  }
  
  // Handle directory requests
  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  }
  
  const ext = path.parse(pathname).ext;
  const mimeType = mimeTypes[ext] || 'text/plain';
  
  fs.readFile(pathname, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end(`
        <html>
          <body>
            <h1>404 Not Found</h1>
            <p>The file ${pathname} was not found.</p>
          </body>
        </html>
      `);
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', mimeType);
      res.end(data);
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log('Press Ctrl+C to stop the server');
});