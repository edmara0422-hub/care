'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCareStore, SleepLog } from '@/lib/store'

const QUALITY_LABELS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Ótimo']
const QUALITY_COLORS = ['', '#FF4466', '#FF7A00', '#FFB800', '#7BF8C4', '#00D4A0']
const QUALITY_EMOJI  = ['', '😫', '😕', '😐', '😊', '✨']

export default function SleepPage() {
  const router = useRouter()
  const { sleepLogs, addSleepLog, updateSleepLog, checkIns } = useCareStore()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [quality, setQuality] = useState<1|2|3|4|5>(3)
  const [hours, setHours] = useState(7)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const hasToday = sleepLogs.some(l => l.date === today)

  function openNew() {
    setEditingId(null); setQuality(3); setHours(7); setNote(''); setShowForm(true)
  }

  function openEdit(log: SleepLog) {
    setEditingId(log.id); setQuality(log.quality); setHours(log.hours)
    setNote(log.notes ?? ''); setShowForm(true)
  }

  function submit() {
    if (editingId) {
      updateSleepLog(editingId, { quality, hours, notes: note.trim() || undefined })
    } else {
      addSleepLog({ date: today, quality, hours, notes: note.trim() || undefined })
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowForm(false); setNote(''); setEditingId(null) }, 1800)
  }

  // Correlation: match sleep logs with next-day check-in score
  const correlation = useMemo(() => {
    return sleepLogs.slice(0, 14).map(log => {
      const nextDay = new Date(log.date)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextStr = nextDay.toISOString().slice(0, 10)
      const dayCheckIns = checkIns.filter(c => new Date(c.timestamp).toISOString().slice(0, 10) === nextStr)
      const avgScore = dayCheckIns.length
        ? Math.round(dayCheckIns.reduce((s, c) => s + c.score, 0) / dayCheckIns.length)
        : null
      return { ...log, nextDayScore: avgScore }
    })
  }, [sleepLogs, checkIns])

  // Weekly averages
  const weekAvg = useMemo(() => {
    const last7 = sleepLogs.slice(0, 7)
    if (!last7.length) return null
    return {
      quality: (last7.reduce((s, l) => s + l.quality, 0) / last7.length).toFixed(1),
      hours: (last7.reduce((s, l) => s + l.hours, 0) / last7.length).toFixed(1),
    }
  }, [sleepLogs])

  return (
    <div className="min-h-screen pb-32" style={{ color: '#fff' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold">Sono</h1>
            <p className="text-xs" style={{ color: '#666' }}>Monitore seu descanso</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={openNew}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(58,134,255,0.15)', color: '#3A86FF' }}
        >
          + Registrar
        </motion.button>
      </div>

      <div className="px-5 space-y-5">

        {/* Weekly summary */}
        {weekAvg && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5"
            style={{ background: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.15)' }}
          >
            <p className="text-xs mb-3" style={{ color: '#3A86FF' }}>Média dos últimos 7 dias</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-light">{weekAvg.hours}h</p>
                <p className="text-xs mt-1" style={{ color: '#555' }}>horas por noite</p>
              </div>
              <div>
                <p className="text-3xl font-light" style={{ color: QUALITY_COLORS[Math.round(parseFloat(weekAvg.quality))] }}>
                  {weekAvg.quality}
                </p>
                <p className="text-xs mt-1" style={{ color: '#555' }}>qualidade média /5</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Correlation insight */}
        {correlation.filter(l => l.nextDayScore !== null).length >= 3 && (
          <CorrelationInsight data={correlation} />
        )}

        {/* Empty state */}
        {sleepLogs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-5xl mb-4">🌙</div>
            <p className="font-medium mb-2">Nenhum registro ainda</p>
            <p className="text-sm" style={{ color: '#555' }}>Registre seu sono e descubra como ele afeta seu humor</p>
          </motion.div>
        )}

        {/* Sleep log list */}
        {sleepLogs.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: '#444' }}>Histórico</h2>
            <div className="space-y-3">
              {sleepLogs.map((log, i) => (
                <SleepCard key={log.id} log={log} index={i} onEdit={openEdit} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Log form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-end justify-center z-50 p-5"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: '#0e0e0e', border: '1px solid rgba(58,134,255,0.2)' }}
            >
              <h3 className="text-lg font-semibold mb-1">{editingId ? 'Editar registro' : 'Como foi seu sono?'}</h3>
              <p className="text-xs mb-6" style={{ color: '#555' }}>
                {editingId
                  ? 'Atualizando registro anterior'
                  : hasToday ? 'Atualizando registro de hoje' : 'Noite de ' + formatDate(today)}
              </p>

              {/* Quality */}
              <div className="mb-6">
                <p className="text-xs mb-3" style={{ color: '#888' }}>Qualidade</p>
                <div className="flex gap-2 justify-between">
                  {([1, 2, 3, 4, 5] as const).map(q => (
                    <motion.button key={q} whileTap={{ scale: 0.88 }}
                      onClick={() => setQuality(q)}
                      className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1"
                      style={{
                        background: quality === q ? `${QUALITY_COLORS[q]}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${quality === q ? QUALITY_COLORS[q] : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <span className="text-xl">{QUALITY_EMOJI[q]}</span>
                      <span className="text-[10px]" style={{ color: quality === q ? QUALITY_COLORS[q] : '#555' }}>{q}</span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-center mt-2" style={{ color: QUALITY_COLORS[quality] }}>
                  {QUALITY_LABELS[quality]}
                </p>
              </div>

              {/* Hours */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs" style={{ color: '#888' }}>Horas de sono</p>
                  <span className="text-2xl font-light" style={{ color: '#3A86FF' }}>{hours}h</span>
                </div>
                <input
                  type="range" min={1} max={12} step={0.5}
                  value={hours}
                  onChange={e => setHours(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#3A86FF' }}
                />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: '#444' }}>
                  <span>1h</span><span>6h</span><span>12h</span>
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <p className="text-xs mb-2" style={{ color: '#888' }}>Observação (opcional)</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Pesadelos, acordei cedo, ambiente..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={submit}
                className="w-full py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: saved ? '#00D4A0' : '#3A86FF', color: '#fff' }}
              >
                {saved ? '✓ Registrado!' : 'Salvar'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SleepCard({ log, index, onEdit }: { log: SleepLog; index: number; onEdit: (log: SleepLog) => void }) {
  const qColor = QUALITY_COLORS[log.quality]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
        style={{ background: `${qColor}18` }}>
        {QUALITY_EMOJI[log.quality]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{formatDate(log.date)}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${qColor}18`, color: qColor }}>
              {QUALITY_LABELS[log.quality]}
            </span>
            <button
              onClick={() => onEdit(log)}
              className="w-6 h-6 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={2} strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs" style={{ color: '#3A86FF' }}>{log.hours}h</span>
          <div className="flex gap-0.5">
            {([1,2,3,4,5] as const).map(q => (
              <div key={q} className="w-3 h-1 rounded-full"
                style={{ background: q <= log.quality ? qColor : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
          {log.notes && <p className="text-xs truncate" style={{ color: '#444' }}>{log.notes}</p>}
        </div>
      </div>
    </motion.div>
  )
}

function CorrelationInsight({ data }: { data: (SleepLog & { nextDayScore: number | null })[] }) {
  const valid = data.filter(d => d.nextDayScore !== null)
  const goodSleep = valid.filter(d => d.quality >= 4)
  const poorSleep = valid.filter(d => d.quality <= 2)

  if (!goodSleep.length && !poorSleep.length) return null

  const avgGood = goodSleep.length
    ? Math.round(goodSleep.reduce((s, d) => s + (d.nextDayScore ?? 0), 0) / goodSleep.length)
    : null
  const avgPoor = poorSleep.length
    ? Math.round(poorSleep.reduce((s, d) => s + (d.nextDayScore ?? 0), 0) / poorSleep.length)
    : null

  if (!avgGood && !avgPoor) return null
  if (avgGood === avgPoor) return null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5"
      style={{ background: 'rgba(0,212,160,0.05)', border: '1px solid rgba(0,212,160,0.15)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span>🔗</span>
        <p className="text-xs font-semibold" style={{ color: '#00D4A0' }}>Correlação sono × humor</p>
      </div>
      <p className="text-sm" style={{ color: '#aaa' }}>
        {avgGood && avgPoor
          ? `Após noites boas (≥4/5), seu score médio foi ${avgGood}. Após noites ruins (≤2/5), foi ${avgPoor}.`
          : avgGood
          ? `Após noites boas (≥4/5), seu score médio no dia seguinte foi ${avgGood}.`
          : `Após noites difíceis (≤2/5), seu score médio foi apenas ${avgPoor}.`
        }
      </p>
      {avgGood && avgPoor && (
        <div className="mt-3 flex gap-3">
          <div className="flex-1 text-center py-2 rounded-xl" style={{ background: 'rgba(0,212,160,0.1)' }}>
            <p className="text-xl font-light" style={{ color: '#00D4A0' }}>{avgGood}</p>
            <p className="text-[10px]" style={{ color: '#555' }}>sono bom</p>
          </div>
          <div className="flex-1 text-center py-2 rounded-xl" style={{ background: 'rgba(255,68,102,0.1)' }}>
            <p className="text-xl font-light" style={{ color: '#FF4466' }}>{avgPoor}</p>
            <p className="text-[10px]" style={{ color: '#555' }}>sono ruim</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}
