import express from 'express';
import type { Request, Response } from 'express';
import { Server } from 'socket.io';
import path from 'path';
import wsocket from './wsocket';
import router from './router';

const app = express();

app.use(express.static(path.resolve() + '/node_modules/socket.io-client/dist'));
app.use(express.static(path.resolve() + '/node_modules/bootstrap/dist'));
app.use(express.static(path.resolve(__dirname) + '/public'));

app.set('views', path.resolve(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(router);

let port = 1337;
if (process.argv[2] === '--port' && process.argv[3]) {
    port = parseInt(process.argv[3], 10);
}

const server = app.listen(port, () => {
    console.log(`📝 KrunosPad works on port ${port} 📝`);
});

const io = new Server(server);
io.on('connection', wsocket);
