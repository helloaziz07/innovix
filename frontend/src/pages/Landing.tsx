import { Menu, ArrowRight, PlayCircle, BarChart3, TrendingUp, Layers, Workflow, Brain, Search, Rocket, Bot, Globe, BookOpen, Terminal, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

const FEATURE_DOCS: Record<string, { title: string; subtitle: string; content: React.ReactNode }> = {
  'DeepSearch': {
    title: 'DeepSearch Engine',
    subtitle: 'AI-powered multi-source research across academic and web databases.',
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p><strong>DeepSearch</strong> is the core research engine of Innovix. Instead of a standard web search, it acts as an autonomous AI researcher that aggregates data from multiple highly-credible sources simultaneously.</p>
        <h4 className="font-semibold text-slate-900 mt-4">Key Capabilities:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Multi-Source Querying:</strong> Fetches live data from arXiv (academic papers), GitHub (open-source repositories), Semantic Scholar, and SerpAPI (real-time web).</li>
          <li><strong>AI Synthesis:</strong> Uses Gemini 2.0 to synthesize findings into a comprehensive research summary, fully backed by inline citations.</li>
          <li><strong>Gap Analysis:</strong> Automatically identifies what existing solutions lack, highlighting unique innovation opportunities for your project.</li>
          <li><strong>Real-Time Streaming:</strong> Watch the research unfold in real-time with WebSockets streaming the AI's thought process and results directly to your screen.</li>
        </ul>
      </div>
    )
  },
  'Project HUB': {
    title: 'Project HUB & AI Generator',
    subtitle: 'Instantly transform abstract ideas into actionable project blueprints.',
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>The <strong>Project HUB</strong> is where your research translates into execution. It takes your initial idea and the synthesized research data to automatically generate a comprehensive project plan.</p>
        <h4 className="font-semibold text-slate-900 mt-4">What it Generates:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>System Architecture:</strong> Auto-generates detailed Mermaid.js system architecture diagrams with dual panning and scrolling capabilities.</li>
          <li><strong>Tech Stack Recommendations:</strong> Recommends the optimal frontend, backend, database, and infrastructure stack with AI justifications.</li>
          <li><strong>Development Roadmap:</strong> Creates phased milestones, a weekly Gantt-style timeline, and an MVP readiness estimate.</li>
          <li><strong>Audio Narration:</strong> Built-in Text-to-Speech (TTS) integration allows you to listen to your project plan like a podcast.</li>
        </ul>
      </div>
    )
  },
  'AI Agents': {
    title: 'Conversational AI Agents',
    subtitle: 'Telegram and WhatsApp bots for on-the-go progress tracking and Q&A.',
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>Stay connected to your research anywhere. Our <strong>AI Agents</strong> integrate directly into Telegram and WhatsApp, acting as your personal project managers and research assistants.</p>
        <h4 className="font-semibold text-slate-900 mt-4">Agent Features:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>On-Demand Research:</strong> Send a quick idea via message to trigger a full DeepSearch instantly.</li>
          <li><strong>Project Q&A:</strong> Ask questions about your architecture, timeline, or research, and the AI answers using Retrieval-Augmented Generation (RAG) based on your specific project context.</li>
          <li><strong>Proactive Reminders:</strong> Schedule reminders and receive automated alerts for project milestones.</li>
          <li><strong>Secure Linking:</strong> Safely link your messaging accounts to your Innovix profile via secure webhooks.</li>
        </ul>
      </div>
    )
  },
  'Web Intelligence': {
    title: 'Real-Time Web Intelligence',
    subtitle: 'Live trending topics, freshness scoring, and competitive analysis.',
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p><strong>Web Intelligence</strong> ensures your project remains relevant by continuously monitoring the live internet for emerging trends and competitors.</p>
        <h4 className="font-semibold text-slate-900 mt-4">Intelligence Tools:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Trend Detection:</strong> Identifies trending searches and emerging topics in your specific domain using real-time API integrations.</li>
          <li><strong>Freshness Scoring:</strong> Automatically scores and ranks research results based on publication date and recency to ensure you are viewing the latest data.</li>
          <li><strong>News Aggregation:</strong> Curates domain-relevant tech news from sources like HackerNews and TechCrunch.</li>
          <li><strong>Competitive Tracking:</strong> Monitors the web for similar projects to help you pivot or differentiate your solution.</li>
        </ul>
      </div>
    )
  },
  'Dashboard': {
    title: 'Personalized Dashboard',
    subtitle: 'Your command center for research analytics and AI recommendations.',
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>The <strong>Dashboard</strong> aggregates data from all your active projects, providing a bird's-eye view of your innovation pipeline.</p>
        <h4 className="font-semibold text-slate-900 mt-4">Dashboard Features:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Project Overview:</strong> Status cards showing active projects with dynamic hover effects indicating project phases (Ideation, Planning, etc.).</li>
          <li><strong>AI Insights Widget:</strong> Proactively generates insights and suggestions for your next steps based on your recent activity.</li>
          <li><strong>Progress Analytics:</strong> Radial and bar charts visualizing your research completion and project status breakdown.</li>
          <li><strong>Quick Actions:</strong> One-click shortcuts to initiate a new search, continue a project, or jump into a workspace.</li>
        </ul>
      </div>
    )
  },
  'Knowledge Clustering': {
    title: 'Knowledge Clustering',
    subtitle: 'Embedding-based thematic grouping of research into visual clusters.',
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>Make sense of massive amounts of data. <strong>Knowledge Clustering</strong> automatically organizes unstructured research results into thematic groups.</p>
        <h4 className="font-semibold text-slate-900 mt-4">How it Works:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Vector Embeddings:</strong> Converts research titles and snippets into high-dimensional TF-IDF and pgvector embeddings.</li>
          <li><strong>K-Means Clustering:</strong> Groups similar research items together automatically using unsupervised machine learning.</li>
          <li><strong>AI Labeling:</strong> Uses Gemini to analyze each cluster and assign a highly accurate, human-readable thematic label.</li>
          <li><strong>Visual Drill-Down:</strong> Interactive 2D scatter plots allow you to explore clusters visually and drill down into specific grouped results.</li>
        </ul>
      </div>
    )
  },
  'Research Workspaces': {
    title: 'Collaborative Research Workspaces',
    subtitle: 'Save, annotate, organize, and export your research findings.',
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p><strong>Research Workspaces</strong> provide a dedicated environment to organize the data you discover during the DeepSearch phase.</p>
        <h4 className="font-semibold text-slate-900 mt-4">Workspace Capabilities:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Rich Text Notes:</strong> Create, tag, and organize structured notes alongside your research.</li>
          <li><strong>Saved Results & Annotations:</strong> Save specific DeepSearch findings directly to your workspace and highlight key takeaways.</li>
          <li><strong>Multi-Format Export:</strong> Export your entire workspace—including all notes and saved results—into clean PDF, Markdown, or PPTX formats.</li>
          <li><strong>Public/Private Sharing:</strong> Toggle workspace visibility to share your findings via a public link with collaborators.</li>
        </ul>
      </div>
    )
  }
};

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const nav = document.getElementById('main-nav');
      if (nav) {
        if (window.scrollY > 20) {
          nav.classList.add('shadow-sm');
          nav.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
          nav.classList.remove('shadow-sm');
          nav.style.background = 'rgba(255, 255, 255, 0.85)';
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white text-slate-900 text-base antialiased overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">
      <style>{`
        .glass-panel {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .micro-gradient {
            background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
        }
        .ambient-shadow {
            box-shadow: 0 4px 24px rgba(37, 99, 235, 0.04);
        }
        .hover-glow:hover {
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transform: translateY(-1px);
        }
        .bg-dot-pattern {
            background-image: radial-gradient(rgba(0, 74, 198, 0.1) 1px, transparent 1px);
            background-size: 16px 16px;
        }
      `}</style>
      
      {/* Navigation (Landing Page Variant) */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-slate-200 transition-all duration-300" id="main-nav">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/logo.jpg" alt="Innovix Logo" className="w-8 h-8 rounded shrink-0 object-contain" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">Innovix</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="font-medium text-sm text-slate-600 hover:text-blue-600 transition-colors" href="#features">Features</a>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <button onClick={() => navigate('/login')} className="font-medium text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors">Sign In</button>
            <button onClick={() => navigate('/login')} className="bg-blue-600 text-white font-medium text-sm px-4 py-2 rounded-lg hover-glow transition-all duration-200 shadow-sm">Get Started</button>
          </div>
          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-600 p-4">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background Asset */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundImage: 'url("/hero-bg.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Gradient Fade to White at the Bottom */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full grid md:grid-cols-12 gap-8 items-center">
          {/* Hero Content */}
          <div className="md:col-span-7 lg:col-span-6 flex flex-col gap-8">
            <h1 className="text-5xl lg:text-6xl md:leading-[64px] font-extrabold text-slate-900 tracking-tight">
              Transform Ideas into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Reality</span> with AI-Driven Precision
            </h1>
            <p className="text-lg text-slate-600 max-w-xl">
              Research, plan, and execute your next breakthrough with Innovix—the intelligent assistant for creators and entrepreneurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 mt-4">
              <button onClick={() => navigate('/login')} className="bg-blue-600 text-white font-medium text-sm px-6 py-4 rounded-xl flex items-center justify-center gap-4 hover-glow transition-all duration-300 shadow-md">
                Get Started — It's Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <a className="bg-white text-slate-900 font-medium text-sm px-6 py-4 rounded-xl flex items-center justify-center gap-4 border border-slate-300 hover:bg-slate-50 hover:border-blue-300 transition-all duration-300" href="#demo">
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </a>
            </div>
          </div>
          {/* Hero Visual (Bento-style preview) */}
          <div className="hidden md:flex md:col-span-5 lg:col-span-6 justify-end relative">
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl"></div>
            <div className="relative w-full max-w-md grid grid-cols-2 gap-4">
              {/* Main Card */}
              <div className="col-span-2 micro-gradient rounded-xl border border-slate-200 p-6 ambient-shadow flex flex-col gap-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-sm font-bold text-slate-900">Market Analysis</span>
                  </div>
                  <span className="bg-slate-100 text-blue-600 text-[10px] px-2 py-0.5 rounded font-bold">READY</span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="h-2 w-3/4 bg-slate-200 rounded-full"></div>
                  <div className="h-2 w-1/2 bg-slate-200 rounded-full"></div>
                  <div className="h-2 w-5/6 bg-slate-200 rounded-full"></div>
                </div>
                <div className="mt-4 bg-white rounded-lg p-4 border border-slate-200 flex items-center gap-4">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600 text-xs">Opportunity Score: 94%</span>
                </div>
              </div>
              {/* Sub Card 1 */}
              <div className="micro-gradient rounded-xl border border-slate-200 p-4 ambient-shadow flex flex-col gap-2 transform -rotate-2 hover:rotate-0 transition-transform duration-500 delay-75">
                <Layers className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-sm font-bold text-slate-900 text-[10px]">Tech Stack</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] text-blue-600">R</div>
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] text-blue-600">N</div>
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] text-blue-600">T</div>
                </div>
              </div>
              {/* Sub Card 2 */}
              <div className="micro-gradient rounded-xl border border-slate-200 p-4 ambient-shadow flex flex-col gap-2 transform rotate-2 hover:rotate-0 transition-transform duration-500 delay-150">
                <Workflow className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-sm font-bold text-slate-900 text-[10px]">Flow Generated</span>
                <div className="w-full h-8 bg-white rounded border border-slate-200 relative mt-1 overflow-hidden">
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-slate-200 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-2 w-2 h-2 rounded-full bg-blue-600 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-indigo-600 -translate-y-1/2 -translate-x-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-white relative z-10" id="features">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Engineered for Breakthroughs</h2>
            <p className="text-base text-slate-600">
              Innovix combines advanced AI with intuitive structural tools to turn abstract ideas into actionable project blueprints in minutes.
            </p>
          </div>
          {/* Bento Grid Features */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div onClick={() => setSelectedFeature('DeepSearch')} className="cursor-pointer micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-purple-300 hover-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-2">DeepSearch</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  AI-powered multi-source research across arXiv, GitHub, Semantic Scholar, and the web.
                </p>
              </div>
            </div>
            {/* Feature 2 */}
            <div onClick={() => setSelectedFeature('Project HUB')} className="cursor-pointer micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-blue-300 hover-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-2">Project HUB</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Auto-generate complete project plans with architecture, tech stack, and timelines.
                </p>
              </div>
            </div>
            {/* Feature 3 */}
            <div onClick={() => setSelectedFeature('AI Agents')} className="cursor-pointer micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-teal-300 hover-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-2">AI Agents</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Telegram & WhatsApp bots for reminders, progress tracking, and Q&A.
                </p>
              </div>
            </div>
            {/* Feature 4 */}
            <div onClick={() => setSelectedFeature('Web Intelligence')} className="cursor-pointer micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-orange-300 hover-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-2">Web Intelligence</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Real-time trending topics, freshness scoring, and competitive analysis.
                </p>
              </div>
            </div>
            {/* Feature 5 */}
            <div onClick={() => setSelectedFeature('Dashboard')} className="cursor-pointer micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-pink-300 hover-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-2">Dashboard</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Personalized analytics with research insights and AI recommendations.
                </p>
              </div>
            </div>
            {/* Feature 6 */}
            <div onClick={() => setSelectedFeature('Knowledge Clustering')} className="cursor-pointer micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-purple-300 hover-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-2">Knowledge Clustering</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Embedding-based thematic grouping of research into visual clusters.
                </p>
              </div>
            </div>
            {/* Feature 7 */}
            <div onClick={() => setSelectedFeature('Research Workspaces')} className="cursor-pointer micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-emerald-300 hover-glow transition-all">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-2">Research Workspaces</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Save, annotate, organize, and export your research findings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works & Terminal Preview */}
      <section className="py-24 bg-slate-50 relative z-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Steps */}
          <div className="flex flex-col gap-12">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">How Innovix Works</h2>
              <p className="text-base text-slate-600">
                Go from a simple idea to a production-ready project blueprint in three simple steps.
              </p>
            </div>
            
            <div className="space-y-8 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-6 top-8 bottom-8 w-px bg-slate-200"></div>
              
              {/* Step 1 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 z-10">1</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Ideation</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Input your rough concept. Innovix understands your goals and target audience instantly.
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-lg shadow-sm shrink-0 z-10">2</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">AI Analysis</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Our AI researches the market, selects the optimal tech stack, and structures the architecture.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-lg shadow-sm shrink-0 z-10">3</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Blueprint Generation</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Export a complete, build-ready architecture with dependencies, timelines, and logic maps.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Mock Terminal */}
          <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="ml-4 flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Terminal className="w-3 h-3" /> innovix-agent.exe
              </div>
            </div>
            {/* Terminal Body */}
            <div className="p-6 font-mono text-sm space-y-4">
              <div className="flex gap-3 text-slate-300">
                <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>Analyzing idea: "AI Project Management Tool"</p>
              </div>
              <div className="flex gap-3 text-slate-500">
                <div className="w-4 h-4 shrink-0 mt-0.5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin"></div>
                <p>Generating optimal tech stack...</p>
              </div>
              <div className="pl-7 text-emerald-400">
                <p>✓ Frontend: React + Vite + Tailwind</p>
                <p>✓ Backend: FastAPI + PostgreSQL</p>
                <p>✓ Deployment: Vercel + Render</p>
              </div>
              <div className="flex gap-3 text-slate-300">
                <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>Scaffolding project architecture...</p>
              </div>
              <div className="pl-7 text-slate-400">
                <p className="text-blue-300">src/</p>
                <p>├── <span className="text-indigo-300">components/</span></p>
                <p>├── <span className="text-indigo-300">features/</span></p>
                <p>├── <span className="text-indigo-300">hooks/</span></p>
                <p>└── <span className="text-emerald-300">main.tsx</span></p>
              </div>
              <div className="flex gap-3 text-emerald-400 font-bold mt-6">
                <p>► Blueprint successfully generated in 2.4s.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 z-0"></div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 text-center flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to build your next breakthrough?
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl">
            Join thousands of creators using Innovix to turn abstract ideas into production-ready architectures instantly.
          </p>
          <button onClick={() => navigate('/login')} className="bg-white text-blue-900 font-bold text-base px-8 py-4 rounded-xl flex items-center justify-center gap-4 hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-xl">
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-sm font-bold text-slate-900">Innovix</span>
          </div>
          <p className="text-sm text-slate-600">© 2026 Innovix Inc. All rights reserved.</p>
        </div>
      </footer>

      {/* Feature Docs Modal */}
      <AnimatePresence>
        {selectedFeature && FEATURE_DOCS[selectedFeature] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFeature(null)}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-2xl border border-slate-200 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setSelectedFeature(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{FEATURE_DOCS[selectedFeature].title}</h2>
                <p className="text-blue-600 font-medium">{FEATURE_DOCS[selectedFeature].subtitle}</p>
              </div>
              
              <div className="prose prose-slate max-w-none">
                {FEATURE_DOCS[selectedFeature].content}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
