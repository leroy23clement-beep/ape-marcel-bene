'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar({ userEmail, firstName, role }: { userEmail: string; firstName?: string; role?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isBureau = role && role !== 'parent'

  const navLinks = [
    { name: 'Tableau de bord', href: '/dashboard' },
    { name: 'Événements', href: '/events' },
    { name: 'Boutique', href: '/shop' },
    { name: 'Don', href: '/membership' },
    ...(isBureau ? [{ name: 'Espace Bureau', href: '/bureau' }] : []),
  ]

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
         {/* Logo / Nom */}
<div className="flex items-center">
  <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
    <img src="/logo.jpg" alt="Logo APE" className="w-8 h-8 object-contain" />
    <span>APE Marcel Béné</span>
  </Link>
</div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-purple-700 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          {/* Profil, Rôle & Déconnexion Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-xs text-gray-700 font-medium">
                {firstName ? `Bonjour, ${firstName}` : userEmail}
              </span>
              {role && role !== 'parent' && (
                <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  {role}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
            >
              Déconnexion
            </button>
          </div>

          {/* Bouton Menu Burger Mobile */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              <span className="text-xl">{isOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Déroulant */}
      {isOpen && (
        <div className="md:hidden bg-white border-b px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b">
            <span>Connecté : <strong className="text-gray-800">{firstName || userEmail}</strong></span>
            {role && role !== 'parent' && (
              <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                {role}
              </span>
            )}
          </div>
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
          <div className="pt-2 border-t">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}