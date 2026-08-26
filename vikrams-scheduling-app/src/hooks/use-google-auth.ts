import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const REFRESH_TOKEN_STORAGE_KEY = 'schedule.googleRefreshToken';
const REFRESH_MARGIN_SECONDS = 300;

const discovery = {
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function useGoogleAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    scopes: SCOPES,
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  const scheduleRefresh = (refreshToken: string, expiresInSeconds: number) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const delayMs = Math.max((expiresInSeconds - REFRESH_MARGIN_SECONDS) * 1000, 10_000);
    refreshTimer.current = setTimeout(() => {
      performRefresh(refreshToken);
    }, delayMs);
  };

  const performRefresh = async (refreshToken: string) => {
    try {
      const result = await AuthSession.refreshAsync(
        { clientId: IOS_CLIENT_ID!, refreshToken },
        discovery
      );
      setAccessToken(result.accessToken);
      setError(null);
      const nextRefreshToken = result.refreshToken ?? refreshToken;
      await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nextRefreshToken);
      if (result.expiresIn) {
        scheduleRefresh(nextRefreshToken, result.expiresIn);
      }
    } catch {
      setError('Session expired — reconnect Google Calendar');
      setAccessToken(null);
      await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY).then(async (stored) => {
      if (stored) {
        await performRefresh(stored);
      }
      setIsRestoringSession(false);
    });
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const auth = response.authentication;
      const token = auth?.accessToken;
      if (token) {
        setAccessToken(token);
        setError(null);
        if (auth?.refreshToken) {
          AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, auth.refreshToken);
          if (auth.expiresIn) {
            scheduleRefresh(auth.refreshToken, auth.expiresIn);
          }
        }
      }
    } else if (response?.type === 'error') {
      setError(response.error?.message ?? 'Google sign-in failed');
    }
  }, [response]);

  return {
    accessToken,
    error,
    isReady: !!request,
    isRestoringSession,
    signIn: () => promptAsync(),
  };
}
