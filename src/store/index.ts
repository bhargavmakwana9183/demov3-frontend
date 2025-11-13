import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './slices/dashboardSlice';
import stockReducer from './slices/stockSlice';
import positionReducer from './slices/positionSlice';
import tradeHistoryReducer from './slices/tradeHistorySlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    stock: stockReducer,
    position: positionReducer,
    tradeHistory: tradeHistoryReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
