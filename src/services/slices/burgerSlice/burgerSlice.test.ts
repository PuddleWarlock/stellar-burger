import reducer, {
  addIngredient,
  BurgerState,
  clearConstructor,
  closeOrderModal,
  placeOrder
} from './burger-slice';
import { TConstructorIngredient, TOrder } from '@utils-types';
import { orderBurgerApi } from '../../../utils/burger-api';

import { addOrder } from '../feedSlice/feed-slice';

jest.mock('../../../utils/burger-api');

jest.mock('../feedSlice/feed-slice', () => ({
  ...jest.requireActual('../feedSlice/feed-slice'),
  addOrder: jest.fn()
}));

const mockOrderBurgerApi = jest.mocked(orderBurgerApi);
const mockAddOrder = jest.mocked(addOrder);

describe('burgerSlice', () => {
  const initialState: BurgerState = {
    constructorItems: {
      bun: null,
      ingredients: []
    },
    orderRequest: false,
    orderModalData: null,
    error: null
  };

  const ingredient: TConstructorIngredient = {
    _id: '123',
    id: 'test-uuid-123',
    name: 'Test Ingredient',
    type: 'main',
    price: 10,
    calories: 100,
    proteins: 10,
    fat: 10,
    carbohydrates: 10,
    image: '',
    image_large: '',
    image_mobile: ''
  };
  const bunIngredient: TConstructorIngredient = {
    _id: 'bun1',
    id: 'bun-uuid-1',
    name: 'Test Bun',
    type: 'bun',
    price: 5,
    calories: 50,
    proteins: 5,
    fat: 5,
    carbohydrates: 5,
    image: '',
    image_large: '',
    image_mobile: ''
  };

  describe('синхронные экшены', () => {
    it('returns initial state', () => {
      expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
    });

    it('addIngredient adds ingredient with count 1', () => {
      const state = reducer(initialState, addIngredient(ingredient));
      expect(state.constructorItems.ingredients).toHaveLength(1);
      expect(state.constructorItems.ingredients[0]._id).toBe(ingredient._id);
      expect(state.constructorItems.ingredients[0].count).toBe(1);
      expect(state.constructorItems.ingredients[0].id).toBe(ingredient.id);
    });

    it('clearConstructor clears bun and ingredients', () => {
      const prefilledState: BurgerState = {
        ...initialState,
        constructorItems: {
          bun: { ...bunIngredient, id: 'bun-uuid' },
          ingredients: [
            { ...ingredient, _id: 'ing1', id: 'ing-uuid1', count: 1 },
            { ...ingredient, _id: 'ing2', id: 'ing-uuid2', count: 3 }
          ]
        },

        orderModalData: {
          number: 123,
          _id: 'abc',
          status: 'done',
          name: 'Test',
          createdAt: 'date',
          updatedAt: 'date',
          ingredients: []
        },
        error: 'Some error'
      };
      const state = reducer(prefilledState, clearConstructor());
      expect(state.constructorItems).toEqual({ bun: null, ingredients: [] });
      expect(state.orderModalData).toEqual(prefilledState.orderModalData);
      expect(state.error).toEqual(prefilledState.error);
    });

    it('closeOrderModal clears orderModalData and error', () => {
      const prefilledState: BurgerState = {
        ...initialState,

        orderModalData: {
          number: 123,
          _id: 'abc',
          status: 'done',
          name: 'Test',
          createdAt: 'date',
          updatedAt: 'date',
          ingredients: []
        },
        error: 'Ошибка'
      };
      const state = reducer(prefilledState, closeOrderModal());
      expect(state.orderModalData).toBeNull();
      expect(state.error).toBeNull();
      expect(state.constructorItems).toEqual(prefilledState.constructorItems);
    });
  });

  describe('burgerSlice async thunks', () => {
    const dispatch = jest.fn();
    const getState = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockOrder: TOrder = {
      number: 12345,
      _id: 'orderId',
      status: 'done',
      createdAt: 'date',
      updatedAt: 'date',
      name: 'Test Order',
      ingredients: ['id1', 'id2']
    };
    const mockOrderResponse = {
      success: true,
      name: 'Test Order',
      order: mockOrder
    };
    const ingredientIds = ['id1', 'id2', 'id3'];

    it('placeOrder - dispatches pending, calls API, dispatches fulfilled and side effects on success', async () => {
      mockOrderBurgerApi.mockResolvedValue(mockOrderResponse);

      await placeOrder(ingredientIds)(dispatch, getState, undefined);

      expect(mockOrderBurgerApi).toHaveBeenCalledWith(ingredientIds);

      expect(dispatch).toHaveBeenCalledWith(
        placeOrder.pending(expect.any(String), ingredientIds)
      );

      expect(dispatch).toHaveBeenCalledWith(
        placeOrder.fulfilled(mockOrder, expect.any(String), ingredientIds)
      );

      expect(mockAddOrder).toHaveBeenCalledWith(mockOrder);
    });

    it('placeOrder - dispatches pending, calls API, dispatches rejected on error', async () => {
      const errorMessage = 'Order failed';
      mockOrderBurgerApi.mockRejectedValue(new Error(errorMessage));

      await placeOrder(ingredientIds)(dispatch, getState, undefined);

      expect(mockOrderBurgerApi).toHaveBeenCalledWith(ingredientIds);
      expect(dispatch).toHaveBeenCalledWith(
        placeOrder.pending(expect.any(String), ingredientIds)
      );

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: placeOrder.rejected.type,
          payload: errorMessage
        })
      );
      expect(mockAddOrder).not.toHaveBeenCalled();
    });
  });
});
