"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, 
  Smartphone, 
  Megaphone,
  Zap, 
  ChevronRight, 
  Search,
  Sun,
  Moon,
  Filter,
  Download,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";

import { useTheme } from "next-themes";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// ---------------------------------------------------------------------------
// MOCK DATA (High-Fidelity)
// ---------------------------------------------------------------------------
const MOCK_INVENTORY = [
  { id: "1", sn: "SN: 882-192-001", name: "Galaxy S24 Ultra", status: "Loaned", holder: "Raditya Dika", goat: "Wahab D.", date: "2024-03-12", class: "Unreturn", model: "S24U" },
  { id: "2", sn: "SN: 442-881-092", name: "Galaxy Z Fold 6", status: "Available", holder: "Vault / Stock", goat: "—", date: "2024-07-10", class: "Return", model: "ZF6" },
  { id: "3", sn: "SN: 992-110-334", name: "Galaxy Tab S9 Ultra", status: "Loaned", holder: "GadgetIn", goat: "Wahab D.", date: "2024-08-15", class: "Unreturn", model: "TS9" },
  { id: "4", sn: "SN: 112-445-776", name: "Galaxy Buds3 Pro", status: "Available", holder: "Vault / Stock", goat: "—", date: "2024-07-20", class: "Return", model: "B3P" },
  { id: "5", sn: "SN: 776-332-111", name: "Galaxy Watch Ultra", status: "Loaned", holder: "SEIN Internal", goat: "Wahab D.", date: "2024-08-01", class: "Unreturn", model: "GWU" },
];

const MOCK_MODELS = [
  { name: "S24 Ultra", total: 45, loaned: 32, icon: "📱", code: "S24U", color: "blue" },
  { name: "Z Fold 6", total: 20, loaned: 18, icon: "📖", code: "ZF6", color: "violet" },
  { name: "Tab S9 Ultra", total: 15, loaned: 5, icon: "🎨", code: "TS9", color: "emerald" },
  { name: "Buds3 Pro", total: 60, loaned: 45, icon: "🎧", code: "B3P", color: "amber" },
];

const MOCK_CAMPAIGNS = [
  { name: "S24 Launch Event", range: "Mar 12 - Apr 30", units: 32, kols: 28, status: "Active", progress: 85 },
  { name: "Unpacked 2024", range: "Jul 10 - Aug 15", units: 18, kols: 15, status: "Active", progress: 40 },
  { name: "Back to School", range: "Aug 15 - Sep 30", units: 25, kols: 12, status: "Planning", progress: 10 },
  { name: "Z Fold Review Cycle", range: "Jun 01 - Jun 30", units: 15, kols: 15, status: "Completed", progress: 100 },
];

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

const GrainOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] contrast-150 brightness-110" 
       style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
);

