'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Building,
  MapPin,
  DollarSign,
  Bookmark,
  CheckCircle2,
  Archive,
  Calendar,
  Send,
  GraduationCap,
  Globe2,
  Rocket,
  RefreshCw,
  Zap
} from 'lucide-react';
import { JobListing, JobStatus } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface JobDetailsModalProps {
  job: JobListing | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: JobStatus) => void;
  onTailorResume?: (job: JobListing) => void;
  onOpenApply?: (job: JobListing) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onClose,
  onStatusChange,
  onTailorResume,
  onOpenApply
}) => {
  const [copied, setCopied] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(job?.tailoredPitch || '');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);

  React.useEffect(() => {
    if (job) {
      setCurrentPitch(job.tailoredPitch || '');
    }
  }, [job?.id, job?.tailoredPitch]);

  if (!job) return null;

  const handleGeneratePitch = async (forceRegenerate = false) => {
    setGeneratingPitch(true);
    setPitchError(null);
    try {
      const res = await fetch('/api/jobs/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, forceRegenerate })
      });
      const data = await res.json();
      if (data.success && data.pitch) {
        setCurrentPitch(data.pitch);
        job.tailoredPitch = data.pitch;
      } else {
        setPitchError(data.error || 'Failed to craft note');
      }
    } catch {
      setPitchError('Network error while generating note');
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    if (!currentPitch) return;
    navigator.clipboard.writeText(currentPitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={Boolean(job)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-[calc(100vw-1.5rem)] sm:max-w-3xl">
        <DialogHeader className="pr-12">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="success" className="font-mono gap-1">
                <Sparkles className="w-3 h-3" />
                {job.matchScore}% Match
              </Badge>
              <Badge variant="mono">{job.source}</Badge>
              {job.remote && <Badge variant="outline">Remote</Badge>}
              {job.isJuniorFriendly && (
                <Badge variant="outline" className="gap-1 text-foreground">
                  <GraduationCap className="w-3 h-3 text-muted-foreground" />
                  &lt;2 YOE
                </Badge>
              )}
              {job.isIndiaLocation && (
                <Badge variant="outline" className="gap-1 text-foreground">
                  <Globe2 className="w-3 h-3 text-muted-foreground" />
                  India Hub
                </Badge>
              )}
              {job.ecosystem?.map((eco) => (
                <Badge key={eco} variant="mono" className="gap-1">
                  <Rocket className="w-2.5 h-2.5 text-muted-foreground" />
                  {eco}
                </Badge>
              ))}
            </div>

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono py-1 px-2.5 rounded-md border border-border/80 hover:bg-muted/50 transition-colors shadow-xs shrink-0 mr-1"
                title="Open official external ATS application in new tab"
              >
                <span>Open Official ATS</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>

          <DialogTitle className="text-lg">{job.title}</DialogTitle>

          <DialogDescription className="flex items-center gap-3 pt-1 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Building className="w-3.5 h-3.5 text-muted-foreground" />
              {job.company}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              {job.location}
            </span>
            {job.salary && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono text-foreground">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  {job.salary}
                </span>
              </>
            )}
            <span>·</span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {new Date(job.discoveredAt).toLocaleDateString()}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Decision Intelligence Panel */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Matchmaker Assessment
            </div>

            {/* Strengths & Missing skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-emerald-400 mb-2">Matching Strengths:</div>
                <ul className="space-y-1.5">
                  {job.matchPros.map((pro, i) => (
                    <li key={i} className="text-xs text-foreground/90 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs font-semibold text-amber-400 mb-2">Gaps / Requirements:</div>
                <ul className="space-y-1.5">
                  {job.matchCons.map((con, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">·</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tailored Cold Pitch Hook */}
            <div className="pt-3 border-t border-border">
              {currentPitch ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        Tailored Cold Outreach Note:
                      </span>
                      <Badge variant="outline" className="text-[9px] text-emerald-500 font-mono py-0">
                        Ready
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={generatingPitch}
                        onClick={() => handleGeneratePitch(true)}
                        title="Regenerate note with AI"
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className={`w-3 h-3 ${generatingPitch ? 'animate-spin' : ''}`} />
                        <span className="text-xs ml-1">Regenerate</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={handleCopyPitch}
                        className="gap-1 h-7 text-xs"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Note</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border text-xs text-foreground leading-relaxed whitespace-pre-line font-mono">
                    {currentPitch}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-card/60 border border-dashed border-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Executive Cold Outreach Note</span>
                    </div>
                    <Badge variant="mono" className="text-[9px]">On-Demand</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Generate an executive cold note mapping Daksh&#39;s verified achievements to {job.company}&#39;s engineering challenges.
                  </p>
                  {pitchError && (
                    <div className="text-[10px] text-destructive bg-destructive/10 p-1.5 rounded">
                      {pitchError}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={generatingPitch}
                    onClick={() => handleGeneratePitch(false)}
                    className="w-full gap-1.5 h-8 mt-1 border border-border"
                  >
                    {generatingPitch ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Crafting Tailored Note...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Generate AI Outreach Note</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Technologies &amp; Tags:</div>
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((tag, i) => (
                <Badge key={i} variant="mono">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Full Job Description */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Job Description:</div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border text-xs text-foreground/90 leading-relaxed whitespace-pre-line font-sans">
              {job.description}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="justify-between flex-wrap gap-2">
          {/* Status actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant={job.status === 'SAVED' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(job.id, job.status === 'SAVED' ? 'NEW' : 'SAVED')}
              className="gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{job.status === 'SAVED' ? 'Shortlisted' : 'Shortlist'}</span>
            </Button>

            <Button
              variant={job.status === 'APPLIED' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(job.id, job.status === 'APPLIED' ? 'NEW' : 'APPLIED')}
              className="gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{job.status === 'APPLIED' ? 'Applied' : 'Mark Applied'}</span>
            </Button>

            <Button
              variant={job.status === 'ARCHIVED' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(job.id, job.status === 'ARCHIVED' ? 'NEW' : 'ARCHIVED')}
              className="gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onTailorResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTailorResume(job)}
                className="gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Tailor 1-Page Resume</span>
              </Button>
            )}

            {job.url && (
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="gap-1.5 border border-border/80 shadow-xs"
              >
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <span>Open Official ATS</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </Button>
            )}

            {onOpenApply && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onOpenApply(job)}
                className="gap-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>1-Click Apply</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
