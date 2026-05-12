import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData, useCollection } from 'react-firebase-hooks/firestore';
import { doc, collection, query, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { chatWithAI, generateSpeech } from '../lib/gemini';
import { Send, Mic, MicOff, Volume2, Globe, ChevronLeft, Sparkles, MessageCircle } from 'lucide-react';
import { Conversation, Message } from '../types';

export default function Chat() {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [conversation] = useDocumentData(doc(db, 'conversations', id as string));
  const messagesQuery = query(
    collection(db, 'conversations', id as string, 'messages'),
    orderBy('timestamp', 'asc')
  );
  const [messagesSnapshot] = useCollection(messagesQuery);
  const messages = messagesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (conversation) {
        // Try to guess language code
        const langCode = getLangCode(conversation.language);
        recognitionRef.current.lang = langCode;
      }
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const getLangCode = (name: string) => {
    const codes: Record<string, string> = { 'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE', 'Italian': 'it-IT', 'Japanese': 'ja-JP', 'Chinese': 'zh-CN' };
    return codes[name] || 'en-US';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !user || !conversation || isTyping) return;

    const text = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      // 1. Save User Message
      await addDoc(collection(db, 'conversations', id as string, 'messages'), {
        sender: 'user',
        text,
        timestamp: serverTimestamp()
      });

      // 2. Prepare History
      const history = (messages || []).map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }]
      }));

      // 3. Call Gemini
      const response = await chatWithAI(conversation.language, conversation.level, history, text);
      const aiText = response.text || "I'm sorry, I couldn't generate a response. Please try again.";

      // 4. Save AI Message
      await addDoc(collection(db, 'conversations', id as string, 'messages'), {
        sender: 'ai',
        text: aiText,
        timestamp: serverTimestamp()
      });

      // 5. Update Conversation Metadata
      await updateDoc(doc(db, 'conversations', id as string), {
        lastMessage: aiText.substring(0, 50) + (aiText.length > 50 ? '...' : '')
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conversations/${id}/messages`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const audioUrl = await generateSpeech(text);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.play();
      } else {
        setIsPlaying(false);
      }
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 top-20 flex flex-col z-10 overflow-hidden">
      <main className="flex-1 grid grid-cols-12 gap-6 p-8 overflow-hidden">
        
        {/* Left Sidebar: Session Insights */}
        <aside className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark rounded-3xl p-6 flex flex-col gap-6"
          >
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Active Simulation</h3>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-sm font-bold text-white">Advanced {conversation?.language}</p>
                <p className="text-[10px] text-neon-cyan uppercase tracking-widest mt-1">Level {conversation?.level}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Learning Objectives</h3>
              <ul className="space-y-3">
                <ObjectiveItem text="Master local idioms" active />
                <ObjectiveItem text="Improve tone modulation" />
                <ObjectiveItem text="Reduce verbal fillers" />
              </ul>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-3xl p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-neon-cyan" />
              <h3 className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.2em]">Real-time Insight</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-medium">
              {isTyping ? "Analyzing input for patterns..." : "Your last response showed great structural improvement."}
            </p>
          </motion.div>
        </aside>

        {/* Center: AI Partner Visualizer */}
        <section className="col-span-6 flex flex-col items-center justify-center relative">
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Decorative Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-[450px] h-[450px] border border-white/5 rounded-full" 
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-[380px] h-[380px] border border-white/10 rounded-full border-dashed" 
            />
            
            {/* Core AI Orb */}
            <motion.div 
              animate={{ 
                boxShadow: isTyping || isRecording 
                  ? [
                      '0 0 40px rgba(0, 242, 255, 0.2)',
                      '0 0 80px rgba(112, 0, 255, 0.3)',
                      '0 0 40px rgba(0, 242, 255, 0.2)'
                    ]
                  : '0 0 20px rgba(255, 255, 255, 0.05)'
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-64 h-64 rounded-full bg-black/80 backdrop-blur-3xl relative flex items-center justify-center border border-white/10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-neon-purple/20 to-neon-cyan/20 animate-pulse" />
              
              {/* Audio Waveforms */}
              <div className="flex items-center gap-1.5 h-20 relative z-10 px-4">
                {[...Array(8)].map((_, i) => (
                  <WaveformBar key={i} active={isTyping || isRecording || isPlaying} delay={i * 0.1} />
                ))}
              </div>

              <div className="absolute bottom-10 flex flex-col items-center">
                <span className="text-lg font-light tracking-[0.4em] uppercase text-white/80">LingoBuddy</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 transition-colors ${
                  isRecording ? 'text-red-500' : isTyping ? 'text-neon-cyan' : 'text-white/20'
                }`}>
                  {isRecording ? 'Listening...' : isTyping ? 'Synthesizing...' : 'Standing By'}
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Right Sidebar: Live Transcription */}
        <aside className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="glass-dark rounded-3xl flex-1 flex flex-col overflow-hidden relative border-white/10 shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.22em]">Session Transcript</h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                <span className="text-[9px] text-green-400 font-black uppercase tracking-tighter">Live</span>
              </div>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto scroll-smooth"
            >
              {messages?.map((msg, i) => (
                <div key={msg.id || i} className={`flex flex-col gap-1.5 ${msg.sender === 'ai' ? 'items-start' : 'items-end'}`}>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${
                    msg.sender === 'ai' ? 'text-neon-purple' : 'text-neon-cyan'
                  }`}>
                    {msg.sender === 'ai' ? 'LingoBuddy' : 'Operator'}
                  </span>
                  <p className={`text-sm leading-relaxed ${
                    msg.sender === 'ai' ? 'text-white font-medium italic' : 'text-white/60'
                  }`}>
                    {msg.text}
                  </p>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col gap-1.5 items-start">
                  <span className="text-[8px] font-black uppercase tracking-widest text-neon-purple animate-pulse">LingoBuddy</span>
                  <div className="flex gap-1 h-4 items-center">
                    <div className="w-1 h-1 bg-neon-purple rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-1 bg-neon-purple rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-1 bg-neon-purple rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white/5 border-t border-white/5">
              <button 
                onClick={() => setInputText('')} 
                className="w-full py-3 bg-white/5 rounded-xl text-[10px] uppercase font-black tracking-[0.2em] hover:bg-white/10 transition-all text-white/40 hover:text-white"
              >
                Clear Buffer
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Controls Overlay */}
      <footer className="h-32 px-8 pb-8 flex items-center justify-center pointer-events-none">
        <div className="max-w-2xl w-full flex items-center justify-between glass rounded-[2.5rem] p-3 px-8 shadow-2xl relative pointer-events-auto group hover:border-white/20 transition-all">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <ChevronLeft size={20} className="text-white/40" />
          </button>
          
          <div className="flex items-center gap-8">
            <button 
              onClick={toggleRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-110' 
                  : 'bg-white/10 hover:bg-white/20 border border-white/20 shadow-xl'
              }`}
            >
              {isRecording ? <div className="w-6 h-6 bg-white rounded-md" /> : <Mic size={28} className="text-white" />}
            </button>

            <div className="h-10 w-[1px] bg-white/10"></div>
            
            <form onSubmit={handleSendMessage} className="flex-1 min-w-[300px] relative">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Synchronize command..."
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-neon-cyan focus:border-neon-cyan/50 font-medium tracking-wide transition-all"
              />
              <button 
                disabled={!inputText.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-cyan hover:scale-110 disabled:opacity-20 transition-all"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

          <button 
             onClick={() => messages?.[messages.length-1] && handleSpeak(messages[messages.length-1].text)}
             disabled={isPlaying}
             className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors border border-white/5 ${isPlaying ? 'animate-pulse' : ''}`}
          >
            <Volume2 size={20} className="text-white/40" />
          </button>
        </div>
      </footer>
    </div>
  );
}

function ObjectiveItem({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <li className="flex items-center gap-3 group">
      <div className={`w-1.5 h-1.5 rounded-full transition-all ${
        active ? 'bg-neon-cyan shadow-[0_0_8px_#00f2ff]' : 'bg-white/10'
      }`} />
      <span className={`text-xs font-medium transition-colors ${
        active ? 'text-white' : 'text-white/40 group-hover:text-white/60'
      }`}>
        {text}
      </span>
    </li>
  );
}

function WaveformBar({ active, delay }: { active: boolean; delay: number; key?: React.Key }) {
  return (
    <motion.div 
      animate={active ? { 
        height: [16, 48, 24, 60, 32],
        backgroundColor: ['#00f2ff', '#7000ff', '#00f2ff']
      } : { 
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.1)'
      }}
      transition={{ 
        duration: 0.8, 
        repeat: Infinity, 
        delay,
        ease: "easeInOut"
      }}
      className="w-1.5 rounded-full shadow-[0_0_10px_rgba(0,242,255,0.2)]"
    />
  );
}
