// Quiz data with basic XOR obfuscation to discourage casual cheating via DevTools

const KEY = 'aNossaTurma2024';

function xorDecode(encoded: string): string {
  const bytes = encoded.match(/.{1,2}/g)?.map(h => parseInt(h, 16)) ?? [];
  return bytes.map((b, i) => String.fromCharCode(b ^ KEY.charCodeAt(i % KEY.length))).join('');
}

function xorEncode(text: string): string {
  return Array.from(text)
    .map((c, i) => (c.charCodeAt(0) ^ KEY.charCodeAt(i % KEY.length)).toString(16).padStart(2, '0'))
    .join('');
}

// Pre-encoded member names (generated with xorEncode)
// To regenerate: console.log(xorEncode("name"))
// Circle geometry in actual image pixel coordinates (1536×2752)
export const IMG_W = 1536;
export const IMG_H = 2752;
export const CIRCLE_CX = 768;
export const CIRCLE_CY = 1350;
export const CIRCLE_R = 620;

const ENCODED_LEVELS = [
  {
    id: 1,
    name: 'Conformista',
    fullName: 'Nível 1 — Conformista',
    capacity: 12,
    angleStart: 210,
    angleEnd: 335,
    overlayColor: '#9e5535',
    titlePosition: { top: '24%', left: '25%', width: '50%' },
    badgePosition: { top: '36%', left: '43%' },
    encodedMembers: [] as string[],
  },
  {
    id: 2,
    name: 'Individualista',
    fullName: 'Nível 2 — Individualista',
    capacity: 4,
    angleStart: 145,
    angleEnd: 210,
    overlayColor: '#b89838',
    titlePosition: { top: '42%', left: '5%', width: '38%' },
    badgePosition: { top: '54%', left: '18%' },
    encodedMembers: [] as string[],
  },
  {
    id: 3,
    name: 'Sintetista',
    fullName: 'Nível 3 — Sintetista',
    capacity: 3,
    angleStart: 335,
    angleEnd: 35,
    overlayColor: '#829e78',
    titlePosition: { top: '40%', left: '57%', width: '36%' },
    badgePosition: { top: '52%', left: '68%' },
    encodedMembers: [] as string[],
  },
  {
    id: 4,
    name: 'Generativo',
    fullName: 'Nível 4 — Generativo',
    capacity: 1,
    angleStart: 90,
    angleEnd: 145,
    overlayColor: '#b59c3a',
    titlePosition: { top: '63%', left: '10%', width: '32%' },
    badgePosition: { top: '72%', left: '22%' },
    encodedMembers: [] as string[],
  },
  {
    id: 5,
    name: 'Génio Estratégico / 5D',
    fullName: 'Génio Estratégico / 5D',
    capacity: 1,
    angleStart: 35,
    angleEnd: 90,
    overlayColor: '#96876a',
    titlePosition: { top: '66%', left: '46%', width: '40%' },
    badgePosition: { top: '75%', left: '60%' },
    encodedMembers: [] as string[],
  },
];

// Plain member data - we encode at module init
const PLAIN_DATA: Record<number, string[]> = {
  1: ['Luís Graça', 'Zé Pedro', 'Tiago Burnay', 'Carlos Cunha', 'Miguel Pereira', 'Filipe Quinta', 'João Fleming', 'Nuno Vilaça', 'Jorge Costa', 'Filipe Carneira', 'Gustavo Sousa', 'Xani'],
  2: ['Ricardo Pereira', 'Dinis Sottomayor', 'Nuno Brito e Faro', 'Pedro Norton'],
  3: ['Rui Pedro', 'Gonçalo Oliveira', 'Armando Teixeira-Pinto'],
  4: ["Miguel 'Guedelhas'"],
  5: ['Rodrigo Adão da Fonseca'],
};

// Encode on module load
for (const level of ENCODED_LEVELS) {
  level.encodedMembers = PLAIN_DATA[level.id].map(name => xorEncode(name));
}

export interface Level {
  id: number;
  name: string;
  fullName: string;
  capacity: number;
  angleStart: number;
  angleEnd: number;
  overlayColor: string;
  titlePosition: { top: string; left: string; width: string };
  badgePosition: { top: string; left: string };
  members: string[];
}

export interface Member {
  id: string;
  name: string;
  correctLevelId: number;
}

export function getLevels(): Level[] {
  return ENCODED_LEVELS.map(l => ({
    ...l,
    members: l.encodedMembers.map(e => xorDecode(e)),
  }));
}

export function getAllMembers(): Member[] {
  const levels = getLevels();
  const members: Member[] = [];
  for (const level of levels) {
    for (const name of level.members) {
      members.push({
        id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name,
        correctLevelId: level.id,
      });
    }
  }
  return members;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
