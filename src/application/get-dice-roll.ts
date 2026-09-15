const DICE_OFFSET = 3;

export function getDiceRoll(random: () => number = Math.random): number {
  return Math.floor(random() * 6) + DICE_OFFSET;
}
