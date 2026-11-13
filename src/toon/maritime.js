// HeyMariner maritime worlds on top of the toon engine (src/toon/engine, adapted from the RicksClips-Engine).
// buildToonStory(spec) returns a story object for engine start(): a set (ship deck, bridge, engine room, quay,
// lifeboat station, office), a cast of seafarer roles, beats keyed to spoken times, and a camera plan.
// Everything is a pure function of the scene parameters and the seed, so every render agrees.

export const TOON_SETS = ["deck", "bridge", "engineroom", "quay", "lifeboat", "office"];
export const TOON_ROLES = ["master", "officer", "cadet", "engineer", "rating", "pilot", "inspector"];
export const TOON_FX = ["smoke", "steam", "splash", "sparkle", "ring", "dust", "exclaim", "question", "stars", "sweat", "burst"];

// ---------- roles: one identity feature each, same toon style ----------
const ROLE_LOOK = {
  master: { outfit: "uniform", top: "#1d2b4f", accent: "#e3b341", hat: "cap", hatColor: "#f4f4f0", beard: true, hair: "#b9b4ae" },
  officer: { outfit: "shirt", top: "#f4f6f8", accent: "#1d2b4f", hat: "cap", hatColor: "#1d2b4f" },
  cadet: { outfit: "overalls", top: "#f07c1b", accent: "#2b2f36", hat: "hardhat", hatColor: "#f4f4f0" },
  engineer: { outfit: "overalls", top: "#2b5fa8", accent: "#f5c518", hat: "hardhat", hatColor: "#f5c518" },
  rating: { outfit: "overalls", top: "#d64532", accent: "#2b2f36", hat: "hardhat", hatColor: "#f4f4f0" },
  pilot: { outfit: "coat", top: "#ff7a1a", accent: "#f4f4f0", hat: "none" },
  inspector: { outfit: "suit", top: "#4a4f5a", accent: "#2f9e8f", glasses: true, hat: "none" },
};

const lerp = (a, b, k) => a + (b - a) * k;

/**
 * @param {object} p  { set, time, cast:[{role, face, arms}], beats:[{t, who, face, arms, fx, hop, walk:[x,z]}],
 *                      shot, move, seconds, seed, accent }
 */
