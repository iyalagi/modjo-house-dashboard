import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Droplets, 
  Wind, 
  Zap, 
  Clock, 
  LogOut, 
  Calendar, 
  Activity, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle,
  Moon,
  Sun
} from 'lucide-react';
import HumidityChart from '../components/HumidityChart';
import StatusAlert from '../components/StatusAlert';
import PageLoader from '../components/PageLoader';
import SyncLoader from '../components/SyncLoader';

const checkOnlineStatus = (lastSeen) => {
  if (!lastSeen) return false;
  return (new Date() - new Date(lastSeen)) / 1000 < 600; 
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [timeframe, setTimeframe] = useState('30m'); 
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [userEmail, setUserEmail] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [localLow, setLocalLow] = useState(null);
  const [localHigh, setLocalHigh] = useState(null);
  const [localPressure, setLocalPressure] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // LOGIKA ADMIN: Lebih fleksibel (mengabaikan huruf besar/kecil dan domain)
  const isAdmin = userEmail && userEmail.toLowerCase().includes('modjoadmin');

  const [data, setData] = useState({
    humidity: 0,
    pump_status: 'OFF',
    pressure: 100,
    misting_schedule: '22:00',
    misting_morning: '06:00',
    humidity_low: 60,
    humidity_high: 80,
    last_seen: null,
    history: [],
    sensor_nodes: [0, 0, 0, 0] 
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const refreshData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // Ambil data user yang sedang login
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      const now = new Date();
      let timeFilter;
      let groupMinutes = 1;

      switch(timeframe) {
        case '30m': timeFilter = new Date(now - 30 * 60 * 1000); break;
        case '1h':  timeFilter = new Date(now - 60 * 60 * 1000); break;
        case '12h_week': timeFilter = new Date(now - 7 * 24 * 60 * 60 * 1000); groupMinutes = 720; break;
        case '24h_week': timeFilter = new Date(now - 7 * 24 * 60 * 60 * 1000); groupMinutes = 1440; break;
        default: timeFilter = new Date(now - 30 * 60 * 1000);
      }

      const { data: rows } = await supabase
        .from('sensor_data')
        .select('*')
        .gt('created_at', timeFilter.toISOString())
        .order('created_at', { ascending: true });

      const { data: ctrl } = await supabase.from('device_controls').select('*').eq('id', 1).single();

      if (ctrl) {
        let processedHistory = [];
        let lastNodes = [0, 0, 0, 0];
        
        if (rows && rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          if (lastRow && lastRow.sensor_nodes) {
            lastNodes = lastRow.sensor_nodes.slice(0, 4);
          }

          if (groupMinutes > 1) {
            const groups = {};
            rows.forEach(r => {
              const d = new Date(r.created_at);
              d.setMinutes(Math.floor(d.getMinutes() / groupMinutes) * groupMinutes);
              d.setSeconds(0);
              const k = d.toISOString();
              if (!groups[k]) groups[k] = { s: 0, c: 0 };
              groups[k].s += r.humidity; groups[k].c += 1;
            });
            processedHistory = Object.keys(groups).map(k => ({ timestamp: k, val: Math.round(groups[k].s / groups[k].c) }));
          } else {
            processedHistory = rows.map(r => ({ timestamp: r.created_at, val: r.humidity }));
          }
        }

        setData(prev => ({
          ...prev,
          last_seen: ctrl.last_seen,
          humidity_low: ctrl.humidity_low,
          humidity_high: ctrl.humidity_high,
          misting_schedule: ctrl.misting_schedule?.substring(0, 5) || '22:00',
          misting_morning: ctrl.misting_morning?.substring(0, 5) || '06:00',
          pressure: ctrl.pump_pressure || 100,
          history: processedHistory,
          raw_rows: rows,
          humidity: processedHistory.length > 0 ? processedHistory[processedHistory.length - 1].val : prev.humidity,
          pump_status: rows && rows.length > 0 ? rows[rows.length - 1].pump_status : prev.pump_status,
          sensor_nodes: lastNodes
        }));
        
        if (localLow === null) setLocalLow(ctrl.humidity_low);
        if (localHigh === null) setLocalHigh(ctrl.humidity_high);
        if (localPressure === null) setLocalPressure(ctrl.pump_pressure || 100);
        
        setIsOnline(checkOnlineStatus(ctrl.last_seen));
      }
    } catch (e) { console.error(e); }
    if (isManual) setTimeout(() => setRefreshing(false), 500);
  }, [timeframe, localLow, localHigh, localPressure]);

  useEffect(() => {
    refreshData().then(() => setLoading(false));
    const interval = setInterval(() => {
      setData(c => { setIsOnline(checkOnlineStatus(c.last_seen)); return c; });
    }, 5000);
    const channel = supabase.channel('sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sensor_data' }, () => refreshData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_controls' }, () => refreshData())
      .subscribe();
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [timeframe, refreshData]);

  const updatePump = async (s) => {
    if (!isAdmin) return; // Proteksi tambahan
    setIsUpdating(true);
    const { error } = await supabase.from('device_controls').update({ manual_pump_override: s === 'ON' }).eq('id', 1);
    if (!error) showToast(`Pompa Manual: ${s}`);
    else showToast("Gagal update pompa", "error");
    setIsUpdating(false);
  };

  const saveThresholds = async (low, high) => {
    if (!isAdmin) return; // Proteksi tambahan
    setIsUpdating(true);
    const { error } = await supabase.from('device_controls').update({ 
      humidity_low: parseInt(low), 
      humidity_high: parseInt(high) 
    }).eq('id', 1);
    if (error) showToast("Gagal sinkron target", "error");
    setIsUpdating(false);
  };
  
  const savePressure = async (val) => {
    if (!isAdmin) return; // Proteksi tambahan
    const p = val !== undefined ? val : localPressure;
    setIsUpdating(true);
    const { error } = await supabase.from('device_controls').update({ 
      pump_pressure: parseInt(p) 
    }).eq('id', 1);
    if (!error) {
      setLocalPressure(p);
      showToast("Intensitas diperbarui!");
    }
    setIsUpdating(false);
  };

  if (loading) return <PageLoader />;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-grid-pattern'} pb-12 font-sans selection:bg-primary-container`}>
      {/* Toast Notification - STRICTLY TOP CENTER */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] animate-bounce-in bg-white border-2 border-surface-outline min-w-[320px] justify-center text-gray-900">
          {toast.type === 'success' ? (
            <div className="bg-[#34a853]/20 p-1.5 rounded-full"><CheckCircle2 className="h-5 w-5 text-[#34a853]" /></div>
          ) : (
            <div className="bg-[#ea4335]/20 p-1.5 rounded-full"><AlertCircle className="h-5 w-5 text-[#ea4335]" /></div>
          )}
          <span className="font-black text-sm uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <header className={`transition-all duration-500 border-b sticky top-0 z-50 px-6 h-18 flex items-center justify-between shadow-xl ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-[#1a73e8] border-[#174ea6]'}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-2xl rotate-3 border border-white/40">
              <Droplets className="text-white h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white tracking-tighter leading-none">
                Modjo <span className={isDarkMode ? 'text-primary' : 'text-[#d2e3fc]'}>Smart</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-[#34a853] shadow-[0_0_8px_#34a853]' : 'bg-[#ea4335]'}`}></div>
                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* THEME TOGGLE */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl transition-all active:scale-95 border ${isDarkMode ? 'bg-primary/20 border-primary/40 text-yellow-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => refreshData(true)} disabled={refreshing} className="p-2.5 hover:bg-white/10 rounded-full transition-all text-white border border-white/10">
            <SyncLoader />
          </button>
          <button onClick={handleLogout} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-black text-xs transition-all shadow-lg active:scale-95 border ${isDarkMode ? 'bg-[#334155] border-[#475569] hover:bg-[#475569]' : 'bg-[#d93025] border-[#a50e0e] hover:bg-[#b21f16]'}`}>
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">KELUAR</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-dashboard-reveal">
        <StatusAlert humidity={data.humidity} dark={isDarkMode} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Kelembaban" value={`${data.humidity}%`} icon={<Wind className="text-primary h-6 w-6" />} color="primary" dark={isDarkMode} />
          <StatCard label="Pompa" value={data.pump_status} icon={<Zap className={`h-6 w-6 ${data.pump_status === 'ON' ? 'text-yellow-500 fill-yellow-500 animate-pulse' : 'text-gray-300'}`} />} active={data.pump_status === 'ON'} color="secondary" dark={isDarkMode} />
          <StatCard label="Intensitas" value={`${data.pressure}%`} icon={<Droplets className="text-cyan-500 h-6 w-6" />} color="primary" dark={isDarkMode} />
          <StatCard label="Jadwal" value={data.misting_schedule} icon={<Clock className="text-purple-500 h-6 w-6" />} color="primary" dark={isDarkMode} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Chart Section */}
            <div className={`transition-all duration-500 rounded-google shadow-sm border overflow-hidden ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-surface border-surface-outline'}`}>
              <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-[#334155]' : 'border-surface-variant'}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>Tren Real-time</h3>
                </div>
                <div className={`flex p-1 rounded-full border shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-white border-surface-outline'}`}>
                  {['30m', '1h', '12h_week', '24h_week'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setTimeframe(t)} 
                      className={`px-4 py-1.5 text-[10px] font-black rounded-full transition-all ${timeframe === t ? 'bg-[#1a73e8] text-white shadow-lg' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:bg-gray-100 hover:text-[#1a73e8]'}`}
                    >
                      {t.replace('_week', '').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 h-[400px]">
                <HumidityChart data={data.history} timeframe={timeframe} dark={isDarkMode} />
              </div>
            </div>

            {/* Distribution Grid */}
            <div className={`transition-all duration-500 p-8 rounded-google shadow-sm border ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-surface border-surface-outline'}`}>
              <h3 className="text-xs font-bold text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                <Droplets className="text-primary h-4 w-4" /> Distribusi 4 Sensor G0
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {data.sensor_nodes.map((val, i) => (
                  <div key={i} className={`flex flex-col items-center justify-center p-6 rounded-google border-2 transition-all ${val > 0 ? (isDarkMode ? 'bg-primary/10 border-primary/40' : 'bg-primary-container/30 border-primary-container') : (isDarkMode ? 'bg-[#0f172a] border-dashed border-gray-700 opacity-50' : 'bg-surface-variant border-dashed border-gray-300 opacity-50')}`}>
                    <span className={`text-[10px] font-black uppercase mb-2 ${isDarkMode ? 'text-primary' : 'text-primary/60'}`}>Sensor {i+1}</span>
                    <span className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-primary-onContainer'}`}>{val > 0 ? `${val}%` : '--'}</span>
                    <div className={`mt-3 w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white/50'}`}>
                      <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Control Panel - ONLY FOR ADMIN */}
            {isAdmin ? (
              <div className={`transition-all duration-500 p-8 rounded-google shadow-md border ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-surface border-primary/10'} ${!isOnline ? 'grayscale opacity-70 pointer-events-none' : ''}`}>
                <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Zap className="text-yellow-500 h-6 w-6" /> Kontrol Panel
                </h3>
                
                <div className="space-y-6">
                  {/* Manual Toggle */}
                  <div className={`p-6 rounded-google border flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-surface-variant border-surface-outline'}`}>
                    <div>
                      <p className={`font-black text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Mode Siram Manual</p>
                      <p className="text-[10px] font-bold text-[#1a73e8] uppercase mt-1 tracking-wider">Pengkondisian Aman</p>
                    </div>
                    <button 
                      onClick={() => updatePump(data.pump_status === 'ON' ? 'OFF' : 'ON')} 
                      className={`w-20 h-10 rounded-full transition-all relative flex items-center px-1 shadow-inner focus:outline-none focus:ring-4 focus:ring-[#1a73e8]/30 ${data.pump_status === 'ON' ? 'bg-[#1a73e8]' : 'bg-gray-400'}`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-white shadow-md transition-all transform duration-300 ${data.pump_status === 'ON' ? 'translate-x-10' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  {/* PWM Slider */}
                  <div className={`p-5 rounded-google border ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-surface-variant border-surface-outline'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <p className={`font-black text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Intensitas Kabut</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${isDarkMode ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white text-primary border-primary-container'}`}>{localPressure}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={localPressure} 
                      onChange={(e) => setLocalPressure(e.target.value)}
                      onMouseUp={() => savePressure()}
                      onTouchEnd={() => savePressure()}
                      className="w-full h-3 bg-gray-300 rounded-full appearance-none cursor-pointer border border-surface-outline accent-primary" 
                    />
                  </div>

                  {/* Threshold Controls */}
                  <div className={`p-5 rounded-google border ${isDarkMode ? 'bg-[#0f172a] border-primary/40' : 'bg-primary-container/30 border-primary-container'}`}>
                    <p className={`font-black text-sm mb-5 text-center uppercase tracking-widest ${isDarkMode ? 'text-primary' : 'text-gray-900'}`}>Target Kelembaban</p>
                    <div className="flex items-center justify-between gap-4">
                      <ThresholdControl 
                        label="MIN" 
                        value={localLow} 
                        dark={isDarkMode}
                        onChange={(newVal) => {
                          setLocalLow(newVal);
                          saveThresholds(newVal, localHigh);
                        }} 
                        color="error" 
                      />
                      <div className={`h-8 w-0.5 rounded-full ${isDarkMode ? 'bg-primary/30' : 'bg-primary-container'}`}></div>
                      <ThresholdControl 
                        label="MAX" 
                        value={localHigh} 
                        dark={isDarkMode}
                        onChange={(newVal) => {
                          setLocalHigh(newVal);
                          saveThresholds(localLow, newVal);
                        }} 
                        color="secondary" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-8 rounded-google shadow-md border text-center animate-bounce-in transition-all duration-500 ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-secondary-container'}`}>
                <div className="bg-secondary-container/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-secondary h-8 w-8" />
                </div>
                <h3 className={`text-lg font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Akses Pemantau</h3>
                <p className={`text-xs leading-relaxed font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Selamat Datang! Anda masuk sebagai pemantau kelompok tani. Dashboard ini menampilkan kondisi tanaman G0 secara real-time.
                </p>
              </div>
            )}

            {/* Quick Status */}
            <div className={`p-6 rounded-google border border-dashed ${isDarkMode ? 'bg-secondary-container/5 border-secondary-container/30' : 'bg-secondary-container/20 border-secondary-container'}`}>
               <div className="flex items-center gap-3 mb-2">
                 <CheckCircle2 className="text-secondary h-5 w-5" />
                 <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-secondary' : 'text-secondary-onContainer'}`}>Optimal Range</p>
               </div>
               <p className={`text-[10px] leading-relaxed font-medium ${isDarkMode ? 'text-gray-400' : 'text-secondary-onContainer/70'}`}>
                 Trichoderma sp. tumbuh optimal pada kelembaban 60-80%. Pastikan target alat berada dalam rentang ini.
               </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon, active = false, color = 'primary', dark = false }) => (
  <div className={`p-6 rounded-google border transition-all duration-500 shadow-xl ${dark ? (active ? 'bg-[#1e293b] border-yellow-500 ring-yellow-500/20' : 'bg-[#1e293b] border-[#334155] ring-transparent') : (active ? 'bg-yellow-50/50 border-yellow-400 ring-yellow-400/20 shadow-yellow-100' : 'bg-surface border-surface-outline shadow-sm ring-transparent')}`}>
    <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${active ? 'bg-yellow-100/20' : (dark ? 'bg-[#0f172a]' : `bg-${color}-container/50`)}`}>{icon}</div>
    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{label}</p>
    <p className={`text-2xl font-black mt-1 ${active ? 'text-yellow-500' : (dark ? 'text-white' : 'text-gray-900')}`}>{value}</p>
  </div>
);

const ThresholdControl = ({ label, value, onChange, color, dark = false }) => (
  <div className="flex flex-col items-center gap-2">
    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-2">
      <button 
        onClick={() => {
          const next = Math.max(0, parseInt(value)-1);
          onChange(next);
        }} 
        className={`p-1.5 rounded-full border transition-all active:scale-90 ${dark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-surface-outline text-gray-600 hover:bg-gray-100'}`}
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className={`text-xl font-black w-10 text-center ${dark ? 'text-white' : 'text-black'}`}>{value}</span>
      <button 
        onClick={() => {
          const next = Math.min(100, parseInt(value)+1);
          onChange(next);
        }} 
        className={`p-1.5 rounded-full border transition-all active:scale-90 ${dark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-surface-outline text-gray-600 hover:bg-gray-100'}`}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  </div>
);

export default Dashboard;
