"use client"

import { useRef, useMemo, useEffect, useCallback, MutableRefObject } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Grid, Line, Box } from "@react-three/drei"
import * as THREE from "three"
import type { LIPMResult, GaitParams } from "@/lib/types"
import { stepColor } from "@/lib/colors"

interface Props {
  result: LIPMResult
  params: GaitParams
  activeStep: number | null
  onStepSelect: (n: number | null) => void
}

const toThree = (x: number, y: number, z: number) => new THREE.Vector3(x, z, -y)

// ── CoM trajectory lines ────────────────────────────────────────────────────
function TrajectoryLines({ result, activeStep }: { result: LIPMResult; activeStep: number | null }) {
  const segments = useMemo(() => {
    const map = new Map<number, THREE.Vector3[]>()
    for (const pt of result.trajectory) {
      if (!map.has(pt.step)) map.set(pt.step, [])
      map.get(pt.step)!.push(toThree(pt.x, pt.y, pt.z))
    }
    return map
  }, [result])

  return (
    <>
      {Array.from(segments.entries()).map(([step, pts]) => (
        <Line
          key={step}
          points={pts}
          color={stepColor(step)}
          lineWidth={activeStep === null || activeStep === step ? 2.5 : 0.8}
          opacity={activeStep === null || activeStep === step ? 1 : 0.25}
          transparent
        />
      ))}
    </>
  )
}

// ── Foot placement markers ──────────────────────────────────────────────────
function FootMarkers({ result, activeStep, onStepSelect }: {
  result: LIPMResult
  activeStep: number | null
  onStepSelect: (n: number | null) => void
}) {
  return (
    <>
      {result.steps.map((s) => {
        const isActive = activeStep === s.n
        const color = stepColor(s.n)
        return (
          <group key={s.n} position={[s.pxStar, 0, -s.pyStar]}>
            <Box
              args={[0.14, 0.012, 0.08]}
              onClick={() => onStepSelect(isActive ? null : s.n)}
            >
              <meshStandardMaterial color={color} opacity={isActive ? 1 : 0.55} transparent />
            </Box>
          </group>
        )
      })}
    </>
  )
}

// ── Animated CoM sphere + live pendulum rod ─────────────────────────────────
const _foot = new THREE.Vector3()
const _com  = new THREE.Vector3()
const _dir  = new THREE.Vector3()
const _mid  = new THREE.Vector3()
const _up   = new THREE.Vector3(0, 1, 0)