export function buildToonStory(p) {
  const set = TOON_SETS.includes(p.set) ? p.set : "deck";
  const seconds = Math.max(1.5, p.seconds || 6);
  const time = ["day", "golden", "night"].includes(p.time) ? p.time : "day";
  const castDefs = (p.cast && p.cast.length ? p.cast : [{ role: "officer" }]).slice(0, 3);
  const beats = (p.beats || []).filter((b) => b && Number.isFinite(b.t));
  return {
    seed: p.seed || 1,
    words: [],
    captions: false,
    // speed on software GL (GitHub runners): small shadow map, no MSAA (the ink pass draws the edges), 4 bloom levels
    shadowMap: 1024,
    msaa: 0,
    bloomLevels: 4,
    light: set === "bridge" || set === "engineroom" || set === "office" ? "interior" : time,
    build(api) {
      const { W, kit, mat, glow, cast, fx, makeLook, rand, aim, aerial, THREE, prop, lights, makePalette } = api;
      const pal = makePalette(rand.fork(3), { family: SET_FAMILY[set], accent: "orange" });
      const M = (kind, color, extra = {}) => mat(kind, { color, ...extra });
      const add = (obj, o = {}) => W.add(obj, o);
      const group = () => new THREE.Group();
      const B = (w, h, d, m, o) => kit.box(w, h, d, m, o);
      const C = (rt, rb, h, m, o) => kit.cyl(rt, rb, h, m, o);

      // stage marks where the cast stands (x, z), the hero point the camera frames, and the shot distance
      let marks = [[-0.9, 0.6], [0.9, 0.3], [0, -0.6]];
      let hero = [0, 1.2, 0];
      let wideDist = 9;

      const sea = (y = -0.6, color = "#2f7fb6") => kit.water(W, { x: 0, z: -20, w: 400, d: 400, color, y });
      const hullSide = (x, z, len, h, ry = 0) => {
        const g = group();
        g.add(B(len, h, 0.6, M("flat", "#20324f"), { y: h / 2 - 3 }));
        g.add(B(len, 0.9, 0.62, M("flat", "#a8382c"), { y: -2.6 }));
        g.add(B(len, 0.12, 0.64, M("flat", "#f2f2ee"), { y: h - 3.05 }));
        g.position.set(x, 0, z); g.rotation.y = ry;
        return add(g, { name: "hull" });
      };
      const railing = (a, b) => kit.fence(W, a, b, { color: "#eef1f4", h: 1.05, gap: 0.5 });
      const bollard = (x, z) => {
        const g = group();
        g.add(B(0.9, 0.12, 0.45, M("flat", "#2b2f36"), { y: 0.06 }));
        for (const s of [-1, 1]) { g.add(C(0.13, 0.15, 0.55, M("flat", "#2b2f36"), { x: s * 0.24, y: 0.4 })); g.add(C(0.18, 0.18, 0.05, M("flat", "#2b2f36"), { x: s * 0.24, y: 0.7 })); }
        g.position.set(x, 0, z); return add(g, { name: "bollard" });
      };
      const containers = (x, z, cols, rows, ry = 0) => {
        const colors = ["#c8463a", "#2f6fb5", "#e0a32e", "#3d8f5a", "#8a5a9e", "#d9dde2"];
        const g = group(); let i = 0;
        for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
          const col = colors[(i++ * 7 + c) % colors.length];
          g.add(B(2.4, 2.5, 6, M("planks", col, { repeat: [3, 1] }), { x: c * 2.5, y: 1.26 + r * 2.52 }));
        }
        g.position.set(x, 0, z); g.rotation.y = ry; return add(g, { name: "containers" });
      };
      const sign = (text, o) => add(kit.signBoard(text, o), { collide: false });

      if (set === "deck" || set === "lifeboat") {
        sea();
        kit.ground(W, { kind: "slabs", color: set === "deck" ? "#5f7e66" : "#7a8a92", size: 30 });
        railing([-7, 4], [7, 4]); railing([-7, 4], [-7, -14]); railing([7, 4], [7, -14]);
        bollard(-5.2, 2.6); bollard(5.2, 2.6);
        // hatch covers and a deck crane
        for (const z of [-4, -9.5]) add(B(8, 1.1, 4.4, M("flat", "#2f5f8a"), { y: 0.55, z }), { name: "hatch" });
        const crane = group();
        crane.add(C(0.45, 0.55, 5.5, M("flat", "#e8b93a"), { y: 2.75 }));
        crane.add(B(1.6, 1.4, 1.6, M("flat", "#e8b93a"), { y: 6 }));
        crane.add(B(0.4, 0.4, 9, M("flat", "#e8b93a"), { y: 7.2, z: -3.5, rx: -0.45 }));
        crane.position.set(5.8, 0, -7); add(crane, { name: "crane" });
        containers(-6.5, -16, 3, 2);
        // accommodation block with the bridge windows
        const acc = group();
        acc.add(B(12, 9, 6, M("plaster", "#eef0f2"), { y: 4.5 }));
        for (let i = 0; i < 7; i++) acc.add(B(1.2, 0.8, 0.05, M("flat", "#35506e"), { x: -4.8 + i * 1.6, y: 8, z: 3.03 }));
        for (let i = 0; i < 5; i++) acc.add(B(0.6, 0.6, 0.05, M("flat", "#35506e"), { x: -3.6 + i * 1.8, y: 5, z: 3.03 }));
        acc.position.set(0, 0, -25); add(acc, { name: "accommodation" });
        prop.extinguisher(W, { pal, x: -6.4, z: 1.2 });
        prop.cone(W, { pal, x: 2.6, z: 2.2 });
        if (set === "lifeboat") {
          // gravity davit with an enclosed orange lifeboat over the side
          const davit = group();
          for (const s of [-1, 1]) davit.add(B(0.25, 3.4, 0.25, M("flat", "#dfe3e8"), { x: s * 2.2, y: 1.7 }));
          davit.add(B(4.9, 0.25, 0.25, M("flat", "#dfe3e8"), { y: 3.45 }));
          const boat = group();
          boat.add(B(4.4, 1.0, 1.7, M("flat", "#f26b1d"), { y: 0 }));
          boat.add(B(4.0, 0.7, 1.5, M("flat", "#f26b1d"), { y: 0.85 }));
          boat.add(B(4.42, 0.25, 1.72, M("flat", "#f4f4f0"), { y: -0.35 }));
          for (let i = 0; i < 4; i++) boat.add(B(0.3, 0.25, 0.02, M("flat", "#1d2b4f"), { x: -1.2 + i * 0.8, y: 0.9, z: 0.77 }));
          boat.position.set(0, 2.4, 0); davit.add(boat);
          davit.position.set(-7.8, 0, -1.5); davit.rotation.y = Math.PI / 2; add(davit, { name: "lifeboat" });
          sign("MUSTER STATION", { x: -3.5, y: 2.3, z: -2.2, w: 2.6, h: 0.5, bg: "#1f8f4e", fg: "#ffffff" });
          prop.locker(W, { pal, x: 2.6, z: -2.4, n: 2 });
          marks = [[-3.2, 0.2], [-1.6, 0.8], [-4.4, 1.2]]; hero = [-4.5, 1.6, -0.5];
        } else {
          sign("SAFETY FIRST", { x: 0, y: 3.2, z: -21.9, w: 3.2, h: 0.6, bg: "#f5c518", fg: "#1d2b4f" });
          marks = [[-1.2, 0.8], [1.2, 0.4], [0, -0.8]]; hero = [0, 1.3, 0];
        }
        wideDist = 10;
      } else if (set === "quay") {
        sea(-1.2, "#2a72a8");
        kit.ground(W, { kind: "stone", color: "#9aa0a6", size: 60, y: 0 });
        add(B(80, 2, 30, M("stone", "#8f959b"), { y: -1, z: 13 }), { name: "quay", collide: false });
        add(B(80, 0.25, 0.4, M("flat", "#f5c518"), { y: 0.13, z: -1.8 }), { name: "edge", collide: false });
        hullSide(0, -4.6, 60, 9, 0);
        for (const x of [-9, -3, 3, 9]) bollard(x, -1);
        // mooring lines from the ship to the bollards
        for (const [x, ang] of [[-9, 0.5], [-3, 0.25], [3, -0.25], [9, -0.5]]) {
          const line = C(0.05, 0.05, 6.5, M("flat", "#f0d9a0"), { x: x + Math.sin(ang) * 2.8, y: 2.4, z: -2.6, rx: 1.05, rz: ang, seg: 8 });
          add(line, { collide: false, name: "line" });
        }
        prop.crateStack(W, { pal, x: -7, z: 5 }); prop.streetLamp(W, { pal, x: 6, z: 4 });
        prop.cone(W, { pal, x: 1, z: 1.5 }); prop.cone(W, { pal, x: 1.8, z: 1.5 });
        containers(-14, 9, 4, 2, Math.PI / 2);
        sign("BERTH 7", { x: -6, y: 3.2, z: -1.4, w: 2.2, h: 0.55, bg: "#1d2b4f", fg: "#ffffff" });
        marks = [[-1.5, 1.6], [0.8, 2.2], [2.4, 1.4]]; hero = [0, 1.4, 1.2]; wideDist = 11;
      } else if (set === "bridge") {
        kit.ground(W, { kind: "slabs", color: "#6e7a86", size: 40 });
        sea(-8, "#2f7fb6");
        const room = kit.room(W, { x: 0, z: 0, w: 12, d: 8, h: 3.4, wall: "plaster", wallColor: "#e9ecef", floor: "slabs", floorColor: "#5e6a76" });
        // forward windows: sky and sea beyond
        for (let i = 0; i < 6; i++) add(B(1.7, 1.4, 0.06, M("flat", "#9fd0f2", { unlit: true }), { x: -4.4 + i * 1.78, y: 2.2, z: -3.95 }), { collide: false, name: "window" });
        // consoles with radar and ECDIS screens
        add(B(9.5, 1.0, 1.0, M("flat", "#3a4350"), { y: 0.5, z: -2.9 }), { name: "console" });
        const radar = (g, w, h) => { g.fillStyle = "#02140b"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2bd46b"; g.lineWidth = 3; for (const r of [0.2, 0.33, 0.46]) { g.beginPath(); g.arc(w / 2, h / 2, r * h, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w * 0.86, h * 0.2); g.stroke(); g.fillStyle = "#9cf5b8"; g.fillRect(w * 0.62, h * 0.34, 8, 8); g.fillRect(w * 0.3, h * 0.6, 8, 8); };
        const ecdis = (g, w, h) => { g.fillStyle = "#0c3a5c"; g.fillRect(0, 0, w, h); g.fillStyle = "#e9d8a6"; g.beginPath(); g.moveTo(0, h * 0.7); g.bezierCurveTo(w * 0.3, h * 0.55, w * 0.5, h * 0.9, w, h * 0.65); g.lineTo(w, h); g.lineTo(0, h); g.fill(); g.setLineDash([12, 8]); g.strokeStyle = "#ff4fa3"; g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.1, h * 0.2); g.lineTo(w * 0.85, h * 0.45); g.stroke(); };
        lights.screen({ x: -2.6, y: 1.35, z: -2.42, w: 1.1, h: 0.8, paint: radar, brightness: 1.4 });
        lights.screen({ x: 0.2, y: 1.35, z: -2.42, w: 1.3, h: 0.8, paint: ecdis, brightness: 1.4 });
        lights.screen({ x: 2.9, y: 1.35, z: -2.42, w: 1.0, h: 0.7, paint: radar, brightness: 1.2 });
        // helm and chart table
        const helm = group(); helm.add(C(0.18, 0.25, 1.0, M("flat", "#3a4350"), { y: 0.5 })); helm.add(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 8, 24), M("wood", "#8a5a36"))); helm.children[1].position.set(0, 1.15, 0.1);
        helm.position.set(0, 0, -1.4); add(helm, { name: "helm" });
        kit.table(W, { x: 4.4, z: 1.5, w: 1.8, d: 1.1, h: 0.95, color: "#6b4a32" });
        prop.chair(W, { pal, x: -3.8, z: -1.6 });
        prop.clock(W, { pal, x: -5.9, y: 2.6, z: 1, ry: Math.PI / 2 });
        prop.extinguisher(W, { pal, x: 5.6, z: -2.6 });
        lights.practical({ kind: "ceiling", x: 0, y: 3.3, z: 0.5, light: true, intensity: 1.4 });
        marks = [[-1.4, 0.3], [1.3, 0.6], [3.6, 1.2]]; hero = [0, 1.4, -0.6]; wideDist = 7.5;
        void room;
      } else if (set === "engineroom") {
        kit.ground(W, { kind: "slabs", color: "#4c5560", size: 40 });
        kit.room(W, { x: 0, z: 0, w: 14, d: 10, h: 5, wall: "plaster", wallColor: "#c9d2d6", floor: "slabs", floorColor: "#55606b" });
        // main engine block with cylinder covers
        const eng = group();
        eng.add(B(9, 2.6, 2.6, M("flat", "#3d6f8f"), { y: 1.3 }));
        eng.add(B(9.2, 0.3, 2.8, M("flat", "#2c5068"), { y: 2.75 }));
        for (let i = 0; i < 6; i++) { eng.add(C(0.45, 0.5, 0.6, M("flat", "#9aa4ad"), { x: -3.75 + i * 1.5, y: 3.2 })); eng.add(C(0.06, 0.06, 1.2, M("flat", "#c94a3a"), { x: -3.75 + i * 1.5, y: 3.9, z: 0.3 })); }
        for (let i = 0; i < 6; i++) eng.add(B(0.06, 2.4, 0.04, M("flat", "#2c5068"), { x: -3.75 + i * 1.5 + 0.75, y: 1.3, z: 1.32 }));
        eng.add(B(1.6, 0.5, 0.04, M("flat", "#e8e2c8"), { x: -2.2, y: 1.9, z: 1.33 }));
        eng.add(B(9.4, 0.08, 0.08, M("flat", "#e8b93a"), { y: 1.0, z: 2.0 })); eng.add(B(9.4, 0.08, 0.08, M("flat", "#e8b93a"), { y: 0.55, z: 2.0 }));
        for (let i = 0; i < 7; i++) eng.add(B(0.07, 1.0, 0.07, M("flat", "#e8b93a"), { x: -4.5 + i * 1.5, y: 0.5, z: 2.0 }));
        eng.position.set(0, 0, -2.6); add(eng, { name: "main engine" });
        for (const [y, z, len, c] of [[4.2, -4.4, 13, "#c94a3a"], [3.8, -4.6, 13, "#2f8fd8"], [4.5, 4.4, 13, "#e8b93a"]]) add(C(0.12, 0.12, len, M("flat", c), { y, z, rz: Math.PI / 2, seg: 10 }), { collide: false, name: "pipe" });
        // gauges board (back wall, right of the engine), control console (right), workbench (left)
        const board = group(); board.add(B(2.4, 1.4, 0.1, M("flat", "#2b2f36"), {}));
        for (let i = 0; i < 4; i++) { board.add(C(0.22, 0.22, 0.04, M("flat", "#f4f4f0"), { x: -0.85 + i * 0.57, y: 0.2, z: 0.06, rx: Math.PI / 2 })); board.add(B(0.02, 0.18, 0.02, M("flat", "#c94a3a"), { x: -0.85 + i * 0.57, y: 0.25, z: 0.1, rz: 0.6 - i * 0.3 })); }
        board.position.set(5.6, 2.0, -4.85); add(board, { name: "gauges" });
        add(B(2.6, 1.0, 0.9, M("flat", "#46505c"), { x: 4.6, y: 0.5, z: 0.4 }), { name: "console" });
        lights.screen({ x: 4.6, y: 1.45, z: 0.4, w: 1.2, h: 0.7, brightness: 1.3, paint: (g, w, h) => { g.fillStyle = "#0b2236"; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { const v = ((i * 37) % 10) / 10; g.fillStyle = i === 5 ? "#ff5a4a" : "#3fd38a"; g.fillRect(w * 0.08 + i * w * 0.11, h * (0.85 - 0.5 * v), w * 0.07, h * 0.5 * v); } } });
        prop.workbench(W, { pal, x: -5.2, z: 1.6, ry: Math.PI / 2 });
        prop.toolBoard(W, { pal, x: -6.9, y: 1.8, z: 1.6, ry: Math.PI / 2 });
        prop.extinguisher(W, { pal, x: -6.4, z: -3.6 }); prop.ladder(W, { pal, x: 6.6, z: -2.5, ry: -Math.PI / 2 });
        lights.practical({ kind: "panel", x: 0, y: 4.9, z: 1.5, light: true, intensity: 1.6 });
        sign("ENGINE CONTROL", { x: 4.6, y: 2.4, z: -4.8, w: 2.4, h: 0.45, bg: "#1d2b4f", fg: "#ffffff" });
        marks = [[-1.6, 1.4], [1.4, 1.8], [3.0, 2.6]]; hero = [0, 1.5, 0.8]; wideDist = 8.5;
      } else {
        // office: shore office / PSC / training room
        kit.ground(W, { kind: "planks", color: "#9a7a5a", size: 40 });
        kit.room(W, { x: 0, z: 0, w: 12, d: 8, h: 3.2, wall: "plaster", wallColor: "#e7e2d6", floor: "planks", floorColor: "#8f6a48" });
        prop.whiteboard(W, { pal, x: -2, y: 1.7, z: -3.9, w: 2.4 });
        prop.desk(W, { pal, x: 2.4, z: -1.5 }); prop.monitor(W, { pal, x: 2.4, y: 0.79, z: -1.6 });
        prop.filingCabinet(W, { pal, x: 5.2, z: -3.3 }); prop.bookshelf(W, { pal, x: -5.4, z: -3.4 });
        prop.plant(W, { pal, x: 5.4, z: 2.4 }); prop.clock(W, { pal, x: 0.8, y: 2.5, z: -3.95 });
        prop.noticeBoard(W, { pal, x: -5.9, y: 1.7, z: 0.5, ry: Math.PI / 2 });
        lights.practical({ kind: "ceiling", x: 0, y: 3.1, z: 0, light: true, intensity: 1.4 });
        sign("PORT STATE CONTROL", { x: -2, y: 2.85, z: -3.9, w: 2.8, h: 0.42, bg: "#1d2b4f", fg: "#ffffff" });
        marks = [[-1.3, 0.6], [1.2, 0.2], [2.8, -0.9]]; hero = [0, 1.4, -0.4]; wideDist = 7;
      }

      // ---------- cast ----------
      const members = castDefs.map((d, i) => {
        const role = TOON_ROLES.includes(d.role) ? d.role : "officer";
        const look = makeLook(rand.fork(10 + i), "adult", { ...ROLE_LOOK[role] });
        const c = cast.add({ name: `c${i}`, look, pos: marks[i % marks.length], h: role === "master" ? 1.78 : 1.72 });
        c.face(0, d.face || "neutral").arms(0, d.arms || "idle");
        if (castDefs.length > 1) c.turn(0, marks[i % marks.length][0] < 0 ? "right" : "left");
        return c;
      });
      // beats land 2 frames before the word, the engine blends faces and arms
      for (const b of beats) {
        const c = members[Math.max(0, Math.min(members.length - 1, b.who || 0))];
        const t = Math.max(0, b.t - 2 / 30);
        if (b.face) c.face(t, b.face);
        if (b.arms) c.arms(t, b.arms);
        if (b.hop) c.hop(t, 0.2);
        if (b.walk) { const from = c.posAt ? c.posAt(t) : marks[0]; c.walk(t, t + 1.6, [from, b.walk]); }
        if (b.fx) {
          const e = c.eyes(t);
          const at = [e.x, e.y + 0.55, e.z];
          if (["exclaim", "question", "stars", "sweat", "burst"].includes(b.fx)) fx.add(b.fx, t, t + 1.2, at, { size: 0.55 });
          else fx.emit(b.fx, t, Math.min(seconds, t + 2.5), b.fx === "smoke" || b.fx === "steam" ? [hero[0] + 1.5, 1.2, hero[2] - 1.5] : at, { size: 0.5 });
        }
      }
      for (let i = 0; i < members.length; i++) members[i].talk(0.2, seconds - 0.3);

      // ---------- camera: establish, then move in on the speaker ----------
      const yaw = lerp(-24, 24, rand());
      const focus = members[0];
      const shot = p.shot || "wide";
      const move = p.move || "push";
      const keys = [];
      if (shot === "aerial") keys.push({ t: 0, ...aerial(hero, { height: 13, tilt: 0.35, yaw }), light: undefined });
      else if (shot === "close") keys.push({ t: 0, ...aim(focus.eyes(0).toArray(), { dist: 2.6, yaw: yaw * 0.6, fov: 34 }), move, lens: { focus: "c0", px: 10 } });
      else if (shot === "medium") keys.push({ t: 0, ...aim([hero[0], hero[1], hero[2]], { dist: wideDist * 0.62, yaw, height: hero[1] + 1.1, fov: 38 }), move, lens: { focus: "c0", px: 6 } });
      else keys.push({ t: 0, ...aim([hero[0], hero[1], hero[2]], { dist: wideDist, yaw, height: hero[1] + 1.6, fov: 38 }), move });
      // a scene longer than ~4.5 s glides to a closer view on the first beat's character
      if (seconds > 4.5 && shot !== "close") {
        const b = beats.find((x) => x.t > 1.2 && x.t < seconds - 1.5);
        const t = b ? Math.max(1.2, b.t - 0.5) : seconds * 0.5;
        const who = members[b ? Math.min(members.length - 1, b.who || 0) : 0];
        const e = who.eyes(t).toArray();
        keys.push({ t, ...aim(e, { dist: 3.4, yaw: -yaw * 0.7, height: e[1] + 0.15, fov: 34 }), glide: 30, move: "push", lens: { focus: `c${members.indexOf(who)}`, px: 8 } });
      }
      return { camera: keys.map((k) => { const o = { ...k }; if (o.light === undefined) delete o.light; return o; }), kicks: [] };
    },
  };
}

const SET_FAMILY = { deck: "teal", lifeboat: "blue", quay: "indigo", bridge: "blue", engineroom: "amber", office: "olive" };
