"use client";

import { useState, useMemo } from "react";
import type { InventoryItem } from "@/types/inventory";
import { isStatusAvailable, isStatusLoaned } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Megaphone, Search, Smartphone } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface CampaignsTabProps {
    inventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
    searchQuery: string;
}

export function CampaignsTab({ inventory, setSelectedItem, searchQuery }: CampaignsTabProps) {
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

    const campaigns = useMemo(() => {
        const groups: Record<string, typeof inventory> = {};
        for (const item of inventory) {
            const campaign = item.campaignName?.trim();
            if (!campaign || campaign === "-" || campaign === "N/A" || campaign === "") continue;

            if (!groups[campaign]) {
                groups[campaign] = [];
            }
            groups[campaign].push(item);
        }

        return Object.entries(groups).map(([name, items]) => {
            let available = 0, loaned = 0;
            const modelSet = new Set<string>();
            for (const i of items) {
                const loc = i.statusLocation?.toUpperCase() || "";
                if (loc.includes("AVAILABLE")) available++;
                if (loc.includes("LOANED")) loaned++;
                const trimmed = i.unitName?.trim();
                if (trimmed) modelSet.add(trimmed);
            }

            return {
                name,
                items,
                total: items.length,
                available,
                loaned,
                uniqueModels: modelSet.size
            };
        }).sort((a, b) => b.total - a.total);
    }, [inventory]);

    const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const activeCampaignData = selectedCampaign ? campaigns.find(c => c.name === selectedCampaign) : null;

    if (activeCampaignData) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => setSelectedCampaign(null)}
                    className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm font-medium bg-black/5 dark:bg-neutral-900/50 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 w-fit hover:bg-white/10"
                >
                    &larr; Back to Campaigns
                </button>

                <div className="w-full bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-2xl md:rounded-3xl p-4 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col min-h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shrink-0">
                                <Megaphone className="w-7 h-7 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mb-0.5">{activeCampaignData.name}</h2>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{activeCampaignData.total} devices across {activeCampaignData.uniqueModels} model(s).</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 text-xs">
                                {activeCampaignData.available} Available
                            </Badge>
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-3 py-1 text-xs">
                                {activeCampaignData.loaned} Loaned
                            </Badge>
                        </div>
                    </div>

                    {/* Grid Table */}
                    <div className="flex flex-col relative max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar [content-visibility:auto]">
                        {/* Sticky Header */}
                        <div className="sticky top-0 z-20 mb-4 px-4 lg:px-8 py-4 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-xl rounded-2xl border border-black/[0.05] dark:border-white/[0.05] shadow-sm mx-1 mt-1">
                            <div className="hidden lg:grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 items-center">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Unit Identity</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Serial / IMEI</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Custodian</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">GOAT PIC</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Log Date</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">FOC Class</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 text-right">Vault Status</div>
                            </div>
                            <div className="lg:hidden flex justify-between items-center text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                                <span>Ledger Operations</span>
                                <span>{activeCampaignData.items.length} Records</span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            {activeCampaignData.items.length === 0 ? (
                                <div className="py-12">
                                    <EmptyState
                                        icon={Search}
                                        title="No units found"
                                        description="This campaign has no devices matching your criteria."
                                    />
                                </div>
                            ) : activeCampaignData.items.map((item, idx) => {
                                const focUp = item.focStatus?.toUpperCase().trim();
                                return (
                                    <div
                                        key={`${item.imei}-${idx}`}
                                        onClick={() => setSelectedItem(item)}
                                        className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-y-4 gap-x-4 px-4 lg:px-8 py-4 lg:py-3 items-center group relative border-b border-black/[0.02] dark:border-white/[0.02] last:border-0 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Unit Identity */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold group-hover:scale-110 transition-transform shrink-0">
                                                <Smartphone size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display leading-tight truncate">
                                                    {item.unitName || "-"}
                                                </h4>
                                                <span className="lg:hidden text-[10px] font-mono text-zinc-400 truncate block">
                                                    {item.imei || "-"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Serial / IMEI */}
                                        <div className="hidden lg:block">
                                            <code className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-black/[0.03] dark:bg-white/[0.05] px-2 py-1 rounded-lg border border-black/[0.05] dark:border-white/[0.05] truncate block w-fit">
                                                {item.imei || "-"}
                                            </code>
                                        </div>

                                        {/* Custodian */}
                                        <div className="text-xs text-zinc-600 dark:text-zinc-300 font-medium truncate">
                                            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Holder</span>
                                            {item.onHolder || "-"}
                                        </div>

                                        {/* GOAT PIC */}
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">PIC</span>
                                            <div className="flex items-center gap-2">
                                                {(item.goatPic || item.seinPic) && (item.goatPic || item.seinPic) !== "-" && (
                                                    <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold shrink-0">
                                                        {((item.goatPic || item.seinPic) as string).substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-[11px] text-zinc-500 truncate">{(item.goatPic || item.seinPic) || "-"}</span>
                                            </div>
                                        </div>

                                        {/* Log Date */}
                                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono font-bold truncate">
                                            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Date</span>
                                            {item.step3Data?.timestamp && item.step3Data.timestamp.trim() !== "" && item.step3Data.timestamp !== "-" ? item.step3Data.timestamp : "—"}
                                        </div>

                                        {/* FOC Class */}
                                        <div>
                                            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Class</span>
                                            <div className={cn(
                                                "w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                focUp === "RETURN" ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" :
                                                    focUp === "UNRETURN" ? "bg-amber-500/5 text-amber-600 border-amber-500/20" :
                                                        "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                                            )}>
                                                {!focUp || focUp === "-" ? "—" : focUp}
                                            </div>
                                        </div>

                                        {/* Vault Status */}
                                        <div className="flex items-center gap-2 lg:justify-end truncate">
                                            <div className={cn(
                                                "shrink-0 w-1.5 h-1.5 rounded-full",
                                                isStatusAvailable(item.statusLocation) ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" :
                                                isStatusLoaned(item.statusLocation) ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" :
                                                "bg-zinc-300 dark:bg-zinc-700"
                                            )} />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                isStatusAvailable(item.statusLocation) ? "text-zinc-900 dark:text-white" :
                                                isStatusLoaned(item.statusLocation) ? "text-orange-500" :
                                                "text-zinc-500"
                                            )}>
                                                {item.statusLocation || "UNKNOWN"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {filteredCampaigns.length === 0 ? (
                <div className="col-span-full py-12">
                    <EmptyState
                        icon={Megaphone}
                        title="No campaigns found"
                        description={`No campaigns matching "${searchQuery}"`}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredCampaigns.map((campaign, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedCampaign(campaign.name)}
                            className="group cursor-pointer bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.05] hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-xl transition-all hover:bg-neutral-50 dark:hover:bg-white/5 hover:-translate-y-1 shadow-lg flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600/20 to-pink-600/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.15)] border border-purple-500/20">
                                    <Megaphone className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1.5 text-xs font-medium">
                                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                        {campaign.available} left
                                    </Badge>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-white truncate leading-tight mb-2" title={campaign.name}>{campaign.name}</h3>

                            <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-medium text-neutral-500">
                                <span>{campaign.total} Units Total</span>
                                <span>{campaign.uniqueModels} Model(s)</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
