const ADJECTIVES = [
  'Mystic','Calm','Wild','Silent','Cosmic','Neon','Lazy','Brave',
  'Fuzzy','Sneaky','Jolly','Grumpy','Sleepy','Zesty','Quirky','Spicy',
];
const NOUNS = [
  'Otter','Volcano','Penguin','Cactus','Nebula','Pickle','Tornado',
  'Waffle','Gecko','Comet','Muffin','Sphinx','Narwhal','Biscuit','Panda',
];

/**
 * Generates a deterministic fun nickname from a seed string.
 * e.g. "MysticOtter42"
 */
export function generateNickname(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const abs = Math.abs(hash);
  const adj  = ADJECTIVES[abs % ADJECTIVES.length];
  const noun = NOUNS[(abs >> 4) % NOUNS.length];
  const num  = abs % 100;
  return `${adj}${noun}${num}`;
}
