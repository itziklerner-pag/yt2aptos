import React from 'react';
import { FileExplorer } from '@/components/file-explorer';
import { MainLayout } from '@/components/layout';

const App: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <img src="/src/assets/aptos-logo.svg" alt="Aptos Logo" className="w-8 h-8 mr-2" />
            AptosFS
          </h1>
        </header>
        <main className="flex-1 overflow-hidden p-4">
          <FileExplorer />
        </main>
      </div>
    </MainLayout>
  );
};

export default App;