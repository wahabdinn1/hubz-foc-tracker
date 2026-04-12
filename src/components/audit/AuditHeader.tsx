"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { useInventoryStats } from "@/hooks/useInventoryStats"
import type { InventoryItem } from "@/types/inventory"

interface AuditHeaderProps {
    inventory: InventoryItem[]
    eventCount: number
}

export function AuditHeader({ inventory, eventCount }: AuditHeaderProps) {
    const { availableUnits, loanedItems } = useInventoryStats(inventory)

    return (
        <PageHeader
            title="Audit Log"
            subtitle={`Exhaustive chronological history of all device requests and returns. Search across ${eventCount} total events.`}
            availableUnits={availableUnits}
            loanedItems={loanedItems}
            allInventory={inventory}
        />
    )
}
