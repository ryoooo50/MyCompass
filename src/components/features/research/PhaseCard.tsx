'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { ResearchPhase } from '@/types'

interface PhaseCardProps {
  phase: ResearchPhase
  onUpdate: (id: string, progress: number) => void
  onError: (message: string) => void
}

export function PhaseCard({ phase, onUpdate, onError }: PhaseCardProps) {
  const [localProgress, setLocalProgress] = useState(phase.progress)
  const [saving, setSaving] = useState(false)
  const lastSaved = useRef(phase.progress)
  const supabase = createClient()

  const save = async (value: number) => {
    if (value === lastSaved.current) return
    setSaving(true)
    const { error } = await supabase
      .from('research_phases')
      .update({ progress: value })
      .eq('id', phase.id)

    if (error) {
      setLocalProgress(lastSaved.current)
      onError('進捗の保存に失敗しました')
    } else {
      lastSaved.current = value
      onUpdate(phase.id, value)
    }
    setSaving(false)
  }

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProgress(Number(e.target.value))
  }

  const handleCommit = () => {
    save(localProgress)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value)
    const clamped = Math.max(0, Math.min(100, raw))
    setLocalProgress(clamped)
  }

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="card-title text-ink">{phase.phaseName}</h3>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={100}
            value={localProgress}
            onChange={handleNumberChange}
            onBlur={handleCommit}
            onKeyDown={handleNumberKeyDown}
            aria-label={`${phase.phaseName}の進捗`}
            className="w-14 text-right text-sm font-bold text-mc-green border border-line rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-mc-green"
          />
          <span className="text-sm text-muted">%</span>
          {saving && <span className="text-[10px] text-muted ml-1">保存中…</span>}
        </div>
      </div>

      <div className="relative h-2 bg-line rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-mc-green rounded-full transition-all duration-300"
          style={{ width: `${localProgress}%` }}
          role="progressbar"
          aria-valuenow={localProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${phase.phaseName} ${localProgress}%`}
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={localProgress}
        onChange={handleRangeChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        aria-label={`${phase.phaseName}の進捗スライダー`}
        className="w-full h-1.5 appearance-none bg-transparent cursor-pointer accent-mc-green"
      />
    </div>
  )
}
