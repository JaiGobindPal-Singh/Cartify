import { X } from "lucide-react";
import { useEffect } from "react";
import { SidebarNavigation } from "../sidebar/Sidebar";

function Hamburger({ user, onClose }) {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <button
                type="button"
                aria-label="Close navigation menu"
                className="absolute inset-0 h-full w-full bg-background/70"
                onClick={onClose}
            />
            <aside
                id="mobile-navigation"
                aria-label="Mobile navigation"
                className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col border-r border-border bg-background text-foreground shadow-xl"
            >
                <div className="flex h-16 items-center justify-between border-b border-border px-6">
                    <span className="text-lg font-semibold tracking-tight capitalize">Hi, {user?.name || "Cartify"}</span>
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={onClose}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <X aria-hidden="true" size={20} />
                    </button>
                </div>
                <SidebarNavigation onNavigate={onClose} />
            </aside>
        </div>
    );
}

export default Hamburger;
