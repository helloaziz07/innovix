import { Box, Menu, ArrowRight, PlayCircle, BarChart3, TrendingUp, Layers, Workflow, FileSearch, PencilRuler, Network, Brain, Sparkles, Search, Rocket, Bot, Globe, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();

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
          <div className="flex items-center gap-2">
            <Box className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold tracking-tight text-blue-600">Innovix</span>
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
            <div className="micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-purple-300 transition-colors">
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
            <div className="micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-blue-300 transition-colors">
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
            <div className="micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-teal-300 transition-colors">
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
            <div className="micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-orange-300 transition-colors">
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
            <div className="micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-pink-300 transition-colors">
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
            <div className="micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-purple-300 transition-colors">
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
            <div className="micro-gradient rounded-xl border border-slate-200 p-8 ambient-shadow flex flex-col gap-6 group hover:border-emerald-300 transition-colors">
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
    </div>
  );
}
