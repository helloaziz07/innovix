"""
Innovix — DeepSearch Orchestrator

The core AI research engine. Coordinates all search sources, deduplicates
results, generates AI-powered summaries with citations, and performs gap analysis.

Pipeline:
  1. Query Understanding  → Gemini generates sub-queries per source
  2. Parallel Fetching    → asyncio.gather across all sources
  3. Result Fusion        → Deduplicate, score by relevance
  4. AI Summarization     → Gemini produces a cited summary
  5. Gap Analysis         → Gemini identifies innovation opportunities
  6. Persistence          → Save to Supabase search_results table
"""

import asyncio
import json
import logging
from typing import List, Optional, Dict
from datetime import datetime, timezone
from uuid import uuid4

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import supabase_admin
from app.models.schemas import SearchSource, DeepSearchResponse
from app.services.search.sources.arxiv_source import search_arxiv
from app.services.search.sources.github_source import search_github
from app.services.search.sources.scholar_source import search_scholar
from app.services.search.sources.web_source import search_web

logger = logging.getLogger(__name__)

# Gemini client
gemini_client = genai.Client(api_key=settings.gemini_api_key)
GEMINI_MODEL = "gemini-3.5-flash-lite"


async def run_deep_search(
    query: str,
    project_id: Optional[str] = None,
    sources_to_search: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    progress_callback=None,
) -> DeepSearchResponse:
    """
    Execute a full DeepSearch pipeline.

    Args:
        query: The user's research idea or question.
        project_id: Optional project to associate results with.
        sources_to_search: List of source types to include ["arxiv", "github", "scholar", "web"].
        user_id: The authenticated user's ID (for ownership).
        progress_callback: Optional async callback for streaming progress updates.

    Returns:
        DeepSearchResponse with all sources, summary, citations, and gap analysis.
    """
    if sources_to_search is None:
        sources_to_search = ["arxiv", "github", "scholar", "web"]

    result_id = str(uuid4())

    # ──────────────────────────────────────────────
    # Step 1: Query Understanding
    # ──────────────────────────────────────────────
    if progress_callback:
        await progress_callback({"event": "step", "step": "query_understanding", "message": "Analyzing your query..."})

    sub_queries = await _generate_sub_queries(query)
    logger.info(f"[DeepSearch] Generated sub-queries: {sub_queries}")

    if progress_callback:
        await progress_callback({"event": "sub_queries", "queries": sub_queries})

    # ──────────────────────────────────────────────
    # Step 2: Parallel Source Fetching
    # ──────────────────────────────────────────────
    if progress_callback:
        await progress_callback({"event": "step", "step": "searching", "message": "Searching across sources..."})

    all_sources = await _fetch_all_sources(query, sub_queries, sources_to_search, progress_callback)
    logger.info(f"[DeepSearch] Total raw results: {len(all_sources)}")

    # ──────────────────────────────────────────────
    # Step 3: Result Fusion
    # ──────────────────────────────────────────────
    if progress_callback:
        await progress_callback({"event": "step", "step": "fusion", "message": "Deduplicating and ranking results..."})

    fused = _fuse_and_rank(all_sources, query)
    logger.info(f"[DeepSearch] After fusion: {len(fused)} results")

    # ──────────────────────────────────────────────
    # Step 4: AI Summarization
    # ──────────────────────────────────────────────
    if progress_callback:
        await progress_callback({"event": "step", "step": "summarizing", "message": "Generating AI summary with citations..."})

    summary, citations = await _generate_summary(query, fused)

    if progress_callback:
        await progress_callback({"event": "summary_complete", "summary_length": len(summary)})

    # ──────────────────────────────────────────────
    # Step 5: Gap Analysis
    # ──────────────────────────────────────────────
    if progress_callback:
        await progress_callback({"event": "step", "step": "gap_analysis", "message": "Identifying research gaps and opportunities..."})

    gap_analysis = await _generate_gap_analysis(query, fused, summary)

    if progress_callback:
        await progress_callback({"event": "step", "step": "complete", "message": "Search complete!"})

    # ──────────────────────────────────────────────
    # Step 6: Persistence
    # ──────────────────────────────────────────────
    await _persist_results(result_id, project_id, query, fused, summary, citations)

    return DeepSearchResponse(
        id=result_id,
        query=query,
        sources=fused,
        summary=summary,
        citations=citations,
        gap_analysis=gap_analysis,
        created_at=datetime.now(timezone.utc),
    )


