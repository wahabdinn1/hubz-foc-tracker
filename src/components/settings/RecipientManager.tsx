"use client";

import { useState, useTransition, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  addCCRecipient,
  addMultipleCCRecipients,
  deleteCCRecipient,
  updateCCRecipient,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Plus,
  Mail,
  Loader2,
  CheckCircle2,
  Pencil,
  X,
  Check,
  Users,
  Search,
} from "lucide-react";
import type { CCRecipient } from "@/db/schema";
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

interface RecipientManagerProps {
  initialRecipients: CCRecipient[];
}

export function RecipientManager({ initialRecipients }: RecipientManagerProps) {
  const [recipients, setRecipients] = useState<CCRecipient[]>(initialRecipients);
  const [newEmail, setNewEmail] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isAdding, startAddTransition] = useTransition();
  const [isBulkAdding, startBulkTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isEditing, startEditTransition] = useTransition();
  const editInputRef = useRef<HTMLInputElement>(null);

  // --- Filtering ---
  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return recipients;
    const query = searchQuery.toLowerCase();
    return recipients.filter(r => r.email.toLowerCase().includes(query));
  }, [recipients, searchQuery]);

  // --- Single Add ---
  const handleAdd = useCallback(() => {
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Email required");
      return;
    }

    if (recipients.some((r) => r.email === email)) {
      toast.error("Duplicate email", { description: `${email} is already in the list.` });
      return;
    }

    startAddTransition(async () => {
      const result = await addCCRecipient(email);
      if (result.success) {
        if (result.data) {
          setRecipients((prev) => [...prev, result.data!]);
          setNewEmail("");
          toast.success("Email added");
        }
      } else {
        toast.error("Failed to add email", { description: result.error });
      }
    });
  }, [newEmail, recipients]);

  // --- Bulk Add ---
  const handleBulkAdd = useCallback(() => {
    const raw = bulkText.trim();
    if (!raw) return;

    const existingEmails = new Set(recipients.map((r) => r.email));
    const inputEmails = raw
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const newEmails = inputEmails.filter((e) => !existingEmails.has(e));

    if (newEmails.length === 0) {
      toast.error("All duplicates", { description: "All entered emails already exist." });
      return;
    }

    startBulkTransition(async () => {
      const result = await addMultipleCCRecipients(newEmails.join(","));
      if (result.success) {
        setRecipients((prev) => [...prev, ...result.added]);
        toast.success(`${result.added.length} email(s) added`);
        setBulkText("");
        setShowBulk(false);
      } else {
        toast.error("Bulk add failed", { description: result.error });
      }
    });
  }, [bulkText, recipients]);

  // --- Delete ---
  const confirmDelete = (id: number) => {
    startDeleteTransition(async () => {
      const result = await deleteCCRecipient(id);
      if (result.success) {
        setRecipients((prev) => prev.filter((r) => r.id !== id));
        toast.success("Email removed");
      } else {
        toast.error("Failed to delete", { description: result.error });
      }
      setDeletingId(null);
    });
  };

  // --- Edit ---
  const startEdit = useCallback((recipient: CCRecipient) => {
    setEditingId(recipient.id);
    setEditValue(recipient.email);
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId === null) return;
    const trimmed = editValue.trim().toLowerCase();
    if (!trimmed) return;

    const current = recipients.find((r) => r.id === editingId);
    if (current && current.email === trimmed) {
      setEditingId(null);
      return;
    }

    startEditTransition(async () => {
      const result = await updateCCRecipient(editingId, trimmed);
      if (result.success) {
        if (result.data) {
          setRecipients((prev) => prev.map((r) => (r.id === editingId ? result.data! : r)));
          toast.success("Email updated");
          setEditingId(null);
        }
      } else {
        toast.error("Update failed", { description: result.error });
      }
    });
  }, [editingId, editValue, recipients]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search recipients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulk(!showBulk)}
            className="border-neutral-200 dark:border-neutral-800"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Add</span>
          </Button>
          <Button
            onClick={() => setShowBulk(false)}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Email</span>
          </Button>
        </div>
      </div>

      {showBulk ? (
        <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 space-y-3">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Paste emails separated by commas, semicolons, or new lines.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="john@example.com, jane@example.com"
            rows={3}
            className="w-full text-sm p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkAdd} disabled={isBulkAdding || !bulkText.trim()} className="bg-blue-600 text-white">
              {isBulkAdding && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Import All
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Add recipient email..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
          />
          <Button onClick={handleAdd} disabled={isAdding || !newEmail.trim()} className="bg-blue-600 text-white px-6">
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/20 overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredRecipients.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No recipients found</p>
            </div>
          ) : (
            filteredRecipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center justify-between p-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
                {editingId === recipient.id ? (
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
                    <Button variant="ghost" size="icon-xs" onClick={saveEdit} disabled={isEditing} className="text-green-600">
                      {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => setEditingId(null)} className="text-neutral-400">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {recipient.email}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon-xs" onClick={() => startEdit(recipient)} className="text-neutral-400 hover:text-blue-500">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setDeletingId(recipient.id)} className="text-neutral-400 hover:text-red-500">
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

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Recipient?</AlertDialogTitle>
            <AlertDialogDescription>
              This email will no longer receive CC copies of FOC notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-200 dark:border-neutral-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && confirmDelete(deletingId)}
              className="bg-red-600 hover:bg-red-500 text-white border-0"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
