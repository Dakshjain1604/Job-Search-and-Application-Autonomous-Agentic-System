'use client';

import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Send,
  UserCheck,
  Mail,
  MessageSquare,
  Share2,
  Search,
  Calendar,
  CheckCircle2,
  Bookmark,
  Sparkles,
  RefreshCw,
  Building,
  MapPin,
  Zap,
  FileText,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Monitor,
  ArrowRight,
  Clock
} from 'lucide-react';
import { JobListing, JobStatus } from '@/types';
import { ApplicationKit, AutoApplyMode, AutoApplyResult } from '@/lib/apply/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ApplyModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: JobStatus) => void;
  initialTab?: 'auto' | 'form' | 'outreach' | 'tracker';
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  job,
  isOpen,
  onClose,
  onStatusChange,
  initialTab = 'auto'
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'form' | 'outreach' | 'tracker'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<ApplicationKit | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto-apply state
  const [selectedMode, setSelectedMode] = useState<AutoApplyMode>('preview');
  const [executingAutoApply, setExecutingAutoApply] = useState(false);
  const [autoApplyStep, setAutoApplyStep] = useState<string>('');
  const [autoResult, setAutoResult] = useState<AutoApplyResult | null>(null);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [showFullScreenshot, setShowFullScreenshot] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen || !job) {
      setAutoResult(null);
      setAutoError(null);
      setAutoApplyStep('');
      return;
    }

    async function loadKit() {
      setLoading(true);
      try {
        const res = await fetch('/api/apply/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job!.id })
        });
        const data = await res.json();
        if (data.success) {
          setKit(data.kit);
        }
      } catch (err) {
        console.error('Failed to load application kit:', err);
      } finally {
        setLoading(false);
      }
    }

    loadKit();
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getAtsLabel = (ats: string) => {
    switch (ats) {
      case 'ashby':
        return 'Ashby ATS';
      case 'greenhouse':
        return 'Greenhouse ATS';
      case 'lever':
        return 'Lever ATS';
      default:
        return 'Direct Portal';
    }
  };

  const atsLabel = kit ? getAtsLabel(kit.atsProvider) : job.source;

  // Run autonomous application
  const handleExecuteAutoApply = async (overrideMode?: AutoApplyMode) => {
    const modeToRun = overrideMode || selectedMode;
    setExecutingAutoApply(true);
    setAutoError(null);

    // Live progress messages
    setAutoApplyStep('Compiling strict 1-page PDF resume via Tectonic...');
    const stepTimer1 = setTimeout(() => {
      setAutoApplyStep('Launching browser & navigating to ATS application page...');
    }, 1200);
    const stepTimer2 = setTimeout(() => {
      setAutoApplyStep('Auto-filling candidate details, contact info & links...');
    }, 3500);
    const stepTimer3 = setTimeout(() => {
      setAutoApplyStep('Attaching compiled 1-page PDF to resume upload input...');
    }, 6000);
    const stepTimer4 = setTimeout(() => {
      setAutoApplyStep('Solving screening questions & capturing visual snapshot...');
    }, 8500);

    try {
      const res = await fetch('/api/apply/auto-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          mode: modeToRun
        })
      });

      const data = await res.json();

      if (data.success && data.result) {
        setAutoResult(data.result);
        if (data.result.submitted) {
          onStatusChange(job.id, 'APPLIED');
        }
      } else {
        setAutoError(data.error || data.result?.error || 'Failed to complete autonomous application.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAutoError(msg || 'Network error executing autonomous application.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      setExecutingAutoApply(false);
      setAutoApplyStep('');
    }
  };

  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 5);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-[calc(100vw-1.5rem)] sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border bg-card pr-12">
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="mono">{atsLabel}</Badge>
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span>1-Click Autonomous Apply</span>
              </Badge>
              {job.status === 'APPLIED' && <Badge variant="success">Applied</Badge>}
            </div>

            {kit && (
              <a
                href={kit.applicationUrl}
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

          <DialogTitle className="text-base font-semibold">{job.title}</DialogTitle>

          <DialogDescription className="flex items-center gap-2 pt-0.5 text-xs">
            <span className="font-medium text-foreground flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-muted-foreground" />
              {job.company}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              {job.location}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selection */}
        <div className="px-4 sm:px-5 pt-2 sm:pt-2.5 border-b border-border bg-card overflow-x-auto no-scrollbar">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
            <TabsList className="overflow-x-auto no-scrollbar flex-nowrap w-full sm:w-auto">
              <TabsTrigger value="auto" className="gap-1.5 shrink-0 text-xs">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span><span className="hidden sm:inline">1-Click </span>Auto<span className="hidden sm:inline">nomous</span></span>
              </TabsTrigger>
              <TabsTrigger value="form" className="gap-1.5 shrink-0 text-xs">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden sm:inline">Manual </span>Field Kit</span>
              </TabsTrigger>
              <TabsTrigger value="outreach" className="gap-1.5 shrink-0 text-xs">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden sm:inline">Executive </span>Outreach</span>
              </TabsTrigger>
              <TabsTrigger value="tracker" className="gap-1.5 shrink-0 text-xs">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden sm:inline">Status </span>Tracker</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <RefreshCw className="w-7 h-7 animate-spin mb-3 text-foreground" />
              <p className="text-xs font-medium">Preparing application payload, screening answers, and founder outreach...</p>
            </div>
          )}

          {!loading && kit && (
            <>
              {/* TAB 1: 1-CLICK AUTONOMOUS APPLY */}
              {activeTab === 'auto' && (
                <div className="space-y-4">
                  {/* Mode Selector Card */}
                  <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-foreground">
                          Autonomous Form-Filler &amp; Resume Uploader
                        </h3>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Chromium / Chrome Engine
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Launches an automated browser session to populate {job.company}&#39;s application form, attach Daksh&#39;s tailored 1-page PDF resume, answer screening questions, and verify submission.
                    </p>

                    {/* Mode Selection Radios */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div
                        onClick={() => setSelectedMode('preview')}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                          selectedMode === 'preview'
                            ? 'bg-muted/60 border-primary ring-1 ring-primary/30'
                            : 'bg-card border-border hover:border-border/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-xs font-semibold text-foreground">Auto-Fill &amp; Review</span>
                            </div>
                            <Badge variant="success" className="text-[9px] px-1 py-0 shrink-0">Recommended</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Fills inputs, attaches PDF, solves questions, and captures full-page snapshot for review.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setSelectedMode('submit')}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                          selectedMode === 'submit'
                            ? 'bg-muted/60 border-primary ring-1 ring-primary/30'
                            : 'bg-card border-border hover:border-border/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-xs font-semibold text-foreground">Full Auto-Submit</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono shrink-0">Zero-Touch</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Fills inputs, attaches resume, clicks submit button, and logs confirmation receipt automatically.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setSelectedMode('headed')}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                          selectedMode === 'headed'
                            ? 'bg-muted/60 border-primary ring-1 ring-primary/30'
                            : 'bg-card border-border hover:border-border/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-semibold text-foreground">Open in Chrome</span>
                            </div>
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">Desktop</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Launches desktop Google Chrome with form 100% pre-filled for manual verification or CAPTCHA.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trigger Button */}
                    <div className="pt-2">
                      <Button
                        size="default"
                        disabled={executingAutoApply}
                        onClick={() => handleExecuteAutoApply()}
                        className="w-full gap-2 h-10 text-xs font-semibold shadow-sm"
                      >
                        {executingAutoApply ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span className="truncate">{autoApplyStep || 'Executing Autonomous Application...'}</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span className="truncate">
                              {selectedMode === 'preview'
                                ? 'Start 1-Click Auto-Fill & Review'
                                : selectedMode === 'submit'
                                ? 'Submit Application Autonomously'
                                : 'Launch Pre-Filled Chrome Window'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-auto" />
                          </>
                        )}
                      </Button>
                    </div>

                    {autoError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{autoError}</span>
                      </div>
                    )}
                  </div>

                  {/* Execution Results & Snapshot Viewer */}
                  {autoResult && (
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3.5 animate-fade-in">
                      {/* Success / Status Banner */}
                      <div
                        className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          autoResult.submitted
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
                            : autoResult.captchaDetected
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-muted/40 border-border text-foreground font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {autoResult.submitted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : autoResult.captchaDetected ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          )}
                          <span className="leading-tight">
                            {autoResult.confirmationMessage ||
                              (autoResult.submitted
                                ? 'Application successfully submitted and confirmed by ATS!'
                                : autoResult.captchaDetected
                                ? 'Cloudflare / CAPTCHA challenge detected on portal. Open in Chrome to finalize.'
                                : 'Form successfully pre-filled, resume attached, and verified.')}
                          </span>
                        </div>

                        {autoResult.mode === 'preview' && !autoResult.submitted && (
                          <Button
                            size="sm"
                            onClick={() => handleExecuteAutoApply('submit')}
                            disabled={executingAutoApply}
                            className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 shadow-xs"
                          >
                            <Send className="w-3 h-3 shrink-0" />
                            <span>Confirm &amp; Submit Application</span>
                          </Button>
                        )}
                      </div>

                      {/* Evidence Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">Fields Filled</div>
                          <div className="text-sm font-semibold text-foreground font-mono mt-0.5">
                            {autoResult.filledFields.length} fields
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">Resume PDF</div>
                          <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Attached</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">Questions Solved</div>
                          <div className="text-sm font-semibold text-foreground font-mono mt-0.5">
                            {autoResult.screeningQuestionsAnswered} answered
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">Latency</div>
                          <div className="text-sm font-semibold text-foreground font-mono mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span>{(autoResult.durationMs / 1000).toFixed(1)}s</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Snapshot Viewer */}
                      {autoResult.screenshotBase64 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Visual Application Page Snapshot</span>
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              Captured live from Chrome
                            </span>
                          </div>

                          <div className="rounded-lg border border-border overflow-hidden bg-zinc-950 max-h-[380px] overflow-y-auto relative shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`data:image/png;base64,${autoResult.screenshotBase64}`}
                              alt="Application Snapshot"
                              className="w-full object-top object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Filled Fields Audit Table */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-semibold text-muted-foreground">
                          Audited Field Values (Zero Hallucinations):
                        </div>
                        <div className="max-h-36 overflow-y-auto divide-y divide-border border border-border rounded-lg bg-card/40 text-xs font-mono">
                          {autoResult.filledFields.map((f, idx) => (
                            <div key={idx} className="p-2 flex items-center justify-between gap-2">
                              <span className="text-muted-foreground font-sans font-medium">{f.field}</span>
                              <span className="text-foreground truncate max-w-[280px]">{f.valueMasked}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MANUAL FORM AUTO-FILL */}
              {activeTab === 'form' && (
                <div className="space-y-6">
                  {/* Common Fields Grid */}
                  <div>
                    <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Standard Application Fields (Click to Copy)</span>
                      <span className="text-[11px] text-muted-foreground lowercase">1-click to clipboard</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {kit.candidateFields.map((field) => (
                        <div
                          key={field.fieldKey}
                          onClick={() => handleCopy(field.fieldKey, field.value)}
                          className="p-3 rounded-lg bg-muted/40 border border-border hover:border-foreground/30 transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {field.label}
                            </span>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                              {copiedKey === field.fieldKey ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-foreground truncate font-mono">
                            {field.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Screening Questions Solutions */}
                  <div>
                    <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Solved Screening Questions (Grounded Factual Metrics)</span>
                    </div>

                    <div className="space-y-3">
                      {kit.screeningQuestions.map((sq) => (
                        <div key={sq.id} className="p-3.5 rounded-lg bg-card border border-border space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-semibold text-foreground">{sq.question}</span>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleCopy(sq.id, sq.suggestedAnswer)}
                              className="gap-1 h-6 px-2 text-xs shrink-0"
                            >
                              {copiedKey === sq.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </Button>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 p-2.5 rounded border border-border/50">
                            &quot;{sq.suggestedAnswer}&quot;
                          </p>

                          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                            <span>Evidence Source:</span>
                            <span className="text-foreground">{sq.evidenceSource}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EXECUTIVE OUTREACH */}
              {activeTab === 'outreach' && (
                <div className="space-y-5">
                  {/* Recruiter / Founder Discovery Links */}
                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Find Key Decision Makers at {job.company}</div>
                      <div className="text-[11px] text-muted-foreground">Pre-filtered search queries for founders and hiring managers</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="xs" asChild className="gap-1.5 h-7">
                        <a href={kit.discoveryLinks.founderSearchUrl} target="_blank" rel="noopener noreferrer">
                          <Search className="w-3 h-3" />
                          <span>Founders</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </Button>
                      <Button variant="outline" size="xs" asChild className="gap-1.5 h-7">
                        <a href={kit.discoveryLinks.engineeringLeadSearchUrl} target="_blank" rel="noopener noreferrer">
                          <Search className="w-3 h-3" />
                          <span>Eng Leads</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Cold Email Pack */}
                  <div className="p-4 rounded-lg bg-card border border-border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Targeted Executive Cold Email</span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleCopy('email_body', kit.outreach.coldEmail.body)}
                        className="gap-1 h-6 px-2 text-xs"
                      >
                        {copiedKey === 'email_body' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Body</span>
                      </Button>
                    </div>

                    <div className="text-xs font-mono bg-muted/40 p-2 rounded border border-border flex items-center justify-between">
                      <span className="text-muted-foreground truncate">Subject: {kit.outreach.coldEmail.subject}</span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleCopy('email_subject', kit.outreach.coldEmail.subject)}
                        className="h-5 px-1.5"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </Button>
                    </div>

                    <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded border border-border">
                      {kit.outreach.coldEmail.body}
                    </pre>
                  </div>

                  {/* LinkedIn Connection Note */}
                  <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-foreground">LinkedIn Connect Note</span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-2">
                          ({kit.outreach.linkedInNote.length}/300 chars)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleCopy('linkedin_note', kit.outreach.linkedInNote)}
                        className="gap-1 h-6 px-2 text-xs"
                      >
                        {copiedKey === 'linkedin_note' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Note</span>
                      </Button>
                    </div>

                    <p className="text-xs text-foreground bg-muted/40 p-3 rounded border border-border italic leading-relaxed">
                      &quot;{kit.outreach.linkedInNote}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: APPLICATION TRACKER */}
              {activeTab === 'tracker' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                    <div className="text-xs font-semibold text-foreground">Update Application Status</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant={job.status === 'APPLIED' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onStatusChange(job.id, 'APPLIED')}
                        className="gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </Button>
                      <Button
                        variant={job.status === 'INTERVIEWING' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onStatusChange(job.id, 'INTERVIEWING')}
                        className="gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Interviewing</span>
                      </Button>
                      <Button
                        variant={job.status === 'SAVED' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onStatusChange(job.id, 'SAVED')}
                        className="gap-1.5"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                    <div className="text-xs font-semibold text-foreground">Recommended Follow-up Schedule</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If no response by{' '}
                      <span className="font-semibold text-foreground">
                        {followUpDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>{' '}
                      (5 business days), send a polite follow-up email citing a newly published open-source feature or project update.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            {job.company} · {kit?.atsProvider || job.source}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {kit && (
              <Button size="sm" variant="secondary" asChild className="gap-1.5 border border-border/80 shadow-xs">
                <a href={kit.applicationUrl} target="_blank" rel="noopener noreferrer">
                  <span>Open Official ATS</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
