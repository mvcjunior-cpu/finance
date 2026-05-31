/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive for income, negative for expense
  type: 'income' | 'expense';
}

export interface Settings {
  monthStartDay: number; // 1 to 31
  isDarkMode: boolean;
}
