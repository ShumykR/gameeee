import type { CarDef, CarPoly, Pt } from './types';
import { buildCar } from './factory';
import { applyKit } from './kit';
import { skinOriginal } from './originals';
import { ROSTER } from './roster/index';

/** Axis-aligned box polygon helper (car-local meters, y down). */
export const box = (x0: number, y0: number, x1: number, y1: number, extra: Partial<CarPoly> = {}): CarPoly => ({
  pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
  ...extra,
});
export const poly = (pts: Pt[], extra: Partial<CarPoly> = {}): CarPoly => ({ pts, ...extra });

/** The game's own hand-tuned cars. */
const ORIGINALS: CarDef[] = [
  {
    id: 'sparrow',
    name: 'Sparrow',
    archetype: 'allround',
    blurb: 'Збалансований баггі. Добре стрибає, легко керується.',
    palette: { body: '#3d8bff', accent: '#ffd23f', dark: '#22264a', glass: '#7fd8ff', light: '#fff4a8' },
    body: [
      poly([[-1.5, -0.22], [1.1, -0.22], [1.55, 0.0], [1.5, 0.32], [-1.45, 0.32], [-1.55, 0.1]]),
      poly([[-1.5, -0.22], [-0.65, -0.22], [-0.75, -0.58], [-1.4, -0.58]]),
      poly([[0.3, -0.22], [0.75, -0.22], [0.45, -0.75], [0.3, -0.75]], { mat: 'dark' }),
    ],
    windows: [[[0.34, -0.24], [0.64, -0.24], [0.44, -0.68], [0.35, -0.68]]],
    stripe: { y: 0.0, h: 0.1 },
    wheels: [
      { x: -1.0, y: 0.38, r: 0.44 },
      { x: 1.0, y: 0.38, r: 0.44 },
    ],
    suspension: { hz: 4.2, damping: 0.6, travel: 0.22 },
    motor: { torque: 30, speed: 15 },
    density: 1.6,
    tireFriction: 1.25,
    head: { x: -0.15, y: -0.72, r: 0.3 },
    air: 14,
  },
  {
    id: 'bulldog',
    name: 'Bulldog',
    archetype: 'heavy',
    blurb: 'Важкий пікап. Повільний, але його майже неможливо зрушити.',
    palette: { body: '#e8553d', accent: '#f4f1e8', dark: '#3a2228', glass: '#9fe3ff', light: '#ffe9a0' },
    body: [
      box(-1.6, -0.3, 1.5, 0.38),
      poly([[1.5, -0.3], [1.62, -0.24], [1.74, 0.0], [1.68, 0.38], [1.5, 0.38]], { mat: 'metal', density: 3 }),
      poly([[-0.5, -0.3], [0.55, -0.3], [0.36, -0.86], [-0.4, -0.86]]),
      box(-1.6, -0.52, -1.42, -0.3, { mat: 'dark' }),
    ],
    windows: [[[0.08, -0.33], [0.45, -0.33], [0.3, -0.78], [0.08, -0.78]]],
    stripe: { y: 0.04, h: 0.1 },
    wheels: [
      { x: -1.1, y: 0.45, r: 0.48, rim: 'disc' },
      { x: 1.1, y: 0.45, r: 0.48, rim: 'disc' },
    ],
    suspension: { hz: 3.6, damping: 0.7, travel: 0.2 },
    motor: { torque: 52, speed: 12.5 },
    density: 2.2,
    tireFriction: 1.3,
    head: { x: -0.82, y: -0.66, r: 0.3 },
    air: 9,
  },
  {
    id: 'zipper',
    name: 'Zipper',
    archetype: 'fast',
    blurb: 'Низький спорткар. Найвища швидкість, але легкий.',
    palette: { body: '#ffcc1a', accent: '#1a1a2e', dark: '#2a2014', glass: '#8fe9ff', light: '#ffffff' },
    body: [
      poly([[-1.65, -0.16], [0.9, -0.25], [1.72, 0.0], [1.66, 0.28], [-1.65, 0.28]]),
      poly([[0.05, -0.24], [0.62, -0.22], [0.22, -0.56], [0.06, -0.56]], { mat: 'dark' }),
      poly([[-1.65, -0.16], [-1.38, -0.16], [-1.48, -0.52], [-1.7, -0.52]], { mat: 'accent' }),
    ],
    windows: [[[0.08, -0.26], [0.5, -0.24], [0.2, -0.5], [0.09, -0.5]]],
    stripe: { y: -0.02, h: 0.08 },
    wheels: [
      { x: -1.12, y: 0.32, r: 0.38, rim: 'star' },
      { x: 1.12, y: 0.32, r: 0.38, rim: 'star' },
    ],
    suspension: { hz: 5.2, damping: 0.55, travel: 0.15 },
    motor: { torque: 28, speed: 19 },
    density: 1.7,
    tireFriction: 1.2,
    head: { x: -0.32, y: -0.52, r: 0.27 },
    air: 15,
    wheelie: 0.35,
  },
  {
    id: 'mammoth',
    name: 'Mammoth',
    archetype: 'monster',
    blurb: 'Монстр-трак на величезних колесах. М\'яка підвіска, переїжджає все.',
    palette: { body: '#36c26a', accent: '#ffe24a', dark: '#1a2a20', glass: '#a8ecff', light: '#fff6c0' },
    body: [
      poly([[-1.5, -0.55], [1.35, -0.55], [1.55, -0.3], [1.5, 0.08], [-1.5, 0.08]]),
      // Cab: back wall and a roof over the driver, open in front.
      box(-0.25, -1.27, -0.15, -0.55),
      box(-0.25, -1.27, 0.35, -1.19),
      box(-1.4, 0.08, 1.4, 0.24, { mat: 'dark' }),
    ],
    stripe: { y: -0.3, h: 0.12 },
    wheels: [
      { x: -1.15, y: 0.6, r: 0.66, rim: 'monster', density: 0.7 },
      { x: 1.15, y: 0.6, r: 0.66, rim: 'monster', density: 0.7 },
    ],
    suspension: { hz: 2.7, damping: 0.5, travel: 0.38 },
    motor: { torque: 42, speed: 12.5 },
    density: 1.2,
    tireFriction: 1.2,
    head: { x: 0.19, y: -0.87, r: 0.31 },
    cabin: true,
    air: 10,
    wheelie: 0.4,
  },
  {
    id: 'pebble',
    name: 'Pebble',
    archetype: 'tiny',
    blurb: 'Крихітна машинка з дугою безпеки. Крутиться як дзиґа.',
    palette: { body: '#ff7ab8', accent: '#ffffff', dark: '#3a1830', glass: '#b0f0ff', light: '#fff8c8' },
    body: [
      poly([[-0.88, -0.2], [0.7, -0.2], [0.94, 0.0], [0.9, 0.26], [-0.88, 0.26]]),
      poly([[-0.88, -0.2], [-0.45, -0.2], [-0.5, -0.5], [-0.84, -0.5]]),
      poly([[0.3, -0.2], [0.64, -0.2], [0.42, -0.56], [0.3, -0.56]], { mat: 'dark' }),
      box(-0.58, -0.84, 0.36, -0.76, { mat: 'metal' }),
      box(-0.6, -0.84, -0.5, -0.5, { mat: 'metal' }),
      box(0.26, -0.84, 0.36, -0.56, { mat: 'metal' }),
    ],
    windows: [[[0.33, -0.22], [0.54, -0.22], [0.4, -0.5], [0.32, -0.5]], [[-0.82, -0.23], [-0.52, -0.23], [-0.55, -0.44], [-0.8, -0.44]]],
    stripe: { y: 0.02, h: 0.07 },
    wheels: [
      { x: -0.6, y: 0.3, r: 0.32, rim: 'disc' },
      { x: 0.6, y: 0.3, r: 0.32, rim: 'disc' },
    ],
    suspension: { hz: 5.5, damping: 0.6, travel: 0.14 },
    motor: { torque: 18, speed: 15.5 },
    density: 2.6,
    tireFriction: 1.3,
    head: { x: -0.06, y: -0.47, r: 0.23 },
    air: 19,
    wheelie: 0.3,
  },
  {
    id: 'longhorn',
    name: 'Longhorn',
    archetype: 'long',
    blurb: 'Довга база на трьох осях. Стабільна і майже не перевертається.',
    palette: { body: '#8a5cff', accent: '#ffd23f', dark: '#22163a', glass: '#9fe8ff', light: '#fff2b0' },
    body: [
      poly([[-2.3, -0.25], [1.95, -0.25], [2.38, 0.0], [2.32, 0.32], [-2.3, 0.32]]),
      poly([[-2.3, -0.25], [-1.15, -0.25], [-1.25, -0.68], [-2.2, -0.68]]),
      poly([[0.55, -0.25], [1.0, -0.25], [0.68, -0.8], [0.53, -0.8]], { mat: 'dark' }),
    ],
    windows: [[[0.57, -0.27], [0.88, -0.27], [0.66, -0.74], [0.56, -0.74]], [[-2.1, -0.28], [-1.35, -0.28], [-1.42, -0.6], [-2.05, -0.6]]],
    stripe: { y: 0.0, h: 0.1 },
    wheels: [
      { x: -1.8, y: 0.38, r: 0.42 },
      { x: 0.0, y: 0.38, r: 0.42, drive: false },
      { x: 1.8, y: 0.38, r: 0.42 },
    ],
    suspension: { hz: 4.0, damping: 0.65, travel: 0.2 },
    motor: { torque: 35, speed: 15 },
    density: 1.4,
    tireFriction: 1.25,
    head: { x: 0.02, y: -0.74, r: 0.3 },
    air: 9,
    wheelie: 0.25,
  },
  {
    id: 'digger',
    name: 'Digger',
    archetype: 'scoop',
    blurb: 'Ківш спереду підчіплює суперника знизу і перекидає його.',
    palette: { body: '#ff9a1f', accent: '#2a2a33', dark: '#3a2410', glass: '#a0e4ff', light: '#fff0a0' },
    body: [
      box(-1.35, -0.32, 1.05, 0.32),
      poly([[1.05, -0.32], [2.08, 0.2], [2.08, 0.32], [1.05, 0.32]], { mat: 'scoop', density: 2.4, friction: 0.25 }),
      poly([[-1.0, -0.32], [-0.2, -0.32], [-0.25, -0.95], [-0.95, -0.95]]),
    ],
    windows: [[[-0.55, -0.36], [-0.26, -0.36], [-0.29, -0.86], [-0.55, -0.86]]],
    stripe: { y: -0.05, h: 0.1 },
    wheels: [
      { x: -0.95, y: 0.4, r: 0.46, rim: 'disc' },
      { x: 0.65, y: 0.4, r: 0.46, rim: 'disc' },
    ],
    suspension: { hz: 4.3, damping: 0.7, travel: 0.16 },
    motor: { torque: 62, speed: 14 },
    density: 1.7,
    tireFriction: 1.35,
    head: { x: 0.14, y: -0.7, r: 0.29 },
    air: 9,
    wheelie: 0.3,
  },
  {
    id: 'rammer',
    name: 'Rammer',
    archetype: 'ram',
    blurb: 'Сталевий таран на рівні голови суперника.',
    palette: { body: '#b8323a', accent: '#d8dde6', dark: '#2a1418', glass: '#9ae0ff', light: '#ffe6a0' },
    body: [
      box(-1.45, -0.28, 0.92, 0.34),
      poly([[1.22, -0.88], [2.5, -0.74], [3.0, -0.43], [2.5, -0.12], [1.22, 0.02]], { mat: 'metal', density: 1.5 }),
      box(0.92, -0.92, 1.24, 0.34, { mat: 'metal', density: 2.0 }),
      poly([[-1.45, -0.28], [-0.75, -0.28], [-0.85, -0.64], [-1.4, -0.64]]),
    ],
    windows: [[[-1.3, -0.31], [-0.82, -0.31], [-0.88, -0.56], [-1.27, -0.56]]],
    stripe: { y: 0.02, h: 0.1 },
    wheels: [
      { x: -1.0, y: 0.42, r: 0.44 },
      { x: 0.85, y: 0.42, r: 0.44 },
    ],
    suspension: { hz: 4.7, damping: 0.65, travel: 0.18 },
    motor: { torque: 28, speed: 14 },
    density: 1.6,
    tireFriction: 1.25,
    head: { x: -0.2, y: -0.68, r: 0.29 },
    air: 11,
    wheelie: 0.32,
  },
  {
    id: 'porcupine',
    name: 'Porcupine',
    archetype: 'spike',
    blurb: 'Шипи на даху захищають голову від атак згори.',
    palette: { body: '#2fb8a8', accent: '#e8f0f4', dark: '#12302c', glass: '#b4f4ff', light: '#fffbd0' },
    body: [
      box(-1.4, -0.26, 1.4, 0.34),
      poly([[0.35, -0.26], [0.82, -0.26], [0.52, -0.78], [0.35, -0.78]], { mat: 'dark' }),
      box(-0.02, -1.2, 0.56, -1.04, { mat: 'metal' }),
      box(0.36, -1.06, 0.54, -0.74, { mat: 'metal' }),
            poly([[-0.02, -1.2], [0.24, -1.2], [0.11, -1.55]], { mat: 'spike' }),
      poly([[0.28, -1.2], [0.56, -1.2], [0.42, -1.52]], { mat: 'spike' }),
      poly([[1.4, -0.18], [1.4, 0.16], [1.9, -0.01]], { mat: 'spike' }),
    ],
    windows: [[[0.38, -0.28], [0.7, -0.28], [0.5, -0.72], [0.38, -0.72]]],
    stripe: { y: 0.0, h: 0.1 },
    wheels: [
      { x: -0.98, y: 0.4, r: 0.44, rim: 'star' },
      { x: 0.98, y: 0.4, r: 0.44, rim: 'star' },
    ],
    suspension: { hz: 4.2, damping: 0.6, travel: 0.18 },
    motor: { torque: 25, speed: 14 },
    density: 1.6,
    tireFriction: 1.25,
    gun: { at: [[0.27, -1.42]], aim: 0.35 },
    head: { x: -0.14, y: -0.68, r: 0.29 },
    air: 11,
  },
  {
    id: 'comet',
    name: 'Comet',
    archetype: 'rocket',
    blurb: 'Ракетний прискорювач: тримай «вперед» для ривка.',
    palette: { body: '#f0f0f8', accent: '#ff4a5a', dark: '#1e1e30', glass: '#7fd0ff', light: '#fffad0' },
    body: [
      poly([[-1.3, -0.22], [1.0, -0.25], [1.6, 0.0], [1.54, 0.3], [-1.3, 0.3]]),
      poly([[0.25, -0.25], [0.66, -0.25], [0.38, -0.68], [0.24, -0.68]], { mat: 'dark' }),
      poly([[-1.82, -0.52], [-1.05, -0.52], [-1.05, -0.12], [-1.82, -0.12]], { mat: 'rocket' }),
      poly([[-1.98, -0.47], [-1.82, -0.52], [-1.82, -0.12], [-1.98, -0.17]], { mat: 'metal' }),
    ],
    windows: [[[0.27, -0.27], [0.55, -0.27], [0.36, -0.62], [0.26, -0.62]]],
    stripe: { y: -0.02, h: 0.1 },
    wheels: [
      { x: -0.95, y: 0.36, r: 0.41, rim: 'star' },
      { x: 1.0, y: 0.36, r: 0.41, rim: 'star' },
    ],
    suspension: { hz: 4.6, damping: 0.6, travel: 0.17 },
    motor: { torque: 27, speed: 15.5 },
    density: 1.5,
    tireFriction: 1.2,
    head: { x: -0.25, y: -0.64, r: 0.28 },
    air: 13,
    boost: { accel: 16, fuel: 1.4, regen: 0.45 },
  },
  {
    id: 'stilts',
    name: 'Stilts',
    archetype: 'tall',
    blurb: 'Високий кузов на довгих стійках — переступає через суперників.',
    palette: { body: '#5ad1ff', accent: '#ff8a3d', dark: '#16304a', glass: '#e0faff', light: '#fff2b0' },
    body: [
      box(-1.2, -0.35, 1.2, 0.15),
      poly([[0.35, -0.35], [0.75, -0.35], [0.5, -0.85], [0.35, -0.85]], { mat: 'dark' }),
      poly([[-1.2, -0.35], [-0.65, -0.35], [-0.7, -0.65], [-1.15, -0.65]]),
      box(-1.0, 0.15, -0.84, 0.72, { mat: 'metal' }),
      box(0.84, 0.15, 1.0, 0.72, { mat: 'metal' }),
    ],
    windows: [[[0.38, -0.37], [0.64, -0.37], [0.48, -0.78], [0.38, -0.78]]],
    stripe: { y: -0.12, h: 0.1 },
    wheels: [
      { x: -0.92, y: 1.02, r: 0.45, rim: 'spokes' },
      { x: 0.92, y: 1.02, r: 0.45, rim: 'spokes' },
    ],
    suspension: { hz: 3.4, damping: 0.55, travel: 0.26 },
    motor: { torque: 31, speed: 15 },
    density: 1.4,
    com: [0.1, 0.3],
    tireFriction: 1.3,
    head: { x: -0.15, y: -0.8, r: 0.3 },
    air: 11,
    wheelie: 0.32,
  },
  {
    id: 'jelly',
    name: 'Jelly',
    archetype: 'bouncy',
    blurb: 'Гумовий кузов і м\'яка підвіска — відскакує від усього.',
    palette: { body: '#9cf04a', accent: '#ff5ad1', dark: '#24401a', glass: '#d8fff0', light: '#ffffff' },
    body: [
      poly([[-1.3, -0.3], [1.1, -0.3], [1.4, -0.05], [1.4, 0.25], [-1.4, 0.25], [-1.4, -0.1]]),
      poly([[0.35, -0.3], [0.72, -0.3], [0.46, -0.72], [0.35, -0.72]], { mat: 'dark' }),
    ],
    windows: [[[0.38, -0.32], [0.62, -0.32], [0.45, -0.66], [0.38, -0.66]]],
    stripe: { y: -0.05, h: 0.12 },
    wheels: [
      { x: -0.95, y: 0.34, r: 0.42, rim: 'disc' },
      { x: 0.95, y: 0.34, r: 0.42, rim: 'disc' },
    ],
    suspension: { hz: 2.5, damping: 0.32, travel: 0.28 },
    motor: { torque: 36, speed: 15 },
    density: 1.4,
    tireFriction: 1.25,
    head: { x: -0.05, y: -0.62, r: 0.3 },
    air: 13,
    restitution: 0.55,
  },
  {
    id: 'tankette',
    name: 'Tankette',
    archetype: 'heavy',
    blurb: 'Чотири малі колеса і броньована башта позаду водія.',
    palette: { body: '#7a8a4a', accent: '#d8c070', dark: '#262a18', glass: '#b0e0d0', light: '#fff0a0' },
    body: [
      box(-1.5, -0.3, 1.5, 0.22),
      poly([[-1.0, -0.3], [0.15, -0.3], [0.05, -0.72], [-0.9, -0.72]], { mat: 'accent' }),
      box(-0.35, -0.62, 0.05, -0.52, { mat: 'metal' }),
      poly([[1.5, -0.3], [1.72, -0.12], [1.72, 0.1], [1.5, 0.22]], { mat: 'metal', density: 3 }),
      poly([[0.95, -0.3], [1.18, -0.3], [1.08, -0.72], [0.95, -0.72]], { mat: 'metal' }),
    ],
    stripe: { y: -0.08, h: 0.08 },
    wheels: [
      { x: -1.15, y: 0.3, r: 0.31, rim: 'disc', density: 1.8 },
      { x: -0.4, y: 0.3, r: 0.31, rim: 'disc', density: 1.8 },
      { x: 0.4, y: 0.3, r: 0.31, rim: 'disc', density: 1.8 },
      { x: 1.15, y: 0.3, r: 0.31, rim: 'disc', density: 1.8 },
    ],
    suspension: { hz: 4.6, damping: 0.7, travel: 0.14 },
    motor: { torque: 28, speed: 16 },
    density: 1.9,
    tireFriction: 1.35,
    gun: { at: [[0.95, -0.62]], aim: 0.05 },
    head: { x: 0.45, y: -0.58, r: 0.29 },
    air: 8,
    wheelie: 0.4,
  },
  {
    id: 'hornet',
    name: 'Hornet',
    archetype: 'spike',
    blurb: 'Швидке жало на носі: ідеальне для атак у лоб.',
    palette: { body: '#ffd400', accent: '#1c1c24', dark: '#2a2208', glass: '#9ff0ff', light: '#ffffff' },
    body: [
      poly([[-1.5, -0.2], [0.8, -0.26], [1.45, -0.05], [1.45, 0.25], [-1.5, 0.25]]),
      poly([[1.45, -0.1], [1.45, 0.16], [2.25, 0.04]], { mat: 'spike' }),
      poly([[0.05, -0.24], [0.5, -0.24], [0.2, -0.56], [0.05, -0.56]], { mat: 'dark' }),
      poly([[-1.5, -0.2], [-1.2, -0.2], [-1.3, -0.56], [-1.56, -0.56]], { mat: 'accent' }),
    ],
    windows: [[[0.08, -0.26], [0.4, -0.26], [0.18, -0.5], [0.08, -0.5]]],
    stripe: { y: -0.05, h: 0.1 },
    wheels: [
      { x: -1.05, y: 0.31, r: 0.37, rim: 'star' },
      { x: 1.0, y: 0.31, r: 0.37, rim: 'star' },
    ],
    suspension: { hz: 5, damping: 0.55, travel: 0.15 },
    motor: { torque: 20, speed: 18 },
    density: 1.5,
    tireFriction: 1.2,
    head: { x: -0.36, y: -0.52, r: 0.27 },
    air: 15,
  },
  {
    id: 'forklift',
    name: 'Forklift',
    archetype: 'scoop',
    blurb: 'Вила підхоплюють суперника, а дах захищає голову.',
    palette: { body: '#ffb81f', accent: '#30303a', dark: '#2a2a30', glass: '#c0f0ff', light: '#fff4c0' },
    body: [
      box(-1.1, -0.3, 0.8, 0.3),
      box(-1.32, -0.36, -1.1, 0.3, { mat: 'dark', density: 3 }),
      box(0.8, -1.1, 0.96, 0.3, { mat: 'metal' }),
      poly([[0.96, 0.02], [1.9, 0.06], [1.9, 0.16], [0.96, 0.16]], { mat: 'metal', friction: 0.2 }),
      box(-0.9, -1.16, -0.3, -1.05, { mat: 'dark' }),
      box(-0.96, -1.1, -0.86, -0.3, { mat: 'dark' }),
    ],
    wheels: [
      { x: -0.75, y: 0.36, r: 0.4, rim: 'disc' },
      { x: 0.55, y: 0.36, r: 0.4, rim: 'disc' },
    ],
    suspension: { hz: 4.4, damping: 1.0, travel: 0.18 },
    motor: { torque: 28, speed: 12.5 },
    density: 1.6,
    tireFriction: 1.35,
    head: { x: -0.06, y: -0.62, r: 0.29 },
    air: 9,
    wheelie: 0.3,
  },
  {
    id: 'hotrod',
    name: 'Hotrod',
    archetype: 'fast',
    blurb: 'Величезні задні колеса і двигун-компресор. Король вілі.',
    palette: { body: '#d02a6a', accent: '#ffcf3a', dark: '#2a0c1c', glass: '#a8e8ff', light: '#fff4c0' },
    body: [
      poly([[-1.5, -0.3], [-0.3, -0.3], [1.6, -0.05], [1.6, 0.2], [-1.5, 0.25]]),
      poly([[0.55, -0.18], [0.95, -0.12], [0.95, -0.46], [0.55, -0.46]], { mat: 'metal' }),
      poly([[-0.36, -0.3], [-0.16, -0.3], [-0.26, -0.7], [-0.36, -0.7]], { mat: 'dark' }),
    ],
    stripe: { y: -0.05, h: 0.09 },
    wheels: [
      { x: -1.05, y: 0.3, r: 0.56, rim: 'spokes' },
      { x: 1.2, y: 0.42, r: 0.32, rim: 'spokes', drive: false },
    ],
    suspension: { hz: 4.2, damping: 0.6, travel: 0.16 },
    motor: { torque: 40, speed: 17 },
    density: 1.4,
    com: [0.3, 0.05],
    tireFriction: 1.3,
    head: { x: -0.78, y: -0.62, r: 0.29 },
    air: 12,
    wheelie: 0.5,
  },
  {
    id: 'tractor',
    name: 'Tractor',
    archetype: 'monster',
    blurb: 'Гігантське заднє колесо, страшна тяга і відкрита кабіна.',
    palette: { body: '#3aa04a', accent: '#ffd23f', dark: '#1a2a16', glass: '#c8f0ff', light: '#fff8c8' },
    body: [
      box(-0.9, -0.4, 1.5, 0.2),
      box(-1.0, -1.26, 0.12, -1.12, { mat: 'dark' }),
      box(-0.04, -1.16, 0.08, -0.4, { mat: 'dark' }),
      box(1.0, -0.86, 1.1, -0.4, { mat: 'metal' }),
    ],
    stripe: { y: -0.18, h: 0.1 },
    wheels: [
      { x: -0.6, y: 0.22, r: 0.76, rim: 'monster', density: 0.8 },
      { x: 1.15, y: 0.42, r: 0.36, rim: 'disc', drive: false },
    ],
    suspension: { hz: 3.4, damping: 0.6, travel: 0.2 },
    motor: { torque: 54, speed: 12.5 },
    density: 1.4,
    com: [0.4, 0.1],
    tireFriction: 1.4,
    head: { x: -0.42, y: -0.86, r: 0.3 },
    air: 8,
    wheelie: 0.3,
  },
  {
    id: 'bumper',
    name: 'Bumper',
    archetype: 'bouncy',
    blurb: 'Атракціонна машинка з гумовим бампером по колу.',
    palette: { body: '#ff4a4a', accent: '#2a2a40', dark: '#3a1418', glass: '#c0f0ff', light: '#fff4c0' },
    body: [
      poly([[-1.0, -0.25], [1.0, -0.25], [1.28, 0.0], [1.0, 0.27], [-1.0, 0.27], [-1.28, 0.0]], { mat: 'accent' }),
      poly([[-0.85, -0.25], [0.85, -0.25], [0.95, -0.05], [-0.95, -0.05]]),
      box(-0.88, -1.15, -0.78, -0.25, { mat: 'metal' }),
    ],
    wheels: [
      { x: -0.65, y: 0.32, r: 0.3, rim: 'disc' },
      { x: 0.65, y: 0.32, r: 0.3, rim: 'disc' },
    ],
    suspension: { hz: 5, damping: 0.6, travel: 0.12 },
    motor: { torque: 26, speed: 14 },
    density: 1.6,
    tireFriction: 1.3,
    head: { x: 0.0, y: -0.56, r: 0.3 },
    air: 16,
    restitution: 0.5,
  },
  {
    id: 'limo',
    name: 'Limo',
    archetype: 'long',
    blurb: 'Довжелезний лімузин: важко перевернути, легко штовхати.',
    palette: { body: '#1e1e2a', accent: '#d8b860', dark: '#08080e', glass: '#6ab4e0', light: '#fff6d0' },
    body: [
      poly([[-2.4, -0.25], [2.1, -0.25], [2.45, 0.0], [2.4, 0.3], [-2.4, 0.3]]),
      poly([[-2.4, -0.25], [-0.6, -0.25], [-0.7, -0.66], [-2.3, -0.66]]),
      poly([[0.75, -0.25], [1.15, -0.25], [0.88, -0.75], [0.73, -0.75]], { mat: 'dark' }),
    ],
    windows: [[[-2.2, -0.28], [-1.55, -0.28], [-1.55, -0.6], [-2.15, -0.6]], [[-1.45, -0.28], [-0.75, -0.28], [-0.8, -0.6], [-1.45, -0.6]], [[0.77, -0.27], [1.05, -0.27], [0.86, -0.7], [0.76, -0.7]]],
    stripe: { y: 0.02, h: 0.06 },
    wheels: [
      { x: -1.9, y: 0.37, r: 0.4 },
      { x: 1.85, y: 0.37, r: 0.4 },
    ],
    suspension: { hz: 3.8, damping: 0.65, travel: 0.18 },
    motor: { torque: 58, speed: 15.5 },
    density: 1.3,
    tireFriction: 1.25,
    head: { x: 0.2, y: -0.7, r: 0.3 },
    air: 8,
    wheelie: 0.22,
  },
  {
    id: 'jet',
    name: 'Jet',
    archetype: 'rocket',
    blurb: 'Подвійні ракети: короткий, але шалений ривок.',
    palette: { body: '#4a6aff', accent: '#ffffff', dark: '#141a40', glass: '#a0f0ff', light: '#fffad0' },
    body: [
      poly([[-1.4, -0.2], [0.6, -0.3], [1.62, -0.05], [1.62, 0.22], [-1.4, 0.22]]),
      poly([[-1.95, -0.62], [-1.2, -0.62], [-1.2, -0.24], [-1.95, -0.24]], { mat: 'rocket' }),
      poly([[0.1, -0.27], [0.5, -0.28], [0.25, -0.62], [0.1, -0.62]], { mat: 'dark' }),
    ],
    windows: [[[0.13, -0.3], [0.42, -0.3], [0.24, -0.56], [0.13, -0.56]]],
    stripe: { y: -0.04, h: 0.08 },
    wheels: [
      { x: -0.95, y: 0.28, r: 0.36, rim: 'star' },
      { x: 1.05, y: 0.28, r: 0.36, rim: 'star' },
    ],
    suspension: { hz: 4.8, damping: 0.6, travel: 0.15 },
    motor: { torque: 23, speed: 16 },
    density: 1.4,
    tireFriction: 1.2,
    head: { x: -0.38, y: -0.58, r: 0.27 },
    air: 14,
    boost: { accel: 19, fuel: 1.1, regen: 0.5 },
  },
  {
    id: 'ladder',
    name: 'Ladder',
    archetype: 'long',
    blurb: 'Пожежна драбина над водієм захищає від стрибків згори.',
    palette: { body: '#e8312a', accent: '#f0f0f0', dark: '#3a1010', glass: '#a8e4ff', light: '#fff4c0' },
    body: [
      box(-1.7, -0.3, 1.6, 0.32),
      poly([[0.8, -0.3], [1.6, -0.3], [1.55, -0.86], [0.95, -0.86]]),
      box(-2.4, -0.98, -0.62, -0.84, { mat: 'metal' }),
      box(-0.78, -0.86, -0.64, -0.3, { mat: 'metal' }),
    ],
    windows: [[[1.02, -0.33], [1.5, -0.33], [1.46, -0.76], [1.08, -0.76]]],
    stripe: { y: 0.02, h: 0.1 },
    wheels: [
      { x: -1.25, y: 0.4, r: 0.42 },
      { x: 1.15, y: 0.4, r: 0.42 },
    ],
    suspension: { hz: 4.0, damping: 0.65, travel: 0.17 },
    motor: { torque: 34, speed: 14 },
    density: 1.4,
    tireFriction: 1.3,
    head: { x: -0.32, y: -0.58, r: 0.28 },
    air: 8,
    wheelie: 0.25,
  },
  {
    id: 'wedge',
    name: 'Wedge',
    archetype: 'ram',
    blurb: 'Плаский клин залазить під суперника і підкидає його.',
    palette: { body: '#a0a8b8', accent: '#ff3a3a', dark: '#22262e', glass: '#a0e8ff', light: '#fff4c0' },
    body: [
      poly([[-1.5, -0.55], [-0.9, -0.55], [1.9, 0.15], [1.9, 0.28], [-1.5, 0.28]]),
      poly([[0.6, -0.18], [1.9, 0.15], [1.9, 0.22], [0.6, -0.1]], { mat: 'metal', density: 3, friction: 0.15 }),
    ],
    stripe: { y: 0.0, h: 0.08 },
    wheels: [
      { x: -1.05, y: 0.36, r: 0.4 },
      { x: 1.1, y: 0.38, r: 0.36 },
    ],
    suspension: { hz: 4.6, damping: 0.65, travel: 0.14 },
    motor: { torque: 33, speed: 15 },
    density: 1.6,
    tireFriction: 1.25,
    head: { x: -1.0, y: -0.85, r: 0.28 },
    air: 11,
  },
];

