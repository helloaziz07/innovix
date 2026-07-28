"""
Innovix — Knowledge Clusterer

K-means clustering on search result embeddings to group
related research into thematic clusters.
"""

import logging
import math
import random
from typing import List, Dict, Any, Optional, Tuple

from app.core.database import supabase_admin

logger = logging.getLogger(__name__)


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _euclidean_distance(a: List[float], b: List[float]) -> float:
    """Compute Euclidean distance between two vectors."""
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def _vector_mean(vectors: List[List[float]]) -> List[float]:
    """Compute element-wise mean of a list of vectors."""
    if not vectors:
        return []
    dim = len(vectors[0])
    mean = [0.0] * dim
    for v in vectors:
        for i in range(dim):
            mean[i] += v[i]
    return [x / len(vectors) for x in mean]


def kmeans_cluster(
    embeddings: List[List[float]],
    k: int = 4,
    max_iterations: int = 50,
    seed: int = 42,
) -> Tuple[List[int], List[List[float]]]:
    """
    Simple K-means clustering implementation.

    No numpy/sklearn dependency — pure Python for portability.
    Uses cosine similarity for assignment and Euclidean for convergence check.

    Args:
        embeddings: List of embedding vectors.
        k: Number of clusters.
        max_iterations: Maximum iterations.
        seed: Random seed for reproducibility.

    Returns:
        Tuple of (cluster_assignments, centroids).
        cluster_assignments[i] is the cluster index for embeddings[i].
    """
    if not embeddings or k <= 0:
        return [], []

    n = len(embeddings)
    k = min(k, n)  # Can't have more clusters than points

    # Initialize centroids using k-means++ strategy
    random.seed(seed)
    centroids = _kmeans_plus_plus_init(embeddings, k)

    assignments = [0] * n

    for iteration in range(max_iterations):
        # Assignment step — assign each point to nearest centroid
        new_assignments = []
        for emb in embeddings:
            best_cluster = 0
            best_sim = -1.0
            for c_idx, centroid in enumerate(centroids):
                sim = _cosine_similarity(emb, centroid)
                if sim > best_sim:
                    best_sim = sim
                    best_cluster = c_idx
            new_assignments.append(best_cluster)

        # Check convergence
        if new_assignments == assignments and iteration > 0:
            break

        assignments = new_assignments

        # Update step — recompute centroids
        for c_idx in range(k):
            cluster_points = [
                embeddings[i] for i in range(n) if assignments[i] == c_idx
            ]
            if cluster_points:
                centroids[c_idx] = _vector_mean(cluster_points)

    return assignments, centroids


def _kmeans_plus_plus_init(
    embeddings: List[List[float]], k: int
) -> List[List[float]]:
    """K-means++ initialization for better centroid seeding."""
    centroids = [embeddings[random.randint(0, len(embeddings) - 1)]]

    for _ in range(1, k):
        distances = []
        for emb in embeddings:
            min_dist = min(_euclidean_distance(emb, c) for c in centroids)
            distances.append(min_dist ** 2)

        total = sum(distances)
        if total == 0:
            centroids.append(embeddings[random.randint(0, len(embeddings) - 1)])
            continue

        probs = [d / total for d in distances]
        r = random.random()
        cumsum = 0
        for i, p in enumerate(probs):
            cumsum += p
            if cumsum >= r:
                centroids.append(embeddings[i])
                break

    return centroids


def determine_optimal_k(n_results: int) -> int:
    """
    Heuristic to determine optimal number of clusters
    based on the number of results.
    """
    if n_results <= 3:
        return 1
    elif n_results <= 6:
        return 2
    elif n_results <= 12:
        return 3
    elif n_results <= 25:
        return 4
    elif n_results <= 50:
        return 5
    else:
        return min(8, n_results // 8)


async def cluster_project_results(
    project_id: str,
    k: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Cluster all search results for a project by their embeddings.

    Fetches embedded results from Supabase, runs K-means,
    and returns cluster assignments with metadata.

    Args:
        project_id: The project UUID.
        k: Number of clusters (auto-determined if None).

    Returns:
        Dict with clusters, assignments, and metadata.
    """
    try:
        # Fetch results with embeddings
        result = (
            supabase_admin.table("search_results")
            .select("id, query, summary, sources, embedding")
            .eq("project_id", project_id)
            .execute()
        )
        results = result.data or []

        # Filter to only those with embeddings
        embedded = [
            r for r in results
            if r.get("embedding") and isinstance(r["embedding"], list)
        ]

        if len(embedded) < 2:
            return {
                "clusters": [],
                "total_results": len(results),
                "embedded_results": len(embedded),
                "message": "Not enough embedded results to cluster. Run embedding first.",
            }

        embeddings = [r["embedding"] for r in embedded]
        result_ids = [r["id"] for r in embedded]

        # Determine k
        if k is None:
            k = determine_optimal_k(len(embedded))

        # Run clustering
        assignments, centroids = kmeans_cluster(embeddings, k=k)

        # Build cluster groups
        clusters = []
        for c_idx in range(k):
            cluster_result_ids = [
                result_ids[i] for i in range(len(assignments)) if assignments[i] == c_idx
            ]
            cluster_results = [
                embedded[i] for i in range(len(assignments)) if assignments[i] == c_idx
            ]

            # Extract representative queries/topics for this cluster
            queries = []
            for cr in cluster_results:
                if cr.get("query"):
                    queries.append(cr["query"])

            clusters.append({
                "cluster_id": c_idx,
                "result_ids": cluster_result_ids,
                "size": len(cluster_result_ids),
                "queries": queries,
                "centroid": centroids[c_idx] if c_idx < len(centroids) else None,
            })

        return {
            "clusters": clusters,
            "total_results": len(results),
            "embedded_results": len(embedded),
            "k": k,
        }

    except Exception as e:
        logger.error(f"[Clusterer] Clustering failed: {e}")
        return {"clusters": [], "error": str(e)}
