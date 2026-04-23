"use client";

import { useState, useCallback, useTransition, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { InventoryItem } from "@/types/inventory";
import dynamic from "next/dynamic"

const QuickViewPanel = dynamic(
    () => import("@/components/shared/QuickViewPanel").then((mod) => mod.QuickViewPanel),
    { ssr: false }
)
import { PageHeader } from "@/components/shared/PageHeader";
import { useTheme } from "next-themes";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Database, Megaphone, Search, Filter, Check, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const GrainOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] contrast-150 brightness-110" 
       style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
);

const MasterListTab = dynamic(
    () => import("./MasterListTab").then((mod) => mod.MasterListTab), 
    { loading: () => <div className="h-[600px] w-full animate-pulse bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm rounded-3xl border border-black/5 dark:border-white/5" /> }
);
const ModelsTab = dynamic(
    () => import("./ModelsTab").then((mod) => mod.ModelsTab),
    { loading: () => <div className="h-[600px] w-full animate-pulse bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm rounded-3xl border border-black/5 dark:border-white/5" /> }
);
const CampaignsTab = dynamic(
    () => import("./CampaignsTab").then((mod) => mod.CampaignsTab),
    { loading: () => <div className="h-[600px] w-full animate-pulse bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm rounded-3xl border border-black/5 dark:border-white/5" /> }
);
import { updateParam, urlToTab, tabToUrl } from "@/lib/url-params";
import { isStatusAvailable, isStatusLoaned } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function InventoryClient({ inventory, initialFilter }: { inventory: InventoryItem[]; initialFilter?: string }) {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [_isPending, startTransition] = useTransition();
    const isUpdatingUrl = useRef(false);

    const urlTab = searchParams.get("tab");
    const resolvedTab = urlToTab(urlTab || "") || "master";
    
    // Optimistic state for immediate UI feedback before the URL updates
    const [optimisticTab, setOptimisticTab] = useState<string | null>(null);
    const activeTab = optimisticTab || resolvedTab;

    const handleTabChange = useCallback((value: string) => {
        setOptimisticTab(value);
        isUpdatingUrl.current = true;
        startTransition(() => {
            const newSearch = updateParam(searchParams, "tab", tabToUrl(value));
            router.replace(`${pathname}${newSearch}`, { scroll: false });
        });
    }, [searchParams, router, pathname]);

    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [statusFilter, setStatusFilter] = useState(() => {
        if (initialFilter === "unreturn") return "UNRETURN";
        return "ALL";
    });
    const [locationFilter, setLocationFilter] = useState(() => {
        if (initialFilter === "available") return "AVAILABLE";
        if (initialFilter === "loaned") return "LOANED";
        return "ALL";
    });

    useEffect(() => {
        setOptimisticTab(null);
        isUpdatingUrl.current = false;
    }, [urlTab]);

    const stats = useMemo(() => {
        let available = 0, loaned = 0, unreturn = 0;
        for (const item of inventory) {
            if (isStatusAvailable(item.statusLocation)) available++;
            if (isStatusLoaned(item.statusLocation)) loaned++;
            if (item.focStatus?.toUpperCase().trim() === 'UNRETURN') unreturn++;
        }
        return { total: inventory.length, available, loaned, unreturn };
    }, [inventory]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        // We'll let the child tabs handle the URL syncing for search to keep their logic intact,
        // or we could lift it here. For now, let's just pass it down.
    };


    return (
        <div className={`${outfit.variable} ${jetbrainsMono.variable} min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-zinc-500 dark:text-zinc-400 selection:bg-blue-500/30 font-sans antialiased transition-colors duration-500 relative w-full h-full`}>
            <GrainOverlay />
            
            <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/5 blur-[140px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-8 md:py-12 space-y-8 md:space-y-12">
                <PageHeader
                    title="Inventory Bank"
                    subtitle="Precision hardware lifecycle management for high-velocity marketing operations."
                    availableUnits={inventory.filter(i => isStatusAvailable(i.statusLocation))}
                    loanedItems={inventory.filter(i => isStatusLoaned(i.statusLocation))}
                />

                {/* Inventory Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Fleet', value: stats.total, Icon: Database, accent: 'blue' as const, onClick: () => { setStatusFilter('ALL'); setLocationFilter('ALL'); } },
                        { label: 'Available', value: stats.available, Icon: CheckCircle2, accent: 'green' as const, onClick: () => { setStatusFilter('ALL'); setLocationFilter('AVAILABLE'); } },
                        { label: 'On Loan', value: stats.loaned, Icon: Clock, accent: 'orange' as const, onClick: () => { setStatusFilter('ALL'); setLocationFilter('LOANED'); } },
                        { label: 'Unreturned', value: stats.unreturn, Icon: AlertTriangle, accent: 'amber' as const, onClick: () => setStatusFilter('UNRETURN') },
                    ].map((stat) => (
                        <button
                            key={stat.label}
                            onClick={stat.onClick}
                            className="group flex items-center gap-3 p-3 md:p-4 bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.05] rounded-2xl backdrop-blur-xl transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.03] text-left shadow-sm"
                        >
                            <div className={cn(
                                "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0",
                                stat.accent === 'blue' && 'bg-blue-500/10 text-blue-500',
                                stat.accent === 'green' && 'bg-emerald-500/10 text-emerald-500',
                                stat.accent === 'orange' && 'bg-orange-500/10 text-orange-500',
                                stat.accent === 'amber' && 'bg-amber-500/10 text-amber-500',
                            )}>
                                <stat.Icon className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-600">{stat.label}</p>
                                <p className="text-lg md:text-xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">{stat.value}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <nav className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-black/[0.03] dark:border-white/[0.03] w-full lg:w-auto overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {[
                            { id: "master", label: "Master List", icon: Database },
                            { id: "models", label: "Device Models", icon: Smartphone },
                            { id: "campaigns", label: "Campaigns", icon: Megaphone },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 rounded-xl text-sm font-bold transition-all font-display whitespace-nowrap snap-start shrink-0",
                                    activeTab === tab.id 
                                        ? "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-none" 
                                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
                                )}
                            >
                                <tab.icon size={16} className={activeTab === tab.id ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="relative w-full max-w-sm group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Filter data matrix..."
                                className="h-12 bg-white dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-full pl-12 pr-6 focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30 shadow-none text-sm transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        
                        {(activeTab === "master" || activeTab === "models") && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button 
                                        className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-3 group shrink-0 border-0"
                                    >
                                        <Filter className="w-4 h-4" />
                                        <span className="font-bold">Filters</span>
                                        {(statusFilter !== 'ALL' || (activeTab === 'master' && locationFilter !== 'ALL')) ? (
                                            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                                        ) : null}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl space-y-4" align="end">
                                    <div className="space-y-2.5">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 px-1">Status Class</h4>
                                        <div className="grid grid-cols-1 gap-1">
                                            {[
                                                { id: 'ALL', label: 'All Status' },
                                                { id: 'RETURN', label: 'Returned' },
                                                { id: 'UNRETURN', label: 'Unreturned' },
                                                ...(activeTab === 'master' ? [{ id: 'MISSING', label: 'Missing' }] : []),
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setStatusFilter(opt.id)}
                                                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                        statusFilter === opt.id 
                                                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                                            : "text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200"
                                                    }`}
                                                >
                                                    {opt.label}
                                                    {statusFilter === opt.id && <Check className="w-3.5 h-3.5" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {activeTab === 'master' && (
                                        <>
                                            <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />
                                            <div className="space-y-2.5">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 px-1">Vault Location</h4>
                                                <div className="grid grid-cols-1 gap-1">
                                                    {[
                                                        { id: 'ALL', label: 'All Locations' },
                                                        { id: 'AVAILABLE', label: 'In Stock' },
                                                        { id: 'LOANED', label: 'On Loan' },
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setLocationFilter(opt.id)}
                                                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                                locationFilter === opt.id 
                                                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                                                    : "text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200"
                                                            }`}
                                                        >
                                                            {opt.label}
                                                            {locationFilter === opt.id && <Check className="w-3.5 h-3.5" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    
                                    {(statusFilter !== 'ALL' || (activeTab === 'master' && locationFilter !== 'ALL')) ? (
                                        <div className="pt-2">
                                            <button 
                                                onClick={() => { setStatusFilter('ALL'); setLocationFilter('ALL'); }}
                                                className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    ) : null}
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                    >
                        {activeTab === "master" && (
                            <MasterListTab 
                                inventory={inventory} 
                                setSelectedItem={setSelectedItem} 
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                statusFilter={statusFilter}
                                locationFilter={locationFilter}
                            />
                        )}
                        {activeTab === "models" && (
                            <ModelsTab 
                                inventory={inventory} 
                                setSelectedItem={setSelectedItem}
                                searchQuery={searchQuery}
                                statusFilter={statusFilter}
                            />
                        )}
                        {activeTab === "campaigns" && (
                            <CampaignsTab 
                                inventory={inventory} 
                                setSelectedItem={setSelectedItem}
                                searchQuery={searchQuery}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                <QuickViewPanel
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onOpenChange={(open) => !open && setSelectedItem(null)}
                />
            </div>

        </div>
    );
}
