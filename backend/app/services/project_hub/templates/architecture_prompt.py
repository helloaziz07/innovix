"""
Innovix — Architecture Prompt Template

Generates system architecture as a Mermaid diagram plus a component breakdown.
Called separately from the main plan to keep context focused and diagram quality high.
"""


def get_architecture_prompt(idea: str, tech_stack_json: str) -> str:
    """
    Build the architecture generation prompt.

    Args:
        idea: The user's project idea.
        tech_stack_json: JSON string of the recommended tech stack from the plan.

    Returns:
        The full prompt string to send to Gemini.
    """
    return f"""You are a senior software architect. Design the system architecture for the following project.

## Project Idea
"{idea}"

## Recommended Tech Stack
{tech_stack_json}

## Instructions
Generate a system architecture with two parts:

1. **Mermaid Diagram** — A `graph TB` or `graph LR` Mermaid diagram showing:
   - Major components/services (frontend, backend, database, external APIs, etc.)
   - Data flow arrows between components
   - Group related components in subgraphs with descriptive labels
   - Use meaningful node labels (not just abbreviations)

2. **Component Breakdown** — A list of components with descriptions.

Return ONLY a valid JSON object (no markdown code fences):

{{
    "mermaid_diagram": "graph TB\\n    subgraph \\"Frontend\\"\\n        ...",
    "components": [
        {{
            "name": "Component name",
            "type": "frontend/backend/database/service/external",
            "description": "What this component does",
            "technologies": ["Tech 1", "Tech 2"],
            "connections": ["Connected Component 1", "Connected Component 2"]
        }}
    ],
    "design_patterns": [
        {{
            "pattern": "Pattern name (e.g., MVC, Event-Driven, Microservices)",
            "where": "Where it's applied",
            "why": "Why this pattern fits"
        }}
    ],
    "deployment_notes": "Brief notes on how this should be deployed"
}}

Guidelines:
- The Mermaid diagram must be syntactically valid — quote labels containing special characters
- Include 4-8 components in the breakdown
- Suggest 2-3 relevant design patterns
- Keep the architecture practical for a student/developer to implement
- Use escape sequences for newlines in the Mermaid string (\\n, not actual newlines)
"""
