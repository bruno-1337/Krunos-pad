import { db, pads } from '../db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

interface PadData {
  content: string;
  password?: string;
  lastUpdated: string;
}

class Pad {
  async find(path: string): Promise<{ path: string; padData: PadData } | false> {
    const result = await db.select().from(pads).where(eq(pads.path, path)).get();
    
    if (result) {
      return {
        path: result.path,
        padData: {
          content: result.content,
          password: result.password ?? undefined,
          lastUpdated: result.lastUpdated.toISOString()
        }
      };
    }
    return false;
  }

  async save(pad: { path: string; padData: PadData }): Promise<{ path: string; padData: PadData }> {
    const existingPad = await this.find(pad.path);
    
    if (existingPad) {
      await db
        .update(pads)
        .set({
          content: pad.padData.content,
          lastUpdated: new Date(pad.padData.lastUpdated)
        })
        .where(eq(pads.path, pad.path))
        .run();
    } else {
      await db
        .insert(pads)
        .values({
          path: pad.path,
          content: pad.padData.content,
          password: pad.padData.password ?? null,
          lastUpdated: new Date(pad.padData.lastUpdated)
        })
        .run();
    }
    
    return pad;
  }

  async setPassword(path: string, password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db
      .update(pads)
      .set({ password: hashedPassword })
      .where(eq(pads.path, path))
      .run();
  }

  async checkPassword(path: string, password: string): Promise<boolean> {
    const result = await db.select().from(pads).where(eq(pads.path, path)).get();
    
    if (result && result.password) {
      return await bcrypt.compare(password, result.password);
    }
    return false;
  }
}

export default Pad;
