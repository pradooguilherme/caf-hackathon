import { useState } from 'react';
import NavBar from './components/NavBar.jsx';
import Overview from './pages/Overview.jsx';
import Statistics from './pages/Statistics.jsx';

const TABS = {
  OVERVIEW: 'overview',
  STATISTICS: 'statistics',
};

function App() {
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  return (
    <div className="min-h-screen bg-bia-50 px-4 py-10 text-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="space-y-4 rounded-3xl bg-bia-600 px-6 py-8 text-white shadow-lg">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Painel Administrativo - Assistente Virtual Bia</h1>
            <p className="mt-2 max-w-2xl text-sm text-bia-100 sm:text-base">
              Monitore os tickets gerados pelo chatbot e acompanhe os principais indicadores de suporte.
            </p>
          </div>

          <NavBar activeTab={activeTab} onSelect={setActiveTab} />
        </header>

        <main className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-bia-100 sm:p-8">
          {activeTab === TABS.OVERVIEW ? <Overview /> : <Statistics />}
        </main>
      </div>
    </div>
  );
}

export default App;
