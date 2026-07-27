"""
Innovix — LangChain Research Agent

A LangChain-based agent that uses Gemini for multi-step reasoning and
each search source as a tool. Provides an alternative to the direct
orchestrator pipeline, enabling autonomous research with tool-use.

This agent can:
  - Break an idea into sub-queries
  - Decide which sources to search
  - Synthesize results across multiple searches
  - Generate follow-up queries based on initial findings
"""

import logging
from typing import List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import StructuredTool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.config import settings
from app.services.search.sources.arxiv_source import search_arxiv
from app.services.search.sources.github_source import search_github
from app.services.search.sources.scholar_source import search_scholar
from app.services.search.sources.web_source import search_web

logger = logging.getLogger(__name__)


def _create_llm():
    """Create the Gemini LLM instance for the agent."""
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.gemini_api_key,
        temperature=0.3,
        max_output_tokens=2000,
    )


def _create_tools() -> List[StructuredTool]:
    """Register each search source as a LangChain tool."""

    async def _arxiv_tool(query: str) -> str:
        """Search arXiv for academic papers. Returns paper titles and abstracts."""
        results = await search_arxiv(query, max_results=5)
        if not results:
            return "No arXiv results found."
        return "\n\n".join(
            f"📄 {r.title}\n   {r.snippet}\n   URL: {r.url}"
            for r in results
        )

    async def _github_tool(query: str) -> str:
        """Search GitHub for relevant repositories. Returns repo names, descriptions, and stars."""
        results = await search_github(query, max_results=5)
        if not results:
            return "No GitHub results found (check GITHUB_TOKEN)."
        return "\n\n".join(
            f"🔗 {r.title} (⭐ {r.metadata.get('stars', 0)})\n   {r.snippet}\n   URL: {r.url}"
            for r in results
        )

    async def _scholar_tool(query: str) -> str:
        """Search Semantic Scholar for academic papers. Returns titles, citation counts."""
        results = await search_scholar(query, max_results=5)
        if not results:
            return "No Semantic Scholar results found."
        return "\n\n".join(
            f"📚 {r.title} (Citations: {r.metadata.get('citation_count', 0)})\n   {r.snippet}\n   URL: {r.url}"
            for r in results
        )

    async def _web_tool(query: str) -> str:
        """Search the web for general results. Returns titles and snippets."""
        results = await search_web(query, max_results=5)
        if not results:
            return "No web results found (check TAVILY_API_KEY or SERPAPI_KEY)."
        return "\n\n".join(
            f"🌐 {r.title}\n   {r.snippet}\n   URL: {r.url}"
            for r in results
        )

    return [
        StructuredTool.from_function(
            coroutine=_arxiv_tool,
            name="search_arxiv",
            description="Search arXiv for academic research papers. Input: a search query string.",
        ),
        StructuredTool.from_function(
            coroutine=_github_tool,
            name="search_github",
            description="Search GitHub for relevant open-source repositories. Input: a search query string.",
        ),
        StructuredTool.from_function(
            coroutine=_scholar_tool,
            name="search_semantic_scholar",
            description="Search Semantic Scholar for academic papers with citation data. Input: a search query string.",
        ),
        StructuredTool.from_function(
            coroutine=_web_tool,
            name="search_web",
            description="Search the web for general articles, blog posts, and documentation. Input: a search query string.",
        ),
    ]


AGENT_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are Innovix Research Agent — an AI research assistant that helps students
explore and validate project ideas.

Your workflow:
1. Analyze the user's idea and break it into research sub-topics
2. Use your search tools to gather information from multiple sources
3. Synthesize findings into a coherent research summary
4. Identify gaps in existing solutions and innovation opportunities

Guidelines:
- Use ALL available tools to get a comprehensive picture
- Be specific and cite sources when synthesizing
- Focus on what's relevant to the user's specific idea
- Highlight practical, actionable insights

Always structure your final response with:
- **Research Findings**: Key discoveries across sources
- **Existing Solutions**: What already exists
- **Gaps & Opportunities**: Where the user can innovate
- **Recommended Next Steps**: Concrete actions"""
    ),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])


async def run_research_agent(
    query: str,
    max_iterations: int = 6,
) -> str:
    """
    Run the LangChain research agent for autonomous multi-step research.

    Args:
        query: The user's research idea or question.
        max_iterations: Max tool-use iterations before stopping.

    Returns:
        The agent's final synthesized research output as a string.
    """
    try:
        llm = _create_llm()
        tools = _create_tools()
        agent = create_tool_calling_agent(llm, tools, AGENT_PROMPT)

        executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            max_iterations=max_iterations,
            handle_parsing_errors=True,
            return_intermediate_steps=False,
        )

        result = await executor.ainvoke({"input": query})
        return result.get("output", "No output generated.")

    except Exception as e:
        logger.error(f"[ResearchAgent] Agent execution failed: {e}")
        return f"Research agent encountered an error: {str(e)}"
