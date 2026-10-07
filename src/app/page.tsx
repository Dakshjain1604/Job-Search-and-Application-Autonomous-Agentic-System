'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Inbox,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { JobListing, UserProfile, CompanyWatchlist, ScanStats, JobStatus } from '@/types';
import { DashboardHeader } from '@/components/DashboardHeader';
import { FilterBar } from '@/components/FilterBar';
import { JobCard } from '@/components/JobCard';
import { AutonomousLoopBar } from '@/components/AutonomousLoopBar';
import { TraceDrawer } from '@/components/TraceDrawer';
import { ProfileModal } from '@/components/ProfileModal';
import { WatchlistModal } from '@/components/WatchlistModal';
import { JobDetailsModal } from '@/components/JobDetailsModal';
import { ResumeTailorModal } from '@/components/ResumeTailorModal';
import { ApplyModal } from '@/components/ApplyModal';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [stats, setStats] = useState<ScanStats>({
    totalJobs: 0,
    highMatchJobs: 0,
    appliedJobs: 0,
    savedJobs: 0
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [watchlist, setWatchlist] = useState<CompanyWatchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanDuration, setLastScanDuration] = useState<number | null>(null);
  const [scanBanner, setScanBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [juniorOnlyFilter, setJuniorOnlyFilter] = useState<boolean>(false);
  const [indiaOnlyFilter, setIndiaOnlyFilter] = useState<boolean>(false);
  const [ecosystemFilter, setEcosystemFilter] = useState<string>('all');

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [tailorJob, setTailorJob] = useState<JobListing | null>(null);
  const [isResumeStudioOpen, setIsResumeStudioOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<JobListing | null>(null);
  const [isTracesOpen, setIsTracesOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [profileRes, jobsRes, statsRes, watchlistRes] = await Promise.all([
          fetch('/api/profile').then((r) => r.json()),
          fetch('/api/jobs').then((r) => r.json()),
          fetch('/api/stats').then((r) => r.json()),
          fetch('/api/watchlist').then((r) => r.json())
        ]);

        if (profileRes.success) setProfile(profileRes.profile);
        if (jobsRes.success) setJobs(jobsRes.jobs);
        if (statsRes.success) setStats(statsRes.stats);
        if (watchlistRes.success) setWatchlist(watchlistRes.watchlist);
      } catch (err) {
        console.error('Failed to load initial dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle On-Demand Discovery Scan
  const handleScanNow = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanBanner(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (data.success) {
        const result = data.data;
        setLastScanDuration(result.durationMs);

        // Refresh jobs and stats
        const [jobsRes, statsRes] = await Promise.all([
          fetch('/api/jobs').then((r) => r.json()),
          fetch('/api/stats').then((r) => r.json())
        ]);

        if (jobsRes.success) setJobs(jobsRes.jobs);
        if (statsRes.success) setStats(statsRes.stats);

        setScanBanner({
          message: `Discovery cycle complete: Scanned ${result.totalFound} jobs across sources, evaluated ${result.evaluatedJobs} candidates (${result.highMatches} high-fit matches)!`,
          type: 'success'
        });
      } else {
        setScanBanner({
          message: `Scan encountered an issue: ${data.error || 'Unknown error'}`,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Scan failed:', err);
      setScanBanner({
        message: `Failed to complete scan: ${String(err)}`,
        type: 'error'
      });
    } finally {
      setIsScanning(false);
      setTimeout(() => {
        setScanBanner(null);
      }, 7000);
    }
  };

  // Status Change (Save, Apply, Archive)
  const handleStatusChange = async (id: string, newStatus: JobStatus) => {
    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: newStatus, updatedAt: new Date().toISOString() } : j))
    );

    if (selectedJob && selectedJob.id === id) {
      setSelectedJob({ ...selectedJob, status: newStatus });
    }

    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });

      if (res.ok) {
        // Refresh stats
        const statsRes = await fetch('/api/stats').then((r) => r.json());
        if (statsRes.success) setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  };

  // Save Profile Updates
  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    const data = await res.json();
    if (data.success) {
      setProfile(data.profile);
    }
  };

  // Watchlist Actions
  const handleAddWatchlist = async (company: Omit<CompanyWatchlist, 'id'>) => {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    const data = await res.json();
    if (data.success) {
      setWatchlist((prev) => [...prev.filter((w) => w.id !== data.company.id), data.company]);
    }
  };

  const handleRemoveWatchlist = async (id: string) => {
    const res = await fetch(`/api/watchlist?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
    }
  };

  // Filtered jobs calculation
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Status filter
      if (statusFilter !== 'ALL' && job.status !== statusFilter) {
        return false;
      }
      // Source filter
      if (sourceFilter !== 'all' && job.source !== sourceFilter) {
        return false;
      }
      // Min score filter
      if (minScoreFilter > 0 && job.matchScore < minScoreFilter) {
        return false;
      }
      // Junior / Fresher (<2 YOE) filter
      if (juniorOnlyFilter && !job.isJuniorFriendly) {
        return false;
      }
      // India Tech Hubs filter
      if (indiaOnlyFilter && !job.isIndiaLocation) {
        return false;
      }
      // Ecosystem filter
      if (ecosystemFilter !== 'all') {
        const hasEco = job.ecosystem?.some((e) => e.toLowerCase().includes(ecosystemFilter.toLowerCase()));
        if (!hasEco) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesTag = job.tags.some((t) => t.toLowerCase().includes(q));
        const matchesLoc = job.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesTag && !matchesLoc) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, statusFilter, sourceFilter, minScoreFilter, searchQuery, juniorOnlyFilter, indiaOnlyFilter, ecosystemFilter]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: jobs.length,
      new: jobs.filter((j) => j.status === 'NEW').length,
      saved: jobs.filter((j) => j.status === 'SAVED').length,
      applied: jobs.filter((j) => j.status === 'APPLIED').length,
      interviewing: jobs.filter((j) => j.status === 'INTERVIEWING').length,
      archived: jobs.filter((j) => j.status === 'ARCHIVED').length
    };
  }, [jobs]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Header */}
      <DashboardHeader
        stats={stats}
        isScanning={isScanning}
        onScanNow={handleScanNow}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenResumeStudio={() => {
          setTailorJob(null);
          setIsResumeStudioOpen(true);
        }}
        onOpenTraces={() => setIsTracesOpen(true)}
        lastScanDuration={lastScanDuration}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Banner */}
        {scanBanner && (
          <div
            className={`mb-5 p-3.5 rounded-lg flex items-center justify-between gap-3 text-xs font-medium border animate-fade-in ${
              scanBanner.type === 'success'
                ? 'bg-card border-border text-foreground'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            <div className="flex items-center gap-2">
              {scanBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              )}
              <span>{scanBanner.message}</span>
            </div>
            <button
              onClick={() => setScanBanner(null)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Autonomous Loop Visualizer Bar */}
        <AutonomousLoopBar
          stats={stats}
          isScanning={isScanning}
          onRunAutonomousLoop={handleScanNow}
          onOpenTraces={() => setIsTracesOpen(true)}
          onOpenResumeStudio={() => {
            setTailorJob(null);
            setIsResumeStudioOpen(true);
          }}
        />

        {/* Filter Bar */}
        <FilterBar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          minScoreFilter={minScoreFilter}
          setMinScoreFilter={setMinScoreFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          juniorOnlyFilter={juniorOnlyFilter}
          setJuniorOnlyFilter={setJuniorOnlyFilter}
          indiaOnlyFilter={indiaOnlyFilter}
          setIndiaOnlyFilter={setIndiaOnlyFilter}
          ecosystemFilter={ecosystemFilter}
          setEcosystemFilter={setEcosystemFilter}
          counts={counts}
        />

        {/* Jobs Grid or Empty State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin mb-3" />
            <div className="text-sm font-medium text-foreground">Loading JobScout Dashboard...</div>
            <div className="text-xs text-muted-foreground mt-1">Connecting to storage engine</div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                onViewDetails={(j) => setSelectedJob(j)}
                onTailorResume={(j) => {
                  setTailorJob(j);
                  setIsResumeStudioOpen(true);
                }}
                onOpenApply={(j) => {
                  setApplyJob(j);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 px-4 rounded-xl border border-border bg-card/60 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground mb-3">
              <Inbox className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-foreground mb-1">
              {jobs.length === 0 ? 'No job opportunities scanned yet' : 'No jobs match your active filters'}
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
              {jobs.length === 0
                ? 'Run an autonomous scan to discover and evaluate positions from 112+ AI startup career boards.'
                : 'Try adjusting your match score filter or clearing the search query.'}
            </p>

            {jobs.length === 0 && (
              <Button
                onClick={handleScanNow}
                disabled={isScanning}
                className="gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run First Discovery Scan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {profile && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={profile}
          onSaveProfile={handleSaveProfile}
        />
      )}

      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        onAddCompany={handleAddWatchlist}
        onRemoveCompany={handleRemoveWatchlist}
      />

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={handleStatusChange}
        onTailorResume={(j) => {
          setTailorJob(j);
          setIsResumeStudioOpen(true);
        }}
        onOpenApply={(j) => {
          setApplyJob(j);
        }}
      />

      <ResumeTailorModal
        job={tailorJob}
        isOpen={isResumeStudioOpen}
        onClose={() => {
          setIsResumeStudioOpen(false);
          setTailorJob(null);
        }}
      />

      <ApplyModal
        job={applyJob}
        isOpen={!!applyJob}
        onClose={() => setApplyJob(null)}
        onStatusChange={handleStatusChange}
      />

      <TraceDrawer
        isOpen={isTracesOpen}
        onClose={() => setIsTracesOpen(false)}
      />
    </div>
  );
}
