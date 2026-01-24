import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './progress';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
    className: 'w-[300px]',
  },
};

export const Empty: Story = {
  args: {
    value: 0,
    className: 'w-[300px]',
  },
};

export const Full: Story = {
  args: {
    value: 100,
    className: 'w-[300px]',
  },
};

export const ProgressSteps: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Uploading image...</span>
          <span>25%</span>
        </div>
        <Progress value={25} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Processing...</span>
          <span>50%</span>
        </div>
        <Progress value={50} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Generating design...</span>
          <span>75%</span>
        </div>
        <Progress value={75} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Complete!</span>
          <span>100%</span>
        </div>
        <Progress value={100} />
      </div>
    </div>
  ),
};
