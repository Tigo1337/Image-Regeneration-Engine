import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingOverlay } from './loading-overlay';

const meta = {
  title: 'Components/LoadingOverlay',
  component: LoadingOverlay,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="relative h-[400px] bg-background">
      <LoadingOverlay />
    </div>
  ),
};

export const InContainer: Story = {
  render: () => (
    <div className="relative h-[300px] w-[400px] border rounded-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Room Design</h2>
        <p className="text-muted-foreground">Your design is being generated...</p>
      </div>
      <LoadingOverlay />
    </div>
  ),
};
