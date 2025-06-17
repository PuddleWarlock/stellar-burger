import {
  ConstructorPage,
  Register,
  Feed,
  Login,
  ForgotPassword,
  ResetPassword,
  Profile,
  ProfileOrders,
  NotFound404
} from '@pages';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom';
import { ProtectedRoute } from '../protected-route/protected-route';
import '../../index.css';
import styles from './app.module.css';
import { useDispatch, useSelector } from '../../services/store';
import { fetchUser } from '../../services/slices/authSlice/auth-slice';
import { ProtectedRouteReset } from '../protected-route-reset/protected-route-reset';
import { AppHeader, IngredientDetails, Modal, OrderInfo } from '@components';
import { useEffect } from 'react';
import { fetchIngredients } from '../../services/slices/ingredientsSlice/ingredients-slice';

const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, checked } = useSelector((state) => state.auth);
  const background =
    location.state && (location.state as { background?: Location }).background;

  const onBack = () => navigate(-1);

  return (
    <>
      <Routes location={background ?? location}>
        <Route path='/' element={<ConstructorPage />} />
        <Route
          path='/login'
          element={isAuthenticated ? <Navigate to='/' replace /> : <Login />}
        />
        <Route
          path='/register'
          element={isAuthenticated ? <Navigate to='/' replace /> : <Register />}
        />
        <Route
          path='/forgot-password'
          element={
            isAuthenticated ? <Navigate to='/' replace /> : <ForgotPassword />
          }
        />
        <Route
          path='/reset-password'
          element={
            <ProtectedRouteReset>
              <ResetPassword />
            </ProtectedRouteReset>
          }
        />
        <Route path='/ingredients/:id' element={<IngredientDetails />} />
        <Route path='/feed/:number' element={<OrderInfo />} />
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path='/profile/orders'
          element={
            <ProtectedRoute>
              <ProfileOrders />
            </ProtectedRoute>
          }
        />
        <Route path='/feed' element={<Feed />} />
        <Route
          path='/profile/orders/:number'
          element={
            <ProtectedRoute>
              <OrderInfo />
            </ProtectedRoute>
          }
        />
        <Route path='*' element={<NotFound404 />} />
      </Routes>

      {background && (
        <Routes>
          <Route
            path='/feed/:number'
            element={
              <Modal title='Детали заказа' onClose={onBack}>
                <OrderInfo />
              </Modal>
            }
          />
          <Route
            path='/ingredients/:id'
            element={
              <Modal title='Информация об ингредиенте' onClose={onBack}>
                <IngredientDetails />
              </Modal>
            }
          />
          <Route
            path='/profile/orders/:number'
            element={
              <Modal title='Детали заказа' onClose={onBack}>
                <OrderInfo />
              </Modal>
            }
          />
        </Routes>
      )}
    </>
  );
};

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUser());
    dispatch(fetchIngredients());
  }, [dispatch]);

  return (
    <Router>
      <div className={styles.app}>
        <AppHeader />
        <AppRoutes />
      </div>
    </Router>
  );
};

export default App;
