import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './switch';
import { Label } from './label';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Preserve original colors</Label>
    </div>
  ),
};

export const SettingsExample: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <div className="flex items-center justify-between">
        <Label htmlFor="high-quality">High Quality Mode</Label>
        <Switch id="high-quality" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="preserve">Preserve Furniture</Label>
        <Switch id="preserve" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications">Email Notifications</Label>
        <Switch id="notifications" />
      </div>
    </div>
  ),
};
