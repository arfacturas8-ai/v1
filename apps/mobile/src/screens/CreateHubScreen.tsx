import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import {
  FileText,
  Users,
  Image as ImageIcon,
  Folder,
  Video,
  Mic,
} from 'lucide-react-native';

interface CreateOption {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  isLive: boolean;
}

export default function CreateHubScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const createOptions: CreateOption[] = [
    {
      title: 'New Post',
      description: 'Share updates with your followers',
      icon: <FileText size={32} color={colors.primary} />,
      route: 'CreatePost',
      isLive: true,
    },
    {
      title: 'Start Community',
      description: 'Build a space for your audience',
      icon: <Users size={32} color={colors.primary} />,
      route: 'CreateCommunity',
      isLive: true,
    },
    {
      title: 'Create NFT',
      description: 'Mint your creation on the blockchain',
      icon: <ImageIcon size={32} color={colors.primary} />,
      route: 'NFTMint',
      isLive: false,
    },
    {
      title: 'Create Collection',
      description: 'Launch an NFT collection',
      icon: <Folder size={32} color={colors.primary} />,
      route: 'NFTCollection',
      isLive: false,
    },
    {
      title: 'Go Live',
      description: 'Start a live video stream',
      icon: <Video size={32} color={colors.primary} />,
      route: 'GoLive',
      isLive: false,
    },
    {
      title: 'Create Space',
      description: 'Host an audio conversation',
      icon: <Mic size={32} color={colors.primary} />,
      route: 'CreateSpace',
      isLive: false,
    },
  ];

  const handleOptionPress = (option: CreateOption) => {
    if (option.isLive) {
      navigation.navigate(option.route);
    } else {
      navigation.navigate('ComingSoon', {
        feature: option.title,
        description: option.description,
        icon: option.icon,
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          What do you want to create?
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose from the options below
        </Text>
      </View>

      <View style={styles.grid}>
        {createOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleOptionPress(option)}
          >
            {!option.isLive && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>COMING SOON</Text>
              </View>
            )}

            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
              {option.icon}
            </View>

            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {option.title}
            </Text>

            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {option.description}
            </Text>

            {option.isLive && (
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.liveText, { color: colors.success }]}>
                  Available Now
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          More creation tools coming soon 🚀
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  grid: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
