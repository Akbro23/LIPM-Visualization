"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { GaitParams, PresetKey, StepData } from "@/lib/types"
import { PRESET_DEFAULT_NUM_STEPS } from "@/lib/presets"

interface Props {
  params: GaitParams
  preset: PresetKey
  numSteps: number
  sidewardStepSy: number
  sidewardStartStop: boolean
  activeStep: number | null
  steps: StepData[]
  onParams: (p: GaitParams) => void
  onPreset: (k: PresetKey) => void
  onNumSteps: (n: number) => void
  onSidewardStepSy: (v: number) => void
  onSidewardStartStop: (v: boolean) => void
  onStepSelect: (n: number | null) => void
}

function ParamSlider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <Label className="text-muted-foreground">{label}</Label>
        <span className="font-mono">{value.toFixed(2)} {unit}</span>
      </div>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  )
}

const fmt = (n: number) => (n >= 0 ? " " : "") + n.toFixed(3)

const PRESET_LABELS: { key: PresetKey; label: string }[] = [
  { key: "straight", label: "Straight Walk" },
  { key: "sideward", label: "Sideward Walk" },
  { key: "custom",   label: "Custom" },
]

function presetDescription(key: PresetKey, numSteps: number, stepSy: number): string {
  const s = numSteps === 1 ? "1 step" : `${numSteps} steps`
  if (key === "straight") return `${s} + start/stop`
  if (key === "sideward") return `${s}, ${Math.round(stepSy * 100)} cm/step`
  return "Stumble & recovery"
}

export function ControlPanel({ params, preset, numSteps, sidewardStepSy, sidewardStartStop, activeStep, steps, onParams, onPreset, onNumSteps, onSidewardStepSy, onSidewardStartStop, onStepSelect }: Props) {
  function set(patch: Partial<GaitParams>) {
    onParams({ ...params, ...patch })
  }

  return (
    <div className="p-3 space-y-3">
      {/* Presets */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Presets</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-1.5">
          {PRESET_LABELS.map(({ key, label }) => {
            // Active preset: show live slider value. Inactive: show that preset's own default.
            const displaySteps = key === preset ? numSteps : (PRESET_DEFAULT_NUM_STEPS[key] ?? numSteps)
            return (
              <Button
                key={key}
                variant={preset === key ? "default" : "outline"}
                size="sm"
                className="w-full justify-start gap-2 h-auto py-2"
                onClick={() => onPreset(key)}
              >
                <div className="text-left">
                  <div className="text-xs font-medium">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{presetDescription(key, displaySteps, sidewardStepSy)}</div>
                </div>
              </Button>
            )
          })}
          {preset !== "custom" && (
            <ParamSlider
              label="Number of steps"
              value={numSteps}
              min={1} max={12} step={1} unit=""
              onChange={onNumSteps}
            />
          )}
          {preset === "sideward" && (
            <ParamSlider
              label="Step width s_y"
              value={sidewardStepSy}
              min={0.1} max={0.5} step={0.01} unit="m"
              onChange={onSidewardStepSy}
            />
          )}
          {preset === "sideward" && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={sidewardStartStop}
                onChange={e => onSidewardStartStop(e.target.checked)}
                className="accent-primary cursor-pointer"
              />
              Include start / stop
            </label>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Physical Parameters */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Physical Parameters</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-3">
          <ParamSlider
            label="CoM Height z_c" value={params.zc}
            min={0.4} max={1.2} step={0.01} unit="m"
            onChange={(v) => set({ zc: v })}
          />
          <ParamSlider
            label="Support Period T_sup" value={params.tSup}
            min={0.3} max={1.5} step={0.05} unit="s"
            onChange={(v) => set({ tSup: v })}
          />
          <ParamSlider
            label="Gravity g" value={params.g}
            min={1.0} max={20.0} step={0.01} unit="m/s²"
            onChange={(v) => set({ g: v })}
          />
        </CardContent>
      </Card>

      {/* Foot Placement Weights */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Foot Placement Weights</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-3">
          <ParamSlider
            label="Position weight a" value={params.a}
            min={0.1} max={50} step={0.1} unit=""
            onChange={(v) => set({ a: v })}
          />
          <ParamSlider
            label="Velocity weight b" value={params.b}
            min={0.1} max={20} step={0.1} unit=""
            onChange={(v) => set({ b: v })}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Step Table */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Step Data</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] px-2 w-8">n</TableHead>
                <TableHead className="text-[10px] px-1 text-right">p_x*</TableHead>
                <TableHead className="text-[10px] px-1 text-right">p_y*</TableHead>
                <TableHead className="text-[10px] px-1 text-right">x̄</TableHead>
                <TableHead className="text-[10px] px-1 text-right">ȳ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((s) => (
                <TableRow
                  key={s.n}
                  className={`cursor-pointer text-[10px] ${activeStep === s.n ? "bg-primary/10" : ""}`}
                  onClick={() => onStepSelect(activeStep === s.n ? null : s.n)}
                >
                  <TableCell className="px-2 font-mono">{s.n}</TableCell>
                  <TableCell className="px-1 font-mono text-right">{fmt(s.pxStar)}</TableCell>
                  <TableCell className="px-1 font-mono text-right">{fmt(s.pyStar)}</TableCell>
                  <TableCell className="px-1 font-mono text-right">{fmt(s.xBar)}</TableCell>
                  <TableCell className="px-1 font-mono text-right">{fmt(s.yBar)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
