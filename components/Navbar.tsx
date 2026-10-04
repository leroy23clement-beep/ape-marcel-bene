'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import EnableNotificationsButton from '@/components/EnableNotificationsButton'

export default function Navbar({ userEmail, firstName, role }: { userEmail: string; firstName?: string; role?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Vérifier si les notifications sont activées sur cet appareil
  useEffect(() => {
    const checkNotifications = () => {
      const isEnabled = localStorage.getItem('notifications_enabled') === 'true' || 
                        (typeof window !== 'undefined' && Notification && Notification.permission === 'granted')
      setNotificationsEnabled(isEnabled)
    }
    checkNotifications()
    const interval = setInterval(checkNotifications, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const getDisplayName = () => {
    if (role === 'admin') return 'Patron'
    if (role === 'tresorier') return 'Picsou'
    if (role === 'secretaire') return 'Biquette'
    return firstName || userEmail
  }

  const displayName = getDisplayName()
  const allowedBureauRoles = ['admin', 'president', 'secretaire', 'tresorier', 'bureau']
  const isBureau = role ? allowedBureauRoles.includes(role.toLowerCase()) : false

  // Liens de la barre du haut (sans émoji sur École)
  const navLinks = [
    { name: 'Accueil', href: '/dashboard' },
    { name: 'Événements', href: '/events' },
    { name: 'Boutique', href: '/shop' },
    { name: 'École', href: '/ecole' },
    { name: 'Soutenir l\'APE', href: '/membership' },
    ...(isBureau ? [{ name: 'Espace Bureau', href: '/bureau' }] : []),
  ]

  // Liens complets pour le menu déroulant de droite (avec Galerie et Découvrir l'asso)
  const menuDrawerLinks = [
    { name: 'Accueil', href: '/dashboard' },
    { name: 'Événements', href: '/events' },
    { name: 'Boutique', href: '/shop' },
    { name: 'École', href: '/ecole' },
    { name: 'Galerie', href: '/gallery' },
    { name: 'Découvrir l\'association', href: '/about' },
    { name: 'Soutenir l\'APE', href: '/membership' },
    ...(isBureau ? [{ name: 'Espace Bureau', href: '/bureau' }] : []),
  ]

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50" ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo et Nom de l'asso sur une ligne + Spécial Halloween en dessous */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-3 font-bold text-gray-900">
              <img 
                src="/logo.jpg" 
                alt="Logo APE" 
                className="w-14 h-14 object-contain rounded-lg shadow-sm border border-orange-200" 
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-base md:text-lg font-bold">
                  <span>🦇</span>
                  <span>APE Marcel Béné</span>
                  <span>🎃</span>
                </div>
                <span className="text-[11px] text-orange-600 font-semibold tracking-wide">
                  Spécial Halloween 👻
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation principale (desktop) */}
          <div className="hidden lg:flex items-center space-x-5">
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

          {/* Côté droit : Notifications, Infos utilisateur et Menu Burger (Déconnexion retirée d'ici) */}
          <div className="flex items-center space-x-3">
            {!notificationsEnabled && (
              <div className="hidden sm:block">
                <EnableNotificationsButton />
              </div>
            )}

            <div className="hidden xl:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-xs text-gray-700 font-medium">
                Bonjour, <strong className="text-gray-900">{displayName}</strong>
              </span>
              {role && role !== 'parent' && (
                <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  {role}
                </span>
              )}
            </div>

            {/* Bouton Menu Burger en haut à droite */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition shadow-sm focus:outline-none cursor-pointer"
              title="Menu"
            >
              <span className="text-lg font-bold">{isOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu déroulant latéral de droite */}
      {isOpen && (
        <div className="absolute top-20 right-4 w-72 bg-white border rounded-2xl shadow-xl px-5 py-6 space-y-4 z-50 animate-in fade-in slide-in-from-top-2">
          
          {!notificationsEnabled && (
            <div className="sm:hidden pb-3 border-b">
              <EnableNotificationsButton />
            </div>
          )}

          <div className="xl:hidden pb-3 border-b flex items-center justify-between text-xs text-gray-600">
            <span>Connecté : <strong className="text-gray-900">{displayName}</strong></span>
            {role && role !== 'parent' && (
              <span className="text-[9px] font-bold uppercase bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                {role}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2">Navigation</p>
            {menuDrawerLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          <div className="pt-3 border-t">
            <button
              onClick={handleLogout}
              className="w-full text-center px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border border-red-100 transition cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}