"use client";

import { useState, useTransition, useCallback, useRef } from "react";
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
  Settings2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ListFilter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { DropdownOption } from "@/db/schema";
import { cn } from "@/lib/utils";

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
  const [isExpanded, setIsExpanded] = useState(true);
  
  const [newValue, setNewValue] = useState("");
  const [isAdding, startAddTransition] = useTransition();
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isEditing, startEditTransition] = useTransition();
  const editInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(o => o.category === activeTab);

  const handleAdd = useCallback(() => {
    const val = newValue.trim();
    if (!val) {
      toast.error("Value required", { description: "Please enter an option name." });
      return;
    }

    if (filteredOptions.some((o) => o.value.toLowerCase() === val.toLowerCase())) {
      toast.error("Duplicate option", { description: `This option already exists.` });
      return;
    }

    startAddTransition(async () => {
      const result = await addDropdownOption(activeTab, val);
      if (!result.success) {
        toast.error("Failed to add option", { description: result.error });
        return;
      }
      if (result.data) {
        setOptions((prev) => [...prev, result.data!]);
        setNewValue("");
        toast.success("Option added", {
          description: `Added to ${activeTab.toLowerCase()}.`,
        });
      }
    });
  }, [newValue, filteredOptions, activeTab]);

  const handleDelete = useCallback((id: number, value: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));

    deleteDropdownOption(id)
      .then((result) => {
        if (result.success) {
          setOptions((prev) => prev.filter((r) => r.id !== id));
          toast.success("Option removed", {
            description: `${value} has been removed.`,
          });
        } else {
          toast.error("Failed to delete", { description: result.error });
        }
      })
      .catch(() => {
        toast.error("Network error", {
          description: "Could not reach the server. Please try again.",
        });
      })
      .finally(() => {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  }, []);

  const toggleActive = useCallback((opt: DropdownOption) => {
    startEditTransition(async () => {
      const result = await updateDropdownOption(opt.id, { isActive: !opt.isActive });
      if (!result.success) {
        toast.error("Failed to update status", { description: result.error });
        return;
      }
      if (result.data) {
        setOptions((prev) => prev.map((r) => (r.id === opt.id ? result.data! : r)));
      }
    });
  }, []);

  const startEdit = useCallback((opt: DropdownOption) => {
    setEditingId(opt.id);
    setEditValue(opt.value);
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      toast.error("Value required");
      return;
    }

    const current = options.find((r) => r.id === editingId);
    if (current && current.value === trimmed) {
      cancelEdit();
      return;
    }

    startEditTransition(async () => {
      const result = await updateDropdownOption(editingId, { value: trimmed });
      if (!result.success) {
        toast.error("Failed to update", { description: result.error });
        return;
      }
      if (result.data) {
        setOptions((prev) => prev.map((r) => (r.id === editingId ? result.data! : r)));
        toast.success("Option updated");
        cancelEdit();
      }
    });
  }, [editingId, editValue, options, cancelEdit]);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900/50 transition-colors">
      <div 
        className="p-5 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ListFilter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Dropdown Options
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Manage dropdown options for forms like Campaigns and Requestors.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 pointer-events-none text-neutral-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-6">
          <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto pb-px custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveTab(cat.id); setNewValue(""); cancelEdit(); }}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                activeTab === cat.id 
                  ? "border-purple-500 text-purple-600 dark:text-purple-400" 
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={`Add new ${CATEGORIES.find(c => c.id === activeTab)?.label.slice(0, -1).toLowerCase()}...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            disabled={isAdding}
            className="flex-1 bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
          />
          <Button
            onClick={handleAdd}
            disabled={isAdding || !newValue.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white shrink-0"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>

         {filteredOptions.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
             <Settings2 className="h-10 w-10 mb-3 opacity-40" />
             <p className="text-sm font-medium">No options yet</p>
             <p className="text-xs mt-1">Add an option above to get started.</p>
           </div>
         ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 max-h-[80vh] overflow-y-auto">
             {filteredOptions.map((opt) => (
               <div
                 key={opt.id}
                 className={cn(
                   "flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors",
                   !opt.isActive && "bg-neutral-50/50 dark:bg-neutral-900/30 opacity-75"
                 )}
               >
                {editingId === opt.id ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Input
                      ref={editInputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      disabled={isEditing}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button variant="ghost" size="icon-xs" onClick={saveEdit} disabled={isEditing} className="text-green-600">
                      {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={cancelEdit} disabled={isEditing} className="text-neutral-400">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={cn("text-sm truncate", !opt.isActive ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-white")}>
                        {opt.value}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(opt)}
                        disabled={isEditing}
                        className={cn("h-8 text-xs", opt.isActive ? "text-green-600 hover:text-orange-600 hover:bg-orange-50" : "text-neutral-400 hover:text-green-600 hover:bg-green-50")}
                      >
                        {opt.isActive ? "Active" : "Inactive"}
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => startEdit(opt)} className="text-neutral-400 hover:text-blue-500">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(opt.id, opt.value)}
                        disabled={deletingIds.has(opt.id)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        {deletingIds.has(opt.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
