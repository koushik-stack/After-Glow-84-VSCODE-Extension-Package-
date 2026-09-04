type TimeOfDay = "afternoon" | "afterglow";

interface SunsetConfig {
  readonly title: string;
  hour: number;
  colors: string[];
}

const horizon: SunsetConfig = {
  title: "Afterglow ’84",
  hour: 18,
  colors: ["plum", "apricot", "rose"]
};

export function describe(config: SunsetConfig, phase: TimeOfDay = "afterglow"): string {
  // Keep the glow warm and the output predictable.
  return `${config.title}: ${phase} at ${config.hour}:00`;
}

console.log(describe(horizon));
