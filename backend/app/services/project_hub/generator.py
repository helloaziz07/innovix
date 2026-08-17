"""
Innovix — AI Project Plan Generator

The core engine for Phase 3 (Project HUB). Takes a project's idea + DeepSearch
results and uses Gemini to generate a fully structured plan via chained prompts:

  1. Main Plan  → problem_validation, existing_solutions, innovation_opportunities,
                   tech_stack, api_datasets, github_repos, documentation
  2. Architecture → Mermaid diagram + component breakdown + design patterns
  3. Roadmap     → Phased milestones + weekly timeline + risks

Results are stored in the project's JSONB columns (project_plan, tech_stack,
architecture, timeline) and the project status is updated.
"""

import asyncio
import json
import logging
from typing import Optional, List, Dict, Any

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import supabase_admin
from app.services.project_hub.templates.project_plan_prompt import get_project_plan_prompt
from app.services.project_hub.templates.architecture_prompt import get_architecture_prompt
from app.services.project_hub.templates.roadmap_prompt import get_roadmap_prompt
from app.services.task_assignment import run_matchmaker

logger = logging.getLogger(__name__)

# Gemini client — same singleton pattern as deep_search.py
gemini_client = genai.Client(api_key=settings.gemini_api_key)
GEMINI_MODEL = "gemini-3.5-flash-lite"


class GenerationCancelled(Exception):
    """Raised when the user cancels plan generation mid-pipeline."""
    pass


async def generate_project_plan(
    project_id: str,
    user_id: str,
    progress_callback=None,
    cancel_event: Optional[asyncio.Event] = None,
    target_phase: str = "full",
) -> Dict[str, Any]:
    """
    Generate a complete project plan for the given project.

    Fetches the project's idea and any DeepSearch results, then chains
    three Gemini calls to build the full plan.

    Args:
        project_id: The project UUID.
        user_id: The authenticated user's UUID (for ownership verification).
        progress_callback: Optional async callback for progress events.
            Each event is a dict with: stage, message, progress (0-100).
        cancel_event: Optional asyncio.Event — if set, generation is
            aborted between stages and GenerationCancelled is raised.
        target_phase: "full", "main_plan", "architecture", or "roadmap".
            Halts generation after the specified phase is complete.

    Returns:
        The complete plan dict with all generated sections.

    Raises:
        ValueError: If the project isn't found or doesn't belong to the user.
        GenerationCancelled: If the cancel_event is set mid-generation.
    """

    def _check_cancelled():
        if cancel_event and cancel_event.is_set():
            logger.info(f"[ProjectHub] Generation cancelled for project {project_id}")
            raise GenerationCancelled("Plan generation was cancelled by the user.")

    async def _emit(stage: str, message: str, progress: int):
        if progress_callback:
            await progress_callback({
                "stage": stage,
                "message": message,
                "progress": progress,
            })

    # ─── Fetch project ──────────────────────────────────────
    project = await _get_project(project_id, user_id)
    idea = project["idea_text"]

    # ─── Stage 1: Fetch research context ────────────────────
    await _emit("fetching_research", "Gathering research context from DeepSearch...", 5)
    research_summary, sources_text, gap_analysis = await _get_research_context(project_id)
    _check_cancelled()
    await _emit("fetching_research", "Research context loaded.", 10)

    # Initialize partials from existing project data
    main_plan = project.get("project_plan") or {}
    architecture = project.get("architecture") or {}
    tech_stack = project.get("tech_stack") or []
    roadmap = project.get("timeline") or {}

    # ─── Stage 2: Main Plan (Gemini call 1) ─────────────────
    if target_phase in ["full", "main_plan"] or (not main_plan and target_phase not in ["architecture", "roadmap"]):
        await _emit("main_plan", "Analyzing idea and generating plan structure...", 15)
        _check_cancelled()
        main_plan = await _generate_main_plan(idea, research_summary, sources_text, gap_analysis)
        logger.info(f"[ProjectHub] Main plan generated for project {project_id}")
        _check_cancelled()
        await _emit("main_plan", "Plan structure complete.", 40 if target_phase == "full" else 90)
    else:
        await _emit("main_plan", "Using existing Foundation plan...", 40)

    if target_phase == "main_plan":
        # Save early
        await _emit("saving", "Saving partial plan to database...", 92)
        full_plan = {
            **main_plan,
            "tech_stack": tech_stack,
            "architecture": architecture,
            "roadmap": roadmap.get("roadmap", []),
            "timeline": roadmap.get("timeline", []),
            "total_weeks": roadmap.get("total_weeks", 8),
            "mvp_ready_by_week": roadmap.get("mvp_ready_by_week", 4),
            "risks": roadmap.get("risks", []),
        }
        await _persist_plan(project_id, full_plan, target_phase)
        await _emit("complete", "Project plan generated successfully!", 100)
        return full_plan

    # ─── Stage 3: Architecture (Gemini call 2) ──────────────
    if target_phase in ["full", "architecture"] or (not architecture and target_phase not in ["main_plan", "roadmap"]):
        await _emit("architecture", "Designing system architecture...", 45)
        _check_cancelled()
        architecture = await _generate_architecture(idea)
        logger.info(f"[ProjectHub] Architecture generated for project {project_id}")
        _check_cancelled()
        await _emit("architecture", "Architecture design complete.", 70 if target_phase == "full" else 90)
        
        # Extract tech_stack from the newly generated architecture
        tech_stack = architecture.pop("tech_stack", [])
    else:
        await _emit("architecture", "Using existing Architecture & Tech Stack...", 70)

    if target_phase == "architecture":
        # Save early
        await _emit("saving", "Saving partial plan to database...", 92)
        full_plan = {
            **main_plan,
            "tech_stack": tech_stack,
            "architecture": architecture,
            "roadmap": roadmap.get("roadmap", []),
            "timeline": roadmap.get("timeline", []),
            "total_weeks": roadmap.get("total_weeks", 8),
            "mvp_ready_by_week": roadmap.get("mvp_ready_by_week", 4),
            "risks": roadmap.get("risks", []),
        }
        await _persist_plan(project_id, full_plan, target_phase)
        await _emit("complete", "Project plan generated successfully!", 100)
        return full_plan

    # ─── Stage 4: Roadmap (Gemini call 3) ───────────────────
    if target_phase in ["full", "roadmap"] or (not roadmap and target_phase not in ["main_plan", "architecture"]):
        await _emit("roadmap", "Building development roadmap...", 75)
        _check_cancelled()
        tech_stack_json = json.dumps(tech_stack, indent=2)
        architecture_json = json.dumps(architecture.get("components", []), indent=2)
        roadmap = await _generate_roadmap(idea, tech_stack_json, architecture_json)
        logger.info(f"[ProjectHub] Roadmap generated for project {project_id}")
        _check_cancelled()
        await _emit("roadmap", "Roadmap complete.", 90)
    else:
        await _emit("roadmap", "Using existing Roadmap...", 90)

    # ─── Stage 5: Persist ───────────────────────────────────
    await _emit("saving", "Saving plan to database...", 92)
    full_plan = {
        **main_plan,
        "tech_stack": tech_stack,
        "architecture": architecture,
        "roadmap": roadmap.get("roadmap", []),
        "timeline": roadmap.get("timeline", []),
        "total_weeks": roadmap.get("total_weeks", 8),
        "mvp_ready_by_week": roadmap.get("mvp_ready_by_week", 4),
        "risks": roadmap.get("risks", []),
        "project_tasks": roadmap.get("project_tasks", []),
    }

    await _persist_plan(project_id, full_plan, target_phase)
    await _emit("complete", "Project plan generated successfully!", 100)

    return full_plan


