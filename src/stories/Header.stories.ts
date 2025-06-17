import type { Meta, StoryObj } from '@storybook/react';

import { AppHeaderUI } from '@ui';

const meta = {
  title: 'Example/Header',
  component: AppHeaderUI,

  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof AppHeaderUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  args: {
    userName: 'John Doe'
  }
};

export const LoggedOut: Story = {
  args: {
    userName: undefined
  }
};
