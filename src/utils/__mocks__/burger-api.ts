export const checkResponse = jest.fn(async (res) => {
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Ошибка API');
  }
  return res.json();
});

export const refreshToken = jest.fn();
export const fetchWithRefresh = jest.fn();
export const getIngredientsApi = jest.fn();
export const getFeedsApi = jest.fn();
export const getOrdersApi = jest.fn();
export const orderBurgerApi = jest.fn();
export const getOrderByNumberApi = jest.fn();
export const registerUserApi = jest.fn();
export const loginUserApi = jest.fn();
export const forgotPasswordApi = jest.fn();
export const resetPasswordApi = jest.fn();
export const getUserApi = jest.fn();
export const updateUserApi = jest.fn();
export const logoutApi = jest.fn();
