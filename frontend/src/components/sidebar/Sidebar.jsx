import { NavLink } from 'react-router-dom'
import './Sidebar.css'

export const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Menu</h2>
            </div>
            <nav className="sidebar-nav">
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    end
                >
                    <span className="nav-text">Punto de Venta</span>
                </NavLink>
                <NavLink
                    to="/inventario"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-text">Inventario</span>
                </NavLink>
                <NavLink
                    to="/historial"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-text">Historial de Ventas</span>
                </NavLink>
                <NavLink
                    to="/estadisticas"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-text">Estadísticas</span>
                </NavLink>
            </nav>
        </aside>
    )
}
