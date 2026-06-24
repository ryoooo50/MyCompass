'use client'

import { useState } from 'react'
import type { ResearchPhase, ResearchMilestone } from '@/types'
import { PhaseCard } from './PhaseCard'
import { MilestoneList } from './MilestoneList'
import { Toast } from '@/components/ui/Toast'

interface ResearchPageProps {
  phases: ResearchPhase[]
  milestones: ResearchMilestone[]
  userId: string
  obsidianVaultName: string | null
}

export function ResearchPage({ phases, milestones, userId, obsidianVaultName }: ResearchPageProps) {
  const [localPhases, setLocalPhases] = useState<ResearchPhase[]>(phases)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const handlePhaseUpdate = (id: string, progress: number) => {
    setLocalPhases(prev => prev.map(p => p.id === id ? { ...p, progress } : p))
  }

  const handleError = (message: string) => {
    setToast({ message, type: 'error' })
  }

  const overallProgress =
    localPhases.length > 0
      ? Math.round(localPhases.reduce((sum, p) => sum + p.progress, 0) / localPhases.length)
      : 0

  const sorted = [...localPhases].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-heading text-navy">研究プロジェクト</h1>
          <p className="text-sm text-muted mt-1">
            全体進捗:{' '}
            <span className="font-bold text-mc-green">{overallProgress}%</span>
          </p>
        </div>

        {/* Obsidian link */}
        <div className="flex-shrink-0">
          {obsidianVaultName ? (
            <a
              href={`obsidian://open?vault=${encodeURIComponent(obsidianVaultName)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-paper border border-line rounded-lg text-sm text-ink hover:border-navy hover:text-navy transition-colors shadow-card"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2C5.24 2 3 4.24 3 7c0 1.86.99 3.49 2.47 4.38L8 14l2.53-2.62A4.98 4.98 0 0 0 13 7c0-2.76-2.24-5-5-5z" fill="#7c3aed" opacity=".8" />
                <circle cx="8" cy="7" r="1.5" fill="white" />
              </svg>
              Obsidian を開く
            </a>
          ) : (
            <p className="text-xs text-muted bg-paper border border-line rounded-lg px-3 py-2">
              設定 → アプリランチャーで Vault 名を設定すると
              <br />
              Obsidian へのリンクが表示されます
            </p>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="label-eyebrow text-muted">全体進捗</span>
          <span className="metric-value text-mc-green text-2xl">{overallProgress}%</span>
        </div>
        <div className="relative h-3 bg-line rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-mc-green rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`全体進捗 ${overallProgress}%`}
          />
        </div>
      </div>

      {/* Phase cards */}
      <section aria-label="研究フェーズ">
        <h2 className="label-eyebrow text-muted mb-3">研究フェーズ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              onUpdate={handlePhaseUpdate}
              onError={handleError}
            />
          ))}
        </div>
      </section>

      {/* Milestones */}
      <section aria-label="マイルストーン">
        <MilestoneList initial={milestones} userId={userId} />
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
