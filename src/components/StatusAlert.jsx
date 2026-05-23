import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const StatusAlert = ({ humidity }) => {
  let status = {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="h-5 w-5" />,
    label: 'Kelembaban Stabil',
    desc: 'Kondisi media tanam optimal (60% - 80%).'
  };

  if (humidity < 60) {
    status = {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <AlertTriangle className="h-5 w-5" />,
      label: 'Mendekati Kering',
      desc: 'Kelembaban di bawah ambang batas optimal (< 60%).'
    };
  } else if (humidity > 80) {
    status = {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Info className="h-5 w-5" />,
      label: 'Kelembaban Tinggi',
      desc: 'Kondisi media sangat basah (> 80%).'
    };
  }

  return (
    <div className={`flex items-start p-4 rounded-lg border ${status.color} transition-all duration-500`}>
      <div className="flex-shrink-0">
        {status.icon}
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-bold">{status.label}</h3>
        <p className="mt-1 text-xs opacity-90">{status.desc}</p>
      </div>
    </div>
  );
};

export default StatusAlert;
