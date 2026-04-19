"use client";

import { useState, useTransition, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  addDropdownOption,
  deleteDropdownOption,
  updateDropdownOption,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Filter,
} from "lucide-react";
import type { DropdownOption } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DropdownOptionsCardProps {
  initialOptions: DropdownOption[];
}

const CATEGORIES = [
  { id: "CAMPAIGN", label: "Campaigns" },
  { id: "REQUESTOR", label: "Requestors" },
  { id: "DELIVERY_TYPE", label: "Delivery Types" },
] as const;

export function DropdownOptionsCard({ initialOptions }: DropdownOptionsCardProps) {
  const [options, setOptions] = useState<DropdownOption[]>(initialOptions);
  const [activeTab, setActiveTab] = useState<string>(CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newValue, setNewValue] = useState("");
  const [isAdding, startAddTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [, startEditTransition] = useTransition();
  const editInputRef = useRef<HTMLInputElement>(null);

  // --- Filtering & Performance ---
  const filteredOptions = useMemo(() => {
    let result = options.filter(o => o.category === activeTab);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => o.value.toLowerCase().includes(query));
    }
    return result;
  }, [options, activeTab, searchQuery]);

  const handleAdd = useCallback(() => {
    const val = newValue.trim();
    if (!val) return;

    if (options.some((o) => o.category === activeTab && o.value.toLowerCase() === val.toLowerCase())) {
      toast.error("Duplicate option");
      return;
    }

    startAddTransition(async () => {
      const result = await addDropdownOption(activeTab, val);
      if (result.success) {
        if (result.data) {
          setOptions((prev) => [...prev, result.data!]);
          setNewValue("");
          toast.success("Option added");
        }
      } else {
        toast.error("Add failed", { description: result.error });
      }
    });
  }, [newValue, options, activeTab]);

  const confirmDelete = (id: number) => {
    startDeleteTransition(async () => {
      const result = await deleteDropdownOption(id);
      if (result.success) {
        setOptions((prev) => prev.filter((r) => r.id !== id));
        toast.success("Option removed");
      } else {
        toast.error("Delete failed", { description: result.error });
      }
      setDeletingId(null);
    });
  };

  const toggleActive = useCallback((opt: DropdownOption) => {
    startEditTransition(async () => {
      const result = await updateDropdownOption(opt.id, { isActive: !opt.isActive });
      if (result.success) {
        if (result.data) {
          setOptions((prev) => prev.map((r) => (r.id === opt.id ? result.data! : r)));
        }
      } else {
        toast.error("Status update failed", { description: result.error });
      }
    });
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) return;

    startEditTransition(async () => {
      const result = await updateDropdownOption(editingId, { value: trimmed });
      if (result.success) {
        if (result.data) {
          setOptions((prev) => prev.map((r) => (r.id === editingId ? result.data! : r)));
          toast.success("Option updated");
          setEditingId(null);
        }
      } else {
        toast.error("Update failed", { description: result.error });
      }
    });
  }, [editingId, editValue]);

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto pb-px scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveTab(cat.id); setSearchQuery(""); setEditingId(null); }}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
              activeTab === cat.id 
                ? "border-purple-500 text-purple-600 dark:text-purple-400" 
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder={`Search ${CATEGORIES.find(c => c.id === activeTab)?.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add new option..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full sm:w-[200px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            />
            <Button onClick={handleAdd} disabled={isAdding || !newValue.trim()} className="bg-purple-600 hover:bg-purple-500 text-white">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/20 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredOptions.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No options found</p>
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div key={opt.id} className={cn(
                  "flex items-center justify-between p-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors",
                  !opt.isActive && "opacity-60"
                )}>
                  {editingId === opt.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        ref={editInputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-9"
                      />
                      <Button variant="ghost" size="icon-xs" onClick={saveEdit} className="text-green-600">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setEditingId(null)} className="text-neutral-400">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={cn("text-sm font-medium truncate", !opt.isActive ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-neutral-100")}>
                          {opt.value}
                        </span>
                        {!opt.isActive && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 uppercase tracking-wider font-bold">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(opt)}
                          className={cn(
                            "h-7 text-[11px] font-bold uppercase tracking-tight px-2",
                            opt.isActive ? "text-green-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20" : "text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                          )}
                        >
                          {opt.isActive ? "Active" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => { setEditingId(opt.id); setEditValue(opt.value); }} className="text-neutral-400 hover:text-blue-500">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => setDeletingId(opt.id)} className="text-neutral-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Option?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this option? This may affect form historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-200 dark:border-neutral-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && confirmDelete(deletingId)}
              className="bg-red-600 hover:bg-red-500 text-white border-0"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
