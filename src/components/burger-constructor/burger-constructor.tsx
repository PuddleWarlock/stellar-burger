import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RootState, useDispatch, useSelector } from '../../services/store';
import { BurgerConstructorUI } from '@ui';
import {
  placeOrder,
  closeOrderModal
} from '../../services/slices/burgerSlice/burger-slice';

export const BurgerConstructor: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  const constructorItems = useSelector(
    (state: RootState) => state.burger.constructorItems
  );
  const orderRequest = useSelector(
    (state: RootState) => state.burger.orderRequest
  );
  const orderModalData = useSelector(
    (state: RootState) => state.burger.orderModalData
  );

  const onOrderClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!constructorItems.bun || orderRequest) return;

    const ingredientIds = [
      constructorItems.bun._id,
      ...constructorItems.ingredients.flatMap((i) =>
        Array(i.count ?? 1).fill(i._id)
      )
    ];

    dispatch(placeOrder(ingredientIds));
  };

  const closeModal = () => {
    dispatch(closeOrderModal());
  };

  const price = React.useMemo(() => {
    const bunPrice = constructorItems.bun ? constructorItems.bun.price * 2 : 0;
    const ingredientsPrice = constructorItems.ingredients.reduce(
      (sum, item) => sum + item.price * (item.count ?? 1),
      0
    );
    return bunPrice + ingredientsPrice;
  }, [constructorItems]);

  return (
    <BurgerConstructorUI
      price={price}
      orderRequest={orderRequest}
      constructorItems={constructorItems}
      orderModalData={orderModalData}
      onOrderClick={onOrderClick}
      closeOrderModal={closeModal}
    />
  );
};
