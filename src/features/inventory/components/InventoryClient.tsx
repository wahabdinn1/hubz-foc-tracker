"use client";

import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { InventoryItem } from "@/types/inventory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic"

const QuickViewPanel = dynamic(
    () => import("@/components/shared/QuickViewPanel").then((mod) => mod.QuickViewPanel),
    { ssr: false }
)
import { PageHeader } from "@/components/shared/PageHeader";
import { Smartphone, Database, Megaphone } from "lucide-react";
import { useInventoryStats } from "@/hooks/useInventoryStats";

import { ModelsTab } from "./ModelsTab";
import { MasterListTab } from "./MasterListTab";
import { CampaignsTab } from "./CampaignsTab";
import { updateParam, urlToTab, tabToUrl } from "@/lib/url-params";

export function InventoryClient({ inventory, initialFilter }: { inventory: InventoryItem[]; initialFilter?: string }) {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const { availableUnits, loanedItems } = useInventoryStats(inventory);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [_isPending, startTransition] = useTransition();
    const isUpdatingUrl = useRef(false);

    const urlTab = searchParams.get("tab");
    const defaultTab = urlToTab(urlTab || "") || "master";

    const handleTabChange = useCallback((value: string) => {
        isUpdatingUrl.current = true;
        startTransition(() => {
            const newSearch = updateParam(searchParams, "tab", tabToUrl(value));
            router.replace(`${pathname}${newSearch}`, { scroll: false });
        });
    }, [searchParams, router, pathname]);

    useEffect(() => {
        isUpdatingUrl.current = false;
    }, [urlTab]);

    return (
        <div className="w-full h-full space-y-4 md:space-y-6 pb-10 p-4 md:p-10">
            <PageHeader
                title="Inventory Bank"
                subtitle="Deeply manage and aggregate the hardware lifecycle."
                availableUnits={availableUnits}
                loanedItems={loanedItems}
                allInventory={inventory}
            />

            <Tabs defaultValue={defaultTab} className="w-full relative z-10">
                <TabsList className="bg-black/5 dark:bg-neutral-900/50 border border-black/5 dark:border-white/[0.05] p-1 h-auto rounded-2xl mb-4 md:mb-6 w-full sm:w-auto transition-colors">
                    <TabsTrigger value="master" onClick={() => handleTabChange("master")} className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Master List
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="models" onClick={() => handleTabChange("models")} className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Device Models
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" onClick={() => handleTabChange("campaigns")} className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-neutral-200 flex-1 sm:flex-none">
                        <div className="flex items-center gap-2">
                            <Megaphone className="w-4 h-4" />
                            Campaigns
                        </div>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="master" className="m-0 focus-visible:ring-0">
                    <MasterListTab inventory={inventory} setSelectedItem={setSelectedItem} initialFilter={initialFilter} />
                </TabsContent>

                <TabsContent value="models" className="m-0 focus-visible:ring-0">
                    <ModelsTab inventory={inventory} setSelectedItem={setSelectedItem} />
                </TabsContent>

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
