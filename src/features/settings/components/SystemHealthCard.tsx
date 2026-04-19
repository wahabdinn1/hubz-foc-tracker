"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Database, Table, Mail, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { getSystemHealth, type SystemHealth } from "@/app/actions/settings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SystemHealthCard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (error) {
      console.error("Failed to fetch health:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const StatusIcon = ({ status }: { status: "healthy" | "unhealthy" | undefined }) => {
    if (status === "healthy") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "unhealthy") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />;
  };

  return (
    <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">System Diagnostics</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchHealth} 
          disabled={loading}
          className="h-8 gap-2 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          <span className="text-xs font-semibold">Check Status</span>
        </Button>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Supabase */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Database</span>
            </div>
            <StatusIcon status={health?.supabase} />
          </div>

          {/* Google Sheets */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-2.5">
              <Table className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Inventory</span>
            </div>
            <StatusIcon status={health?.googleSheets} />
          </div>

          {/* Mailer */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Notifications</span>
            </div>
            <StatusIcon status={health?.mailer} />
          </div>
        </div>
        
        {health && (
          <p className="text-[10px] text-neutral-400 mt-3 text-right">
            Last check: {new Date(health.lastChecked).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
