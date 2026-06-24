'use client'

import { useEffect, useState } from 'react'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationSettings() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)
  }, [])

  const handleEnable = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatusMessage('このブラウザはプッシュ通知に対応していません。')
      return
    }

    setLoading(true)
    setStatusMessage(null)

    try {
      const result = await Notification.requestPermission()
      setPermission(result as PermissionState)

      if (result !== 'granted') {
        setStatusMessage('通知の許可が得られませんでした。ブラウザの設定を確認してください。')
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setStatusMessage('VAPID公開鍵が設定されていません。')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!response.ok) {
        throw new Error('サブスクリプションの保存に失敗しました。')
      }

      setStatusMessage('通知を有効にしました。')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '予期しないエラーが発生しました。'
      setStatusMessage(message)
    } finally {
      setLoading(false)
    }
  }

  if (permission === 'unsupported') {
    return (
      <div className="bg-paper rounded-card shadow-card p-4">
        <p className="text-muted text-sm">このブラウザはプッシュ通知に対応していません。</p>
      </div>
    )
  }

  return (
    <div className="bg-paper rounded-card shadow-card p-4 space-y-3">
      <h3 className="font-semibold text-ink text-sm">プッシュ通知</h3>

      {permission === 'granted' ? (
        <div className="flex items-center gap-2 text-mc-green text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          通知は有効です
        </div>
      ) : permission === 'denied' ? (
        <p className="text-muted text-sm">
          通知はブロックされています。ブラウザのサイト設定から許可を変更してください。
        </p>
      ) : (
        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full bg-navy text-white py-2 rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '設定中...' : '通知を有効にする'}
        </button>
      )}

      {statusMessage && (
        <p className="text-xs text-muted">{statusMessage}</p>
      )}
    </div>
  )
}
