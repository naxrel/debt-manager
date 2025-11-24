import { Debt, StaticDB } from '@/data/staticDatabase';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface DebtContextType {
  debts: Debt[];
  isLoading: boolean;
  refreshDebts: () => void;
  addDebt: (debt: Omit<Debt, 'id' | 'userId'>) => Debt;
  updateDebt: (id: string, updates: Partial<Debt>) => Debt | null;
  deleteDebt: (id: string) => boolean;
  markAsPaid: (id: string) => Debt | null;
  getStatistics: () => {
    totalHutang: number;
    totalPiutang: number;
    countHutang: number;
    countPiutang: number;
    balance: number;
  };
  getHutangList: () => Debt[];
  getPiutangList: () => Debt[];
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

export function DebtProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      refreshDebts();
    } else {
      setDebts([]);
      setIsLoading(false);
    }
  }, [user]);

  const refreshDebts = () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userDebts = StaticDB.getDebtsByUserId(user.id);
      setDebts(userDebts);
    } catch (error) {
      console.error('Error loading debts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addDebt = (debt: Omit<Debt, 'id' | 'userId'>): Debt => {
    if (!user) throw new Error('User not authenticated');
    const newDebt = StaticDB.addDebt({ ...debt, userId: user.id });
    refreshDebts();
    return newDebt;
  };

  const updateDebt = (id: string, updates: Partial<Debt>): Debt | null => {
    const updatedDebt = StaticDB.updateDebt(id, updates);
    if (updatedDebt) {
      refreshDebts();
    }
    return updatedDebt;
  };

  const deleteDebt = (id: string): boolean => {
    const success = StaticDB.deleteDebt(id);
    if (success) {
      refreshDebts();
    }
    return success;
  };

  const markAsPaid = (id: string): Debt | null => {
    return updateDebt(id, { isPaid: true });
  };

  const getStatistics = () => {
    if (!user) {
      return {
        totalHutang: 0,
        totalPiutang: 0,
        countHutang: 0,
        countPiutang: 0,
        balance: 0,
      };
    }
    return StaticDB.getDebtStatistics(user.id);
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
