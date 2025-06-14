import * as api from './burger-api';
import { getCookie, setCookie } from './cookie';

global.fetch = jest.fn();

jest.mock('./cookie');
jest.mock('./burger-api', () => ({
  __esModule: true,
  ...jest.requireActual('./burger-api')
}));
const mockGetCookie = jest.mocked(getCookie);
const mockSetCookie = jest.mocked(setCookie);

const mockFetchResponse = (
  ok: boolean,
  body: any = {},
  status: number = 200,
  statusText: string = 'OK'
): Promise<Response> =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
    status,
    statusText,
    headers: new Headers({ Authorization: 'Bearer mock-token' })
  }) as Promise<Response>;

describe('burger-api utils', () => {
  let localStorageGetItemSpy: jest.SpyInstance;
  let localStorageSetItemSpy: jest.SpyInstance;
  let localStorageRemoveItemSpy: jest.SpyInstance;

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockGetCookie.mockClear();
    mockSetCookie.mockClear();

    localStorageGetItemSpy = jest.spyOn(
      window.localStorage.__proto__,
      'getItem'
    );
    localStorageSetItemSpy = jest.spyOn(
      window.localStorage.__proto__,
      'setItem'
    );
    localStorageRemoveItemSpy = jest.spyOn(
      window.localStorage.__proto__,
      'removeItem'
    );
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkResponse', () => {
    it('parses and returns json for ok response', async () => {
      const mockData = { success: true, data: 'some data' };
      const mockResponse = mockFetchResponse(true, mockData);
      const data = await api.checkResponse(await mockResponse);
      expect(data).toEqual(mockData);
    });

    it('rejects with error message for non-ok response', async () => {
      const mockError = { success: false, message: 'API Error' };
      const mockResponse = mockFetchResponse(false, mockError, 400);
      await expect(api.checkResponse(await mockResponse)).rejects.toThrow(
        'API Error'
      );
    });

    it('rejects with default error message if non-ok response has no message', async () => {
      const mockError = { success: false };
      const mockResponse = mockFetchResponse(false, mockError, 500);
      await expect(api.checkResponse(await mockResponse)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('sends refresh token request and updates tokens on success', async () => {
      const mockRefreshData = {
        success: true,
        accessToken: 'Bearer new-token',
        refreshToken: 'new-refresh-token'
      };
      (fetch as jest.Mock).mockResolvedValue(
        mockFetchResponse(true, mockRefreshData)
      );
      localStorageGetItemSpy.mockReturnValueOnce('old-refresh-token');

      const data = await api.refreshToken();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/token'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify({ token: 'old-refresh-token' })
        }
      );
      expect(data).toEqual(mockRefreshData);
      expect(localStorageSetItemSpy).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token'
      );
      expect(mockSetCookie).toHaveBeenCalledWith(
        'accessToken',
        'Bearer new-token',
        { path: '/' }
      );
    });

    it('rejects on refresh token API error', async () => {
      const mockError = { success: false, message: 'Invalid token' };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(false, mockError, 400)
      );
      localStorageGetItemSpy.mockReturnValueOnce('old-refresh-token');

      await expect(api.refreshToken()).rejects.toThrow(mockError.message);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/token'),
        expect.any(Object)
      );
      expect(localStorageSetItemSpy).not.toHaveBeenCalled();
      expect(mockSetCookie).not.toHaveBeenCalled();
    });
  });

  describe('fetchWithRefresh', () => {
    const testUrl = 'http://example.com/api';
    const testOptions = {
      method: 'GET',
      headers: { Authorization: 'Bearer old-token' } as HeadersInit
    };

    it('makes successful fetch request', async () => {
      const mockData = { success: true, data: 'some data' };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockData)
      );
      const data = await api.fetchWithRefresh(testUrl, testOptions);
      expect(fetch).toHaveBeenCalledWith(testUrl, testOptions);
      expect(data).toEqual(mockData);
    });

    it('calls refreshToken and retries fetch on jwt expired error', async () => {
      const mockOldResponse = mockFetchResponse(
        false,
        { message: 'jwt expired' },
        401
      );
      const mockNewResponseData = { success: true, user: { name: 'Test' } };
      const mockRefreshData = {
        success: true,
        accessToken: 'Bearer new-token',
        refreshToken: 'new-refresh-token'
      };

      (fetch as jest.Mock)

        .mockResolvedValueOnce(mockOldResponse)

        .mockResolvedValueOnce(mockFetchResponse(true, mockRefreshData))

        .mockResolvedValueOnce(mockFetchResponse(true, mockNewResponseData));

      const optionsWithAuth: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer old-token'
        }
      };

      const data = await api.fetchWithRefresh(testUrl, optionsWithAuth);

      expect(fetch).toHaveBeenCalledTimes(3);

      expect(fetch).toHaveBeenCalledWith(testUrl, optionsWithAuth);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/token'),
        expect.any(Object)
      );

      expect(fetch).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-token'
          })
        })
      );

      expect(data).toEqual(mockNewResponseData);
    });

    it('rejects if refreshToken fails after jwt expired', async () => {
      const mockOldResponse = mockFetchResponse(
        false,
        { message: 'jwt expired' },
        401
      );
      const refreshError = new Error('Refresh failed');
      (fetch as jest.Mock)

        .mockResolvedValueOnce(mockOldResponse)

        .mockRejectedValueOnce(refreshError);

      await expect(api.fetchWithRefresh(testUrl, testOptions)).rejects.toThrow(
        'Refresh failed'
      );

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('rejects on other fetch errors', async () => {
      const errorMessage = 'Network Error';
      (fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      await expect(api.fetchWithRefresh(testUrl, testOptions)).rejects.toThrow(
        errorMessage
      );
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getIngredientsApi', () => {
    it('calls fetch and returns data on success', async () => {
      const mockData = [{ _id: '1', name: 'bun' }] as any[];
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, { success: true, data: mockData })
      );
      const data = await api.getIngredientsApi();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients')
      );
      expect(data).toEqual(mockData);
    });

    it('rejects on fetch error (non-ok)', async () => {
      const mockError = { success: false, message: 'Fetch failed' };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(false, mockError, 500)
      );
      await expect(api.getIngredientsApi()).rejects.toThrow('Fetch failed');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients')
      );
    });

    it('rejects on success: false from API', async () => {
      const mockResponse = { success: false, message: 'API rejected' };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse, 200)
      );
      await expect(api.getIngredientsApi()).rejects.toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ingredients')
      );
    });
  });

  describe('getFeedsApi', () => {
    it('calls fetch and returns data on success', async () => {
      const mockOrders = [{ _id: '1', number: 1 }] as any[];
      const mockResponse = {
        success: true,
        orders: mockOrders,
        total: 1,
        totalToday: 1
      };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.getFeedsApi();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/all')
      );
      expect(data).toEqual(mockResponse);
    });
  });

  describe('getOrdersApi', () => {
    it('calls fetchWithRefresh and returns orders array on success', async () => {
      const mockOrders = [{ _id: 'user1', number: 101 }] as any[];
      const mockResponse = {
        success: true,
        orders: mockOrders,
        total: 1,
        totalToday: 1
      };
      const accessToken = 'Bearer user-token';
      mockGetCookie.mockReturnValueOnce(accessToken);
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.getOrdersApi();
      expect(mockGetCookie).toHaveBeenCalledWith('accessToken');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/orders'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          authorization: accessToken
        } as HeadersInit
      });
      expect(data).toEqual(mockResponse.orders);
    });
  });

  describe('orderBurgerApi', () => {
    it('calls fetchWithRefresh with POST and returns order data on success', async () => {
      const ingredientIds = ['id1', 'id2'];
      const mockOrder = { _id: 'orderId', number: 12345 };
      const mockResponse = {
        success: true,
        name: 'Test Order',
        order: mockOrder
      };
      const accessToken = 'Bearer order-token';
      mockGetCookie.mockReturnValueOnce(accessToken);
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.orderBurgerApi(ingredientIds);
      expect(mockGetCookie).toHaveBeenCalledWith('accessToken');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          authorization: accessToken
        } as HeadersInit,
        body: JSON.stringify({ ingredients: ingredientIds })
      });
      expect(data).toEqual(mockResponse);
    });
  });

  describe('getOrderByNumberApi', () => {
    it('calls fetch and returns data on success', async () => {
      const orderNumber = 999;
      const mockOrder = [{ _id: 'singleOrder', number: orderNumber }];
      const mockResponse = { success: true, orders: mockOrder };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.getOrderByNumberApi(orderNumber);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/orders/${orderNumber}`),
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      expect(data).toEqual(mockResponse);
    });
  });

  describe('registerUserApi', () => {
    it('calls fetch with POST and returns auth data on success', async () => {
      const registerData = {
        email: 'new@test.com',
        password: 'pw',
        name: 'New'
      };
      const mockResponse = {
        success: true,
        user: { name: 'New' },
        accessToken: 'at',
        refreshToken: 'rt'
      };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.registerUserApi(registerData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify(registerData)
        }
      );
      expect(data).toEqual(mockResponse);
    });
  });

  describe('loginUserApi', () => {
    it('calls fetch with POST and returns auth data on success', async () => {
      const loginData = { email: 'test@test.com', password: 'pw' };
      const mockResponse = {
        success: true,
        user: { name: 'Test' },
        accessToken: 'at',
        refreshToken: 'rt'
      };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.loginUserApi(loginData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify(loginData)
        }
      );
      expect(data).toEqual(mockResponse);
    });
  });

  describe('forgotPasswordApi', () => {
    it('calls fetch with POST and returns success message on success', async () => {
      const emailData = { email: 'test@test.com' };
      const mockResponse = { success: true, message: 'Email sent' };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.forgotPasswordApi(emailData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/password-reset'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify(emailData)
        }
      );
      expect(data).toEqual(mockResponse);
    });
  });

  describe('resetPasswordApi', () => {
    it('calls fetch with POST and returns success message on success', async () => {
      const resetData = { password: 'new-pw', token: 'reset-token' };
      const mockResponse = { success: true, message: 'Password reset' };
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.resetPasswordApi(resetData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/password-reset/reset'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify(resetData)
        }
      );
      expect(data).toEqual(mockResponse);
    });
  });

  describe('getUserApi', () => {
    it('calls fetchWithRefresh and returns user data on success', async () => {
      const mockUserResponse = {
        success: true,
        user: { name: 'Test User', email: 'test@example.com' }
      };
      const accessToken = 'Bearer user-token';
      mockGetCookie.mockReturnValueOnce(accessToken);
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockUserResponse)
      );
      const data = await api.getUserApi();
      expect(mockGetCookie).toHaveBeenCalledWith('accessToken');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/user'),
        {
          headers: { authorization: accessToken }
        }
      );
      expect(data).toEqual(mockUserResponse);
    });
  });

  describe('updateUserApi', () => {
    it('calls fetchWithRefresh with PATCH and returns updated user data on success', async () => {
      const updateData = { name: 'Updated Name' };
      const mockUserResponse = {
        success: true,
        user: { name: 'Updated Name', email: 'test@example.com' }
      };
      const accessToken = 'Bearer update-token';
      mockGetCookie.mockReturnValueOnce(accessToken);
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockUserResponse)
      );
      const data = await api.updateUserApi(updateData);
      expect(mockGetCookie).toHaveBeenCalledWith('accessToken');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/user'),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            authorization: accessToken
          } as HeadersInit,
          body: JSON.stringify(updateData)
        }
      );
      expect(data).toEqual(mockUserResponse);
    });
  });

  describe('logoutApi', () => {
    it('calls fetch with POST and returns success message on success', async () => {
      const mockResponse = { success: true, message: 'Logout success' };
      localStorageGetItemSpy.mockReturnValueOnce('logout-refresh-token');
      (fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(true, mockResponse)
      );
      const data = await api.logoutApi();
      expect(localStorageGetItemSpy).toHaveBeenCalledWith('refreshToken');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify({ token: 'logout-refresh-token' })
        }
      );
      expect(data).toEqual(mockResponse);
    });
  });
});
