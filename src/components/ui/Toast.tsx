'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'error' | 'success'
  onClose: () => void
}

export function Toast({ message, type = 'error', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      role="alert"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg text-sm text-white shadow-lg z-50 ${
        type === 'error' ? 'bg-mc-red' : 'bg-mc-green'
      }`}
    >
      {message}
    </div>
  )
}
