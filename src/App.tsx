/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Database, 
  Smartphone, 
  Sparkles, 
  Layers, 
  Activity, 
  History, 
  CheckCircle2, 
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';

import { Transaction, Settings } from './types';
import { AppDatabase, getAccountingCycle } from './utils/AppDatabase';
import { useCollectAsState } from './utils/StateFlow';

// Import Screens
import { DashboardScreen } from './components/DashboardScreen';
import { RegistrationScreen } from './components/RegistrationScreen';
import { SettingsScreen } from './components/SettingsScreen';

export default function App() {
  // Collect state reactively through our simulated Kotlin StateFlow
  const transactions = useCollectAsState(AppDatabase.transactionDao.getAllTransactionsFlow());
  const settings = useCollectAsState(AppDatabase.settingsDao.getSettingsFlow());

  // Active Android Screen state: 'dashboard' | 'registration' | 'settings'
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'registration' | 'settings'>('dashboard');

  // Currently selected transaction for editing (or null for a new transaction)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Local live clock for the phone simulator status bar
  const [currentTime, setCurrentTime] = useState<string>('20:39');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update theme on body to support global background theme changes if necessary
  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

  // Navigation handlers
  const handleAddNewTransaction = () => {
    setEditingTransaction(null);
    setActiveScreen('registration');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setActiveScreen('registration');
  };

  // Compute stats for current active cycle
  const currentCyclesCount = new Set(
    transactions.map((t) => getAccountingCycle(t.date, settings.monthStartDay).label)
  ).size;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-955 text-slate-800 dark:text-neutral-100 font-sans transition-colors duration-300">
      
      {/* Outer grid layout: Responsive split preview & inspection dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-8 lg:gap-12">
        
        {/* Left Side: physical Android device mockup hosting the Material 3 finance application */}
        <div className="w-full max-w-[420px] flex flex-col items-center shrink-0">
          <div className="text-center mb-5 md:hidden">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Gerenciador Financeiro Pessoal
            </h1>
            <p className="text-xs text-slate-400 dark:text-neutral-400 mt-1">
              Simulador Android Material Design 3
            </p>
          </div>

          {/* Device Shell Frame Container */}
          <div className="relative w-full aspect-[9/18.5] bg-slate-200 dark:bg-neutral-900 rounded-[50px] p-2.5 shadow-2xl border-4 border-slate-300 dark:border-neutral-800/80 ring-1 ring-slate-400/10 dark:ring-neutral-750 backdrop-blur-md">
            
            {/* Phone Screen Internal container */}
            <div className="relative w-full h-full bg-white dark:bg-neutral-950 rounded-[40px] overflow-hidden flex flex-col shadow-inner select-none">
              
              {/* Android Dynamic Island / Bezel notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-32 h-4 bg-black rounded-full z-50 flex items-center justify-around px-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-indigo-900/40"></div>
                </div>
                <div className="w-2 h-0.5 bg-neutral-900 rounded-full"></div>
              </div>

              {/* Status Bar */}
              <div className="w-full h-9 pt-2.5 px-6 flex items-center justify-between z-40 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-sm shrink-0 border-b border-transparent">
                {/* Simulated Left corner Clock */}
                <span className="text-[11px] font-bold font-sans text-slate-755 dark:text-neutral-200 tracking-tight leading-none">
                  {currentTime}
                </span>

                {/* Simulated Right Icons */}
                <div className="flex items-center gap-1 text-slate-700 dark:text-neutral-200">
                  {/* Signal Icon */}
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 h-1.5 bg-slate-600 dark:bg-neutral-300 rounded-full"></span>
                    <span className="w-0.5 h-2 bg-slate-600 dark:bg-neutral-300 rounded-full"></span>
                    <span className="w-0.5 h-2.5 bg-slate-600 dark:bg-neutral-300 rounded-full"></span>
                  </div>

                  {/* Battery icon */}
                  <div className="w-5 h-2.5 border border-slate-400 dark:border-neutral-300 rounded-sm p-0.5 flex items-center gap-0.5">
                    <div className="w-full h-full bg-slate-600 dark:bg-neutral-300 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Real-time screen router containing transitions */}
              <div className="flex-1 min-h-0 relative bg-slate-50/50 dark:bg-neutral-950">
                <AnimatePresence mode="wait">
                  {activeScreen === 'dashboard' && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 h-full"
                    >
                      <DashboardScreen
                        transactions={transactions}
                        settings={settings}
                        onNavigateToRegistration={handleAddNewTransaction}
                        onNavigateToSettings={() => setActiveScreen('settings')}
                        onEditTransaction={handleEditTransaction}
                      />
                    </motion.div>
                  )}

                  {activeScreen === 'registration' && (
                    <motion.div
                      key="registration"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 h-full"
                    >
                      <RegistrationScreen 
                        editingTransaction={editingTransaction}
                        onNavigateBack={() => {
                          setEditingTransaction(null);
                          setActiveScreen('dashboard');
                        }} 
                      />
                    </motion.div>
                  )}

                  {activeScreen === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 h-full"
                    >
                      <SettingsScreen
                        settings={settings}
                        onNavigateBack={() => setActiveScreen('dashboard')}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Guest System Pill Bar */}
              <div className="w-full h-7 shrink-0 flex items-center justify-center bg-white/20 dark:bg-neutral-955 backdrop-blur-sm z-40 border-t border-transparent">
                <div 
                  onClick={() => setActiveScreen('dashboard')}
                  className="w-28 h-1 bg-slate-300 dark:bg-neutral-700/80 rounded-full hover:bg-slate-400 transition-all cursor-pointer"
                  title="Retornar ao Início / Painel"
                ></div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: High-fidelity Workspace HUD Inspector & Engine Documentation */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-6">
          
          {/* Header Metadata block inside frame limits */}
          <div className="space-y-1.5 hidden md:block">
            <span className="text-[10px] uppercase font-mono font-extrabold px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full tracking-wider border border-indigo-500/10 inline-block">
              Simulação Jetpack Compose MVVM
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-905 dark:text-teal-50">
              Gerenciador Financeiro Pessoal
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed max-w-xl font-medium">
              Uma auditoria de demonstração mostrando persistência offline em componentes simulados do Android Room. 
              O aplicativo traduz observadores de corrotinas do Kotlin em um ambiente totalmente reativo e seguro.
            </p>
          </div>

          {/* Engine Real-time Inspection HUD Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* HUD Panel 1: StateFlow Reactive Sync debugger */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 ml-0 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-50 font-sans leading-none">
                    Observador de Stream StateFlow
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 font-medium">
                    Telemetria em tempo real das mudanças de estado
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/30 font-mono text-[11px]">
                  <span className="text-[10px] text-slate-400">_transactionsFlow.value</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {transactions.length} itens
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/30 font-mono text-[11px]">
                  <span className="text-[10px] text-slate-400">_settingsFlow.value.cutoff</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Dia {settings.monthStartDay}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/30 font-mono text-[11px]">
                  <span className="text-[10px] text-slate-400">Estado de Tela Ativa</span>
                  <span className="font-bold text-rose-500 uppercase text-[9.5px] tracking-wider">
                    {activeScreen}
                  </span>
                </div>
              </div>
            </div>

            {/* HUD Panel 2: Cut-off Calculation Explainer with status */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 ml-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-50 font-sans leading-none">
                    Motor de Recálculo
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-550 mt-1 font-medium">
                    Redistribuição contínua do ciclo
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/30 font-sans text-[11px] font-semibold">
                  <span className="text-[10px] text-slate-400">Ciclos Detectados</span>
                  <span className="font-bold text-slate-800 dark:text-neutral-200 font-mono">
                    {currentCyclesCount} Ciclos
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/30 font-sans text-[11px] font-semibold">
                  <span className="text-[10px] text-slate-400">Status do Banco Local</span>
                  <span className="font-bold text-[9.5px] uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Room Ativo
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/30 font-sans text-[11px] font-semibold">
                  <span className="text-[10px] text-slate-400">Sincronização de Tema</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {settings.isDarkMode ? "Escuro Minimalista" : "Claro Minimalista"}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Persistent Room Database Ledger */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 ml-0 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-50 font-sans leading-none">
                    Inspetor de Banco de Dados Room
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 font-medium">
                    Tabela bruta de entidades persistida no Web Storage
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-neutral-500 tracking-wider">
                SQLITE MODEL MOCK
              </span>
            </div>

            <div className="border border-slate-100 dark:border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-neutral-850 text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 leading-none select-none border-b border-slate-100 dark:border-neutral-800">
                      <th className="p-3">ID</th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Ciclo Contábil</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/40 font-mono text-[11px]">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-sans">
                          Tabela de banco de dados vazia
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 4).map((tx) => {
                        const cycleInfo = getAccountingCycle(tx.date, settings.monthStartDay);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/40 dark:hover:bg-neutral-800/20 text-slate-700 dark:text-neutral-300">
                            <td className="p-3 text-slate-400">{tx.id.substring(0, 7)}...</td>
                            <td className="p-3">{tx.date}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-650 dark:text-slate-400 font-sans font-bold text-[10px]">
                                {cycleInfo.label}
                              </span>
                            </td>
                            <td className="p-3 truncate max-w-[120px] font-sans font-semibold text-slate-900 dark:text-neutral-100">
                              {tx.description}
                            </td>
                            <td className={`p-3 text-right font-bold ${
                              tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                            }`}>
                              {tx.amount >= 0 
                                ? `+${tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` 
                                : `-${Math.abs(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {transactions.length > 4 && (
                <div className="p-2 bg-slate-50/50 dark:bg-neutral-800/10 text-center border-t border-slate-100 dark:border-neutral-800 text-[10px] text-slate-400 dark:text-neutral-550 font-medium">
                  E mais {transactions.length - 4} registros...
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center gap-4 border border-slate-805 shrink-0 shadow-sm">
            <div className="p-2.5 bg-slate-800 rounded-lg text-amber-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-extrabold leading-none text-slate-300 font-mono uppercase tracking-wider">
                Guia de Demonstração
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-semibold">
                Simule ciclos de faturamento padrão! Escolha o dia do faturamento nas configurações, insira lançamentos (ex: dias 26 e 28) e veja as transações no banco Room se reorganizarem dinamicamente.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
