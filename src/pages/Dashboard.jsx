import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  Droplets, Wind, Zap, Clock, Activity, Plus, Minus,
  CheckCircle2, AlertCircle, Settings, Wifi, RefreshCw, X
} from 'lucide-react';
import HumidityChart from '../components/HumidityChart';
import StatusAlert from '../components/StatusAlert';
import PageLoader from '../components/PageLoader';

const checkOnlineStatus = (lastSeen) => {
  if (!lastSeen) return false;
  return (new Date() - new Date(lastSeen)) / 1000 < 60;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [timeframe, setTimeframe] = useState('30m');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showWifiModal, setShowWifiModal] = useState(false);

  const [now, setNow] = useState(new Date());
  const [localLow, setLocalLow] = useState(null);
  const [localHigh, setLocalHigh] = useState(null);
  const [localPressure, setLocalPressure] = useState(null);
  const [isDraggingPressure, setIsDraggingPressure] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // UBAH INI: true = Panel Kontrol muncul (bisa atur alat). false = Murni monitoring (read-only).
  const isAdmin = true; 

  const [data, setData] = useState({
    humidity: 0,
    pump_status: 'OFF',
    manual_override: false,
    pressure: 100,
    misting_schedule: '22:00',
    misting_morning: '07:00',
    humidity_low: 60,
    humidity_high: 80,
    last_seen: null,
    history: [],
    sensor_nodes: [0, 0, 0, 0],
    wifi_rssi: -100
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const getNextSchedule = () => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const toMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const malamMin = toMinutes(data.misting_schedule);
    const pagiMin = toMinutes(data.misting_morning);
    const isPeriodeMalam = nowMinutes >= malamMin || nowMinutes < pagiMin;

    return isPeriodeMalam
      ? { label: 'Jadwal Pagi', value: data.misting_morning }
      : { label: 'Jadwal Malam', value: data.misting_schedule };
  };

  const getRemainingTime = (targetTimeStr) => {
    const [h, m] = targetTimeStr.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const diffMs = target - now;
    const diffMin = Math.floor(diffMs / 60000);
    const hh = Math.floor(diffMin / 60);
    const mm = diffMin % 60;

    if (hh > 0) return `${hh}j ${mm}m lagi`;
    return `${mm}m lagi`;
  };

  const refreshData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const nowDate = new Date();
      let timeFilter;
      let groupMinutes = 1;

      switch (timeframe) {
        case '30m': timeFilter = new Date(nowDate - 30 * 60 * 1000); break;
        case '1h': timeFilter = new Date(nowDate - 60 * 60 * 1000); break;
        case '12h_week': timeFilter = new Date(nowDate - 7 * 24 * 60 * 60 * 1000); groupMinutes = 720; break;
        case '24h_week': timeFilter = new Date(nowDate - 7 * 24 * 60 * 60 * 1000); groupMinutes = 1440; break;
        default: timeFilter = new Date(nowDate - 30 * 60 * 1000);
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
        let lastRssi = -100;

        if (rows && rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          if (lastRow && lastRow.sensor_nodes) lastNodes = lastRow.sensor_nodes.slice(0, 4);
          if (lastRow && lastRow.wifi_rssi) lastRssi = lastRow.wifi_rssi;

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

        const lastRow = rows && rows.length > 0 ? rows[rows.length - 1] : null;

        setData(prev => ({
          ...prev,
          last_seen: ctrl.last_seen,
          humidity_low: ctrl.humidity_low,
          humidity_high: ctrl.humidity_high,
          misting_schedule: ctrl.misting_schedule?.substring(0, 5) || '22:00',
          misting_morning: ctrl.misting_morning?.substring(0, 5) || '07:00',
          pressure: ctrl.pump_pressure ?? 100,
          history: processedHistory,
          raw_rows: rows,
          humidity: processedHistory.length > 0 ? processedHistory[processedHistory.length - 1].val : prev.humidity,
          pump_status: lastRow ? lastRow.pump_status : prev.pump_status,
          manual_override: ctrl.manual_pump_override ?? false,
          sensor_nodes: lastNodes,
          wifi_rssi: lastRssi
        }));

        if (localLow === null) setLocalLow(ctrl.humidity_low);
        if (localHigh === null) setLocalHigh(ctrl.humidity_high);
        if (!isDraggingPressure) setLocalPressure(ctrl.pump_pressure ?? 100);

        setIsOnline(checkOnlineStatus(ctrl.last_seen));
      }
    } catch (e) { 
      console.error("Error fetching data:", e); 
    }
    if (isManual) setTimeout(() => setRefreshing(false), 500);
  }, [timeframe, localLow, localHigh, isDraggingPressure]);

  useEffect(() => {
    refreshData().then(() => setLoading(false));
    const interval = setInterval(() => {
      setData(c => { setIsOnline(checkOnlineStatus(c.last_seen)); return c; });
      setNow(new Date());
    }, 5000);
    
    const channel = supabase.channel('sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sensor_data' }, () => refreshData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_controls' }, () => refreshData())
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval); 
    };
  }, [timeframe, refreshData]);

  const updatePump = async (s) => {
    const nextValue = s === 'ON';
    const previousValue = data.manual_override;
    setData(prev => ({ ...prev, manual_override: nextValue }));
    setIsUpdating(true);

    const { error } = await supabase.from('device_controls').update({ manual_pump_override: nextValue }).eq('id', 1);
    if (!error) {
      showToast(`Mode Manual: ${nextValue ? 'AKTIF' : 'NONAKTIF'}`);
    } else {
      setData(prev => ({ ...prev, manual_override: previousValue }));
      showToast("Gagal update mode manual", "error");
    }
    setIsUpdating(false);
  };

  const saveThresholds = async (low, high) => {
    setIsUpdating(true);
    const { error } = await supabase.from('device_controls').update({
      humidity_low: parseInt(low),
      humidity_high: parseInt(high)
    }).eq('id', 1);
    if (error) showToast("Gagal sinkron target", "error");
    setIsUpdating(false);
  };

  const savePressure = async (val) => {
    const p = val !== undefined ? val : localPressure;
    setIsUpdating(true);
    const { error } = await supabase.from('device_controls').update({ pump_pressure: parseInt(p) }).eq('id', 1);
    if (!error) {
      setLocalPressure(p);
      showToast("Tekanan diperbarui!");
    }
    setIsUpdating(false);
  };

  const downloadCSV = () => {
    if (!data.raw_rows || data.raw_rows.length === 0) {
      showToast("Tidak ada data untuk diunduh", "error");
      return;
    }
    const headers = ["ID", "Waktu", "Kelembaban (%)", "Status Pompa", "Tekanan (%)", "Sensor 1", "Sensor 2", "Sensor 3", "Sensor 4", "WiFi RSSI"];
    const csvRows = [
      headers.join(","),
      ...data.raw_rows.map(row => {
        let nodes = [0, 0, 0, 0];
        try {
          if (Array.isArray(row.sensor_nodes)) nodes = row.sensor_nodes;
          else if (typeof row.sensor_nodes === 'string') nodes = JSON.parse(row.sensor_nodes);
        } catch (e) { console.error("Error parsing sensor_nodes for CSV", e); }
        
        return [
          row.id, `"${new Date(row.created_at).toLocaleString()}"`, row.humidity, row.pump_status,
          row.pump_pressure || 0, nodes[0] || 0, nodes[1] || 0, nodes[2] || 0, nodes[3] || 0, row.wifi_rssi || -100
        ].join(",")
      })
    ].join("\n");

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
