export interface GaitParams {
  zc: number        // CoM height (m)
  tSup: number      // support period (s)
  g: number         // gravity (m/s²)
  a: number         // foot placement weight: position error
  b: number         // foot placement weight: velocity error
  steps: StepParam[]
}

export interface StepParam {
  sx: number  // step length in x
  sy: number  // step width in y (half-width between feet)
}

export interface StepData {
  n: number
  px: number   // foot placement x (world frame)
  py: number   // foot placement y (world frame)
  pxStar: number  // modified foot placement x
  pyStar: number  // modified foot placement y
  xBar: number    // walk primitive center x
  yBar: number    // walk primitive center y
  vxBar: number
  vyBar: number
}

export interface TrajectoryPoint {
  t: number       // global time
  x: number       // CoM x
  y: number       // CoM y
  z: number       // CoM z (= zc, constant)
  xDot: number
  yDot: number
  step: number    // which step index this belongs to
}

export interface LIPMResult {
  trajectory: TrajectoryPoint[]
  steps: StepData[]
  tSamples: number  // samples per step
}

export type PresetKey = "straight" | "sideward" | "custom"
