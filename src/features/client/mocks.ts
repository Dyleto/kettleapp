import { ClientProgram, CompletedSession } from "@/types";

export const mockProgram: ClientProgram = {
  sessions: [
    {
      _id: "s1",
      order: 1,
      notes: "Bien s'hydrater avant cette séance.",
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
          {
            exercise: {
              _id: "e5",
              name: "Turkish Get-Up",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "reps",
            sets: 3,
            reps: 5,
            restBetweenSets: 90,
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "s2",
      order: 2,
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
          {
            exercise: {
              _id: "e8",
              name: "Farmer's Walk",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "timer",
            duration: 30,
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: "s3",
      order: 3,
      notes: "Focus sur la technique du Snatch.",
      warmup: {
        exercises: [
          {
            exercise: {
              _id: "e9",
              name: "Arm Circles",
              type: "warmup",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "reps",
            reps: 15,
          },
        ],
      },
      workout: {
        rounds: 5,
        restBetweenRounds: 60,
        exercises: [
          {
            exercise: {
              _id: "e10",
              name: "Kettlebell Snatch",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "reps",
            sets: 5,
            reps: 10,
            restBetweenSets: 60,
          },
          {
            exercise: {
              _id: "e11",
              name: "Windmill",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "reps",
            sets: 3,
            reps: 6,
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
      workout: {
        rounds: 3,
        restBetweenRounds: 90,
        exercises: [
          {
            exercise: {
              _id: "e12",
              name: "Double Kettlebell Front Squat",
              type: "workout",
              createdBy: "c1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            mode: "reps",
            sets: 3,
            reps: 10,
            restBetweenSets: 90,
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
