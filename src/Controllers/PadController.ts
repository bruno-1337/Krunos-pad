import type { Request, Response } from 'express';
import Pad from '../Models/Pad';
import pathToRoomName from '../helper';
import path from 'path';
import { DEFAULT_PAD_CONTENT, PATHS } from '../constants';
import { passwordSchema, padPathSchema } from '../validation/padValidation';
import { passwordRateLimiter } from '../services/rateLimiter';
import { z } from 'zod';
import type { PadResponse } from '../types/pad';

async function findOrCreatePad(urlPath: string): Promise<PadResponse> {
  const pad = new Pad();
  let p = await pad.find(urlPath);

  if (!p) {
    p = await pad.save({
      path: urlPath,
      padData: { 
        content: DEFAULT_PAD_CONTENT, 
        lastUpdated: new Date().toISOString() 
      }
    });
  }

  return p;
}

function getViewPath(viewName: string): string {
  return path.join(path.resolve(__dirname, '..'), PATHS.PUBLIC, viewName);
}

const PadController = {
  async index(req: Request, res: Response): Promise<void> {
    try {
      const urlPath = req.params[0];
      padPathSchema.parse(urlPath);
      
      const urlParams = pathToRoomName(urlPath);
      const p = await findOrCreatePad(urlParams);

      res.json(p);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid path parameter' });
      } else {
        console.error('Error in index:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  home(req: Request, res: Response): void {
    try {
      res.render(getViewPath(PATHS.INDEX));
    } catch (error) {
      console.error('Error rendering home:', error);
      res.status(500).send('Internal server error');
    }
  },

  async render(req: Request, res: Response): Promise<void> {
    try {
      const urlPath = req.params[0];
      padPathSchema.parse(urlPath);
      
      const urlParams = pathToRoomName(urlPath);
      const p = await findOrCreatePad(urlParams);

      if (p.padData.password) {
        res.render(getViewPath(PATHS.PASSWORD), { 
          path: urlPath, 
          error: null 
        });
      } else {
        res.render(getViewPath(PATHS.CONTENT), { 
          content: p.padData.content, 
          lastUpdated: p.padData.lastUpdated 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).send('Invalid path parameter');
      } else {
        console.error('Error in render:', error);
        res.status(500).send('Internal server error');
      }
    }
  },

  async submitPassword(req: Request, res: Response): Promise<void> {
    try {
      const urlPath = req.params[0];
      padPathSchema.parse(urlPath);
      
      const urlParams = pathToRoomName(urlPath);
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const rateLimitKey = `${clientIp}:${urlParams}`;

      if (!passwordRateLimiter.checkLimit(rateLimitKey)) {
        res.status(429).render(getViewPath(PATHS.PASSWORD), { 
          path: urlPath, 
          error: 'Too many attempts. Please try again later.' 
        });
        return;
      }

      const validationResult = passwordSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).render(getViewPath(PATHS.PASSWORD), { 
          path: urlPath, 
          error: 'Invalid password format' 
        });
        return;
      }

      const { password } = validationResult.data;
      const pad = new Pad();
      const isValid = await pad.checkPassword(urlParams, password);

      if (isValid) {
        passwordRateLimiter.reset(rateLimitKey);
        const p = await pad.find(urlParams);
        
        if (p) {
          res.render(getViewPath(PATHS.CONTENT), { 
            content: p.padData.content, 
            lastUpdated: p.padData.lastUpdated 
          });
        } else {
          res.status(404).send('Pad not found');
        }
      } else {
        res.render(getViewPath(PATHS.PASSWORD), { 
          path: urlPath, 
          error: 'Invalid password' 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).render(getViewPath(PATHS.PASSWORD), { 
          path: req.params[0], 
          error: 'Invalid input' 
        });
      } else {
        console.error('Error in submitPassword:', error);
        res.status(500).send('Internal server error');
      }
    }
  }
};

export default PadController;
