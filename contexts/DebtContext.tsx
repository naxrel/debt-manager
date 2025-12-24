import { Debt, debtsApi, DebtStatistics } from '@/api';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface DebtContextType {
  debts: Debt[];
  isLoading: boolean;
  error: string | null;
  refreshDebts: () => Promise<void>;
  addDebt: (debt: {
    type: 'hutang' | 'piutang';
    name: string;
    otherUserId?: string;
    amount: number;
    description: string;
    date: string;
    groupId?: string;
    status?: 'pending' | 'confirmed';
  }) => Promise<Debt | null>;
  updateDebt: (id: string, updates: Partial<Debt>) => Promise<Debt | null>;
  deleteDebt: (id: string) => Promise<boolean>;
  markAsPaid: (id: string) => Promise<Debt | null>;
  getStatistics: () => Promise<DebtStatistics | null>;
  getHutangList: () => Debt[];
  getPiutangList: () => Debt[];
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

export function DebtProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      refreshDebts();
    } else {
      setDebts([]);
      setIsLoading(false);
    }
  }, [user]);

  const refreshDebts = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const userDebts = await debtsApi.getAll();
      setDebts(userDebts);
    } catch (err: any) {
      console.error('Error loading debts:', err);
      setError(err.message || 'Failed to load debts');
    } finally {
      setIsLoading(false);
    }
  };

  const addDebt = async (debt: {
    type: 'hutang' | 'piutang';
    name: string;
    otherUserId?: string;
    amount: number;
    description: string;
    date: string;
    groupId?: string;
    status?: 'pending' | 'confirmed';
  }): Promise<Debt | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setError(null);
    try {
      const newDebt = await debtsApi.create(debt);
      await refreshDebts();
      return newDebt;
    } catch (err: any) {
      console.error('Error adding debt:', err);
      setError(err.message || 'Failed to add debt');
      return null;
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>): Promise<Debt | null> => {
    setError(null);
    try {
      const updatedDebt = await debtsApi.update(id, updates);
      await refreshDebts();
      return updatedDebt;
    } catch (err: any) {
      console.error('Error updating debt:', err);
      setError(err.message || 'Failed to update debt');
      return null;
    }
  };

  const deleteDebt = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await debtsApi.delete(id);
      await refreshDebts();
      return true;
    } catch (err: any) {
      console.error('Error deleting debt:', err);
      setError(err.message || 'Failed to delete debt');
      return false;
    }
  };

  const markAsPaid = async (id: string): Promise<Debt | null> => {
    setError(null);
    try {
      const updatedDebt = await debtsApi.markAsPaid(id);
      await refreshDebts();
      return updatedDebt;
    } catch (err: any) {
      console.error('Error marking debt as paid:', err);
      setError(err.message || 'Failed to mark as paid');
      return null;
    }
  };

  const getStatistics = async (): Promise<DebtStatistics | null> => {
    if (!user) {
      return {
        totalHutang: 0,
        totalPiutang: 0,
        totalPaidHutang: 0,
        totalPaidPiutang: 0,
        netBalance: 0,
        totalDebts: 0,
        unpaidDebts: 0,
        paidDebts: 0,
      };
    }

    setError(null);
    try {
      return await debtsApi.getSummary();
    } catch (err: any) {
      console.error('Error getting statistics:', err);
      setError(err.message || 'Failed to get statistics');
      return null;
    }
  };

  const getHutangList = (): Debt[] => {
    return debts.filter(d => d.type === 'hutang');
  };

  const getPiutangList = (): Debt[] => {
    return debts.filter(d => d.type === 'piutang');
  };

  return (
    <DebtContext.Provider
      value={{
        debts,
        isLoading,
        error,
        refreshDebts,
        addDebt,
        updateDebt,
        deleteDebt,
        markAsPaid,
        getStatistics,
        getHutangList,
        getPiutangList,
      }}
    >
      {children}
    </DebtContext.Provider>
  );
}

export function useDebt() {
  const context = useContext(DebtContext);
  if (context === undefined) {
    throw new Error('useDebt must be used within a DebtProvider');
  }
  return context;
}
