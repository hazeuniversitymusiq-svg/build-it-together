/**
 * Biller Catalog Component
 * 
 * Seamless discovery and linking of new billers.
 * Supports categories, search, and one-tap linking.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search,
  Plus,
  X,
  Zap,
  Wifi,
  Phone,
  Droplets,
  Building2,
  Car,
  GraduationCap,
  Tv,
  CreditCard,
  Shield,
  Heart,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface BillerTemplate {
  id: string;
  name: string;
  category: BillerCategory;
  icon: React.ReactNode;
  gradient: string;
  placeholder: string;
  description?: string;
}

export type BillerCategory = 
  | "utilities" 
  | "telco" 
  | "internet" 
  | "insurance" 
  | "government" 
  | "education"
  | "entertainment"
  | "transport"
  | "finance";

const categoryConfig: Record<BillerCategory, { label: string; icon: React.ReactNode }> = {
  utilities: { label: "Utilities", icon: <Zap className="w-4 h-4" /> },
  telco: { label: "Telco", icon: <Phone className="w-4 h-4" /> },
  internet: { label: "Internet", icon: <Wifi className="w-4 h-4" /> },
  insurance: { label: "Insurance", icon: <Shield className="w-4 h-4" /> },
  government: { label: "Government", icon: <Building2 className="w-4 h-4" /> },
  education: { label: "Education", icon: <GraduationCap className="w-4 h-4" /> },
  entertainment: { label: "Entertainment", icon: <Tv className="w-4 h-4" /> },
  transport: { label: "Transport", icon: <Car className="w-4 h-4" /> },
  finance: { label: "Finance", icon: <CreditCard className="w-4 h-4" /> },
};

// Comprehensive Malaysian biller catalog
export const billerCatalog: BillerTemplate[] = [
  // Utilities
  { id: "tnb", name: "TNB", category: "utilities", icon: <Zap className="w-5 h-5" />, gradient: "from-yellow-500 to-orange-500", placeholder: "TNB account number", description: "Tenaga Nasional Berhad" },
  { id: "syabas", name: "Syabas", category: "utilities", icon: <Droplets className="w-5 h-5" />, gradient: "from-blue-400 to-cyan-500", placeholder: "Syabas account number", description: "Selangor Water" },
  { id: "air-selangor", name: "Air Selangor", category: "utilities", icon: <Droplets className="w-5 h-5" />, gradient: "from-sky-400 to-blue-500", placeholder: "Account number", description: "Air Selangor" },
  { id: "indah-water", name: "Indah Water", category: "utilities", icon: <Droplets className="w-5 h-5" />, gradient: "from-teal-400 to-emerald-500", placeholder: "IWK account number", description: "Sewerage services" },
  
  // Telco
  { id: "maxis", name: "Maxis", category: "telco", icon: <Phone className="w-5 h-5" />, gradient: "from-green-500 to-emerald-600", placeholder: "Maxis account number" },
  { id: "celcom", name: "Celcom", category: "telco", icon: <Phone className="w-5 h-5" />, gradient: "from-blue-500 to-indigo-600", placeholder: "Celcom account number" },
  { id: "digi", name: "Digi", category: "telco", icon: <Phone className="w-5 h-5" />, gradient: "from-yellow-400 to-amber-500", placeholder: "Digi account number" },
  { id: "umobile", name: "U Mobile", category: "telco", icon: <Phone className="w-5 h-5" />, gradient: "from-orange-500 to-red-500", placeholder: "U Mobile number" },
  { id: "yes", name: "Yes 4G", category: "telco", icon: <Phone className="w-5 h-5" />, gradient: "from-purple-500 to-pink-500", placeholder: "Yes account number" },
  
  // Internet
  { id: "unifi", name: "Unifi", category: "internet", icon: <Wifi className="w-5 h-5" />, gradient: "from-orange-500 to-amber-600", placeholder: "Unifi account number", description: "TM Unifi broadband" },
  { id: "time", name: "TIME", category: "internet", icon: <Wifi className="w-5 h-5" />, gradient: "from-red-500 to-rose-600", placeholder: "TIME account number", description: "TIME fibre broadband" },
  { id: "maxis-fibre", name: "Maxis Fibre", category: "internet", icon: <Wifi className="w-5 h-5" />, gradient: "from-green-500 to-emerald-600", placeholder: "Fibre account number" },
  { id: "celcom-fibre", name: "Celcom Fibre", category: "internet", icon: <Wifi className="w-5 h-5" />, gradient: "from-blue-500 to-indigo-600", placeholder: "Fibre account number" },
  
  // Insurance
  { id: "prudential", name: "Prudential", category: "insurance", icon: <Shield className="w-5 h-5" />, gradient: "from-red-500 to-rose-600", placeholder: "Policy number" },
  { id: "aia", name: "AIA", category: "insurance", icon: <Heart className="w-5 h-5" />, gradient: "from-red-600 to-pink-600", placeholder: "Policy number" },
  { id: "great-eastern", name: "Great Eastern", category: "insurance", icon: <Shield className="w-5 h-5" />, gradient: "from-blue-600 to-indigo-700", placeholder: "Policy number" },
  { id: "allianz", name: "Allianz", category: "insurance", icon: <Shield className="w-5 h-5" />, gradient: "from-blue-500 to-sky-600", placeholder: "Policy number" },
  
  // Government
  { id: "ptptn", name: "PTPTN", category: "government", icon: <GraduationCap className="w-5 h-5" />, gradient: "from-blue-600 to-indigo-700", placeholder: "PTPTN loan number", description: "Education loan" },
  { id: "lhdn", name: "LHDN", category: "government", icon: <Building2 className="w-5 h-5" />, gradient: "from-slate-600 to-gray-700", placeholder: "Tax reference number", description: "Income tax" },
  { id: "jpj", name: "JPJ", category: "government", icon: <Car className="w-5 h-5" />, gradient: "from-emerald-600 to-teal-700", placeholder: "Vehicle registration", description: "Road tax & license" },
  { id: "pdrm", name: "PDRM Summons", category: "government", icon: <Building2 className="w-5 h-5" />, gradient: "from-blue-700 to-indigo-800", placeholder: "IC or summons number", description: "Traffic summons" },
  
  // Entertainment
  { id: "astro", name: "Astro", category: "entertainment", icon: <Tv className="w-5 h-5" />, gradient: "from-red-500 to-orange-500", placeholder: "Astro smart card number" },
  { id: "netflix", name: "Netflix", category: "entertainment", icon: <Tv className="w-5 h-5" />, gradient: "from-red-600 to-rose-600", placeholder: "Netflix account email" },
  { id: "spotify", name: "Spotify", category: "entertainment", icon: <Tv className="w-5 h-5" />, gradient: "from-green-500 to-emerald-500", placeholder: "Spotify account email" },
  
  // Transport
  { id: "touch-n-go", name: "Touch 'n Go", category: "transport", icon: <CreditCard className="w-5 h-5" />, gradient: "from-blue-500 to-indigo-600", placeholder: "Card number" },
  { id: "grab", name: "Grab Credits", category: "transport", icon: <Car className="w-5 h-5" />, gradient: "from-green-500 to-emerald-600", placeholder: "Phone number" },
  
  // Finance
  { id: "credit-card-maybank", name: "Maybank Card", category: "finance", icon: <CreditCard className="w-5 h-5" />, gradient: "from-yellow-500 to-amber-600", placeholder: "Card number (last 4 digits)" },
  { id: "credit-card-cimb", name: "CIMB Card", category: "finance", icon: <CreditCard className="w-5 h-5" />, gradient: "from-red-600 to-rose-700", placeholder: "Card number (last 4 digits)" },
  { id: "credit-card-public", name: "Public Bank Card", category: "finance", icon: <CreditCard className="w-5 h-5" />, gradient: "from-pink-500 to-rose-600", placeholder: "Card number (last 4 digits)" },
];

interface BillerCatalogProps {
  linkedBillerIds: string[];
  onSelectBiller: (biller: BillerTemplate) => void;
  onClose: () => void;
}

const BillerCatalog = ({ linkedBillerIds, onSelectBiller, onClose }: BillerCatalogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BillerCategory | "all">("all");

  const availableBillers = useMemo(() => {
    return billerCatalog.filter(b => !linkedBillerIds.includes(b.id));
  }, [linkedBillerIds]);

  const filteredBillers = useMemo(() => {
    let filtered = availableBillers;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(b => b.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [availableBillers, selectedCategory, searchQuery]);

  const groupedBillers = useMemo(() => {
    const groups: Record<BillerCategory, BillerTemplate[]> = {
      utilities: [],
      telco: [],
      internet: [],
      insurance: [],
      government: [],
      education: [],
      entertainment: [],
      transport: [],
      finance: [],
    };

    filteredBillers.forEach(b => {
      groups[b.category].push(b);
    });

    return groups;
  }, [filteredBillers]);

  const categories = Object.entries(categoryConfig) as [BillerCategory, { label: string; icon: React.ReactNode }][];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Add Biller</h2>
            <p className="text-sm text-muted-foreground">Link a new bill to FLOW</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search billers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-2xl glass-subtle border-0"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-6 py-3 border-b border-border/30">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "glass-subtle text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === key
                  ? "bg-primary text-primary-foreground"
                  : "glass-subtle text-muted-foreground hover:text-foreground"
              }`}
            >
              {config.icon}
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Biller List */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-6">
          {selectedCategory === "all" ? (
            // Grouped view
            Object.entries(groupedBillers).map(([category, billers]) => {
              if (billers.length === 0) return null;
              const config = categoryConfig[category as BillerCategory];
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-muted-foreground">{config.icon}</span>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {config.label}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {billers.map((biller, index) => (
                      <BillerItem 
                        key={biller.id} 
                        biller={biller} 
                        onSelect={onSelectBiller}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Flat view for selected category
            <div className="space-y-2">
              {filteredBillers.map((biller, index) => (
                <BillerItem 
                  key={biller.id} 
                  biller={biller} 
                  onSelect={onSelectBiller}
                  index={index}
                />
              ))}
            </div>
          )}

          {filteredBillers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No billers found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try a different search term
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

const BillerItem = ({ 
  biller, 
  onSelect, 
  index 
}: { 
  biller: BillerTemplate; 
  onSelect: (b: BillerTemplate) => void;
  index: number;
}) => (
  <motion.button
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03 }}
    onClick={() => onSelect(biller)}
    className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors group"
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${biller.gradient} flex items-center justify-center text-white shadow-float`}>
      {biller.icon}
    </div>
    <div className="flex-1 text-left">
      <p className="font-medium text-foreground">{biller.name}</p>
      {biller.description && (
        <p className="text-sm text-muted-foreground">{biller.description}</p>
      )}
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
  </motion.button>
);

export default BillerCatalog;
