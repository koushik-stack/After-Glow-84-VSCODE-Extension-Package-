from dataclasses import dataclass
from enum import Enum


class Light(Enum):
    GOLDEN = "golden"
    PLUM = "plum"


@dataclass(frozen=True)
class Horizon:
    name: str
    intensity: float = 0.84

    def describe(self) -> str:
        """Return a compact sunset description."""
        return f"{self.name}: {self.intensity:.0%} glow"


sunset = Horizon("Afterglow")
print(sunset.describe())