/**
 * Moteur de guide KYC : transforme les mesures du moteur de vision en consignes
 * stables a l'ecran, puis autorise la capture quand tout est reuni.
 *
 * Logique pure, sans DOM : elle tourne identique dans le navigateur et dans les
 * tests Node. Le backend ne fait que mesurer ; c'est ici qu'on decide quoi dire.
 */

export type Ton = 'erreur' | 'attendre' | 'agir' | 'pres' | 'ok';

export interface Consigne {
  code: string;
  texte: string;
  ton: Ton;
}

export interface EtatGuide {
  consigne: Consigne;
  progression: number;
  stable: boolean;
  pret: boolean;
  satisfait: boolean;
}

export interface MesureVisage {
  detected: boolean;
  size: number;
  offset: { dx: number; dy: number };
  angles: { roulis: number; lacet: number; tangage: number };
  frontal: boolean;
  light: number;
  blur: number;
  glare: number;
  score: number;
}

export interface MesureDocument {
  found: boolean;
  coverage: number;
  aspect: number;
  tilt: number;
  light: number;
  blur: number;
  glare: number;
}

export const SEUILS = {
  visage: {
    tailleMin: 0.22,
    tailleMax: 0.55,
    decentreMax: 0.09,
    roulisMax: 14,
    lacetMax: 0.22,
    tangageMin: 0.55,
    tangageMax: 0.95,
    lumiereMin: 65,
    lumiereMax: 215,
    refletMax: 0.1,
    flouMin: 45,
    scoreMin: 0.7,
    heldMs: 900,
  },
  document: {
    couvertureMin: 0.3,
    couvertureMax: 0.92,
    aspectMin: 1.25,
    aspectMax: 1.95,
    inclinaisonMax: 9,
    lumiereMin: 55,
    lumiereMax: 225,
    refletMax: 0.16,
    flouMin: 60,
    heldMs: 700,
  },
  /** Dérive maximale tolérée entre deux images pour considérer le cadrage stable. */
  derivesMax: 0.022,
  /**
   * Tant que le cadrage est tenu, il faut dépasser ce seuil plus large pour le
   * déclarer instable. Sans ce deuxieme seuil, une main qui tremble a la limite
   * fait alterner « immobilise-toi » et « ne bouge plus » a chaque image.
   */
  derivesLibere: 0.032,
  /** Duree pendant laquelle une consigne moins urgente doit se confirmer avant de s'afficher. */
  hysteresisMs: 220,
} as const;

const URGENCE: Record<Ton, number> = { erreur: 0, agir: 1, attendre: 2, pres: 3, ok: 4 };

type Critere<T> = { code: string; texte: string; ton: Ton; manque: (m: T) => boolean };

/**
 * Critères du visage. Aucun n'est gardé par `detected` : tant qu'aucun visage
 * n'est dans le cadre, tous sont insatisfaits, et la jauge reste à zéro. Comme
 * « absent » est en tête de liste, c'est toujours lui qui s'affiche.
 */
export function criteresVisage(seuils = SEUILS.visage): Array<Critere<MesureVisage>> {
  return [
    {
      code: 'absent',
      texte: 'Place ton visage dans le cadre',
      ton: 'attendre',
      manque: (m) => !m.detected,
    },
    {
      code: 'lumiere',
      texte: 'Eclaire-toi : la scene est trop sombre',
      ton: 'agir',
      manque: (m) => m.light < seuils.lumiereMin,
    },
    {
      code: 'reflet',
      texte: 'Trop de lumiere : evite les reflets sur le visage',
      ton: 'agir',
      manque: (m) => m.light > seuils.lumiereMax || m.glare > seuils.refletMax,
    },
    {
      code: 'flou',
      texte: 'Immobilise-toi, l’image est floue',
      ton: 'agir',
      manque: (m) => m.blur < seuils.flouMin,
    },
    {
      code: 'loin',
      texte: 'Rapproche-toi de la camera',
      ton: 'agir',
      manque: (m) => m.size < seuils.tailleMin,
    },
    {
      code: 'pres',
      texte: 'Eloigne-toi : ton visage depasse du cadre',
      ton: 'agir',
      manque: (m) => m.size > seuils.tailleMax,
    },
    {
      code: 'recentre',
      texte: 'Recentre-toi au milieu du cercle',
      ton: 'agir',
      manque: (m) => Math.abs(m.offset.dx) > seuils.decentreMax || Math.abs(m.offset.dy) > seuils.decentreMax,
    },
    {
      code: 'roulis',
      texte: 'Redresse la tete',
      ton: 'agir',
      manque: (m) => Math.abs(m.angles.roulis) > seuils.roulisMax,
    },
    {
      code: 'profil',
      texte: 'Regarde la camera de face',
      ton: 'agir',
      manque: (m) => !m.frontal || Math.abs(m.angles.lacet) > seuils.lacetMax,
    },
    {
      code: 'peu_sur',
      texte: 'Bouge legerement pour que je te voie mieux',
      ton: 'attendre',
      manque: (m) => m.score < seuils.scoreMin,
    },
  ];
}

