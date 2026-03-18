import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DeviceState {
  status: 'active' | 'locked' | 'inactive';
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastSync: Date | null;
}

const initialState: DeviceState = {
  status: 'active',
  connectionStatus: 'disconnected',
  lastSync: null,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDeviceStatus: (state, action: PayloadAction<DeviceState['status']>) => {
      state.status = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<DeviceState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },
    setLastSync: (state, action: PayloadAction<Date>) => {
      state.lastSync = action.payload;
    },
  },
});

export const { setDeviceStatus, setConnectionStatus, setLastSync } = deviceSlice.actions;
export default deviceSlice.reducer;
