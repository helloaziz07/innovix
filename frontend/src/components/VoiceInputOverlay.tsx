import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface VoiceInputOverlayProps {
  isOpen: boolean;
  onAccept: (text: string) => void;
  onCancel: () => void;
}

export default function VoiceInputOverlay({ isOpen, onAccept, onCancel }: VoiceInputOverlayProps) {
  const { user } = useAuthStore()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Jay'

  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  
  useEffect(() => {
    if (!isOpen) return;

    setFinalTranscript('')
    setInterimTranscript('')
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      onCancel();
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    const currentLang = localStorage.getItem('i18nextLng') || 'en';
    const baseLang = currentLang.split('-')[0] || 'en';
    const langMap: Record<string, string> = {
      'hi': 'hi-IN', 'ta': 'ta-IN', 'te': 'te-IN', 'bn': 'bn-IN', 
      'mr': 'mr-IN', 'kn': 'kn-IN', 'gu': 'gu-IN', 'ml': 'ml-IN', 'pa': 'pa-IN', 'en': 'en-US'
    };
    recognition.lang = langMap[baseLang] || 'en-US';

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      if (final) setFinalTranscript(prev => prev + final)
      setInterimTranscript(interim)
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
    };

    // If it ends unexpectedly, restart it if we're still open
    // This allows natural pauses without losing the session
    let manualStop = false;
    recognition.onend = () => {
      if (!manualStop && isOpen && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
           // ignore
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      if (recognitionRef.current) {
        manualStop = true;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isOpen]);

  const handleAccept = () => {
    const completeText = (finalTranscript + ' ' + interimTranscript).trim()
    onAccept(completeText)
  }

  // Prevent closing when clicking inside the modal
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            onClick={handleContentClick}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-[#1a1a1a] border border-[#333] shadow-2xl rounded-[2rem] overflow-hidden p-8 flex flex-col items-center justify-center min-h-[300px] text-white"
          >
            <h2 className="text-2xl font-light mb-8 text-center text-slate-200">
              Good to see you, {firstName}.
            </h2>
            
            <div className="flex-1 w-full max-h-[150px] overflow-y-auto mb-8 text-center custom-scrollbar">
              <p className="text-lg text-slate-300 font-medium">
                {finalTranscript}
                <span className="text-slate-500 opacity-70 ml-1">{interimTranscript}</span>
                {(!finalTranscript && !interimTranscript) && (
                  <span className="text-slate-500 opacity-50 italic">Listening...</span>
                )}
              </p>
            </div>

            {/* Soundwave animation + controls */}
            <div className="flex items-center justify-between w-full max-w-lg bg-[#2a2a2a] rounded-full p-2 border border-[#444]">
              <button 
                onClick={onCancel}
                title="Cancel Voice Input"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Fake soundwave bars */}
              <div className="flex items-center justify-center gap-1.5 flex-1 h-8 px-4 overflow-hidden">
                {[...Array(25)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: ["15%", "90%", "30%", "100%", "20%", "15%"]
                    }}
                    transition={{
                      duration: 1 + Math.random(), // random durations so they don't look perfectly synced
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut"
                    }}
                    className="w-[3px] bg-white/60 rounded-full"
                  />
                ))}
              </div>

              <button 
                onClick={handleAccept}
                title="Accept Voice Input"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
