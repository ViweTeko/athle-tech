# backend/core/services/asa_standards.py
from dataclasses import dataclass
from typing import Optional, Dict, Tuple

# Reference EPA / ASA Qualifying Standards
# Times stored in total seconds; Field distances/heights stored in meters.
ASA_STANDARDS: Dict[Tuple[str, str, str], float] = {
    # --- MEN ---
    ("100m", "M", "Senior"): 10.65,
    ("100m", "M", "U20"): 11.00,
    ("100m", "M", "U18"): 11.60,
    ("200m", "M", "Senior"): 21.50,
    ("200m", "M", "U20"): 22.30,
    ("400m", "M", "Senior"): 48.00,
    ("400m", "M", "U20"): 49.80,
    ("800m", "M", "Senior"): 112.50,    # 1:52.50
    ("800m", "M", "U20"): 116.50,       # 1:56.50
    ("800m", "M", "U18"): 119.20,       # 1:59.20
    ("1500m", "M", "Senior"): 232.00,   # 3:52.00
    ("1500m", "M", "U20"): 236.00,      # 3:56.00
    ("5000m", "M", "Senior"): 870.00,   # 14:30.00
    ("10000m", "M", "Senior"): 1825.00, # 30:25.00
    ("10km", "M", "Senior"): 1825.00,   # 30:25.00
    ("21.1km", "M", "Senior"): 4020.00, # 67:00.00
    ("Long Jump", "M", "Senior"): 6.90,
    ("Long Jump", "M", "U20"): 6.60,
    ("High Jump", "M", "Senior"): 1.95,

    # --- WOMEN (Mapped to 'F' to match Athlete.Gender choices) ---
    ("100m", "F", "Senior"): 12.30,
    ("100m", "F", "U20"): 12.60,
    ("100m", "F", "U18"): 12.70,
    ("200m", "F", "Senior"): 25.10,
    ("200m", "F", "U20"): 25.80,
    ("400m", "F", "Senior"): 57.60,
    ("400m", "F", "U20"): 59.40,
    ("800m", "F", "Senior"): 131.50,    # 2:11.50
    ("800m", "F", "U20"): 132.00,       # 2:12.00
    ("1500m", "F", "Senior"): 280.00,   # 4:40.00
    ("5000m", "F", "Senior"): 1064.00,  # 17:44.00
    ("10000m", "F", "Senior"): 2220.00, # 37:00.00
    ("10km", "F", "Senior"): 2220.00,   # 37:00.00
    ("21.1km", "F", "Senior"): 4860.00, # 81:00.00
    ("Long Jump", "F", "Senior"): 5.30,
    ("High Jump", "F", "Senior"): 1.65,
}


@dataclass
class GapAnalysisResult:
    event: str
    category: str
    standard_value: float
    athlete_best: float
    gap_value: float
    percentage_gap: float
    is_qualified: bool
    status_label: str
    unit: str


class ASAGapEngine:
    """
    Evaluates athlete performance benchmarks against EPA / ASA qualification marks.
    """
    TRACK_EVENTS = {
        "100m", "200m", "400m", "800m", "1500m", "3000m",
        "5000m", "10000m", "10km", "21.1km", "110mH", "100mH", "400mH", "3000mSC"
    }

    @classmethod
    def evaluate(cls, event: str, gender: str, category: str, athlete_best: float) -> Optional[GapAnalysisResult]:
        normalized_gender = "F" if gender in ("F", "W") else "M"
        key = (event, normalized_gender, category)
        standard = ASA_STANDARDS.get(key)

        if standard is None or athlete_best <= 0:
            return None

        is_track = event in cls.TRACK_EVENTS
        unit = "s" if is_track else "m"

        if is_track:
            gap = athlete_best - standard
            is_qualified = athlete_best <= standard
            percentage_gap = round(((athlete_best - standard) / standard) * 100, 2)
        else:
            gap = standard - athlete_best
            is_qualified = athlete_best >= standard
            percentage_gap = round(((standard - athlete_best) / standard) * 100, 2)

        if is_qualified:
            status_label = "QUALIFIED"
        elif abs(percentage_gap) <= 2.0:
            status_label = "CONTENDER (< 2% Gap)"
        elif abs(percentage_gap) <= 5.0:
            status_label = "DEVELOPMENT (< 5% Gap)"
        else:
            status_label = "OFF STANDARD"

        return GapAnalysisResult(
            event=event,
            category=category,
            standard_value=standard,
            athlete_best=athlete_best,
            gap_value=round(gap, 2),
            percentage_gap=percentage_gap,
            is_qualified=is_qualified,
            status_label=status_label,
            unit=unit
        )

    @staticmethod
    def format_time(seconds: float) -> str:
        """Formats raw seconds into mm:ss.xx or ss.xx."""
        if seconds >= 60:
            minutes = int(seconds // 60)
            rem = seconds % 60
            return f"{minutes}:{rem:05.2f}"
        return f"{seconds:.2f}s"