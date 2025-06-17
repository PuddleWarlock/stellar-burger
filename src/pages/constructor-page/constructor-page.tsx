import { useSelector, useDispatch } from '../../services/store';
import { useEffect } from 'react';
import { fetchIngredients } from '../../services/slices/ingredientsSlice/ingredients-slice';
import styles from './constructor-page.module.css';
import { BurgerIngredients } from '../../components';
import { BurgerConstructor } from '../../components';
import { Preloader } from '../../components/ui';

export const ConstructorPage = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.ingredients);

  useEffect(() => {
    dispatch(fetchIngredients());
  }, [dispatch]);

  if (isLoading) return <Preloader />;
  if (error)
    return <div className='text text_type_main-default mt-10'>{error}</div>;

  return (
    <main className={styles.containerMain}>
      <h1 className='text text_type_main-large mt-10 mb-5 pl-5'>
        Соберите бургер
      </h1>
      <div className={`${styles.main} pl-5 pr-5`}>
        <BurgerIngredients />
        <BurgerConstructor />
      </div>
    </main>
  );
};
