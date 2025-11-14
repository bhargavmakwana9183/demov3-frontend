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
  async ({ page, limit }: { page: number; limit: number }) => {
    const response = await stockAPI.getStocks(page, limit);
    return response.data;
  }
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
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload.data;
        state.total = action.payload.pagination.total;
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
