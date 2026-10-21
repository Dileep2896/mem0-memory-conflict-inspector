/** Motion tokens (motion-foundations). Every animation imports from here. */
export const motionTokens = {
  duration: { instant: 0, fast: 0.18, normal: 0.32, slow: 0.6, story: 1.2 },
  easing: { smooth: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  distance: { sm: 8, md: 16, lg: 28, xl: 48 },
  scale: { press: 0.97, subtle: 0.98, pop: 1.03 },
  stagger: 0.08,
} as const;

export const springs = {
  snappy: { type: "spring", stiffness: 420, damping: 32 },
  gentle: { type: "spring", stiffness: 180, damping: 24 },
  slow: { type: "spring", stiffness: 60, damping: 18 },
} as const;
