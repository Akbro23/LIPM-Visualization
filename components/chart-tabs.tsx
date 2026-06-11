"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ReferenceDot, ComposedChart,
} from "recharts"
import type { LIPMResult, GaitParams } from "@/lib/types"
import { stepColor } from "@/lib/colors"

interface Props {
  result: LIPMResult
  params: GaitParams
  activeStep: number | null
}

const COLORS = {
  x: "#3b82f6",
  y: "#f59e0b",
  xDot: "#10b981",
  yDot: "#ef4444",
}

const chartConfig = {
  x:    { label: "x (m)",    color: COLORS.x },
  y:    { label: "y (m)",    color: COLORS.y },
  xDot: { label: "ẋ (m/s)", color: COLORS.xDot },
  yDot: { label: "ẏ (m/s)", color: COLORS.yDot },
}

function downsample<T>(arr: T[], maxPoints = 400): T[] {
  if (arr.length <= maxPoints) return arr
  const step = Math.ceil(arr.length / maxPoints)
  return arr.filter((_, i) => i % step === 0)
}

const MARGIN = { top: 4, right: 8, bottom: 4, left: 0 }
const MARGIN_LBL = { top: 4, right: 8, bottom: 20, left: 0 }

export function ChartTabs({ result, params, activeStep }: Props) {
  const traj = result.trajectory

  const positionData = useMemo(() =>
    downsample(traj.map((p) => ({ t: +p.t.toFixed(3), x: +p.x.toFixed(4), y: +p.y.toFixed(4) }))),
    [traj])

  const velocityData = useMemo(() =>
    downsample(traj.map((p) => ({ t: +p.t.toFixed(3), xDot: +p.xDot.toFixed(4), yDot: +p.yDot.toFixed(4) }))),
    [traj])

  const phaseXData = useMemo(() =>
    downsample(traj.map((p) => ({ x: +p.x.toFixed(4), xDot: +p.xDot.toFixed(4) }))),
    [traj])

  const phaseYData = useMemo(() =>
    downsample(traj.map((p) => ({ y: +p.y.toFixed(4), yDot: +p.yDot.toFixed(4) }))),
    [traj])

  const topViewData = useMemo(() =>
    downsample(traj.map((p) => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3), step: p.step }))),
    [traj])

  // One data array per step for per-step line coloring
  const topViewSegments = useMemo(() => {
    const map = new Map<number, { x: number; y: number }[]>()
    for (const pt of topViewData) {
      if (!map.has(pt.step)) map.set(pt.step, [])
      map.get(pt.step)!.push({ x: pt.x, y: pt.y })
    }
    return Array.from(map.entries())
  }, [topViewData])

  // Domain wide enough to include all foot placements (some fall outside CoM range)
  const topViewDomain = useMemo(() => {
    const allX = [...topViewData.map((d) => d.x), ...result.steps.map((s) => s.pxStar)]
    const allY = [...topViewData.map((d) => d.y), ...result.steps.map((s) => s.pyStar)]
    const pad = (arr: number[], p: number): [number, number] =>
      [Math.min(...arr) - p, Math.max(...arr) + p]
    return { x: pad(allX, 0.05), y: pad(allY, 0.02) }
  }, [topViewData, result.steps])

  const exchangeTimes = useMemo(() => {
    const times: number[] = []
    for (let i = 1; i < traj.length; i++) {
      if (traj[i].step !== traj[i - 1].step) times.push(traj[i].t)
    }
    return times
  }, [traj])

  return (
    <Tabs defaultValue="position" className="h-full flex flex-col">
      <TabsList className="mx-3 mt-2 shrink-0 w-fit">
        <TabsTrigger value="position" className="text-xs">CoM Position</TabsTrigger>
        <TabsTrigger value="velocity" className="text-xs">Velocity</TabsTrigger>
        <TabsTrigger value="phase" className="text-xs">Phase Portrait</TabsTrigger>
        <TabsTrigger value="topview" className="text-xs">Top View</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden px-3 pb-2">

        {/* ── CoM Position ───────────────────────────────────────────── */}
        <TabsContent value="position" className="w-full h-full mt-1">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <LineChart data={positionData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: "t (s)", position: "insideBottomRight", offset: -4, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="m" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {exchangeTimes.map((t, i) => (
                <ReferenceLine key={i} x={t} stroke="#888" strokeDasharray="4 2" strokeWidth={0.8} />
              ))}
              <Line type="monotone" dataKey="x" stroke={COLORS.x} dot={false} strokeWidth={1.5} name="x" />
              <Line type="monotone" dataKey="y" stroke={COLORS.y} dot={false} strokeWidth={1.5} name="y" />
            </LineChart>
          </ChartContainer>
        </TabsContent>

        {/* ── Velocity ───────────────────────────────────────────────── */}
        <TabsContent value="velocity" className="w-full h-full mt-1">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <LineChart data={velocityData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} label={{ value: "t (s)", position: "insideBottomRight", offset: -4, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="m/s" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {exchangeTimes.map((t, i) => (
                <ReferenceLine key={i} x={t} stroke="#888" strokeDasharray="4 2" strokeWidth={0.8} />
              ))}
              <Line type="monotone" dataKey="xDot" stroke={COLORS.xDot} dot={false} strokeWidth={1.5} name="ẋ" />
              <Line type="monotone" dataKey="yDot" stroke={COLORS.yDot} dot={false} strokeWidth={1.5} name="ẏ" />
            </LineChart>
          </ChartContainer>
        </TabsContent>

        {/* ── Phase Portrait ─────────────────────────────────────────── */}
        {/* Uses LineChart with numeric XAxis so consecutive trajectory   */}
        {/* points are connected — shows orbital energy curves clearly.    */}
        <TabsContent value="phase" className="h-full mt-1 flex gap-2">
          <ChartContainer config={chartConfig} className="h-full flex-1">
            <LineChart data={phaseXData} margin={MARGIN_LBL}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="x" type="number" domain={["auto", "auto"]} tick={{ fontSize: 10 }} unit="m" label={{ value: "x (m)", position: "insideBottom", offset: -10, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="m/s" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="xDot" stroke={COLORS.x} dot={false} strokeWidth={1.5} name="ẋ" />
            </LineChart>
          </ChartContainer>
          <ChartContainer config={chartConfig} className="h-full flex-1">
            <LineChart data={phaseYData} margin={MARGIN_LBL}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="y" type="number" domain={["auto", "auto"]} tick={{ fontSize: 10 }} unit="m" label={{ value: "y (m)", position: "insideBottom", offset: -10, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="m/s" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="yDot" stroke={COLORS.y} dot={false} strokeWidth={1.5} name="ẏ" />
            </LineChart>
          </ChartContainer>
        </TabsContent>

        {/* ── Top View ───────────────────────────────────────────────── */}
        {/* ComposedChart: LineChart for CoM path + ReferenceDot per foot */}
        <TabsContent value="topview" className="w-full h-full mt-1">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ComposedChart data={topViewData} margin={MARGIN_LBL}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="x" type="number" domain={topViewDomain.x} tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(1)} unit="m" label={{ value: "x (m)", position: "insideBottom", offset: -10, fontSize: 10 }} />
              <YAxis domain={topViewDomain.y} tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(2)} unit="m" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {topViewSegments.map(([step, pts]) => (
                <Line key={step} data={pts} type="linear" dataKey="y" stroke={stepColor(step)} dot={false} strokeWidth={1.5} legendType="none" />
              ))}
              {result.steps.map((s, i) => (
                <ReferenceDot key={i} x={+s.pxStar.toFixed(3)} y={+s.pyStar.toFixed(3)} r={4} fill={stepColor(s.n)} stroke="none" />
              ))}
            </ComposedChart>
          </ChartContainer>
        </TabsContent>

      </div>
    </Tabs>
  )
}
