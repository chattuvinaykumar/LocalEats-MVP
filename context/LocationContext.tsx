import React, { createContext, useContext, useState } from 'react';

type City = 'Hyderabad' | 'Bengaluru' | 'Chennai' | 'Mumbai';

interface LocationContextType {
  city: City;
  setCity: (city: City) => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState<City>('Hyderabad');

  return (
    <LocationContext.Provider value={{ city, setCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
