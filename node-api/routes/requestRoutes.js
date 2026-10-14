const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { auth, authorize } = require('../middleware/auth');

// Membre
router.post('/', auth, requestController.createRequest);
router.get('/', auth, requestController.getMyRequests);
router.get('/:id', auth, requestController.getRequestById);
router.put('/:id', auth, requestController.updateRequest);
router.delete('/:id', auth, requestController.deleteRequest);

// Admin & services
router.get('/admin/all', auth, authorize('ADMIN','PROGRAMME','JURIDIQUE','DIRECTION_ARTISTIQUE','REGISSEUR_GENERAL','FINANCE','COMMUNICATION'), requestController.getAllRequests);
router.put('/admin/:id/status', auth, authorize('ADMIN','PROGRAMME','JURIDIQUE','DIRECTION_ARTISTIQUE','REGISSEUR_GENERAL','FINANCE','COMMUNICATION'), requestController.updateStatus);

module.exports = router;