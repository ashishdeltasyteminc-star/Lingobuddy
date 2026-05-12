import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Globe } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-transform group-hover:scale-110">
            <span className="text-black font-bold text-xl">L</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-semibold tracking-tight text-white">LINGOBUDDY</h1>
            <p className="text-[10px] text-neon-cyan uppercase tracking-[0.2em] font-medium leading-none">AI Conversational Partner</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">Engine Online</span>
        </div>
        <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
        <button
          onClick={handleSignOut}
          className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white border border-transparent hover:border-white/10"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
