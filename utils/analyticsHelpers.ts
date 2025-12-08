// Analytics Helper Functions for Business Intelligence

import { Debt } from '@/data/staticDatabase';

// ============================================
// INTERFACES & TYPES
// ============================================

export interface AgeAnalysis {
  daysOutstanding: number;
  ageCategory: 'current' | 'watch' | 'alert' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  colorCode: string;
}

export interface OverdueDebt {
  debtId: string;
  debt: Debt;
  daysOverdue: number;
  priorityScore: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskFactors {
  paymentHistory: number;
  daysOutstanding: number;
  concentration: number;
  relationshipDuration: number;
  frequency: number;
}

export interface RiskScore {
  score: number;
  grade: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactors;
  trend: 'improving' | 'stable' | 'declining';
}

export interface MonthlySnapshot {
  month: string;
  year: number;
  totalPiutang: number;
  totalHutang: number;
  netBalance: number;
  transactionCount: number;
  collectionRate: number;
  averageRiskScore: number;
}

export interface TrendData {
  current: number;
  previous: number;
  changePercentage: number;
  direction: 'increasing' | 'decreasing' | 'stable';
  isPositive: boolean;
}

export interface RankingItem {
  id: string;
  name: string;
  value: number;
  percentage: number;
  rank: number;
  metadata?: any;
}

export interface ConcentrationRisk {
  isHighConcentration: boolean;
  topConcentration: number;
  topDebtors: Array<{ name: string; amount: number; percentage: number }>;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PaymentHistory {
  counterpartyId: string;
  counterpartyName: string;
  totalTransactions: number;
  onTimePayments: number;
  latePayments: number;
  averageDelayDays: number;
  complianceScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface RiskAlert {
  id: string;
  type: 'overdue' | 'concentration' | 'risk_score' | 'payment_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedDebtId?: string;
  actionRequired: string;
  createdAt: Date;
}

// ============================================
// TASK 1.1: AGING ANALYSIS
// ============================================

/**
 * Calculate days outstanding for a debt
 */
export function calculateDaysOutstanding(dateString: string): number {
  const debtDate = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - debtDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get age category based on days outstanding
 */
export function getAgeCategory(days: number): AgeAnalysis['ageCategory'] {
  if (days <= 30) return 'current';
  if (days <= 60) return 'watch';
  if (days <= 90) return 'alert';
  return 'critical';
}

/**
 * Get risk level based on age category
 */
export function getRiskLevel(category: AgeAnalysis['ageCategory']): AgeAnalysis['riskLevel'] {
  const riskMap: Record<AgeAnalysis['ageCategory'], AgeAnalysis['riskLevel']> = {
    current: 'low',
    watch: 'medium',
    alert: 'high',
    critical: 'critical',
  };
  return riskMap[category];
}

/**
 * Get color code based on risk level
 */
export function getColorCode(riskLevel: AgeAnalysis['riskLevel']): string {
  const colorMap: Record<AgeAnalysis['riskLevel'], string> = {
    low: '#10b981', // green
    medium: '#f59e0b', // amber
    high: '#ef4444', // red
    critical: '#dc2626', // dark red
  };
  return colorMap[riskLevel];
}

/**
 * Perform complete aging analysis on a debt
 */
export function analyzeDebtAge(debt: Debt): AgeAnalysis {
  const daysOutstanding = calculateDaysOutstanding(debt.date);
  const ageCategory = getAgeCategory(daysOutstanding);
  const riskLevel = getRiskLevel(ageCategory);
  const colorCode = getColorCode(riskLevel);

  return {
    daysOutstanding,
    ageCategory,
    riskLevel,
    colorCode,
  };
}

// ============================================
// TASK 1.2: OVERDUE DETECTION
// ============================================

/**
 * Calculate priority score for overdue debt
 * Score = (amount_weight * normalized_amount) + (days_weight * normalized_days)
 */
function calculatePriorityScore(amount: number, daysOverdue: number, maxAmount: number, maxDays: number): number {
  const AMOUNT_WEIGHT = 0.6;
  const DAYS_WEIGHT = 0.4;

  const normalizedAmount = maxAmount > 0 ? amount / maxAmount : 0;
  const normalizedDays = maxDays > 0 ? daysOverdue / maxDays : 0;

  return (AMOUNT_WEIGHT * normalizedAmount + DAYS_WEIGHT * normalizedDays) * 100;
}

/**
 * Get urgency level based on days overdue
 */
function getUrgencyLevel(daysOverdue: number): OverdueDebt['urgencyLevel'] {
  if (daysOverdue >= 90) return 'critical';
  if (daysOverdue >= 60) return 'high';
  if (daysOverdue >= 30) return 'medium';
  return 'low';
}

/**
 * Detect and prioritize overdue debts
 */
export function detectOverdueDebts(debts: Debt[]): OverdueDebt[] {
  const unpaidDebts = debts.filter(d => !d.isPaid && d.status === 'confirmed');
  
  // Calculate overdue for each debt
  const overdueDebts = unpaidDebts
    .map(debt => {
      const daysOutstanding = calculateDaysOutstanding(debt.date);
      const daysOverdue = daysOutstanding > 30 ? daysOutstanding - 30 : 0; // Grace period 30 days
      
      return {
        debtId: debt.id,
        debt,
        daysOverdue,
        priorityScore: 0, // Will calculate later
        urgencyLevel: getUrgencyLevel(daysOverdue) as OverdueDebt['urgencyLevel'],
      };
    })
    .filter(item => item.daysOverdue > 0);

  // Calculate priority scores
  const maxAmount = Math.max(...overdueDebts.map(d => d.debt.amount), 1);
  const maxDays = Math.max(...overdueDebts.map(d => d.daysOverdue), 1);

  const overdueWithPriority = overdueDebts.map(item => ({
    ...item,
    priorityScore: calculatePriorityScore(item.debt.amount, item.daysOverdue, maxAmount, maxDays),
  }));

  // Sort by priority score (highest first)
  return overdueWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);
}

// ============================================
// TASK 1.3: TREND COMPARISON
// ============================================

/**
 * Calculate month-over-month change percentage
 */
export function calculateMoMChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend direction from change percentage
 */
export function getTrendDirection(changePercentage: number): TrendData['direction'] {
  if (Math.abs(changePercentage) < 5) return 'stable';
  return changePercentage > 0 ? 'increasing' : 'decreasing';
}

/**
 * Calculate trend data for comparison
 */
export function calculateTrend(current: number, previous: number, isPositiveGood: boolean = true): TrendData {
  const changePercentage = calculateMoMChange(current, previous);
  const direction = getTrendDirection(changePercentage);
  
  let isPositive = false;
  if (direction === 'stable') {
    isPositive = true;
  } else if (isPositiveGood) {
    isPositive = direction === 'increasing';
  } else {
    isPositive = direction === 'decreasing';
  }

  return {
    current,
    previous,
    changePercentage,
    direction,
    isPositive,
  };
}

/**
 * Generate monthly snapshot from debts
 */
export function generateMonthlySnapshot(
  debts: Debt[],
  month: number,
  year: number
): MonthlySnapshot {
  const monthStr = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long' });
  
  // Filter debts up to this month
  const relevantDebts = debts.filter(d => {
    const debtDate = new Date(d.date);
    return debtDate.getFullYear() < year || 
           (debtDate.getFullYear() === year && debtDate.getMonth() < month);
  });

  const totalPiutang = relevantDebts
    .filter(d => d.type === 'piutang' && !d.isPaid)
    .reduce((sum, d) => sum + d.amount, 0);

  const totalHutang = relevantDebts
    .filter(d => d.type === 'hutang' && !d.isPaid)
    .reduce((sum, d) => sum + d.amount, 0);

  const transactionCount = relevantDebts.length;
  
  const paidDebts = relevantDebts.filter(d => d.isPaid).length;
  const collectionRate = transactionCount > 0 ? (paidDebts / transactionCount) * 100 : 0;

  // Calculate average risk score
  const riskScores = relevantDebts.map(d => {
    const age = analyzeDebtAge(d);
    return age.riskLevel === 'low' ? 25 : age.riskLevel === 'medium' ? 50 : age.riskLevel === 'high' ? 75 : 90;
  });
  const averageRiskScore = riskScores.length > 0 
    ? riskScores.reduce((sum, s) => sum + s, 0) / riskScores.length 
    : 0;

  return {
    month: monthStr,
    year,
    totalPiutang,
    totalHutang,
    netBalance: totalPiutang - totalHutang,
    transactionCount,
    collectionRate,
    averageRiskScore,
  };
}

// ============================================
// TASK 1.4: TOP RANKINGS
// ============================================

/**
 * Get top N items by value
 */
export function getTopRankings(
  items: Array<{ id: string; name: string; value: number; metadata?: any }>,
  topN: number = 5
): RankingItem[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return sorted.slice(0, topN).map((item, index) => ({
    id: item.id,
    name: item.name,
    value: item.value,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
    rank: index + 1,
    metadata: item.metadata,
  }));
}

/**
 * Get top debtors (largest piutang)
 */
export function getTopDebtors(debts: Debt[]): RankingItem[] {
  const piutangByPerson = debts
    .filter(d => d.type === 'piutang' && !d.isPaid)
    .reduce((acc, debt) => {
      const key = debt.name;
      if (!acc[key]) {
        acc[key] = { id: debt.id, name: debt.name, value: 0 };
      }
      acc[key].value += debt.amount;
      return acc;
    }, {} as Record<string, { id: string; name: string; value: number }>);

  return getTopRankings(Object.values(piutangByPerson));
}

/**
 * Get top liabilities (largest hutang)
 */
export function getTopLiabilities(debts: Debt[]): RankingItem[] {
  const hutangByPerson = debts
    .filter(d => d.type === 'hutang' && !d.isPaid)
    .reduce((acc, debt) => {
      const key = debt.name;
      if (!acc[key]) {
        acc[key] = { id: debt.id, name: debt.name, value: 0 };
      }
      acc[key].value += debt.amount;
      return acc;
    }, {} as Record<string, { id: string; name: string; value: number }>);

  return getTopRankings(Object.values(hutangByPerson));
}

/**
 * Get most frequent counterparties
 */
export function getFrequentCounterparties(debts: Debt[]): RankingItem[] {
  const frequencyMap = debts.reduce((acc, debt) => {
    const key = debt.name;
    if (!acc[key]) {
      acc[key] = { id: debt.id, name: debt.name, value: 0 };
    }
    acc[key].value += 1;
    return acc;
  }, {} as Record<string, { id: string; name: string; value: number }>);

  return getTopRankings(Object.values(frequencyMap));
}

/**
 * Get highest risk debtors
 */
export function getHighestRiskDebtors(debts: Debt[]): RankingItem[] {
  const unpaidDebts = debts.filter(d => !d.isPaid && d.type === 'piutang');
  
  const riskByPerson = unpaidDebts.reduce((acc, debt) => {
    const age = analyzeDebtAge(debt);
    const riskValue = age.riskLevel === 'low' ? 1 : age.riskLevel === 'medium' ? 2 : age.riskLevel === 'high' ? 3 : 4;
    
    const key = debt.name;
    if (!acc[key]) {
      acc[key] = { id: debt.id, name: debt.name, value: 0, count: 0 };
    }
    acc[key].value += riskValue;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { id: string; name: string; value: number; count: number }>);

  // Calculate average risk per person
  const avgRiskItems = Object.values(riskByPerson).map(item => ({
    id: item.id,
    name: item.name,
    value: item.value / item.count,
    metadata: { count: item.count },
  }));

  return getTopRankings(avgRiskItems);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format currency to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get risk badge text
 */
export function getRiskBadgeText(riskLevel: AgeAnalysis['riskLevel']): string {
  const badgeMap: Record<AgeAnalysis['riskLevel'], string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    critical: 'Kritis',
  };
  return badgeMap[riskLevel];
}

/**
 * Get age category text in Indonesian
 */
export function getAgeCategoryText(category: AgeAnalysis['ageCategory']): string {
  const textMap: Record<AgeAnalysis['ageCategory'], string> = {
    current: 'Lancar',
    watch: 'Perhatian',
    alert: 'Waspada',
    critical: 'Kritis',
  };
  return textMap[category];
}

// ============================================
// PHASE 2: RISK ASSESSMENT
// ============================================

// ============================================
// TASK 2.1: RISK SCORING ALGORITHM
// ============================================

/**
 * Calculate comprehensive risk score for a debt
 * Score: 0-100 (0 = lowest risk, 100 = highest risk)
 * 
 * Weights:
 * - Payment history (40%): Based on historical on-time payment ratio
 * - Days outstanding (30%): Normalized by 90 days benchmark
 * - Amount concentration (15%): Percentage of total portfolio
 * - Relationship duration (10%): Newer = higher risk
 * - Transaction frequency (5%): Irregular = higher risk
 */
export function calculateRiskScore(debt: Debt, allDebts: Debt[]): RiskScore {
  const WEIGHT_PAYMENT_HISTORY = 0.40;
  const WEIGHT_DAYS_OUTSTANDING = 0.30;
  const WEIGHT_CONCENTRATION = 0.15;
  const WEIGHT_RELATIONSHIP = 0.10;
  const WEIGHT_FREQUENCY = 0.05;

  // 1. Payment History Score (0-100, higher = more risk)
  const counterpartyDebts = allDebts.filter(d => d.name === debt.name);
  const totalDebts = counterpartyDebts.length;
  const paidDebts = counterpartyDebts.filter(d => d.isPaid).length;
  const onTimeRatio = totalDebts > 0 ? paidDebts / totalDebts : 0;
  const paymentHistoryScore = (1 - onTimeRatio) * 100; // Invert: more paid = less risk

  // 2. Days Outstanding Score (0-100)
  const daysOut = calculateDaysOutstanding(debt.date);
  const daysScore = Math.min((daysOut / 90) * 100, 100); // 90 days = 100% risk

  // 3. Concentration Score (0-100)
  const totalPortfolio = allDebts
    .filter(d => !d.isPaid && d.type === 'piutang')
    .reduce((sum, d) => sum + d.amount, 0);
  const concentration = totalPortfolio > 0 ? (debt.amount / totalPortfolio) * 100 : 0;
  const concentrationScore = Math.min(concentration * 2, 100); // 50% concentration = 100% risk

  // 4. Relationship Duration Score (0-100, newer = higher risk)
  const daysSinceFirst = counterpartyDebts.length > 0
    ? Math.max(...counterpartyDebts.map(d => calculateDaysOutstanding(d.date)))
    : calculateDaysOutstanding(debt.date);
  const relationshipScore = Math.max(100 - (daysSinceFirst / 365) * 100, 0); // 1 year = 0 risk

  // 5. Transaction Frequency Score (0-100)
  const avgDaysBetween = totalDebts > 1
    ? daysSinceFirst / totalDebts
    : daysSinceFirst;
  const frequencyScore = Math.min((avgDaysBetween / 90) * 100, 100); // Irregular = high risk

  // Calculate weighted total score
  const totalScore =
    paymentHistoryScore * WEIGHT_PAYMENT_HISTORY +
    daysScore * WEIGHT_DAYS_OUTSTANDING +
    concentrationScore * WEIGHT_CONCENTRATION +
    relationshipScore * WEIGHT_RELATIONSHIP +
    frequencyScore * WEIGHT_FREQUENCY;

  // Determine grade
  let grade: string;
  if (totalScore <= 20) grade = 'A';
  else if (totalScore <= 40) grade = 'B';
  else if (totalScore <= 60) grade = 'C';
  else if (totalScore <= 80) grade = 'D';
  else grade = 'F';

  // Determine risk level
  let riskLevel: RiskScore['riskLevel'];
  if (totalScore <= 25) riskLevel = 'low';
  else if (totalScore <= 50) riskLevel = 'medium';
  else if (totalScore <= 75) riskLevel = 'high';
  else riskLevel = 'critical';

  // Determine trend (simplified)
  const recentDebts = counterpartyDebts.filter(d => 
    calculateDaysOutstanding(d.date) <= 30
  );
  const recentPaidRatio = recentDebts.length > 0
    ? recentDebts.filter(d => d.isPaid).length / recentDebts.length
    : onTimeRatio;
  
  let trend: RiskScore['trend'];
  if (recentPaidRatio > onTimeRatio + 0.1) trend = 'improving';
  else if (recentPaidRatio < onTimeRatio - 0.1) trend = 'declining';
  else trend = 'stable';

  return {
    score: Math.round(totalScore),
    grade,
    riskLevel,
    factors: {
      paymentHistory: Math.round(paymentHistoryScore),
      daysOutstanding: Math.round(daysScore),
      concentration: Math.round(concentrationScore),
      relationshipDuration: Math.round(relationshipScore),
      frequency: Math.round(frequencyScore),
    },
    trend,
  };
}

// ============================================
// TASK 2.2: CONCENTRATION RISK ANALYSIS
// ============================================

/**
 * Analyze portfolio concentration risk
 */
export function analyzeConcentrationRisk(debts: Debt[]): ConcentrationRisk {
  const piutangDebts = debts.filter(d => d.type === 'piutang' && !d.isPaid);
  
  if (piutangDebts.length === 0) {
    return {
      isHighConcentration: false,
      topConcentration: 0,
      topDebtors: [],
      recommendation: 'Tidak ada piutang aktif',
      riskLevel: 'low',
    };
  }

  const totalAmount = piutangDebts.reduce((sum, d) => sum + d.amount, 0);

  // Group by debtor
  const debtorMap = piutangDebts.reduce((acc, debt) => {
    if (!acc[debt.name]) {
      acc[debt.name] = 0;
    }
    acc[debt.name] += debt.amount;
    return acc;
  }, {} as Record<string, number>);

  // Sort by amount
  const topDebtors = Object.entries(debtorMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / totalAmount) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topConcentration = topDebtors[0]?.percentage || 0;
  const top3Concentration = topDebtors.slice(0, 3).reduce((sum, d) => sum + d.percentage, 0);

  // Determine risk level
  let isHighConcentration = false;
  let riskLevel: ConcentrationRisk['riskLevel'] = 'low';
  let recommendation = '';

  if (topConcentration > 50) {
    isHighConcentration = true;
    riskLevel = 'critical';
    recommendation = `⚠️ KRITIS: Satu debitor (${topDebtors[0].name}) mewakili ${topConcentration.toFixed(1)}% dari total piutang. Sangat disarankan untuk diversifikasi portofolio.`;
  } else if (topConcentration > 30) {
    isHighConcentration = true;
    riskLevel = 'high';
    recommendation = `⚠️ TINGGI: Konsentrasi pada ${topDebtors[0].name} (${topConcentration.toFixed(1)}%) cukup tinggi. Pertimbangkan untuk membatasi exposure.`;
  } else if (top3Concentration > 60) {
    isHighConcentration = true;
    riskLevel = 'medium';
    recommendation = `⚠️ SEDANG: Top 3 debitor mewakili ${top3Concentration.toFixed(1)}% dari portofolio. Monitor closely.`;
  } else {
    recommendation = `✓ Portofolio terdiversifikasi dengan baik. Konsentrasi tertinggi hanya ${topConcentration.toFixed(1)}%.`;
  }

  return {
    isHighConcentration,
    topConcentration,
    topDebtors,
    recommendation,
    riskLevel,
  };
}

// ============================================
// TASK 2.3: PAYMENT COMPLIANCE TRACKING
// ============================================

/**
 * Calculate payment compliance for each counterparty
 */
export function calculatePaymentCompliance(debts: Debt[]): PaymentHistory[] {
  const counterpartyMap = new Map<string, Debt[]>();

  // Group debts by counterparty
  debts.forEach(debt => {
    const key = debt.name;
    if (!counterpartyMap.has(key)) {
      counterpartyMap.set(key, []);
    }
    counterpartyMap.get(key)!.push(debt);
  });

  const paymentHistories: PaymentHistory[] = [];

  counterpartyMap.forEach((counterpartyDebts, name) => {
    const totalTransactions = counterpartyDebts.length;
    const onTimePayments = counterpartyDebts.filter(d => {
      if (!d.isPaid) return false;
      const daysOut = calculateDaysOutstanding(d.date);
      return daysOut <= 30; // Consider on-time if paid within 30 days
    }).length;
    const latePayments = counterpartyDebts.filter(d => d.isPaid).length - onTimePayments;

    // Calculate average delay for late payments
    const lateDebts = counterpartyDebts.filter(d => {
      if (!d.isPaid) return false;
      const daysOut = calculateDaysOutstanding(d.date);
      return daysOut > 30;
    });
    const averageDelayDays = lateDebts.length > 0
      ? lateDebts.reduce((sum, d) => sum + calculateDaysOutstanding(d.date), 0) / lateDebts.length
      : 0;

    // Compliance score (0-100)
    const complianceScore = totalTransactions > 0
      ? (onTimePayments / totalTransactions) * 100
      : 0;

    // Determine trend
    const recentDebts = counterpartyDebts.filter(d => 
      calculateDaysOutstanding(d.date) <= 60
    );
    const recentCompliance = recentDebts.length > 0
      ? (recentDebts.filter(d => d.isPaid && calculateDaysOutstanding(d.date) <= 30).length / recentDebts.length) * 100
      : complianceScore;

    let trend: PaymentHistory['trend'];
    if (recentCompliance > complianceScore + 10) trend = 'improving';
    else if (recentCompliance < complianceScore - 10) trend = 'declining';
    else trend = 'stable';

    paymentHistories.push({
      counterpartyId: counterpartyDebts[0].id, // Use first debt ID as reference
      counterpartyName: name,
      totalTransactions,
      onTimePayments,
      latePayments,
      averageDelayDays: Math.round(averageDelayDays),
      complianceScore: Math.round(complianceScore),
      trend,
    });
  });

  return paymentHistories.sort((a, b) => a.complianceScore - b.complianceScore); // Lowest compliance first
}

// ============================================
// TASK 2.4: RISK ALERT SYSTEM
// ============================================

/**
 * Generate risk alerts based on current portfolio state
 */
export function generateRiskAlerts(debts: Debt[]): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const now = new Date();

  // Check for critical overdue debts (90+ days)
  const criticalOverdue = debts.filter(d => {
    if (d.isPaid || d.status !== 'confirmed') return false;
    const daysOut = calculateDaysOutstanding(d.date);
    return daysOut >= 90;
  });

  criticalOverdue.forEach(debt => {
    alerts.push({
      id: `overdue-critical-${debt.id}`,
      type: 'overdue',
      severity: 'critical',
      title: `Tunggakan Kritis: ${debt.name}`,
      description: `Hutang sebesar ${formatCurrency(debt.amount)} sudah ${calculateDaysOutstanding(debt.date)} hari. Tindakan segera diperlukan.`,
      affectedDebtId: debt.id,
      actionRequired: 'Hubungi debitor segera atau pertimbangkan write-off',
      createdAt: now,
    });
  });

  // Check for high-risk large amounts (60+ days)
  const highRiskDebts = debts.filter(d => {
    if (d.isPaid || d.status !== 'confirmed') return false;
    const daysOut = calculateDaysOutstanding(d.date);
    return daysOut >= 60 && d.amount >= 500000; // 60+ days and >= Rp 500K
  });

  highRiskDebts.forEach(debt => {
    alerts.push({
      id: `high-risk-${debt.id}`,
      type: 'overdue',
      severity: 'high',
      title: `Risiko Tinggi: ${debt.name}`,
      description: `Amount besar (${formatCurrency(debt.amount)}) dengan ${calculateDaysOutstanding(debt.date)} hari outstanding.`,
      affectedDebtId: debt.id,
      actionRequired: 'Follow up intensif diperlukan',
      createdAt: now,
    });
  });

  // Check concentration risk
  const concentration = analyzeConcentrationRisk(debts);
  if (concentration.isHighConcentration && concentration.riskLevel !== 'low') {
    alerts.push({
      id: 'concentration-risk',
      type: 'concentration',
      severity: concentration.riskLevel,
      title: 'Risiko Konsentrasi Terdeteksi',
      description: concentration.recommendation,
      actionRequired: 'Diversifikasi portofolio atau batasi exposure',
      createdAt: now,
    });
  }

  // Check for declining payment patterns
  const paymentHistories = calculatePaymentCompliance(debts);
  const decliningPayers = paymentHistories.filter(ph => 
    ph.trend === 'declining' && ph.complianceScore < 50
  );

  decliningPayers.slice(0, 3).forEach(payer => {
    alerts.push({
      id: `payment-pattern-${payer.counterpartyId}`,
      type: 'payment_pattern',
      severity: 'medium',
      title: `Pola Pembayaran Menurun: ${payer.counterpartyName}`,
      description: `Compliance score: ${payer.complianceScore}%. Tren menurun terdeteksi.`,
      actionRequired: 'Monitor closely dan pertimbangkan untuk mengurangi exposure',
      createdAt: now,
    });
  });

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
