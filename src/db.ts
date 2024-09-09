import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Define types for the database schema
interface Data {
    pads: { [key: string]: string }; // Pads with path as key and content as value
}

// Initialize the database with a JSON file
const adapter = new JSONFile<Data>('db.json');
const db = new Low<Data>(adapter, { pads: {} }); // Provide default data here

// Initialize and read the database
export const initializeDB = async (): Promise<void> => {
    await db.read(); // Read the database file

    // If the database file is empty or missing, initialize it with default data
    if (!db.data) {
        db.data = { pads: {} };
        console.log('Database was empty, initialized with default data.');
        await db.write(); // Save the default data to the file
    }
};

export default db;
