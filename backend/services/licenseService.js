// ===== SERVICIO DE LICENCIAS =====
// Gestiona machine ID, validación y almacenamiento de licencias

const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Debe coincidir con el SECRET de keygen.html
const SECRET = 'GinoVentas2025#MasterKey!Pos';
const licenseFile = path.join(__dirname, '..', 'data', 'license.json');

// Genera un ID único y estable para esta máquina basado en hostname + primera MAC
function getMachineId() {
    const hostname = os.hostname().toUpperCase();
    const interfaces = os.networkInterfaces();

    let mac = '';
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface) {
            if (!addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00') {
                mac = addr.mac.replace(/:/g, '').toUpperCase();
                break;
            }
        }
        if (mac) break;
    }

    const raw = `${hostname}-${mac}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
    return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

// Valida una clave completa (AAAAA-BBBBB-CCCCC-DDDDD|YYYY-MM-DD) contra esta máquina
function validateKey(fullKey) {
    try {
        const parts = fullKey.split('|');
        if (parts.length !== 2) return { valid: false, reason: 'Formato de clave inválido' };

        const [keyPart, expiryDate] = parts;

        // Verificar que la fecha no haya vencido
        const expiry = new Date(expiryDate + 'T23:59:59');
        if (isNaN(expiry.getTime())) return { valid: false, reason: 'Fecha de vencimiento inválida' };
        if (expiry < new Date()) return { valid: false, reason: 'La clave ha vencido' };

        // Recalcular el HMAC esperado para esta máquina
        const machineId = getMachineId();
        const payload = `${machineId}|${expiryDate}`;
        const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('base64');
        const clean = hmac.replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 20);
        const expectedKey = `${clean.slice(0, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 15)}-${clean.slice(15, 20)}`;

        if (keyPart !== expectedKey) return { valid: false, reason: 'Clave incorrecta para esta máquina' };

        return { valid: true, expiryDate };
    } catch {
        return { valid: false, reason: 'Error al validar la clave' };
    }
}

// Devuelve el estado actual de la licencia guardada
function getLicenseStatus() {
    try {
        if (!fs.existsSync(licenseFile)) return { status: 'inactiva' };
        const data = JSON.parse(fs.readFileSync(licenseFile, 'utf8'));
        const expiry = new Date(data.expiryDate + 'T23:59:59');
        if (expiry < new Date()) return { status: 'vencida' };
        return { status: 'activa', expiryDate: data.expiryDate };
    } catch {
        return { status: 'inactiva' };
    }
}

// Guarda la licencia validada en disco
function saveLicense(fullKey, expiryDate) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(licenseFile, JSON.stringify({
        key: fullKey,
        expiryDate,
        activatedAt: new Date().toISOString()
    }, null, 2));
}

module.exports = { getMachineId, validateKey, getLicenseStatus, saveLicense };
