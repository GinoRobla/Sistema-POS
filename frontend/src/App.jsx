import { useState, useEffect } from "react"
import { Routing } from "./router/routing"
import { ActivationScreen } from "./components/activation/ActivationScreen"
import "./App.css"

function App() {
    const [licenseStatus, setLicenseStatus] = useState('checking')

    useEffect(() => {
        fetch('http://localhost:3001/api/license/status')
            .then(r => r.json())
            .then(data => {
                if (data.status === 'activa') {
                    setLicenseStatus('active')
                } else {
                    setLicenseStatus('inactive')
                }
            })
            .catch(() => setLicenseStatus('inactive'))
    }, [])

    if (licenseStatus === 'checking') return null

    if (licenseStatus === 'inactive') {
        return <ActivationScreen onActivated={() => setLicenseStatus('active')} />
    }

    return (
        <div className="layout">
            <Routing />
        </div>
    )
}

export default App