// ---------------------------------------------------------------------------
// TAB: MASTER LIST
// ---------------------------------------------------------------------------
const MasterListTab = () => (
  <div className="space-y-3">
    {/* Sticky Grid Header */}
    <div className="sticky top-0 z-20 mb-4 px-8 py-4 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-xl rounded-2xl border border-black/[0.05] dark:border-white/[0.05] shadow-sm">
      <div className="hidden lg:grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 items-center">
        <div className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em]">Unit Identity</div>
        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Serial / IMEI</div>
        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Custodian</div>
        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">GOAT PIC</div>
        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Log Date</div>
        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">FOC Class</div>
        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] text-right">Vault Status</div>
      </div>
      <div className="lg:hidden flex justify-between items-center text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">
        <span>Ledger Operations</span>
        <span className="text-zinc-400 font-mono">5 Assets</span>
      </div>
    </div>

    {/* Rows */}
    <div className="space-y-2">
      {MOCK_INVENTORY.map((item) => (
        <motion.div 
          key={item.id}
          whileHover={{ x: 4, backgroundColor: "rgba(59, 130, 246, 0.03)" }}
          className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 items-center p-4 lg:px-8 lg:py-5 bg-white/40 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] rounded-[2rem] hover:rounded-2xl transition-all cursor-pointer group shadow-sm hover:shadow-xl hover:shadow-blue-500/5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform">
              <Smartphone size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display leading-tight">{item.name}</h4>
              <span className="lg:hidden text-[10px] font-mono text-zinc-400">{item.sn}</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <code className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-black/[0.03] dark:bg-white/[0.05] px-2 py-1 rounded-lg border border-black/[0.05] dark:border-white/[0.05]">
              {item.sn}
            </code>
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Holder</span>
            {item.holder}
          </div>
          <div className="flex items-center gap-2">
            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">PIC</span>
            <div className="flex items-center gap-2">
              {item.goat !== "—" && <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold">WD</div>}
              <span className="text-[11px] text-zinc-500">{item.goat}</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono font-bold">
            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Date</span>
            {item.date}
          </div>
          <div>
            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Class</span>
            <div className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              item.class === 'Unreturn' ? 'bg-amber-500/5 text-amber-600 border-amber-500/20' : 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20'
            }`}>
              {item.class}
            </div>
          </div>
          <div className="flex items-center gap-2 lg:justify-end">
            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Available' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'Available' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
              {item.status}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// TAB: DEVICE MODELS
// ---------------------------------------------------------------------------
const ModelsTab = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {MOCK_MODELS.map((model, i) => {
      const percentage = Math.round((model.loaned / model.total) * 100);
      return (
        <motion.div 
          key={i}
          whileHover={{ y: -4 }}
          className="bg-white/40 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] p-6 rounded-[2.5rem] group relative overflow-hidden transition-all shadow-sm backdrop-blur-sm"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110">
              {model.icon}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block">Model Code</span>
              <span className="text-xs font-mono font-black text-zinc-900 dark:text-white">{model.code}</span>
            </div>
          </div>
          
          <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-1 font-display tracking-tight group-hover:text-blue-500 transition-colors">{model.name}</h3>
          
          <div className="flex items-end justify-between mt-6 mb-2">
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">In Stock</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white font-display leading-none">{model.total - model.loaned}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Utilization</p>
              <p className={`text-sm font-black font-mono ${percentage > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>{percentage}%</p>
            </div>
          </div>

          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${percentage > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
            />
          </div>
          
          <div className="mt-4 pt-4 border-t border-black/[0.03] dark:border-white/[0.03] flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{model.loaned} Active Loans</span>
            <ArrowUpRight size={14} className="text-blue-500" />
          </div>
        </motion.div>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// TAB: CAMPAIGNS
// ---------------------------------------------------------------------------
const CampaignsTab = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {MOCK_CAMPAIGNS.map((camp, i) => (
      <motion.div 
        key={i}
        whileHover={{ scale: 1.01 }}
        className="bg-white/40 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] p-8 rounded-[2.5rem] group relative overflow-hidden backdrop-blur-md"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border w-fit ${
              camp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
              camp.status === 'Planning' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
              'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'
            }`}>
              {camp.status}
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white font-display tracking-tighter group-hover:text-blue-500 transition-colors">{camp.name}</h3>
          </div>
          <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-zinc-400 group-hover:text-blue-500 transition-colors">
            <Megaphone size={20} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Timeframe</p>
            <p className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{camp.range}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Units Allocated</p>
            <p className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{camp.units} Devices</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Impact</p>
            <p className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{camp.kols} KOLs</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
            <span className="text-zinc-400">Campaign Fulfillment</span>
            <span className="text-zinc-900 dark:text-white">{camp.progress}%</span>
          </div>
          <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${camp.progress}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
            />
          </div>
        </div>

        {/* Pulse effect for active campaigns */}
        {camp.status === 'Active' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live Operations</span>
          </div>
        )}
      </motion.div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// REDESIGNED SHARED COMPONENTS
// ---------------------------------------------------------------------------

const RedesignedPageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="w-full flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10 mb-12">
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-[1px] w-8 bg-blue-600/50" />
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-500 tracking-[0.3em] uppercase">Operations Portal</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white font-display">
        {title.split(' ')[0]} <span className="text-zinc-400 dark:text-zinc-600">{title.split(' ').slice(1).join(' ')}</span>
      </h1>
      <p className="text-sm text-zinc-500 font-medium max-w-md">{subtitle}</p>
    </div>

    <div className="flex items-center gap-3 bg-white/80 dark:bg-white/[0.03] p-2 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-2xl shadow-xl dark:shadow-none transition-all">
      <div className="flex items-center gap-3 pl-3 pr-4 border-r border-black/[0.05] dark:border-white/[0.05]">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
        </div>
        <div className="flex flex-col -space-y-0.5">
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">System</span>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">LIVE · 12s</span>
        </div>
        <button className="ml-2 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 group">
          <RefreshCw size={14} className="group-active:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="px-5 py-2.5 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-white/10 active:scale-95 transition-all">Transfer</button>
        <button className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/10 dark:shadow-none">Request</button>
        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20">Return</button>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------
export default function InventoryRedesignPreview() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("master");

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className={`${outfit.variable} ${jetbrainsMono.variable} min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-zinc-500 dark:text-zinc-400 selection:bg-blue-500/30 font-sans antialiased transition-colors duration-500 relative`}>
        <GrainOverlay />
      
        <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="fixed top-6 right-6 z-[100] p-3 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] shadow-lg dark:shadow-none backdrop-blur-xl hover:scale-110 transition-all text-zinc-900 dark:text-white"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20">
          <RedesignedPageHeader 
            title="Inventory Bank"
            subtitle="Precision hardware lifecycle management for high-velocity marketing operations."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Available", value: "842", unit: "UNITS", color: "text-emerald-500" },
              { label: "On Loan", value: "442", unit: "KOLS", color: "text-blue-500" },
              { label: "Pending", value: "12", unit: "TASKS", color: "text-amber-500" },
              { label: "Efficiency", value: "98%", unit: "AVG", color: "text-indigo-500" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/40 dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] p-4 rounded-[2rem] backdrop-blur-sm">
                <p className="text-[9px] text-zinc-400 dark:text-zinc-600 uppercase font-black tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white font-display">{stat.value} <span className={`text-[9px] ${stat.color}`}>{stat.unit}</span></p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <nav className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-black/[0.03] dark:border-white/[0.03] w-full sm:w-auto">
              {[
                { id: "master", label: "Master List", icon: Database },
                { id: "models", label: "Device Models", icon: Smartphone },
                { id: "campaigns", label: "Campaigns", icon: Megaphone },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 sm:flex-none font-display ${
                    activeTab === tab.id 
                      ? "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-none" 
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter data matrix..." 
                  className="w-full bg-white/60 dark:bg-black/40 border border-black/[0.08] dark:border-white/[0.08] rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-blue-500/50 transition-all text-zinc-900 dark:text-white font-mono"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20">
                <Filter size={14} />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "circOut" }}
            >
              {activeTab === "master" && <MasterListTab />}
              {activeTab === "models" && <ModelsTab />}
              {activeTab === "campaigns" && <CampaignsTab />}
            </motion.div>
          </AnimatePresence>

        </main>

        <div className="fixed bottom-0 left-0 right-0 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.4em] flex justify-center items-center gap-4 z-50">
          <Zap size={10} />
          Lab Redesign Protocol Active: High-Fidelity Simulation
          <Zap size={10} />
        </div>
      </div>
    </DashboardLayout>
  );
}
