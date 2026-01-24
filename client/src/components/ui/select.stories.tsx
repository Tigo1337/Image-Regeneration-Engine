import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from './select';
import { Label } from './label';

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a style" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="modern">Modern</SelectItem>
        <SelectItem value="contemporary">Contemporary</SelectItem>
        <SelectItem value="boho">Boho</SelectItem>
        <SelectItem value="industrial">Industrial</SelectItem>
        <SelectItem value="scandinavian">Scandinavian</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-[200px]">
      <Label>Design Style</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="modern">Modern</SelectItem>
          <SelectItem value="contemporary">Contemporary</SelectItem>
          <SelectItem value="boho">Boho</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select quality" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Standard</SelectLabel>
          <SelectItem value="standard">Standard (1080p)</SelectItem>
          <SelectItem value="high">High Fidelity (2K)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Premium</SelectLabel>
          <SelectItem value="ultra">Ultra (4K)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Disabled" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option">Option</SelectItem>
      </SelectContent>
    </Select>
  ),
};
