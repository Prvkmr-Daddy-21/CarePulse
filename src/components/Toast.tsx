import React, { useState, useEffect } from 'react';

export const toast = {
  success: (msg: string) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'success' }})),
  error: (msg: string) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'error' }})),
  info: (msg: string) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'info' }})),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, ...e.detail }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-sm font-bold flex items-center gap-2 transition-all transform origin-top right-0 ${
            t.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' : 
            t.type === 'error' ? 'bg-brand-red/10 border-brand-red/30 text-brand-red' : 
            'bg-brand-blue/10 border-brand-blue/30 text-brand-blue'
          }`}
        >
          {t.type === 'success' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          {t.type === 'error' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          {t.type === 'info' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          {t.message}
        </div>
      ))}
    </div>
  );
};
