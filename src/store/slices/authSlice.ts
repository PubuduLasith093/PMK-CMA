import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import deviceService from '../../services/api/deviceService';

// Device credentials matching desktop app's app_registered_id.json structure
interface AuthState {
  isAuthenticated: boolean;
  deviceId: string | null;
  childId: string | null;
  userId: string | null;
  token: string | null;
  childName: string | null;
  parentName: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  deviceId: null,
  childId: null,
  userId: null,
  token: null,
  childName: null,
  parentName: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setDeviceRegistered: (
      state,
      action: PayloadAction<{
        deviceId: string;
        childId: string;
        userId: string;
        token: string;
        childName: string;
        parentName: string;
      }>
    ) => {
      state.isAuthenticated = true;
      state.deviceId = action.payload.deviceId;
      state.childId = action.payload.childId;
      state.userId = action.payload.userId;
      state.token = action.payload.token;
      state.childName = action.payload.childName;
      state.parentName = action.payload.parentName;
    },
    logout: (state) => {
      // Clear Redux state
      state.isAuthenticated = false;
      state.deviceId = null;
      state.childId = null;
      state.userId = null;
      state.token = null;
      state.childName = null;
      state.parentName = null;

      // Clear stored credentials (like deleting app_registered_id.json)
      deviceService.clearDeviceCredentials();
    },
  },
});

export const { setDeviceRegistered, logout } = authSlice.actions;
export default authSlice.reducer;
