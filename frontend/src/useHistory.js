import { useState, useCallback } from 'react';

const KEY = 'music-map-history';
const MAX = 20;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState(load);

  const add = useCallback((entry) => {
    setHistory(prev => {
      const next = [{ id: Date.now(), createdAt: new Date().toISOString(), ...entry }, ...prev].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setHistory(prev => {
      const next = prev.filter(e => e.id !== id);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  return { history, add, remove, clear };
}
