import db, { initializeDB } from '../db';

class Pad {
    async find(path: string): Promise<{ path: string, content: string } | false> {
        await initializeDB(); // Ensure the database is initialized
        const content = db.data?.pads[path]; // Access the pads object
        if (content) {
            return { path, content };
        }
        return false;
    }

    async save(pad: { path: string, content: string }): Promise<{ path: string, content: string }> {
        await initializeDB(); // Ensure the database is initialized
        db.data!.pads[pad.path] = pad.content; // Save content inside pads object
        await db.write(); // Save changes to the database
        return pad;
    }
}

export default Pad;
