import urlToDotPath from './helper';
import { Socket } from 'socket.io';
import Pad from './Models/Pad';

interface PendingWrite {
  path: string;
  content: string;
  timeout: ReturnType<typeof setTimeout>;
}

const pendingWrites = new Map<string, PendingWrite>();
const WRITE_DEBOUNCE_MS = 1000;

async function flushWrite(path: string): Promise<void> {
  const pending = pendingWrites.get(path);
  if (!pending) return;

  const pad = new Pad();
  await pad.save({
    path,
    padData: {
      content: pending.content,
      lastUpdated: new Date().toISOString()
    }
  });

  pendingWrites.delete(path);
}

export default (socket: Socket) => {
  let currentRoom: string | null = null;
  const userId = socket.id;

  socket.on('joinPad', (data: { path: string }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }

    const roomName = urlToDotPath(data.path);
    currentRoom = roomName;
    socket.join(roomName);

    const roomSockets = socket.nsp.adapter.rooms.get(roomName);
    const userCount = roomSockets ? roomSockets.size : 0;

    socket.to(roomName).emit('userJoined', { userId, userCount });
    socket.emit('roomJoined', { userCount, userId });

    console.log(`User ${userId} joined room ${roomName}. Total users: ${userCount}`);
  });

  socket.on('broadcast', (data: { path: string; content: string }) => {
    const normalizedPath = urlToDotPath(data.path);
    
    const updateData = {
      content: data.content,
      padData: {
        content: data.content,
        lastUpdated: new Date().toISOString()
      },
      userId
    };

    socket.to(normalizedPath).emit('update', updateData);
  });

  socket.on('update', async (data: { path: string; content: string }) => {
    const normalizedPath = urlToDotPath(data.path);
    
    if (pendingWrites.has(normalizedPath)) {
      clearTimeout(pendingWrites.get(normalizedPath)!.timeout);
    }

    const timeout = setTimeout(() => {
      flushWrite(normalizedPath);
    }, WRITE_DEBOUNCE_MS);

    pendingWrites.set(normalizedPath, {
      path: normalizedPath,
      content: data.content,
      timeout
    });

    const updateData = {
      content: data.content,
      padData: {
        content: data.content,
        lastUpdated: new Date().toISOString()
      },
      userId
    };

    socket.to(normalizedPath).emit('update', updateData);
  });

  socket.on('cursorMove', (data: { path: string; position: number; selection?: { start: number; end: number } }) => {
    const normalizedPath = urlToDotPath(data.path);
    
    socket.to(normalizedPath).emit('cursorUpdate', {
      userId,
      position: data.position,
      selection: data.selection
    });
  });

  socket.on('setPassword', async (data: { path: string; password: string }) => {
    const normalizedPath = urlToDotPath(data.path);
    const pad = new Pad();
    await pad.setPassword(normalizedPath, data.password);
    socket.emit('passwordSet', { success: true });
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      const roomSockets = socket.nsp.adapter.rooms.get(currentRoom);
      const userCount = roomSockets ? roomSockets.size : 0;

      socket.to(currentRoom).emit('userLeft', { userId, userCount });
      console.log(`User ${userId} left room ${currentRoom}. Remaining users: ${userCount}`);
    }
  });

  console.log(`User ${userId} connected`);
};
