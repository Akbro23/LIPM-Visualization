"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"

interface Props {
  direction: "horizontal" | "vertical"
  onResize: (delta: number) => void
  className?: string
}

export function ResizeHandle({ direction, onResize, className }: Props) {
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      let lastPos = direction === "horizontal" ? e.clientX : e.clientY

      const onMove = (e: MouseEvent) => {
        const pos = direction === "horizontal" ? e.clientX : e.clientY
        onResize(pos - lastPos)
        lastPos = pos
      }
      const onUp = () => {
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }
      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [direction, onResize]
  )

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "shrink-0 bg-border transition-colors hover:bg-primary/50 active:bg-primary select-none",
        direction === "horizontal"
          ? "w-[3px] cursor-col-resize"
          : "h-[3px] cursor-row-resize",
        className
      )}
    />
  )
}
