export function nameSort(a: { name: string }, b: { name: string }): number {
  return a.name > b.name ? 1 : -1;
}
