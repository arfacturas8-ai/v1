import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type ReportType = 'post' | 'comment' | 'user' | 'message';

interface ReportReason {
  id: string;
  label: string;
  description: string;
}

const reportReasons: ReportReason[] = [
  {
    id: 'spam',
    label: 'Spam',
    description: 'Repetitive or irrelevant content',
  },
  {
    id: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Targeting individuals with harmful content',
  },
  {
    id: 'hate_speech',
    label: 'Hate Speech',
    description: 'Content that attacks people based on identity',
  },
  {
    id: 'violence',
    label: 'Violence or Threats',
    description: 'Content promoting or threatening violence',
  },
  {
    id: 'nudity',
    label: 'Nudity or Sexual Content',
    description: 'Inappropriate adult content',
  },
  {
    id: 'scam',
    label: 'Scam or Fraud',
    description: 'Attempting to deceive or steal from others',
  },
  {
    id: 'impersonation',
    label: 'Impersonation',
    description: 'Pretending to be someone else',
  },
  {
    id: 'intellectual_property',
    label: 'Intellectual Property Violation',
    description: 'Copyright or trademark infringement',
  },
  {
    id: 'misinformation',
    label: 'False Information',
    description: 'Spreading misleading or false content',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Something else not listed above',
  },
];

const ReportContentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { contentType, contentId, contentAuthor } = (route.params as any) || {};

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    try {
      setSubmitting(true);

      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // If user wants to block, do that too
      if (blockUser && contentAuthor) {
        // Block user API call
        console.log('Blocking user:', contentAuthor);
      }

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We\'ll review this report and take appropriate action.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getContentTypeLabel = (): string => {
    switch (contentType) {
      case 'post':
        return 'Post';
      case 'comment':
        return 'Comment';
      case 'user':
        return 'User';
      case 'message':
        return 'Message';
      default:
        return 'Content';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report {getContentTypeLabel()}</Text>
        <Text style={styles.subtitle}>
          Help us understand what's happening with this {contentType}
        </Text>
      </View>

      {/* Reasons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why are you reporting this?</Text>

        {reportReasons.map(reason => (
          <TouchableOpacity
            key={reason.id}
            style={[
              styles.reasonCard,
              selectedReason === reason.id && styles.reasonCardSelected,
            ]}
            onPress={() => setSelectedReason(reason.id)}
          >
            <View style={styles.reasonContent}>
              <Text
                style={[
                  styles.reasonLabel,
                  selectedReason === reason.id && styles.reasonLabelSelected,
                ]}
              >
                {reason.label}
              </Text>
              <Text style={styles.reasonDescription}>{reason.description}</Text>
            </View>

            {selectedReason === reason.id && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Additional Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Additional Information (Optional)
        </Text>
        <Text style={styles.sectionDescription}>
          Provide any additional context that might be helpful
        </Text>

        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Tell us more about why you're reporting this..."
          placeholderTextColor="#6B7280"
          value={additionalInfo}
          onChangeText={setAdditionalInfo}
          textAlignVertical="top"
        />
      </View>

      {/* Block User Option */}
      {contentAuthor && contentType !== 'user' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.blockOption}
            onPress={() => setBlockUser(!blockUser)}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, blockUser && styles.checkboxChecked]}>
                {blockUser && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <View style={styles.blockOptionText}>
                <Text style={styles.blockOptionLabel}>
                  Block @{contentAuthor}
                </Text>
                <Text style={styles.blockOptionDescription}>
                  They won't be able to interact with you
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedReason || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitReport}
          disabled={!selectedReason || submitting}
        >
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyNote}>
        <Text style={styles.privacyNoteTitle}>📋 Your Report is Confidential</Text>
        <Text style={styles.privacyNoteText}>
          Reports are anonymous. The person you're reporting won't see who reported them.
        </Text>
        <Text style={styles.privacyNoteText}>
          We review reports to ensure they follow our Community Guidelines and take appropriate action.
        </Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: typography.h4,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body1,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.body2,
    color: '#9CA3AF',
    marginBottom: spacing.md,
  },
  reasonCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#1E1B4B',
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  reasonLabelSelected: {
    color: '#C7D2FE',
  },
  reasonDescription: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: typography.body2,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#1F2937',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
    fontSize: typography.body1,
    color: '#FFFFFF',
    minHeight: 120,
  },
  blockOption: {
    backgroundColor: '#1F2937',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: typography.body2,
    fontWeight: '700',
  },
  blockOptionText: {
    flex: 1,
  },
  blockOptionLabel: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  blockOptionDescription: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  privacyNote: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#1F2937',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  privacyNoteTitle: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  privacyNoteText: {
    fontSize: typography.body2,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  bottomPadding: {
    height: 40,
  },
});

export default ReportContentScreen;
