"use client";

import { useState, useMemo } from "react";
import type { InventoryItem } from "@/types/inventory";
import type { DeviceModelGroup, VariantGroup } from "./models/types";
import { extractBaseModel } from "./models/utils";
import { ModelLevel1Grid } from "./models/ModelLevel1Grid";
import { ModelLevel2Cards } from "./models/ModelLevel2Cards";
import { ModelLevel3Units } from "./models/ModelLevel3Units";

interface ModelsTabProps {
    inventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
    searchQuery: string;
    statusFilter: string;
}

export function ModelsTab({ inventory, setSelectedItem, searchQuery, statusFilter }: ModelsTabProps) {
    const [selectedBaseModel, setSelectedBaseModel] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

    // Build two-level hierarchy: baseModel → variants → items
    const deviceModelGroups = useMemo(() => {
        const baseModelMap = new Map<string, Map<string, InventoryItem[]>>();

        for (const item of inventory) {
            if (!item.unitName || item.unitName.trim() === "-" || item.unitName.trim() === "N/A" || item.unitName.trim() === "") continue;

            // Apply FOC Status Filter
            if (statusFilter !== "ALL") {
                const itemStatus = item.focStatus?.toUpperCase().trim() || "";
                if (itemStatus !== statusFilter) continue;
            }

            const baseModel = extractBaseModel(item.unitName);
            const variantName = item.unitName.trim();

            if (!baseModelMap.has(baseModel)) {
                baseModelMap.set(baseModel, new Map());
            }
            const variantMap = baseModelMap.get(baseModel)!;
            if (!variantMap.has(variantName)) {
                variantMap.set(variantName, []);
            }
            variantMap.get(variantName)!.push(item);
        }

        const groups: DeviceModelGroup[] = [];

        for (const [baseModel, variantMap] of baseModelMap) {
            const variants: VariantGroup[] = [];
            let totalAll = 0, availAll = 0, loanAll = 0, retAll = 0, unretAll = 0;

            for (const [variantName, items] of variantMap) {
                let available = 0, loaned = 0, returned = 0, unreturned = 0;
                for (const i of items) {
                    const loc = i.statusLocation?.toUpperCase() || "";
                    if (loc.includes("AVAILABLE")) available++;
                    if (loc.includes("LOANED") || loc.includes("ON KOL")) loaned++;
                    if (i.focStatus?.toUpperCase().trim() === "RETURN") returned++;
                    if (i.focStatus?.toUpperCase().trim() === "UNRETURN") unreturned++;
                }

                variants.push({ name: variantName, items, total: items.length, available, loaned, returned, unreturned });

                totalAll += items.length;
                availAll += available;
                loanAll += loaned;
                retAll += returned;
                unretAll += unreturned;
            }

            variants.sort((a, b) => a.name.localeCompare(b.name));

            groups.push({
                baseModel, variants, total: totalAll, available: availAll,
                loaned: loanAll, returned: retAll, unreturned: unretAll,
                variantCount: variants.length,
            });
        }

        return groups.sort((a, b) => b.total - a.total);
    }, [inventory, statusFilter]);

    const filteredGroups = deviceModelGroups.filter(g =>
        g.baseModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.variants.some(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const activeGroup = selectedBaseModel ? deviceModelGroups.find(g => g.baseModel === selectedBaseModel) : null;
    const activeVariant = activeGroup && selectedVariant ? activeGroup.variants.find(v => v.name === selectedVariant) : null;

    // Level 3: Units
    if (activeGroup && activeVariant) {
        return (
            <ModelLevel3Units
                activeGroup={activeGroup}
                activeVariant={activeVariant}
                setSelectedBaseModel={setSelectedBaseModel}
                setSelectedVariant={setSelectedVariant}
                setSelectedItem={setSelectedItem}
            />
        );
    }

    // Level 2: Variants
    if (activeGroup) {
        return (
            <ModelLevel2Cards
                activeGroup={activeGroup}
                setSelectedBaseModel={setSelectedBaseModel}
                setSelectedVariant={setSelectedVariant}
            />
        );
    }

    return (
        <ModelLevel1Grid
            filteredGroups={filteredGroups}
            modelSearch={searchQuery}
            setSelectedBaseModel={setSelectedBaseModel}
        />
    );
}
