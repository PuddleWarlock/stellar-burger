import { FC, SyntheticEvent, useEffect, useState } from 'react';
import { ProfileUI } from '@ui-pages';
import { useDispatch, useSelector } from '../../services/store';
import {
  clearAuth,
  logoutUser,
  updateUser
} from '../../services/slices/authSlice/auth-slice';
import { useNavigate } from 'react-router-dom';

export const Profile: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, error: updateUserError } = useSelector((state) => state.auth);

  const [formValue, setFormValue] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setFormValue({
        name: user.name,
        email: user.email,
        password: ''
      });
    }
  }, [user]);

  const isFormChanged =
    formValue.name !== user?.name ||
    formValue.email !== user?.email ||
    !!formValue.password;

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    const updatedData = {
      name: formValue.name,
      email: formValue.email,
      ...(formValue.password ? { password: formValue.password } : {})
    };
    try {
      await dispatch(updateUser(updatedData)).unwrap();

      if (formValue.password) {
        await dispatch(logoutUser()).unwrap();
        dispatch(clearAuth());
        navigate('/login');
      }
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
    }
  };

  const handleCancel = (e: SyntheticEvent) => {
    e.preventDefault();
    if (user) {
      setFormValue({
        name: user.name,
        email: user.email,
        password: ''
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValue((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <ProfileUI
      formValue={formValue}
      isFormChanged={isFormChanged}
      handleCancel={handleCancel}
      handleSubmit={handleSubmit}
      handleInputChange={handleInputChange}
      updateUserError={updateUserError || undefined}
    />
  );
};
