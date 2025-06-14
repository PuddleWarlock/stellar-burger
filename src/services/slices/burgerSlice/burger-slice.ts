import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TConstructorIngredient, TOrder } from '@utils-types';
import { orderBurgerApi } from '../../../utils/burger-api';
import { addOrder, fetchOrders } from '../feedSlice/feed-slice';

export type BurgerState = {
  constructorItems: {
    bun: TConstructorIngredient | null;
    ingredients: TConstructorIngredient[];
  };
  orderRequest: boolean;
  orderModalData: TOrder | null;
  error: string | null;
};

const initialState: BurgerState = {
  constructorItems: {
    bun: null,
    ingredients: []
  },
  orderRequest: false,
  orderModalData: null,
  error: null
};

export const placeOrder = createAsyncThunk(
  'burger/placeOrder',
  async (ingredients: string[], thunkAPI) => {
    try {
      const response = await orderBurgerApi(ingredients);
      thunkAPI.dispatch(addOrder(response.order));

      thunkAPI.dispatch(fetchOrders());

      return response.order;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const burgerSlice = createSlice({
  name: 'burger',
  initialState,
  reducers: {
    addBun(state, action: PayloadAction<TConstructorIngredient>) {
      state.constructorItems.bun = action.payload;
    },
    addIngredient(state, action: PayloadAction<TConstructorIngredient>) {
      const existingIndex = state.constructorItems.ingredients.findIndex(
        (item) => item._id === action.payload._id
      );

      if (existingIndex !== -1) {
        const existingItem = state.constructorItems.ingredients[existingIndex];
        state.constructorItems.ingredients[existingIndex] = {
          ...existingItem,
          count: (existingItem as any).count
            ? (existingItem as any).count + 1
            : 2
        };
      } else {
        state.constructorItems.ingredients.push({
          ...action.payload,
          count: 1
        });
      }
    },
    removeIngredient(state, action: PayloadAction<number>) {
      const item = state.constructorItems.ingredients[action.payload];

      if ((item as any).count && (item as any).count > 1) {
        state.constructorItems.ingredients[action.payload] = {
          ...item,
          count: (item as any).count - 1
        };
      } else {
        state.constructorItems.ingredients.splice(action.payload, 1);
      }
    },
    clearConstructor(state) {
      state.constructorItems.bun = null;
      state.constructorItems.ingredients = [];
    },
    closeOrderModal(state) {
      state.orderModalData = null;
      state.error = null;
    },
    moveIngredient(
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) {
      const { fromIndex, toIndex } = action.payload;
      const ingredients = state.constructorItems.ingredients;
      const [moved] = ingredients.splice(fromIndex, 1);
      ingredients.splice(toIndex, 0, moved);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.orderRequest = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.orderRequest = false;
        state.orderModalData = action.payload;
        state.constructorItems.bun = null;
        state.constructorItems.ingredients = [];
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.orderRequest = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  addBun,
  addIngredient,
  removeIngredient,
  clearConstructor,
  closeOrderModal,
  moveIngredient
} = burgerSlice.actions;

export default burgerSlice.reducer;
