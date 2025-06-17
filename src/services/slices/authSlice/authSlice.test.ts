import reducer, {
  AuthState,
  clearAuth,
  fetchUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUser
} from './auth-slice';
import { TUser } from '@utils-types';
import {
  getUserApi,
  loginUserApi,
  logoutApi,
  refreshToken as refreshTokenApi,
  registerUserApi,
  updateUserApi
} from '../../../utils/burger-api';
import { deleteCookie, setCookie } from '../../../utils/cookie';

jest.mock('../../../utils/burger-api');
jest.mock('../../../utils/cookie');

const mockLoginUserApi = jest.mocked(loginUserApi);
const mockRegisterUserApi = jest.mocked(registerUserApi);
const mockLogoutApi = jest.mocked(logoutApi);
const mockGetUserApi = jest.mocked(getUserApi);
const mockUpdateUserApi = jest.mocked(updateUserApi);
const mockRefreshTokenApi = jest.mocked(refreshTokenApi);
const mockSetCookie = jest.mocked(setCookie);
const mockDeleteCookie = jest.mocked(deleteCookie);

describe('authSlice', () => {
  const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    error: null,
    loading: false,
    checked: false
  };

  describe('синхронные экшены', () => {
    it('сброс авторизации', () => {
      const prevState: AuthState = {
        isAuthenticated: true,
        user: { name: 'Test', email: 'test@example.com' },
        error: 'Some error',
        loading: true,
        checked: true
      };
      const state = reducer(prevState, clearAuth());
      expect(state).toEqual({
        isAuthenticated: false,
        user: null,
        error: null,
        loading: false,
        checked: true
      });
    });

    it('возвращает начальное состояние', () => {
      expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
    });
  });

  describe('authSlice async thunks', () => {
    const mockUser: TUser = { name: 'Test User', email: 'test@example.com' };
    const mockAuthResponse = {
      success: true,
      user: mockUser,
      accessToken: 'Bearer mock-token',
      refreshToken: 'mock-refresh-token'
    };

    const dispatch = jest.fn();
    const getState = jest.fn();

    let localStorageSetItemSpy: jest.SpyInstance;
    let localStorageRemoveItemSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      localStorageRemoveItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('loginUser - успешный вход', async () => {
      mockLoginUserApi.mockResolvedValue(mockAuthResponse);
      const loginData = { email: 'test@example.com', password: 'password' };

      await loginUser(loginData)(dispatch, getState, undefined);

      expect(mockLoginUserApi).toHaveBeenCalledWith(loginData);
      expect(dispatch).toHaveBeenCalledWith(
        loginUser.pending(expect.any(String), loginData)
      );
      expect(dispatch).toHaveBeenCalledWith(
        loginUser.fulfilled(mockUser, expect.any(String), loginData)
      );
      expect(localStorageSetItemSpy).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token'
      );
      expect(mockSetCookie).toHaveBeenCalledWith(
        'accessToken',
        'Bearer mock-token',
        { path: '/' }
      );
    });

    it('loginUser - ошибка входа', async () => {
      const errorMessage = 'Invalid credentials';
      mockLoginUserApi.mockRejectedValue(new Error(errorMessage));
      const loginData = { email: 'test@example.com', password: 'password' };

      await loginUser(loginData)(dispatch, getState, undefined);

      expect(mockLoginUserApi).toHaveBeenCalledWith(loginData);
      expect(dispatch).toHaveBeenCalledWith(
        loginUser.pending(expect.any(String), loginData)
      );

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: loginUser.rejected.type,
          payload: errorMessage
        })
      );
      expect(localStorageSetItemSpy).not.toHaveBeenCalled();
      expect(mockSetCookie).not.toHaveBeenCalled();
    });

    it('registerUser - успешная регистрация', async () => {
      mockRegisterUserApi.mockResolvedValue(mockAuthResponse);
      const registerData = {
        email: 'new@example.com',
        password: 'password',
        name: 'New User'
      };

      await registerUser(registerData)(dispatch, getState, undefined);

      expect(mockRegisterUserApi).toHaveBeenCalledWith(registerData);
      expect(dispatch).toHaveBeenCalledWith(
        registerUser.pending(expect.any(String), registerData)
      );
      expect(dispatch).toHaveBeenCalledWith(
        registerUser.fulfilled(mockUser, expect.any(String), registerData)
      );
      expect(localStorageSetItemSpy).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token'
      );
      expect(mockSetCookie).toHaveBeenCalledWith(
        'accessToken',
        'Bearer mock-token',
        { path: '/' }
      );
    });

    it('fetchUser - успешное получение пользователя', async () => {
      mockGetUserApi.mockResolvedValue({ success: true, user: mockUser });

      await fetchUser()(dispatch, getState, undefined);

      expect(mockGetUserApi).toHaveBeenCalledTimes(1);

      expect(dispatch).toHaveBeenCalledWith(
        fetchUser.pending(expect.any(String), undefined)
      );
      expect(dispatch).toHaveBeenCalledWith(
        fetchUser.fulfilled(mockUser, expect.any(String), undefined)
      );
    });

    it('fetchUser - ошибка jwt expired, успешное обновление токена и повторный запрос', async () => {
      mockGetUserApi.mockRejectedValueOnce({ message: 'jwt expired' });
      mockRefreshTokenApi.mockResolvedValueOnce({
        success: true,
        accessToken: 'Bearer new-token',
        refreshToken: 'new-refresh-token'
      });
      mockGetUserApi.mockResolvedValueOnce({ success: true, user: mockUser });

      await fetchUser()(dispatch, getState, undefined);

      expect(mockGetUserApi).toHaveBeenCalledTimes(2);
      expect(mockRefreshTokenApi).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(
        fetchUser.pending(expect.any(String), undefined)
      );
      expect(dispatch).toHaveBeenCalledWith(
        fetchUser.fulfilled(mockUser, expect.any(String), undefined)
      );
    });

    it('logoutUser - успешный выход', async () => {
      mockLogoutApi.mockResolvedValue({ success: true });
      jest
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValueOnce('fake-refresh-token');

      await logoutUser()(dispatch, getState, undefined);

      expect(mockLogoutApi).toHaveBeenCalledTimes(1);
      expect(localStorageRemoveItemSpy).toHaveBeenCalledWith('refreshToken');
      expect(mockDeleteCookie).toHaveBeenCalledWith('accessToken');

      expect(dispatch).toHaveBeenCalledWith(
        logoutUser.pending(expect.any(String), undefined)
      );
      expect(dispatch).toHaveBeenCalledWith(
        logoutUser.fulfilled(undefined, expect.any(String), undefined)
      );
    });

    it('updateUser - успешное обновление пользователя', async () => {
      const updatedUserResponse = {
        success: true,
        user: { name: 'Updated Name', email: 'test@example.com' }
      };
      mockUpdateUserApi.mockResolvedValue(updatedUserResponse);
      const updateData = { name: 'Updated Name' };

      await updateUser(updateData)(dispatch, getState, undefined);

      expect(mockUpdateUserApi).toHaveBeenCalledWith(updateData);
      expect(dispatch).toHaveBeenCalledWith(
        updateUser.pending(expect.any(String), updateData)
      );
      expect(dispatch).toHaveBeenCalledWith(
        updateUser.fulfilled(
          updatedUserResponse.user,
          expect.any(String),
          updateData
        )
      );
    });

    it('updateUser - ошибка обновления пользователя', async () => {
      const errorMessage = 'Update failed';
      mockUpdateUserApi.mockRejectedValueOnce(new Error(errorMessage));
      const updateData = { name: 'Updated Name' };

      await updateUser(updateData)(dispatch, getState, undefined);

      expect(mockUpdateUserApi).toHaveBeenCalledWith(updateData);
      expect(dispatch).toHaveBeenCalledWith(
        updateUser.pending(expect.any(String), updateData)
      );

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: updateUser.rejected.type,
          payload: errorMessage
        })
      );
    });
  });
});
