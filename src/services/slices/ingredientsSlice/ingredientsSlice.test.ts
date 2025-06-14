import reducer, {
  fetchIngredients,
  IngredientsState
} from './ingredients-slice';
import { TIngredient } from '@utils-types';
import { PayloadAction } from '@reduxjs/toolkit';

import { getIngredientsApi } from '../../../utils/burger-api';

jest.mock('../../../utils/burger-api');

const mockGetIngredientsApi = jest.mocked(getIngredientsApi);

describe('ingredientsSlice - synchronous reducers', () => {
  const initialState: IngredientsState = {
    data: [],
    isLoading: false,
    error: null
  };

  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });
});

describe('ingredientsSlice - async reducers (handling thunk lifecycle actions)', () => {
  it('fetchIngredients.pending sets loading to true and clears error', () => {
    const state = reducer(undefined, fetchIngredients.pending(''));
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('fetchIngredients.fulfilled sets ingredients data', () => {
    const mockData: TIngredient[] = [
      {
        _id: '1',
        name: 'cheese',
        type: 'main',
        price: 50,
        calories: 100,
        proteins: 10,
        fat: 10,
        carbohydrates: 10,
        image: '',
        image_large: '',
        image_mobile: ''
      }
    ];
    const action = fetchIngredients.fulfilled(mockData, '') as any;
    const state = reducer(undefined, action);
    expect(state.isLoading).toBe(false);
    expect(state.data).toEqual(mockData);
  });

  it('fetchIngredients.rejected sets loading to false and sets error', () => {
    const errorMessage = 'Ошибка загрузки';
    const error = new Error(errorMessage);

    const action = fetchIngredients.rejected(error, '', undefined);
    const state = reducer(undefined, action);
    expect(state.isLoading).toBe(false);

    expect(state.error).toBe(errorMessage);
  });
});

describe('ingredientsSlice async thunks', () => {
  beforeEach(() => {
    mockGetIngredientsApi.mockClear();
  });

  const dispatch = jest.fn();
  const getState = jest.fn();

  it('fetchIngredients - successful API call and dispatches fulfilled', async () => {
    const mockIngredientsResponseData: TIngredient[] = [
      {
        _id: '1',
        name: 'bun',
        type: 'bun',
        price: 100,
        calories: 0,
        proteins: 0,
        fat: 0,
        carbohydrates: 0,
        image: '',
        image_large: '',
        image_mobile: ''
      },
      {
        _id: '2',
        name: 'sauce',
        type: 'sauce',
        price: 50,
        calories: 0,
        proteins: 0,
        fat: 0,
        carbohydrates: 0,
        image: '',
        image_large: '',
        image_mobile: ''
      }
    ];

    mockGetIngredientsApi.mockResolvedValue(mockIngredientsResponseData);

    const action = fetchIngredients();

    await action(dispatch, getState, undefined);

    expect(mockGetIngredientsApi).toHaveBeenCalledTimes(1);

    expect(dispatch).toHaveBeenCalledWith(
      fetchIngredients.pending(expect.any(String)) as any
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchIngredients.fulfilled(
        mockIngredientsResponseData,
        expect.any(String)
      ) as any
    );
  });

  it('fetchIngredients - API error and dispatches rejected', async () => {
    const errorMessage = 'Failed to fetch ingredients';

    let error = new Error(errorMessage);
    mockGetIngredientsApi.mockRejectedValue(error);

    const action = fetchIngredients();
    await action(dispatch, getState, undefined);

    expect(mockGetIngredientsApi).toHaveBeenCalledTimes(1);

    expect(dispatch).toHaveBeenCalledWith(
      fetchIngredients.pending(expect.any(String)) as any
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchIngredients.rejected(error, expect.any(String)) as any
    );
  });
});
