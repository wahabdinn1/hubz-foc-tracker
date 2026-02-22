"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IconMenu2, IconX, IconLayoutDashboard, IconBox, IconUsers } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="flex bg-neutral-50 dark:bg-neutral-950 min-h-screen w-full relative overflow-hidden font-sans selection:bg-blue-500/30 text-neutral-900 dark:text-neutral-50 transition-colors">
            {/* Deep Space Background Dot Matrix */}
            <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#0000001a_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Desktop Sidebar */}
            <motion.div
                animate={{ width: open ? "240px" : "80px" }}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                className="hidden md:flex flex-col border-r border-black/5 dark:border-white/5 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-2xl relative z-40 h-screen shrink-0 overflow-hidden shadow-2xl transition-colors"
            >
                <div className="flex h-[72px] items-center flex-shrink-0 px-[22px] gap-4 border-b border-black/5 dark:border-white/[0.05] overflow-hidden transition-colors">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-1 ring-blue-400/30">
                        <IconBox className="text-white h-5 w-5" />
                    </div>
                    <AnimatePresence>
                        {open && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="text-neutral-900 dark:text-white font-bold tracking-wide whitespace-nowrap text-lg"
                            >
                                Hubz FOC
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <nav className="flex-1 px-3 py-8 space-y-2">
                    <NavItem href="/" icon={<IconLayoutDashboard className={cn(pathname === "/" && "text-blue-400")} />} label="Dashboard" active={pathname === "/"} open={open} />
                    <NavItem href="/inventory" icon={<IconBox className={cn(pathname.startsWith("/inventory") && "text-blue-400")} />} label="Inventory Bank" active={pathname.startsWith("/inventory")} open={open} />
                    <NavItem href="/kol" icon={<IconUsers className={cn(pathname.startsWith("/kol") && "text-blue-400")} />} label="KOL Management" active={pathname.startsWith("/kol")} open={open} />
                </nav>
            </motion.div>

            {/* Mobile Header */}
            <div className="flex md:hidden h-16 w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md items-center justify-between px-4 fixed top-0 z-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        <IconBox className="text-white h-5 w-5" />
                    </div>
                    <span className="text-neutral-900 dark:text-white font-bold tracking-wide">Hubz FOC</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setOpen(!open)} className="text-neutral-500 dark:text-neutral-400 focus:outline-none">
                        {open ? <IconX /> : <IconMenu2 />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                        className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-3xl p-4 border-t border-black/5 dark:border-white/5 transition-colors"
                    >
                        <nav className="space-y-2">
                            <NavItem href="/" icon={<IconLayoutDashboard className={cn(pathname === "/" && "text-blue-400")} />} label="Dashboard" active={pathname === "/"} open={true} onClick={() => setOpen(false)} />
                            <NavItem href="/inventory" icon={<IconBox className={cn(pathname.startsWith("/inventory") && "text-blue-400")} />} label="Inventory Bank" active={pathname.startsWith("/inventory")} open={true} onClick={() => setOpen(false)} />
                            <NavItem href="/kol" icon={<IconUsers className={cn(pathname.startsWith("/kol") && "text-blue-400")} />} label="KOL Management" active={pathname.startsWith("/kol")} open={true} onClick={() => setOpen(false)} />
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Pane */}
            <div className="flex-1 relative z-10 w-full md:pt-0 pt-16 h-screen overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    );
}

function NavItem({ icon, label, active, open, href, onClick }: { icon: React.ReactNode, label: string, active?: boolean, open: boolean, href?: string, onClick?: () => void }) {
    if (!href) return null;

    return (
        <Link href={href} onClick={onClick} className={cn(
            "flex items-center h-12 md:h-11 px-3.5 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group border",
            active
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                : "border-transparent hover:bg-black/5 dark:hover:bg-white/10 dark:hover:border-white/5 text-neutral-500 dark:text-neutral-400 dark:hover:text-white hover:text-neutral-900"
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
