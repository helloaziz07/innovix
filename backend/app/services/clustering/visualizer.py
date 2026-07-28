"""
Innovix — Cluster Visualizer

Generates 2D coordinates for cluster visualization using
a lightweight dimensionality reduction approach (PCA-like projection).
No heavy dependencies like sklearn or umap required.
"""

import math
import random
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)


def project_to_2d(
    embeddings: List[List[float]],
    assignments: List[int],
) -> List[Dict[str, float]]:
    """
    Project high-dimensional embeddings to 2D for scatter plot visualization.

    Uses a simple random projection approach (Johnson-Lindenstrauss style)
    that preserves relative distances without requiring numpy/sklearn.

    Args:
        embeddings: List of embedding vectors.
        assignments: Cluster assignment for each embedding.

    Returns:
        List of {x, y, cluster} dicts for each point.
    """
    if not embeddings:
        return []

    dim = len(embeddings[0])

    # Generate two random projection vectors (seeded for consistency)
    random.seed(42)
    proj_x = [random.gauss(0, 1) for _ in range(dim)]
    proj_y = [random.gauss(0, 1) for _ in range(dim)]

    # Normalize projection vectors
    norm_x = math.sqrt(sum(v * v for v in proj_x))
    norm_y = math.sqrt(sum(v * v for v in proj_y))
    proj_x = [v / norm_x for v in proj_x]
    proj_y = [v / norm_y for v in proj_y]

    # Project each embedding
    points = []
    for i, emb in enumerate(embeddings):
        x = sum(e * p for e, p in zip(emb, proj_x))
        y = sum(e * p for e, p in zip(emb, proj_y))
        points.append({
            "x": x,
            "y": y,
            "cluster": assignments[i] if i < len(assignments) else 0,
        })

    # Normalize to [0, 1] range for frontend rendering
    if points:
        min_x = min(p["x"] for p in points)
        max_x = max(p["x"] for p in points)
        min_y = min(p["y"] for p in points)
        max_y = max(p["y"] for p in points)

        range_x = max_x - min_x if max_x != min_x else 1.0
        range_y = max_y - min_y if max_y != min_y else 1.0

        for p in points:
            p["x"] = (p["x"] - min_x) / range_x
            p["y"] = (p["y"] - min_y) / range_y

    return points


def build_visualization_data(
    clusters: List[Dict[str, Any]],
    points: List[Dict[str, float]],
    result_metadata: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Build the complete visualization payload for the frontend.

    Combines cluster labels, 2D coordinates, and result metadata
    into a single structure ready for rendering.

    Args:
        clusters: Labeled clusters from the labeler.
        points: 2D projected points from project_to_2d.
        result_metadata: Original result metadata (id, query, summary, etc.).

    Returns:
        Complete visualization data dict.
    """
    # Build enriched points with metadata
    enriched_points = []
    for i, point in enumerate(points):
        meta = result_metadata[i] if i < len(result_metadata) else {}
        cluster_idx = point.get("cluster", 0)
        cluster_info = clusters[cluster_idx] if cluster_idx < len(clusters) else {}

        enriched_points.append({
            "x": point["x"],
            "y": point["y"],
            "cluster_id": cluster_idx,
            "cluster_label": cluster_info.get("label", f"Cluster {cluster_idx + 1}"),
            "cluster_color": cluster_info.get("color", "#8b5cf6"),
            "result_id": meta.get("id", ""),
            "title": meta.get("query", meta.get("title", "Untitled")),
            "snippet": (meta.get("summary", "") or "")[:100],
        })

    # Build cluster summary for legend
    cluster_legend = []
    for cluster in clusters:
        cluster_legend.append({
            "id": cluster.get("cluster_id", 0),
            "label": cluster.get("label", ""),
            "description": cluster.get("description", ""),
            "color": cluster.get("color", "#8b5cf6"),
            "size": cluster.get("size", 0),
            "keywords": cluster.get("keywords", []),
        })

    return {
        "points": enriched_points,
        "clusters": cluster_legend,
        "total_points": len(enriched_points),
        "total_clusters": len(clusters),
    }
