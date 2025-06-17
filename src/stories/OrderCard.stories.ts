import { OrderCardUI } from '@ui';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Example/OrderCard',
  component: OrderCardUI,

  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof OrderCardUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultOrderCard: Story = {
  args: {
    orderInfo: {
      ingredientsInfo: [
        {
          _id: '111',
          name: 'Булка',
          type: 'top',
          proteins: 12,
          fat: 33,
          carbohydrates: 22,
          calories: 33,
          price: 123,
          image: '',
          image_large: '',
          image_mobile: ''
        }
      ],
      ingredientsToShow: [
        {
          _id: '111',
          name: 'Булка',
          type: 'top',
          proteins: 12,
          fat: 33,
          carbohydrates: 22,
          calories: 33,
          price: 123,
          image: '',
          image_large: '',
          image_mobile: ''
        },
        {
          _id: '111',
          name: 'Начинка',
          type: 'top',
          proteins: 12,
          fat: 33,
          carbohydrates: 22,
          calories: 33,
          price: 123,
          image: '',
          image_large: '',
          image_mobile: ''
        }
      ],
      remains: 2,
      total: 2,
      date: new Date('2024-01-25'),
      _id: '32',
      status: 'ready',
      name: 'Начинка',
      createdAt: '',
      updatedAt: '',
      number: 3,
      ingredients: ['Булка', 'Начинка']
    },
    maxIngredients: 5,
    locationState: {
      background: {
        hash: '',
        key: 'eitkep27',
        pathname: '/',
        search: '',
        state: null
      }
    }
  }
};
