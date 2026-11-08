import type { CarSpec } from '../factory';
import { RETRO } from './retro';
import { HALLOWEEN } from './halloween';
import { WINTER } from './winter';
import { ALIEN } from './alien';
import { DOME } from './dome';
import { DINO } from './dino';
import { ROBO } from './robo';
import { SUMMER } from './summer';
import { SOCCER } from './soccer';
import { CNY } from './cny';
import { RIFT } from './rift';
import { TOYS } from './toys';

/** Every generated car, grouped by collection. */
export const ROSTER: CarSpec[] = [...RETRO, ...HALLOWEEN, ...WINTER, ...ALIEN, ...DOME, ...DINO, ...ROBO, ...SUMMER, ...SOCCER, ...CNY, ...RIFT, ...TOYS];
