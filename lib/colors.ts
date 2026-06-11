export const STEP_COLORS = [
  "#3b82f6", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
]

export const stepColor = (n: number) => STEP_COLORS[n % STEP_COLORS.length]
