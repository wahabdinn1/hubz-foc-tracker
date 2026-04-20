"use client";

import React, { useCallback, ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export const Scorecard = React.memo(function Scorecard({
    title,
    value,
    icon,
    className,
    children,
    subtitle,
    onClick
}: {
    title?: string,
    value?: string | number,
    icon?: ReactNode;
    className?: string;
    children?: ReactNode;
    subtitle?: string;
    onClick?: () => void;
}) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    }, [mouseX, mouseY]);

    return (
        <div
            onMouseMove={handleMouseMove}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
            className={cn(
                "group relative overflow-hidden rounded-2xl md:rounded-[20px] bg-white dark:bg-neutral-900/50 border border-black/5 dark:border-white/[0.08] backdrop-blur-2xl shadow-lg flex flex-col p-5 min-h-[110px] transition-all duration-300 hover:border-black/10 dark:hover:border-white/20",
                onClick && "cursor-pointer hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900",
                className
            )}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            450px circle at ${mouseX}px ${mouseY}px,
                            var(--scorecard-glow, rgba(59, 130, 246, 0.08)),
                            transparent 80%
                        )
                    `,
                }}
            />

            {children ? <div className="relative z-10 flex-1 flex flex-col">{children}</div> : (
                <div className="flex flex-col gap-1 z-10 h-full justify-between">
                    <div className="flex items-center justify-between relative z-10 pb-3">
                        <h3 className="text-[13px] uppercase font-bold tracking-widest text-neutral-500 dark:text-neutral-400 transition-colors">
                            {title}
                        </h3>
                        <div className="text-blue-600 dark:text-blue-400 p-2.5 bg-blue-50/80 dark:bg-blue-500/10 rounded-xl shrink-0 border border-blue-100 dark:border-blue-500/20 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 [&_svg]:size-4">
                            {icon}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight transition-colors">
                                {value}
                            </p>
                        </div>
                        {subtitle && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-medium transition-colors">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

Scorecard.displayName = "Scorecard";
