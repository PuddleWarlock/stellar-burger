import { Navigate, useLocation } from 'react-router-dom';
import { FC, ReactElement } from 'react';
import { RootState, useSelector } from '../../services/store';
import { Preloader } from '@ui';

interface ProtectedRouteProps {
  children: ReactElement;
  onlyUnAuth?: boolean;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  onlyUnAuth = false
}) => {
  const { isAuthenticated, checked } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();

  if (!checked) {
    return <Preloader />;
  }

  if (!isAuthenticated && !onlyUnAuth) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  if (isAuthenticated && onlyUnAuth) {
    return <Navigate to='/' replace />;
  }

  return children;
};
