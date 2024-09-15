import urlToDotPath from './helper';
import { Socket } from 'socket.io';
import Pad from './Models/Pad';

export default (socket: Socket) => {
  socket.on('update', async (data) => {
    data.path = urlToDotPath(data.path);
    const pad = new Pad();

    data.padData = {
      content: data.content,
      lastUpdated: new Date().toISOString()
    };

    await pad.save({ path: data.path, padData: data.padData });
    socket.broadcast.emit('update', data);
  });

  socket.on('setPassword', async (data) => {
    data.path = urlToDotPath(data.path);
    const pad = new Pad();
    await pad.setPassword(data.path, data.password);
    socket.emit('passwordSet', { success: true });
  });

  console.log('A user connected');
};
