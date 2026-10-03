import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const subscription = await request.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Enregistrer ou mettre à jour l'abonnement push pour cet utilisateur
    const { error } = await supabase
      .from('push_subscriptions')
      upsert({
        user_id: user.id,
        subscription: subscription,
      }, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur sauvegarde subscription:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}