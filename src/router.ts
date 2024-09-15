import { Router } from 'express';
import PadController from './Controllers/PadController';

const router = Router();

router.get('/', PadController.home);
router.get('/*', PadController.render);
router.post('/*/password', PadController.submitPassword);

export default router;
