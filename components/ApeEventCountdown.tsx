'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ApeEventCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [nextEvent, setNextEvent] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchNextEvent() {
      const now = new Date().toISOString()
      // Récupérer le prochain événement futur depuis Supabase
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(1)

      if (data && data.length > 0) {
        setNextEvent(data[0])
      }
    }

    fetchNextEvent()
  }, [])

  useEffect(() => {
    if (!nextEvent) return

    const timer = setInterval(() => {
      const target = new Date(nextEvent.event_date).getTime()
      const diff = target - new Date().getTime()

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [nextEvent])

  if (!nextEvent) return null

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200">Prochain événement APE</span>
        <h3 className="text-lg font-bold">🎉 {nextEvent.title}</h3>
        {nextEvent.location && <p className="text-xs text-emerald-100">📍 {nextEvent.location}</p>}
      </div>

      <div className="flex items-center gap-2 text-center">
        <div className="bg-white/15 px-3 py-2 rounded-xl border border-white/20 min-w-[50px]">
          <span className="block text-lg font-extrabold">{timeLeft.days}</span>
          <span className="text-[9px] text-emerald-200 uppercase">Jours</span>
        </div>
        <div className="bg-white/15 px-3 py-2 rounded-xl border border-white/20 min-w-[50px]">
          <span className="block text-lg font-extrabold">{timeLeft.hours}</span>
          <span className="text-[9px] text-emerald-200 uppercase">Heures</span>
        </div>
        <div className="bg-white/15 px-3 py-2 rounded-xl border border-white/20 min-w-[50px]">
          <span className="block text-lg font-extrabold">{timeLeft.minutes}</span>
          <span className="text-[9px] text-emerald-200 uppercase">Min</span>
        </div>
        <div className="bg-white/15 px-3 py-2 rounded-xl border border-white/20 min-w-[50px]">
          <span className="block text-lg font-extrabold">{timeLeft.seconds}</span>
          <span className="text-[9px] text-emerald-200 uppercase">Sec</span>
        </div>
      </div>
    </div>
  )
}