/** Every car: the originals first, then the generated collections. */
export const CARS: CarDef[] = [
  ...ORIGINALS.map((c) => skinOriginal({ ...c, category: 'originals' as const })),
  ...ROSTER.map(buildCar),
].map(applyKit).map(openCockpit).map(chunkyWheels);

/**
 * Where the driver sits there is no glass: the head pokes out of an open cockpit,
 * it never sits on (or behind) a window. Panes that overlap the driver are dropped.
 */
function openCockpit(def: CarDef): CarDef {
  const { x, y, r } = def.head;
  // A cab's open window is cut by the frame itself.
  if (def.cabin) return def;
  const x0 = x - r * 1.5, x1 = x + r * 1.5, y0 = y - r, y1 = y + r * 3;
  const near = (pts: readonly (readonly [number, number])[]) => {
    let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
    for (const [px, py] of pts) { ax = Math.min(ax, px); bx = Math.max(bx, px); ay = Math.min(ay, py); by = Math.max(by, py); }
    return ax < x1 && bx > x0 && ay < y1 && by > y0;
  };
  return {
    ...def,
    body: def.body.filter((p) => !(p.mat === 'glass' && p.deco && near(p.pts))),
    windows: def.windows?.filter((w) => !near(w)),
  };
}


/**
 * Wheels a size up: chunky, toy-like proportions read better than scale-model ones.
 * A wheel only grows as far as its neighbours and the driver's head leave room; the
 * motor is re-geared so the car pulls and tops out as before. A few cars whose balance
 * on two wheels (or on mismatched axles) depends on the wheels they have are left alone.
 */
