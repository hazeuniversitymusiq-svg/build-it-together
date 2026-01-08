/**
 * Risk Indicator
 * 
 * Subtle visual indicator of payment risk level.
 * Only shows when relevant (medium/high risk).
 */

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskIndicatorProps {
  riskScore: number; // 0-100
  riskFactors?: string[];
  compact?: boolean;
  className?: string;
}

const RiskIndicator = forwardRef<HTMLDivElement, RiskIndicatorProps>(
  ({ riskScore, riskFactors = [], compact = false, className }, ref) => {
    // Don't show for low risk payments
    if (riskScore < 20 && riskFactors.length === 0) {
      return null;
    }

    const level = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
    
    const config = {
      low: {
        icon: ShieldCheck,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        label: 'Low risk',
      },
      medium: {
        icon: Shield,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        label: 'Review suggested',
      },
      high: {
        icon: ShieldAlert,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        label: 'Unusual activity',
      },
    }[level];

    const Icon = config.icon;

    if (compact) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
            config.bg,
            config.border,
            'border',
            className
          )}
        >
          <Icon className={cn('w-3.5 h-3.5', config.color)} />
          <span className={cn('text-xs font-medium', config.color)}>
            {config.label}
          </span>
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-xl border p-3',
          config.bg,
          config.border,
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
            config.bg
          )}>
            <Icon className={cn('w-4 h-4', config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', config.color)}>
              {config.label}
            </p>
            
            {riskFactors.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {riskFactors.slice(0, 3).map((factor, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {factor}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);
RiskIndicator.displayName = 'RiskIndicator';

export default RiskIndicator;
