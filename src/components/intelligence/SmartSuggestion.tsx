/**
 * Smart Suggestion
 * 
 * AI-powered contextual suggestion that appears inline.
 * Subtle, helpful, like Apple's proactive suggestions.
 */

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartSuggestionProps {
  text: string;
  subtext?: string;
  onAccept?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const SmartSuggestion = forwardRef<HTMLDivElement, SmartSuggestionProps>(
  ({ text, subtext, onAccept, onDismiss, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl',
          'bg-gradient-to-r from-primary/5 to-primary/10',
          'border border-primary/20',
          className
        )}
      >
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{text}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground truncate">{subtext}</p>
          )}
        </div>

        {onAccept && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onAccept}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
          >
            <span>Apply</span>
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        )}
      </motion.div>
    );
  }
);
SmartSuggestion.displayName = 'SmartSuggestion';

export default SmartSuggestion;
