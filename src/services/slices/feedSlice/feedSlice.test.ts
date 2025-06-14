import { TOrder } from '@utils-types';
import reducer, {
  addOrder,
  fetchFeeds,
  fetchOrders,
  TFeedState
} from './feed-slice';
import { getOrdersApi } from '../../../utils/burger-api';

jest.mock('../../../utils/burger-api');

const mockGetOrdersApi = jest.mocked(getOrdersApi);

const initialState: TFeedState = {
  orders: [],
  userOrders: [],
  isLoading: false,
  error: null,
  total: 0,
  totalToday: 0
};

const OriginalDate = global.Date;
let dateSpy: jest.SpyInstance;

beforeEach(() => {
  const fixedDate = new OriginalDate('2024-01-26T12:00:00Z');
  dateSpy = jest.spyOn(global, 'Date').mockImplementation((...args) => {
    if (args.length > 0) {
      return new OriginalDate(...args);
    }
    return fixedDate;
  });

  jest.spyOn(OriginalDate, 'now').mockReturnValue(fixedDate.getTime());
});

afterEach(() => {
  dateSpy.mockRestore();
  jest.restoreAllMocks();
});

describe('feedSlice - synchronous reducers', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('addOrder adds order to the beginning and increments counters', () => {
    const order: TOrder = {
      _id: '1',
      createdAt: new Date().toISOString(),
      number: 1,
      status: 'done',
      name: 'Test',
      updatedAt: '',
      ingredients: []
    };
    const state = reducer(initialState, addOrder(order));
    expect(state.orders).toHaveLength(1);
    expect(state.orders[0]).toEqual(order);
    expect(state.total).toBe(1);
    expect(state.totalToday).toBe(1);
  });
});

describe('feedSlice - async reducers (handling thunk lifecycle actions)', () => {
  it('fetchOrders.pending sets loading to true and clears error', () => {
    const state = reducer(initialState, fetchOrders.pending('', undefined));
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('fetchOrders.fulfilled sets feed data', () => {
    const today = new Date(2024, 0, 26);
    const yesterday = new Date(2024, 0, 25);

    const mockOrders: TOrder[] = [
      {
        _id: '1',
        number: 1,
        status: 'done',
        createdAt: today.toISOString(),
        updatedAt: '',
        name: '',
        ingredients: []
      },
      {
        _id: '2',
        number: 2,
        status: 'pending',
        createdAt: today.toISOString(),
        updatedAt: '',
        name: '',
        ingredients: []
      },
      {
        _id: '3',
        number: 3,
        status: 'done',
        createdAt: yesterday.toISOString(),
        updatedAt: '',
        name: '',
        ingredients: []
      }
    ];

    const state = reducer(
      initialState,
      fetchOrders.fulfilled(mockOrders, '', undefined)
    );
    expect(state.isLoading).toBe(false);
    expect(state.userOrders).toEqual(mockOrders);
    expect(state.orders).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.totalToday).toBe(0);
  });

  it('fetchFeeds.fulfilled sets feed data and totals', () => {
    const today = new Date(2024, 0, 26);
    const yesterday = new Date(2024, 0, 25);

    const mockFeedsResponse = {
      success: true,
      orders: [
        {
          _id: '10',
          number: 10,
          status: 'done',
          createdAt: new Date().toISOString(),
          name: 'c',
          updatedAt: '',
          ingredients: []
        }
      ],
      total: 1234,
      totalToday: 56
    };

    const action = fetchFeeds.fulfilled(mockFeedsResponse, '', undefined);
    const state = reducer(initialState, action);

    expect(state.isLoading).toBe(false);
    expect(state.orders).toEqual(mockFeedsResponse.orders);
    expect(state.userOrders).toEqual([]);
    expect(state.total).toBe(mockFeedsResponse.total);
    expect(state.totalToday).toBe(mockFeedsResponse.totalToday);
  });

  it('fetchOrders.rejected sets loading to false and sets error', () => {
    const errorMessage = 'Ошибка загрузки';

    const action = fetchOrders.rejected(
      new Error(errorMessage),
      '',
      undefined,
      errorMessage
    );
    const state = reducer(initialState, action);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);

    const actionWithoutPayload = fetchOrders.rejected(
      new Error('Error'),
      '',
      undefined,
      undefined
    );
    const stateWithoutPayload = reducer(initialState, actionWithoutPayload);

    expect(stateWithoutPayload.error).toBe('Ошибка загрузки заказов');
  });
});

describe('feedSlice async thunks', () => {
  const dispatch = jest.fn();
  const getState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchOrders - successful API call and dispatches fulfilled', async () => {
    const mockOrdersResponseData: TOrder[] = [
      {
        _id: '1',
        number: 1,
        status: 'done',
        createdAt: 'date',
        updatedAt: '',
        name: '',
        ingredients: []
      },
      {
        _id: '2',
        number: 2,
        status: 'pending',
        createdAt: 'date',
        updatedAt: '',
        name: '',
        ingredients: []
      }
    ];

    mockGetOrdersApi.mockResolvedValue(mockOrdersResponseData);

    await fetchOrders()(dispatch, getState, undefined);

    expect(mockGetOrdersApi).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      fetchOrders.pending(expect.any(String), undefined)
    );
    expect(dispatch).toHaveBeenCalledWith(
      fetchOrders.fulfilled(
        mockOrdersResponseData,
        expect.any(String),
        undefined
      )
    );
  });

  it('fetchOrders - API error and dispatches rejected', async () => {
    const errorMessage = 'Failed to fetch orders';
    mockGetOrdersApi.mockRejectedValue(new Error(errorMessage));

    await fetchOrders()(dispatch, getState, undefined);

    expect(mockGetOrdersApi).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      fetchOrders.pending(expect.any(String), undefined)
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: fetchOrders.rejected.type,
        payload: errorMessage
      })
    );
  });
});
