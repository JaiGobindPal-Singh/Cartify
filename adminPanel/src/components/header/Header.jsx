import { Menu } from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import Hamburger from "../hamburger/Hamburger";


export default function Header({ user }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);

    const routeTitles = {
        "/": "Dashboard",
        "/products": "Products",
        "/orders": "Orders",
        "/customers": "Customers",
        "/login":"Login"
    };

    const title = routeTitles[location.pathname] || (() => {
        const seg = location.pathname.split("/").filter(Boolean)[0];
        return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : "";
    })();

    const menuClass = "rounded-xl p-2 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden";
    return (
        <>
            <header className="sticky top-0 z-30 h-14 w-full border-b border-border bg-card/95 backdrop-blur-sm md:hidden">
                <div className="flex h-full w-full items-center justify-between gap-8 px-4">
                    <div className="text-xl font-bold text-foreground">{title}</div>
                    <button
                        type="button"
                        className={menuClass}
                        aria-label="Open navigation menu"
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-navigation"
                        onClick={() => setIsMenuOpen(true)}
                    >
                        <Menu aria-hidden="true" />
                    </button>
                </div>
            </header>
            {isMenuOpen && (
                <Hamburger user={user} onClose={closeMenu} />
            )}
        </>
    );
}
