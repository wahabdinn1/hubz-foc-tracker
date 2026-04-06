import { motion, AnimatePresence } from "framer-motion";
import { Copy, PlusSquare, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionsMenuProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBatchReturn: () => void;
}

export function BulkActionsMenu({ selectedCount, onClearSelection, onBatchReturn }: BulkActionsMenuProps) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-4 rounded-full shadow-2xl"
                >
                    <span className="font-medium mr-2">
                        {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
                    </span>

                    <div className="w-px h-6 bg-neutral-700 dark:bg-neutral-300" />

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={onBatchReturn}
                            className="bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 text-white dark:text-neutral-900 border-none transition-colors rounded-full"
                        >
                            <ArrowLeftRight className="w-4 h-4 mr-2" />
                            Batch Return
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={onClearSelection}
                            className="text-neutral-400 hover:text-white dark:text-neutral-500 dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/10 transition-colors rounded-full"
                        >
                            Clear
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
