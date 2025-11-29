import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, scale } from '../utils/responsive';

interface FAQItem {
  question: string;
  answer: string;
}

export function HelpScreen() {
  const { colors } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'How do I create a community?',
      answer: 'Tap on the Communities tab, then tap the + button to create a new community. Fill in the details and tap Create.',
    },
    {
      question: 'How do I join a voice channel?',
      answer: 'Navigate to a server, find the voice channel you want to join, and tap on it. You\'ll be connected automatically.',
    },
    {
      question: 'Can I use CRYB on multiple devices?',
      answer: 'Yes! Your account syncs across all devices. Just log in with the same credentials.',
    },
  ];

  const contactOptions = [
    { icon: 'mail', label: 'Email Support', action: () => Linking.openURL('mailto:support@cryb.app') },
    { icon: 'message-circle', label: 'Live Chat', action: () => {} },
    { icon: 'book', label: 'Documentation', action: () => Linking.openURL('https://docs.cryb.app') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* FAQs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>

          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
              style={[styles.faqItem, { backgroundColor: colors.card }]}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.question, { color: colors.text }]}>
                  {faq.question}
                </Text>
                <Feather
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>

              {expandedIndex === index && (
                <Text style={[styles.answer, { color: colors.textSecondary }]}>
                  {faq.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contact Support
          </Text>

          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={option.action}
              style={[styles.contactOption, { backgroundColor: colors.card }]}
            >
              <Feather name={option.icon as any} size={20} color={colors.primary} />
              <Text style={[styles.contactLabel, { color: colors.text }]}>
                {option.label}
              </Text>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  faqItem: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: scale(12),
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    flex: 1,
    fontSize: typography.body1,
    fontWeight: '600',
  },
  answer: {
    marginTop: spacing.md,
    fontSize: typography.body2,
    lineHeight: typography.body2 * 1.5,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: scale(12),
  },
  contactLabel: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.body1,
  },
});
