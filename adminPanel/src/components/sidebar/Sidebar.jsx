
import { NavLink } from 'react-router-dom'
import { logoutUser } from '../../services/user.service'
import { useNavigate } from 'react-router-dom'
import { generateNotification } from '../../utils/notification.utils';
const links = [
    { label: 'Dashboard', to: '/', icon: '▣' },
    { label: 'Products', to: '/products', icon: '▦' },
    { label: 'Categories', to: '/categories/', icon: '◇' },
    { label: 'Orders', to: '/orders/', icon: '🛒' },
    { label: 'Users', to: '/users/', icon: '👤' },
    { label: 'Transactions', to: '/transactions/', icon: '💳' },
    { label: 'Config', to: '/config/', icon: '⚙' },
]


export function SidebarNavigation({ onNavigate }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logoutUser();
            navigate('/login');
            onNavigate?.();
        } catch (error) {
            console.error('Logout failed:', error);
            generateNotification("Logout failed. Please try again.")();
        }
    };

    return (
        <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-6">
            <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Workspace
            </p>
            {links.map(({ label, to, icon }) => (
                <NavLink
                    key={label}
                    to={to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`
                    }
                >
                    <span aria-hidden="true" className="w-5 text-center text-base">
                        {icon}
                    </span>
                    {label}
                </NavLink>
            ))}
            <button
                type="button"
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            >
                <span aria-hidden="true" className="w-5 text-center text-base">↪</span>
                Logout
            </button>
        </nav>
    );
}

function Sidebar({ user }) {
    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background text-foreground md:flex">
            <div className="flex h-16 items-center border-b border-border px-6">
                <span className="text-lg font-semibold tracking-tight capitalize">Hi, {user?.name || 'Cartify'}</span>
            </div>
            <SidebarNavigation />
        </aside>
    )
}

export default Sidebar
