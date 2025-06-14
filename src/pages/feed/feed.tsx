import { useEffect } from 'react';
import { useDispatch, useSelector } from '../../services/store';
import { fetchFeeds } from '../../services/slices/feedSlice/feed-slice';
import { Preloader } from '@ui';
import { FeedUI } from '@ui-pages';

export const Feed = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, error } = useSelector((state) => state.feed);

  useEffect(() => {
    if (!orders.length && !isLoading && !error) {
      dispatch(fetchFeeds());
    }
  }, [dispatch, orders.length, isLoading, error]);

  if (isLoading) return <Preloader />;
  if (error) return <div className='text text_type_main-default'>{error}</div>;

  return (
    <FeedUI orders={orders} handleGetFeeds={() => dispatch(fetchFeeds())} />
  );
};
