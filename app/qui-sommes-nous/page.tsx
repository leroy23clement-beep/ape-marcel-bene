export default function QuiSommesNous() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Qui sommes-nous ?</h1>
      
      <div className="space-y-6 text-gray-600 leading-relaxed">
        <p>
          Bienvenue sur le site officiel de l&apos;<strong>Association des Parents d&apos;Élèves Marcel Béné (APE)</strong> de Muizon. 
          Notre association a pour principal objectif de dynamiser la vie scolaire, d&apos;organiser des événements festifs et conviviaux et de collecter des fonds pour financer les projets pédagogiques et les sorties des enfants.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Notre rôle et nos actions</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Représenter les parents d&apos;élèves et faire le lien avec l&apos;équipe pédagogique.</li>
          <li>Organiser des moments de partage pour les enfants et les familles.</li>
          <li>Contribuer à l&apos;achat de matériel et au financement des activités scolaires.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Rejoignez-nous !</h2>
        <p>
          L&apos;association vit grâce à l&apos;investissement de ses bénévoles. N&apos;hésitez pas à nous rejoindre ou à nous donner un coup de main lors de nos événements !
        </p>
      </div>
    </main>
  );
}
