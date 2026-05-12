import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, MessageSquare, Clock, Globe, ArrowRight } from 'lucide-react';
import { Conversation } from '../types';

const LANGUAGES = [
  { name: 'Spanish', code: 'es', emoji: '🇪🇸' },
  { name: 'French', code: 'fr', emoji: '🇫🇷' },
  { name: 'German', code: 'de', emoji: '🇩🇪' },
  { name: 'Italian', code: 'it', emoji: '🇮🇹' },
  { name: 'Japanese', code: 'ja', emoji: '🇯🇵' },
  { name: 'Chinese', code: 'zh', emoji: '🇨🇳' },
];

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const conversationsQuery = user ? query(
    collection(db, 'conversations'),
    where('userId', '==', user.uid),
    orderBy('startedAt', 'desc')
  ) : null;

  const [conversationsSnapshot, loading] = useCollection(conversationsQuery);
  const conversations = conversationsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];

  const handleStartNew = async () => {
    if (!user) return;

    const newConv = {
      userId: user.uid,
      language: selectedLanguage.name,
      level,
      startedAt: serverTimestamp(),
      topic: 'General Conversation',
      lastMessage: ''
    };

    const docRef = await addDoc(collection(db, 'conversations'), newConv);
    navigate(`/chat/${docRef.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 tracking-tight">Deployment Hub</h1>
          <p className="text-white/40 font-medium tracking-wide">Initialize new linguistic simulations or resume active protocols.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0, 242, 255, 0.2)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreating(true)}
          className="bg-neon-cyan text-black px-8 py-4 rounded-2xl flex items-center gap-3 font-black shadow-lg shadow-neon-cyan/20 transition-all uppercase tracking-widest text-sm"
        >
          <Plus size={18} />
          New Simulation
        </motion.button>
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark p-10 rounded-[3rem] mb-16 border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[80px] rounded-full" />
          
          <h2 className="text-2xl font-display font-bold mb-10 tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 bg-neon-cyan rounded-full" />
            Simulation Parameters
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12 relative z-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Select Target Region</label>
              <div className="grid grid-cols-3 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                      selectedLanguage.code === lang.code
                        ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_20px_rgba(0,242,255,0.1)]'
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{lang.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/60">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Fluency Threshold</label>
              <div className="flex flex-col gap-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`p-5 rounded-2xl border-2 text-left capitalize font-bold transition-all relative flex items-center justify-between group ${
                      level === l
                        ? 'border-neon-purple bg-neon-purple/10 shadow-[0_0_20px_rgba(112,0,255,0.1)]'
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className={level === l ? 'text-white' : 'text-white/40'}>{l}</span>
                    <div className={`w-2 h-2 rounded-full ${level === l ? 'bg-neon-purple shadow-[0_0_10px_#7000ff]' : 'bg-white/10'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 relative z-10">
            <button
               onClick={handleStartNew}
               className="flex-1 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neon-cyan hover:shadow-[0_0_40px_rgba(0,242,255,0.3)] transition-all"
            >
              Initiate Simulation
            </button>
            <button
               onClick={() => setIsCreating(false)}
               className="flex-1 bg-white/5 text-white/40 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
              Abort Protocol
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6">
        {loading ? (
          <div className="py-20 text-center text-white/20 uppercase tracking-[0.3em] font-black text-xs animate-pulse">Scanning Databases...</div>
        ) : conversations?.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white/10">
              <MessageSquare size={40} />
            </div>
            <p className="text-2xl font-display font-medium text-white/20">No active simulations detected.</p>
          </div>
        ) : (
          conversations?.map((conv) => (
            <ConversationCard key={conv.id} conversation={conv as Conversation} />
          ))
        )}
      </div>
    </div>
  );
}

interface ConversationCardProps {
  key?: React.Key;
  conversation: Conversation;
}

function ConversationCard({ conversation }: ConversationCardProps) {
  const date = conversation.startedAt?.toDate();

  return (
    <Link to={`/chat/${conversation.id}`} className="block group">
      <motion.div
        whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.04)' }}
        className="glass-dark p-8 rounded-[2.5rem] border-white/5 group-hover:border-white/20 transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl flex items-center justify-center text-white/40 group-hover:text-neon-cyan transition-colors border border-white/5 group-hover:border-neon-cyan/30 shadow-inner">
            <Globe size={32} />
          </div>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h3 className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-neon-cyan transition-colors">{conversation.language}</h3>
              <span className="px-3 py-1 bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
                {conversation.level}
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/30 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-white/10" />
                {date?.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2 truncate max-w-[300px]">
                <MessageSquare size={14} className="text-white/10" />
                {conversation.lastMessage || 'Protocol awaiting initialization...'}
              </span>
            </div>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white/10 group-hover:text-neon-cyan group-hover:bg-neon-cyan/10 transition-all border border-transparent group-hover:border-neon-cyan/20">
          <ArrowRight size={24} />
        </div>
      </motion.div>
    </Link>
  );
}
