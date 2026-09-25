export function getDiceRoll(random: () => number = Math.random): number {
  return Math.floor(random() * 6) -80;
}
