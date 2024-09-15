import express from 'express';
import { Server } from 'socket.io';
import path from 'path';
import wsocket from './wsocket';
import router from './router';
import helmet from 'helmet';
import db, { initializeDB } from './db';

const app = express();

app.use(helmet());

app.use(express.static(path.resolve() + '/node_modules/socket.io-client/dist'));
app.use(express.static(path.resolve() + '/node_modules/bootstrap/dist'));
app.use(express.static(path.resolve(__dirname) + '/public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.resolve(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(router);

let port = 7331;
if (process.argv[2] === '--port' && process.argv[3]) {
  port = parseInt(process.argv[3], 10);
}

(async () => {
  await initializeDB();

  const server = app.listen(port, () => {
    console.log(`📝 KrunosPad works on port ${port} 📝`);
  });

  const io = new Server(server);
  io.on('connection', wsocket);
})();
