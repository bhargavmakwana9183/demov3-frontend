import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { positionAPI } from "@/lib/api";

export interface Position {
  id: string;
  symbol: string;
  buyPrice: number;
  currentLTP: number;
  quantity: number;
  profitLoss: number;
  status: "in_trade" | "closed";
  entryDate: string;
  sellPrice: number;
  target: number;
  stopploss: number;
  strategy_name: string;
  trade_time: string;
}

interface PositionState {
  positions: Position[];
  loading: boolean;
  error: string | null;
}

const initialState: PositionState = {
  positions: [],
  loading: false,
  error: null,
};

export const fetchCurrentPositions = createAsyncThunk(
  "position/fetchCurrent",
  async () => {
    const response = await positionAPI.getCurrentPositions();
    return response.data;
  }
);

const positionSlice = createSlice({
  name: "position",
  initialState,
  reducers: {
    updatePositionFromSocket: (state, action) => {
      const updates = action.payload.data;
      if (!Array.isArray(updates)) return;

      const positionMap = new Map(state.positions.map((p) => [p.id, p]));
      updates.forEach((updated) => {
        if (positionMap.has(updated.id)) {
          Object.assign(positionMap.get(updated.id), updated);
        } else {
          state.positions.push(updated);
        }
      });
    },

    // Optional: Reset
    resetPositions: (state) => {
      state.positions = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentPositions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.positions = action.payload.data;
      })
      .addCase(fetchCurrentPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch positions";
      });
  },
});
export const { updatePositionFromSocket, resetPositions } =
  positionSlice.actions;
export default positionSlice.reducer;
