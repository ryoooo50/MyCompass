'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { UserSettings, CustomApp } from '@/types'
import { Toast } from '@/components/ui/Toast'
import { SettingsForm } from './SettingsForm'
import { NotionSync } from './NotionSync'

interface AppLauncherProps {
  initialSettings: UserSettings | null
  userId: string
}

function isValidAppUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return ['https:', 'http:', 'obsidian:'].includes(u.protocol)
  } catch {
    return false
  }
}

interface FixedApp {
  label: string
  emoji: string
  href: string | null
  disabled: boolean
}

export function AppLauncher({ initialSettings, userId }: AppLauncherProps) {
  const [settings, setSettings] = useState<UserSettings | null>(initialSettings)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const customApps: CustomApp[] = settings?.customApps ?? []

  const fixedApps: FixedApp[] = [
    {
      label: 'Obsidian',
      emoji: '📓',
      href: settings?.obsidianVaultName
        ? `obsidian://open?vault=${encodeURIComponent(settings.obsidianVaultName)}`
        : null,
      disabled: !settings?.obsidianVaultName,
    },
    {
      label: 'Notion',
      emoji: '🗒️',
      href: settings?.notionHomeUrl ?? null,
      disabled: !settings?.notionHomeUrl,
    },
    {
      label: 'Google Calendar',
      emoji: '📅',
      href: 'https://calendar.google.com',
      disabled: false,
    },
    {
      label: 'Google Drive',
      emoji: '💾',
      href: 'https://drive.google.com',
      disabled: false,
    },
    {
      label: 'GitHub',
      emoji: '🐙',
      href: 'https://github.com',
      disabled: false,
    },
  ]

  const handleAddApp = async () => {
    setAddError(null)
    const label = newLabel.trim()
    const url = newUrl.trim()

    if (!label) {
      setAddError('ラベルを入力してください')
      return
    }
    if (!url) {
      setAddError('URLを入力してください')
      return
    }
    if (!isValidAppUrl(url)) {
      setAddError('https:// / http:// / obsidian:// のURLを入力してください')
      return
    }

    setSaving(true)
    const newApp: CustomApp = { label, url }
    const updatedApps = [...customApps, newApp]

    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        obsidian_vault_name: settings?.obsidianVaultName ?? null,
        notion_home_url: settings?.notionHomeUrl ?? null,
        custom_apps: updatedApps,
        calendar_ids: settings?.calendarIds ?? [],
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      setToast({ message: 'アプリの追加に失敗しました', type: 'error' })
    } else {
      setSettings(prev =>
        prev
          ? { ...prev, customApps: updatedApps }
          : {
              id: '',
              userId,
              obsidianVaultName: null,
              notionHomeUrl: null,
              customApps: updatedApps,
              calendarIds: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
      )
      setNewLabel('')
      setNewUrl('')
    }
    setSaving(false)
  }

  const handleRemoveApp = async (index: number) => {
    setSaving(true)
    const updatedApps = customApps.filter((_, i) => i !== index)

    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        obsidian_vault_name: settings?.obsidianVaultName ?? null,
        notion_home_url: settings?.notionHomeUrl ?? null,
        custom_apps: updatedApps,
        calendar_ids: settings?.calendarIds ?? [],
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      setToast({ message: 'アプリの削除に失敗しました', type: 'error' })
    } else {
      setSettings(prev => prev ? { ...prev, customApps: updatedApps } : prev)
    }
    setSaving(false)
  }

  const handleSettingsSaved = (updated: UserSettings) => {
    setSettings(updated)
    setToast({ message: '設定を保存しました', type: 'success' })
  }

  return (
    <div className="space-y-8">
      <h1 className="page-heading text-navy">アプリランチャー</h1>

      {/* 固定アプリ */}
      <section>
        <p className="label-eyebrow text-muted mb-3">固定アプリ</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {fixedApps.map(app => {
            const baseClass =
              'card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow cursor-pointer'
            if (app.disabled || !app.href) {
              return (
                <div
                  key={app.label}
                  className={`${baseClass} opacity-40 cursor-not-allowed`}
                  title={`${app.label}（設定が必要です）`}
                >
                  <span className="text-3xl" role="img" aria-label={app.label}>
                    {app.emoji}
                  </span>
                  <span className="text-xs font-semibold text-muted text-center leading-tight">
                    {app.label}
                  </span>
                </div>
              )
            }
            return (
              <a
                key={app.label}
                href={app.href}
                target="_blank"
                rel="noreferrer noopener"
                className={baseClass}
              >
                <span className="text-3xl" role="img" aria-label={app.label}>
                  {app.emoji}
                </span>
                <span className="text-xs font-semibold text-ink text-center leading-tight">
                  {app.label}
                </span>
              </a>
            )
          })}
        </div>
      </section>

      {/* カスタムアプリ */}
      <section>
        <p className="label-eyebrow text-muted mb-3">カスタムアプリ</p>
        <div className="space-y-3">
          {customApps.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {customApps.map((app, i) => (
                <div
                  key={`${app.label}-${i}`}
                  className="relative group card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                >
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex flex-col items-center gap-2 w-full"
                  >
                    <span className="text-3xl" role="img" aria-label={app.label}>
                      🔗
                    </span>
                    <span className="text-xs font-semibold text-ink text-center leading-tight break-all">
                      {app.label}
                    </span>
                  </a>
                  <button
                    onClick={() => { void handleRemoveApp(i) }}
                    disabled={saving}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-line text-muted text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-mc-red hover:text-white"
                    aria-label={`${app.label}を削除`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 追加フォーム */}
          <div className="card p-4 space-y-3">
            <p className="card-title text-ink">アプリを追加</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="ラベル（例: Figma）"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue"
              />
              <input
                type="url"
                placeholder="URL（例: https://figma.com）"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue"
                onKeyDown={e => { if (e.key === 'Enter') { void handleAddApp() } }}
              />
              <button
                onClick={() => { void handleAddApp() }}
                disabled={saving}
                className="px-4 py-2 bg-mc-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                追加
              </button>
            </div>
            {addError && (
              <p className="text-xs text-mc-red">{addError}</p>
            )}
          </div>
        </div>
      </section>

      {/* Notion同期 */}
      <section>
        <p className="label-eyebrow text-muted mb-3">Notion連携</p>
        <NotionSync />
      </section>

      {/* 設定フォーム */}
      <section>
        <p className="label-eyebrow text-muted mb-3">連携設定</p>
        <SettingsForm
          initialSettings={settings}
          userId={userId}
          onSaved={handleSettingsSaved}
        />
      </section>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
