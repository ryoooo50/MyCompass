'use client'

import { useState } from 'react'
import type { DailyReport } from '@/types'
import { ReportEditor } from './ReportEditor'
import { ReportList } from './ReportList'

interface ReportsViewProps {
  todayDate: string
  todayReport: DailyReport | null
  pastReports: DailyReport[]
  userId: string
}

export function ReportsView({ todayDate, todayReport, pastReports, userId }: ReportsViewProps) {
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [editorKey, setEditorKey] = useState(0)
  const [currentInitialReport, setCurrentInitialReport] = useState<DailyReport | null>(todayReport)

  const handleSelectFromList = (date: string) => {
    const found = pastReports.find((r) => r.reportDate === date) ?? null
    setCurrentInitialReport(found)
    setSelectedDate(date)
    // Force re-mount to reset editor state cleanly
    setEditorKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <h1 className="page-heading text-navy">日報</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ReportEditor
          key={editorKey}
          todayDate={todayDate}
          initialSelectedDate={selectedDate}
          initialReport={currentInitialReport}
          userId={userId}
        />

        <ReportList
          initial={pastReports}
          onSelect={handleSelectFromList}
        />
      </div>
    </div>
  )
}
