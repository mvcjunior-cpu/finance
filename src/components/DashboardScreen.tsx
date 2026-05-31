/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Plus, Settings as SettingsIcon, Trash2, Calendar, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import { Transaction, Settings } from '../types';
import { AppDatabase, getAccountingCycle, AccountingCycle } from '../utils/AppDatabase';

interface GroupedTransactions {
  cycle: AccountingCycle;
  transactions: Transaction[];
  totalBalance: number;
}

/**
 * Main business helper to group transactions by their cycle and sort them.
 */
function getGroupedAndSortedTransactions(
  transactions: Transaction[],
  monthStartDay: number
): GroupedTransactions[] {
  const groupsMap: { [key: string]: { cycle: AccountingCycle; txs: Transaction[] } } = {};

  transactions.forEach((tx) => {
    const cycle = getAccountingCycle(tx.date, monthStartDay);
    if (!groupsMap[cycle.key]) {
      groupsMap[cycle.key] = {
        cycle,
        txs: []
      };
    }
    groupsMap[cycle.key].txs.push(tx);
  });

  const grouped = Object.keys(groupsMap).map((key) => {
    const group = groupsMap[key];
    
    // Sort transactions within each cycle: most recent first (descending date)
    // If dates are identical, sort by ID to persist stability.
    const sortedTxs = [...group.txs].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });

    const totalBalance = sortedTxs.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      cycle: group.cycle,
      transactions: sortedTxs,
      totalBalance
    };
  });

  // Sort cycles descending (most recent cycle first)
  return grouped.sort((a, b) => b.cycle.key.localeCompare(a.cycle.key));
}

interface DashboardScreenProps {
  transactions: Transaction[];
  settings: Settings;
  onNavigateToRegistration: () => void;
  onNavigateToSettings: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  transactions,
  settings,
  onNavigateToRegistration,
  onNavigateToSettings,
  onEditTransaction,
}) => {
  const groupedData = getGroupedAndSortedTransactions(transactions, settings.monthStartDay);

  // Formatter for currency
  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return value < 0 ? `-${formatted}` : `+${formatted}`;
  };

  // Extract day token
  const getDayLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    return parts[2] ? parseInt(parts[2], 10).toString() : '01';
  };

  // Calculate overall metrics
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const netWorth = totalIncome + totalExpense;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      await AppDatabase.transactionDao.delete(id);
    }
  };

  return (
    <div id="dashboard_view" className="relative flex flex-col h-full bg-slate-50/30 dark:bg-neutral-950 overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 border-slate-100 dark:border-slate-900/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
              Fluxo de Caixa
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Kotlin StateFlow &bull; Room DB
            </p>
          </div>
        </div>
        <button
          id="action_settings"
          onClick={onNavigateToSettings}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
          title="Abrir Configurações"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 pb-24 space-y-5 scrollbar-thin">
        {/* Core Financial Header */}
        <div className="pt-2 shrink-0">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-neutral-50 tracking-tight font-sans">
            {formatCurrency(netWorth)}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold mt-1">
            Saldo Total &bull; <span className="text-indigo-600 dark:text-indigo-400">Ciclo de Visualização Atual</span>
          </p>
        </div>

        {/* Core Financial Summary */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/15 border border-emerald-100/60 dark:border-emerald-900/20">
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">Entradas</p>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-305 mt-0.5">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-955/15 border border-rose-100/60 dark:border-rose-900/20">
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-rose-600 dark:text-rose-400">Saídas</p>
            <p className="text-base font-bold text-rose-700 dark:text-rose-305 mt-0.5">{formatCurrency(Math.abs(totalExpense))}</p>
          </div>
        </div>

        {/* Explain Cut-off Card */}
        <div className="p-4 text-[11px] rounded-xl bg-slate-100/80 dark:bg-neutral-900 border border-slate-200/40 dark:border-neutral-800 text-slate-600 dark:text-neutral-350 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Calendar className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-805 dark:text-neutral-200">
                A contabilidade mensal inicia no dia {settings.monthStartDay}
              </p>
              <p className="mt-0.5 text-slate-500 dark:text-neutral-450 leading-relaxed font-medium">
                O ciclo agrupa automaticamente lançamentos do dia {settings.monthStartDay} do mês anterior até o dia {settings.monthStartDay - 1 === 0 ? 30 : settings.monthStartDay - 1} do mês atual.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Group List */}
        <div className="space-y-6">
          {groupedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Nenhuma transação encontrada
              </p>
              <button
                onClick={onNavigateToRegistration}
                className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Adicionar primeira transação
              </button>
            </div>
          ) : (
            groupedData.map((group) => (
              <div
                key={group.cycle.key}
                className="space-y-1.5"
                id={`cycle-group-${group.cycle.key}`}
              >
                {/* Month Group Header */}
                <div className="py-3 sticky top-0 bg-white/95 dark:bg-neutral-950/95 z-10 flex justify-between items-end border-b border-slate-100/50 dark:border-neutral-900/40 mb-2">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-sans">
                    {group.cycle.label}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Total do Ciclo: <span className={`font-bold ${group.totalBalance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-401'}`}>{formatCurrency(group.totalBalance)}</span>
                  </p>
                </div>

                {/* List Items */}
                <div className="divide-y divide-slate-50 dark:divide-neutral-900/60 pb-2">
                  {group.transactions.map((tx) => {
                    const isIncome = tx.amount >= 0;
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={tx.id}
                        id={`tx-item-${tx.id}`}
                        onClick={() => onEditTransaction(tx)}
                        className="group relative flex items-center justify-between py-3.5 hover:bg-slate-100/50 dark:hover:bg-neutral-900/30 transition-all duration-150 px-2 rounded-xl cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Calendar Day Icon Badge */}
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-[13px] shrink-0 font-mono border border-slate-200/10">
                            {getDayLabel(tx.date)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate leading-tight">
                              {tx.description}
                            </h3>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block mt-0.5">
                              {tx.date}
                            </span>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold shrink-0 mr-1.5 ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-650 dark:text-rose-400'
                            }`}
                          >
                            {formatCurrency(tx.amount)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              id={`edit_tx_${tx.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTransaction(tx);
                              }}
                              className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100/60 dark:hover:bg-neutral-800/40 transition-all cursor-pointer shrink-0"
                              title="Editar Transação"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`delete_tx_${tx.id}`}
                              onClick={(e) => handleDelete(tx.id, e)}
                              className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100/60 dark:hover:bg-neutral-800/40 transition-all cursor-pointer shrink-0"
                              title="Excluir Transação"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        id="action_fab_add"
        onClick={onNavigateToRegistration}
        className="absolute bottom-6 right-6 w-12 h-12 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors ring-4 ring-indigo-50 dark:ring-indigo-950/40 cursor-pointer"
        title="Adicionar Transação"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
};
