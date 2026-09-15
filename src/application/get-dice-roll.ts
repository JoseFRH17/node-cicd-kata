const DICE_OFFSET = 3;

export function getDiceRoll(random: () => number = Math.random): number {
  const lintDemo = 'unused on purpose';
  return Math.floor(random() * 6) + DICE_OFFSET;
}
