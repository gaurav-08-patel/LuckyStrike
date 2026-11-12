import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export const FORCE_OFFLINE_FOR_DEVELOPMENT = true;

export function useNetworkStatus(forceOfflineForDevelopment = FORCE_OFFLINE_FOR_DEVELOPMENT) {
  const [isConnected, setIsConnected] = useState(!forceOfflineForDevelopment);

  useEffect(() => {
    if (forceOfflineForDevelopment) {
      setIsConnected(false);
      return;
    }

    let mounted = true;

    const syncStatus = (state: { isConnected?: boolean | null; isInternetReachable?: boolean | null }) => {
      if (!mounted) return;
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(connected);
    };

    NetInfo.fetch().then(syncStatus).catch(() => setIsConnected(false));

    const unsubscribe = NetInfo.addEventListener((state) => {
      syncStatus(state);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [forceOfflineForDevelopment]);

  return {
    isOffline: forceOfflineForDevelopment || !isConnected,
    isConnected: !forceOfflineForDevelopment && isConnected,
  };
}
