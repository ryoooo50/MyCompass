'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { UserSettings } from '@/types'

interface SettingsFormProps {
  initialSettings: UserSettings | null
  userId: string
  onSaved: (updated: UserSettings) => void
}

export function SettingsForm({ initialSettings, userId, onSaved }: SettingsFormProps) {
  const [obsidianVaultName, setObsidianVaultName] = useState(
    initialSettings?.obsidianVaultName ?? ''
  )
  const [notionHomeUrl, setNotionHomeUrl] = useState(
    initialSettings?.notionHomeUrl ?? ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    const vaultName = obsidianVaultName.trim() || null
    const notionUrl = notionHomeUrl.trim() || null

    const { data, error: upsertError } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          obsidian_vault_name: vaultName,
          notion_home_url: notionUrl,
          custom_apps: initialSettings?.customApps ?? [],
          calendar_ids: initialSettings?.calendarIds ?? [],
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (upsertError || !data) {
      setError('設定の保存に失敗しました')
    } else {
      const updated: UserSettings = {
        id: data.id as string,
        userId: data.user_id as string,
        obsidianVaultName: data.obsidian_vault_name as string | null,
        notionHomeUrl: data.notion_home_url as string | null,
        customApps: (data.custom_apps ?? []) as UserSettings['customApps'],
        calendarIds: (data.calendar_ids ?? []) as string[],
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      }
      onSaved(updated)
    }

    setSaving(false)
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="space-y-3">
        <div>
          <label className="label-eyebrow text-muted block mb-1" htmlFor="obsidian-vault">
            Obsidian Vault 名
          </label>
          <input
            id="obsidian-vault"
            type="text"
            placeholder="例: MyNotes"
            value={obsidianVaultName}
            onChange={e => setObsidianVaultName(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue"
          />
          <p className="text-xs text-muted mt-1">
            Obsidian アプリに登録している Vault の名前を入力してください
          </p>
        </div>

        <div>
          <label className="label-eyebrow text-muted block mb-1" htmlFor="notion-url">
            Notion ホーム URL
          </label>
          <input
            id="notion-url"
            type="url"
            placeholder="例: https://www.notion.so/myworkspace"
            value={notionHomeUrl}
            onChange={e => setNotionHomeUrl(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue"
          />
        </div>
      </div>

      {error && <p className="text-xs text-mc-red">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-mc-blue text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? '保存中…' : '設定を保存'}
      </button>
    </div>
  )
}
