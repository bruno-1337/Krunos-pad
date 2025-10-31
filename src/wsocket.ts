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

const FIRST_NAMES = [
  'Naruto', 'Goku', 'Luffy', 'Link', 'Mario', 'Sonic', 'Cloud', 'Sephiroth',
  'Pikachu', 'Kirby', 'Saitama', 'Ichigo', 'Edward', 'Eren', 'Levi', 'Spike',
  'Vegeta', 'Kakashi', 'Zoro', 'Sasuke', 'Tanjiro', 'Gon', 'Killua', 'Deku',
  'Geralt', 'Kratos', 'Master Chief', 'Samus', 'Steve', 'Sans'
];

const LAST_NAMES = [
  'Uzumaki', 'Son', 'Monkey D.', 'Hero of Time', 'Plumber', 'Hedgehog', 'Strife', 'One-Winged',
  'Ketchum', 'Star Warrior', 'One Punch', 'Kurosaki', 'Elric', 'Yeager', 'Ackerman', 'Spiegel',
  'Prince', 'Hatake', 'Roronoa', 'Uchiha', 'Kamado', 'Freecss', 'Zoldyck', 'Midoriya',
  'of Rivia', 'God of War', 'Spartan', 'Aran', 'Miner', 'Skeleton'
];

function generateRandomUsername(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

function createUpdateData(content: string, userId: string) {
  return {
    content,
    padData: {
      content,
      lastUpdated: new Date().toISOString()
    },
    userId
  };
}

async function flushWrite(path: string): Promise<void> {
  const pending = pendingWrites.get(path);
  if (!pending) return;

  try {
    const pad = new Pad();
    await pad.save({
      path,
      padData: {
        content: pending.content,
        lastUpdated: new Date().toISOString()
      }
    });

    pendingWrites.delete(path);
  } catch (error) {
    console.error(`Failed to save pad at ${path}:`, error);
    pendingWrites.delete(path);
  }
}

export default (socket: Socket) => {
  let currentRoom: string | null = null;
  const userId = socket.id;
  let username: string;

  socket.on('joinPad', (data: { path: string; requestedUsername?: string }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }

    username = data.requestedUsername || generateRandomUsername();

    const roomName = urlToDotPath(data.path);
    currentRoom = roomName;
    socket.join(roomName);

    const roomSockets = socket.nsp.adapter.rooms.get(roomName);
    const userCount = roomSockets ? roomSockets.size : 0;

    socket.to(roomName).emit('userJoined', { userId, username, userCount });
    socket.emit('roomJoined', { userCount, userId, username });

    console.log(`User ${username} (${userId}) joined room ${roomName}. Total users: ${userCount}`);
  });

  socket.on('broadcast', (data: { path: string; content: string }) => {
    const normalizedPath = urlToDotPath(data.path);
    const updateData = createUpdateData(data.content, userId);
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

    const updateData = createUpdateData(data.content, userId);
    socket.to(normalizedPath).emit('update', updateData);
  });

  socket.on('cursorMove', (data: { path: string; position: number; selection?: { start: number; end: number } }) => {
    const normalizedPath = urlToDotPath(data.path);
    
    socket.to(normalizedPath).emit('cursorUpdate', {
      userId,
      username,
      position: data.position,
      selection: data.selection
    });
  });

  socket.on('setPassword', async (data: { path: string; password: string }) => {
    try {
      const normalizedPath = urlToDotPath(data.path);
      const pad = new Pad();
      await pad.setPassword(normalizedPath, data.password);
      socket.emit('passwordSet', { success: true });
    } catch (error) {
      console.error('Failed to set password:', error);
      socket.emit('passwordSet', { success: false, error: 'Failed to set password' });
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      if (pendingWrites.has(currentRoom)) {
        const pending = pendingWrites.get(currentRoom);
        if (pending) {
          clearTimeout(pending.timeout);
          flushWrite(currentRoom).catch(error => {
            console.error('Failed to flush write on disconnect:', error);
          });
        }
      }

      const roomSockets = socket.nsp.adapter.rooms.get(currentRoom);
      const userCount = roomSockets ? roomSockets.size : 0;

      socket.to(currentRoom).emit('userLeft', { userId, userCount });
      console.log(`User ${userId} left room ${currentRoom}. Remaining users: ${userCount}`);
    }
  });

  console.log(`User ${userId} connected`);
};
