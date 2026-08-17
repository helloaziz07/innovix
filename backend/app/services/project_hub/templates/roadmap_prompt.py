"""
Innovix — Roadmap Prompt Template

Generates a development roadmap with phased milestones and a weekly timeline.
Called separately to produce detailed, actionable planning.
"""


def get_roadmap_prompt(idea: str, tech_stack_json: str, architecture_json: str) -> str:
    """
    Build the roadmap/timeline generation prompt.

    Args:
        idea: The user's project idea.
        tech_stack_json: JSON string of the recommended tech stack.
        architecture_json: JSON string of the architecture (components).

    Returns:
        The full prompt string to send to Gemini.
    """
    return f"""You are a project manager and technical lead. Create a development roadmap for the following project.

## Project Idea
"{idea}"

## Tech Stack
{tech_stack_json}

## Architecture
{architecture_json}

## Instructions
Generate a phased development roadmap with milestones and a weekly breakdown.

Return ONLY a valid JSON object (no markdown code fences):

{{
    "roadmap": [
        {{
            "phase": 1,
            "name": "Phase name (e.g., Foundation & Setup)",
            "duration_weeks": 1,
            "description": "What gets built in this phase",
            "milestones": [
                {{
                    "name": "Milestone name",
                    "deliverables": ["Deliverable 1", "Deliverable 2"],
                    "priority": "critical/high/medium/low"
                }}
            ],
            "dependencies": ["Any prerequisite phases"]
        }}
    ],
    "timeline": [
        {{
            "week": 1,
            "phase": 1,
            "tasks": ["Task 1", "Task 2", "Task 3"],
            "focus_area": "What the main focus is this week"
        }}
    ],
    "project_tasks": [
        {{
            "title": "Task title",
            "description": "Detailed description of the task",
            "required_role": "frontend|backend|design|devops|fullstack",
            "estimated_effort": "low|medium|high"
        }}
    ],
    "total_weeks": 8,
    "mvp_ready_by_week": 4,
    "risks": [
        {{
            "risk": "Risk description",
            "impact": "high/medium/low",
            "mitigation": "How to mitigate"
        }}
    ]
}}

Guidelines:
- Plan for 6-12 weeks total (realistic for a student project)
- Include 3-5 phases with clear milestones
- Each week should have 3-5 concrete tasks
- Provide a comprehensive list of actionable `project_tasks` based on the roadmap.
- Assign a clear `required_role` to each task.
- Identify an MVP milestone (minimal viable demo)
- Include 2-4 project risks with mitigation strategies
- Dependencies should reference phase numbers
- Be realistic about what a solo developer or small team can achieve
"""
