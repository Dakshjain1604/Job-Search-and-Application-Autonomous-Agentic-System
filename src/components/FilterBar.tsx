'use client';

import React from 'react';
import { Search, X, GraduationCap, Globe2, Rocket, SlidersHorizontal } from 'lucide-react';
import { JobStatus } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FilterBarProps {
  statusFilter: JobStatus | 'ALL';
  setStatusFilter: (status: JobStatus | 'ALL') => void;
  sourceFilter: string;
  setSourceFilter: (source: string) => void;
  minScoreFilter: number;
  setMinScoreFilter: (score: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  juniorOnlyFilter: boolean;
  setJuniorOnlyFilter: (v: boolean) => void;
  indiaOnlyFilter: boolean;
  setIndiaOnlyFilter: (v: boolean) => void;
  ecosystemFilter: string;
  setEcosystemFilter: (eco: string) => void;
  counts: {
    all: number;
    new: number;
    saved: number;
    applied: number;
    interviewing: number;
    archived: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
  minScoreFilter,
  setMinScoreFilter,
  searchQuery,
  setSearchQuery,
  juniorOnlyFilter,
  setJuniorOnlyFilter,
  indiaOnlyFilter,
  setIndiaOnlyFilter,
  ecosystemFilter,
  setEcosystemFilter,
  counts
}) => {
  const tabs: { label: string; value: JobStatus | 'ALL'; count: number }[] = [
    { label: 'All Jobs', value: 'ALL', count: counts.all },
    { label: 'Discovered', value: 'NEW', count: counts.new },
    { label: 'Shortlisted', value: 'SAVED', count: counts.saved },
    { label: 'Applied', value: 'APPLIED', count: counts.applied },
    { label: 'Interviewing', value: 'INTERVIEWING', count: counts.interviewing },
    { label: 'Archive', value: 'ARCHIVED', count: counts.archived }
  ];

  return (
    <Card className="p-3 sm:p-4 my-5 bg-card/80 border-border space-y-3">
      {/* Top Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by role, company, stack (e.g. Next.js, AI Agents, Python)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-12 h-9 bg-background"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Badge variant="mono" className="hidden sm:inline-flex px-1.5 py-0.2">
                ⌘K
              </Badge>
            )}
          </div>
        </div>

        {/* Source Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9 bg-background border border-input rounded-md px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Sources</option>
            <option value="hacker-news">HN Hiring</option>
            <option value="ashby">Ashby ATS</option>
            <option value="greenhouse">Greenhouse ATS</option>
            <option value="lever">Lever ATS</option>
            <option value="remotive">Remotive</option>
            <option value="arbeitnow">Arbeitnow</option>
          </select>
        </div>

        {/* Min Score Filter */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md border border-border">
          <span className="text-[11px] text-muted-foreground px-2 font-mono">Fit:</span>
          {[0, 60, 75, 85].map((score) => (
            <button
              key={score}
              onClick={() => setMinScoreFilter(score)}
              className={`px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                minScoreFilter === score
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {score === 0 ? 'All' : `${score}%+`}
            </button>
          ))}
        </div>
      </div>

      {/* Target Focus Pills */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Button
          variant={juniorOnlyFilter ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setJuniorOnlyFilter(!juniorOnlyFilter)}
          className="gap-1.5 h-8"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>&lt;2 YOE / Junior</span>
        </Button>

        <Button
          variant={indiaOnlyFilter ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setIndiaOnlyFilter(!indiaOnlyFilter)}
          className="gap-1.5 h-8"
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>🇮🇳 Indian Hubs</span>
        </Button>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground hidden sm:inline">Ecosystem:</span>
          <select
            value={ecosystemFilter}
            onChange={(e) => setEcosystemFilter(e.target.value)}
            className="h-8 bg-background border border-input rounded-md px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Ecosystems</option>
            <option value="india">Indian AI Startups</option>
            <option value="yc">YC AI Startups</option>
            <option value="a16z">a16z AI Portfolio</option>
          </select>
        </div>
      </div>

      {/* Lifecycle Status Tabs */}
      <div className="pt-2 border-t border-border flex items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-secondary text-secondary-foreground shadow-sm border border-border font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span>{tab.label}</span>
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
