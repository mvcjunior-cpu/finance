/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Calendar, Receipt, DollarSign, Sparkles } from 'lucide-react';
import { AppDatabase } from '../utils/AppDatabase';
import { Transaction } from '../types';

interface RegistrationScreenProps {
  onNavigateBack: () => void;
  editingTransaction?: Transaction | null;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ 
  onNavigateBack,
  editingTransaction 
}) => {
  const [type, setType] = useState<'expense' | 'income'>(editingTransaction?.type || 'expense');
  // Form values
  const [date, setDate] = useState<string>(() => {
    if (editingTransaction) return editingTransaction.date;
    // Default to current local date in YYYY-MM-DD
    const today = new Date();
    const Y = today.getFullYear();
    const M = String(today.getMonth() + 1).padStart(2, '0');
    const D = String(today.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  });
  const [description, setDescription] = useState<string>(editingTransaction?.description || '');
  const [amountStr, setAmountStr] = useState<string>(
    editingTransaction ? Math.abs(editingTransaction.amount).toString() : ''
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Field Validation
    if (!description.trim()) {
      setErrorMsg('Por favor, insira uma descrição');
      return;
    }

    if (!date) {
      setErrorMsg('Por favor, escolha uma data válida');
      return;
    }

    const numericAmount = parseFloat(amountStr);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Por favor, insira um valor válido maior que 0');
      return;
    }

    // Set sign based on type choice
    const actualAmount = type === 'expense' ? -numericAmount : numericAmount;

    try {
      if (editingTransaction) {
        const updatedTx: Transaction = {
          ...editingTransaction,
          date,
          description: description.trim(),
          amount: actualAmount,
          type,
        };
        await AppDatabase.transactionDao.update(updatedTx);
      } else {
        // Build transaction object
        const newTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          date,
          description: description.trim(),
          amount: actualAmount,
          type,
        };
        await AppDatabase.transactionDao.insert(newTx);
      }
      onNavigateBack();
    } catch (err) {
      setErrorMsg('Falha ao salvar no banco de dados');
    }
  };

  return (
    <div id="registration_view" className="flex flex-col h-full bg-slate-50/30 dark:bg-neutral-955 overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 border-slate-100 dark:border-neutral-900/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            id="action_back_dashboard"
            onClick={onNavigateBack}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
            title="Cancelar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            {editingTransaction ? 'Editar Transação' : 'Adicionar Transação'}
          </h1>
        </div>
      </div>

      {/* Form Content */}
      <form
        onSubmit={handleSave}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-none"
      >
        {/* Type Segmented Tab Container */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[10px] font-sans uppercase font-extrabold tracking-wider text-slate-400 dark:text-neutral-500">
            Tipo de Transação
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-neutral-900 border border-slate-200/30 dark:border-neutral-800">
            <button
              type="button"
              id="select_expense"
              onClick={() => setType('expense')}
              className={`py-2.5 px-4 rounded-lg text-xs font-bold font-sans tracking-wide transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300'
              }`}
            >
              Despesa (-)
            </button>
            <button
              type="button"
              id="select_income"
              onClick={() => setType('income')}
              className={`py-2.5 px-4 rounded-lg text-xs font-bold font-sans tracking-wide transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300'
              }`}
            >
              Receita (+)
            </button>
          </div>
        </div>

        {/* Input amount text field with local numeric keyboard simulation styling */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[10px] font-sans uppercase font-extrabold tracking-wider text-slate-400 dark:text-neutral-500">
            Valor
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-bold text-slate-400 dark:text-neutral-500 text-xs">
              R$
            </span>
            <input
              type="number"
              id="input_amount"
              step="0.01"
              min="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0,00"
              className="w-full pl-10 pr-5 py-3 font-mono text-xs font-bold bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-xl text-slate-905 dark:text-neutral-50 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-350 dark:placeholder:text-neutral-700"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[10px] font-sans uppercase font-extrabold tracking-wider text-slate-400 dark:text-neutral-500">
            Descrição
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <Receipt className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
            </span>
            <input
              type="text"
              id="input_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Conta de Luz, Supermercado, Salário"
              maxLength={60}
              className="w-full pl-10 pr-5 py-3 font-sans text-xs font-semibold bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-xl text-slate-905 dark:text-neutral-50 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-350 dark:placeholder:text-neutral-700 search-none"
              required
            />
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-[10px] font-sans uppercase font-extrabold tracking-wider text-slate-400 dark:text-neutral-500">
            Data
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
            </span>
            <input
              type="date"
              id="input_date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-5 py-3 font-mono text-xs font-bold bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-xl text-slate-905 dark:text-neutral-50 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Error Messages Panel */}
        {errorMsg && (
          <p id="registration_error" className="text-[11px] text-rose-500 font-bold px-1 font-sans">
            &bull; {errorMsg}
          </p>
        )}

        {/* Bottom Button Panel */}
        <div className="pt-2 shrink-0">
          <button
            type="submit"
            id="action_save_transaction"
            className="w-full py-3.5 px-6 rounded-xl font-bold tracking-wider text-xs uppercase bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <Check className="w-4 h-4" /> Salvar Transação
          </button>
        </div>
      </form>
    </div>
  );
};
