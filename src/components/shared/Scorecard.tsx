"use client";

import React, { useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Scorecard({
    title,
    value,
    icon,
    className,
    children,
    subtitle
}: {
    title?: string,
    value?: string | number,
    icon?: ReactNode;
    className?: string;
    children?: ReactNode;
    subtitle?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            className={cn(
                "group relative overflow-hidden rounded-2xl bg-white/50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] backdrop-blur-xl shadow-lg flex flex-col p-4 min-h-[100px] transition-colors hover:border-black/10 dark:hover:border-white/[0.15]",
                className
            )}
        >
            {/* Spotlight Hover Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`,
                }}
            />

            {children ? <div className="relative z-10 flex-1 flex flex-col">{children}</div> : (
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center justify-between relative z-10 space-y-0 pb-2">
                        <h3 className="text-sm font-medium tracking-wide text-neutral-500 dark:text-neutral-400 transition-colors">{title}</h3>
                        <div className="text-blue-600 dark:text-blue-400 p-2 bg-blue-500/10 rounded-xl shrink-0 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-colors">
                            {icon}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight transition-colors">{value}</p>
                    </div>
                    {subtitle && (
                        <p className="text-xs text-neutral-500 mt-1 font-medium transition-colors">{subtitle}</p>
                    )}
                </div>
            )}
        </div>
    );
}
