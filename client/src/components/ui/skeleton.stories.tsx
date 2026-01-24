import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'w-[200px] h-[20px]',
  },
};

export const Circle: Story = {
  args: {
    className: 'w-12 h-12 rounded-full',
  },
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="flex flex-col space-y-3 w-[300px]">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
};

export const UserProfileSkeleton: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  ),
};

export const GallerySkeleton: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[400px]">
      <Skeleton className="h-[100px] rounded-lg" />
      <Skeleton className="h-[100px] rounded-lg" />
      <Skeleton className="h-[100px] rounded-lg" />
      <Skeleton className="h-[100px] rounded-lg" />
      <Skeleton className="h-[100px] rounded-lg" />
      <Skeleton className="h-[100px] rounded-lg" />
    </div>
  ),
};
