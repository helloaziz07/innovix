"""
Innovix API — Knowledge Clustering Routes

Endpoints for generating embeddings, running clustering,
and retrieving cluster visualization data.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.services.clustering.embedder import embed_search_results
from app.services.clustering.clusterer import cluster_project_results
from app.services.clustering.labeler import label_clusters, persist_clusters
from app.services.clustering.visualizer import project_to_2d, build_visualization_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/clusters", tags=["Knowledge Clustering"])


@router.post("/{project_id}/generate")
async def generate_clusters(
    project_id: str,
    k: int = Query(default=None, ge=2, le=10, description="Number of clusters (auto if omitted)"),
    user: dict = Depends(get_current_user),
):
    """
    Generate knowledge clusters for a project's search results.

    Pipeline: embed results → k-means clustering → AI labeling → persist.
    Returns the full cluster data with labels and visualization coordinates.
    """
    try:
        # Verify project ownership
        project = (
            supabase_admin.table("projects")
            .select("id, title, idea_text")
            .eq("id", project_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        p = project.data

        # Step 1: Embed any un-embedded search results
        embedded_count = await embed_search_results(project_id)
        logger.info(f"[Clusters] Embedded {embedded_count} new results for project {project_id}")

        # Step 2: Run clustering
        cluster_result = await cluster_project_results(project_id, k=k)

        if cluster_result.get("error"):
            raise HTTPException(status_code=400, detail=cluster_result["error"])

        clusters = cluster_result.get("clusters", [])
        if not clusters:
            return {
                "message": "Not enough results to cluster. Run more DeepSearches first.",
                "total_results": cluster_result.get("total_results", 0),
                "embedded_results": cluster_result.get("embedded_results", 0),
            }

        # Step 3: Label clusters with AI
        project_context = f"{p.get('title', '')} — {p.get('idea_text', '')}"
        labeled = await label_clusters(clusters, project_context=project_context)

        # Step 4: Persist to database
        await persist_clusters(project_id, labeled)

        # Step 5: Generate visualization data
        # Re-fetch embedded results for visualization
        result = (
            supabase_admin.table("search_results")
            .select("id, query, summary, embedding")
            .eq("project_id", project_id)
            .execute()
        )
        results = result.data or []
        embedded = [r for r in results if r.get("embedding") and isinstance(r["embedding"], list)]

        if embedded:
            embeddings = [r["embedding"] for r in embedded]
            assignments = []
            for r in embedded:
                # Find which cluster this result belongs to
                assigned = 0
                for c in labeled:
                    if r["id"] in c.get("result_ids", []):
                        assigned = c.get("cluster_id", 0)
                        break
                assignments.append(assigned)

            points = project_to_2d(embeddings, assignments)
            viz_data = build_visualization_data(labeled, points, embedded)
        else:
            viz_data = {"points": [], "clusters": [], "total_points": 0, "total_clusters": 0}

        return {
            "message": f"Generated {len(labeled)} clusters from {cluster_result.get('embedded_results', 0)} results",
            "visualization": viz_data,
            "clusters": [
                {
                    "cluster_id": c.get("cluster_id"),
                    "label": c.get("label"),
                    "description": c.get("description"),
                    "color": c.get("color"),
                    "size": c.get("size"),
                    "keywords": c.get("keywords"),
                    "result_ids": c.get("result_ids"),
                }
                for c in labeled
            ],
            "total_results": cluster_result.get("total_results", 0),
            "embedded_results": cluster_result.get("embedded_results", 0),
            "k": cluster_result.get("k", len(labeled)),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Clusters] Generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cluster generation failed: {str(e)}")


@router.get("/{project_id}")
async def get_clusters(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Get existing cluster data for a project.
    Returns saved clusters with labels and metadata.
    """
    try:
        # Verify ownership
        project = (
            supabase_admin.table("projects")
            .select("id")
            .eq("id", project_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Fetch clusters
        result = (
            supabase_admin.table("clusters")
            .select("*")
            .eq("project_id", project_id)
            .order("id")
            .execute()
        )
        clusters = result.data or []

        if not clusters:
            return {
                "clusters": [],
                "message": "No clusters generated yet. Use POST /clusters/{project_id}/generate first.",
            }

        return {
            "clusters": clusters,
            "count": len(clusters),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Clusters] Fetch failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch clusters: {str(e)}")
