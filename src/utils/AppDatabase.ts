/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Settings } from '../types';
import { StateFlow } from './StateFlow';

/**
 * Calculates the monthly accounting cycle based on the user-configured Month Start Day.
 * If Month Start Day is 27:
 * - A transaction on Jan 27th falls into the "February Cycle".
 * - A transaction on Feb 26th falls into the "February Cycle".
 * - A transaction on Feb 27th falls into the "March Cycle".
 */
export interface AccountingCycle {
  month: number; // 1-12
  year: number;
  label: string; // e.g., "February 2026"
  key: string;   // e.g., "2026-02" for reliable descending sorting
}

export function getAccountingCycle(dateStr: string, monthStartDay: number): AccountingCycle {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 1; // 1-12
  const day = parseInt(parts[2], 10) || 1;

  let cycleMonth = month;
  let cycleYear = year;

  if (day >= monthStartDay) {
    cycleMonth = month + 1;
    if (cycleMonth > 12) {
      cycleMonth = 1;
      cycleYear = year + 1;
    }
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const label = `Ciclo de ${monthNames[cycleMonth - 1]}`;
  const key = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}`;

  return {
    month: cycleMonth,
    year: cycleYear,
    label,
    key
  };
}

/**
 * Transaction Data Access Object (DAO) simulation
 */
class TransactionDao {
  private _transactionsFlow = new StateFlow<Transaction[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const raw = localStorage.getItem('room_database_transactions');
    if (raw) {
      try {
        this._transactionsFlow.value = JSON.parse(raw);
      } catch (e) {
        this._transactionsFlow.value = this.getSeeds();
      }
    } else {
      const seeds = this.getSeeds();
      this._transactionsFlow.value = seeds;
      this.saveToStorage(seeds);
    }
  }

  private saveToStorage(txs: Transaction[]) {
    localStorage.setItem('room_database_transactions', JSON.stringify(txs));
  }

  private getSeeds(): Transaction[] {
    // Generate helpful dates around the 27th cycle boundaries to demonstrate logic.
    return [
      {
        id: 'tx-1',
        date: '2026-05-28',
        description: 'Pagamento Freelance (Próximo Ciclo)',
        amount: 1450.00,
        type: 'income',
      },
      {
        id: 'tx-2',
        date: '2026-05-27',
        description: 'Bônus Extra (Limite de Corte do Ciclo)',
        amount: 250.00,
        type: 'income',
      },
      {
        id: 'tx-3',
        date: '2026-05-26',
        description: 'Supermercado Orgânico',
        amount: -128.40,
        type: 'expense',
      },
      {
        id: 'tx-4',
        date: '2026-05-15',
        description: 'Internet Banda Larga Fibra',
        amount: -65.00,
        type: 'expense',
      },
      {
        id: 'tx-5',
        date: '2026-04-28',
        description: 'Pagamento do Aluguel (Ciclo de Maio)',
        amount: -1200.00,
        type: 'expense',
      },
      {
        id: 'tx-6',
        date: '2026-04-27',
        description: 'Salário Mensal Regular',
        amount: 4500.00,
        type: 'income',
      },
      {
        id: 'tx-7',
        date: '2026-04-10',
        description: 'Cafeteria e Confeitaria',
        amount: -14.50,
        type: 'expense',
      },
      {
        id: 'tx-8',
        date: '2026-03-30',
        description: 'Combustível Posto de Gasolina',
        amount: -48.00,
        type: 'expense',
      }
    ];
  }

  /**
   * Observe all transactions in Room as a StateFlow
   */
  getAllTransactionsFlow(): StateFlow<Transaction[]> {
    return this._transactionsFlow;
  }

  /**
   * Room DAO Insert
   */
  async insert(tx: Transaction) {
    const current = [tx, ...this._transactionsFlow.value];
    this._transactionsFlow.value = current;
    this.saveToStorage(current);
  }

  /**
   * Room DAO Update
   */
  async update(updatedTx: Transaction) {
    const current = this._transactionsFlow.value.map((t) => t.id === updatedTx.id ? updatedTx : t);
    this._transactionsFlow.value = current;
    this.saveToStorage(current);
  }

  /**
   * Room DAO Delete
   */
  async delete(id: string) {
    const current = this._transactionsFlow.value.filter((t) => t.id !== id);
    this._transactionsFlow.value = current;
    this.saveToStorage(current);
  }

  /**
   * Reset database to initial seeds
   */
  async resetToSeeds() {
    const seeds = this.getSeeds();
    this._transactionsFlow.value = seeds;
    this.saveToStorage(seeds);
  }
}

/**
 * Settings Data Access Object (DAO) simulation
 */
class SettingsDao {
  private _settingsFlow = new StateFlow<Settings>({
    monthStartDay: 27,
    isDarkMode: true
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const raw = localStorage.getItem('room_database_settings');
    if (raw) {
      try {
        this._settingsFlow.value = JSON.parse(raw);
      } catch (e) {
        // use default
      }
    } else {
      this.saveToStorage(this._settingsFlow.value);
    }
  }

  private saveToStorage(settings: Settings) {
    localStorage.setItem('room_database_settings', JSON.stringify(settings));
  }

  /**
   * Observe current settings in Room as a StateFlow
   */
  getSettingsFlow(): StateFlow<Settings> {
    return this._settingsFlow;
  }

  /**
   * Room DAO Save/Update settings
   */
  async updateSettings(settings: Settings) {
    this._settingsFlow.value = settings;
    this.saveToStorage(settings);
  }
}

/**
 * AppDatabase acts as the primary Room database initializer
 */
export class AppDatabase {
  static transactionDao = new TransactionDao();
  static settingsDao = new SettingsDao();
}
