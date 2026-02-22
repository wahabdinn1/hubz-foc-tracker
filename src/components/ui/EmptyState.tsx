import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
    return (
        <div className={cn("w-full h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500", className)}>
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/[0.05] flex items-center justify-center mb-4 transition-colors">
                <Icon className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1 transition-colors tracking-tight">
                {title}
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm transition-colors">
                {description}
            </p>
        </div>
    );
}
