"use client";

import { useState, useTransition, useCallback, useRef } from "react";
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
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Mail,
  Loader2,
  Settings,
  CheckCircle2,
  Pencil,
  X,
  Check,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { DropdownOptionsCard } from "./settings/DropdownOptionsCard";
import type { CCRecipient, DropdownOption } from "@/db/schema";

interface SettingsDashboardProps {
  initialRecipients: CCRecipient[];
  initialDropdownOptions: DropdownOption[];
}

export function SettingsDashboard({ initialRecipients, initialDropdownOptions }: SettingsDashboardProps) {
  const [recipients, setRecipients] = useState<CCRecipient[]>(initialRecipients);
  const [newEmail, setNewEmail] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [isAdding, startAddTransition] = useTransition();
  const [isBulkAdding, startBulkTransition] = useTransition();
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isEditing, startEditTransition] = useTransition();
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isEmailsExpanded, setIsEmailsExpanded] = useState(true);

  // --- Single Add ---
  const handleAdd = useCallback(() => {
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Email required", { description: "Please enter an email address." });
      return;
    }

    if (recipients.some((r) => r.email === email)) {
      toast.error("Duplicate email", { description: `${email} is already in the CC list.` });
      return;
    }

    startAddTransition(async () => {
      const result = await addCCRecipient(email);
      if (!result.success) {
        toast.error("Failed to add email", { description: result.error });
        return;
      }
      if (result.data) {
        setRecipients((prev) => [...prev, result.data!]);
        setNewEmail("");
        toast.success("Email added", {
          description: `${result.data!.email} has been added to the CC list.`,
        });
      }
    });
  }, [newEmail, recipients]);

  // --- Bulk Add ---
  const handleBulkAdd = useCallback(() => {
    const raw = bulkText.trim();
    if (!raw) {
      toast.error("No emails", { description: "Paste or type email addresses to add." });
      return;
    }

    // Client-side: filter out emails already in the list
    const existingEmails = new Set(recipients.map((r) => r.email));
    const inputEmails = raw
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const clientDupes = inputEmails.filter((e) => existingEmails.has(e));
    const newEmails = inputEmails.filter((e) => !existingEmails.has(e));

    if (newEmails.length === 0) {
      toast.error("All duplicates", {
        description: `${clientDupes.length} email(s) already exist in the CC list.`,
      });
      return;
    }

    // Send only non-duplicate emails to the server
    const filteredRaw = newEmails.join(",");

    startBulkTransition(async () => {
      const result = await addMultipleCCRecipients(filteredRaw);
      if (result.success) {
        const allSkipped = [
          ...clientDupes.map((e) => `${e} (duplicate)`),
          ...result.skipped,
        ];
        if (result.added.length > 0) {
          setRecipients((prev) => [...prev, ...result.added]);
          toast.success(`${result.added.length} email(s) added`, {
            description: allSkipped.length > 0
              ? `Skipped: ${allSkipped.join(", ")}`
              : undefined,
          });
        } else {
          toast.warning("No new emails added", {
            description: allSkipped.length > 0
              ? `Skipped: ${allSkipped.join(", ")}`
              : "All emails were invalid or already exist.",
          });
        }
        setBulkText("");
        setShowBulk(false);
      } else {
        toast.error("Bulk add failed", { description: result.error });
      }
    });
  }, [bulkText, recipients]); // Added recipients to dependencies

  // --- Delete ---
  const handleDelete = useCallback((id: number, email: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));

    deleteCCRecipient(id)
      .then((result) => {
        if (result.success) {
          setRecipients((prev) => prev.filter((r) => r.id !== id));
          toast.success("Email removed", {
            description: `${email} has been removed from the CC list.`,
          });
        } else {
          toast.error("Failed to delete email", { description: result.error });
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

  // --- Edit ---
  const startEdit = useCallback((recipient: CCRecipient) => {
    setEditingId(recipient.id);
    setEditValue(recipient.email);
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
      toast.error("Email required");
      return;
    }

    const currentRecipient = recipients.find((r) => r.id === editingId);
    if (currentRecipient && currentRecipient.email === trimmed.toLowerCase()) {
      cancelEdit();
      return;
    }

    startEditTransition(async () => {
      const result = await updateCCRecipient(editingId!, trimmed);
      if (!result.success) {
        toast.error("Failed to update", { description: result.error });
        return;
      }
      if (result.data) {
        setRecipients((prev) =>
          prev.map((r) => (r.id === editingId ? result.data! : r))
        );
        toast.success("Email updated", {
          description: `Updated to ${result.data.email}`,
        });
        cancelEdit();
      }
    });
  }, [editingId, editValue, recipients, cancelEdit]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Settings
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Manage CC email recipients for FOC notifications
              </p>
            </div>
          </div>
        </div>
      </div>

      <DropdownOptionsCard initialOptions={initialDropdownOptions} />

      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0 space-y-6">
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900/50 transition-colors">
            {/* Header */}
            <div 
              className="p-5 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between"
              onClick={() => setIsEmailsExpanded(!isEmailsExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    CC Email Recipients
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    These emails receive CC copies of all FOC notifications.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 pointer-events-none text-neutral-400">
                {isEmailsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>

            {isEmailsExpanded && (
              <div className="p-5 space-y-4">
              {/* Single add row */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="name@wppmedia.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  disabled={isAdding}
                  className="flex-1 bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
                <Button
                  onClick={handleAdd}
                  disabled={isAdding || !newEmail.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Add</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBulk(!showBulk)}
                  className="shrink-0"
                  title="Bulk add multiple emails"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Bulk</span>
                </Button>
              </div>

              {/* Bulk add textarea */}
              {showBulk && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Paste multiple emails{" "}
                    <span className="text-neutral-400 font-normal">
                      (separated by comma, semicolon, or new line)
                    </span>
                  </p>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"john@example.com\njane@example.com\nalice@example.com"}
                    rows={4}
                    disabled={isBulkAdding}
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowBulk(false);
                        setBulkText("");
                      }}
                      disabled={isBulkAdding}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkAdd}
                      disabled={isBulkAdding || !bulkText.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {isBulkAdding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Add All
                    </Button>
                  </div>
                </div>
              )}

              {/* Email list */}
              {recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
                  <Mail className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No CC recipients yet</p>
                  <p className="text-xs mt-1">Add an email address above to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      {editingId === recipient.id ? (
                        /* --- Editing mode --- */
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 shrink-0">
                            <Pencil className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                          </div>
                          <Input
                            ref={editInputRef}
                            type="email"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            disabled={isEditing}
                            className="flex-1 h-8 text-sm bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                          />
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={saveEdit}
                            disabled={isEditing}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 shrink-0"
                          >
                            {isEditing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={cancelEdit}
                            disabled={isEditing}
                            className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        /* --- Display mode --- */
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 shrink-0">
                              <Mail className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            </div>
                            <span className="text-sm text-neutral-900 dark:text-white truncate">
                              {recipient.email}
                            </span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => startEdit(recipient)}
                              className="text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDelete(recipient.id, recipient.email)}
                              disabled={deletingIds.has(recipient.id)}
                              className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              {deletingIds.has(recipient.id) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} configured. Emails are CC&apos;d on all FOC notifications.
              </p>
            </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