export function criteresDocument(seuils = SEUILS.document): Array<Critere<MesureDocument>> {
  return [
    {
      code: 'aucun',
      texte: 'Place la piece d’identite dans le cadre',
      ton: 'attendre',
      manque: (m) => !m.found,
    },
    {
      code: 'lumiere',
      texte: 'Eclaire le document',
      ton: 'agir',
      manque: (m) => m.light < seuils.lumiereMin,
    },
    {
      code: 'reflet',
      texte: 'Un reflet cache le document : incline-le legerement',
      ton: 'agir',
      manque: (m) => m.light > seuils.lumiereMax || m.glare > seuils.refletMax,
    },
    {
      code: 'flou',
      texte: 'Tiens le telephone droit, l’image est floue',
      ton: 'agir',
      manque: (m) => m.blur < seuils.flouMin,
    },
    {
      code: 'loin',
      texte: 'Rapproche-toi : le document est trop petit',
      ton: 'agir',
      manque: (m) => m.coverage < seuils.couvertureMin,
    },
    {
      code: 'pres',
      texte: 'Eloigne-toi : les bords du document sont coupes',
      ton: 'agir',
      manque: (m) => m.coverage > seuils.couvertureMax,
    },
    {
      code: 'pentu',
      texte: 'Redresse le document face a la camera',
      ton: 'agir',
      manque: (m) => Math.abs(m.tilt) > seuils.inclinaisonMax,
    },
    {
      code: 'format',
      texte: 'Document non reconnu : cadrage ou format inattendu',
      ton: 'agir',
      manque: (m) => m.aspect < seuils.aspectMin || m.aspect > seuils.aspectMax,
    },
  ];
}

interface Memoire {
  position: { x: number; y: number }[];
  stable: boolean;
  dernier: Consigne;
  en_attente: { consigne: Consigne; depuis: number } | null;
  satisfait_depuis: number | null;
}

function consigne_capture(): Consigne {
  return { code: 'capture', texte: 'Parfait, je capture', ton: 'ok' };
}

type Choix<T> = { consigne: Consigne | null; manquants: number; total: number };

function choisir<T>(criteres: Array<Critere<T>>, mesure: T): Choix<T> {
  const manquants = criteres.filter((critere) => critere.manque(mesure));
  const premier = manquants[0];
  // Le premier critere est le garde (visage ou piece absent) : tant qu'il echoue,
  // les autres ne sont meme pas evaluables. Sans ca, la jauge afficherait « presque
  // pret » sur une image vide, parce que ses seuils ne sont pas depasses.
  const compte = premier && premier.code === criteres[0].code ? criteres.length : manquants.length;
  return {
    consigne: premier ? { code: premier.code, texte: premier.texte, ton: premier.ton } : null,
    manquants: compte,
    total: criteres.length,
  };
}

/**
 * Guide d'une capture : consigne affichable stable + autorisation de capture.
 * `position` sert à estimer la stabilité (le cadrage dérive quand la main tremble
 * ou que le sujet bouge trop vite) ; la capture n'est autorisée qu'immobile.
 */
