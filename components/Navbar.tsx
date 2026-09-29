'use client'

import Link from "next/link";
import Image from "next/image"; // 👈 1. Ajouter cet import
import { signOut } from "@/lib/actions/auth";

interface NavbarProps {
  userEmail?: string;
  firstName?: string;
  role?: string;
}

export default function Navbar({ userEmail, firstName, role }: NavbarProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO & TITRE */}
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* 👈 2. Ajouter l'image du logo */}
          <Image 
            src="/logo.jpg" 
            alt="Logo APE Marcel Béné" 
            width={40} 
            height={40} 
            className="h-10 w-auto object-contain"
            priority
          />
          <div>
            <span className="font-bold text-gray-900 text-lg leading-tight block">
              APE Marcel Béné
            </span>
            <span className="text-[10px] text-purple-700 font-semibold uppercase tracking-wider block">
              Muizon
            </span>
          </div>
        </Link>

        {/* LIENS DE NAVIGATION (Dashboard, Événements, Boutique...) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/dashboard" className="hover:text-purple-700 transition">
            Tableau de bord
          </Link>
          <Link href="/events" className="hover:text-purple-700 transition">
            Événements
          </Link>
          <Link href="/shop" className="hover:text-purple-700 transition">
            Boutique
          </Link>
          <Link href="/membership" className="hover:text-purple-700 transition">
            Adhésion
          </Link>
          {role && role !== "parent" && (
            <Link href="/admin" className="text-purple-700 font-semibold hover:underline">
              Espace Bureau
            </Link>
          )}
        </nav>

        {/* PROFIL & DÉCONNEXION */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-gray-900">{firstName || userEmail}</p>
            <p className="text-gray-500 capitalize">{role || "Parent"}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg border text-xs font-medium transition"
            >
              Déconnexion
            </button>
          </form>
        </div>

      </div>
    </header>
  );
}