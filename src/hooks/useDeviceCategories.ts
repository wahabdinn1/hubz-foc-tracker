"use client"

import { useMemo } from "react"
import { getDeviceCategory } from "@/lib/device-utils"
import type { InventoryItem } from "@/types/inventory"

export type ItemFilterFn = (item: InventoryItem) => boolean

interface CategoryInfo {
    name: string
    count: number
}

export function useDeviceCategories(items: InventoryItem[], filterFn: ItemFilterFn) {
    const categoryMap = useMemo(() => {
        const map = new Map<string, InventoryItem[]>()

        items.filter(filterFn).forEach(item => {
            const category = getDeviceCategory(item.unitName || "")
            const list = map.get(category) || []
            list.push(item)
            map.set(category, list)
        })

        return map
    }, [items, filterFn])

    const categories = useMemo((): CategoryInfo[] => {
        const allCats = Array.from(categoryMap.entries()).map(([name, catItems]) => ({
            name,
            count: catItems.length,
        }))
        return allCats.sort((a, b) => {
            if (a.name === "Others") return 1
            if (b.name === "Others") return -1
            return a.name.localeCompare(b.name)
        })
    }, [categoryMap])

    function getFilteredItems(selectedCategory: string): InventoryItem[] {
        if (!selectedCategory) return []
        return categoryMap.get(selectedCategory) || []
    }

    return { categoryMap, categories, getFilteredItems }
}
