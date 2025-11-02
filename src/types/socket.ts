export interface ServerToClientEvents {
  update: (data: {
    content: string;
    padData: {
      content: string;
      lastUpdated: string;
    };
    userId: string;
  }) => void;
  
  roomJoined: (data: {
    userCount: number;
    userId: string;
    username: string;
  }) => void;
  
  userJoined: (data: {
    userId: string;
    username: string;
    userCount: number;
  }) => void;
  
  userLeft: (data: {
    userId: string;
    userCount: number;
  }) => void;
  
  cursorUpdate: (data: {
    userId: string;
    username: string;
    position: number;
    selection?: {
      start: number;
      end: number;
    } | null;
  }) => void;
  
  passwordSet: (data: {
    success: boolean;
    error?: string;
  }) => void;
  
  error: (data: {
    message: string;
  }) => void;
}

export interface ClientToServerEvents {
  joinPad: (data: {
    path: string;
    requestedUsername?: string | null;
  }) => void;
  
  broadcast: (data: {
    path: string;
    content: string;
  }) => void;
  
  update: (data: {
    path: string;
    content: string;
  }) => void;
  
  cursorMove: (data: {
    path: string;
    position: number;
    selection?: {
      start: number;
      end: number;
    } | null;
  }) => void;
  
  setPassword: (data: {
    path: string;
    password: string;
  }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  username?: string;
  currentRoom?: string;
}

