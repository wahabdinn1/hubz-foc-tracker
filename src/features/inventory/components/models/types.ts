import type { InventoryItem } from "@/types/inventory";

export interface VariantGroup {
    name: string;
    items: InventoryItem[];
    total: number;
    available: number;
    loaned: number;
    returned: number;
    unreturned: number;
}

export interface DeviceModelGroup {
    baseModel: string;
    variants: VariantGroup[];
    total: number;
    available: number;
    loaned: number;
    returned: number;
    unreturned: number;
    variantCount: number;
}
