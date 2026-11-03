import type { Dept } from "./company";
import { desks, walkingRoutes, type Point } from "./office-paths";
export function routePosition(points: Point[], phase: number) {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let distance = (((phase % 1) + 1) % 1) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const a = points[i],
        b = points[i + 1],
        f = distance / lengths[i];
      return {
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        angle: Math.atan2(b.x - a.x, b.y - a.y),
      };
    }
    distance -= lengths[i];
  }
  return { ...points[0], angle: 0 };
}
// These poses are illustrative. Only `active` from agentStatus permits the typing pose.
// At a backend/clock transition a walking actor finishes the current corridor route
// back to its seat before changing pose; no teleport through furniture.
export function officeMotion(
  dept: Dept,
  time: number,
  index: number,
  open: boolean,
  active: boolean,
) {
  const cycle = (time + index * 5) % 68;
  if (!open)
    return {
      ...desks[dept],
      angle: dept === "finance" || dept === "secretary" ? 0 : Math.PI,
      mode: "sleeping",
    };
  if (active)
    return {
      ...desks[dept],
      angle: dept === "finance" || dept === "secretary" ? 0 : Math.PI,
      mode: "typing",
    };
  if (cycle < 40)
    return {
      ...routePosition(walkingRoutes[dept], cycle / 40),
      mode: "walking",
    };
  return {
    ...desks[dept],
    angle: dept === "finance" || dept === "secretary" ? 0 : Math.PI,
    mode: cycle < 54 ? "reading" : "resting",
  };
}
export type MotionState = { elapsed: number; walking: boolean };
export function advanceOfficeMotion(
  state: MotionState,
  dept: Dept,
  dt: number,
  open: boolean,
  active: boolean,
) {
  const shouldSit = !open || active;
  if (shouldSit && state.elapsed === 0) state.walking = false;
  if (shouldSit && !state.walking) {
    state.elapsed = 0;
    return officeMotion(dept, 0, 0, open, active);
  }
  if (!shouldSit && !state.walking && state.elapsed === 0) state.walking = true;
  state.elapsed += dt;
  if (state.walking && state.elapsed >= 40) {
    state.walking = false;
    state.elapsed = 40;
  }
  if (shouldSit && !state.walking) {
    state.elapsed = 0;
    return officeMotion(dept, 0, 0, open, active);
  }
  if (!state.walking && state.elapsed >= 68) {
    state.elapsed = 0;
    state.walking = true;
  }
  return officeMotion(dept, state.elapsed, 0, true, false);
}
