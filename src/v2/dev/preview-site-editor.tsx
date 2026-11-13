// Harnais de validation visuelle (jetable) — monte SiteEditor avec un mini-site
// complet, sans session ni backend. À supprimer une fois les 22 panneaux finis.
import { createRoot } from 'react-dom/client';
import '../styles/v2.css';
import { SiteEditor } from '../components/SiteEditor';
import { creerMiniSiteVide } from '../lib/site-model';

const vide = new URLSearchParams(location.search).has('vide');

const site = creerMiniSiteVide('Pharmacie du Marché');
if (!vide) {
  site.cat = 'Santé';
  site.couleur = '#0b9a63';
  site.accroche = 'Paracétamol · tests rapides · garde de nuit';
  site.adresse = 'Avenue 5, Quartier Camp Kokoko';
  site.distance = '1,2 km';
  site.live = true;
  site.liveTitre = 'Nouveautés du jour';
  site.stats = { score: '4,8', vues: 1240, likes: 86, com: 12 };
  site.ms.abon = 1240;
  site.ms.adresse = site.adresse;

  const photoTest =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#0b9a63"/><text x="150" y="158" font-family="sans-serif" font-size="26" fill="#fff" text-anchor="middle">photo</text></svg>',
    );

  site.medias = [
    { type: 'photo', couleur: '#0b9a63', label: 'vitrine', url: photoTest },
    { type: 'photo', couleur: '#2e86de', label: 'rayon' },
    { type: 'photo', couleur: '#c9a227', label: 'équipe' },
  ];

  site.blocs = [
    { titre: 'Ordonnance en 10 min', description: '', icone: 'plus' },
    { titre: 'Tests rapides', description: '', icone: 'heart' },
    { titre: 'Garde de nuit', description: '', icone: 'moon' },
    { titre: 'Livraison à domicile', description: '', icone: 'car' },
  ];

  site.items = [
    { nom: 'Paracétamol 500 mg', pack: 'boîte de 20', prix: 3500, stock: 42, marque: 'Dawa', modele: '', qualite: 'A', etat: 'neuf' },
    { nom: 'Test paludisme', pack: 'unité', prix: 5000, stock: 18, marque: 'SD Bioline', modele: '', qualite: 'A', etat: 'neuf' },
    { nom: 'Sérum physiologique', pack: 'flacon 500 ml', prix: 2500, stock: 7, marque: 'Gilbert', modele: '', qualite: 'B', etat: 'neuf' },
  ];

  site.liv = { on: true, zone: 'Gombe · Matete', tarif: 1500, delai: 'sous 24 h' };
  site.liens = [
    { nom: 'Site', url: '#' },
    { nom: 'WhatsApp', url: '#' },
    { nom: 'Instagram', url: '#' },
  ];
}

const racine = document.getElementById('root');
if (racine) {
  createRoot(racine).render(
    <div className="v2-root" data-theme="dark">
      <SiteEditor
        initial={site}
        shopName={site.nom}
        shopTagline={site.accroche}
        onClose={() => console.log('close')}
        onSave={(next) => console.log('save', next.nom)}
      />
    </div>,
  );
}
