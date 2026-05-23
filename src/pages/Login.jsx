import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, Leaf, ArrowRight, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useOtp, setUseOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let res;
    if (useOtp) {
      res = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
        }
      });
      if (!res.error) setOtpSent(true);
    } else {
      res = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    if (res.error) {
      setError(res.error.message);
    }
    setLoading(false);
  };

  if (otpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grid-pattern p-4 font-sans">
        <div className="max-w-md w-full bg-white p-10 rounded-google shadow-2xl border border-primary-container text-center animate-bounce-in">
          <div className="bg-secondary-container w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-secondary" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Cek Email Anda!</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Kami telah mengirimkan tautan login ke <span className="font-bold text-primary">{email}</span>. Silakan klik link tersebut untuk masuk ke dashboard.
          </p>
          <button 
            onClick={() => setOtpSent(false)} 
            className="text-primary font-black text-xs uppercase tracking-widest hover:underline"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-pattern p-4 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-google shadow-2xl border border-gray-100 animate-dashboard-reveal">
        <div className="text-center">
          <div className="inline-flex bg-[#1a73e8] p-5 rounded-3xl shadow-[0_10px_25px_rgba(26,115,232,0.4)] mb-6 animate-bounce-in">
            <Leaf className="text-white fill-white h-10 w-10 animate-pulse-soft" strokeWidth={1} />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
            Modjo <span className="text-[#1a73e8]">House</span>
          </h2>
        </div>
        
        <div className="flex bg-surface-variant p-1.5 rounded-full border border-surface-outline mt-10">
          <button 
            type="button"
            onClick={() => { setUseOtp(false); setError(null); }}
            className={`flex-1 py-3 text-xs font-black rounded-full transition-all ${!useOtp ? 'bg-white text-[#1a73e8] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            SANDI
          </button>
          <button 
            type="button"
            onClick={() => { setUseOtp(true); setError(null); }}
            className={`flex-1 py-3 text-xs font-black rounded-full transition-all ${useOtp ? 'bg-white text-[#1a73e8] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            OTP (EMAIL)
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-error-container text-error-onContainer p-4 rounded-2xl text-xs font-bold text-center border border-error/20">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1a73e8] transition-colors" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#1a73e8] focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none font-bold text-sm text-gray-900 placeholder:text-gray-400 caret-black"
                placeholder="Alamat Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!useOtp && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1a73e8] transition-colors" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#1a73e8] focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none font-bold text-sm text-gray-900 placeholder:text-gray-400 caret-black"
                  placeholder="Kata Sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 py-4 px-4 bg-[#1a73e8] text-white text-sm font-black uppercase tracking-[0.2em] rounded-full shadow-[0_8px_20px_rgba(26,115,232,0.3)] hover:bg-[#174ea6] active:scale-95 disabled:opacity-50 transition-all mt-8"
          >
            {loading ? 'Memproses...' : useOtp ? 'Kirim OTP' : 'Login'}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
