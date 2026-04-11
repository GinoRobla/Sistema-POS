import { useState, useEffect } from 'react'
import './ActivationScreen.css'

const API = 'http://localhost:3001/api/license'

export function ActivationScreen({ onActivated }) {
    const [machineId, setMachineId] = useState('')
    const [key, setKey] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetch(`${API}/machine-id`)
            .then(r => r.json())
            .then(d => setMachineId(d.machineId))
            .catch(() => setMachineId('Error al obtener ID'))
    }, [])

    const handleCopy = () => {
        navigator.clipboard.writeText(machineId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleActivate = async () => {
        if (!key.trim()) return setError('Ingresá la clave')
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API}/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: key.trim() })
            })
            const data = await res.json()
            if (data.success) {
                onActivated()
            } else {
                setError(data.reason || 'Clave inválida')
            }
        } catch {
            setError('Error de conexión con el sistema')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="activation-overlay">
            <div className="activation-card">
                <div className="activation-logo">
                    <svg className="activation-icon-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="48" height="48" rx="14" fill="#1f6feb"/>
                        <path d="M14 20h20v14a2 2 0 01-2 2H16a2 2 0 01-2-2V20z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5"/>
                        <path d="M18 20v-4a6 6 0 1112 0v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="24" cy="28" r="2.5" fill="white"/>
                        <path d="M24 30.5v3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <h1>Sistema de Ventas</h1>
                    <p className="activation-subtitle">Activación de licencia</p>
                </div>

                <div className="activation-section">
                    <label>Tu ID de máquina</label>
                    <div className="machine-id-box">
                        <span className="machine-id-text">{machineId || 'Cargando...'}</span>
                        <button className="copy-btn" onClick={handleCopy} disabled={!machineId}>
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                    <p className="activation-hint">
                        Enviá este código a Gino por WhatsApp para recibir tu clave.
                    </p>
                </div>

                <div className="activation-section">
                    <label>Clave de activación</label>
                    <input
                        className="activation-input"
                        type="text"
                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX|YYYY-MM-DD"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleActivate()}
                    />
                    {error && <p className="activation-error">{error}</p>}
                </div>

                <button
                    className="activation-btn"
                    onClick={handleActivate}
                    disabled={loading || !key.trim()}
                >
                    {loading ? 'Verificando...' : 'Activar sistema'}
                </button>

                <p className="activation-contact">
                    Soporte: <strong>Gino</strong> · WhatsApp <strong>+54 9 291 464-3232</strong>
                </p>
            </div>
        </div>
    )
}
