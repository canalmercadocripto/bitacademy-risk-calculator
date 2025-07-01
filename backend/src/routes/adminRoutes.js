const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard principal
router.get('/dashboard', AdminController.getDashboard);

// Gestão de usuários
router.get('/users', AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserDetails);
router.post('/users', AdminController.createUser);
router.patch('/users/:userId', AdminController.updateUser);
router.patch('/users/:userId/status', AdminController.toggleUserStatus);
router.delete('/users/:userId', AdminController.deleteUser);

// Gestão de trades
router.get('/trades', AdminController.getAllTrades);

// Relatórios
router.get('/reports/activity', AdminController.getActivityReport);
router.get('/activities', AdminController.getUserActivities);

// Estatísticas em tempo real
router.get('/stats/realtime', AdminController.getRealtimeStats);

// Backup e Export
router.get('/backup/database', AdminController.backupDatabase);
router.get('/export/users', AdminController.exportUsers);
router.get('/export/trades', AdminController.exportTrades);

module.exports = router;