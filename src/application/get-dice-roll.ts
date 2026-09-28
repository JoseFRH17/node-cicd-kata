export function getDiceRoll(random: () => number = Math.random): number {
  const unusedVariable = 'fix me';
  const lintDemo:any='fix me';
  return Math.floor(random() * 6) + 1;
}
