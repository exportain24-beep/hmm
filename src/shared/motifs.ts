// Which animated backdrop a scene uses, and the visual "signature" of a video, shared by the renderer and the validator.
import type {ContentSpec, Motif, SceneSpec} from './types';

const RULES: [RegExp, Motif][] = [
  [/radar|arpa|\bcpa\b|tcpa|target/, 'radar'],
  [/mooring|snap.?back|bollard|hawser|winch|berth|alongside|tug/, 'mooring'],
  [/generator|switchboard|blackout|alternator|breaker|electrical|battery|voltage/, 'generator'],
  [/pump|pipe|valve|ballast|bilge|flow|pressure/, 'pump'],
  [/fire|flame|smoke|co2|extinguish|sprinkler/, 'fire'],
  [/lifeboat|davit|abandon|survival craft|liferaft|muster/, 'lifeboat'],
  [/anchor|windlass|chain|cable|scope/, 'anchor'],
  [/cargo|container|crane|hatch|lashing|stowage|bulk/, 'cargo'],
  [/weather|storm|wind|heavy sea|swell|typhoon|cyclone|visibility|fog/, 'weather'],
  [/hours of rest|rest hours|fatigue|watch(keeping)? schedule|24.hour|hours? in any|work hours/, 'clock'],
  [/bridge team|helm|wheelhouse|watch officer|lookout|steering|autopilot|ecdis display/, 'bridge'],
  [/inspection|psc|port state|audit|survey|certificate|detention|deficienc|checklist|record book/, 'inspection'],
  [/enclosed|oxygen|atmosphere|gas test|permit|\btank|void space|rescue/, 'tank'],
  [/engine|fuel|separator|purifier|boiler|sulphur|ppm|machinery|changeover/, 'engine'],
  [/chart|contour|catzoc|passage|sounding|depth|draught|keel/, 'chart'],
  [/\bimo\b|marpol|solas|stcw|emission|\beca|regulation|convention|in force|areas/, 'globe'],
  [/danger|risk|warning|alarm|collision|night|lights?\b|who gives way|give way|keep clear/, 'lighthouse'],
];

/** Chooses a backdrop from the words of the scene when the script did not name one. */
export const pickMotif = (spec: ContentSpec, scene: SceneSpec): Motif => {
  if (scene.motif) return scene.motif;
  const s = `${scene.label ?? ''} ${scene.heading ?? ''} ${scene.narration}`.toLowerCase();
  for (const [re, m] of RULES) if (re.test(s)) return m;
  const byPillar: Partial<Record<string, Motif>> = {engine: 'engine', regulation: 'globe', environment: 'globe', safety: 'lighthouse', terminology: 'chart', equipment: 'chart', colreg: 'lighthouse', market: 'globe', news: 'voyage'};
  return byPillar[spec.pillar] ?? 'voyage';
};

/** Scene kinds that draw their own topic graphic instead of a backdrop. */
export const VISUAL_KINDS = ['colreg3d', 'contour3d', 'zoc3d', 'radar', 'ukc'];

/** Visual element per scene (endcard excluded): the scene's own graphic kind, or its backdrop motif. */
export const visualsOf = (spec: ContentSpec): string[] =>
  spec.scenes.filter((s) => s.kind !== 'endcard').map((s) => (VISUAL_KINDS.includes(s.kind) ? `kind:${s.kind}` : `motif:${pickMotif(spec, s)}`));

/** Problems with how a video's visuals repeat inside itself and against recent videos. */
export const varietyProblems = (spec: ContentSpec, recent: ContentSpec[]): string[] => {
  const out: string[] = [];
  const v = visualsOf(spec);
  const set = new Set(v);
  if (set.size < Math.min(4, v.length)) out.push(`only ${set.size} different visuals in ${v.length} scenes (need at least ${Math.min(4, v.length)}): give scenes different motifs`);
  const counts = new Map<string, number>();
  for (const x of v) counts.set(x, (counts.get(x) ?? 0) + 1);
  for (const [x, n] of counts) if (n > 2) out.push(`${x} used on ${n} scenes (max 2)`);
  for (const r of recent) {
    const rs = new Set(visualsOf(r));
    const inter = [...set].filter((x) => rs.has(x)).length;
    const jac = inter / new Set([...set, ...rs]).size;
    if (jac > 0.4) out.push(`visuals too similar to "${r.id}" (${Math.round(jac * 100)}% overlap, max 40%): shared ${[...set].filter((x) => rs.has(x)).join(', ')}`);
    if (v[0] === visualsOf(r)[0] && recent.indexOf(r) >= recent.length - 3) out.push(`hook uses the same visual (${v[0]}) as recent video "${r.id}"`);
  }
  return out;
};
