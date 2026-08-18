"""
Innovix — Task Generation Prompt Template

Generates a detailed list of project tasks based on the completed plan.
"""

def get_task_prompt(idea: str, tech_stack_json: str, architecture_json: str, roadmap_json: str, team_size: int = 4) -> str:
    """
    Build the standalone task generation prompt.

    Args:
        idea: The user's project idea.
        tech_stack_json: JSON string of the tech stack.
        architecture_json: JSON string of the architecture.
        roadmap_json: JSON string of the roadmap.
        team_size: Number of members in the team.

    Returns:
        The full prompt string to send to Gemini.
    """
    return f"""You are a technical project manager. Your job is to break down the following software project into actionable tasks.

## Project Idea
"{idea}"

## Tech Stack
{tech_stack_json}

## Architecture
{architecture_json}

## Roadmap / Timeline
{roadmap_json}

## Instructions
Based on the provided Project Plan, Architecture, and Roadmap, generate a comprehensive list of actionable tasks required to build this project.

Return ONLY a valid JSON object (no markdown code fences):

{{
    "project_tasks": [
        {{
            "title": "Task title",
            "description": "Detailed description of the task",
            "required_role": "frontend|backend|design|devops|fullstack",
            "estimated_effort": "low|medium|high",
            "assignee": "Person 1"
        }}
    ]
}}

Guidelines:
- Generate 15-30 detailed, actionable tasks covering the entire roadmap.
- The project has a team of {team_size} people. Divide the tasks evenly among them and specify the assignee for each task in the `assignee` field (e.g., "Person 1", "Person 2", up to "Person {team_size}").
- Assign a clear `required_role` to each task based on standard software development roles (frontend, backend, design, devops, QA, fullstack).
- Make the descriptions highly detailed and technical where appropriate.
"""
