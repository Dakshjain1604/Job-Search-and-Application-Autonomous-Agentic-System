'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Archive,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  MapPin,
  DollarSign,
  Wifi,
  GraduationCap,
  Globe2,
  Rocket,
  Send,
  FileText,
  ArrowRight,
  RefreshCw,
  Zap
} from 'lucide-react';
import { JobListing, JobStatus } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface JobCardProps {
  job: JobListing;
  onStatusChange: (id: string, newStatus: JobStatus) => void;
  onViewDetails: (job: JobListing) => void;
  onTailorResume?: (job: JobListing) => void;
  onOpenApply?: (job: JobListing) => void;
}

const getCompanyInitials = (name: string) => {
  const clean = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'AI';
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onStatusChange,
  onViewDetails,
  onTailorResume,
  onOpenApply
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(job.tailoredPitch || '');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);

  React.useEffect(() => {
    setCurrentPitch(job.tailoredPitch || '');
  }, [job.tailoredPitch]);

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
        setPitchError(data.error || 'Failed to craft pitch');
      }
    } catch {
      setPitchError('Network error while generating pitch');
    } finally {
      setGeneratingPitch(false);
    }
  };

  const isAiRole = React.useMemo(() => {
    const text = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
    const aiKeywords = [
      'ai', 'agent', 'llm', 'genai', 'machine learning', 'prompt', 'rag', 'nlp', 'mcp', 'vector', 'embeddings'
    ];
    return aiKeywords.some((kw) => text.includes(kw)) || job.title.toLowerCase().includes('ai');
  }, [job.title, job.description, job.tags]);

  const getScoreVariant = (score: number): 'success' | 'secondary' | 'mono' => {
    if (score >= 80) return 'success';
    if (score >= 65) return 'secondary';
    return 'mono';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Strong Fit';
    if (score >= 65) return 'Good Fit';
    return 'Potential';
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'hacker-news':
        return 'HN Hiring';
      case 'ashby':
        return 'Ashby';
      case 'greenhouse':
        return 'Greenhouse';
      case 'lever':
        return 'Lever';
      case 'remotive':
        return 'Remotive';
      case 'arbeitnow':
        return 'Arbeitnow';
      default:
        return source;
    }
  };

  const companyInitials = getCompanyInitials(job.company);

  const handleCopyPitch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPitch) return;
    navigator.clipboard.writeText(currentPitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <Card className="flex flex-col justify-between hover:border-primary/40 transition-colors group">
      <div>
        {/* Top Badges and Action Buttons */}
        <div className="p-4 pb-2 flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={getScoreVariant(job.matchScore)} className="font-mono gap-1">
              <span>{job.matchScore}%</span>
              <span className="font-sans opacity-70">· {getScoreLabel(job.matchScore)}</span>
            </Badge>

            <Badge variant="mono">{getSourceLabel(job.source)}</Badge>

            {job.remote && (
              <Badge variant="outline" className="gap-1">
                <Wifi className="w-2.5 h-2.5 text-muted-foreground" />
                <span>Remote</span>
              </Badge>
            )}

            {job.isJuniorFriendly && (
              <Badge variant="outline" className="gap-1 text-foreground">
                <GraduationCap className="w-3 h-3 text-muted-foreground" />
                <span>&lt;2 YOE</span>
              </Badge>
            )}

            {job.isIndiaLocation && (
              <Badge variant="outline" className="gap-1 text-foreground">
                <Globe2 className="w-2.5 h-2.5 text-muted-foreground" />
                <span>India</span>
              </Badge>
            )}

            {job.ecosystem?.map((eco) => (
              <Badge key={eco} variant="mono" className="gap-1">
                <Rocket className="w-2.5 h-2.5 text-muted-foreground" />
                <span>{eco}</span>
              </Badge>
            ))}
          </div>

          {/* Quick status actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant={job.status === 'SAVED' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => onStatusChange(job.id, job.status === 'SAVED' ? 'NEW' : 'SAVED')}
              title={job.status === 'SAVED' ? 'Remove from shortlist' : 'Shortlist'}
            >
              <Bookmark className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant={job.status === 'APPLIED' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => onStatusChange(job.id, job.status === 'APPLIED' ? 'NEW' : 'APPLIED')}
              title={job.status === 'APPLIED' ? 'Mark unapplied' : 'Mark as Applied'}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant={job.status === 'ARCHIVED' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => onStatusChange(job.id, job.status === 'ARCHIVED' ? 'NEW' : 'ARCHIVED')}
              title="Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Company & Role Header */}
        <div className="px-4 py-2 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center font-mono font-bold text-xs text-foreground shrink-0 select-none shadow-sm">
            {companyInitials}
          </div>

          <div className="min-w-0 flex-1">
            <h2
              onClick={() => onViewDetails(job)}
              className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug cursor-pointer"
            >
              {job.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground">{job.company}</span>
              <span>·</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                {job.location}
              </span>
            </div>
          </div>
        </div>

        {/* Salary Indicator */}
        {job.salary && (
          <div className="px-4 py-1">
            <span className="inline-flex items-center gap-1 text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded border border-border">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span>{job.salary}</span>
            </span>
          </div>
        )}

        {/* Skills & Tags */}
        <div className="px-4 py-2 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 5).map((t, idx) => (
            <Badge key={idx} variant="mono">
              {t}
            </Badge>
          ))}
          {job.tags.length > 5 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{job.tags.length - 5}
            </span>
          )}
        </div>

        {/* AI Fit Insights Accordion */}
        <div className="mx-4 mb-3 rounded-lg bg-muted/30 border border-border p-3">
          <div
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between cursor-pointer text-xs font-medium text-foreground select-none"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <span>AI Fit &amp; Outreach Pitch</span>
            </div>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>

          {!expanded && job.matchPros && job.matchPros.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
              ✓ {job.matchPros[0]}
            </p>
          )}

          {expanded && (
            <div className="mt-2.5 pt-2.5 border-t border-border space-y-2.5 text-xs">
              {job.matchPros && job.matchPros.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-foreground mb-1">Key Strengths:</div>
                  <ul className="space-y-1">
                    {job.matchPros.map((pro, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.matchCons && job.matchCons.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground mb-1">Gaps / Requirements:</div>
                  <ul className="space-y-1">
                    {job.matchCons.map((con, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span>·</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* On-Demand Tailored Outreach Note */}
              {currentPitch ? (
                <div className="bg-background rounded-md p-3 border border-border mt-2 space-y-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                        Tailored Cold Outreach Note
                      </span>
                      <Badge variant="outline" className="text-[9px] text-emerald-500 font-mono py-0">
                        Ready
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={generatingPitch}
                        onClick={() => handleGeneratePitch(true)}
                        title="Regenerate with fresh AI response"
                        className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${generatingPitch ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={handleCopyPitch}
                        className="gap-1 h-6 px-2 text-xs"
                      >
                        {copiedPitch ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-muted-foreground" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-line leading-relaxed italic bg-card/60 p-2.5 rounded border border-border/60">
                    {currentPitch}
                  </p>
                </div>
              ) : (
                <div className="bg-card/60 rounded-md p-3 border border-dashed border-border mt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Executive Cold Outreach Note</span>
                    </div>
                    <Badge variant="mono" className="text-[9px]">
                      On-Demand
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Generate an executive cold note mapping Daksh&#39;s verified achievements to {job.company}&#39;s engineering challenges.
                  </p>
                  {pitchError && (
                    <div className="text-[10px] text-destructive bg-destructive/10 p-1.5 rounded">
                      {pitchError}
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="xs"
                    disabled={generatingPitch}
                    onClick={() => handleGeneratePitch(false)}
                    className="w-full gap-1.5 h-7 mt-0.5 border border-border/80"
                  >
                    {generatingPitch ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Crafting Tailored Note...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-muted-foreground" />
                        <span>Generate AI Outreach Note</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dedicated In-Card Resume Optimization & ATS Audit Section */}
        <div className="mx-4 mb-3 rounded-lg border border-border bg-card/50 p-3 space-y-2 transition-colors hover:border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Optimize 1-Page Resume</span>
            </div>
            <Badge variant={isAiRole ? 'mono' : 'secondary'} className="text-[9px] font-mono uppercase px-1.5 py-0">
              {isAiRole ? 'AI / Agent Master' : 'SWE / Systems Master'}
            </Badge>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {isAiRole
              ? `Auto-ranks Coding Agent (1,300+ tests) & neo-mcp (PyPI/npm) for ${job.company}'s requirements.`
              : `Auto-ranks full-stack distributed systems & high-throughput apps for ${job.company}'s requirements.`}
          </p>

          <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <Check className="w-3 h-3 shrink-0" />
                Strict 1-Page
              </span>
              <span className="text-[10px] text-muted-foreground">100% ATS Safe</span>
            </div>

            {onTailorResume && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onTailorResume(job)}
                className="w-full h-8 text-xs font-medium border border-border/80 hover:bg-secondary hover:text-foreground justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Tailor &amp; Audit Resume</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0 ml-0.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <CardFooter className="p-3.5 pt-2 border-t border-border bg-muted/10">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(job)}
            className="w-full h-8 text-xs font-medium text-muted-foreground hover:text-foreground shadow-xs gap-1.5"
          >
            <span>View Specs</span>
          </Button>

          {onOpenApply ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenApply(job)}
              className="w-full h-8 text-xs font-semibold shadow-xs gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>1-Click Apply</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              asChild
              className="w-full h-8 text-xs font-semibold shadow-xs gap-1.5"
            >
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <span>Open Official ATS</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
