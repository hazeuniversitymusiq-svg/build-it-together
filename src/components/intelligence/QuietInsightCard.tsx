/**
 * Quiet Insight Card
 * 
 * Apple-style insight that appears when relevant.
 * Minimal, helpful, dismissible.
 */

import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Lightbulb,
  Trophy,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  type: 'spending_pattern' | 'prediction' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  confidence?: number;
  actionable?: boolean;
  onDismiss?: () => void;
  onAction?: () => void;
}

const typeConfig = {
  spending_pattern: {
    icon: TrendingUp,
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-500/20',
  },
  prediction: {
    icon: Sparkles,
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/20',
  },
  recommendation: {
    icon: Lightbulb,
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-500',
    borderColor: 'border-amber-500/20',
  },
  achievement: {
    icon: Trophy,
    gradient: 'from-emerald-500/10 to-green-500/10',
    iconColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/20',
  },
};

const QuietInsightCard = forwardRef<HTMLDivElement, InsightCardProps>(
  ({ type, title, description, confidence, actionable, onDismiss, onAction }, ref) => {
    const [isVisible, setIsVisible] = useState(true);
    const config = typeConfig[type];
    const Icon = config.icon;

    const handleDismiss = () => {
      setIsVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'relative overflow-hidden rounded-2xl border backdrop-blur-sm',
              `bg-gradient-to-br ${config.gradient}`,
              config.borderColor
            )}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    'bg-background/50'
                  )}>
                    <Icon className={cn('w-4 h-4', config.iconColor)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground leading-tight">
                      {title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={handleDismiss}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-background/50 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Action button */}
              {actionable && onAction && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onAction}
                  className={cn(
                    'mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl',
                    'bg-background/50 hover:bg-background/70 transition-colors',
                    'text-sm font-medium text-foreground'
                  )}
                >
                  <span>Learn more</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}

              {/* Confidence indicator (subtle) */}
              {confidence !== undefined && confidence > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-background/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={cn('h-full', config.iconColor.replace('text-', 'bg-'))}
                    style={{ opacity: 0.5 }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
QuietInsightCard.displayName = 'QuietInsightCard';

export default QuietInsightCard;
