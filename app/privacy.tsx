import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: March 2026</Text>

        <Section title="Overview">
          ILLIT World ("we", "the app", "the extension") is a fan-made game that rewards you with
          XP for watching ILLIT content on YouTube. This policy explains what data we collect, why
          we collect it, and how it is stored.
        </Section>

        <Section title="Data We Collect">
          <BulletItem label="Google account info">
            When you sign in with Google we receive your email address and a unique user ID from
            Google via Supabase Auth. We do not receive your password or any other Google account
            data.
          </BulletItem>
          <BulletItem label="Game progress">
            Your character levels, XP totals, watched-video history, favourite videos, selected
            photo cards, and background preference are stored in our Supabase database so your
            progress is saved across devices.
          </BulletItem>
          <BulletItem label="YouTube watch activity (extension only)">
            The browser extension detects when you are watching an approved ILLIT YouTube video and
            records that the video has been watched (video ID + timestamp). We do not record your
            full YouTube browsing history — only videos that match our approved list.
          </BulletItem>
        </Section>

        <Section title="How We Use Your Data">
          We use the data solely to operate the game: saving and syncing your progress, awarding
          XP, and displaying your characters' levels. We do not sell, share, or use your data for
          advertising or any commercial purpose.
        </Section>

        <Section title="Third-Party Services">
          <BulletItem label="Supabase">
            We use Supabase (supabase.com) to store user game data and to handle Google OAuth
            sign-in. Supabase processes data in accordance with their own Privacy Policy.
          </BulletItem>
          <BulletItem label="Google OAuth">
            Sign-in is handled through Google's OAuth 2.0 service. Google's Privacy Policy applies
            to the authentication step.
          </BulletItem>
          <BulletItem label="YouTube">
            The extension reads the URL of the YouTube page you are on to detect the video ID. No
            data is sent to YouTube on your behalf.
          </BulletItem>
        </Section>

        <Section title="Data Retention">
          Your game data is stored as long as your account exists. You can delete your data at any
          time by signing out and contacting us to request account deletion. We will remove all
          associated records within 30 days.
        </Section>

        <Section title="Children's Privacy">
          ILLIT World is not directed at children under 13. We do not knowingly collect personal
          information from children under 13. If you believe a child has provided us with personal
          data, please contact us and we will delete it.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time. The "Last updated" date at the top of this
          page will reflect any changes. Continued use of the app or extension after changes
          constitutes acceptance of the updated policy.
        </Section>

        <Section title="Contact">
          This is a fan-made project. If you have any questions or requests regarding your data,
          please open an issue on the project's GitHub repository or reach out through the ILLIT
          World web app.
        </Section>

        <Text style={styles.footer}>
          ILLIT World is an unofficial fan project and is not affiliated with ILLIT, BELIFT LAB,
          HYBE, or any of their subsidiaries.
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

function BulletItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletLabel}>• {label}:{' '}
        <Text style={styles.bulletBody}>{children}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a2e',
  },
  headerSpacer: {
    width: 36,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 16,
    includeFontPadding: false,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  updated: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B9D',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  bullet: {
    marginTop: 8,
  },
  bulletLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    fontWeight: '600',
  },
  bulletBody: {
    fontWeight: '400',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
