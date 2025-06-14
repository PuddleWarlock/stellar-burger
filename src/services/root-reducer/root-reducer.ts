import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice/auth-slice';
import ingredientsReducer from '../slices/ingredientsSlice/ingredients-slice';
import burgerReducer from '../slices/burgerSlice/burger-slice';
import feedReducer from '../slices/feedSlice/feed-slice';

const rootReducer = combineReducers({
  auth: authReducer,
  ingredients: ingredientsReducer,
  burger: burgerReducer,
  feed: feedReducer
});

export default rootReducer;
