"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Package, User, Megaphone, Settings } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

interface CommandPaletteProps {
    inventory: InventoryItem[];
}

export function CommandPalette({ inventory }: CommandPaletteProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Global keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Pre-compute unique KOLs and campaigns
    const { uniqueKOLs, uniqueCampaigns } = useMemo(() => {
        const kols = new Set<string>();
        const campaigns = new Set<string>();
        for (const item of inventory) {
            if (item.onHolder && item.onHolder.trim() !== "" && item.onHolder.trim() !== "-" && item.onHolder.trim() !== "N/A") {
                kols.add(item.onHolder.trim());
            }
            if (item.campaignName && item.campaignName.trim() !== "" && item.campaignName.trim() !== "-") {
                campaigns.add(item.campaignName.trim());
            }
        }
        return { uniqueKOLs: Array.from(kols).sort(), uniqueCampaigns: Array.from(campaigns).sort() };
    }, [inventory]);

    const handleSelect = (action: string) => {
        setOpen(false);
        if (action.startsWith("nav:")) {
            router.push(action.replace("nav:", ""));
        } else if (action.startsWith("filter:")) {
            router.push(`/inventory?filter=${action.replace("filter:", "")}`);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-xl hover:bg-muted/50 transition-colors backdrop-blur-xl"
            >
                <Search className="size-3.5" />
                <span>Search…</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded text-muted-foreground border border-border">
                    ⌘ K
                </kbd>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden p-0 max-w-lg bg-white/95 dark:bg-neutral-950/95 border-neutral-200 dark:border-neutral-800 backdrop-blur-2xl shadow-2xl [&>button]:hidden">
                    <DialogTitle className="sr-only">Command Palette</DialogTitle>
                    <Command className="bg-transparent">
                        <CommandInput
                            placeholder="Search devices, KOLs, campaigns…"
                            className="h-12 text-foreground border-b border-border"
                        />
                        <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <CommandEmpty className="py-6 text-center text-sm text-neutral-500">No results found.</CommandEmpty>

                            {/* Quick Navigation */}
                            <CommandGroup heading="Navigation" className="text-neutral-500 dark:text-neutral-400">
                                <CommandItem onSelect={() => handleSelect("nav:/")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                    <Package className="mr-2 size-4 text-blue-500" />
                                    Dashboard
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelect("nav:/inventory")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                    <Package className="mr-2 size-4 text-blue-500" />
                                    Inventory Bank
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelect("nav:/kol")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                    <User className="mr-2 size-4 text-blue-500" />
                                    KOL Directory
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelect("nav:/settings")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                    <Settings className="mr-2 size-4 text-blue-500" />
                                    Settings
                                </CommandItem>
                            </CommandGroup>

                            {/* Quick Filters */}
                            <CommandGroup heading="Quick Filters" className="text-neutral-500 dark:text-neutral-400">
                                <CommandItem onSelect={() => handleSelect("filter:available")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                    <div className="mr-2 size-2 rounded-full bg-green-500" />
                                    Available Devices
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelect("filter:loaned")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                    <div className="mr-2 size-2 rounded-full bg-orange-500" />
                                    Loaned Devices
                                </CommandItem>
                                <CommandItem onSelect={() => handleSelect("filter:unreturn")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                    <div className="mr-2 size-2 rounded-full bg-red-500" />
                                    Unreturned Devices
                                </CommandItem>
                            </CommandGroup>

                            {/* KOLs */}
                            {uniqueKOLs.length > 0 && (
                                <CommandGroup heading="KOL Profiles" className="text-neutral-500 dark:text-neutral-400">
                                    {uniqueKOLs.slice(0, 10).map((kol) => (
                                        <CommandItem key={kol} onSelect={() => handleSelect("nav:/kol")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                            <User className="mr-2 size-4 text-purple-500" />
                                            {kol}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Campaigns */}
                            {uniqueCampaigns.length > 0 && (
                                <CommandGroup heading="Campaigns" className="text-neutral-500 dark:text-neutral-400">
                                    {uniqueCampaigns.slice(0, 8).map((campaign) => (
                                        <CommandItem key={campaign} onSelect={() => handleSelect("nav:/inventory")} className="cursor-pointer text-foreground hover:bg-muted aria-selected:bg-muted">
                                            <Megaphone className="mr-2 size-4 text-pink-500" />
                                            {campaign}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    );
}
