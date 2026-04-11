import { NavLink } from 'react-router-dom'
import { FiBarChart2, FiBox, FiClock, FiShoppingCart } from 'react-icons/fi'
import './Sidebar.css'

export const Sidebar = ({ isMobileNavOpen = false, onNavigate }) => {
    const navItems = [
        { to: '/', label: 'Punto de Venta', icon: FiShoppingCart },
        { to: '/inventario', label: 'Inventario', icon: FiBox },
        { to: '/historial', label: 'Historial de Ventas', icon: FiClock },
        { to: '/estadisticas', label: 'Estadisticas', icon: FiBarChart2 }
    ]

    return (
        <aside className={`sidebar ${isMobileNavOpen ? 'sidebar-mobile-active' : ''}`}>
            <div className="sidebar-header">
                <span className="sidebar-kicker">Sistema POS</span>
                <h2>Panel Principal</h2>
            </div>

            <nav className="sidebar-nav" aria-label="Navegacion principal">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon" aria-hidden="true">
                            <item.icon />
                        </span>
                        <span className="nav-text">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}
