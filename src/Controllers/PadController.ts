import type { Request, Response } from 'express';
import Pad from '../Models/Pad';
import urlToDotPath from '../helper';
import path from 'path';

const PadController = {
    async index(req: Request, res: Response): Promise<void> {
        const urlParams = urlToDotPath(req.params[0]);
        const pad = new Pad();
        let p = await pad.find(urlParams); // Await the async function

        if (!p) {
            p = await pad.save({ path: urlParams, content: 'This is Empty' }); // Await the async save function
        }

        res.json(p);
    },

    home(req: Request, res: Response): void {
        res.render(path.resolve(__dirname, '..') + '/public/index.html');
    },

    async render(req: Request, res: Response): Promise<void> {
        const urlParams = urlToDotPath(req.params[0]);
        const pad = new Pad();
        let p = await pad.find(urlParams); // Await the async function

        if (!p) {
            p = await pad.save({ path: urlParams, content: 'This is Empty' }); // Await the async save function
        }

        res.render(path.resolve(__dirname, '..') + '/public/content.html', { content: p.content });
    }
};

export default PadController;
