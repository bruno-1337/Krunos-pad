import urlToDotPath from './helper';
import { Socket } from 'socket.io';
import Pad from './Models/Pad';
import { z } from 'zod';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from './types/socket';

interface PendingWrite {
  path: string;
  content: string;
  timeout: ReturnType<typeof setTimeout>;
}

const pendingWrites = new Map<string, PendingWrite>();
const WRITE_DEBOUNCE_MS = 1000;
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 4;

const joinPadSchema = z.object({
  path: z.string().min(1).max(1000),
  requestedUsername: z.string().max(100).optional()
});

const contentUpdateSchema = z.object({
  path: z.string().min(1).max(1000),
  content: z.string().max(MAX_CONTENT_LENGTH)
});

const cursorMoveSchema = z.object({
  path: z.string().min(1).max(1000),
  position: z.number().int().min(0),
  selection: z.object({
    start: z.number().int().min(0),
    end: z.number().int().min(0)
  }).optional()
});

const setPasswordSchema = z.object({
  path: z.string().min(1).max(1000),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH)
});

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

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export default (socket: TypedSocket) => {
  let currentRoom: string | null = null;
  const userId = socket.id;
  let username: string;

  socket.on('joinPad', (data: unknown) => {
    try {
      const validated = joinPadSchema.parse(data);
      
      if (currentRoom) {
        socket.leave(currentRoom);
      }

      username = validated.requestedUsername || generateRandomUsername();

      const roomName = urlToDotPath(validated.path);
      currentRoom = roomName;
      socket.join(roomName);

      const roomSockets = socket.nsp.adapter.rooms.get(roomName);
      const userCount = roomSockets ? roomSockets.size : 0;

      socket.to(roomName).emit('userJoined', { userId, username, userCount });
      socket.emit('roomJoined', { userCount, userId, username });

      console.log(`User ${username} (${userId}) joined room ${roomName}. Total users: ${userCount}`);
    } catch (error) {
      console.error('Invalid joinPad data:', error);
      socket.emit('error', { message: 'Invalid join data' });
    }
  });

  socket.on('broadcast', (data: unknown) => {
    try {
      const validated = contentUpdateSchema.parse(data);
      const normalizedPath = urlToDotPath(validated.path);
      const updateData = createUpdateData(validated.content, userId);
      socket.to(normalizedPath).emit('update', updateData);
    } catch (error) {
      console.error('Invalid broadcast data:', error);
    }
  });

  socket.on('update', async (data: unknown) => {
    try {
      const validated = contentUpdateSchema.parse(data);
      const normalizedPath = urlToDotPath(validated.path);
      
      if (pendingWrites.has(normalizedPath)) {
        clearTimeout(pendingWrites.get(normalizedPath)!.timeout);
      }

      const timeout = setTimeout(() => {
        flushWrite(normalizedPath);
      }, WRITE_DEBOUNCE_MS);

      pendingWrites.set(normalizedPath, {
        path: normalizedPath,
        content: validated.content,
        timeout
      });

      const updateData = createUpdateData(validated.content, userId);
      socket.to(normalizedPath).emit('update', updateData);
    } catch (error) {
      console.error('Invalid update data:', error);
    }
  });

  socket.on('cursorMove', (data: unknown) => {
    try {
      const validated = cursorMoveSchema.parse(data);
      const normalizedPath = urlToDotPath(validated.path);
      
      socket.to(normalizedPath).emit('cursorUpdate', {
        userId,
        username,
        position: validated.position,
        selection: validated.selection
      });
    } catch (error) {
      console.error('Invalid cursorMove data:', error);
    }
  });

  socket.on('setPassword', async (data: unknown) => {
    try {
      const validated = setPasswordSchema.parse(data);
      const normalizedPath = urlToDotPath(validated.path);
      const pad = new Pad();
      
      const existingPad = await pad.find(normalizedPath);
      if (!existingPad) {
        socket.emit('passwordSet', { success: false, error: 'Pad does not exist' });
        return;
      }
      
      await pad.setPassword(normalizedPath, validated.password);
      socket.emit('passwordSet', { success: true });
    } catch (error) {
      console.error('Failed to set password:', error);
      const errorMessage = error instanceof z.ZodError 
        ? 'Invalid password data' 
        : 'Failed to set password';
      socket.emit('passwordSet', { success: false, error: errorMessage });
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
