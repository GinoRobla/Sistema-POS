import React from "react";
import { Routes, Route, HashRouter, Link } from "react-router-dom" 
import { Sidebar } from "../components/sidebar/Sidebar"
import { Sales } from "../components/sales/Sales"
import { Inventory } from "../components/inventory/Inventory"
import { Historial } from "../components/historial/Historial"
import { Stats } from "../components/stats/Stats"

export const Routing = () => {

    return (
        <HashRouter>
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        <Route index element={<Sales />} />
                        <Route path="/ventas" element={<Sales />} />
                        <Route path="/inventario" element={<Inventory />} />
                        <Route path="/historial" element={<Historial />} />
                        <Route path="/estadisticas" element={<Stats />} />

                        <Route path="*" element={
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <h1>Error 404</h1>
                                <p>Página no encontrada</p>
                                <Link to="/">Volver al Punto de Venta</Link>
                            </div>
                        } />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    )
}
