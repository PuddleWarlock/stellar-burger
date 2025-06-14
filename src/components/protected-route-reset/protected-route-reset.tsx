import { FC, ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteResetProps {
  children: ReactElement;
}

export const ProtectedRouteReset: FC<ProtectedRouteResetProps> = ({
  children
}) => {
  const location = useLocation();
  const allowReset = localStorage.getItem('resetPassword') === 'true';

  if (!allowReset) {
    return (
      <Navigate to='/forgot-password' state={{ from: location }} replace />
    );
  }

  return children;
};
