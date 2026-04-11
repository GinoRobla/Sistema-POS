import React, { useEffect, useState } from "react";
import { Routes, Route, HashRouter, Link, useLocation } from "react-router-dom";
import { Sidebar } from "../components/sidebar/Sidebar";
import { Sales } from "../components/sales/Sales";
import { Inventory } from "../components/inventory/Inventory";
import { Historial } from "../components/historial/Historial";
import { Stats } from "../components/stats/Stats";

const routeTitles = {
    "/": "Punto de Venta",
    "/ventas": "Punto de Venta",
    "/inventario": "Inventario",
    "/historial": "Historial",
    "/estadisticas": "Estadisticas"
};

const AppShell = () => {
    const location = useLocation();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsMobileNavOpen(false);
            }
        };

        const shouldLockScroll = isMobileNavOpen && window.innerWidth <= 768;
        const previousOverflow = document.body.style.overflow;

        if (shouldLockScroll) {
            document.body.style.overflow = "hidden";
        }

        window.addEventListener("resize", handleResize);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("resize", handleResize);
        };
    }, [isMobileNavOpen]);

    const currentTitle = routeTitles[location.pathname] || "Sistema POS";

    return (
        <div className="app-layout">
            <Sidebar
                isMobileNavOpen={isMobileNavOpen}
                onNavigate={() => setIsMobileNavOpen(false)}
            />

            <button
                type="button"
                className={`sidebar-overlay ${isMobileNavOpen ? "active" : ""}`}
                aria-label="Cerrar menu de navegacion"
                onClick={() => setIsMobileNavOpen(false)}
            />

            <main className="main-content">
                <div className="mobile-topbar">
                    <button
                        type="button"
                        className="mobile-menu-button"
                        aria-label={isMobileNavOpen ? "Cerrar menu" : "Abrir menu"}
                        aria-expanded={isMobileNavOpen}
                        onClick={() => setIsMobileNavOpen((prev) => !prev)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <div className="mobile-topbar-copy">
                        <span className="mobile-topbar-label">Sistema POS</span>
                        <strong className="mobile-topbar-title">{currentTitle}</strong>
                    </div>
                </div>

                <Routes>
                    <Route index element={<Sales />} />
                    <Route path="/ventas" element={<Sales />} />
                    <Route path="/inventario" element={<Inventory />} />
                    <Route path="/historial" element={<Historial />} />
                    <Route path="/estadisticas" element={<Stats />} />

                    <Route
                        path="*"
                        element={
                            <div style={{ padding: "2rem", textAlign: "center" }}>
                                <h1>Error 404</h1>
                                <p>Pagina no encontrada</p>
                                <Link to="/">Volver al Punto de Venta</Link>
                            </div>
                        }
                    />
                </Routes>
            </main>
        </div>
    );
};

export const Routing = () => {
    return (
        <HashRouter>
            <AppShell />
        </HashRouter>
    );
};
