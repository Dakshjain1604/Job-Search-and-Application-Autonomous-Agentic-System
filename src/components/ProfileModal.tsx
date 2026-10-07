'use client';

import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  Key,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '@/types';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'preferences' | 'ai'>('resume');
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [newSkill, setNewSkill] = useState('');
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!formData.extractedSkills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        extractedSkills: [...formData.extractedSkills, newSkill.trim()]
      });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      extractedSkills: formData.extractedSkills.filter((s) => s !== skill)
    });
  };

  const handleAddRole = () => {
    if (!newRole.trim()) return;
    if (!formData.targetRoles.includes(newRole.trim())) {
      setFormData({
        ...formData,
        targetRoles: [...formData.targetRoles, newRole.trim()]
      });
    }
    setNewRole('');
  };

  const handleRemoveRole = (role: string) => {
    setFormData({
      ...formData,
      targetRoles: formData.targetRoles.filter((r) => r !== role)
    });
  };

  const handleAutoExtractSkills = () => {
    const dictionary = [
      'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust',
      'PostgreSQL', 'SQL', 'MongoDB', 'Redis', 'Tailwind CSS', 'Tailwind', 'GraphQL',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'Linux', 'REST API',
      'OpenAI', 'LLM', 'AI', 'Machine Learning', 'FastAPI', 'Express', 'Prisma', 'Supabase'
    ];

    const currentSkills = new Set(formData.extractedSkills);
    const resume = formData.resumeText;

    for (const skill of dictionary) {
      const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(resume)) {
        currentSkills.add(skill);
      }
    }

    setFormData({
      ...formData,
      extractedSkills: Array.from(currentSkills)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span>Candidate Profile &amp; Search Rules</span>
          </DialogTitle>
          <DialogDescription>
            Configure background credentials, target roles, Indian tech hubs, and AI decision parameters.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Controls */}
        <div className="px-6 pt-2 border-b border-border bg-card">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
            <TabsList>
              <TabsTrigger value="resume" className="gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Resume &amp; Skills</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>AI Guidance</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'resume' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Daksh Jain"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Email / Contact</label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="dakshjain080@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Professional Headline</label>
                <Input
                  type="text"
                  value={formData.headline || ''}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="AI &amp; Full-Stack Engineer | Production LLM Agents, MCP"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-foreground">
                    Resume / Experience Text
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoExtractSkills}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Auto-Extract Skills</span>
                  </button>
                </div>
                <Textarea
                  rows={8}
                  value={formData.resumeText}
                  onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Paste your resume or project highlights..."
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  The AI Decision Engine references this text to compute exact role match scores and write tailored cold pitches.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-5">
              {/* Target Roles */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Target Roles &amp; Titles
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                    placeholder="e.g. Founding Engineer, AI Engineer"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddRole}
                    className="px-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.targetRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="gap-1 py-1">
                      <span>{role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Core Skills */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Core Skills &amp; Technologies
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="e.g. Next.js, Python, PostgreSQL"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSkill}
                    className="px-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-muted/30 rounded-lg border border-border">
                  {formData.extractedSkills.map((skill) => (
                    <Badge key={skill} variant="mono" className="gap-1">
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experience Level & Early Career Guardrails */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Experience Level &amp; Seniority Target</label>
                  <span className="text-[11px] text-muted-foreground font-medium">Early-Career Guardrails Active</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'FRESHER', label: 'Fresher (<1 yr)', desc: 'New Grad / Intern' },
                    { id: 'JUNIOR', label: 'Junior (1-2 yrs)', desc: 'Early Career' },
                    { id: 'MID', label: 'Mid-Level', desc: '2-5 yrs exp' },
                    { id: 'SENIOR', label: 'Senior', desc: '5+ yrs exp' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          experienceLevel: lvl.id as any,
                          experienceYears: lvl.id === 'FRESHER' ? 1 : lvl.id === 'JUNIOR' ? 2 : 4
                        })
                      }
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        formData.experienceLevel === lvl.id
                          ? 'bg-secondary border-border text-foreground font-semibold shadow-sm'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="text-xs font-semibold">{lvl.label}</div>
                      <div className="text-[10px] text-muted-foreground">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Selecting <strong>Fresher</strong> or <strong>Junior</strong> automatically penalizes Staff, Principal, and 3+ YOE roles while prioritizing early-career positions.
                </p>
              </div>

              {/* Indian Tech Hubs Preference */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  🇮🇳 Preferred Indian Tech Hubs &amp; Locations
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Bangalore',
                    'Hyderabad',
                    'Pune',
                    'Mumbai',
                    'Gurgaon / Noida',
                    'Remote'
                  ].map((city) => {
                    const currentCities = formData.preferredCities || [];
                    const isSelected = currentCities.includes(city);
                    return (
                      <Button
                        key={city}
                        type="button"
                        variant={isSelected ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const updated = isSelected
                            ? currentCities.filter((c) => c !== city)
                            : [...currentCities, city];
                          setFormData({ ...formData, preferredCities: updated });
                        }}
                        className="h-8"
                      >
                        {city}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Target Ecosystems */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Target Ecosystems
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Top Indian AI Startups',
                    'YC AI Startups',
                    'a16z AI Portfolio'
                  ].map((eco) => {
                    const currentEco = formData.ecosystemFocus || [];
                    const isSelected = currentEco.includes(eco);
                    return (
                      <Button
                        key={eco}
                        type="button"
                        variant={isSelected ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const updated = isSelected
                            ? currentEco.filter((e) => e !== eco)
                            : [...currentEco, eco];
                          setFormData({ ...formData, ecosystemFocus: updated });
                        }}
                        className="h-8"
                      >
                        {eco}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Location & Remote */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Location Preference (Text)
                  </label>
                  <Input
                    type="text"
                    value={formData.locationPreference}
                    onChange={(e) => setFormData({ ...formData, locationPreference: e.target.value })}
                    placeholder="e.g. Bangalore, Hyderabad, Pune, Mumbai, Remote"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-start sm:gap-4 pt-6">
                  <label className="text-xs font-medium text-foreground">Remote Roles Only</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, remoteOnly: !formData.remoteOnly })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      formData.remoteOnly ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        formData.remoteOnly ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-muted-foreground'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sliders: Min Match Score & Min Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-foreground">Min Match Score</label>
                    <span className="text-xs font-mono font-semibold text-foreground">{formData.minMatchScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="5"
                    value={formData.minMatchScore}
                    onChange={(e) =>
                      setFormData({ ...formData, minMatchScore: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Minimum Target Salary ($ USD)
                  </label>
                  <Input
                    type="number"
                    step="5000"
                    value={formData.minSalary || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minSalary: e.target.value ? parseInt(e.target.value, 10) : undefined
                      })
                    }
                    placeholder="e.g. 120000"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Custom Decision Guidelines
                </label>
                <Textarea
                  rows={4}
                  value={formData.customPromptInstructions || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, customPromptInstructions: e.target.value })
                  }
                  placeholder="e.g. Prioritize early stage startups, seed to series B. Avoid enterprise consulting agencies. Favor AI-forward products."
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Injected directly into the Decision Engine to tailor ranking logic to your career priorities.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">OpenRouter API Key</span>
                  </div>
                  <Badge variant="mono">Free Models Supported</Badge>
                </div>

                <Input
                  type="password"
                  value={formData.openRouterApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, openRouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="font-mono"
                />

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  <span>
                    <strong>Zero-Cost Guarantee:</strong> Uses free OpenRouter models (
                    <code className="text-foreground font-mono">gemini-2.0-flash-exp:free</code>,{' '}
                    <code className="text-foreground font-mono">llama-3.3-70b-instruct:free</code>).
                    If left blank, the system automatically uses the high-speed offline heuristic matcher!
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Profile preferences saved!
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Auto-saved to local persistence</span>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={saving}
                className="shadow-sm"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
