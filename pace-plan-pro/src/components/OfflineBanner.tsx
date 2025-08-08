import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncQueue } from '../data/completionsService';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = isOffline;
      const nowOffline = !state.isConnected;
      
      setIsOffline(nowOffline);
      
      // If we just came back online, sync the queue
      if (wasOffline && !nowOffline) {
        syncQueue();
      }
    });

    // Check initial connection state
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    return unsubscribe;
  }, [isOffline]);

  if (!isOffline) {
    return null;
  }

  return (
    <View className="bg-amber-100 border-b border-amber-200 px-4 py-2">
      <Text className="text-amber-800 text-sm text-center font-medium">
        Offline — actions will sync automatically
      </Text>
    </View>
  );
};
