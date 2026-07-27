export function fm(n: number): string {
  return '€' + Math.round(n).toLocaleString('es-ES')
}

export function fmtDate(d: string): string {
  const dt = new Date(d)
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`
}
