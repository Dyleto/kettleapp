import { ClientProgram, CompletedSession } from "@/types";

export const mockProgram: ClientProgram = {
  sessions: [
    {
      _id: "s1",
      order: 1,
      notes:
        "Séance 1 : Focus chaîne postérieure. Concentre-toi bien sur le hip hinge (charnière de hanche).",
      warmup: {
        exercises: [
          {
            exercise: {
              _id: "e1",
              name: "Sauts à la corde",
              type: "warmup",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Échauffement léger. Garde les poignets souples et reste sur la pointe des pieds. Respire bien.",
              videoUrl: "https://www.youtube.com/watch?v=FjIvwlXqGgg",
            },
            mode: "timer",
            duration: 120,
          },
          {
            exercise: {
              _id: "e2",
              name: "Mobilité hanches (90/90)",
              type: "warmup",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Prends ton temps pour chercher l'amplitude. Le dos doit rester bien droit.",
            },
            mode: "reps",
            reps: 10,
          },
        ],
      },
      workout: {
        rounds: 4,
        restBetweenRounds: 90,
        exercises: [
          {
            exercise: {
              _id: "e3",
              name: "Kettlebell Swing",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "💡 L'erreur classique est d'utiliser les bras. Le mouvement part de tes hanches. Serre fort les fessiers en haut du mouvement !",
              videoUrl: "https://www.youtube.com/watch?v=sjc5wTzHXM4",
            },
            mode: "reps",
            sets: 4,
            reps: 15,
            restBetweenSets: 60,
          },
          {
            exercise: {
              _id: "e4",
              name: "Goblet Squat",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Descends en gardant les coudes à l'intérieur de tes genoux. Pousse sur tes talons pour remonter. Poitrine sortie en permanence !",
              videoUrl: "https://www.youtube.com/watch?v=MeIiIdhgPug",
            },
            mode: "reps",
            sets: 4,
            reps: 12,
            restBetweenSets: 60,
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "s2",
      order: 2,
      notes:
        "Séance 2 : Haut du corps. Maintiens le gainage sur tous les mouvements pressés.",
      warmup: {
        exercises: [
          {
            exercise: {
              _id: "e5",
              name: "KB Halos",
              type: "warmup",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Échauffe tes épaules. Garde la Kettlebell proche de ta tête et ne bouge pas le torse.",
            },
            mode: "reps",
            reps: 10, // 5 de chaque côté
          },
        ],
      },
      workout: {
        rounds: 3,
        restBetweenRounds: 120,
        exercises: [
          {
            exercise: {
              _id: "e6",
              name: "Strict Press unilatéral",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Serre les abdos et les fessiers. Le bras doit être tendu proche de l'oreille en fin de mouvement.",
            },
            mode: "reps",
            sets: 3,
            reps: 8,
            restBetweenSets: 45,
          },
          {
            exercise: {
              _id: "e7",
              name: "Gorilla Row",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Garde le buste parallèle au sol. Tire la KB vers ta hanche en serrant tes omoplates.",
            },
            mode: "reps",
            sets: 3,
            reps: 10,
            restBetweenSets: 45,
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "s3",
      order: 3,
      notes:
        "Séance 3 : Travail dynamique et explosivité. Qualité des mouvements > Vitesse.",
      warmup: {
        exercises: [
          {
            exercise: {
              _id: "e8",
              name: "Jumping Jacks",
              type: "warmup",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "timer",
            duration: 60,
          },
        ],
      },
      workout: {
        rounds: 5,
        restBetweenRounds: 60,
        exercises: [
          {
            exercise: {
              _id: "e9",
              name: "Kettlebell Clean",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "La KB doit arriver doucement en position de rack. Ne la laisse pas claquer ton poignet. Utilise l'élan des hanches !",
              videoUrl: "https://www.youtube.com/watch?v=twyEq-oW6X8",
            },
            mode: "reps",
            sets: 5,
            reps: 8,
            restBetweenSets: 45,
          },
          {
            exercise: {
              _id: "e10",
              name: "Pompes (Push-ups)",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "timer",
            duration: 45, // Max de pompes en 45s
            restBetweenSets: 60,
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "s4",
      order: 4,
      notes: "Séance 4 : Force bas du corps asymétrique.",
      warmup: {
        exercises: [
          {
            exercise: {
              _id: "e11",
              name: "Fentes au poids du corps",
              type: "warmup",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "reps",
            reps: 20,
          },
        ],
      },
      workout: {
        rounds: 3,
        restBetweenRounds: 90,
        exercises: [
          {
            exercise: {
              _id: "e12",
              name: "Fentes inversées avec KB (Rack)",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Un seul Kettlebell en position racké (Front Rack). Fais un grand pas en arrière en gardant le torse fier.",
            },
            mode: "reps",
            sets: 3,
            reps: 10,
            restBetweenSets: 60,
          },
          {
            exercise: {
              _id: "e13",
              name: "Romanian Deadlift (Unilatéral)",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Mouvement lent et contrôlé. Sens bien l'étirement dans tes ischio-jambiers. Dos parfaitement plat.",
            },
            mode: "reps",
            sets: 3,
            reps: 8,
            restBetweenSets: 60,
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "s5",
      order: 5,
      notes:
        "Séance 5 : Core / Sangle abdominale. Maintiens une respiration fluide.",
      warmup: {
        exercises: [
          {
            exercise: {
              _id: "e14",
              name: "Planche dynamique",
              type: "warmup",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "timer",
            duration: 45,
          },
        ],
      },
      workout: {
        rounds: 3,
        restBetweenRounds: 60,
        exercises: [
          {
            exercise: {
              _id: "e15",
              name: "Turkish Get-Up",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Le mouvement ROI avec Kettlebell. Regarde la vidéo de consigne. Ne quitte jamais la Kettlebell des yeux !",
              videoUrl: "https://www.youtube.com/watch?v=0rE2B0Uv58M",
            },
            mode: "reps",
            sets: 3,
            reps: 3, // 3 lents par bras
            restBetweenSets: 90,
          },
          {
            exercise: {
              _id: "e16",
              name: "Farmer's Walk",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Marche du fermier. Prends lourd. Poitrine sortie, épaules basses, pas rapides et courts.",
            },
            mode: "timer",
            duration: 60, // 1 minute de marche
            restBetweenSets: 60,
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "s6",
      order: 6,
      notes: "Séance 6 : Récupération active et stretching.",
      warmup: {
        exercises: [],
      },
      workout: {
        rounds: 1, // Circuit réalisé 1 seule fois
        exercises: [
          {
            exercise: {
              _id: "e17",
              name: "Étirement ischio & Psoas",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
              description:
                "Respiration ventrale. Essaie de gagner un centimètre d'amplitude à chaque expiration.",
            },
            mode: "timer",
            duration: 120, // 2 minutes
          },
          {
            exercise: {
              _id: "e18",
              name: "Child's Pose (Dos étiré)",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "timer",
            duration: 90,
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

export const mockCompleted: CompletedSession[] = [
  {
    _id: "log1",
    completedAt: new Date("2026-02-24"),
    originalSessionId: "s1",
    sessionOrder: 1,
    coachNotes: "Bien s'hydrater avant cette séance.",
    warmup: {
      exercises: [
        {
          exercise: {
            _id: "e1",
            name: "Sauts à la corde",
            type: "warmup",
            createdBy: "c1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mode: "timer",
          duration: 120,
        },
        {
          exercise: {
            _id: "e2",
            name: "Mobilité hanches",
            type: "warmup",
            createdBy: "c1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mode: "reps",
          reps: 10,
        },
      ],
    },
    workout: {
      rounds: 4,
      restBetweenRounds: 90,
      exercises: [
        {
          exercise: {
            _id: "e3",
            name: "Kettlebell Swing",
            type: "workout",
            createdBy: "c1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mode: "reps",
          sets: 4,
          reps: 15,
          restBetweenSets: 60,
        },
        {
          exercise: {
            _id: "e4",
            name: "Goblet Squat",
            type: "workout",
            createdBy: "c1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mode: "reps",
          sets: 4,
          reps: 12,
          restBetweenSets: 60,
        },
      ],
    },
    metrics: { stress: 3, mood: 4, energy: 3, sleep: 4, soreness: 2 },
    clientNotes: "Bonne séance, un peu fatigué sur les derniers rounds.",
  },
  {
    _id: "log2",
    completedAt: new Date("2026-02-27"),
    originalSessionId: "s2",
    sessionOrder: 2,
    warmup: {
      exercises: [
        {
          exercise: {
            _id: "e6",
            name: "Jumping Jacks",
            type: "warmup",
            createdBy: "c1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mode: "timer",
          duration: 60,
        },
      ],
    },
    workout: {
      rounds: 3,
      restBetweenRounds: 120,
      exercises: [
        {
          exercise: {
            _id: "e7",
            name: "Clean & Press",
            type: "workout",
            createdBy: "c1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          mode: "reps",
          sets: 3,
          reps: 8,
          restBetweenSets: 90,
        },
      ],
    },
    metrics: { stress: 2, mood: 5, energy: 4, sleep: 5, soreness: 3 },
    clientNotes: "",
  },
];
