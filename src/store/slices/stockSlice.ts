import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { stockAPI } from "@/lib/api";

export interface Stock {
  id: string;
  name: string;
  trading_symbol: string;
  buyPrice: number;
  ltp: number;
  lot_size: number;
  is_active: boolean;
  instrument_type: string;
  strike_price?: number;
  expiry?: string;
  instrument_key?: string;
}

interface StockState {
  stocks: Stock[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  orderPlacing: boolean;
}

const initialState: StockState = {
  stocks: [],
  total: 0,
  page: 1,
  loading: false,
  error: null,
  orderPlacing: false,
};

export const fetchStocks = createAsyncThunk(
  "stock/fetchStocks",
  async ({
    page,
    limit,
    silent = false,
  }: {
    page: number;
    limit: number;
    silent?: boolean;
  }) => {
    const response = await stockAPI.getStocks(page, limit);
    return { ...(response.data || {}), silent };
  },
);
export const makeAsActiveStocks = createAsyncThunk(
  "stock/makeAsActiveStocks",
  async ({ id }: { id: string }) => {
    const response = await stockAPI.makeasActive(id);
    return response.data;
  }
);

export const placeOrder = createAsyncThunk(
  "stock/placeOrder",
  async (orderData: {
    stockId: string;
    type: "buy" | "sell";
    quantity: number;
    price: number;
  }) => {
    const response = await stockAPI.placeOrder(orderData);
    return response.data;
  }
);

export const placeManualNiftyOrder = createAsyncThunk(
  "stock/placeManualNiftyOrder",
  async (
    orderData: {
      hedgingOptionId?: string;
      instrumentKey?: string;
      lots: number;
      buyPrice: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await stockAPI.placeManualNiftyEntry({
        hedging_option_id: orderData.hedgingOptionId,
        instrument_key: orderData.instrumentKey,
        lots: orderData.lots,
        buy_price: orderData.buyPrice,
      });
      return response.data;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Manual entry failed";
      return rejectWithValue(msg);
    }
  },
);

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocks.pending, (state, action) => {
        // Silent auto-refresh keeps existing rows visible (no full-page flash)
        if (!action.meta.arg?.silent) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload.data || [];
        state.total =
          action.payload.pagination?.total ?? action.payload.total ?? 0;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch stocks";
      })
      .addCase(placeOrder.pending, (state) => {
        state.orderPlacing = true;
      })
      .addCase(placeOrder.fulfilled, (state) => {
        state.orderPlacing = false;
      })
      .addCase(placeOrder.rejected, (state) => {
        state.orderPlacing = false;
      })
      .addCase(placeManualNiftyOrder.pending, (state) => {
        state.orderPlacing = true;
      })
      .addCase(placeManualNiftyOrder.fulfilled, (state) => {
        state.orderPlacing = false;
      })
      .addCase(placeManualNiftyOrder.rejected, (state) => {
        state.orderPlacing = false;
      })
      .addCase(makeAsActiveStocks.pending, (state) => {
        state.loading = true;
      })
      .addCase(makeAsActiveStocks.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(makeAsActiveStocks.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setPage } = stockSlice.actions;
export default stockSlice.reducer;
