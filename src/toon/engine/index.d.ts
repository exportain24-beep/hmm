// Types for the plain-JS toon engine (adapted from the RicksClips-Engine).
export function start(story: unknown, ctx: {root: HTMLElement; canvas: HTMLCanvasElement; W: number; H: number; duration: number; style?: Record<string, unknown>}): Promise<{renderAt: (t: number) => void; renderer: {dispose: () => void}}>;
