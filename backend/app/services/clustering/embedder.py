"""
Innovix — Embedding Generator

Generates text embeddings using Google Gemini Embedding API
for use in knowledge clustering and semantic search.
"""

import asyncio
import logging
from typing import List, Optional

from google import genai

from app.core.config import settings
from app.core.database import supabase_admin

logger = logging.getLogger(__name__)

gemini_client = genai.Client(api_key=settings.gemini_api_key)
EMBEDDING_MODEL = "models/text-embedding-004"
EMBEDDING_DIM = 768


async def generate_embedding(text: str) -> Optional[List[float]]:
    """
    Generate a single embedding vector for the given text.

    Args:
        text: Text to embed (will be truncated to ~2000 chars).

    Returns:
        List of floats (768-dimensional), or None on failure.
    """
    if not text or not text.strip():
        return None

    # Truncate to avoid token limits
    truncated = text[:2000]

    try:
        response = await asyncio.to_thread(
            gemini_client.models.embed_content,
            model=EMBEDDING_MODEL,
            contents=truncated,
        )
        return response.embeddings[0].values

    except Exception as e:
        logger.error(f"[Embedder] Embedding generation failed: {e}")
        return None


async def generate_embeddings_batch(
    texts: List[str],
    batch_size: int = 20,
) -> List[Optional[List[float]]]:
    """
    Generate embeddings for multiple texts in batches.

    Args:
        texts: List of texts to embed.
        batch_size: Number of texts per API call.

    Returns:
        List of embedding vectors (same order as input).
        Failed embeddings will be None.
    """
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_truncated = [t[:2000] if t else "" for t in batch]

        try:
            response = await asyncio.to_thread(
                gemini_client.models.embed_content,
                model=EMBEDDING_MODEL,
                contents=batch_truncated,
            )
            for emb in response.embeddings:
                all_embeddings.append(emb.values)
        except Exception as e:
            logger.error(f"[Embedder] Batch embedding failed for batch {i}: {e}")
            all_embeddings.extend([None] * len(batch))

    return all_embeddings


async def embed_search_results(project_id: str) -> int:
    """
    Generate and store embeddings for all search results of a project
    that don't already have embeddings.

    Args:
        project_id: The project UUID.

    Returns:
        Number of results newly embedded.
    """
    try:
        # Fetch results without embeddings
        result = (
            supabase_admin.table("search_results")
            .select("id, query, summary, sources")
            .eq("project_id", project_id)
            .execute()
        )
        results = result.data or []

        if not results:
            return 0

        embedded_count = 0
        for r in results:
            # Build text for embedding
            text_parts = [r.get("query", "")]
            if r.get("summary"):
                text_parts.append(r["summary"][:500])
            sources = r.get("sources", [])
            if isinstance(sources, list):
                for s in sources[:5]:
                    if isinstance(s, dict):
                        text_parts.append(s.get("title", ""))
                        text_parts.append(s.get("snippet", "")[:100])

            full_text = " ".join(text_parts)
            embedding = await generate_embedding(full_text)

            if embedding:
                try:
                    supabase_admin.table("search_results").update(
                        {"embedding": embedding}
                    ).eq("id", r["id"]).execute()
                    embedded_count += 1
                except Exception as e:
                    logger.warning(f"[Embedder] Failed to store embedding for {r['id']}: {e}")

        logger.info(f"[Embedder] Embedded {embedded_count}/{len(results)} results for project {project_id}")
        return embedded_count

    except Exception as e:
        logger.error(f"[Embedder] embed_search_results failed: {e}")
        return 0
