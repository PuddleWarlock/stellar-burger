import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TOrder } from '@utils-types';
import { getOrderByNumberApi } from '../../../utils/burger-api';
import { getOrdersApi, getFeedsApi } from '../../../utils/burger-api';

export type TFeedState = {
  orders: TOrder[];
  userOrders: TOrder[];
  isLoading: boolean;
  error: string | null;
  total: number;
  totalToday: number;
};

const initialState: TFeedState = {
  orders: [],
  userOrders: [],
  isLoading: false,
  error: null,
  total: 0,
  totalToday: 0
};

const countTodayOrders = (orders: TOrder[]) => {
  const today = new Date().toDateString();
  return orders.filter(
    (order) => new Date(order.createdAt).toDateString() === today
  ).length;
};

export const fetchOrderByNumber = createAsyncThunk(
  'orders/fetchOrderByNumber',
  async (orderNumber: number) => {
    const data = await getOrderByNumberApi(orderNumber);

    return data.orders[0];
  }
);

export const fetchFeeds = createAsyncThunk('feed/fetchFeeds', async () => {
  const data = await getFeedsApi();
  return data;
});

export const fetchOrders = createAsyncThunk<
  TOrder[],
  void,
  { rejectValue: string }
>('feed/fetchOrders', async (_, thunkAPI) => {
  try {
    const orders = await getOrdersApi();
    return orders;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || 'Ошибка загрузки заказов');
  }
});

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    addOrder(state, action) {
      state.orders.unshift(action.payload);
      state.total += 1;
      state.totalToday += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userOrders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Ошибка загрузки заказов';
      })
      .addCase(fetchFeeds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeeds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.total = action.payload.total;
        state.totalToday = action.payload.totalToday;
      })
      .addCase(fetchFeeds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Ошибка загрузки ленты';
      })
      .addCase(fetchOrderByNumber.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderByNumber.fulfilled, (state, action) => {
        state.isLoading = false;

        const existingOrder = state.orders.find(
          (o) => o.number === action.payload.number
        );
        if (!existingOrder) {
          state.orders.push(action.payload);
        }
      })
      .addCase(fetchOrderByNumber.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Ошибка загрузки заказа';
      });
  }
});

export const { addOrder } = feedSlice.actions;
export default feedSlice.reducer;
