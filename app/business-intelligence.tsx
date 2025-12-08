// Business Intelligence Dashboard
// Phase 1: Foundational Analytics Implementation

import { Font } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { Debt, StaticDB } from '@/data/staticDatabase';
import {
  analyzeConcentrationRisk,
  analyzeDebtAge,
  calculatePaymentCompliance,
  calculateRiskScore,
  calculateTrend,
  detectOverdueDebts,
  formatCurrency,
  formatPercentage,
  generateMonthlySnapshot,
  generateRiskAlerts,
  getFrequentCounterparties,
  getHighestRiskDebtors,
  getTopDebtors,
  getTopLiabilities,
  OverdueDebt,
  RankingItem,
  TrendData
} from '@/utils/analyticsHelpers';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function BusinessIntelligenceScreen() {
  const { user } = useAuth();
  const { debts, refreshDebts } = useDebt();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      refreshDebts();
    }
  }, [user]);

  // ============================================
  // COMBINE PERSONAL + GROUP DEBTS
  // ============================================
  
  const allDebts = useMemo(() => {
    if (!user) return [];
    
    // Get personal debts
    const personalDebts = debts;
    
    // Get group debts: Convert GroupTransactions to Debt format
    const userGroups = StaticDB.getUserGroups(user.id);
    const groupDebts: Debt[] = [];
    
    userGroups.forEach(group => {
      const transactions = StaticDB.getGroupTransactions(group.id);
      
      transactions.forEach(transaction => {
        // Only include transactions involving current user
        if (transaction.fromUserId === user.id) {
          // User owes money (hutang)
          const toUser = StaticDB.getUserById(transaction.toUserId);
          groupDebts.push({
            id: `group-${transaction.id}`,
            userId: user.id,
            name: toUser?.name || 'Unknown',
            amount: transaction.amount,
            description: `${transaction.description} (Group: ${group.name})`,
            date: transaction.date,
            type: 'hutang',
            status: 'confirmed',
            isPaid: transaction.isPaid,
            initiatedBy: transaction.createdBy,
            groupId: group.id,
          });
        } else if (transaction.toUserId === user.id) {
          // User is owed money (piutang)
          const fromUser = StaticDB.getUserById(transaction.fromUserId);
          groupDebts.push({
            id: `group-${transaction.id}`,
            userId: user.id,
            name: fromUser?.name || 'Unknown',
            amount: transaction.amount,
            description: `${transaction.description} (Group: ${group.name})`,
            date: transaction.date,
            type: 'piutang',
            status: 'confirmed',
            isPaid: transaction.isPaid,
            initiatedBy: transaction.createdBy,
            groupId: group.id,
          });
        }
      });
    });
    
    return [...personalDebts, ...groupDebts];
  }, [debts, user]);

  // ============================================
  // ANALYTICS CALCULATIONS (with useMemo for performance)
  // ============================================

  const analytics = useMemo(() => {
    if (!user || allDebts.length === 0) {
      return null;
    }

    // Current month snapshot
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const currentSnapshot = generateMonthlySnapshot(allDebts, currentMonth, currentYear);
    
    // Previous month snapshot for comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousSnapshot = generateMonthlySnapshot(allDebts, prevMonth, prevYear);

    // Calculate trends
    const piutangTrend = calculateTrend(
      currentSnapshot.totalPiutang,
      previousSnapshot.totalPiutang,
      true // Piutang increasing is good
    );

    const hutangTrend = calculateTrend(
      currentSnapshot.totalHutang,
      previousSnapshot.totalHutang,
      false // Hutang increasing is bad
    );

    const balanceTrend = calculateTrend(
      currentSnapshot.netBalance,
      previousSnapshot.netBalance,
      true
    );

    // Overdue detection
    const overdueDebts = detectOverdueDebts(allDebts);

    // Aging analysis for all unpaid debts
    const unpaidDebts = allDebts.filter(d => !d.isPaid && d.status === 'confirmed');
    const agingData = unpaidDebts.map(debt => ({
      debt,
      aging: analyzeDebtAge(debt),
    }));

    // Count by age category
    const agingCounts = {
      current: agingData.filter(d => d.aging.ageCategory === 'current').length,
      watch: agingData.filter(d => d.aging.ageCategory === 'watch').length,
      alert: agingData.filter(d => d.aging.ageCategory === 'alert').length,
      critical: agingData.filter(d => d.aging.ageCategory === 'critical').length,
    };

    // Rankings
    const topDebtors = getTopDebtors(allDebts);
    const topLiabilities = getTopLiabilities(allDebts);
    const frequentCounterparties = getFrequentCounterparties(allDebts);
    const highestRiskDebtors = getHighestRiskDebtors(allDebts);

    // ============================================
    // PHASE 2: RISK ASSESSMENT ANALYTICS
    // ============================================

    // Calculate risk scores for unpaid debts
    const unpaidPiutang = allDebts.filter(d => !d.isPaid && d.status === 'confirmed' && d.type === 'piutang');
    const debtRiskScores = unpaidPiutang.map(debt => ({
      debt,
      riskScore: calculateRiskScore(debt, allDebts),
    })).sort((a, b) => b.riskScore.score - a.riskScore.score).slice(0, 5); // Top 5 highest risk

    // Concentration risk analysis
    const concentrationRisk = analyzeConcentrationRisk(allDebts);

    // Payment compliance tracking
    const paymentCompliance = calculatePaymentCompliance(allDebts).slice(0, 5); // Bottom 5 performers

    // Risk alerts generation
    const riskAlerts = generateRiskAlerts(allDebts);

    return {
      currentSnapshot,
      previousSnapshot,
      piutangTrend,
      hutangTrend,
      balanceTrend,
      overdueDebts,
      agingData,
      agingCounts,
      topDebtors,
      topLiabilities,
      frequentCounterparties,
      highestRiskDebtors,
      // Phase 2 analytics
      debtRiskScores,
      concentrationRisk,
      paymentCompliance,
      riskAlerts,
    };
  }, [allDebts, user]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDebts();
    setIsRefreshing(false);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderTrendIndicator = (trend: TrendData) => {
    if (trend.direction === 'stable') {
      return (
        <View style={styles.trendBadge}>
          <Text style={styles.trendText}>→ Stabil</Text>
        </View>
      );
    }

    const icon = trend.direction === 'increasing' ? '↑' : '↓';
    const color = trend.isPositive ? '#10b981' : '#ef4444';

    return (
      <View style={[styles.trendBadge, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.trendText, { color }]}>
          {icon} {formatPercentage(Math.abs(trend.changePercentage))}
        </Text>
      </View>
    );
  };

  const renderRankingCard = (title: string, items: RankingItem[], icon: string) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {items.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{item.rank}</Text>
              </View>
              <View style={styles.rankingInfo}>
                <Text style={styles.rankingName}>{item.name}</Text>
                <Text style={styles.rankingPercentage}>
                  {formatPercentage(item.percentage, 0)} dari total
                </Text>
              </View>
            </View>
            <Text style={styles.rankingValue}>{formatCurrency(item.value)}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path stroke="#ffffff" strokeWidth="2" d="m15 6-6 6 6 6" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Intelligence</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Silakan login terlebih dahulu</Text>
        </View>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path stroke="#ffffff" strokeWidth="2" d="m15 6-6 6 6 6" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Intelligence</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Belum ada data untuk dianalisis</Text>
          <Text style={styles.emptySubtext}>Mulai tambahkan transaksi hutang piutang</Text>
        </View>
      </View>
    );
  }

  const { 
    currentSnapshot, 
    piutangTrend, 
    hutangTrend, 
    balanceTrend, 
    overdueDebts, 
    agingCounts, 
    topDebtors, 
    topLiabilities, 
    frequentCounterparties, 
    highestRiskDebtors,
    debtRiskScores,
    concentrationRisk,
    paymentCompliance,
    riskAlerts,
  } = analytics;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path stroke="#ffffff" strokeWidth="2" d="m15 6-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Intelligence</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Ringkasan Keuangan</Text>
          
          {/* Net Balance Card */}
          <View style={[styles.card, styles.balanceCard]}>
            <Text style={styles.balanceLabel}>Saldo Bersih</Text>
            <Text style={[styles.balanceAmount, currentSnapshot.netBalance >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
              {formatCurrency(currentSnapshot.netBalance)}
            </Text>
            {renderTrendIndicator(balanceTrend)}
          </View>

          {/* Piutang & Hutang Cards */}
          <View style={styles.row}>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.metricLabel}>Piutang</Text>
              <Text style={[styles.metricValue, styles.positiveText]}>
                {formatCurrency(currentSnapshot.totalPiutang)}
              </Text>
              {renderTrendIndicator(piutangTrend)}
            </View>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.metricLabel}>Hutang</Text>
              <Text style={[styles.metricValue, styles.negativeText]}>
                {formatCurrency(currentSnapshot.totalHutang)}
              </Text>
              {renderTrendIndicator(hutangTrend)}
            </View>
          </View>
        </View>

        {/* Overdue Alerts */}
        {overdueDebts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.alertHeader}>
              <Text style={styles.sectionTitle}>⚠️ Tunggakan</Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{overdueDebts.length}</Text>
              </View>
            </View>
            
            {overdueDebts.slice(0, 5).map((overdue: OverdueDebt) => (
              <View key={overdue.debtId} style={styles.overdueCard}>
                <View style={styles.overdueHeader}>
                  <Text style={styles.overdueName}>{overdue.debt.name}</Text>
                  <View style={[styles.urgencyBadge, styles[`urgency_${overdue.urgencyLevel}`]]}>
                    <Text style={styles.urgencyText}>
                      {overdue.urgencyLevel === 'critical' ? 'Kritis' : 
                       overdue.urgencyLevel === 'high' ? 'Tinggi' :
                       overdue.urgencyLevel === 'medium' ? 'Sedang' : 'Rendah'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.overdueAmount}>{formatCurrency(overdue.debt.amount)}</Text>
                <View style={styles.overdueFooter}>
                  <Text style={styles.overdueInfo}>
                    Terlambat {overdue.daysOverdue} hari
                  </Text>
                  <Text style={styles.overduePriority}>
                    Prioritas: {overdue.priorityScore.toFixed(0)}
                  </Text>
                </View>
              </View>
            ))}

            {overdueDebts.length > 5 && (
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>Lihat {overdueDebts.length - 5} lagi →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Aging Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Analisis Umur Hutang</Text>
          <View style={styles.card}>
            <View style={styles.agingRow}>
              <View style={[styles.agingItem, styles.agingCurrent]}>
                <Text style={styles.agingLabel}>Lancar</Text>
                <Text style={styles.agingCount}>{agingCounts.current}</Text>
                <Text style={styles.agingSubtext}>0-30 hari</Text>
              </View>
              <View style={[styles.agingItem, styles.agingWatch]}>
                <Text style={styles.agingLabel}>Perhatian</Text>
                <Text style={styles.agingCount}>{agingCounts.watch}</Text>
                <Text style={styles.agingSubtext}>31-60 hari</Text>
              </View>
              <View style={[styles.agingItem, styles.agingAlert]}>
                <Text style={styles.agingLabel}>Waspada</Text>
                <Text style={styles.agingCount}>{agingCounts.alert}</Text>
                <Text style={styles.agingSubtext}>61-90 hari</Text>
              </View>
              <View style={[styles.agingItem, styles.agingCritical]}>
                <Text style={styles.agingLabel}>Kritis</Text>
                <Text style={styles.agingCount}>{agingCounts.critical}</Text>
                <Text style={styles.agingSubtext}>90+ hari</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rankings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Peringkat</Text>
          {renderRankingCard('Top Piutang Terbesar', topDebtors, '💰')}
          {renderRankingCard('Top Hutang Terbesar', topLiabilities, '💸')}
          {renderRankingCard('Mitra Transaksi Tersering', frequentCounterparties, '🤝')}
          {renderRankingCard('Risiko Tertinggi', highestRiskDebtors, '⚡')}
        </View>

        {/* Phase 2: Risk Alerts */}
        {riskAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.alertHeader}>
              <Text style={styles.sectionTitle}>🚨 Risk Alerts</Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{riskAlerts.length}</Text>
              </View>
            </View>
            {riskAlerts.slice(0, 5).map((alert) => (
              <View key={alert.id} style={[styles.riskAlertCard, 
                alert.severity === 'critical' ? styles.alertSeverity_critical :
                alert.severity === 'high' ? styles.alertSeverity_high :
                alert.severity === 'medium' ? styles.alertSeverity_medium : styles.alertSeverity_low]}>
                <View style={styles.riskAlertHeader}>
                  <Text style={styles.riskAlertTitle}>{alert.title}</Text>
                  <View style={[styles.severityBadge,
                    alert.severity === 'critical' ? styles.severity_critical :
                    alert.severity === 'high' ? styles.severity_high :
                    alert.severity === 'medium' ? styles.severity_medium : styles.severity_low]}>
                    <Text style={styles.severityText}>
                      {alert.severity === 'critical' ? 'KRITIS' : 
                       alert.severity === 'high' ? 'TINGGI' :
                       alert.severity === 'medium' ? 'SEDANG' : 'RENDAH'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.riskAlertDescription}>{alert.description}</Text>
                <Text style={styles.riskAlertAction}>💡 {alert.actionRequired}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Phase 2: Concentration Risk Warning */}
        {concentrationRisk.isHighConcentration && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Concentration Risk</Text>
            <View style={[styles.concentrationCard,
              concentrationRisk.riskLevel === 'critical' ? styles.concentration_critical :
              concentrationRisk.riskLevel === 'high' ? styles.concentration_high :
              concentrationRisk.riskLevel === 'medium' ? styles.concentration_medium : styles.concentration_low]}>
              <Text style={styles.concentrationTitle}>
                Top Concentration: {formatPercentage(concentrationRisk.topConcentration)}
              </Text>
              <Text style={styles.concentrationRecommendation}>
                {concentrationRisk.recommendation}
              </Text>
              <View style={styles.concentrationDebtorsList}>
                {concentrationRisk.topDebtors.map((debtor, index) => (
                  <View key={index} style={styles.concentrationDebtorItem}>
                    <Text style={styles.concentrationDebtorName}>{debtor.name}</Text>
                    <Text style={styles.concentrationDebtorAmount}>
                      {formatCurrency(debtor.amount)} ({formatPercentage(debtor.percentage)})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Phase 2: Risk Assessment Scores */}
        {debtRiskScores.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Risk Assessment</Text>
            {debtRiskScores.map(({ debt, riskScore }) => (
              <View key={debt.id} style={styles.riskScoreCard}>
                <View style={styles.riskScoreHeader}>
                  <View style={styles.riskScoreNameSection}>
                    <Text style={styles.riskScoreName}>{debt.name}</Text>
                    <Text style={styles.riskScoreAmount}>{formatCurrency(debt.amount)}</Text>
                  </View>
                  <View style={[styles.riskGradeBadge,
                    riskScore.grade === 'A' ? styles.grade_A :
                    riskScore.grade === 'B' ? styles.grade_B :
                    riskScore.grade === 'C' ? styles.grade_C :
                    riskScore.grade === 'D' ? styles.grade_D : styles.grade_F]}>
                    <Text style={styles.riskGradeText}>{riskScore.grade}</Text>
                  </View>
                </View>
                <View style={styles.riskScoreDetails}>
                  <View style={styles.riskScoreMetric}>
                    <Text style={styles.riskScoreLabel}>Score</Text>
                    <Text style={[styles.riskScoreValue, { color: riskScore.score > 75 ? '#ef4444' : riskScore.score > 50 ? '#f59e0b' : '#10b981' }]}>
                      {riskScore.score}/100
                    </Text>
                  </View>
                  <View style={styles.riskScoreMetric}>
                    <Text style={styles.riskScoreLabel}>Risk Level</Text>
                    <Text style={[styles.riskScoreValue, { color: riskScore.riskLevel === 'critical' ? '#ef4444' : riskScore.riskLevel === 'high' ? '#f59e0b' : '#10b981' }]}>
                      {riskScore.riskLevel === 'critical' ? 'Kritis' : 
                       riskScore.riskLevel === 'high' ? 'Tinggi' :
                       riskScore.riskLevel === 'medium' ? 'Sedang' : 'Rendah'}
                    </Text>
                  </View>
                  <View style={styles.riskScoreMetric}>
                    <Text style={styles.riskScoreLabel}>Trend</Text>
                    <Text style={styles.riskScoreValue}>
                      {riskScore.trend === 'improving' ? '↑ Membaik' : 
                       riskScore.trend === 'declining' ? '↓ Menurun' : '→ Stabil'}
                    </Text>
                  </View>
                </View>
                <View style={styles.riskFactorsSection}>
                  <Text style={styles.riskFactorsTitle}>Factor Breakdown:</Text>
                  <View style={styles.riskFactorsList}>
                    <View style={styles.riskFactorItem}>
                      <Text style={styles.riskFactorLabel}>Payment History</Text>
                      <Text style={styles.riskFactorValue}>{riskScore.factors.paymentHistory}</Text>
                    </View>
                    <View style={styles.riskFactorItem}>
                      <Text style={styles.riskFactorLabel}>Days Outstanding</Text>
                      <Text style={styles.riskFactorValue}>{riskScore.factors.daysOutstanding}</Text>
                    </View>
                    <View style={styles.riskFactorItem}>
                      <Text style={styles.riskFactorLabel}>Concentration</Text>
                      <Text style={styles.riskFactorValue}>{riskScore.factors.concentration}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Phase 2: Payment Compliance */}
        {paymentCompliance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Payment Compliance</Text>
            {paymentCompliance.map((compliance) => (
              <View key={compliance.counterpartyId} style={styles.complianceCard}>
                <View style={styles.complianceHeader}>
                  <Text style={styles.complianceName}>{compliance.counterpartyName}</Text>
                  <Text style={[styles.complianceScore, { 
                    color: compliance.complianceScore >= 70 ? '#10b981' : 
                           compliance.complianceScore >= 40 ? '#f59e0b' : '#ef4444' 
                  }]}>
                    {compliance.complianceScore}%
                  </Text>
                </View>
                <View style={styles.complianceStats}>
                  <View style={styles.complianceStat}>
                    <Text style={styles.complianceStatLabel}>✓ On-time</Text>
                    <Text style={styles.complianceStatValue}>
                      {compliance.onTimePayments}/{compliance.totalTransactions}
                    </Text>
                  </View>
                  <View style={styles.complianceStat}>
                    <Text style={styles.complianceStatLabel}>✗ Late</Text>
                    <Text style={styles.complianceStatValue}>
                      {compliance.latePayments} (avg {compliance.averageDelayDays}d)
                    </Text>
                  </View>
                  <View style={styles.complianceStat}>
                    <Text style={styles.complianceStatLabel}>Trend</Text>
                    <Text style={styles.complianceStatValue}>
                      {compliance.trend === 'improving' ? '↑ Membaik' : 
                       compliance.trend === 'declining' ? '↓ Menurun' : '→ Stabil'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Metrics Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Metrik Kinerja</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricRowLabel}>Total Transaksi</Text>
              <Text style={styles.metricRowValue}>{currentSnapshot.transactionCount}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricRowLabel}>Tingkat Penagihan</Text>
              <Text style={[styles.metricRowValue, styles.positiveText]}>
                {formatPercentage(currentSnapshot.collectionRate)}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricRowLabel}>Skor Risiko Rata-rata</Text>
              <Text style={[styles.metricRowValue, currentSnapshot.averageRiskScore > 50 ? styles.negativeText : styles.positiveText]}>
                {currentSnapshot.averageRiskScore.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1d4ed8',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: '#1f2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: Font.bold,
    marginBottom: 12,
  },
  positiveBalance: {
    color: '#10b981',
  },
  negativeBalance: {
    color: '#ef4444',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#6b7280',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: Font.bold,
    marginBottom: 8,
  },
  positiveText: {
    color: '#10b981',
  },
  negativeText: {
    color: '#ef4444',
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignSelf: 'center',
  },
  trendText: {
    fontSize: 12,
    fontFamily: Font.semiBold,
    color: '#6b7280',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  alertBadgeText: {
    fontSize: 12,
    fontFamily: Font.bold,
    color: '#ffffff',
  },
  overdueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  overdueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overdueName: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#1f2937',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgency_critical: {
    backgroundColor: '#fee2e2',
  },
  urgency_high: {
    backgroundColor: '#fed7aa',
  },
  urgency_medium: {
    backgroundColor: '#fef3c7',
  },
  urgency_low: {
    backgroundColor: '#dbeafe',
  },
  urgencyText: {
    fontSize: 11,
    fontFamily: Font.semiBold,
    color: '#1f2937',
  },
  overdueAmount: {
    fontSize: 20,
    fontFamily: Font.bold,
    color: '#ef4444',
    marginBottom: 8,
  },
  overdueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overdueInfo: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#6b7280',
  },
  overduePriority: {
    fontSize: 12,
    fontFamily: Font.semiBold,
    color: '#ef4444',
  },
  viewMoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#2563eb',
  },
  agingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  agingItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  agingCurrent: {
    backgroundColor: '#d1fae5',
  },
  agingWatch: {
    backgroundColor: '#fed7aa',
  },
  agingAlert: {
    backgroundColor: '#fecaca',
  },
  agingCritical: {
    backgroundColor: '#fca5a5',
  },
  agingLabel: {
    fontSize: 11,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    marginBottom: 4,
  },
  agingCount: {
    fontSize: 24,
    fontFamily: Font.bold,
    color: '#1f2937',
    marginBottom: 2,
  },
  agingSubtext: {
    fontSize: 10,
    fontFamily: Font.regular,
    color: '#6b7280',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#1f2937',
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontFamily: Font.bold,
    color: '#2563eb',
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    marginBottom: 2,
  },
  rankingPercentage: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#6b7280',
  },
  rankingValue: {
    fontSize: 14,
    fontFamily: Font.bold,
    color: '#2563eb',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  metricRowLabel: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
  },
  metricRowValue: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#1f2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // ============================================
  // PHASE 2: RISK ALERT STYLES
  // ============================================
  riskAlertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  alertSeverity_critical: {
    borderLeftColor: '#ef4444',
  },
  alertSeverity_high: {
    borderLeftColor: '#f97316',
  },
  alertSeverity_medium: {
    borderLeftColor: '#f59e0b',
  },
  alertSeverity_low: {
    borderLeftColor: '#10b981',
  },
  riskAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  riskAlertTitle: {
    fontSize: 15,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    flex: 1,
    marginRight: 10,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  severity_critical: {
    backgroundColor: '#fee2e2',
  },
  severity_high: {
    backgroundColor: '#fed7aa',
  },
  severity_medium: {
    backgroundColor: '#fef3c7',
  },
  severity_low: {
    backgroundColor: '#d1fae5',
  },
  severityText: {
    fontSize: 11,
    fontFamily: Font.bold,
    color: '#1f2937',
  },
  riskAlertDescription: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  riskAlertAction: {
    fontSize: 13,
    fontFamily: Font.semiBold,
    color: '#2563eb',
  },
  
  // ============================================
  // PHASE 2: CONCENTRATION RISK STYLES
  // ============================================
  concentrationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  concentration_critical: {
    borderLeftColor: '#ef4444',
  },
  concentration_high: {
    borderLeftColor: '#f97316',
  },
  concentration_medium: {
    borderLeftColor: '#f59e0b',
  },
  concentration_low: {
    borderLeftColor: '#10b981',
  },
  concentrationTitle: {
    fontSize: 16,
    fontFamily: Font.bold,
    color: '#1f2937',
    marginBottom: 10,
  },
  concentrationRecommendation: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  concentrationDebtorsList: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  concentrationDebtorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  concentrationDebtorName: {
    fontSize: 14,
    fontFamily: Font.semiBold,
    color: '#1f2937',
  },
  concentrationDebtorAmount: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#6b7280',
  },
  
  // ============================================
  // PHASE 2: RISK SCORE STYLES
  // ============================================
  riskScoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  riskScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskScoreNameSection: {
    flex: 1,
  },
  riskScoreName: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    marginBottom: 4,
  },
  riskScoreAmount: {
    fontSize: 14,
    fontFamily: Font.regular,
    color: '#6b7280',
  },
  riskGradeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grade_A: {
    backgroundColor: '#d1fae5',
  },
  grade_B: {
    backgroundColor: '#dbeafe',
  },
  grade_C: {
    backgroundColor: '#fef3c7',
  },
  grade_D: {
    backgroundColor: '#fed7aa',
  },
  grade_F: {
    backgroundColor: '#fee2e2',
  },
  riskGradeText: {
    fontSize: 20,
    fontFamily: Font.bold,
    color: '#1f2937',
  },
  riskScoreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  riskScoreMetric: {
    alignItems: 'center',
  },
  riskScoreLabel: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: '#6b7280',
    marginBottom: 4,
  },
  riskScoreValue: {
    fontSize: 14,
    fontFamily: Font.bold,
  },
  riskFactorsSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  riskFactorsTitle: {
    fontSize: 13,
    fontFamily: Font.semiBold,
    color: '#6b7280',
    marginBottom: 8,
  },
  riskFactorsList: {
    gap: 6,
  },
  riskFactorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskFactorLabel: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: '#6b7280',
  },
  riskFactorValue: {
    fontSize: 13,
    fontFamily: Font.semiBold,
    color: '#1f2937',
  },
  
  // ============================================
  // PHASE 2: PAYMENT COMPLIANCE STYLES
  // ============================================
  complianceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  complianceName: {
    fontSize: 16,
    fontFamily: Font.semiBold,
    color: '#1f2937',
    flex: 1,
  },
  complianceScore: {
    fontSize: 24,
    fontFamily: Font.bold,
  },
  complianceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  complianceStat: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
  },
  complianceStatLabel: {
    fontSize: 11,
    fontFamily: Font.regular,
    color: '#6b7280',
    marginBottom: 4,
  },
  complianceStatValue: {
    fontSize: 12,
    fontFamily: Font.semiBold,
    color: '#1f2937',
  },
});
