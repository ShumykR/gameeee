// Shooting accuracy: every shooter fires once at a parked car on flat ground from 5–20 m.
//   npx tsx scripts/shothit.ts      (FOES=id,id to change the targets)
// H = head hit (kill), c = touched the car, . = missed.
import { Game } from '../src/game/game';
import { CARS, CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
const base:any = MAP_BY_ID['meadow'];
const DIST = [5, 8, 12, 16, 20];
const flat = (d:number):any => ({ ...base, id:'flat'+d, bounds:{x0:0,y0:-10,x1:60,y1:26}, spawns:[[15,16],[15+d,16]], solids:[{mat:'grass',pts:[[0,18],[60,18],[60,26],[0,26]]}], platforms:[], hazards:[], props:[], pads:[], movers:[], blocks:[] });
const foes = (process.env.FOES ?? 'sparrow,bulldog,american-car').split(',');
const out:any[] = [];
for (const d of CARS as any[]) {
  if (d.ability?.kind !== 'shoot') continue;
  const row:any = { id: d.id, proj: d.ability.projectile };
  let tot = 0;
  for (const D of DIST) {
    let res = '';
    for (const foe of foes) {
      const g:any = new Game({ cars:[d, CAR_BY_ID[foe]], maps:[flat(D)], randomMaps:false, target:999, roundTime:40, seed:1 });
      let dead = false, touched = false;
      g.on((e:any)=>{ if(e.type==='death' && e.player===1 && e.cause==='hit') dead = true; });
      const se = g.shotEffect.bind(g); g.shotEffect = (id:number,p:number)=>{ if(p===1) touched = true; return se(id,p); };
      for (let k=0;k<400 && g.phase!=='play';k++) g.step(); for (let k=0;k<20;k++) g.step();
      if (dead) { res += '?'; continue; }
      g.useAbility(0);
      for (let k=0;k<240 && !dead;k++) g.step();
      res += dead ? 'H' : touched ? 'c' : '.';
      if (dead) tot++;
    }
    row['d'+D] = res;
  }
  row.kills = tot + '/' + DIST.length*foes.length;
  out.push(row);
}
out.sort((a,b)=>parseInt(a.kills)-parseInt(b.kills));
console.table(out);
{ let k=0,c=0,n=0; const per:any={}; for(const r of out){ for(const D of DIST){ const s=r['d'+D]; per[D]??=[0,0]; for(const ch of s){ n++; if(ch==='H'){k++;per[D][0]++;} if(ch!=='.'){c++;per[D][1]++;} } } }
console.log('TOTAL kills',k,'touch',c,'of',n, JSON.stringify(per), 'zero-kill cars', out.filter(r=>parseInt(r.kills)===0).map(r=>r.id).join(',')); }
