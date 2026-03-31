"use client";

import { useState, useTransition } from "react";
import { InventoryItem, revalidateInventory } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickViewPanel } from "./QuickViewPanel";
import { ThemeToggle } from "./ThemeToggle";
import { RefreshCw, Smartphone, Database, Megaphone } from "lucide-react";

import { ModelsTab } from "./inventory/ModelsTab";
import { MasterListTab } from "./inventory/MasterListTab";
import { CampaignsTab } from "./inventory/CampaignsTab";

export function InventoryClient({ inventory }: { inventory: InventoryItem[] }) {
    // Shared State
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSync = () => {
        startTransition(async () => {
            const res = await revalidateInventory();
            if (res.success) {
                toast.success("Inventory synchronized with Google Sheets");
            } else {
                toast.error("Failed to sync inventory");
            }
        });
    };

    return (
        <div className="w-full h-full space-y-4 md:space-y-6 pb-10 p-4 md:p-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white transition-colors mb-1">
                        Inventory Bank
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Deeply manage and aggregate the hardware lifecycle.</p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-white/80 dark:bg-neutral-900/40 p-1 md:p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] transition-colors backdrop-blur-xl shadow-xl">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSync}
                        disabled={isPending}
                        className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                        title="Force Sync with Google Sheets"
                    >
                        <RefreshCw className={cn("w-5 h-5", isPending && "animate-spin text-blue-400")} />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="models" className="w-full relative z-10">
                <TabsList className="bg-black/5 dark:bg-neutral-900/50 border border-black/5 dark:border-white/[0.05] p-1 h-auto rounded-2xl mb-4 md:mb-6 w-full sm:w-auto transition-colors">
                    <TabsTrigger value="models" className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Device Models
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="master" className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Master List
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Megaphone className="w-4 h-4" />
                            Campaigns
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 2: DEVICE MODELS */}
                <TabsContent value="models" className="m-0 focus-visible:ring-0">
                    <ModelsTab inventory={inventory} setSelectedItem={setSelectedItem} />
                </TabsContent>

                {/* TAB 1: MASTER LIST */}
                <TabsContent value="master" className="m-0 focus-visible:ring-0">
                    <MasterListTab inventory={inventory} setSelectedItem={setSelectedItem} />
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
