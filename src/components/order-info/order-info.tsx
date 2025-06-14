import { FC, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  useSelector,
  RootState,
  useDispatch
} from '../../../src/services/store';
import { Preloader } from '../ui/preloader';
import { OrderInfoUI } from '../ui/order-info';
import type { TIngredient } from '@utils-types';

import { fetchOrderByNumber } from '../../../src/services/slices/feedSlice/feed-slice';

export const OrderInfo: FC = () => {
  const dispatch = useDispatch();
  const { number: orderNumberStr } = useParams<{ number?: string }>();

  const allIngredients = useSelector(
    (state: RootState) => state.ingredients.data
  );

  const { isLoading } = useSelector((state) => state.feed);

  const feedOrders = useSelector((state: RootState) => state.feed.orders);
  const userOrders = useSelector((state: RootState) => state.feed.userOrders);

  const orderNumber = orderNumberStr ? parseInt(orderNumberStr, 10) : 0;

  const order = useMemo(
    () =>
      feedOrders.find((order) => order.number === orderNumber) ||
      userOrders.find((order) => order.number === orderNumber),
    [feedOrders, userOrders, orderNumber]
  );

  useEffect(() => {
    if (!order && orderNumber) {
      dispatch(fetchOrderByNumber(orderNumber));
    }
  }, [dispatch, order, orderNumber]);

  const orderInfo = useMemo(() => {
    if (!order || !allIngredients.length) {
      return null;
    }

    const ingredientsInfo: { [key: string]: TIngredient & { count: number } } =
      {};

    for (const ingredientId of order.ingredients) {
      const ingredient = allIngredients.find((ing) => ing._id === ingredientId);
      if (!ingredient) {
        continue;
      }
      if (ingredientsInfo[ingredient._id]) {
        ingredientsInfo[ingredient._id].count++;
      } else {
        ingredientsInfo[ingredient._id] = {
          ...ingredient,
          count: 1
        };
      }
    }

    const total = Object.values(ingredientsInfo).reduce(
      (acc, item) => acc + item.price * item.count,
      0
    );

    return {
      ...order,
      ingredientsInfo,
      total,
      date: new Date(order.createdAt)
    };
  }, [order, allIngredients]);

  if (isLoading || !orderInfo) {
    return <Preloader />;
  }

  return <OrderInfoUI orderInfo={orderInfo} />;
};
