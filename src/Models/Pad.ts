import db from '../db';
import bcrypt from 'bcryptjs';

interface PadData {
  content: string;
  password?: string; // Hashed password
  lastUpdated: string; // ISO string
}

class Pad {
  async find(path: string): Promise<{ path: string; padData: PadData } | false> {
    const padData = db.data?.pads[path];
    if (padData) {
      return { path, padData };
    }
    return false;
  }

  async save(pad: { path: string; padData: PadData }): Promise<{ path: string; padData: PadData }> {
    db.data!.pads[pad.path] = pad.padData;
    await db.write();
    return pad;
  }

  async setPassword(path: string, password: string): Promise<void> {
    const padData = db.data!.pads[path];
    if (padData) {
      const hashedPassword = await bcrypt.hash(password, 10);
      padData.password = hashedPassword;
      await db.write();
    }
  }

  async checkPassword(path: string, password: string): Promise<boolean> {
    const padData = db.data!.pads[path];
    if (padData && padData.password) {
      return await bcrypt.compare(password, padData.password);
    }
    return false;
  }
}

export default Pad;
