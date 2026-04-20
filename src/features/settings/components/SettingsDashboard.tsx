"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Activity, 
  Mail, 
  ListFilter,
} from "lucide-react";
import { DropdownOptionsCard } from "./DropdownOptionsCard";
import { RecipientManager } from "./RecipientManager";
import { SystemHealthCard } from "./SystemHealthCard";
import type { CCRecipient, DropdownOption } from "@/db/schema";

interface SettingsDashboardProps {
  initialRecipients: CCRecipient[];
  initialDropdownOptions: DropdownOption[];
}

export function SettingsDashboard({ initialRecipients, initialDropdownOptions }: SettingsDashboardProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-20">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <Settings className="w-32 h-32 rotate-12" />
        </div>
        
        <div className="relative flex items-center gap-5">
          <div className="inline-flex items-center justify-center p-3.5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Command Deck
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Configure system diagnostics, notifications, and form dropdowns.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <Tabs defaultValue="diagnostics" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800/50 p-1 h-auto rounded-xl">
            <TabsTrigger 
              value="diagnostics" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
            >
              <Activity className="w-4 h-4" />
              Diagnostics
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
            >
              <Mail className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="dropdowns" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-sm transition-all"
            >
              <ListFilter className="w-4 h-4" />
              Form Options
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Sections */}
        <TabsContent value="diagnostics" className="space-y-6 outline-none focus:ring-0">
          <SystemHealthCard />
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden">
            <CardHeader className="p-6">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Settings className="w-4 h-4 text-neutral-400" />
                System Information
              </CardTitle>
              <CardDescription className="text-xs">
                Technical details about the current environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Environment</p>
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-1 capitalize">{process.env.NODE_ENV || "Development"}</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Timezone</p>
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-1">Asia/Jakarta (GMT+7)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold">Email Recipients</CardTitle>
              <CardDescription>
                Configure which team members receive automated notifications for FOC movements.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <RecipientManager initialRecipients={initialRecipients} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dropdowns" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold">Form Dropdowns</CardTitle>
              <CardDescription>
                Manage dynamic options for Campaigns, Requestors, and Delivery methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <DropdownOptionsCard initialOptions={initialDropdownOptions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
