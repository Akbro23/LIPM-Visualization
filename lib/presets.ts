import type { GaitParams, PresetKey } from "./types"

const BASE: Pick<GaitParams, "zc" | "tSup" | "g" | "a" | "b"> = {
  zc: 0.8,
  tSup: 0.8,
  g: 9.81,
  a: 10,
  b: 1,
}

// Straight walk: 3 full steps + half-step start + half-step stop (5 entries)
// n=0: start (half step), n=1,2,3: full steps, n=4: stop (half step)
export const PRESET_DEFAULT_NUM_STEPS: Partial<Record<PresetKey, number>> = {
  straight: 3,
  sideward: 6,
}

export const SIDEWARD_DEFAULT_STEP_SY = 0.25

export function buildPresetSteps(
  key: PresetKey,
  numSteps: number,
  stepSy = SIDEWARD_DEFAULT_STEP_SY,
  sidewardStartStop = false,
): import("./types").StepParam[] {
  if (key === "straight") {
    return [
      { sx: 0.0, sy: 0.1 },
      ...Array.from({ length: numSteps }, () => ({ sx: 0.3, sy: 0.1 })),
      { sx: 0.0, sy: 0.1 },
    ]
  }
  if (key === "sideward") {
    const main = Array.from({ length: numSteps }, (_, i) =>
      i % 2 === 0 ? { sx: 0.0, sy: stepSy } : { sx: 0.0, sy: 0.1 }
    )
    return sidewardStartStop
      ? [{ sx: 0.0, sy: 0.1 }, ...main, { sx: 0.0, sy: 0.1 }]
      : main
  }
  return PRESETS[key].steps
}

export const PRESETS: Record<PresetKey, GaitParams> = {
  straight: {
    ...BASE,
    steps: [
      { sx: 0.0, sy: 0.1 }, // start: stand still, shift weight
      { sx: 0.3, sy: 0.1 }, // step 1
      { sx: 0.3, sy: 0.1 }, // step 2
      { sx: 0.3, sy: 0.1 }, // step 3
      { sx: 0.0, sy: 0.1 }, // stop
    ],
  },

  // Sideward: 6 steps, right foot moves 25cm right, left foot follows 10cm from it
  // sy alternates: right foot goes out 0.25, left foot closes to 0.10 from right
  sideward: {
    ...BASE,
    steps: [
      { sx: 0.0, sy: 0.25 }, // step 1: right foot out 25cm
      { sx: 0.0, sy: 0.10 }, // step 2: left foot closes to 10cm
      { sx: 0.0, sy: 0.25 }, // step 3
      { sx: 0.0, sy: 0.10 }, // step 4
      { sx: 0.0, sy: 0.25 }, // step 5
      { sx: 0.0, sy: 0.10 }, // step 6
    ],
  },

  // Two normal steps, a very short "stumble" step, then automatic recovery via (*6)
  custom: {
    ...BASE,
    steps: [
      { sx: 0.00, sy: 0.10 }, // weight shift (start)
      { sx: 0.30, sy: 0.10 }, // normal
      { sx: 0.30, sy: 0.10 }, // normal
      { sx: 0.04, sy: 0.10 }, // stumble — very short step
      { sx: 0.30, sy: 0.10 }, // recovery (p* shifts automatically)
      { sx: 0.30, sy: 0.10 }, // normal
      { sx: 0.00, sy: 0.10 }, // stop
    ],
  },
}
