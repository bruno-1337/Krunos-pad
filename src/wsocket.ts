import urlToDotPath from './helper'; // Adjust to default import

import Pad from './Models/Pad';

export default (socket: Socket) => {
    socket.on('update', (data) => {
        data.path = urlToDotPath(data.path); // Use the default function
        const pad = new Pad();
        pad.save(data);
        socket.broadcast.emit('update', data);
    });

    console.log('A user connected');
};
