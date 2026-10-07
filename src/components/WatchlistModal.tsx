'use client';

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Check,
  Search,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CompanyWatchlist } from '@/types';
import { TOP_100_AI_COMPANIES, AICompanyProfile } from '@/lib/data/top-ai-companies';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: CompanyWatchlist[];
  onAddCompany: (company: Omit<CompanyWatchlist, 'id'>) => Promise<void>;
  onRemoveCompany: (id: string) => Promise<void>;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  watchlist,
  onAddCompany,
  onRemoveCompany
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'active' | 'custom'>('directory');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [atsProvider, setAtsProvider] = useState<'ashby' | 'greenhouse' | 'lever'>('ashby');
  const [careersUrl, setCareersUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [batchImporting, setBatchImporting] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'all',
    'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    'YC AI Startups (Recent Batches)',
    'a16z AI Portfolio',
    'Foundation Models & LLM Labs',
    'AI Developer Tools & Infra',
    'Generative Media & Creative AI',
    'AI Coding & Autonomous Agents',
    'Enterprise AI & Vertical AI',
    'AI Hardware & Cloud Compute',
    'Robotics & Physical AI'
  ];

  const filteredDirectory = TOP_100_AI_COMPANIES.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setAdding(true);
    try {
      await onAddCompany({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        atsProvider,
        careersUrl: careersUrl.trim() || undefined,
        enabled: true
      });
      setName('');
      setSlug('');
      setCareersUrl('');
      setActiveTab('active');
    } catch (err) {
      console.error('Failed to add custom company:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleAddFromDirectory = async (comp: AICompanyProfile) => {
    await onAddCompany({
      name: comp.name,
      slug: comp.slug,
      atsProvider: comp.atsProvider,
      careersUrl: comp.careersUrl,
      enabled: true
    });
  };

  const handleBatchImport = async (category: string) => {
    setBatchImporting(true);
    try {
      const toAdd =
        category === 'all'
          ? TOP_100_AI_COMPANIES
          : TOP_100_AI_COMPANIES.filter((c) => c.category === category);

      for (const comp of toAdd) {
        if (!watchlist.some((w) => w.slug.toLowerCase() === comp.slug.toLowerCase())) {
          await onAddCompany({
            name: comp.name,
            slug: comp.slug,
            atsProvider: comp.atsProvider,
            careersUrl: comp.careersUrl,
            enabled: true
          });
        }
      }
    } catch (err) {
      console.error('Batch import failed:', err);
    } finally {
      setBatchImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <DialogTitle className="text-base">Target AI Companies &amp; ATS Watchlist</DialogTitle>
            <Badge variant="secondary" className="font-mono text-[10px]">
              100+ Verified AI Portals
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Direct unauthenticated queries into Ashby, Greenhouse, and Lever job boards
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pt-3 border-b border-border bg-card">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="directory" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Top 100 AI Directory</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Actively Tracked ({watchlist.length})</span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom ATS</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* TAB 1: DIRECTORY */}
            <TabsContent value="directory" className="space-y-4 m-0">
              {/* Batch Action Banner */}
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Instant AI Watchlist Seeding</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Batch-track the most influential foundation model labs, AI infra providers, and agent startups.
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleBatchImport(selectedCategory)}
                    disabled={batchImporting}
                    className="gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {batchImporting
                        ? 'Adding...'
                        : selectedCategory === 'all'
                        ? 'Track All 100 AI Portals'
                        : `Track Category (${filteredDirectory.length})`}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Search 100 AI companies (e.g. OpenAI, Anthropic, Cursor, Modal)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring max-w-xs truncate h-9"
                >
                  <option value="all">All Categories (100)</option>
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid of 100 AI Companies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[48vh] overflow-y-auto pr-1">
                {filteredDirectory.map((comp) => {
                  const isTracked = watchlist.some(
                    (w) => w.slug.toLowerCase() === comp.slug.toLowerCase()
                  );

                  return (
                    <div
                      key={comp.id}
                      className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                        isTracked
                          ? 'bg-muted/30 border-primary/20'
                          : 'bg-card border-border hover:border-border/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">{comp.name}</span>
                          <Badge variant="outline" className="font-mono uppercase text-[9px] px-1 py-0">
                            {comp.atsProvider}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          {comp.isIndiaHub && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              India Hub
                            </Badge>
                          )}
                          {comp.isYC && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              YC
                            </Badge>
                          )}
                          {comp.isA16z && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              a16z
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate mb-2">{comp.category}</div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                        {comp.careersUrl ? (
                          <a
                            href={comp.careersUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            <span>Careers</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span />
                        )}

                        {isTracked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                            <Check className="w-3 h-3" />
                            <span>Tracked</span>
                          </span>
                        ) : (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleAddFromDirectory(comp)}
                            className="gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Track</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB 2: ACTIVELY TRACKED */}
            <TabsContent value="active" className="space-y-4 m-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Currently Monitored ({watchlist.length} Companies)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Scanned directly during discovery cycles
                </span>
              </div>

              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-card max-h-[52vh] overflow-y-auto">
                {watchlist.map((company) => (
                  <div
                    key={company.id}
                    className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{company.name}</span>
                        <Badge variant="outline" className="font-mono uppercase text-[9px]">
                          {company.atsProvider}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        slug: {company.slug}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {company.careersUrl && (
                        <a
                          href={company.careersUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          title="View Career Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onRemoveCompany(company.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove Company"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {watchlist.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No target companies active. Switch to the &quot;Top 100 AI Directory&quot; tab to add companies!
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: ADD CUSTOM */}
            <TabsContent value="custom" className="space-y-4 max-w-lg mx-auto m-0">
              <div className="text-xs font-semibold text-foreground mb-2">
                Add Custom Startup ATS Board
              </div>

              <form onSubmit={handleAddCustom} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Company Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Supabase, Resend, Vercel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    ATS Slug / Board Identifier
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. supabase, resend, modal"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="font-mono"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Found in the URL: jobs.ashbyhq.com/<b>[slug]</b> or boards.greenhouse.io/<b>[slug]</b>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">ATS System</label>
                  <select
                    value={atsProvider}
                    onChange={(e) => setAtsProvider(e.target.value as any)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="ashby">Ashby (jobs.ashbyhq.com)</option>
                    <option value="greenhouse">Greenhouse (boards-api.greenhouse.io)</option>
                    <option value="lever">Lever (api.lever.co)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Careers URL (Optional)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://company.com/careers"
                    value={careersUrl}
                    onChange={(e) => setCareersUrl(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={adding}
                  className="w-full mt-2"
                >
                  {adding ? 'Adding...' : 'Add to Active Watchlist'}
                </Button>
              </form>
            </TabsContent>
          </div>
        </Tabs>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            Total Available: 100 AI Portals · Active: {watchlist.length}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