export function creerGuide<T extends { found?: boolean; detected?: boolean }>(
  criteres: Array<Critere<T>>,
  options: { heldMs: number; position: (mesure: T) => { x: number; y: number } | null },
) {
  const memoire: Memoire = {
    position: [],
    stable: false,
    dernier: { code: 'attente', texte: 'Préparation de la caméra…', ton: 'attendre' },
    en_attente: null,
    satisfait_depuis: null,
  };

  const stabilite = (nouvelle: { x: number; y: number } | null): boolean => {
    if (!nouvelle) {
      memoire.position = [];
      memoire.stable = false;
      return false;
    }
    memoire.position.push(nouvelle);
    if (memoire.position.length > 4) memoire.position.shift();
    if (memoire.position.length < 3) return false;
    const xs = memoire.position.map((p) => p.x);
    const ys = memoire.position.map((p) => p.y);
    const derive = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    memoire.stable = derive <= (memoire.stable ? SEUILS.derivesLibere : SEUILS.derivesMax);
    return memoire.stable;
  };

  return {
    reinitialiser(): void {
      memoire.position = [];
      memoire.stable = false;
      memoire.en_attente = null;
      memoire.satisfait_depuis = null;
      memoire.dernier = { code: 'attente', texte: 'Préparation de la caméra…', ton: 'attendre' };
    },

    /** Une mesure du moteur = un pas du guide. Renvoie l'état à afficher. */
    pas(mesure: T, horodatage: number): EtatGuide {
      const { consigne, manquants, total } = choisir(criteres, mesure);
      const manque = consigne !== null;
      const stable = stabilite(options.position(mesure));

      if (consigne) {
        const urgence = URGENCE[consigne.ton];
        if (consigne.code === memoire.dernier.code) {
          memoire.en_attente = null;
        } else if (urgence < URGENCE[memoire.dernier.ton] || memoire.dernier.code === 'attente') {
          // Plus urgent, ou premier message reel : on affiche tout de suite. Une
          // consigne calme ne doit jamais masquer un probleme qui vient d'apparaitre.
          memoire.dernier = consigne;
          memoire.en_attente = null;
        } else {
          if (!memoire.en_attente || memoire.en_attente.consigne.code !== consigne.code) {
            memoire.en_attente = { consigne, depuis: horodatage };
          }
          if (horodatage - memoire.en_attente.depuis >= SEUILS.hysteresisMs) {
            memoire.dernier = consigne;
            memoire.en_attente = null;
          }
        }
      }

      if (manque || !stable) {
        memoire.satisfait_depuis = null;
      } else if (memoire.satisfait_depuis === null) {
        memoire.satisfait_depuis = horodatage;
      }

      const maintenu =
        !manque && stable && memoire.satisfait_depuis !== null
          ? horodatage - memoire.satisfait_depuis
          : 0;
      const pret = !manque && stable && maintenu >= options.heldMs;
      const progression = manque
        ? Math.max(0, Math.min(0.9, 1 - manquants / total))
        : Math.min(1, 0.9 + (maintenu / options.heldMs) * 0.1);

      const affiche: Consigne = pret
        ? consigne_capture()
        : manque
          ? memoire.dernier
          : stable
            ? { code: 'tienne', texte: 'Ne bouge plus, je capture', ton: 'pres' }
            : { code: 'stable', texte: 'Immobilise-toi, je stabilise l’image', ton: 'attendre' };

      return { consigne: affiche, progression, stable, pret, satisfait: !manque };
    },
  };
}

export const guideVisage = () =>
  creerGuide<MesureVisage>(criteresVisage(), {
    heldMs: SEUILS.visage.heldMs,
    position: (m) => (m.detected ? { x: 0.5 + m.offset.dx, y: 0.5 + m.offset.dy } : null),
  });

export const guideDocument = () =>
  creerGuide<MesureDocument>(criteresDocument(), {
    heldMs: SEUILS.document.heldMs,
    position: (m) => (m.found ? { x: m.coverage, y: m.tilt / 90 } : null),
  });