# ════════════════════════════════════════════════
# Internal helpers
# ════════════════════════════════════════════════

async def _get_project(project_id: str, user_id: str) -> dict:
    """Fetch and validate project ownership."""
    try:
        result = (
            supabase_admin.table("projects")
            .select("*")
            .eq("id", project_id)
            .execute()
        )
        if not result.data:
            raise ValueError(f"Project {project_id} not found")
            
        project = result.data[0]
        if project.get("user_id") != user_id:
            member_res = (
                supabase_admin.table("project_members")
                .select("*")
                .eq("project_id", project_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            if not member_res.data:
                raise ValueError(f"Project {project_id} not found or access denied")
                
        return project
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise ValueError(f"Project {project_id} not found or access denied")


async def _get_research_context(project_id: str) -> tuple[str, str, str]:
    """
    Fetch DeepSearch results for this project and format them
    as context for the plan generator.

    Returns (research_summary, sources_text, gap_analysis).
    """
    try:
        result = (
            supabase_admin.table("search_results")
            .select("query, summary, sources, citations")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        searches = result.data or []
    except Exception:
        searches = []

    if not searches:
        return (
            "No prior research available. Generate plan based on the idea alone.",
            "No sources available.",
            "No gap analysis available — identify gaps from general knowledge.",
        )

    # Combine summaries from all searches
    summaries = []
    all_sources = []
    for search in searches:
        if search.get("summary"):
            summaries.append(f"### Search: \"{search.get('query', 'Unknown')}\"\n{search['summary']}")
        sources = search.get("sources", [])
        if isinstance(sources, list):
            for s in sources[:10]:
                if isinstance(s, dict):
                    all_sources.append(
                        f"- [{s.get('source_type', 'web')}] {s.get('title', 'Untitled')} — {s.get('snippet', '')[:120]}"
                    )

    research_summary = "\n\n".join(summaries) if summaries else "No summaries available."
    sources_text = "\n".join(all_sources[:30]) if all_sources else "No sources available."
    gap_analysis = "Derive gaps from the research summary and sources provided."

    return research_summary, sources_text, gap_analysis


async def _generate_main_plan(
    idea: str, research_summary: str, sources_text: str, gap_analysis: str
) -> Dict[str, Any]:
    """Generate the main plan via Gemini (Step 1)."""
    prompt = get_project_plan_prompt(idea, research_summary, sources_text, gap_analysis)
    return await _call_gemini_json(prompt, max_tokens=4000)


async def _generate_architecture(idea: str) -> Dict[str, Any]:
    """Generate architecture via Gemini (Step 2)."""
    prompt = get_architecture_prompt(idea)
    return await _call_gemini_json(prompt, max_tokens=3000)


async def _generate_roadmap(idea: str, tech_stack_json: str, architecture_json: str) -> Dict[str, Any]:
    """Generate roadmap via Gemini (Step 3)."""
    prompt = get_roadmap_prompt(idea, tech_stack_json, architecture_json)
    return await _call_gemini_json(prompt, max_tokens=3000)


async def _call_gemini_json(prompt: str, max_tokens: int = 3000) -> Dict[str, Any]:
    """
    Call Gemini and parse the response as JSON.
    Handles markdown code fences and common formatting issues.
    """
    try:
        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=max_tokens,
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

    except json.JSONDecodeError as e:
        logger.error(f"[ProjectHub] Failed to parse Gemini JSON response: {e}")
        logger.debug(f"[ProjectHub] Raw response: {text[:500]}")
        return {"error": "Failed to parse AI response", "raw_text": text[:1000]}
    except Exception as e:
        logger.error(f"[ProjectHub] Gemini call failed: {e}")
        return {"error": f"AI generation failed: {str(e)}"}


async def _update_project_status(project_id: str, status: str) -> None:
    """Update the project's status field."""
    try:
        await asyncio.to_thread(
            lambda: supabase_admin.table("projects")
            .update({"status": status})
            .eq("id", project_id)
            .execute()
        )
    except Exception as e:
        logger.warning(f"[ProjectHub] Failed to update status: {e}")


async def _persist_plan(project_id: str, plan: Dict[str, Any], target_phase: str) -> None:
    """
    Store the generated plan in the project's JSONB columns
    and update status based on what data actually exists.
    """
    try:
        # Determine actual status based on what content we have
        has_roadmap = bool(plan.get("roadmap") or plan.get("timeline"))
        has_architecture = bool(plan.get("architecture") and len(plan.get("architecture", {}).keys()) > 0)
        has_plan = bool(plan and len(plan.keys()) > 0)

        new_status = "completed" if (has_roadmap and has_architecture) else (
            "architecting" if has_architecture else (
                "planning" if has_plan else "new"
            )
        )

        update_data = {
            "project_plan": plan,
            "tech_stack": plan.get("tech_stack", []),
            "architecture": plan.get("architecture", {}),
            "timeline": {
                "roadmap": plan.get("roadmap", []),
                "timeline": plan.get("timeline", []),
                "total_weeks": plan.get("total_weeks", 8),
                "mvp_ready_by_week": plan.get("mvp_ready_by_week", 4),
                "risks": plan.get("risks", []),
            },
            "status": new_status,
        }

        await asyncio.to_thread(
            lambda: supabase_admin.table("projects")
            .update(update_data)
            .eq("id", project_id)
            .execute()
        )
        logger.info(f"[ProjectHub] Plan persisted for project {project_id} with status {new_status}")

        # Save extracted tasks if present
        project_tasks = plan.get("project_tasks", [])
        if project_tasks and target_phase in ["full", "roadmap"]:
            task_inserts = []
            for t in project_tasks:
                task_inserts.append({
                    "project_id": project_id,
                    "title": t.get("title", "Untitled Task"),
                    "description": t.get("description", ""),
                    "required_role": t.get("required_role", ""),
                    "estimated_effort": t.get("estimated_effort", "medium")
                })
            
            if task_inserts:
                # Clear old tasks just in case we are regenerating
                await asyncio.to_thread(
                    lambda: supabase_admin.table("project_tasks")
                    .delete()
                    .eq("project_id", project_id)
                    .execute()
                )
                
                await asyncio.to_thread(
                    lambda: supabase_admin.table("project_tasks")
                    .insert(task_inserts)
                    .execute()
                )
                
                # Run the Matchmaker
                await run_matchmaker(project_id)

    except Exception as e:
        logger.error(f"[ProjectHub] Failed to persist plan: {e}")
