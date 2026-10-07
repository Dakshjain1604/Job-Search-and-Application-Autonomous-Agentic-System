'use client';

import React from 'react';
import {
  Search,
  Filter,
  FileText,
  Send,
  Terminal,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { ScanStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface AutonomousLoopBarProps {
  stats: ScanStats;
  isScanning: boolean;
  onRunAutonomousLoop: () => void;
  onOpenTraces: () => void;
  onOpenResumeStudio: () => void;
}

export const AutonomousLoopBar: React.FC<AutonomousLoopBarProps> = ({
  stats,
  isScanning,
  onRunAutonomousLoop,
  onOpenTraces,
  onOpenResumeStudio
}) => {
  const loopStages = [
    {
      num: '01',
      title: 'Discovery',
      subtitle: '112+ AI Startups & ATS Feeds',
      metric: `${stats.totalJobs > 0 ? stats.totalJobs.toLocaleString() : '11,290+'} scanned`,
      icon: Search
    },
    {
      num: '02',
      title: 'Decision & Filter',
      subtitle: '<2 YOE Guardrails & Matching',
      metric: `${stats.highMatchJobs} high match`,
      icon: Filter
    },
    {
      num: '03',
      title: 'Resume Studio',
      subtitle: 'Tectonic 1-Page LaTeX Tailor',
      metric: '100% ATS score',
      icon: FileText,
      hasAction: true
    },
    {
      num: '04',
      title: 'Autonomous Apply',
      subtitle: 'ATS Auto-Fill & Founder Pitch',
      metric: `${stats.appliedJobs} applied`,
      icon: Send
    }
  ];

  return (
    <Card className="p-4 mb-6 bg-card/80 border-border">
      {/* Top Status & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-foreground">
              Autonomous Loop Active
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono hidden md:inline">
            Cadence: 12h cron &amp; on-demand triggers
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTraces}
            className="gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Agent Traces</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onRunAutonomousLoop}
            disabled={isScanning}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Running Loop...' : 'Trigger Loop'}</span>
          </Button>
        </div>
      </div>

      {/* 4 Connected Stages Pipeline Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loopStages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.num}
              className="p-3.5 rounded-lg border border-border bg-muted/30 flex flex-col justify-between hover:bg-muted/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-md bg-muted text-foreground shrink-0">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <span className="text-xs font-semibold text-foreground whitespace-nowrap truncate">
                      {stage.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground font-medium shrink-0">
                    {stage.num}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-normal">
                  {stage.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">{stage.metric}</span>
                {stage.hasAction && (
                  <button
                    onClick={onOpenResumeStudio}
                    className="text-[11px] font-medium text-foreground hover:underline transition-all flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
