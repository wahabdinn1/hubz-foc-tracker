"use client";

import { useState } from "react";
import { ChevronDown, BookOpen, Layers, ShieldCheck, MapPin, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

type Language = "en" | "id";

interface FaqItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface FaqData {
  en: { ui: typeof import("@/lib/faq-data").faqUiEn; items: FaqItem[] };
  id: { ui: typeof import("@/lib/faq-data").faqUiId; items: FaqItem[] };
}

function AccordionItem({ item, isOpen, onClick }: { item: FaqItem, isOpen: boolean, onClick: () => void }) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900/50 transition-colors">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <span className="font-semibold text-left text-neutral-900 dark:text-neutral-100 text-lg">
          {item.title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-neutral-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800">
              <div className="pt-4">
                {item.content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const faqIcons: Record<string, React.ReactNode> = {
  intro: <BookOpen className="w-5 h-5 text-blue-500" />,
  dashboard: <Layers className="w-5 h-5 text-purple-500" />,
  outbound: <MapPin className="w-5 h-5 text-orange-500" />,
  inbound: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
  transfer: <Search className="w-5 h-5 text-blue-500" />,
  troubleshooting: <ChevronDown className="w-5 h-5 text-red-500" />,
};

export function FaqClient({ faqData }: { faqData: FaqData }) {
  const [lang, setLang] = useState<Language>("en");
  const [openIds, setOpenIds] = useState<string[]>(["intro", "troubleshooting"]);
  const [searchTerm, setSearchTerm] = useState("");

  const texts = faqData[lang].ui;
  const activeFaqs = faqData[lang].items;

  const toggleItem = (id: string) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredFaqs = activeFaqs.filter(faq =>
    faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
               <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
             </div>
             <div>
               <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{texts.title}</h1>
             </div>
          </div>

          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setLang("en")}
              className={`py-1.5 px-3 md:px-4 text-sm font-medium rounded-md transition-all ${lang === "en" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("id")}
              className={`py-1.5 px-3 md:px-4 text-sm font-medium rounded-md transition-all ${lang === "id" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
            >
              ID
            </button>
          </div>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-3xl ml-1">
          {texts.description}
        </p>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-14 rounded-xl text-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
          placeholder={texts.searchPlaceholder}
        />
      </div>

      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0 space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                item={faq}
                isOpen={openIds.includes(faq.id)}
                onClick={() => toggleItem(faq.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 opacity-70">
              <Search className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
              <p>{texts.noResults}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
