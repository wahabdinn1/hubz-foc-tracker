"use client";

import { useState } from "react";
import type { InventoryItem } from "@/types/inventory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickViewPanel } from "@/components/shared/QuickViewPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { Smartphone, Database, Megaphone } from "lucide-react";
import { useInventoryStats } from "@/hooks/useInventoryStats";

import { ModelsTab } from "./ModelsTab";
import { MasterListTab } from "./MasterListTab";
import { CampaignsTab } from "./CampaignsTab";

export function InventoryClient({ inventory, initialFilter }: { inventory: InventoryItem[]; initialFilter?: string }) {
    // Shared State
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const { availableUnits, loanedItems } = useInventoryStats(inventory);

    return (
        <div className="w-full h-full space-y-4 md:space-y-6 pb-10 p-4 md:p-10">
            {/* Header */}
            <PageHeader
                title="Inventory Bank"
                subtitle="Deeply manage and aggregate the hardware lifecycle."
                availableUnits={availableUnits}
                loanedItems={loanedItems}
                allInventory={inventory}
            />

            <Tabs defaultValue="master" className="w-full relative z-10">
                <TabsList className="bg-black/5 dark:bg-neutral-900/50 border border-black/5 dark:border-white/[0.05] p-1 h-auto rounded-2xl mb-4 md:mb-6 w-full sm:w-auto transition-colors">
                    <TabsTrigger value="master" className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Master List
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="models" className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Device Models
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Megaphone className="w-4 h-4" />
                            Campaigns
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: MASTER LIST */}
                <TabsContent value="master" className="m-0 focus-visible:ring-0">
                    <MasterListTab inventory={inventory} setSelectedItem={setSelectedItem} initialFilter={initialFilter} />
                </TabsContent>

                {/* TAB 2: DEVICE MODELS */}
                <TabsContent value="models" className="m-0 focus-visible:ring-0">
                    <ModelsTab inventory={inventory} setSelectedItem={setSelectedItem} />
                </TabsContent>

                {/* TAB 3: CAMPAIGNS */}
                <TabsContent value="campaigns" className="m-0 focus-visible:ring-0">
                    <CampaignsTab inventory={inventory} setSelectedItem={setSelectedItem} />
                </TabsContent>
            </Tabs>

            <QuickViewPanel
                item={selectedItem}
                isOpen={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </div>
    );
}
