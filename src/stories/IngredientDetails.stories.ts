import { IngredientDetailsUI } from '@ui';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Example/IngredientDetails',
  component: IngredientDetailsUI,

  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof IngredientDetailsUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultIngredientDetails: Story = {
  args: {
    ingredientData: {
      _id: '111',
      name: 'Начинка',
      type: 'main',
      proteins: 23,
      fat: 34,
      carbohydrates: 45,
      calories: 56,
      price: 67,
      image: '',
      image_large: '',
      image_mobile: ''
    }
  }
};