function chunkyWheels(def: CarDef): CarDef {
  if (['farm-tractor', 'motocross-bike', 'motorbike', 'space-bike', 'personal-transporter'].includes(def.id)) return def;
  let sum = 0, n = 0;
  const wheels = def.wheels.map((w, i) => {
    if (w.hidden) return w;
    let r = w.r * (w.r >= 0.6 ? 1.08 : 1.2);
    for (let j = 0; j < def.wheels.length; j++) {
      if (j === i) continue;
      const o = def.wheels[j];
      r = Math.min(r, (Math.hypot(o.x - w.x, o.y - w.y) / (w.r + o.r)) * w.r * 0.97);
    }
    r = Math.min(r, 0.95);
    const clear = (q: number) => Math.hypot(def.head.x - w.x, def.head.y - (w.y - (q - w.r))) > q + def.head.r + 0.04;
    while (r > w.r && !clear(r)) r -= 0.01;
    r = Math.max(w.r, +r.toFixed(3));
    if (w.drive ?? true) { sum += r / w.r; n++; }
    // The tyre grows upwards into the arch: the car keeps its ride height.
    return { ...w, r, y: +(w.y - (r - w.r)).toFixed(3) };
  });
  const k = n ? sum / n : 1;
  return { ...def, wheels, motor: { ...def.motor, torque: +(def.motor.torque * k * (1 + (k - 1) * 0.9)).toFixed(2) } };
}

export const CAR_BY_ID: Record<string, CarDef> = Object.fromEntries(CARS.map((c) => [c.id, c]));
