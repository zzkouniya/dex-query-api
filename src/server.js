const http = require('http');
const app = require('./app');
const { port } = require('./config');

(async () => {
  const server = http.createServer(app);
  server.listen(port);
  server.on('listening', () => console.info(`Server listening on port ${port}`));
})();
