import { O, P, R, T, eye, line, slashes, teeth } from '../art';
import { group, o } from './util';

export const CNY = group('cny', [
  ['dancing-lion', 'Dancing Lion', 'Святковий лев із пишною гривою. Ричить під барабани.', 'creature', ['#e02a2a', '#ffd23f'], {
    parts: ['ears', 'tail'], ab: 'roar|Левовий рик', noLights: true,
    art: () => [...[0, 1, 2, 3, 4].map((i) => O(1.1 + i * 0.08, -1.15 + i * 0.12, 0.2, 0.14, i % 2 ? 'accent' : 'white')), ...eye(1.45, -1.0, 0.1), O(1.68, -0.82, 0.08, 0.06, 'black'), ...teeth(1.35, 1.7, -0.7, 3, 0.08), ...slashes(-0.9, 0.7, -0.55, -0.1, 5, 'accent', 0.08)],
  }],
  ['emperor-carriage', 'The Emperor\'s Carriage', 'Золотий імператорський паланкін з ліхтарями.', 'carriage', ['#e0b020', '#c02a2a'], {
    parts: ['lantern'],
    art: (f) => [P([[f.roof.x0 - 0.3, f.roof.y + 0.05], [f.roof.x1 + 0.3, f.roof.y + 0.05], [f.roof.x1 - 0.1, f.roof.y - 0.25], [f.roof.x0 + 0.1, f.roof.y - 0.25]], 'accent'), T([f.roof.x0 - 0.3, f.roof.y + 0.05], [f.roof.x0 - 0.1, f.roof.y - 0.1], [f.roof.x0 - 0.45, f.roof.y - 0.15], 'accent'), T([f.roof.x1 + 0.3, f.roof.y + 0.05], [f.roof.x1 + 0.1, f.roof.y - 0.1], [f.roof.x1 + 0.45, f.roof.y - 0.15], 'accent'), O(0, f.roof.y - 0.35, 0.1, 0.1, 'gold')],
  }],
  ['cloud', 'Cloud', 'Чарівна хмаринка: пливе над ареною.', 'blob', ['#f4f8ff', '#ffd23f'], {
    o: o({ shape: 'flat', mat: 'white' }), float: 0.75, ab: 'fly|Пливти хмаркою', noLights: true,
    art: () => [O(-0.6, -0.45, 0.45, 0.3, 'white'), O(0.15, -0.55, 0.5, 0.35, 'white'), O(0.8, -0.35, 0.4, 0.25, 'white'), ...eye(0.6, -0.2, 0.07), O(0.9, -0.05, 0.08, 0.05, 'pink')],
  }],
  ['chinese-dragon', 'Chinese Dragon', 'Довгий східний дракон із вусами. Дихає полум\'ям.', 'creature', ['#e02a2a', '#ffd23f'], {
    o: o({ neck: 'raptor', len: 1.3 }), parts: ['plates', 'tail', 'mohawk'], ab: 'shoot:fire|Подих дракона', noLights: true,
    art: () => [...eye(1.7, -0.78, 0.08), line([2.1, -0.6], [2.45, -0.4], 0.04, 'accent'), line([2.1, -0.55], [2.4, -0.25], 0.04, 'accent'), ...teeth(1.8, 2.25, -0.58, 4, 0.08), ...slashes(-1.2, 1.0, -0.2, 0.15, 6, 'accent', 0.08)],
  }],
  ['dragon-monster', 'Dragon Monster', 'Монстр-трак із головою дракона. Пихкає вогнем.', 'monster', ['#e02a2a', '#ffd23f'], {
    parts: ['fangs', 'horns'], ab: 'shoot:fire|Вогняне дихання',
    art: (f) => [...eye(f.nose.x - 0.5, -0.4, 0.12, 'rocket'), O(f.nose.x - 0.1, -0.35, 0.06, 0.05, 'black'), ...slashes(-1.4, 0.8, -0.5, -0.1, 6, 'accent', 0.08)],
  }],
  ['zodiac-dog', 'Zodiacal Dog', 'Зодіакальний святковий пес у червоному шарфі.', 'creature', ['#e0a040', '#ffffff'], {
    parts: ['ears', 'tail'], noLights: true,
    art: () => [P([[0.65, -0.55], [1.0, -0.8], [1.1, -0.65], [0.75, -0.4]], 'rocket'), O(1.85, -0.88, 0.07, 0.06, 'black'), ...eye(1.5, -1.0, 0.07), O(0.0, -0.1, 0.6, 0.18, 'accent')],
  }],
  ['rocket-ride', 'Rocket Ride', 'Святкова новорічна ракета з ліхтариком. Пускає петарди.', 'rocket', ['#e02a2a', '#ffd23f'], {
    parts: ['booster', 'lantern'], ab: 'shoot:firework|Петарди',
    art: () => slashes(-1.4, 0.6, -0.3, 0.28, 4, 'accent', 0.2),
  }],
  ['serpent-tank', 'Serpent Dragon Tank', 'Танк у вигляді змія: гармата з драконячою пащею, петардні снаряди.', 'tracked', ['#2a8a3a', '#ffd23f'], {
    parts: ['fangs', 'cannon'], ab: 'shoot:firework|Драконячий постріл',
    art: () => [...eye(1.2, -0.05, 0.1, 'rocket'), ...slashes(-1.5, 1.0, -0.15, 0.25, 7, 'accent', 0.1)],
  }],
  ['cannon-carriage', 'Cannon Carriage', 'Середньовічна гармата на великих колесах.', 'cart', ['#7a4a2a', '#3a3a3a'], {
    o: o({ wheel: 1.8, mat: 'wood', rim: 'spokes' }), parts: [['cannon', 0.7]], ab: 'shoot:cannon|Ядро', noLights: true,
    art: (f) => [line([f.tail.x, f.deck.y + 0.1], [f.tail.x - 0.6, f.deck.y + 0.55], 0.1, 'wood'), O(f.tail.x + 0.3, f.deck.y - 0.12, 0.1, 0.1, 'dark'), O(f.tail.x + 0.5, f.deck.y - 0.12, 0.1, 0.1, 'dark')],
  }],
]);

void R;
