const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticateToken, requireUser } = require('../middleware/auth');

const router = express.Router();

// Rotas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rotas protegidas
router.get('/me', authenticateToken, requireUser, AuthController.me);
router.put('/update-profile', authenticateToken, requireUser, AuthController.updateProfile);
router.put('/change-password', authenticateToken, requireUser, AuthController.changePassword);
router.post('/refresh', authenticateToken, AuthController.refreshToken);
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;