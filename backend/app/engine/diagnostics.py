from __future__ import annotations

from typing import Any


def build_diagnostics(points: list[dict[str, Any]]) -> list[dict[str, str]]:
    if not points:
        return []
    insights: list[dict[str, str]] = []
    selected = points[-1]
    if selected["bit_errors"] == 0:
        insights.append({
            "title": "No errors observed",
            "severity": "info",
            "evidence": "Measured",
            "observation": f"0 observed errors across {selected['num_bits']:,} transmitted information bits.",
            "explanation": "This finite test observed no errors; it does not prove that the true error probability is zero.",
            "suggestion": "Run more blocks or reduce Eb/N0 to find the link's transition region.",
        })
    elif selected["ber"] >= 0.1:
        insights.append({
            "title": "High decoding error rate",
            "severity": "warning",
            "evidence": "Measured",
            "observation": f"The receiver decoded {selected['bit_errors']:,} of {selected['num_bits']:,} bits incorrectly.",
            "explanation": "At this Eb/N0, channel impairment is overwhelming the configured coding and modulation for many blocks.",
            "suggestion": "Increase Eb/N0 or compare against the QPSK preset under the same channel.",
        })
    if selected["bler"] > 0.5 and selected["ber"] < 0.1:
        insights.append({
            "title": "Errors are spread across blocks",
            "severity": "warning",
            "evidence": "Measured",
            "observation": f"BLER is {selected['bler']:.3g} while BER is {selected['ber']:.3g}.",
            "explanation": "Even a modest fraction of wrong bits can make many transport blocks unusable because one wrong information bit marks a block as erroneous.",
            "suggestion": "Increase the sample size and inspect a nearby Eb/N0 point.",
        })
    if len(points) >= 2:
        low, high = points[0], points[-1]
        if high["ber"] < low["ber"] or high["bler"] < low["bler"]:
            insights.append({
                "title": "Performance improves with Eb/N0",
                "severity": "success",
                "evidence": "Sweep trend",
                "observation": f"BER changed from {low['ber']:.3g} at {low['ebn0_db']:g} dB to {high['ber']:.3g} at {high['ebn0_db']:g} dB.",
                "explanation": "The measured trend is consistent with a receiver gaining reliability as energy per information bit rises relative to noise density.",
                "suggestion": "Add blocks around the steepest part of the curve to estimate the operating threshold.",
            })
    if selected["num_blocks"] < 32:
        insights.append({
            "title": "Small statistical sample",
            "severity": "info",
            "evidence": "Sample-size rule",
            "observation": f"This point contains {selected['num_blocks']} transport blocks.",
            "explanation": "Quick tests are useful for iteration but can vary noticeably between seeds.",
            "suggestion": "Use Standard or Detailed workload before drawing performance conclusions.",
        })
    return insights
