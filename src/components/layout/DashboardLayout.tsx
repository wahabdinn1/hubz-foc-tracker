"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Package, Users, History, HelpCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [desktopExpanded, setDesktopExpanded] = useState(false);
    const pathname = usePathname();

    return (
        <div className="flex bg-neutral-50 dark:bg-neutral-950 min-h-screen w-full relative overflow-hidden font-sans selection:bg-blue-500/30 text-neutral-900 dark:text-neutral-50 transition-colors">
            {/* Deep Space Background Dot Matrix */}
            <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#0000001a_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Desktop Sidebar */}
            <motion.div
                animate={{ width: desktopExpanded ? "240px" : "80px" }}
                onMouseEnter={() => setDesktopExpanded(true)}
                onMouseLeave={() => setDesktopExpanded(false)}
                className="hidden md:flex flex-col border-r border-black/5 dark:border-white/5 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-2xl relative z-40 h-screen shrink-0 overflow-hidden shadow-2xl transition-colors"
            >
                <div className="flex h-[72px] items-center flex-shrink-0 px-[22px] gap-4 border-b border-black/5 dark:border-white/[0.05] overflow-hidden transition-colors">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-1 ring-blue-400/30">
                        <Package className="text-white h-5 w-5" />
                    </div>
                    <AnimatePresence>
                        {desktopExpanded && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex flex-col whitespace-nowrap"
                            >
                                <span className="text-neutral-900 dark:text-white font-bold tracking-wide text-lg leading-tight">
                                    Hubz FOC
                                </span>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-widest">
                                    Inventory Tracker
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <nav className="flex-1 px-3 py-8 space-y-2">
                    <NavItem href="/" icon={<LayoutDashboard className={cn(pathname === "/" && "text-blue-400")} />} label="Dashboard" active={pathname === "/"} open={desktopExpanded} />
                    <NavItem href="/inventory" icon={<Package className={cn(pathname.startsWith("/inventory") && "text-blue-400")} />} label="Inventory Bank" active={pathname.startsWith("/inventory")} open={desktopExpanded} />
                    <NavItem href="/kol" icon={<Users className={cn(pathname.startsWith("/kol") && "text-blue-400")} />} label="KOL Management" active={pathname.startsWith("/kol")} open={desktopExpanded} />
                    <NavItem href="/audit" icon={<History className={cn(pathname.startsWith("/audit") && "text-blue-400")} />} label="Audit Log" active={pathname.startsWith("/audit")} open={desktopExpanded} />
                    <NavItem href="/faq" icon={<HelpCircle className={cn(pathname.startsWith("/faq") && "text-blue-400")} />} label="Help Center" active={pathname.startsWith("/faq")} open={desktopExpanded} />
                    <NavItem href="/settings" icon={<Settings className={cn(pathname.startsWith("/settings") && "text-blue-400")} />} label="Settings" active={pathname.startsWith("/settings")} open={desktopExpanded} />
                </nav>
            </motion.div>

            {/* Mobile Header */}
            <div className="flex md:hidden h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md items-center justify-between px-4 fixed top-0 z-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        <Package className="text-white h-5 w-5" />
                    </div>
                    <span className="text-neutral-900 dark:text-white font-bold tracking-wide">Hubz FOC</span>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 flex justify-around items-center pb-[env(safe-area-inset-bottom)] pt-2 px-2 transition-colors shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                <BottomNavItem href="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Home" active={pathname === "/"} />
                <BottomNavItem href="/inventory" icon={<Package className="w-5 h-5" />} label="Inventory" active={pathname.startsWith("/inventory")} />
                <BottomNavItem href="/kol" icon={<Users className="w-5 h-5" />} label="KOL" active={pathname.startsWith("/kol")} />
                <BottomNavItem href="/audit" icon={<History className="w-5 h-5" />} label="Audit" active={pathname.startsWith("/audit")} />
                <BottomNavItem href="/faq" icon={<HelpCircle className="w-5 h-5" />} label="Help" active={pathname.startsWith("/faq")} />
                <BottomNavItem href="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" active={pathname.startsWith("/settings")} />
            </div>

            {/* Main Content Pane */}
            <main id="main-content" className="flex-1 relative z-10 w-full md:pt-0 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 h-screen overflow-y-auto custom-scrollbar">
                {children}
            </main>
        </div>
    );
}

function BottomNavItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center w-16 h-12 gap-1 touch-manipulation">
            <div className={cn(
                "p-1 rounded-full transition-all duration-300",
                active ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            )}>
                {icon}
            </div>
            <span className={cn(
                "text-[10px] font-medium transition-colors",
                active ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400"
            )}>
                {label}
            </span>
        </Link>
    );
}

function NavItem({ icon, label, active, open, href, onClick }: { icon: React.ReactNode, label: string, active?: boolean, open: boolean, href?: string, onClick?: () => void }) {
    if (!href) return null;

    return (
        <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={cn(
            "flex items-center h-12 md:h-11 px-3.5 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group border",
            active
                ? "bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 dark:border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)] border-l-[3px] border-l-blue-500"
                : "border-transparent hover:bg-neutral-100 dark:hover:bg-white/10 dark:hover:border-white/5 text-neutral-500 dark:text-neutral-400 dark:hover:text-white hover:text-neutral-900"
        )}>
            <div className="shrink-0">{icon}</div>
            <AnimatePresence>
                {open && (
                    <motion.span
                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: "auto", marginLeft: 12 }}
                        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                        className={cn(
                            "text-sm font-medium whitespace-nowrap",
                            active ? "text-blue-400" : "text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 group-hover:dark:text-white"
                        )}
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </Link>
    );
}
