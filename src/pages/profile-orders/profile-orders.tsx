import { useEffect } from 'react';
import { useDispatch, useSelector } from '../../services/store';
import { fetchOrders } from '../../services/slices/feedSlice/feed-slice';
import { ProfileOrdersUI } from '@ui-pages';
import { Preloader } from '@ui';

export const ProfileOrders = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.feed);
  const orders = useSelector((state) => state.feed.userOrders);

  useEffect(() => {
    if (!orders.length && !isLoading && !error) {
      dispatch(fetchOrders());
    }
  }, [dispatch, orders.length, isLoading, error]);

  if (isLoading) return <Preloader />;
  if (error) return <div className='text text_type_main-default'>{error}</div>;

  return <ProfileOrdersUI orders={orders} />;
};
