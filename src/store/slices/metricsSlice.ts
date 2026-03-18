import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DeviceMetrics {
  battery: {
    level: number;
    isCharging: boolean;
    status: string;
  };
  storage: {
    totalBytes: string;
    usedBytes: string;
    availableBytes: string;
  };
  network: {
    type: string;
    isConnected: boolean;
  };
  lastUpdate: Date;
}

interface MetricsState {
  current: DeviceMetrics | null;
}

const initialState: MetricsState = {
  current: null,
};

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    updateMetrics: (state, action: PayloadAction<DeviceMetrics>) => {
      state.current = action.payload;
    },
  },
});

export const { updateMetrics } = metricsSlice.actions;
export default metricsSlice.reducer;
