
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Currency = 'usd' | 'lkr';

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'selectedSiteCurrency';

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>('usd');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
    if (storedCurrency && (storedCurrency === 'usd' || storedCurrency === 'lkr')) {
      setSelectedCurrencyState(storedCurrency);
      setCurrencySymbol(storedCurrency === 'usd' ? '$' : 'Rs.');
    } else {
      // Default to USD if nothing is stored or invalid
      setSelectedCurrencyState('usd');
      setCurrencySymbol('$');
      localStorage.setItem(CURRENCY_STORAGE_KEY, 'usd');
    }
    setIsInitialized(true);
  }, []);

  const setSelectedCurrency = useCallback((currency: Currency) => {
    if (!isInitialized) return; // Prevent setting before initialization
    setSelectedCurrencyState(currency);
    setCurrencySymbol(currency === 'usd' ? '$' : 'Rs.');
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [isInitialized]);

  // Prevent rendering children until currency is initialized to avoid hydration mismatch
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
