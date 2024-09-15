import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

interface PadData {
  content: string;
  password?: string;
  lastUpdated: string;
}

interface Data {
  pads: { [key: string]: PadData };
}

const adapter = new JSONFile<Data>('db.json');
const db = new Low<Data>(adapter, { pads: {} }); // Provide default data here

export const initializeDB = async (): Promise<void> => {
  await db.read();

  if (db.data === undefined) {
    db.data = { pads: {} };
    console.log('Database was empty, initialized with default data.');
    await db.write();
  }
};

export default db;
