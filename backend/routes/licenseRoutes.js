// ===== RUTAS DE LICENCIA =====
// GET  /api/license/machine-id  → devuelve el ID único de esta máquina
// GET  /api/license/status      → devuelve si la licencia está activa o no
// POST /api/license/activate    → valida y guarda una clave de activación

const express = require('express');
const router = express.Router();
const { getMachineId, validateKey, getLicenseStatus, saveLicense } = require('../services/licenseService');

// Devuelve el machine ID para mostrar al usuario y generar la clave
router.get('/machine-id', (req, res) => {
    res.json({ machineId: getMachineId() });
});

// Devuelve el estado de la licencia actual
router.get('/status', (req, res) => {
    res.json(getLicenseStatus());
});

// Activa el sistema con una clave válida
router.post('/activate', (req, res) => {
    const { key } = req.body;
    if (!key || typeof key !== 'string') {
        return res.json({ success: false, reason: 'Clave requerida' });
    }

    const result = validateKey(key.trim());
    if (!result.valid) {
        return res.json({ success: false, reason: result.reason });
    }

    saveLicense(key.trim(), result.expiryDate);
    res.json({ success: true });
});

module.exports = router;