# ════════════════════════════════════════════════
# Step 1: Query Understanding
# ════════════════════════════════════════════════

async def _generate_sub_queries(query: str) -> Dict[str, str]:
    """
    Use Gemini to break the user's idea into optimized sub-queries
    for each source type.
    """
    prompt = f"""You are a research assistant. Given the user's idea below, generate optimized search queries for each source.

User's Idea: "{query}"

Return a JSON object with these keys:
- "arxiv": A query optimized for searching academic papers on arXiv
- "github": A query optimized for searching GitHub repositories
- "scholar": A query optimized for Semantic Scholar academic search
- "web": A query optimized for general web search

Keep each query concise (5-15 words), focused, and use appropriate terminology for each platform.
Return ONLY the JSON object, no markdown formatting or code blocks."""

    try:
        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=500,
            ),
        )
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        return json.loads(text)
    except Exception as e:
        logger.warning(f"[DeepSearch] Sub-query generation failed, using original query: {e}")
        return {
            "arxiv": query,
            "github": query,
            "scholar": query,
            "web": query,
        }


# ════════════════════════════════════════════════
# Step 2: Parallel Source Fetching
# ════════════════════════════════════════════════

async def _fetch_all_sources(
    original_query: str,
    sub_queries: Dict[str, str],
    sources_to_search: List[str],
    progress_callback=None,
) -> List[SearchSource]:
    """Fetch results from all requested sources concurrently."""

    tasks = {}
    if "arxiv" in sources_to_search:
        tasks["arxiv"] = search_arxiv(sub_queries.get("arxiv", original_query))
    if "github" in sources_to_search:
        tasks["github"] = search_github(sub_queries.get("github", original_query))
    if "scholar" in sources_to_search:
        tasks["scholar"] = search_scholar(sub_queries.get("scholar", original_query))
    if "web" in sources_to_search:
        tasks["web"] = search_web(sub_queries.get("web", original_query))

    # Run all concurrently
    source_names = list(tasks.keys())
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)

    all_sources: List[SearchSource] = []
    for name, result in zip(source_names, results):
        if isinstance(result, Exception):
            logger.error(f"[DeepSearch] {name} failed: {result}")
            if progress_callback:
                await progress_callback({"event": "source_error", "source": name, "error": str(result)})
        elif isinstance(result, list):
            all_sources.extend(result)
            if progress_callback:
                await progress_callback({"event": "source_found", "source": name, "count": len(result)})

    return all_sources


# ════════════════════════════════════════════════
# Step 3: Result Fusion & Ranking
# ════════════════════════════════════════════════

def _fuse_and_rank(sources: List[SearchSource], query: str) -> List[SearchSource]:
    """Deduplicate by URL and assign relevance scores."""

    # Deduplicate by URL
    seen_urls = set()
    unique: List[SearchSource] = []
    for source in sources:
        normalized_url = source.url.rstrip("/").lower()
        if normalized_url not in seen_urls:
            seen_urls.add(normalized_url)
            unique.append(source)

    # Simple relevance scoring based on query term matching
    query_terms = set(query.lower().split())
    for source in unique:
        text = f"{source.title} {source.snippet}".lower()
        matched = sum(1 for term in query_terms if term in text)
        term_score = matched / max(len(query_terms), 1)

        # Boost by source type (academic sources get slight boost)
        type_boost = {"arxiv": 0.1, "scholar": 0.1, "github": 0.05, "web": 0.0}
        boost = type_boost.get(source.source_type, 0.0)

        # Combine: existing score (from Tavily) or computed score
        base = source.relevance_score if source.relevance_score > 0 else term_score
        source.relevance_score = round(min(base + boost, 1.0), 3)

    # Sort by relevance (highest first)
    unique.sort(key=lambda s: s.relevance_score, reverse=True)
    return unique


