'use client'

import { useState, useEffect } from 'react'

const holidayEvents = [
  { name: 'Vacances de la Toussaint 🎃', date: '2026-10-17T00:00:00' },
  { name: 'Vacances de Noël 🎄', date: '2026-12-19T00:00:00' },
  { name: 'Jour de l\'An 🎆', date: '2027-01-01T00:00:00' },
  { name: 'Vacances d\'hiver ⛷️', date: '2027-02-20T00:00:00' },
  { name: 'Pâques 🍫', date: '2027-03-28T00:00:00' },
  { name: 'Vacances de printemps 🌸', date: '2027-04-24T00:00:00' },
  { name: 'Grandes Vacances d\'été ☀️', date: '2027-07-03T00:00:00' },
]

export default function HolidayCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [currentEvent, setCurrentEvent] = useState<any>(null)

  useEffect(() => {
    const now = new Date().getTime()
    const upcoming = holidayEvents.find(e => new Date(e.date).getTime() > now) || holidayEvents[0]
    setCurrentEvent(upcoming)

    const timer = setInterval(() => {
      const target = new Date(upcoming.date).getTime()
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
  }, [])

  if (!currentEvent) return null

  return (
    <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <span className="text-xs uppercase tracking-wider font-semibold text-purple-200">Prochain rendez-vous</span>
        <h3 className="text-lg font-bold">{currentEvent.name}</h3>
      </div>

      <div className="flex items-center gap-2 text-center">
        <div className="bg-white/15 px-3 py-2 rounded-xl border border-white/20 min-w-[50px]">
          <span className="block text-lg font-extrabold">{timeLeft.days}</span>
          <span className="text-[9px] text-purple-200 uppercase">Jours</span>
        </div>
        <div className="bg-white/15 px-3 py-2 rounded-xl border border-white/20 min-w-[50px]">
          <span className="block text-lg font-extrabold">{timeLeft.hours}</span>
          <span className="text-[9px] text-purple-200 uppercase">Heures</span>
        </div>
        <div className="bg-white/15 px-3 py-2 rounded-xl border border-white/20 min-w-[50px]">
          <span className="block text-lg font-extrabold">{timeLeft.minutes}</span>
          <span className="text-[9px] text-purple-200 uppercase">Min</span>
        </div>
        <div className="bg-white/15 px-3 py-2 rounded-xl border border-white/20 min-w-[50px]">
          <span className="block text-lg font-extrabold">{timeLeft.seconds}</span>
          <span className="text-[9px] text-purple-200 uppercase">Sec</span>
        </div>
      </div>
    </div>
  )
}