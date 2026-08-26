import { Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useDismissedInternships } from '@/hooks/use-dismissed-internships';
import { useTheme } from '@/hooks/use-theme';
import { fetchInternships, InternshipPosting } from '@/services/internships';
import { fetchHeadlines, Headline, NewsCategory } from '@/services/news';

const DISMISS_HIDE_DELAY_MS = 3000;

const NEWS_CATEGORIES: { key: NewsCategory; label: string }[] = [
  { key: 'breaking', label: 'Breaking News' },
  { key: 'stem', label: 'STEM' },
  { key: 'sports', label: 'Sports' },
  { key: 'medicine', label: 'Medicine' },
];

function formatPostedTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ForYouScreen() {
  const theme = useTheme();
  const [internships, setInternships] = useState<InternshipPosting[]>([]);
  const [isLoadingInternships, setIsLoadingInternships] = useState(true);
  const [internshipsError, setInternshipsError] = useState<string | null>(null);
  const { dismissedIds, dismiss } = useDismissedInternships();
  const [checkedInternshipIds, setCheckedInternshipIds] = useState<Set<string>>(new Set());
  const pendingDismissTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = pendingDismissTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleToggleInternship = useCallback(
    (id: string) => {
      setCheckedInternshipIds((prev) => {
        const next = new Set(prev);
        const pendingTimer = pendingDismissTimers.current.get(id);

        if (next.has(id)) {
          next.delete(id);
          if (pendingTimer) {
            clearTimeout(pendingTimer);
            pendingDismissTimers.current.delete(id);
          }
        } else {
          next.add(id);
          pendingDismissTimers.current.set(
            id,
            setTimeout(() => {
              dismiss(id);
              pendingDismissTimers.current.delete(id);
            }, DISMISS_HIDE_DELAY_MS)
          );
        }
        return next;
      });
    },
    [dismiss]
  );

  const visibleInternships = internships.filter((posting) => !dismissedIds.has(posting.id));

  const [headlinesByCategory, setHeadlinesByCategory] = useState<Record<NewsCategory, Headline[]>>(
    { breaking: [], stem: [], sports: [], medicine: [] }
  );
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  const loadInternships = useCallback(async () => {
    setIsLoadingInternships(true);
    setInternshipsError(null);
    try {
      const results = await fetchInternships();
      setInternships(results);
    } catch (err) {
      setInternshipsError(err instanceof Error ? err.message : 'Failed to load internships');
    } finally {
      setIsLoadingInternships(false);
    }
  }, []);

  const loadNews = useCallback(async () => {
    setIsLoadingNews(true);
    setNewsError(null);
    try {
      const results = await Promise.all(NEWS_CATEGORIES.map((cat) => fetchHeadlines(cat.key)));
      setHeadlinesByCategory({
        breaking: results[0],
        stem: results[1],
        sports: results[2],
        medicine: results[3],
      });
    } catch (err) {
      setNewsError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    loadInternships();
    loadNews();
  }, [loadInternships, loadNews]);

  const isRefreshing = isLoadingInternships || isLoadingNews;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          For You
        </ThemedText>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                loadInternships();
                loadNews();
              }}
              tintColor={theme.tint}
            />
          }>
          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Internship Postings
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionSubtitle}>
              Quant & software engineering internships
            </ThemedText>

            {isLoadingInternships && internships.length === 0 && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.tint} />
                <ThemedText themeColor="textSecondary">Loading internship listings…</ThemedText>
              </View>
            )}

            {internshipsError && (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText themeColor="textSecondary">{internshipsError}</ThemedText>
              </ThemedView>
            )}

            {!isLoadingInternships && !internshipsError && visibleInternships.length === 0 && (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText themeColor="textSecondary">
                  No open quant or software engineering internships right now.
                </ThemedText>
              </ThemedView>
            )}

            {visibleInternships.map((posting) => {
              const isChecked = checkedInternshipIds.has(posting.id);
              return (
                <ThemedView key={posting.id} type="backgroundElement" style={styles.itemCardRow}>
                  <ExternalLink href={posting.url as Href & string} asChild>
                    <Pressable style={styles.itemCardContent}>
                      <ThemedText type="smallBold">{posting.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {posting.company} · {posting.location}
                      </ThemedText>
                    </Pressable>
                  </ExternalLink>
                  <Pressable onPress={() => handleToggleInternship(posting.id)} hitSlop={8}>
                    <SymbolView
                      name={isChecked ? 'checkmark.circle.fill' : 'circle'}
                      tintColor={isChecked ? '#0A84FF' : theme.textSecondary}
                      size={28.8}
                    />
                  </Pressable>
                </ThemedView>
              );
            })}
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              News
            </ThemedText>

            {isLoadingNews && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.tint} />
                <ThemedText themeColor="textSecondary">Loading headlines…</ThemedText>
              </View>
            )}

            {newsError && (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText themeColor="textSecondary">{newsError}</ThemedText>
              </ThemedView>
            )}

            {!isLoadingNews &&
              !newsError &&
              NEWS_CATEGORIES.map((category) => (
                <View key={category.key} style={styles.newsCategory}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.newsCategoryLabel}>
                    {category.label.toUpperCase()}
                  </ThemedText>
                  {headlinesByCategory[category.key].map((headline) => (
                    <ExternalLink key={headline.id} href={headline.url as Href & string} asChild>
                      <ThemedView type="backgroundElement" style={styles.headlineCard}>
                        <ThemedText type="small">{headline.title}</ThemedText>
                        {!!headline.publishedAt && (
                          <ThemedText
                            type="small"
                            themeColor="textSecondary"
                            style={styles.headlineTime}>
                            {formatPostedTime(headline.publishedAt)}
                          </ThemedText>
                        )}
                      </ThemedView>
                    </ExternalLink>
                  ))}
                </View>
              ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Curriculum
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText themeColor="textSecondary">
                Nothing here yet — tell me what to add.
              </ThemedText>
            </ThemedView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.four,
  },
  title: {
    paddingHorizontal: Spacing.four,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.five,
  },
  section: {
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: 20,
  },
  sectionSubtitle: {
    marginTop: -Spacing.one,
  },
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  itemCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  itemCardContent: {
    flex: 1,
    gap: Spacing.half,
  },
  newsCategory: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  newsCategoryLabel: {
    letterSpacing: 0.5,
    paddingLeft: Spacing.one,
  },
  headlineCard: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  headlineTime: {
    fontSize: 12,
  },
});
