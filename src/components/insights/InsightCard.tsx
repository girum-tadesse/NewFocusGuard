import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InsightCard as InsightCardType } from '../../services/InsightsService';

interface InsightCardProps {
  insight: InsightCardType;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const router = useRouter();
  
  // Handle card action (navigation) if available
  const handleAction = () => {
    if (insight.actionRoute) {
      router.push(insight.actionRoute);
    }
  };
  
  // Render trend indicator if available
  const renderTrend = () => {
    if (!insight.trend) return null;
    
    const iconName = insight.trend === 'up' ? 'arrow-up' : insight.trend === 'down' ? 'arrow-down' : 'remove';
    const trendColor = insight.trend === 'up' ? '#F44336' : insight.trend === 'down' ? '#4CAF50' : '#607D8B';
    
    return (
      <View style={styles.trendContainer}>
        <Ionicons name={iconName} size={16} color={trendColor} />
        <Text style={[styles.trendValue, { color: trendColor }]}>
          {insight.trendValue}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={[styles.card, { borderLeftColor: insight.color || '#00C853' }]}>
      <View style={styles.header}>
        {insight.icon && (
          <View style={[styles.iconContainer, { backgroundColor: insight.color || '#00C853' }]}>
            <Ionicons name={insight.icon as any} size={20} color="#fff" />
          </View>
        )}
        <Text style={styles.title}>{insight.title}</Text>
      </View>
      
      <Text style={styles.description}>{insight.description}</Text>
      
      <View style={styles.valueContainer}>
        {insight.value && (
          <Text style={styles.value}>{insight.value}</Text>
        )}
        {renderTrend()}
        {insight.secondaryValue && (
          <Text style={styles.secondaryValue}>Total: {insight.secondaryValue}</Text>
        )}
      </View>
      
      {insight.actionText && (
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: insight.color || '#00C853' }]}
          onPress={handleAction}
        >
          <Text style={styles.actionText}>{insight.actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  secondaryValue: {
    fontSize: 14,
    color: '#666',
    marginLeft: 'auto',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default InsightCard; 