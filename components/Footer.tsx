'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [isOpen, setIsOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Traitement du message (envoi par mail ou enregistrement Supabase si besoin)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setIsOpen(false)
    }, 2000)
  }

  return (
    <>
      <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-16 text-xs">
        <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Bloc 1 : Identité & Association */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              APE Marcel Béné
            </h3>
            <p className="text-gray-400">
              Association des Parents d'Élèves de l'école Marcel Béné à Muizon.
            </p>
            <p className="text-gray-400 pt-1">
              <strong className="text-gray-300">SIRET :</strong> 80881381000013<br />
              <strong className="text-gray-300">Siège social :</strong> 1 rue de la mairie, 51140 Muizon
            </p>
          </div>

          {/* Bloc 2 : Navigation rapide & Contact */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Contact & Liens
            </h3>
            <ul className="space-y-1.5">
              <li>
                <button 
                  onClick={() => setIsOpen(true)}
                  className="hover:text-white underline underline-offset-4 text-left transition cursor-pointer"
                >
                  ✉️ Nous contacter
                </button>
              </li>
              <li>
                <span className="text-gray-400">Email direct : </span>
                <a href="mailto:ape.marcelbene@gmail.com" className="hover:text-white transition">
                  ape.marcelbene@gmail.com
                </a>
              </li>
              <li>
                {/* Lien vers la page Facebook */}
                <a 
                  href="https://www.facebook.com/ape.marcelbene.9/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1 font-medium pt-1"
                >
                  🌐 Suivez-nous sur Facebook
                </a>
              </li>
            </ul>
          </div>

          {/* Bloc 3 : Mentions Légales & Pages */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Informations légales
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Association Loi 1901 à but non lucratif. Les données collectées sur ce site servent uniquement à la gestion interne de l'APE.
            </p>
            <div className="space-y-1 pt-1">
              <div>
                <Link href="/qui-sommes-nous" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium">
                  → Qui sommes-nous ?
                </Link>
              </div>
              <div>
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium">
                  → Politique de confidentialité & RGPD
                </Link>
              </div>
            </div>
            <p className="text-gray-500 text-[11px] pt-2">
              © {new Date().getFullYear()} APE Marcel Béné — Tous droits réservés.
            </p>
          </div>

        </div>
      </footer>

      {/* Modal / Pop-up "Nous contacter" */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 text-gray-900 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold">Contactez l'APE Marcel Béné</h2>
            <p className="text-xs text-gray-600">
              Une question, une suggestion ou une demande ? Envoyez-nous un message et nous vous répondrons dans les plus brefs délais.
            </p>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-lg text-center font-medium">
                ✓ Votre message a bien été envoyé ! Merci.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Votre Nom & Prénom</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full text-xs p-2.5 border rounded-lg bg-gray-50 focus:bg-white text-gray-900" 
                    placeholder="ex: Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Votre Adresse Email</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full text-xs p-2.5 border rounded-lg bg-gray-50 focus:bg-white text-gray-900" 
                    placeholder="ex: jean.dupont@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Objet</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full text-xs p-2.5 border rounded-lg bg-gray-50 focus:bg-white text-gray-900" 
                    placeholder="ex: Question sur la fête de l'école"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                  <textarea 
                    rows={4} 
                    required 
                    className="w-full text-xs p-2.5 border rounded-lg bg-gray-50 focus:bg-white text-gray-900" 
                    placeholder="Votre message..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-600 border rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-purple-700 rounded-lg hover:bg-purple-800 transition cursor-pointer"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}