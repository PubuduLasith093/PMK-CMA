// Polyfill for expo-network when it's not available
// This provides basic network status detection

export const getNetworkStateAsync = async () => {
  try {
    // Try to use expo-network if available
    const Network = require('expo-network');
    return await Network.getNetworkStateAsync();
  } catch (error) {
    // Fallback: return basic network state
    console.log('expo-network not available, using fallback');
    return {
      type: 'WIFI',
      isConnected: true,
      isInternetReachable: true,
    };
  }
};
