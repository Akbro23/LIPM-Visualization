"use client"

import { useMemo, useState, useCallback } from "react"
import { computeLIPM } from "@/lib/lipm"
import { PRESETS, buildPresetSteps, PRESET_DEFAULT_NUM_STEPS, SIDEWARD_DEFAULT_STEP_SY } from "@/lib/presets"
import type { GaitParams, PresetKey } from "@/lib/types"
import { ControlPanel } from "@/components/control-panel"
import { Viewport3D } from "@/components/viewport-3d"
import { EquationsPanel } from "@/components/equations-panel"
import { ChartTabs } from "@/components/chart-tabs"
import { ResizeHandle } from "@/components/resize-handle"

const MIN_SIDE = 200
const MAX_SIDE = 520
const MIN_BOTTOM = 140
const MAX_BOTTOM = 520

export default function Home() {
  const [preset, setPreset] = useState<PresetKey>("straight")
  const [numSteps, setNumSteps] = useState(PRESET_DEFAULT_NUM_STEPS.straight!)
  const [sidewardStepSy, setSidewardStepSy] = useState(SIDEWARD_DEFAULT_STEP_SY)
  const [sidewardStartStop, setSidewardStartStop] = useState(false)
  const [params, setParams] = useState<GaitParams>({
    ...PRESETS.straight,
    steps: buildPresetSteps("straight", PRESET_DEFAULT_NUM_STEPS.straight!),
  })
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const [leftWidth, setLeftWidth] = useState(288)
  const [rightWidth, setRightWidth] = useState(288)
  const [bottomHeight, setBottomHeight] = useState(256)

  const result = useMemo(() => computeLIPM(params), [params])

  function handlePreset(key: PresetKey) {
    setPreset(key)
    const n = PRESET_DEFAULT_NUM_STEPS[key] ?? numSteps
    if (key !== "custom") setNumSteps(n)
    setParams({ ...PRESETS[key], steps: buildPresetSteps(key, n, sidewardStepSy, sidewardStartStop) })
    setActiveStep(null)
  }

  function handleNumSteps(n: number) {
    setNumSteps(n)
    if (preset !== "custom") {
      setParams(p => ({ ...p, steps: buildPresetSteps(preset, n, sidewardStepSy, sidewardStartStop) }))
    }
  }

  function handleSidewardStepSy(v: number) {
    setSidewardStepSy(v)
    if (preset === "sideward") {
      setParams(p => ({ ...p, steps: buildPresetSteps("sideward", numSteps, v, sidewardStartStop) }))
    }
  }

  function handleSidewardStartStop(v: boolean) {
    setSidewardStartStop(v)
    if (preset === "sideward") {
      setParams(p => ({ ...p, steps: buildPresetSteps("sideward", numSteps, sidewardStepSy, v) }))
    }
  }

  const resizeLeft = useCallback((d: number) =>
    setLeftWidth(w => Math.max(MIN_SIDE, Math.min(MAX_SIDE, w + d))), [])

  const resizeRight = useCallback((d: number) =>
    setRightWidth(w => Math.max(MIN_SIDE, Math.min(MAX_SIDE, w - d))), [])

  const resizeBottom = useCallback((d: number) =>
    setBottomHeight(h => Math.max(MIN_BOTTOM, Math.min(MAX_BOTTOM, h - d))), [])

  const Tc = Math.sqrt(params.zc / params.g)

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">3D LIPM Walking Pattern Visualizer</h1>
          <p className="text-xs text-muted-foreground">Linear Inverted Pendulum Model</p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          T_c = {Tc.toFixed(3)} s &nbsp;|&nbsp; {result.steps.length} steps &nbsp;|&nbsp; {result.trajectory.length} samples
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside style={{ width: leftWidth }} className="shrink-0 overflow-y-auto">
          <ControlPanel
            params={params}
            preset={preset}
            numSteps={numSteps}
            sidewardStepSy={sidewardStepSy}
            sidewardStartStop={sidewardStartStop}
            activeStep={activeStep}
            steps={result.steps}
            onParams={setParams}
            onPreset={handlePreset}
            onNumSteps={handleNumSteps}
            onSidewardStepSy={handleSidewardStepSy}
            onSidewardStartStop={handleSidewardStartStop}
            onStepSelect={setActiveStep}
          />
        </aside>

        <ResizeHandle direction="horizontal" onResize={resizeLeft} />

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <Viewport3D
              result={result}
              params={params}
              activeStep={activeStep}
              onStepSelect={setActiveStep}
            />
          </div>

          <ResizeHandle direction="vertical" onResize={resizeBottom} />

          <div style={{ height: bottomHeight }} className="shrink-0 overflow-hidden">
            <ChartTabs result={result} params={params} activeStep={activeStep} />
          </div>
        </main>

        <ResizeHandle direction="horizontal" onResize={resizeRight} />

        <aside style={{ width: rightWidth }} className="shrink-0 overflow-y-auto">
          <EquationsPanel params={params} />
        </aside>
      </div>
    </div>
  )
}
