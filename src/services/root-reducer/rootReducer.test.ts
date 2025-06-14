import rootReducer from './root-reducer';

describe('rootReducer', () => {
  it('правильная инициализация редьюсера', () => {
    const state = rootReducer(undefined, { type: '@@INIT' });
    expect(state.auth).toEqual({
      isAuthenticated: false,
      user: null,
      error: null,
      loading: false,
      checked: false
    });
    expect(state).toHaveProperty('ingredients');
    expect(state).toHaveProperty('burger');
    expect(state).toHaveProperty('feed');
  });
});
