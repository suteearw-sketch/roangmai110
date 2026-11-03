import * as T from "three";
// Original procedural models. No downloaded scene, textures, or character assets.
export function box(
  parent: T.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  metal = 0,
) {
  const m = new T.Mesh(
    new T.BoxGeometry(w, h, d),
    new T.MeshStandardMaterial({ color, roughness: 0.65, metalness: metal }),
  );
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function ball(
  parent: T.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  r: number,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const m = new T.Mesh(
    new T.SphereGeometry(r, 20, 14),
    new T.MeshStandardMaterial({ color, roughness: 0.55 }),
  );
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  parent.add(m);
  return m;
}
function star(parent: T.Object3D, x: number, y: number, z: number, r: number) {
  const shape = new T.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 + Math.PI / 2,
      rr = i % 2 ? r * 0.42 : r;
    const px = Math.cos(a) * rr,
      py = Math.sin(a) * rr;
    i ? shape.lineTo(px, py) : shape.moveTo(px, py);
  }
  shape.closePath();
  const m = new T.Mesh(
    new T.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false }),
    new T.MeshStandardMaterial({ color: "#f2f1dd" }),
  );
  m.position.set(x, y, z);
  parent.add(m);
}
export type Rig = ReturnType<typeof hero>;
export function hero(id: string) {
  const root = new T.Group(),
    body = new T.Group();
  root.add(body);
  const iron = id === "iron-man",
    cap = id === "captain-america",
    thor = id === "thor",
    hulk = id === "hulk",
    spider = id === "spider-man",
    boos = id === "boos";
  const red = "#ae2f32",
    green = "#29483d",
    steel = "#8a9990",
    skin = hulk ? "#77a64d" : "#dab087",
    suit = iron
      ? red
      : cap
        ? "#284d87"
        : thor
          ? "#424c5c"
          : hulk
            ? skin
            : spider
              ? "#b82e3b"
              : green;
  const width = hulk ? 0.87 : 0.62;
  ball(body, suit, 0, 1.18, 0, 0.43, width / 0.43, 1.02, 0.53);
  box(
    body,
    hulk ? "#624274" : suit,
    0,
    0.82,
    0,
    width,
    0.27,
    0.38,
    iron ? 0.65 : 0,
  );
  const head = new T.Group();
  head.position.y = 1.94;
  body.add(head);
  if (boos) {
    ball(head, "#193c30", 0, 0.01, -0.06, 0.36, 1, 1.1, 1);
    box(head, "#a7b5ab", 0, -0.02, 0.25, 0.42, 0.48, 0.1, 0.7);
    for (let i = -2; i <= 2; i++)
      box(head, "#273b32", i * 0.065, -0.18, 0.31, 0.023, 0.1, 0.012);
  } else {
    ball(
      head,
      iron ? "#a7292e" : cap ? "#284d87" : spider ? red : skin,
      0,
      0,
      0,
      0.29,
      1,
      1.15,
      0.86,
    );
    if (iron) box(head, "#d7b36f", 0, -0.01, 0.23, 0.39, 0.43, 0.075, 0.65);
    if (thor) {
      ball(head, "#cbb07a", 0, 0.13, -0.1, 0.3, 1.12, 0.9, 0.85);
      box(head, "#cbb07a", -0.27, -0.11, 0, 0.1, 0.4, 0.25);
      box(head, "#cbb07a", 0.27, -0.11, 0, 0.1, 0.4, 0.25);
    }
    if (hulk) box(head, "#29352b", 0, 0.26, -0.01, 0.48, 0.13, 0.37);
  }
  for (const x of [-0.11, 0.11]) {
    const eye = box(
      head,
      iron ? "#b9f8ff" : spider ? "#ffffff" : "#182d29",
      x,
      0.04,
      boos ? 0.315 : 0.286,
      0.105,
      spider ? 0.12 : 0.045,
      0.028,
    );
    eye.rotation.z = x < 0 ? -0.12 : 0.12;
  }
  if (iron) {
    const core = ball(body, "#bdffff", 0, 1.35, 0.245, 0.095);
    (core.material as T.MeshStandardMaterial).emissive.set("#5ecbdf");
    (core.material as T.MeshStandardMaterial).emissiveIntensity = 2;
    box(body, "#d7b36f", 0, 1.06, 0.23, 0.43, 0.09, 0.05, 0.6);
  }
  if (cap) {
    star(body, 0, 1.37, 0.25, 0.15);
    for (const x of [-0.22, 0, 0.22])
      box(body, "#f5e8d7", x, 0.98, 0.21, 0.095, 0.28, 0.05);
    for (const side of [-1, 1]) {
      const stroke = box(
        head,
        "#f1ecd9",
        side * 0.03,
        0.17,
        0.26,
        0.018,
        0.13,
        0.025,
      );
      stroke.rotation.z = -side * 0.35;
    }
    box(head, "#f1ecd9", 0, 0.15, 0.27, 0.08, 0.017, 0.025);
  }
  if (spider) {
    box(body, "#264e83", 0, 0.98, -0.05, 0.56, 0.3, 0.4);
    ball(body, "#192831", 0, 1.35, 0.25, 0.065, 0.6, 1.4, 0.3);
    for (const side of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const line = box(
          body,
          "#192831",
          side * 0.08,
          1.27 + i * 0.045,
          0.25,
          0.15,
          0.012,
          0.018,
        );
        line.rotation.z = side * (i - 1.5) * 0.4;
      }
    for (let i = -2; i <= 2; i++) {
      const line = box(head, "#273541", i * 0.075, 0, 0.272, 0.01, 0.38, 0.01);
      line.rotation.z = i * 0.2;
    }
    for (const y of [-0.14, -0.05, 0.15])
      box(head, "#273541", 0, y, 0.28, 0.39, 0.009, 0.012);
  }
  if (thor || boos) {
    const cape = box(
      body,
      boos ? "#153c30" : "#932b35",
      0,
      1.1,
      -0.27,
      0.81,
      1.3,
      0.065,
    );
    cape.rotation.x = -0.12;
    if (boos) box(body, steel, 0, 1.35, 0.23, 0.5, 0.3, 0.06, 0.65);
    else
      for (const x of [-0.2, 0.2])
        for (const y of [1.2, 1.47])
          ball(body, "#b4bdc4", x, y, 0.23, 0.085, 1, 1, 0.35);
  }
  const arms: T.Group[] = [],
    legs: T.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(side * (width / 2 + 0.12), 1.51, 0);
    body.add(arm);
    ball(
      arm,
      boos ? "#81928a" : suit,
      0,
      -0.22,
      0,
      0.15,
      hulk ? 1.5 : 1,
      1.95,
      1,
    );
    ball(
      arm,
      iron ? "#d7b36f" : boos ? "#81928a" : suit,
      0,
      -0.56,
      0,
      0.13,
      1,
      1.15,
      1,
    );
    arms.push(arm);
    const leg = new T.Group();
    leg.position.set(side * 0.18, 0.78, 0);
    body.add(leg);
    box(
      leg,
      hulk ? "#624274" : boos ? "#667774" : spider ? "#264e83" : suit,
      0,
      -0.19,
      0,
      0.23,
      0.4,
      0.27,
    );
    const shin = new T.Group();
    shin.position.y = -0.37;
    leg.add(shin);
    box(
      shin,
      boos ? "#667774" : hulk ? skin : iron ? red : spider ? red : suit,
      0,
      -0.18,
      0,
      0.22,
      0.36,
      0.24,
    );
    box(
      shin,
      boos ? "#667774" : hulk ? skin : iron ? red : spider ? red : "#303b4a",
      0,
      -0.34,
      0.08,
      0.25,
      0.15,
      0.41,
    );
    legs.push(leg);
  }
  if (cap) {
    for (const [r, c, z] of [
      [0.42, red, 0],
      [0.33, "#e7e6dc", 0.025],
      [0.24, red, 0.05],
      [0.17, "#254b84", 0.075],
    ] as const) {
      const shield = new T.Mesh(
        new T.CylinderGeometry(r, r, 0.045, 40),
        new T.MeshStandardMaterial({
          color: c,
          metalness: 0.5,
          roughness: 0.4,
        }),
      );
      shield.rotation.x = Math.PI / 2;
      shield.position.set(0, -0.42, 0.17 + z);
      arms[0].add(shield);
    }
    star(arms[0], 0, -0.42, 0.28, 0.13);
  }
  if (thor) {
    box(arms[1], "#76543b", 0, -0.62, 0.15, 0.065, 0.48, 0.065);
    box(arms[1], "#aab4bf", 0, -0.38, 0.15, 0.4, 0.25, 0.24, 0.8);
  }
  const paper = box(arms[1], "#fff4da", 0, -0.54, 0.28, 0.3, 0.015, 0.38);
  paper.visible = false;
  root.traverse((o) => {
    o.userData.hero = id;
  });
  return { root, body, head, arms, legs, paper };
}
export function pose(r: Rig, mode: string, t: number) {
  r.body.position.y = 0;
  r.body.rotation.set(0, 0, 0);
  r.head.rotation.x = 0;
  r.paper.visible = mode === "reading";
  for (const [i, a] of r.arms.entries())
    a.rotation.x =
      mode === "walking"
        ? Math.sin(t * 7 + i * Math.PI) * 0.55
        : mode === "typing"
          ? -0.9 + Math.sin(t * 10 + i) * 0.1
          : mode === "reading"
            ? -0.95
            : 0;
  for (const [i, l] of r.legs.entries()) {
    l.rotation.x =
      mode === "walking"
        ? Math.sin(t * 7 + i * Math.PI) * 0.55
        : ["typing", "reading", "sleeping", "resting"].includes(mode)
          ? -Math.PI / 2
          : 0;
    l.children[1].rotation.x = [
      "typing",
      "reading",
      "sleeping",
      "resting",
    ].includes(mode)
      ? Math.PI / 2
      : 0;
  }
  if (mode !== "walking") {
    r.body.position.y = -0.19;
    if (mode === "sleeping") {
      r.head.rotation.x = 0.55;
      r.body.rotation.x = 0.15;
    }
  } else r.body.position.y = Math.abs(Math.sin(t * 7)) * 0.035;
}
export function dog() {
  const root = new T.Group();
  ball(root, "#b97d43", 0, 0.38, 0, 0.3, 1.7, 0.85, 0.8);
  ball(root, "#d6a366", 0.38, 0.6, 0, 0.22);
  ball(root, "#efce9d", 0.55, 0.55, 0, 0.14, 1.1, 0.65, 0.8);
  ball(root, "#302a26", 0.68, 0.58, 0, 0.045);
  for (const z of [-0.13, 0.13]) {
    ball(root, "#81562f", 0.29, 0.62, z, 0.13, 0.7, 1.6, 0.6);
    ball(root, "#252a28", 0.48, 0.67, z, 0.025);
  }
  const legs: T.Object3D[] = [];
  for (const x of [-0.25, 0.25])
    for (const z of [-0.17, 0.17])
      legs.push(box(root, "#a46e3b", x, 0.16, z, 0.1, 0.3, 0.1));
  const tail = box(root, "#b97d43", -0.5, 0.55, 0, 0.35, 0.08, 0.08);
  tail.rotation.z = 0.6;
  box(root, "#39634d", 0.3, 0.43, 0, 0.1, 0.12, 0.46);
  return { root, legs, tail };
}
