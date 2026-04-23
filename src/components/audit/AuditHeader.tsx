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
            title="Audit Ledger"
            subtitle="Historical trace of every device mutation, transfer, and lifecycle event."
            availableUnits={availableUnits}
            loanedItems={loanedItems}
        />
    )
}
