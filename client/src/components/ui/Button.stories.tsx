import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const PrimarySage: Story = {
  args: {
    children: 'Reimagine Room',
    variant: 'default',
    className: 'hover-elevate active-elevate',
  },
};

export const Outline: Story = {
  args: {
    children: 'Save Design',
    variant: 'outline',
  },
};