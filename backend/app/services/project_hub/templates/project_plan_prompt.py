"""
Innovix — Project Plan Prompt Template

Master prompt that generates the overall structured project plan
from a user's idea and DeepSearch results.

Returns a JSON-structured plan with all 10 sections.
"""


def get_project_plan_prompt(idea: str, research_summary: str, sources_text: str, gap_analysis: str) -> str:
    """
    Build the master project plan generation prompt.

    Args:
        idea: The user's original project idea.
        research_summary: The AI-generated summary from DeepSearch.
        sources_text: Formatted list of sources found during research.
        gap_analysis: The gap analysis from DeepSearch.

    Returns:
        The full prompt string to send to Gemini.
    """
    return f"""You are an expert project architect and technical planner. Based on the research below, generate a comprehensive project plan.

## User's Project Idea
"{idea}"

## Research Summary
{research_summary}

## Research Sources
{sources_text}

## Gap Analysis
{gap_analysis}

## Instructions
Generate a complete, structured project plan as a JSON object. Each section must be detailed and actionable.
CRITICAL: For arrays like `existing_solutions`, `innovation_opportunities`, `tech_stack`, `api_datasets`, and `github_repos`, you MUST extract and provide at least 5 to 8 high-quality items each based on the research. Do not be lazy.
CRITICAL: The ENTIRE JSON output MUST be written in English, regardless of the language of the user's idea. Do not translate the JSON keys or values.

Return ONLY a valid JSON object (no markdown code fences) with this exact structure:

{{
    "problem_validation": {{
        "is_worth_solving": true/false,
        "market_size": "Description of market size and potential",
        "business_perspective": "Analyze monetization potential (subscriptions, selling, etc.). ONLY provide a Business POV if the idea can actually make money. If there is absolutely no business perspective or monetization potential, output EXACTLY: 'No business perspective exists'.",
        "target_users": ["User type 1", "User type 2", ...],
        "pain_points": ["Pain point 1", "Pain point 2", ...],
        "summary": "2-3 sentence validation summary"
    }},
    "existing_solutions": [
        {{
            "name": "Solution name",
            "description": "What it does",
            "url": "URL if available",
            "pros": ["Pro 1", "Pro 2"],
            "cons": ["Con 1", "Con 2"],
            "pricing": "Free / Paid / Freemium"
        }}
    ],
    "innovation_opportunities": [
        {{
            "area": "Area of innovation",
            "description": "What's missing and how to differentiate",
            "impact": "high/medium/low",
            "feasibility": "high/medium/low"
        }}
    ],
    "tech_stack": [
        {{
            "layer": "Frontend/Backend/Database/AI/DevOps/etc.",
            "technology": "Technology name",
            "justification": "Why this choice",
            "alternatives": ["Alt 1", "Alt 2"]
        }}
    ],
    "api_datasets": [
        {{
            "name": "API or Dataset name",
            "type": "api/dataset",
            "url": "URL",
            "description": "What it provides",
            "pricing": "Free / Paid / Freemium",
            "relevance": "How it's used in this project"
        }}
    ],
    "github_repos": [
        {{
            "name": "repo-owner/repo-name",
            "url": "GitHub URL",
            "stars": "Approximate star count",
            "description": "What it does and why it's relevant",
            "use_case": "How to use it — reference, fork, or integrate"
        }}
    ],
    "documentation": {{
        "project_title": "Title for the project",
        "tagline": "One-line description",
        "readme_sections": ["Overview", "Features", "Tech Stack", "Installation", "Usage", "Contributing", "License"],
        "proposal_outline": "3-5 paragraph project proposal text"
    }}
}}

Important guidelines:
- Be specific and technical — this is for a developer/student
- Include at least 3 existing solutions (or note if the area is truly novel)
- Recommend 5-10 tech stack items across layers
- Suggest at least 3 relevant APIs/datasets
- Include 3-5 relevant GitHub repositories
- The documentation section should have a real, usable proposal outline
- All URLs should be real/plausible (not made up)
"""
