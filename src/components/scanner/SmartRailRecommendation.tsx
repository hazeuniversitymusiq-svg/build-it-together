/**
 * SmartRailRecommendation Component
 * 
 * Displays intelligent payment rail recommendations based on:
 * - User's connected apps & balances
 * - Merchant compatibility
 * - Payment history
 * - Connector health
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Building2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useSmartResolution, formatScore, getScoreBreakdown } from '@/hooks/useSmartResolution';
import type { ScoredRail } from '@/lib/orchestration/smart-resolver';

interface SmartRailRecommendationProps {
  userId: string;
  amount: number;
  merchantRails: string[];
  onSelectRail?: (railName: string, fundingSourceId?: string) => void;
  selectedRailName?: string;
}

const RAIL_ICONS: Record<string, React.ReactNode> = {
  TouchNGo: <Wallet className="w-4 h-4" />,
  GrabPay: <Wallet className="w-4 h-4" />,
  Boost: <Wallet className="w-4 h-4" />,
  DuitNow: <Building2 className="w-4 h-4" />,
  BankTransfer: <Building2 className="w-4 h-4" />,
  Maybank: <Building2 className="w-4 h-4" />,
  VisaMastercard: <CreditCard className="w-4 h-4" />,
  Atome: <CreditCard className="w-4 h-4" />,
  SPayLater: <CreditCard className="w-4 h-4" />,
};

const RAIL_COLORS: Record<string, string> = {
  TouchNGo: 'from-blue-500 to-blue-600',
  GrabPay: 'from-green-500 to-green-600',
  Boost: 'from-orange-500 to-orange-600',
  DuitNow: 'from-pink-500 to-pink-600',
  BankTransfer: 'from-indigo-500 to-indigo-600',
  Maybank: 'from-yellow-500 to-yellow-600',
  VisaMastercard: 'from-purple-500 to-purple-600',
  Atome: 'from-teal-500 to-teal-600',
  SPayLater: 'from-orange-400 to-red-500',
};

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'bg-success';
    if (s >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-medium">{score}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${getScoreColor(score)}`}
          />
        </div>
      </div>
    </div>
  );
}

function RailCard({ 
  rail, 
  isRecommended, 
  isSelected,
  onSelect,
  showDetails 
}: { 
  rail: ScoredRail; 
  isRecommended?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  showDetails?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const grade = formatScore(rail.totalScore);
  const breakdown = getScoreBreakdown(rail);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-2xl p-4 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : isRecommended 
            ? 'glass-card shadow-float-lg border-aurora-blue/30' 
            : 'glass-card hover:shadow-float'
        }
      `}
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-2 left-4">
          <Badge className="aurora-gradient text-white border-0 text-[10px] px-2 py-0.5 shadow-glow-aurora">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Recommended
          </Badge>
        </div>
      )}

      {/* Main content */}
      <div className="flex items-center gap-3 mt-1">
        {/* Rail icon */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-white
          bg-gradient-to-br ${RAIL_COLORS[rail.name] || 'from-gray-500 to-gray-600'}
          shadow-float
        `}>
          {RAIL_ICONS[rail.name] || <Wallet className="w-5 h-5" />}
        </div>

        {/* Rail info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{rail.name}</span>
            {isSelected && (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{rail.explanation}</p>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className={`
            text-lg font-bold
            ${rail.totalScore >= 75 ? 'text-success' : 
              rail.totalScore >= 50 ? 'text-warning' : 'text-muted-foreground'}
          `}>
            {Math.round(rail.totalScore)}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase">{grade}</span>
        </div>
      </div>

      {/* Quick breakdown chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {breakdown.slice(0, 3).map((item, i) => (
          <span 
            key={i}
            className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>

      {/* Expandable details */}
      {showDetails && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} score breakdown
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3 border-t border-border/50 mt-3">
                  <ScoreBar 
                    label="Compatibility" 
                    score={rail.scores.compatibility}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  />
                  <ScoreBar 
                    label="Balance" 
                    score={rail.scores.balance}
                    icon={<Wallet className="w-4 h-4" />}
                  />
                  <ScoreBar 
                    label="Priority" 
                    score={rail.scores.priority}
                    icon={<Star className="w-4 h-4" />}
                  />
                  <ScoreBar 
                    label="Usage History" 
                    score={rail.scores.history}
                    icon={<Clock className="w-4 h-4" />}
                  />
                  <ScoreBar 
                    label="Health" 
                    score={rail.scores.health}
                    icon={<Zap className="w-4 h-4" />}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

export default function SmartRailRecommendation({
  userId,
  amount,
  merchantRails,
  onSelectRail,
  selectedRailName,
}: SmartRailRecommendationProps) {
  const { isLoading, result, recommendedRail, alternatives, summary, getRecommendation } = useSmartResolution({ userId });
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Fetch recommendations when props change
  useEffect(() => {
    if (userId && amount > 0 && merchantRails.length > 0) {
      getRecommendation({
        amount,
        intentType: 'PayMerchant',
        merchantRails,
      });
    }
  }, [userId, amount, merchantRails, getRecommendation]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-aurora-blue animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Analyzing payment options...</p>
            <p className="text-xs text-muted-foreground">Finding the best rail for you</p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-12 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-8 bg-muted/30 rounded-lg animate-pulse w-2/3" />
        </div>
      </motion.div>
    );
  }

  if (!result?.success || !recommendedRail) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-2xl p-4 border-warning/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No compatible payment method</p>
            <p className="text-xs text-muted-foreground">{result?.explanation || 'Connect a wallet that this merchant accepts'}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentSelection = selectedRailName || recommendedRail.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-aurora-blue" />
          <span className="text-sm font-medium text-foreground">Smart Payment Selection</span>
        </div>
        {result.requiresTopUp && result.topUpAmount && (
          <Badge variant="outline" className="text-warning border-warning/30 text-[10px]">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Top-up needed
          </Badge>
        )}
      </div>

      {/* Recommended rail */}
      <RailCard
        rail={recommendedRail}
        isRecommended
        isSelected={currentSelection === recommendedRail.name}
        onSelect={() => onSelectRail?.(recommendedRail.name, recommendedRail.fundingSourceId)}
        showDetails
      />

      {/* Top-up notice */}
      {result.requiresTopUp && result.topUpAmount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20"
        >
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-foreground">
              Needs <span className="font-semibold">RM {result.topUpAmount.toFixed(2)}</span> top-up
              {result.topUpSource && (
                <span className="text-muted-foreground"> from {result.topUpSource}</span>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Alternatives toggle */}
      {alternatives.length > 0 && (
        <>
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showAlternatives ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showAlternatives ? 'Hide' : 'Show'} {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''}
          </button>

          <AnimatePresence>
            {showAlternatives && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 overflow-hidden"
              >
                {alternatives.map((rail, i) => (
                  <RailCard
                    key={rail.name}
                    rail={rail}
                    isSelected={currentSelection === rail.name}
                    onSelect={() => onSelectRail?.(rail.name, rail.fundingSourceId)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Summary */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        {summary}
      </p>
    </motion.div>
  );
}
