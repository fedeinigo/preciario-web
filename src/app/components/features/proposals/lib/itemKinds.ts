export function isWppUtility(name: string): boolean {
  return name.toLowerCase().includes("conv. whatsapp - utility");
}
export function isWppMarketing(name: string): boolean {
  return name.toLowerCase().includes("conv. whatsapp - marketing");
}
export function isWppAuth(name: string): boolean {
  return name.toLowerCase().includes("conv. whatsapp - authentication");
}
export function isMinutesOut(name: string): boolean {
  return name.toLowerCase().includes("minutos de telefonia - salientes");
}
export function isMinutesIn(name: string): boolean {
  return name.toLowerCase().includes("minutos de telefonia - entrantes");
}
export function isWiserPro(name: string): boolean {
  return name.toLowerCase().includes("wiser pro");
}
