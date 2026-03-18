import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import deviceReducer from './slices/deviceSlice';
import locationReducer from './slices/locationSlice';
import metricsReducer from './slices/metricsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    device: deviceReducer,
    location: locationReducer,
    metrics: metricsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['location/updateCurrent'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['location.current.timestamp', 'metrics.lastUpdate'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store };
export default store;
