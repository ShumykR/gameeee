import { Graphics } from 'pixi.js';
import type { World, Body } from 'planck';

/** Draws every fixture's collision shape (toggle with ?debug=1 or the ` key). */
export function drawPhysicsDebug(g: Graphics, world: World) {
  g.clear();
  for (let b: Body | null = world.getBodyList(); b; b = b.getNext()) {
    const xf = b.getTransform();
    for (let f = b.getFixtureList(); f; f = f.getNext()) {
      const s = f.getShape();
      const color = f.isSensor() ? 0xff40ff : b.isStatic() ? 0x40ff80 : b.isKinematic() ? 0x40c0ff : 0xffff40;
      const type = s.getType();
      if (type === 'circle') {
        const c = (s as any).m_p;
        const r = s.getRadius();
        const x = xf.p.x + xf.q.c * c.x - xf.q.s * c.y;
        const y = xf.p.y + xf.q.s * c.x + xf.q.c * c.y;
        g.circle(x, y, r).stroke({ color, width: 0.04 });
        const a = b.getAngle();
        g.moveTo(x, y).lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r).stroke({ color, width: 0.04 });
      } else if (type === 'polygon' || type === 'chain' || type === 'edge') {
        const vs: { x: number; y: number }[] = (s as any).m_vertices ?? [(s as any).m_vertex1, (s as any).m_vertex2];
        const pts = vs.map((v) => ({ x: xf.p.x + xf.q.c * v.x - xf.q.s * v.y, y: xf.p.y + xf.q.s * v.x + xf.q.c * v.y }));
        if (!pts.length) continue;
        g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        if (type === 'polygon') g.closePath();
        g.stroke({ color, width: 0.04 });
      }
    }
  }
  for (let j = world.getJointList(); j; j = j.getNext()) {
    const a = j.getAnchorA(), bb = j.getAnchorB();
    g.moveTo(a.x, a.y).lineTo(bb.x, bb.y).stroke({ color: 0xff8040, width: 0.05 });
  }
}
