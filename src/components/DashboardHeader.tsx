'use client';

import React from 'react';
import {
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Clock,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  FileText,
  Terminal
} from 'lucide-react';
import { ScanStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardHeaderProps {
  stats: ScanStats;
  isScanning: boolean;
  onScanNow: () => void;
  onOpenProfile: () => void;
  onOpenWatchlist: () => void;
  onOpenResumeStudio?: () => void;
  onOpenTraces?: () => void;
  lastScanDuration?: number | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  stats,
  isScanning,
  onScanNow,
  onOpenProfile,
  onOpenWatchlist,
  onOpenResumeStudio,
  onOpenTraces,
  lastScanDuration
}) => {
  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h1 className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
                  JobScout AI
                </h1>
                <Badge variant="mono">Autonomous Loop</Badge>
                {stats.lastScanTime && (
                  <span className="hidden sm:inline-flex text-[11px] text-muted-foreground items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Every 12h</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Autonomous tech startup parsing, ATS scouting &amp; AI candidate matching
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenWatchlist}
              className="gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Target ATS</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProfile}
              className="gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Match Rules</span>
            </Button>

            {onOpenResumeStudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenResumeStudio}
                className="gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Resume Studio</span>
              </Button>
            )}

            {onOpenTraces && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenTraces}
                className="gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Traces</span>
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={onScanNow}
              disabled={isScanning}
              className="gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Feeds...' : 'Scan Now'}</span>
            </Button>
          </div>
        </div>

        {/* Shadcn KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-3.5 border-t border-border">
          <Card className="p-3 bg-card/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted text-muted-foreground">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground font-mono leading-none">
                  {stats.totalJobs}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Scanned Opportunities</div>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-card/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground font-mono leading-none">
                  {stats.highMatchJobs}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">High Match (&ge;65%)</div>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-card/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted text-muted-foreground">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground font-mono leading-none">
                  {stats.appliedJobs}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Applied / In Pipeline</div>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-card/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted text-muted-foreground">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground truncate max-w-[120px] font-mono">
                  {stats.lastScanTime ? new Date(stats.lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {lastScanDuration ? `${(lastScanDuration / 1000).toFixed(1)}s scan` : 'Last Scan Cycle'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </header>
  );
};
