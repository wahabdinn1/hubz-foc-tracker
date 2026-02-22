"use client";

import { useState, useMemo } from "react";
import { InventoryItem } from "@/server/actions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Megaphone, Search } from "lucide-react";

interface CampaignsTabProps {
    inventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
}

export function CampaignsTab({ inventory, setSelectedItem }: CampaignsTabProps) {
    const [campaignSearch, setCampaignSearch] = useState("");
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
            const available = items.filter(i => !!i.statusLocation?.toUpperCase().includes("AVAILABLE")).length;
            const loaned = items.filter(i => !!i.statusLocation?.toUpperCase().includes("LOANED")).length;
            const uniqueModels = new Set(items.map(i => i.unitName?.trim()).filter(Boolean)).size;

            return {
                name,
                items,
                total: items.length,
                available,
                loaned,
                uniqueModels
            };
        }).sort((a, b) => b.total - a.total);
    }, [inventory]);

    const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(campaignSearch.toLowerCase()));
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {activeCampaignData.items.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedItem(item)}
                                className="group cursor-pointer flex flex-col gap-3 bg-white/80 dark:bg-neutral-950/40 shadow-sm dark:shadow-none border border-black/5 dark:border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 hover:bg-black/5 dark:hover:bg-neutral-800/50 hover:border-purple-500/30 transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-200 text-sm truncate">{item.unitName || "Unknown Unit"}</h3>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono mt-0.5 truncate">IMEI: {item.imei || "N/A"}</p>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "px-2 py-0.5 text-[10px] whitespace-nowrap shrink-0 ml-2",
                                        item.statusLocation?.includes("AVAILABLE") ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                            item.statusLocation?.includes("LOANED / ON KOL") ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20"
                                    )}>
                                        {item.statusLocation || "UNKNOWN"}
                                    </Badge>
                                </div>

                                <div className="mt-1 pt-3 border-t border-black/5 dark:border-white/5 flex flex-col gap-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-500">Holder:</span>
                                        <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate ml-2">{item.onHolder || "-"}</span>
                                    </div>
                                    {item.plannedReturnDate && item.plannedReturnDate !== "-" && item.plannedReturnDate !== "N/A" && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-500">Return:</span>
                                            <span className={cn(
                                                "font-medium",
                                                item.plannedReturnDate === 'ASAP' ? "text-red-400" : "text-neutral-700 dark:text-neutral-300"
                                            )}>{item.plannedReturnDate}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/80 dark:bg-neutral-900/40 p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] backdrop-blur-xl shadow-xl w-full max-w-sm flex items-center focus-within:border-white/[0.15] transition-colors">
                <Search className="w-5 h-5 text-neutral-500 ml-3 shrink-0" />
                <Input
                    placeholder="Search by campaign name..."
                    className="border-none bg-transparent focus-visible:ring-0 text-neutral-900 dark:text-white placeholder:text-neutral-500 shadow-none"
                    value={campaignSearch}
                    onChange={(e) => setCampaignSearch(e.target.value)}
                />
            </div>

            {filteredCampaigns.length === 0 ? (
                <div className="text-center py-20 text-neutral-500">
                    <Megaphone className="w-12 h-12 text-neutral-700 mx-auto mb-4 opacity-50" />
                    <p>No campaigns found matching {campaignSearch}</p>
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
