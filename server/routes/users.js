import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getUsers,
  blockUser,
  unblockUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
  .get(getUsers);

router.route('/:id/block')
  .put(blockUser);

router.route('/:id/unblock')
  .put(unblockUser);

router.route('/:id')
  .delete(deleteUser);

export default router;
