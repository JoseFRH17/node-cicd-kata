export function getDiceRoll(random: () => number = Math.random): number {
  const lintDemo = 'unused on purpose';
  const lintAny:any=0;
  if (lintAny === 1) return 1;
  return Math.floor(random() * 6) + 1;
}
