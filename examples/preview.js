// Warm functions, coral control flow, and sage strings.
export function sunset(hour = 18) {
  const palette = { name: "Afterglow", glow: true };
  return hour >= 18 ? `${palette.name}: evening` : /golden/i.test("golden hour");
}
