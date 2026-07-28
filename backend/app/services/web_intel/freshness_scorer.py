"""
Innovix — Freshness Scorer

Scores search results by publication date and relevance recency.
Helps users prioritize recent, up-to-date research over stale content.
"""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Freshness decay constants (in days)
FRESHNESS_BANDS = [
    {"max_days": 7, "label": "This week", "score": 1.0, "color": "#22c55e"},
    {"max_days": 30, "label": "This month", "score": 0.85, "color": "#84cc16"},
    {"max_days": 90, "label": "Last 3 months", "score": 0.7, "color": "#eab308"},
    {"max_days": 180, "label": "Last 6 months", "score": 0.5, "color": "#f97316"},
    {"max_days": 365, "label": "Last year", "score": 0.35, "color": "#ef4444"},
    {"max_days": float("inf"), "label": "Older", "score": 0.15, "color": "#6b7280"},
]


def score_results(
    results: List[Dict[str, Any]],
    boost_recent: bool = True,
) -> List[Dict[str, Any]]:
    """
    Score and annotate search results with freshness metadata.

    Each result gets a freshness_score (0-1), freshness_label,
    freshness_color, and days_ago field.

    Args:
        results: List of search result dicts. Expected to have
                 a 'metadata' dict with 'published_date' or similar.
        boost_recent: If True, sorts results by freshness-weighted relevance.

    Returns:
        Annotated and optionally re-sorted results.
    """
    now = datetime.now(timezone.utc)
    scored = []

    for result in results:
        result_copy = {**result}
        pub_date = _extract_date(result_copy)

        if pub_date:
            days_ago = max(0, (now - pub_date).days)
            band = _get_band(days_ago)
            result_copy["freshness_score"] = band["score"]
            result_copy["freshness_label"] = band["label"]
            result_copy["freshness_color"] = band["color"]
            result_copy["days_ago"] = days_ago
            result_copy["published_date_iso"] = pub_date.isoformat()
        else:
            result_copy["freshness_score"] = 0.3
            result_copy["freshness_label"] = "Unknown date"
            result_copy["freshness_color"] = "#6b7280"
            result_copy["days_ago"] = None
            result_copy["published_date_iso"] = None

        # Combine with existing relevance
        base_relevance = result_copy.get("relevance_score", 0.5)
        freshness = result_copy["freshness_score"]
        result_copy["combined_score"] = (base_relevance * 0.6) + (freshness * 0.4)

        scored.append(result_copy)

    if boost_recent:
        scored.sort(key=lambda r: r["combined_score"], reverse=True)

    return scored


def get_freshness_distribution(
    results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Get distribution of results across freshness bands.
    Useful for displaying a timeline/histogram.

    Returns:
        {bands: [{label, count, color}], newest_date, oldest_date, total}
    """
    if not results:
        return {"bands": [], "newest_date": None, "oldest_date": None, "total": 0}

    band_counts = {b["label"]: 0 for b in FRESHNESS_BANDS}
    dates = []

    for result in results:
        days = result.get("days_ago")
        if days is not None:
            band = _get_band(days)
            band_counts[band["label"]] += 1
            if result.get("published_date_iso"):
                dates.append(result["published_date_iso"])

    bands = [
        {"label": b["label"], "count": band_counts[b["label"]], "color": b["color"]}
        for b in FRESHNESS_BANDS
        if band_counts[b["label"]] > 0
    ]

    return {
        "bands": bands,
        "newest_date": min(dates) if dates else None,
        "oldest_date": max(dates) if dates else None,
        "total": len(results),
    }


def _extract_date(result: Dict[str, Any]) -> datetime | None:
    """Extract publication date from result metadata."""
    metadata = result.get("metadata", {})
    if isinstance(metadata, dict):
        for key in ["published_date", "published", "date", "created_at", "updated_at"]:
            val = metadata.get(key)
            if val:
                return _parse_date(val)

    # Also check top-level keys
    for key in ["published_date", "published", "date", "created_at"]:
        val = result.get(key)
        if val:
            return _parse_date(val)

    return None


def _parse_date(val: Any) -> datetime | None:
    """Parse a date string or datetime into a timezone-aware datetime."""
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val

    if isinstance(val, str):
        for fmt in [
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%B %d, %Y",
        ]:
            try:
                dt = datetime.strptime(val, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue

    return None


def _get_band(days_ago: int) -> Dict[str, Any]:
    """Get the freshness band for a given number of days ago."""
    for band in FRESHNESS_BANDS:
        if days_ago <= band["max_days"]:
            return band
    return FRESHNESS_BANDS[-1]
