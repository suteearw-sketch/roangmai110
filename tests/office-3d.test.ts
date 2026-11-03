import { registerHooks } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";
registerHooks({
  resolve(s, c, n) {
    try {
      return n(s, c);
    } catch (e) {
      if (s.startsWith(".") && !s.endsWith(".ts")) return n(s + ".ts", c);
      throw e;
    }
  },
});
const { advanceOfficeMotion, routePosition } = await import(
  "../lib/office-3d-motion.ts"
);
const { walkingRoutes, dogRoute, furniture } = await import(
  "../lib/office-paths.ts"
);
const { officeCharacter } = await import("../lib/office.ts");
const { hero, pose } = await import("../lib/office-3d-models.ts");
await test("fixed cast overrides legacy visuals without mutating saved preferences", () => {
  const old = { development: "sun", marketing: "racer" };
  for (const [d, id] of Object.entries({
    director: "iron-man",
    development: "captain-america",
    finance: "thor",
    marketing: "hulk",
    secretary: "spider-man",
  }))
    assert.equal(officeCharacter(d as never, old).id, id);
  assert.deepEqual(old, { development: "sun", marketing: "racer" });
});
await test("walkers return continuously before new work or midnight sleep, and resume at desk", () => {
  for (const dept of Object.keys(
    walkingRoutes,
  ) as (keyof typeof walkingRoutes)[]) {
    const state = { elapsed: 0, walking: false };
    let last = advanceOfficeMotion(state, dept, 0, true, false);
    for (let i = 0; i < 1800; i++) {
      const active = i >= 200 && i < 800,
        open = i < 1100;
      const p = advanceOfficeMotion(state, dept, 0.05, open, active);
      assert(Math.hypot(p.x - last.x, p.y - last.y) < 2, "no teleport");
      assert(
        !furniture.some(
          (r) =>
            p.x > r.x - 12 &&
            p.x < r.x + r.w + 12 &&
            p.y > r.y - 12 &&
            p.y < r.y + r.h + 12,
        ),
        "furniture clearance",
      );
      if (!active) assert.notEqual(p.mode, "typing");
      last = p;
    }
    assert.equal(last.mode, "sleeping");
  }
});
await test("dog follows closed collision-free corridor", () => {
  for (let i = 0; i < 1000; i++) {
    const p = routePosition(dogRoute, i / 1000);
    assert(
      !furniture.some(
        (r) =>
          p.x > r.x - 12 &&
          p.x < r.x + r.w + 12 &&
          p.y > r.y - 12 &&
          p.y < r.y + r.h + 12,
      ),
    );
  }
});
await test("original rigs have 3D meshes and articulated walking, reading, typing, sleeping poses", () => {
  for (const id of [
    "iron-man",
    "captain-america",
    "thor",
    "hulk",
    "spider-man",
    "boos",
  ]) {
    const rig = hero(id);
    assert.equal(rig.arms.length, 2);
    assert.equal(rig.legs.length, 2);
    let meshes = 0;
    rig.root.traverse((o) => {
      if (o.type === "Mesh") meshes++;
    });
    assert(meshes > 15);
    pose(rig, "walking", 1);
    const leg = rig.legs[0].rotation.x;
    pose(rig, "walking", 1.1);
    assert.notEqual(leg, rig.legs[0].rotation.x);
    pose(rig, "reading", 2);
    assert(rig.paper.visible);
    pose(rig, "typing", 2);
    assert(!rig.paper.visible);
    pose(rig, "sleeping", 2);
    assert(rig.head.rotation.x > 0);
  }
});
