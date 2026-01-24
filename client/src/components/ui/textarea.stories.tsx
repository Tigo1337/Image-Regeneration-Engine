import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './textarea';
import { Label } from './label';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Type your message here...',
    className: 'w-[300px]',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-[300px]">
      <Label htmlFor="elements">Elements to Preserve</Label>
      <Textarea
        id="elements"
        placeholder="Describe the elements you want to keep unchanged (e.g., sofa, plants, artwork on the wall)..."
      />
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    defaultValue: 'The brown leather sofa in the center, the potted plants by the window, and the wooden coffee table.',
    className: 'w-[300px]',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
    className: 'w-[300px]',
  },
};

export const LargeTextarea: Story = {
  args: {
    placeholder: 'Write a detailed description...',
    className: 'w-[400px] min-h-[150px]',
  },
};
