import type { Request, Response } from 'express';
import Pad from '../Models/Pad';
import urlToDotPath from '../helper';
import path from 'path';

const PadController = {
  async index(req: Request, res: Response): Promise<void> {
    const urlParams = urlToDotPath(req.params[0]);
    const pad = new Pad();
    let p = await pad.find(urlParams);

    if (!p) {
      p = await pad.save({
        path: urlParams,
        padData: { content: 'This is Empty', lastUpdated: new Date().toISOString() }
      });
    }

    res.json(p);
  },

  home(req: Request, res: Response): void {
    res.render(path.resolve(__dirname, '..') + '/public/index.html');
  },

  async render(req: Request, res: Response): Promise<void> {
    const urlParams = urlToDotPath(req.params[0]);
    const pad = new Pad();
    let p = await pad.find(urlParams);

    if (!p) {
      p = await pad.save({
        path: urlParams,
        padData: { content: 'This is Empty', lastUpdated: new Date().toISOString() }
      });
    }

    // Check if pad is password protected
    if (p.padData.password) {
      // Render password prompt page
      res.render(path.resolve(__dirname, '..') + '/public/password.html', { path: req.params[0], error: null });
    } else {
      res.render(path.resolve(__dirname, '..') + '/public/content.html', { content: p.padData.content, lastUpdated: p.padData.lastUpdated });
    }
  },

  async submitPassword(req: Request, res: Response): Promise<void> {
    const urlParams = urlToDotPath(req.params[0]);
    const pad = new Pad();
    const password = req.body.password;

    const isValid = await pad.checkPassword(urlParams, password);

    if (isValid) {
      const p = await pad.find(urlParams);
      res.render(path.resolve(__dirname, '..') + '/public/content.html', { content: p!.padData.content, lastUpdated: p!.padData.lastUpdated });
    } else {
      res.render(path.resolve(__dirname, '..') + '/public/password.html', { path: req.params[0], error: 'Invalid password' });
    }
  }
};

export default PadController;