function AnimatedElements({ result }: { result: LIPMResult }) {
  const comRef      = useRef<THREE.Mesh>(null!)
  const rodRef      = useRef<THREE.Group>(null!)
  const footGlowRef = useRef<THREE.Mesh>(null!)
  const tRef        = useRef(0)

  useEffect(() => { tRef.current = 0 }, [result])

  useFrame((_, delta) => {
    const traj = result.trajectory
    if (!traj.length) return
    const totalTime = traj[traj.length - 1].t
    tRef.current = (tRef.current + delta * 0.5) % totalTime
    const idx = Math.round((tRef.current / totalTime) * (traj.length - 1))
    const pt  = traj[Math.max(0, Math.min(idx, traj.length - 1))]
    if (!pt) return
    const step = result.steps[pt.step]
    comRef.current?.position.set(pt.x, pt.z, -pt.y)
    if (step) {
      _foot.set(step.pxStar, 0, -step.pyStar)
      _com.set(pt.x, pt.z, -pt.y)
      footGlowRef.current?.position.copy(_foot)
      _dir.subVectors(_com, _foot)
      const length = _dir.length()
      _mid.addVectors(_foot, _com).multiplyScalar(0.5)
      if (length > 0.001 && rodRef.current) {
        rodRef.current.position.copy(_mid)
        rodRef.current.scale.set(1, length, 1)
        rodRef.current.quaternion.setFromUnitVectors(_up, _dir.normalize())
      }
    }
  })

  return (
    <>
      <group ref={rodRef}>
        <mesh>
          <cylinderGeometry args={[0.007, 0.007, 1, 8]} />
          <meshStandardMaterial color="#94a3b8" opacity={0.85} transparent />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>
      <mesh ref={footGlowRef}>
        <cylinderGeometry args={[0.045, 0.045, 0.004, 20]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#7dd3fc" emissiveIntensity={0.6} transparent opacity={0.7} />
      </mesh>
      <mesh ref={comRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" emissive="#7dd3fc" emissiveIntensity={0.7} />
      </mesh>
    </>
  )
}

// ── Camera constants ────────────────────────────────────────────────────────
const CAM_POS:    [number, number, number] = [1.5, 1.8, 2.5]
const CAM_TARGET: [number, number, number] = [0.5, 0.3, 0]
const _flyDir = new THREE.Vector3()

// ── All native event handling in one place ──────────────────────────────────
// Keeps React's synthetic event system away from OrbitControls' DOM listeners.
function CanvasEvents({ onReset }: { onReset: (fn: () => void) => void }) {
  const { camera, controls, gl } = useThree() as any

  const reset = useCallback(() => {
    camera.position.set(...CAM_POS)
    if (controls) { controls.target.set(...CAM_TARGET); controls.update() }
  }, [camera, controls])

  useEffect(() => { onReset(reset) }, [reset, onReset])

  // Keep camera above the ground plane after every frame
  useFrame(() => {
    if (camera.position.y < 0.01) {
      camera.position.y = 0.01
      if (controls) controls.update()
    }
  })

  useEffect(() => {
    const el = gl.domElement as HTMLCanvasElement

    // Fly zoom — moves camera + target together so there's no target wall
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      camera.getWorldDirection(_flyDir)
      const speed = e.deltaY * -0.002
      camera.position.addScaledVector(_flyDir, speed)
      if (controls) { controls.target.addScaledVector(_flyDir, speed); controls.update() }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault()
      // On left-drag start: snap target to the point directly in front of the
      // camera at the current orbit distance so rotation always feels centered.
      if (e.button === 0 && controls) {
        const dist = camera.position.distanceTo(controls.target)
        camera.getWorldDirection(_flyDir)
        controls.target.copy(camera.position).addScaledVector(_flyDir, Math.max(dist, 0.1))
        controls.update()
      }
    }

    // Block right-click context menu
    const onContextMenu = (e: MouseEvent) => e.preventDefault()

    // Double-click to reset
    const onDblClick = () => reset()

    el.addEventListener("wheel",       onWheel,       { passive: false })
    el.addEventListener("mousedown",   onMouseDown,   { passive: false })
    el.addEventListener("contextmenu", onContextMenu)
    el.addEventListener("dblclick",    onDblClick)

    return () => {
      el.removeEventListener("wheel",       onWheel)
      el.removeEventListener("mousedown",   onMouseDown)
      el.removeEventListener("contextmenu", onContextMenu)
      el.removeEventListener("dblclick",    onDblClick)
    }
  }, [camera, controls, gl, reset])

  return null
}

// ── Full scene ──────────────────────────────────────────────────────────────
function Scene({ result, params, activeStep, onStepSelect, resetRef }: Props & { resetRef: React.MutableRefObject<() => void> }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#7dd3fc" />

      <Grid
        args={[12, 12]}
        cellSize={0.1}
        cellThickness={0.4}
        sectionSize={0.5}
        sectionThickness={0.9}
        fadeDistance={14}
        position={[0, -0.006, 0]}
      />

      <TrajectoryLines result={result} activeStep={activeStep} />
      <FootMarkers result={result} activeStep={activeStep} onStepSelect={onStepSelect} />
      <AnimatedElements result={result} />

      <OrbitControls
        makeDefault
        enableZoom={false}
        screenSpacePanning
        rotateSpeed={0.4}
        panSpeed={0.4}
        maxPolarAngle={Math.PI / 2}
        mouseButtons={{
          LEFT:   THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT:  THREE.MOUSE.ROTATE,
        }}
      />
      <CanvasEvents onReset={(fn) => { resetRef.current = fn }} />

    </>
  )
}

export function Viewport3D(props: Props) {
  const resetRef = useRef<() => void>(() => {})
  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ position: CAM_POS, fov: 45, near: 0.001 }} className="w-full h-full">
        <Scene {...props} resetRef={resetRef} />
      </Canvas>
      <button
        onClick={() => resetRef.current?.()}
        className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded bg-background/70 border text-muted-foreground hover:text-foreground backdrop-blur-sm"
      >
        Reset view
      </button>
    </div>
  )
}
