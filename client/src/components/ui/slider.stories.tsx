import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './slider';
import { Label } from './label';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    className: 'w-[200px]',
  },
};

export const Range: Story = {
  args: {
    defaultValue: [25, 75],
    max: 100,
    step: 1,
    className: 'w-[200px]',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Creativity Level</Label>
          <span className="text-sm text-muted-foreground">50%</span>
        </div>
        <Slider defaultValue={[50]} max={100} step={1} />
      </div>
    </div>
  ),
};

export const CreativityControl: Story = {
  render: () => (
    <div className="space-y-6 w-[300px]">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Conservative (Preserves more)</Label>
          <span className="text-sm text-muted-foreground">20%</span>
        </div>
        <Slider defaultValue={[20]} max={100} step={5} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Balanced</Label>
          <span className="text-sm text-muted-foreground">50%</span>
        </div>
        <Slider defaultValue={[50]} max={100} step={5} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Creative (More changes)</Label>
          <span className="text-sm text-muted-foreground">80%</span>
        </div>
        <Slider defaultValue={[80]} max={100} step={5} />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    disabled: true,
    className: 'w-[200px]',
  },
};
