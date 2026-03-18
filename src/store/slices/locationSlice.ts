import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
}

interface LocationState {
  current: LocationData | null;
  isTracking: boolean;
  permissionGranted: boolean;
}

const initialState: LocationState = {
  current: null,
  isTracking: false,
  permissionGranted: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    updateCurrent: (state, action: PayloadAction<LocationData>) => {
      state.current = action.payload;
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
    setPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionGranted = action.payload;
    },
  },
});

export const { updateCurrent, setTracking, setPermissionGranted } = locationSlice.actions;
export default locationSlice.reducer;
