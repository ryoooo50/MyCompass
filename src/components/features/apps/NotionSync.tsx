'use client'

import { useState } from 'react'

interface SyncResult {
  added: number
  updated: number
}

interface ApiError {
  code: string
  message: string
}

type SyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: SyncResult }
  | { status: 'error'; message: string }

const NOT_CONFIGURED_CODES = [
  'NOTION_TOKEN_NOT_CONFIGURED',
  'NOTION_DATABASE_NOT_CONFIGURED',
]

const NOT_CONFIGURED_MESSAGE =
  'Notion連携を設定するにはVercel環境変数にNOTION_INTEGRATION_TOKENを設定してください'

export function NotionSync() {
  const [state, setState] = useState<SyncState>({ status: 'idle' })

  const handleSync = async () => {
    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/notion/sync', { method: 'POST' })

      if (!res.ok) {
        if (res.status === 503) {
          setState({ status: 'error', message: NOT_CONFIGURED_MESSAGE })
          return
        }

        let message = 'Notion同期に失敗しました'
        try {
          const err = (await res.json()) as ApiError
          if (NOT_CONFIGURED_CODES.includes(err.code)) {
            message = NOT_CONFIGURED_MESSAGE
          } else {
            message = err.message ?? message
          }
        } catch {
          // JSON parse failure — keep default message
        }
        setState({ status: 'error', message })
        return
      }

      const result = (await res.json()) as SyncResult
      setState({ status: 'success', result })
    } catch {
      setState({ status: 'error', message: 'Notion同期中にネットワークエラーが発生しました' })
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="card-title text-ink">Notionタスク同期</p>
          <p className="text-xs text-muted mt-0.5">
            NotionデータベースのタスクをMyCompassに同期します
          </p>
        </div>
        <button
          onClick={() => { void handleSync() }}
          disabled={state.status === 'loading'}
          className="px-4 py-2 bg-mc-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          aria-busy={state.status === 'loading'}
        >
          {state.status === 'loading' ? '同期中…' : 'Notionと同期'}
        </button>
      </div>

      {state.status === 'success' && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800"
        >
          <span aria-hidden="true">✓</span>
          <span>
            同期完了 — {state.result.added}件追加、{state.result.updated}件更新
          </span>
        </div>
      )}

      {state.status === 'error' && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
        >
          <span aria-hidden="true" className="mt-0.5 shrink-0">⚠️</span>
          <span>{state.message}</span>
        </div>
      )}
    </div>
  )
}
