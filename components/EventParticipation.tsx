'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EventParticipation({ eventId, isBureau }: { eventId: string; isBureau: boolean }) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [selectedTask, setSelectedTask] = useState('Participation générale');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchParticipants();
    getCurrentUser();
  }, [eventId]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentUser({
        id: user.id,
        name: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user.email,
      });
    }
  }

  async function fetchParticipants() {
    const { data } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId);
    if (data) setParticipants(data);
  }

  // Permet au bureau de définir un besoin type ou aux parents de s'inscrire
  async function handleParticipate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      alert("Vous devez être connecté pour participer.");
      return;
    }

    const taskToJoin = customTask.trim() || selectedTask;

    setLoading(true);
    try {
      const { error } = await supabase.from('event_participants').insert({
        event_id: eventId,
        user_id: currentUser.id,
        user_name: currentUser.name,
        task_name: taskToJoin,
      });

      if (error) throw error;

      setCustomTask('');
      fetchParticipants();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'inscription : " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave(participationId: string) {
    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('id', participationId);

    if (!error) fetchParticipants();
  }

  // Liste des tâches déjà proposées ou classiques
  const defaultNeeds = [
    'Participation générale',
    'Préparation de gâteau / crêpes',
    'Installation (avant l\'événement)',
    'Rangement (après l\'événement)',
    'Tenue de stand (créneau 1)',
    'Tenue de stand (créneau 2)',
  ];

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 bg-purple-50/30 p-4 rounded-xl">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <span>🙋‍♂️</span> Inscriptions & Besoins ({participants.length} bénévole{participants.length > 1 ? 's' : ''})
        </h4>
      </div>

      {/* Formulaire d'inscription / Ajout de besoin */}
      <form onSubmit={handleParticipate} className="bg-white p-4 rounded-lg border shadow-xs space-y-3">
        <p className="text-xs font-bold text-gray-800">Je souhaite participer à :</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Choisir parmi les besoins</label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            >
              {defaultNeeds.map((need, idx) => (
                <option key={idx} value={need}>{need}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">
              {isBureau ? "Ou définir un besoin spécifique (ex: Stand Buvette 14h-16h)" : "Ou préciser un détail (ex: Gâteau au chocolat)"}
            </label>
            <input
              type="text"
              value={customTask}
              onChange={(e) => setCustomTask(e.target.value)}
              placeholder="Ex : Stand Buvette 14h-16h..."
              className="w-full p-2 border rounded text-xs text-gray-900 bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs py-2 rounded transition font-medium cursor-pointer"
        >
          {loading ? "Inscription..." : "✨ Je m'inscris à cette tâche / ce créneau"}
        </button>
      </form>

      {/* Liste des inscrits par tâche */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700">Bénévoles inscrits par poste :</p>
        {participants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {participants.map((p) => {
              const isMe = currentUser && p.user_id === currentUser.id;
              return (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-white border rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-purple-700 block">{p.task_name}</span>
                    <span className="text-gray-600">👤 {p.user_name}</span>
                  </div>
                  {isMe && (
                    <button
                      type="button"
                      onClick={() => handleLeave(p.id)}
                      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded font-medium cursor-pointer"
                    >
                      Se désinscrire
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic text-center py-2">Aucun inscrit pour le moment. Soyez le premier !</p>
        )}
      </div>
    </div>
  );
}