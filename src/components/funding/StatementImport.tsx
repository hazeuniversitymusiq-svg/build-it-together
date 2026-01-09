/**
 * Statement Import Component
 * 
 * Allows users to import bank/wallet statements (CSV/PDF)
 * to auto-populate transaction history and balances.
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  Loader2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

interface ParsedStatement {
  source: string;
  balance: number;
  transactions: ParsedTransaction[];
}

interface StatementImportProps {
  onImport: (data: ParsedStatement) => void;
  className?: string;
}

// Simple CSV parser for common bank statement formats
function parseCSV(content: string): ParsedStatement | null {
  try {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return null;

    const transactions: ParsedTransaction[] = [];
    let balance = 0;
    let lastBalance = 0;

    // Skip header row, parse transactions
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
      
      // Try to detect column format (date, description, amount, balance)
      // Common formats vary, but we'll try to be flexible
      if (cols.length >= 3) {
        const dateCol = cols[0];
        const descCol = cols[1];
        const amountCol = cols[2] || cols[3];
        const balanceCol = cols[cols.length - 1];

        const amount = parseFloat(amountCol.replace(/[^0-9.-]/g, '')) || 0;
        const parsedBalance = parseFloat(balanceCol.replace(/[^0-9.-]/g, ''));

        if (!isNaN(parsedBalance)) {
          lastBalance = parsedBalance;
        }

        if (amount !== 0) {
          transactions.push({
            date: dateCol,
            description: descCol,
            amount: Math.abs(amount),
            type: amount >= 0 ? 'credit' : 'debit',
          });
        }
      }
    }

    balance = lastBalance || transactions.reduce((sum, t) => 
      t.type === 'credit' ? sum + t.amount : sum - t.amount, 0
    );

    return {
      source: 'CSV Import',
      balance: Math.max(0, balance),
      transactions,
    };
  } catch {
    return null;
  }
}

export function StatementImport({ onImport, className }: StatementImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setParsed(null);
    setParsing(true);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (ext === 'csv') {
        const content = await selectedFile.text();
        const result = parseCSV(content);
        
        if (result && result.transactions.length > 0) {
          setParsed(result);
        } else {
          setError('Could not parse transactions from this file. Please check the format.');
        }
      } else if (ext === 'pdf') {
        // PDF parsing would require a library like pdf.js
        // For now, show a helpful message
        setError('PDF import coming soon. Please use CSV format for now.');
      } else {
        setError('Please upload a CSV or PDF file.');
      }
    } catch {
      setError('Failed to read file. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsed) {
      onImport(parsed);
      toast.success(`Imported ${parsed.transactions.length} transactions`);
      setFile(null);
      setParsed(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsed(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Import Statement</h3>
        <span className="text-xs text-muted-foreground">CSV supported</span>
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={{ scale: isDragging ? 1.02 : 1 }}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 text-center transition-colors",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/30 hover:border-muted-foreground/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <AnimatePresence mode="wait">
          {parsing ? (
            <motion.div
              key="parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Parsing statement...</p>
            </motion.div>
          ) : file && !parsed && !error ? (
            <motion.div
              key="file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <FileText className="w-8 h-8 text-primary" />
              <p className="text-sm text-foreground">{file.name}</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Upload className={cn(
                "w-8 h-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
              <div>
                <p className="text-sm text-foreground mb-1">
                  Drop your statement here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={handleClear} className="p-1 hover:bg-destructive/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parsed Result */}
      <AnimatePresence>
        {parsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-success/5 border border-success/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="font-medium text-foreground">Statement parsed</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">{parsed.transactions.length}</span> transactions found
                  </p>
                  <p>
                    Ending balance: <span className="font-medium text-foreground">RM {parsed.balance.toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleConfirmImport}
                className="flex-1 h-10"
              >
                <Check className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                variant="ghost"
                onClick={handleClear}
                className="h-10 px-4"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supported formats */}
      <p className="text-xs text-muted-foreground text-center">
        Supports Maybank, CIMB, and standard CSV formats
      </p>
    </div>
  );
}
