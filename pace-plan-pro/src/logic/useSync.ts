import { useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncQueue } from '../data/completionsService';

/**
 * Custom hook that automatically syncs the offline queue when:
 * - App comes into focus
 * - Network connectivity is regained
 */
export function useSync() {
  const wasOffline = useRef(false);

  // Sync when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, syncing queue...');
      syncQueue().catch(error => {
        console.error('Error syncing queue on focus:', error);
      });
    }, [])
  );

  // Sync when network connectivity is regained
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      console.log('Network state changed:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable
      });

      // If we were offline and now we're online, sync the queue
      if (wasOffline.current && state.isConnected && state.isInternetReachable) {
        console.log('Network regained, syncing queue...');
        syncQueue().catch(error => {
          console.error('Error syncing queue on network regain:', error);
        });
      }

      // Update offline status
      wasOffline.current = !state.isConnected || !state.isInternetReachable;
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Also sync on initial mount
  useEffect(() => {
    console.log('useSync initialized, performing initial sync...');
    syncQueue().catch(error => {
      console.error('Error syncing queue on initial mount:', error);
    });
  }, []);
}

export default useSync;
