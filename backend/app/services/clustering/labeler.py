"""
Innovix — Cluster Labeler

Auto-generates descriptive labels and summaries for knowledge clusters
using Gemini analysis of the cluster's content.
"""

import asyncio
import json
import logging
from typing import List, Dict, Any

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import supabase_admin

logger = logging.getLogger(__name__)

gemini_client = genai.Client(api_key=settings.gemini_api_key)
GEMINI_MODEL = "gemini-2.0-flash"


async def label_clusters(
    clusters: List[Dict[str, Any]],
    project_context: str = "",
) -> List[Dict[str, Any]]:
    """
    Generate descriptive labels, keywords, and summaries for each cluster.

    Args:
        clusters: List of cluster dicts from the clusterer (with queries, result_ids, etc.).
        project_context: Optional project idea/title for better labeling.

    Returns:
        Same clusters list with added: label, description, keywords, color.
    """
    if not clusters:
        return clusters

    # Build context for each cluster
    cluster_summaries = []
    for i, cluster in enumerate(clusters):
        queries = cluster.get("queries", [])
        queries_text = ", ".join(queries[:5]) if queries else "No queries"
        cluster_summaries.append(f"Cluster {i}: Contains {cluster.get('size', 0)} results. Queries: {queries_text}")

    clusters_text = "\n".join(cluster_summaries)

    prompt = f"""You are a research analyst labeling thematic clusters of research results.

{f"Project context: {project_context}" if project_context else ""}

Here are the clusters to label:
{clusters_text}

For EACH cluster, provide:
- label: Short thematic label (2-5 words)
- description: One sentence describing what this cluster covers
- keywords: List of 3-5 keywords that characterize this cluster
- color: A hex color code (choose from a distinct, visually appealing palette)

Return ONLY a JSON array with one object per cluster (same order). No markdown fences."""

    try:
        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1500,
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        labels = json.loads(text)

        # Merge labels into clusters
        for i, cluster in enumerate(clusters):
            if i < len(labels):
                lbl = labels[i]
                cluster["label"] = lbl.get("label", f"Cluster {i + 1}")
                cluster["description"] = lbl.get("description", "")
                cluster["keywords"] = lbl.get("keywords", [])
                cluster["color"] = lbl.get("color", _default_colors[i % len(_default_colors)])
            else:
                cluster["label"] = f"Cluster {i + 1}"
                cluster["description"] = ""
                cluster["keywords"] = []
                cluster["color"] = _default_colors[i % len(_default_colors)]

        return clusters

    except Exception as e:
        logger.error(f"[Labeler] Cluster labeling failed: {e}")
        # Fallback labels
        for i, cluster in enumerate(clusters):
            cluster["label"] = f"Cluster {i + 1}"
            cluster["description"] = f"Group of {cluster.get('size', 0)} related results"
            cluster["keywords"] = cluster.get("queries", [])[:3]
            cluster["color"] = _default_colors[i % len(_default_colors)]
        return clusters


async def persist_clusters(
    project_id: str,
    labeled_clusters: List[Dict[str, Any]],
) -> None:
    """
    Save labeled clusters to the clusters table in Supabase.

    Args:
        project_id: The project UUID.
        labeled_clusters: Clusters with labels, keywords, etc.
    """
    try:
        # Delete existing clusters for this project
        supabase_admin.table("clusters").delete().eq(
            "project_id", project_id
        ).execute()

        # Insert new clusters
        for cluster in labeled_clusters:
            cluster_data = {
                "project_id": project_id,
                "label": cluster.get("label", "Unlabeled"),
                "keywords": cluster.get("keywords", []),
                "result_ids": cluster.get("result_ids", []),
            }
            # Only include centroid if it's a valid list
            centroid = cluster.get("centroid")
            if centroid and isinstance(centroid, list):
                cluster_data["centroid"] = centroid

            supabase_admin.table("clusters").insert(cluster_data).execute()

        logger.info(f"[Labeler] Persisted {len(labeled_clusters)} clusters for project {project_id}")

    except Exception as e:
        logger.error(f"[Labeler] Failed to persist clusters: {e}")


# Default color palette for clusters
_default_colors = [
    "#8b5cf6",  # Violet
    "#06b6d4",  # Cyan
    "#f59e0b",  # Amber
    "#ef4444",  # Red
    "#10b981",  # Emerald
    "#ec4899",  # Pink
    "#3b82f6",  # Blue
    "#84cc16",  # Lime
]
