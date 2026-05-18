const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/verify', userController.verifyWhitelist);
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/ban', userController.toggleBan);
router.patch('/:id/plan', userController.togglePlan);

module.exports = router;
