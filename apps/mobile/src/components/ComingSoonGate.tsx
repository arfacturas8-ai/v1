import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ComingSoonGateProps {
  feature: string;
  description: string;
  icon?: React.ReactNode;
  notifyOption?: boolean;
  onBack?: () => void;
}

export const ComingSoonGate: React.FC<ComingSoonGateProps> = ({
  feature,
  description,
  icon,
  notifyOption = true,
  onBack,
}) => {
  const { colors } = useTheme();
  const [isNotified, setIsNotified] = useState(false);
  const [email, setEmail] = useState('');

  const handleNotify = async () => {
    try {
      const notificationsJson = await AsyncStorage.getItem('coming_soon_notifications');
      const notifications = notificationsJson ? JSON.parse(notificationsJson) : {};

      notifications[feature] = {
        email,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem('coming_soon_notifications', JSON.stringify(notifications));
      setIsNotified(true);
    } catch (error) {
      console.error('Failed to save notification preference:', error);
    }
  };

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.card}>
        {/* Icon */}
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: colors.cardBackground }]}>
            {icon}
          </View>
        )}

        {/* Coming Soon Badge */}
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.background }]}>
            COMING SOON
          </Text>
        </View>

        {/* Feature Name */}
        <Text style={[styles.title, { color: colors.text }]}>
          {feature}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        {/* Notify Me Section */}
        {notifyOption && !isNotified && (
          <View style={styles.notifySection}>
            <Text style={[styles.notifyLabel, { color: colors.textSecondary }]}>
              Want to be the first to know when this launches?
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: !email || !isValidEmail(email) ? 0.5 : 1,
                }
              ]}
              onPress={handleNotify}
              disabled={!email || !isValidEmail(email)}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Notify Me
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notified State */}
        {isNotified && (
          <View style={[styles.notifiedCard, {
            backgroundColor: '#00D26A20',
            borderColor: '#00D26A',
          }]}>
            <Text style={[styles.notifiedTitle, { color: '#00D26A' }]}>
              ✓ You're on the list!
            </Text>
            <Text style={[styles.notifiedText, { color: colors.textSecondary }]}>
              We'll notify you when {feature} launches.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {onBack && (
            <TouchableOpacity
              style={[styles.outlineButton, { borderColor: colors.border }]}
              onPress={onBack}
            >
              <Text style={[styles.outlineButtonText, { color: colors.text }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textTertiary }]}>
          Building the future of social Web3 🚀
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center',
    marginBottom: 24,
  },
  notifySection: {
    width: '100%',
    marginBottom: 24,
  },
  notifyLabel: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  notifiedCard: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  notifiedTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  notifiedText: {
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  outlineButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default ComingSoonGate;
