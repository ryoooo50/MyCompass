import { ScheduleWidget } from '@/components/features/schedule/ScheduleWidget'

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <h1 className="page-heading text-navy">予定</h1>
      <div className="card p-5">
        <p className="card-title text-muted mb-4">今後 7 日間</p>
        <ScheduleWidget days={7} />
      </div>
    </div>
  )
}
