'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Search,
  X
} from 'lucide-react';
import { TraceEvent } from '@/lib/tracing/logger';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TraceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TraceDrawer: React.FC<TraceDrawerProps> = ({ isOpen, onClose }) => {
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTraces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/traces?limit=100');
      const data = await res.json();
      if (data.success) {
        setTraces(data.traces);
      }
    } catch (err) {
      console.error('Failed to fetch traces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTraces();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTraces = traces.filter((t) => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.message.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        JSON.stringify(t.details || {}).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyLogs = () => {
    const logText = filteredTraces
      .map((t) => `[${t.timestamp}] [${t.category}] [${t.level}] ${t.message} ${t.durationMs ? `(${t.durationMs}ms)` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelVariant = (level: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' => {
    switch (level) {
      case 'SUCCESS':
        return 'success';
      case 'WARN':
        return 'warning';
      case 'ERROR':
        return 'destructive';
      case 'LOOP':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} className="max-w-2xl">
      <SheetContent className="p-0">
        {/* Header */}
        <SheetHeader className="p-5 pb-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-secondary text-secondary-foreground">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base">System Telemetry &amp; Traces</SheetTitle>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {filteredTraces.length} events
                  </Badge>
                </div>
                <SheetDescription className="text-xs">
                  Real-time pipeline diagnostics, model decisions, and ATS connector telemetry
                </SheetDescription>
              </div>
            </div>

            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Filter and Search Bar */}
        <div className="p-3 bg-muted/10 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {['ALL', 'DISCOVERY', 'FILTER', 'DECISION', 'RESUME', 'APPLY'].map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'ghost'}
                size="xs"
                onClick={() => setSelectedCategory(cat)}
                className="font-mono text-[10px] h-7 px-2"
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search traces..."
                className="pl-8 text-xs h-7 w-36 sm:w-44"
              />
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={fetchTraces}
              title="Refresh Traces"
              className="h-7 w-7"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyLogs}
              className="gap-1 h-7 text-xs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* Traces Log Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-background">
          {filteredTraces.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-sans">
              No matching trace events found for the active filter.
            </div>
          ) : (
            filteredTraces.map((trace) => {
              const timeStr = new Date(trace.timestamp).toLocaleTimeString();
              return (
                <div
                  key={trace.id}
                  className="p-2.5 rounded-lg bg-card border border-border hover:border-border/80 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{timeStr}</span>
                      <Badge variant={getLevelVariant(trace.level)} className="text-[9px] px-1.5 py-0 uppercase">
                        {trace.category}
                      </Badge>
                      <span className="text-muted-foreground font-medium">{trace.level}</span>
                    </div>
                    {trace.durationMs !== undefined && (
                      <span className="text-foreground font-mono font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                        {trace.durationMs}ms
                      </span>
                    )}
                  </div>

                  <p className="text-foreground text-xs leading-relaxed font-sans font-medium">
                    {trace.message}
                  </p>

                  {trace.details && Object.keys(trace.details).length > 0 && (
                    <div className="text-[10px] text-muted-foreground bg-muted/40 p-2 rounded border border-border font-mono overflow-x-auto">
                      {JSON.stringify(trace.details)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20 text-right text-[11px] text-muted-foreground font-mono">
          Telemetry stream active · Circular trace buffer (250 events max)
        </div>
      </SheetContent>
    </Sheet>
  );
};
