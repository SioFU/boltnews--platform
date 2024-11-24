import React from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className="w-full">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { value, onValueChange });
          }
          return child;
        })}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`inline-flex p-1 bg-gray-800/50 rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      onClick={() => context?.onValueChange(value)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none ${
        isActive
          ? 'bg-gray-700 text-white shadow-sm'
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  
  if (context?.value !== value) return null;
  
  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
}