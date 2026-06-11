import type { GaitParams, StepData, TrajectoryPoint, LIPMResult } from "./types"

// Derived constants
function constants(zc: number, g: number, tSup: number) {
  const Tc = Math.sqrt(zc / g)
  const C = Math.cosh(tSup / Tc)
  const S = Math.sinh(tSup / Tc)
  return { Tc, C, S }
}

// Analytical solution for x(t) and ẋ(t) given initial state and foot placement p*
// Eq (*4): ẍ = (g/zc)(x - p*)
function integrate(
  x0: number, xDot0: number, pStar: number,
  t: number, Tc: number
): [number, number] {
  const dx = x0 - pStar
  const x = dx * Math.cosh(t / Tc) + Tc * xDot0 * Math.sinh(t / Tc) + pStar
  const xDot = (dx / Tc) * Math.sinh(t / Tc) + xDot0 * Math.cosh(t / Tc)
  return [x, xDot]
}

// Eq (*1): foot placement recurrence
function nextFootPlacement(
  prevPx: number, prevPy: number,
  sx: number, sy: number,
  n: number // 1-indexed step number
): [number, number] {
  const px = prevPx + sx
  const py = prevPy - Math.pow(-1, n) * sy
  return [px, py]
}

// Eq (*2): walk primitive center from NEXT step params
function walkPrimitive(
  sxNext: number, syNext: number, n: number
): [number, number] {
  const xBar = sxNext / 2
  const yBar = Math.pow(-1, n) * syNext / 2
  return [xBar, yBar]
}

// Eq (*3): walk primitive velocities
function walkPrimitiveVelocities(
  xBar: number, yBar: number, C: number, S: number, Tc: number
): [number, number] {
  const vxBar = xBar * (C + 1) / (Tc * S)
  const vyBar = yBar * (C - 1) / (Tc * S)
  return [vxBar, vyBar]
}

// Eq (*5): desired terminal state for step n
function desiredState(
  px: number, py: number, xBar: number, yBar: number, vxBar: number, vyBar: number
): [number, number, number, number] {
  return [px + xBar, vxBar, py + yBar, vyBar]
}

// Eq (*6): modified foot placement minimizing weighted terminal error
function modifiedFootPlacement(
  xi: number, xDoti: number,
  xd: number, xDotd: number,
  C: number, S: number, Tc: number,
  a: number, b: number
): number {
  const D = a * Math.pow(C - 1, 2) + b * Math.pow(S / Tc, 2)
  const pStar =
    -((a * (C - 1)) / D) * (xd - C * xi - Tc * S * xDoti) -
    ((b * S) / (Tc * D)) * (xDotd - (S / Tc) * xi - C * xDoti)
  return pStar
}

const SAMPLES_PER_STEP = 100

export function computeLIPM(params: GaitParams): LIPMResult {
  const { zc, tSup, g, a, b, steps } = params
  const { Tc, C, S } = constants(zc, g, tSup)

  const trajectory: TrajectoryPoint[] = []
  const stepDataArr: StepData[] = []

  // Initial foot placement at origin
  let prevPx = 0
  let prevPy = 0

  // Initial CoM state (at rest above first support)
  let xi = 0
  let xDoti = 0
  let yi = 0
  let yDoti = 0

  // Initial support foot = foot 0 at origin
  let pxStar = 0
  let pyStar = 0

  let globalTime = 0

  for (let n = 0; n < steps.length; n++) {
    const step = steps[n]
    const nextStep = steps[n + 1] ?? { sx: 0, sy: step.sy }

    // (*1) foot placement
    const [px, py] = nextFootPlacement(prevPx, prevPy, step.sx, step.sy, n + 1)

    // (*2) walk primitive from NEXT step
    const [xBar, yBar] = walkPrimitive(nextStep.sx, nextStep.sy, n + 1)

    // (*3) velocities
    const [vxBar, vyBar] = walkPrimitiveVelocities(xBar, yBar, C, S, Tc)

    // (*5) desired terminal state
    const [xd, xDotd, yd, yDotd] = desiredState(px, py, xBar, yBar, vxBar, vyBar)

    // (*6) modified foot placement (the current support foot p*)
    pxStar = modifiedFootPlacement(xi, xDoti, xd, xDotd, C, S, Tc, a, b)
    pyStar = modifiedFootPlacement(yi, yDoti, yd, yDotd, C, S, Tc, a, b)

    stepDataArr.push({
      n,
      px,
      py,
      pxStar,
      pyStar,
      xBar,
      yBar,
      vxBar,
      vyBar,
    })

    // Sample trajectory for this step
    for (let k = 0; k <= SAMPLES_PER_STEP; k++) {
      const t = (k / SAMPLES_PER_STEP) * tSup
      const [x, xDot] = integrate(xi, xDoti, pxStar, t, Tc)
      const [y, yDot] = integrate(yi, yDoti, pyStar, t, Tc)
      trajectory.push({ t: globalTime + t, x, y, z: zc, xDot, yDot, step: n })
    }

    // Advance state to end of this step
    ;[xi, xDoti] = integrate(xi, xDoti, pxStar, tSup, Tc)
    ;[yi, yDoti] = integrate(yi, yDoti, pyStar, tSup, Tc)

    globalTime += tSup
    prevPx = px
    prevPy = py
  }

  return { trajectory, steps: stepDataArr, tSamples: SAMPLES_PER_STEP }
}
