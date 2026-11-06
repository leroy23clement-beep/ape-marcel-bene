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
          
          {/* Logo et Nom de l'asso sur une ligne + Ambiance automnale en dessous */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-3 font-bold text-gray-900">
              <img 
                src="/logo.jpg" 
                alt="Logo APE" 
                className="w-14 h-14 object-contain rounded-lg shadow-sm border border-orange-200" 
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-base md:text-lg font-bold">
                  <span>🍂</span>
                  <span>APE Marcel Béné</span>
                  <span>🍁</span>
                </div>
                <span className="text-[11px] text-amber-600 font-semibold tracking-wide">
                  Saison d'automne 🍃
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation principale (desktop) */}
          <div className="hidden lg: