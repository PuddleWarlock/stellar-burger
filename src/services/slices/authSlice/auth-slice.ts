import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  loginUserApi,
  registerUserApi,
  logoutApi,
  getUserApi,
  refreshToken,
  updateUserApi
} from '../../../utils/burger-api';
import { deleteCookie, setCookie } from '../../../utils/cookie';

interface User {
  email: string;
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  loading: boolean;
  checked: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  error: null,
  loading: false,
  checked: false
};

export const loginUser = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>('auth/loginUser', async (data, { rejectWithValue }) => {
  try {
    const res = await loginUserApi(data);
    localStorage.setItem('refreshToken', res.refreshToken);
    setCookie('accessToken', res.accessToken, { path: '/' });
    return res.user;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Ошибка входа');
  }
});

export const updateUser = createAsyncThunk<
  User,
  Partial<{ email: string; name: string; password: string }>,
  { rejectValue: string }
>('auth/updateUser', async (data, { rejectWithValue }) => {
  try {
    const res = await updateUserApi(data);
    return res.user;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Ошибка обновления данных');
  }
});

export const registerUser = createAsyncThunk<
  User,
  { email: string; password: string; name: string },
  { rejectValue: string }
>('auth/registerUser', async (data, { rejectWithValue }) => {
  try {
    const res = await registerUserApi(data);
    localStorage.setItem('refreshToken', res.refreshToken);
    setCookie('accessToken', res.accessToken, { path: '/' });
    return res.user;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Ошибка регистрации');
  }
});

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
      localStorage.removeItem('refreshToken');
      deleteCookie('accessToken');
    } catch (err: any) {
      return rejectWithValue(err.message || 'Ошибка выхода');
    }
  }
);

export const fetchUser = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getUserApi();
      return res.user;
    } catch (err: any) {
      if (err.message === 'jwt expired') {
        await refreshToken();
        const res2 = await getUserApi();
        return res2.user;
      }
      return rejectWithValue(err.message || 'Ошибка получения данных');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload!;
      })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.user = a.payload;
        s.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (s, a) => {
        s.error = a.payload!;
      })
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null;
        s.isAuthenticated = false;
      })
      .addCase(fetchUser.fulfilled, (s, a) => {
        s.user = a.payload;
        s.isAuthenticated = true;
        s.checked = true;
      })
      .addCase(fetchUser.rejected, (s) => {
        s.checked = true;
      })
      .addCase(updateUser.fulfilled, (s, a) => {
        s.user = a.payload;
      })
      .addCase(updateUser.rejected, (s, a) => {
        s.error = a.payload!;
      });
  }
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
