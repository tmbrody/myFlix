const http = require('http'),
  url = require('url'),
  fs = require('fs');

http.createServer((req, res) => {
  let addr = req.url,
    q = url.parse(addr, true),
    filePath = '';

  if (q.pathname.includes('documentation')) {
    filePath = (__dirname + '/documentation.html');
  } else {
    filePath = 'index.html';
  }

  fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + 
    new Date() + '\n\n', (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Added to log.');
      }
    });

  fs.readFile(filePath, (err, data) => {
    if (err) {
      throw err;
    }

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });

}).listen(8080);
console.log('My test server is running on Port 8080.');
