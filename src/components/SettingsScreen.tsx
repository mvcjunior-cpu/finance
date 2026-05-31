/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Check, Sun, Moon, Database, HelpCircle, RefreshCcw } from 'lucide-react';
import { AppDatabase } from '../utils/AppDatabase';
import { Settings } from '../types';

interface SettingsScreenProps {
  settings: Settings;
  onNavigateBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onNavigateBack }) => {
  const [startDayInput, setStartDayInput] = useState<string>(settings.monthStartDay.toString());
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const dayNum = parseInt(startDayInput, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setErrorMsg('O dia de início da contabilidade deve ser um número entre 1 e 31');
      return;
    }

    // Save using DAO to update the StateFlow
    const newSettings: Settings = {
      ...settings,
      monthStartDay: dayNum,
    };

    try {
      await AppDatabase.settingsDao.updateSettings(newSettings);
      setSuccessMsg('Configurações atualizadas com sucesso!');
      setTimeout(() => onNavigateBack(), 500);
    } catch (err) {
      setErrorMsg('Falha ao atualizar as configurações no banco de dados');
    }
  };

  const handleToggleTheme = async () => {
    const newSettings: Settings = {
      ...settings,
      isDarkMode: !settings.isDarkMode,
    };
    await AppDatabase.settingsDao.updateSettings(newSettings);
  };

  const handleResetDatabase = async () => {
    if (confirm("Redefinir o banco de dados para os lançamentos iniciais? Isso excluirá transações personalizadas.")) {
      await AppDatabase.transactionDao.resetToSeeds();
      alert("Banco de dados redefinido com sucesso!");
    }
  };

  return (
    <div id="settings_view" className="flex flex-col h-full bg-slate-50/30 dark:bg-neutral-955 overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 border-slate-100 dark:border-neutral-900/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            id="action_back_dashboard_settings"
            onClick={onNavigateBack}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Configurações
          </h1>
        </div>
      </div>

      {/* Settings Form Body */}
      <form
        onSubmit={handleSaveSettings}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-none"
      >
        {/* Theme Settings Mode Section */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[10px] font-sans uppercase font-extrabold tracking-wider text-slate-400 dark:text-neutral-500 block">
            Tema da Interface
          </label>
          <button
            type="button"
            id="action_toggle_theme"
            onClick={handleToggleTheme}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-250/30 dark:border-neutral-800 text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-neutral-900/55 transition-all shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              {settings.isDarkMode ? (
                <>
                  <div className="p-2 rounded-lg bg-orange-950/20 text-orange-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-neutral-200">
                      Tema Claro
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 font-medium">
                      Ative o tema claro limpo e minimalista
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-neutral-200">
                      Tema Escuro
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 font-medium">
                      Ative o tema escuro confortável para os olhos
                    </span>
                  </div>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Business Logic Month Day Cut-off field */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[10px] font-sans uppercase font-extrabold tracking-wider text-slate-400 dark:text-neutral-500 block">
            Dia do Ciclo de Faturamento &amp; Contabilidade
          </label>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-slate-250/30 dark:border-neutral-800 space-y-3 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                Dia de Início do Mês
              </span>
              <p className="text-[10px] text-slate-400 dark:text-neutral-550 mt-0.5 leading-relaxed font-semibold">
                Define a âncora do calendário. Transações feitas a partir deste dia são agrupadas no próximo ciclo de faturamento.
              </p>
            </div>

            <div className="relative">
              <input
                type="number"
                id="input_cutoff_day"
                min="1"
                max="31"
                value={startDayInput}
                onChange={(e) => setStartDayInput(e.target.value)}
                placeholder="27"
                className="w-full px-4 py-2.5 font-mono text-xs font-bold bg-slate-50/80 dark:bg-neutral-950/60 border border-slate-205 dark:border-neutral-800 rounded-lg text-slate-905 dark:text-neutral-50 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-center"
                required
              />
            </div>
          </div>
        </div>

        {/* Dynamic Recalculation Context Help Panel */}
        <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-neutral-900/60 border border-slate-200/50 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 text-[11px] leading-relaxed space-y-2">
          <span className="font-extrabold text-slate-900 dark:text-neutral-200 flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" /> Exemplo de Regra de Ciclo Lógico
          </span>
          <p className="text-slate-500 dark:text-neutral-450 font-medium leading-relaxed">
            Se o Dia de Início do Mês for definido como <strong className="text-slate-805 dark:text-neutral-250 font-mono font-bold">{startDayInput || '27'}</strong>:
          </p>
          <div className="pl-2 border-l border-slate-300 dark:border-neutral-800 space-y-1 text-slate-500 dark:text-neutral-455 font-semibold text-[10.5px]">
            <p>
              &bull; {startDayInput || '27'} de Jan a {(parseInt(startDayInput, 10) - 1) || '26'} de Fev será agrupado no <span className="font-bold text-indigo-600 dark:text-indigo-400">Ciclo de Fevereiro</span>.
            </p>
            <p>
              &bull; {startDayInput || '27'} de Fev a {(parseInt(startDayInput, 10) - 1) || '26'} de Mar será agrupado no <span className="font-bold text-indigo-600 dark:text-indigo-400">Ciclo de Março</span>.
            </p>
          </div>
        </div>

        {/* Room Database Reset Options */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[10px] font-sans uppercase font-extrabold tracking-wider text-slate-400 dark:text-neutral-500 block">
            Manutenção do Banco de Dados Room
          </label>
          <button
            type="button"
            id="action_reset_db"
            onClick={handleResetDatabase}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-rose-50/5 hover:bg-rose-50/10 dark:bg-rose-955/10 border border-rose-200/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-sans cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <span className="block text-xs font-bold text-rose-700 dark:text-rose-300">
                  Redefinir Banco Room
                </span>
                <span className="block text-[10px] text-rose-400 dark:text-rose-500 mt-0.5 font-medium">
                  Recarregar lançamentos mock de demonstração
                </span>
              </div>
            </div>
            <RefreshCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          </button>
        </div>

        {/* Feedback Messages Panel */}
        {errorMsg && (
          <p id="settings_error" className="text-[11px] text-rose-500 font-bold px-2 font-sans">
            &bull; {errorMsg}
          </p>
        )}
        {successMsg && (
          <p id="settings_success" className="text-[11px] text-emerald-500 font-bold px-2 font-sans flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {successMsg}
          </p>
        )}

        {/* Save Core Settings Button */}
        <div className="pt-2 shrink-0">
          <button
            type="submit"
            id="action_save_settings"
            className="w-full py-3.5 px-6 rounded-xl font-bold tracking-wider text-xs uppercase bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            Salvar Configurações &amp; Recalcular
          </button>
        </div>
      </form>
    </div>
  );
};