# ════════════════════════════════════════════════
# Step 4: AI Summarization
# ════════════════════════════════════════════════

async def _generate_summary(query: str, sources: List[SearchSource]) -> tuple[str, List[dict]]:
    """
    Generate a structured summary with inline citations using Gemini.
    Returns (summary_text, citations_list).
    """
    # Build source reference list for the prompt
    source_refs = []
    for i, s in enumerate(sources[:25], 1):  # Cap at 25 for context length
        source_refs.append(
            f"[{i}] {s.title} ({s.source_type}) — {s.snippet[:150]}"
        )
    sources_text = "\n".join(source_refs)

    prompt = f"""You are a research synthesis expert. Analyze the following search results about the user's idea and produce a comprehensive research summary.

## User's Research Idea
"{query}"

## Search Results
{sources_text}

## Instructions
1. Write a structured research summary (500-800 words) covering:
   - **Current State of Research**: What has been done in this area
   - **Key Approaches & Technologies**: Main methods and tools being used
   - **Notable Projects & Papers**: Highlight the most relevant findings
   - **Technical Considerations**: Important technical aspects to consider

2. Use inline citations like [1], [2], etc. to reference the sources above.
3. Be specific and technical — this is for a researcher/student, not general public.
4. Use markdown formatting (headers, bold, lists).
5. Do NOT start with "Here is..." or similar meta-text. Start directly with the content."""

    try:
        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=2000,
            ),
        )
        summary = response.text.strip()

        # Build citations list
        citations = []
        for i, s in enumerate(sources[:25], 1):
            citations.append({
                "number": i,
                "title": s.title,
                "url": s.url,
                "source_type": s.source_type,
            })

        return summary, citations

    except Exception as e:
        logger.error(f"[DeepSearch] Summary generation failed: {e}")
        return (
            "⚠️ Summary generation failed. Please check your Gemini API key and try again.",
            [],
        )


# ════════════════════════════════════════════════
# Step 5: Gap Analysis
# ════════════════════════════════════════════════

async def _generate_gap_analysis(query: str, sources: List[SearchSource], summary: str) -> str:
    """Identify research gaps and innovation opportunities."""
    prompt = f"""You are an innovation analyst. Based on the research summary below about the user's idea, identify gaps and opportunities.

## User's Idea
"{query}"

## Research Summary
{summary}

## Instructions
Produce a concise gap analysis (200-400 words) covering:
1. **What's Missing**: What existing solutions lack — unaddressed problems, limitations
2. **Innovation Opportunities**: Specific areas where the user can differentiate
3. **Recommended Approach**: A brief suggestion for how to build something unique

Format using markdown with headers and bullet points. Be specific and actionable.
Do NOT start with "Here is..." or similar meta-text. Start directly with the analysis."""

    try:
        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1000,
            ),
        )
        return response.text.strip()

    except Exception as e:
        logger.error(f"[DeepSearch] Gap analysis failed: {e}")
        return "⚠️ Gap analysis generation failed."


# ════════════════════════════════════════════════
# Step 6: Persistence
# ════════════════════════════════════════════════

async def _persist_results(
    result_id: str,
    project_id: Optional[str],
    query: str,
    sources: List[SearchSource],
    summary: str,
    citations: List[dict],
) -> None:
    """Save search results to Supabase."""
    try:
        record = {
            "id": result_id,
            "query": query,
            "sources": [s.model_dump() for s in sources],
            "summary": summary,
            "citations": citations,
        }
        if project_id:
            record["project_id"] = project_id

        await asyncio.to_thread(
            lambda: supabase_admin.table("search_results").insert(record).execute()
        )
        logger.info(f"[DeepSearch] Results saved with ID: {result_id}")

    except Exception as e:
        # Don't fail the whole search if persistence fails
        logger.error(f"[DeepSearch] Failed to persist results: {e}")
