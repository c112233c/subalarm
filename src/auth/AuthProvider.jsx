import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Keycloak from 'keycloak-js';
import { KEYCLOAK_CONFIG } from '../config';

const AuthContext = createContext(null);

const realmUrl = `${KEYCLOAK_CONFIG.url.replace(/\/+$/, '')}/realms/${KEYCLOAK_CONFIG.realm}`;

async function checkKeycloakReachable() {
  const response = await fetch(`${realmUrl}/.well-known/openid-configuration`, {
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    throw new Error(`Keycloak responded with HTTP ${response.status}`);
  }
}

export function AuthProvider({ children }) {
  const [keycloak, setKeycloak] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!KEYCLOAK_CONFIG.url) {
      setError('Keycloak is not configured. Set VITE_KEYCLOAK_URL in .env.');
      setInitialized(true);
      return;
    }

    let cancelled = false;

    async function boot() {
      try {
        await checkKeycloakReachable();
        if (cancelled) return;

        const kc = new Keycloak(KEYCLOAK_CONFIG);

        // No valid token/session -> Keycloak redirects straight to its login URI.
        // Valid token -> app proceeds normally.
        const auth = await kc.init({ onLoad: 'login-required', checkLoginIframe: false });
        if (cancelled) return;

        setKeycloak(kc);
        setAuthenticated(auth);
        if (auth) {
          kc.loadUserProfile()
            .then(setProfile)
            .catch((err) => console.error('Failed to load profile:', err));
        }
        setError(null);
        setInitialized(true);
      } catch (err) {
        if (cancelled) return;
        console.error('Keycloak init failed:', err);
        setError(
          `Cannot reach Keycloak at ${realmUrl}. ` +
            `Check that the server is running and reachable, and that ` +
            `VITE_KEYCLOAK_URL / VITE_KEYCLOAK_REALM are correct. ` +
            `(detail: ${err.message})`
        );
        setInitialized(true);
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!keycloak) return;

    const onUnauthorized = () => {
      keycloak.logout();
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);

    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [keycloak]);

  const login = useCallback(() => {
    keycloak?.login();
  }, [keycloak]);

  const logout = useCallback(() => {
    keycloak?.logout();
  }, [keycloak]);

  const token = useMemo(() => keycloak?.token || null, [keycloak]);

  useEffect(() => {
    if (!keycloak) return;

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch((err) => {
        console.error('Failed to refresh token:', err);
        keycloak.logout();
      });
    };

    const refresh = setInterval(() => {
      keycloak
        .updateToken(60)
        .catch((err) => console.error('Token refresh failed:', err));
    }, 60000);

    return () => clearInterval(refresh);
  }, [keycloak]);

  const value = useMemo(
    () => ({ keycloak, profile, initialized, authenticated, token, error, login, logout }),
    [keycloak, profile, initialized, authenticated, token, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}