import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with any elements you need.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create Design</CardTitle>
        <CardDescription>Enter your room design preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="style">Design Style</Label>
          <Input id="style" placeholder="Modern, Contemporary..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preserve">Elements to Preserve</Label>
          <Input id="preserve" placeholder="Sofa, plants..." />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Generate</Button>
      </CardFooter>
    </Card>
  ),
};

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[300px] p-6">
      <p className="text-sm text-muted-foreground">
        A simple card with just content and padding.
      </p>
    </Card>
  ),
};

export const PricingCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader>
        <CardTitle>Pro Plan</CardTitle>
        <CardDescription>For professional designers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">$79</div>
        <p className="text-sm text-muted-foreground">/month</p>
        <ul className="mt-4 space-y-2 text-sm">
          <li>Unlimited room redesigns</li>
          <li>4K quality output</li>
          <li>Priority processing</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Subscribe</Button>
      </CardFooter>
    </Card>
  ),
};
