/**
 * Innovix — i18n Configuration
 *
 * Multi-language support with react-i18next.
 * Backed by Sarvam AI — supports Indian languages + English.
 * Auto-detects browser language.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.deepsearch': 'DeepSearch',
      'nav.projects': 'My Projects',
      'nav.clusters': 'Knowledge Clusters',
      'nav.workspaces': 'Workspaces',
      'nav.intelligence': 'Web Intelligence',
      'nav.agents': 'AI Agents',
      'nav.signout': 'Sign Out',

      // Landing
      'landing.badge': 'Powered by iNSIGHTS Layer 2',
      'landing.headline1': 'Search Less.',
      'landing.headline2': 'Solve More.',
      'landing.subtext': 'Your AI-powered research copilot that transforms raw ideas into implementation-ready projects — with deep research, gap analysis, and intelligent project planning.',
      'landing.cta': 'Start Building',
      'landing.explore': 'Explore Features',
      'landing.signin': 'Sign In',
      'landing.getstarted': 'Get Started',
      'landing.features_title': 'All 7 iNSIGHTS Layer 2 Capabilities',
      'landing.features_sub': 'From problem discovery to project execution — everything you need in one platform.',
      'landing.cta_title': 'Ready to innovate?',
      'landing.cta_sub': 'Transform your next idea into a fully-planned, research-backed project in minutes.',
      'landing.cta_btn': 'Get Started Free',

      // Login
      'login.welcome': 'Welcome back',
      'login.subtitle': 'Sign in to continue your research journey',
      'login.google': 'Continue with Google',
      'login.github': 'Continue with GitHub',
      'login.or': 'or',
      'login.back': '← Back to home',

      // Dashboard
      'dashboard.welcome': 'Welcome back,',
      'dashboard.whatnext': 'What would you like to research today?',
      'dashboard.search_placeholder': 'Enter an idea like',
      'dashboard.search_example': '"Build an AI solution to reduce food waste in college hostels"',
      'dashboard.projects': 'Projects',
      'dashboard.searches': 'Searches',
      'dashboard.papers': 'Papers Found',
      'dashboard.repos': 'Repos Found',
      'dashboard.quick_actions': 'Quick Actions',
      'dashboard.suggestions': 'AI Suggestions',

      // DeepSearch
      'search.title': 'DeepSearch',
      'search.placeholder': 'Describe your idea or research question...',
      'search.button': 'Search',
      'search.sources': 'Sources',
      'search.results': 'Results',
      'search.gap_analysis': 'Gap Analysis',
      'search.citations': 'Citations',

      // Projects
      'projects.title': 'Project HUB',
      'projects.new': 'New Project',
      'projects.generate': 'Generate Plan',
      'projects.export': 'Export',
      'projects.architecture': 'Architecture',
      'projects.timeline': 'Timeline',
      'projects.techstack': 'Tech Stack',

      // Workspaces
      'workspace.title': 'Research Workspace',
      'workspace.notes': 'Notes',
      'workspace.saved': 'Saved Results',
      'workspace.annotations': 'Annotations',

      // Common
      'common.loading': 'Loading...',
      'common.error': 'Something went wrong',
      'common.retry': 'Retry',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.close': 'Close',
      'common.language': 'Language',
    },
  },
  hi: {
    translation: {
      'nav.dashboard': 'डैशबोर्ड',
      'nav.deepsearch': 'डीपसर्च',
      'nav.projects': 'प्रोजेक्ट हब',
      'nav.clusters': 'ज्ञान क्लस्टर',
      'nav.workspaces': 'कार्यक्षेत्र',
      'nav.intelligence': 'वेब इंटेलिजेंस',
      'nav.agents': 'AI एजेंट',
      'nav.signout': 'लॉग आउट',
      'landing.badge': 'iNSIGHTS Layer 2 द्वारा संचालित',
      'landing.headline1': 'कम खोजो।',
      'landing.headline2': 'ज्यादा हल करो।',
      'landing.subtext': 'आपका AI-संचालित रिसर्च कोपायलट जो कच्चे विचारों को कार्यान्वयन-तैयार प्रोजेक्ट में बदलता है।',
      'landing.cta': 'शुरू करें',
      'landing.explore': 'सुविधाएं देखें',
      'landing.signin': 'साइन इन',
      'landing.getstarted': 'शुरू करें',
      'login.welcome': 'वापसी पर स्वागत है',
      'login.subtitle': 'अपनी रिसर्च यात्रा जारी रखने के लिए साइन इन करें',
      'login.google': 'Google से जारी रखें',
      'login.github': 'GitHub से जारी रखें',
      'dashboard.welcome': 'वापसी पर स्वागत,',
      'dashboard.whatnext': 'आज आप क्या रिसर्च करना चाहेंगे?',
      'dashboard.projects': 'प्रोजेक्ट',
      'dashboard.searches': 'खोजें',
      'dashboard.papers': 'पेपर मिले',
      'dashboard.repos': 'रेपो मिले',
      'dashboard.quick_actions': 'त्वरित कार्य',
      'dashboard.suggestions': 'AI सुझाव',
      'search.title': 'डीपसर्च',
      'search.placeholder': 'अपना विचार या शोध प्रश्न लिखें...',
      'search.button': 'खोजें',
      'projects.title': 'प्रोजेक्ट हब',
      'projects.new': 'नया प्रोजेक्ट',
      'workspace.title': 'शोध कार्यक्षेत्र',
      'common.loading': 'लोड हो रहा है...',
      'common.error': 'कुछ गलत हो गया',
      'common.save': 'सहेजें',
      'common.cancel': 'रद्द करें',
      'common.language': 'भाषा',
    },
  },
  ta: {
    translation: {
      'nav.dashboard': 'டாஷ்போர்டு',
      'nav.deepsearch': 'ஆழமான தேடல்',
      'nav.projects': 'திட்ட மையம்',
      'nav.signout': 'வெளியேறு',
      'landing.headline1': 'குறைவாக தேடு.',
      'landing.headline2': 'அதிகமாக தீர்.',
      'landing.cta': 'தொடங்கு',
      'login.welcome': 'மீண்டும் வரவேற்கிறோம்',
      'login.google': 'Google உடன் தொடரவும்',
      'dashboard.welcome': 'மீண்டும் வரவேற்கிறோம்,',
      'search.title': 'ஆழமான தேடல்',
      'search.button': 'தேடு',
      'common.loading': 'ஏற்றுகிறது...',
      'common.save': 'சேமி',
      'common.language': 'மொழி',
    },
  },
  te: {
    translation: {
      'nav.dashboard': 'డాష్‌బోర్డ్',
      'nav.deepsearch': 'డీప్ సెర్చ్',
      'nav.projects': 'ప్రాజెక్ట్ హబ్',
      'nav.signout': 'లాగ్ అవుట్',
      'landing.headline1': 'తక్కువ వెతకండి.',
      'landing.headline2': 'ఎక్కువ పరిష్కరించండి.',
      'landing.cta': 'ప్రారంభించు',
      'login.welcome': 'తిరిగి స్వాగతం',
      'search.title': 'డీప్ సెర్చ్',
      'search.button': 'వెతుకు',
      'common.loading': 'లోడ్ అవుతోంది...',
      'common.save': 'సేవ్',
      'common.language': 'భాష',
    },
  },
  bn: {
    translation: {
      'nav.dashboard': 'ড্যাশবোর্ড',
      'nav.deepsearch': 'ডিপসার্চ',
      'nav.projects': 'প্রোজেক্ট হাব',
      'nav.signout': 'লগ আউট',
      'landing.headline1': 'কম খোঁজো।',
      'landing.headline2': 'বেশি সমাধান করো।',
      'landing.cta': 'শুরু করুন',
      'login.welcome': 'ফিরে আসার জন্য স্বাগতম',
      'search.title': 'ডিপসার্চ',
      'search.button': 'খুঁজুন',
      'common.loading': 'লোড হচ্ছে...',
      'common.save': 'সংরক্ষণ',
      'common.language': 'ভাষা',
    },
  },
  mr: {
    translation: {
      'nav.dashboard': 'डॅशबोर्ड',
      'nav.deepsearch': 'डीपसर्च',
      'nav.projects': 'प्रोजेक्ट हब',
      'nav.signout': 'लॉग आउट',
      'landing.headline1': 'कमी शोधा.',
      'landing.headline2': 'जास्त सोडवा.',
      'landing.cta': 'सुरू करा',
      'login.welcome': 'पुन्हा स्वागत आहे',
      'search.title': 'डीपसर्च',
      'search.button': 'शोधा',
      'common.loading': 'लोड होत आहे...',
      'common.save': 'जतन करा',
      'common.language': 'भाषा',
    },
  },
  kn: {
    translation: {
      'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'nav.deepsearch': 'ಡೀಪ್ ಸರ್ಚ್',
      'nav.projects': 'ಪ್ರಾಜೆಕ್ಟ್ ಹಬ್',
      'nav.signout': 'ಲಾಗ್ ಔಟ್',
      'landing.headline1': 'ಕಡಿಮೆ ಹುಡುಕಿ.',
      'landing.headline2': 'ಹೆಚ್ಚು ಪರಿಹರಿಸಿ.',
      'landing.cta': 'ಪ್ರಾರಂಭಿಸಿ',
      'login.welcome': 'ಮರಳಿ ಸ್ವಾಗತ',
      'search.title': 'ಡೀಪ್ ಸರ್ಚ್',
      'search.button': 'ಹುಡುಕಿ',
      'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
      'common.save': 'ಉಳಿಸಿ',
      'common.language': 'ಭಾಷೆ',
    },
  },
  gu: {
    translation: {
      'nav.dashboard': 'ડેશબોર્ડ',
      'nav.deepsearch': 'ડીપસર્ચ',
      'nav.projects': 'પ્રોજેક્ટ હબ',
      'nav.signout': 'લૉગ આઉટ',
      'landing.headline1': 'ઓછું શોધો.',
      'landing.headline2': 'વધુ ઉકેલો.',
      'landing.cta': 'શરૂ કરો',
      'login.welcome': 'ફરીથી સ્વાગત છે',
      'search.title': 'ડીપસર્ચ',
      'search.button': 'શોધો',
      'common.loading': 'લોડ થઈ રહ્યું છે...',
      'common.save': 'સાચવો',
      'common.language': 'ભાષા',
    },
  },
  ml: {
    translation: {
      'nav.dashboard': 'ഡാഷ്ബോർഡ്',
      'nav.deepsearch': 'ഡീപ്സെർച്ച്',
      'nav.projects': 'പ്രോജക്ട് ഹബ്',
      'nav.signout': 'ലോഗ് ഔട്ട്',
      'landing.headline1': 'കുറവ് തിരയൂ.',
      'landing.headline2': 'കൂടുതൽ പരിഹരിക്കൂ.',
      'landing.cta': 'ആരംഭിക്കുക',
      'login.welcome': 'തിരികെ സ്വാഗതം',
      'search.title': 'ഡീപ്സെർച്ച്',
      'search.button': 'തിരയുക',
      'common.loading': 'ലോഡ് ചെയ്യുന്നു...',
      'common.save': 'സേവ് ചെയ്യുക',
      'common.language': 'ഭാഷ',
    },
  },
  pa: {
    translation: {
      'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
      'nav.deepsearch': 'ਡੀਪਸਰਚ',
      'nav.projects': 'ਪ੍ਰੋਜੈਕਟ ਹੱਬ',
      'nav.signout': 'ਲੌਗ ਆਉਟ',
      'landing.headline1': 'ਘੱਟ ਖੋਜੋ।',
      'landing.headline2': 'ਵੱਧ ਹੱਲ ਕਰੋ।',
      'landing.cta': 'ਸ਼ੁਰੂ ਕਰੋ',
      'login.welcome': 'ਵਾਪਸੀ ਤੇ ਸਵਾਗਤ ਹੈ',
      'search.title': 'ਡੀਪਸਰਚ',
      'search.button': 'ਖੋਜੋ',
      'common.loading': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
      'common.save': 'ਸੰਭਾਲੋ',
      'common.language': 'ਭਾਸ਼ਾ',
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
]
