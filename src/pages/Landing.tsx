import React from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../lib/firebase';
import { Globe, ArrowRight, MessageSquare, Heart, Sparkles } from 'lucide-react';

export default function Landing() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl py-20 flex flex-col items-center text-center relative">
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="mb-8 px-6 py-2 glass rounded-full text-xs font-black uppercase tracking-[0.3em] text-neon-cyan shadow-[0_0_20px_rgba(0,242,255,0.1)]"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={14} className="animate-pulse" />
            <span>Advanced Conversational Engine 3.1</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-7xl md:text-9xl font-display font-bold leading-[0.9] mb-10 tracking-tighter"
        >
          Master any <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-purple italic">language.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-white/50 max-w-2xl mb-14 font-medium leading-relaxed"
        >
          LingoBuddy merges advanced neural synthesis with personalized linguistic coaching. 
          Step into an immersive simulation designed for rapid fluency.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 242, 255, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="px-10 py-5 bg-white text-black rounded-2xl font-black flex items-center gap-4 text-xl transition-all relative overflow-hidden group shadow-2xl shadow-blue-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-purple opacity-0 group-hover:opacity-10 transition-opacity" />
          <Globe size={24} className="group-hover:rotate-12 transition-transform" />
          Initialize Protocol
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8 w-full max-w-6xl mt-24">
        <FeatureCard
          icon={<MessageSquare size={28} className="text-neon-cyan" />}
          title="Neural Chat"
          description="Context-aware conversations that adapt to your progress and cultural nuances."
        />
        <FeatureCard
          icon={<Sparkles size={28} className="text-neon-purple" />}
          title="Instant Synthesis"
          description="Real-time phonetics analysis and grammatical alignment for pixel-perfect fluency."
        />
        <FeatureCard
          icon={<Heart size={28} className="text-red-500" />}
          title="Adaptive Mesh"
          description="Zero-judgment environment that builds confidence through iterative simulation."
        />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -10, borderColor: 'rgba(255,255,255,0.2)' }}
      className="p-10 glass-dark rounded-[2.5rem] flex flex-col items-start text-left group transition-all"
    >
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-all shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold mb-4 tracking-tight">{title}</h3>
      <p className="text-white/40 leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}
