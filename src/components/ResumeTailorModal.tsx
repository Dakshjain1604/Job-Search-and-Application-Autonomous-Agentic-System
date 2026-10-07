'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ExternalLink,
  Code2
} from 'lucide-react';
import { JobListing } from '@/types';
import { TailoredResumeResult } from '@/lib/resume/types';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ResumeTailorModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeTailorModal: React.FC<ResumeTailorModalProps> = ({ job, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'latex' | 'rationale' | 'ats'>('latex');
  const [loading, setLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [result, setResult] = useState<TailoredResumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom Job input mode
  const [customCompany, setCustomCompany] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [roleFamily, setRoleFamily] = useState<'auto' | 'ai' | 'swe'>('auto');

  useEffect(() => {
    if (!isOpen) return;

    if (job) {
      setCustomCompany(job.company);
      setCustomTitle(job.title);
      setCustomDescription(job.description);
      handleTailor(job.id);
    } else {
      // Standalone mode with empty or default values
      setCustomCompany('');
      setCustomTitle('');
      setCustomDescription('');
      setResult(null);
    }
  }, [isOpen, job]);

  const handleTailor = async (jobId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const payload: any = { roleFamily };
      if (jobId) {
        payload.jobId = jobId;
      } else {
        payload.customJob = {
          company: customCompany || 'Innovative AI Startup',
          title: customTitle || 'AI / Software Engineer',
          description: customDescription || ''
        };
      }

      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Failed to tailor resume.');
      }
    } catch (err) {
      console.error('Failed to tailor resume:', err);
      setError('Network or server error while tailoring resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLatex = () => {
    if (!result?.tailoredLatex) return;
    navigator.clipboard.writeText(result.tailoredLatex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleDownloadTex = () => {
    if (!result?.tailoredLatex) return;
    const blob = new Blob([result.tailoredLatex], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daksh_Jain_Resume_${result.company.replace(/\s+/g, '_')}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCompileAndDownloadPdf = async () => {
    if (!result?.tailoredLatex) return;
    setCompiling(true);

    try {
      const res = await fetch('/api/resume/compile?download=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latex: result.tailoredLatex,
          filename: `Daksh_Jain_Resume_${result.company.replace(/\s+/g, '_')}.pdf`
        })
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        alert(`Compilation note: ${errorJson.error || 'Could not compile locally. Download .tex to compile with tectonic or import to Overleaf.'}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Daksh_Jain_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to compile PDF:', err);
      alert('Error triggering local compilation. Please download the .tex source file directly.');
    } finally {
      setCompiling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-[calc(100vw-1.5rem)] sm:max-w-4xl max-h-[92vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="mono" className="gap-1">
              <FileText className="w-3 h-3 text-muted-foreground" />
              <span>Strict 1-Page LaTeX Studio</span>
            </Badge>

            {result && (
              <>
                <Badge variant="success" className="font-mono">
                  ATS Format {result.atsReport.formatScore}%
                </Badge>
                <Badge variant="outline" className="font-mono">
                  Variant: {result.variant}
                </Badge>
              </>
            )}
          </div>

          <DialogTitle>
            {job ? `Optimize Resume for ${job.company}` : 'Autonomous Resume Tailoring Studio'}
          </DialogTitle>

          <DialogDescription>
            {job
              ? `Repositioning Daksh's verified credentials for ${job.title} with zero hallucinations and ATS compliance.`
              : "Paste target startup requirements or let the system optimize Daksh's 1-page resume automatically."}
          </DialogDescription>
        </DialogHeader>

        {/* Custom Input Bar if in standalone mode */}
        {!job && (
          <div className="p-4 bg-muted/30 border-b border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Company Name</label>
                <Input
                  type="text"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  placeholder="e.g. Anthropic, Cursor, Cohere"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Job Title</label>
                <Input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. AI Engineer, Forward Deployed Engineer"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Job Description / Requirements</label>
              <Textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={2}
                placeholder="Paste key responsibilities or tech stack (e.g. Python, Agent loops, MCP, RAG)..."
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Role Family:</span>
                <select
                  value={roleFamily}
                  onChange={(e) => setRoleFamily(e.target.value as any)}
                  className="bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="auto">Auto-Detect</option>
                  <option value="ai">AI / LLM Agents (Master AI)</option>
                  <option value="swe">Full Stack / Platform (Master SWE)</option>
                </select>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleTailor()}
                disabled={loading || !customCompany}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Tailor &amp; Audit Resume</span>
              </Button>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="px-4 sm:px-6 pt-2.5 sm:pt-3 flex items-center justify-between border-b border-border bg-card overflow-x-auto no-scrollbar">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
            <TabsList className="overflow-x-auto no-scrollbar flex-nowrap max-w-full">
              <TabsTrigger value="latex" className="gap-1.5 shrink-0 text-xs">
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden sm:inline">Tailored </span>LaTeX Source</span>
              </TabsTrigger>
              <TabsTrigger value="rationale" className="gap-1.5 shrink-0 text-xs">
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden sm:inline">Repositioning </span>Strategy</span>
              </TabsTrigger>
              <TabsTrigger value="ats" className="gap-1.5 shrink-0 text-xs">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span><span className="hidden sm:inline">ATS </span>Audit Report</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {result && (
            <div className="hidden sm:flex items-center gap-2 pb-2">
              <Button
                variant="outline"
                size="xs"
                onClick={handleCopyLatex}
                className="gap-1 h-7"
              >
                {copiedLatex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLatex ? 'Copied' : 'Copy LaTeX'}</span>
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={handleDownloadTex}
                className="gap-1 h-7"
              >
                <Download className="w-3 h-3" />
                <span>.tex File</span>
              </Button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-foreground" />
              <p className="text-sm font-medium">Re-ordering projects, tailoring summary, and auditing ATS compliance...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold mb-1">Tailoring Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!loading && result && (
            <>
              {activeTab === 'latex' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
                    <span>Clean Computer Modern OT1 · No Ligature Traps · Floored Numbers</span>
                    <span className="font-mono text-[11px] text-muted-foreground/80">Compile: {result.compileCommand}</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-background border border-border text-[11px] font-mono text-foreground/90 overflow-x-auto leading-relaxed max-h-[50vh]">
                    {result.tailoredLatex}
                  </pre>
                </div>
              )}

              {activeTab === 'rationale' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-muted-foreground" />
                      Repositioning Strategy for {result.company}
                    </h3>
                    <div className="space-y-2">
                      {result.diffChanges.map((change, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-foreground bg-background p-3 rounded-lg border border-border">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{change}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                    <h4 className="font-semibold text-foreground">Strict Honesty Invariants Held:</h4>
                    <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                      <li>• <strong>No fabricated metrics:</strong> Only floored counts (45+ releases, 700+ tests, 1,300+ tests).</li>
                      <li>• <strong>No unverified tools:</strong> No Go, no fine-tuning, no payments claimed.</li>
                      <li>• <strong>No first-person voice:</strong> Implied subject format across all lines.</li>
                      <li>• <strong>Computer Modern safe:</strong> Words like &quot;office&quot; replaced with &quot;onsite&quot;.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'ats' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="text-muted-foreground text-[11px] mb-1">ATS Format &amp; Parse Safety</div>
                      <div className="text-2xl font-bold text-emerald-400">{result.atsReport.formatScore}%</div>
                      <div className="text-[11px] text-muted-foreground mt-1">Single column, body contact, no tables</div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="text-muted-foreground text-[11px] mb-1">Target Keyword Coverage</div>
                      <div className="text-2xl font-bold text-foreground">{result.atsReport.keywordScore}%</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{result.atsReport.matchedKeywords.length} matching terms extracted</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
                    <h4 className="font-semibold text-foreground">Parse Safety Audit (17 Automated Checks):</h4>
                    <div className="space-y-2">
                      {result.atsReport.checks.map((chk, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3 text-[11px] p-2.5 rounded-md bg-background border border-border min-w-0">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className={chk.passed ? 'text-emerald-400 font-bold shrink-0' : 'text-amber-400 font-bold shrink-0'}>
                              {chk.passed ? 'PASS' : 'WARN'}
                            </span>
                            <span className="text-foreground break-words">{chk.name}</span>
                          </div>
                          <span className="text-muted-foreground text-[10px] sm:text-right font-mono break-words min-w-0">{chk.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.atsReport.matchedKeywords.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Matched Key Terminology:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.atsReport.matchedKeywords.map((kw, i) => (
                          <Badge key={i} variant="mono">
                            ✓ {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!result && !loading && !error && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Select a job from the dashboard or paste requirements above to optimize Daksh&apos;s resume.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] sm:text-xs">Target: Strict 1-Page PDF (Letter) via Tectonic engine</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {result && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTex}
                  className="gap-1.5 w-full sm:w-auto justify-center"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download .tex</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCompileAndDownloadPdf}
                  disabled={compiling}
                  className="gap-1.5 shadow-sm w-full sm:w-auto justify-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${compiling ? 'animate-spin' : ''}`} />
                  <span>{compiling ? 'Compiling PDF...' : 'Compile & Download 1-Page PDF'}</span>
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
