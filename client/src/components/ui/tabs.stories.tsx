import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="upload" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="url">Image URL</TabsTrigger>
      </TabsList>
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>
              Drag and drop your room image or click to browse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              Drop your image here
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="url">
        <Card>
          <CardHeader>
            <CardTitle>Image URL</CardTitle>
            <CardDescription>
              Enter a URL to your room image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="url">URL</Label>
              <Input id="url" placeholder="https://example.com/room.jpg" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const DesignStyles: Story = {
  render: () => (
    <Tabs defaultValue="modern" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="modern">Modern</TabsTrigger>
        <TabsTrigger value="contemporary">Contemporary</TabsTrigger>
        <TabsTrigger value="boho">Boho</TabsTrigger>
        <TabsTrigger value="industrial">Industrial</TabsTrigger>
      </TabsList>
      <TabsContent value="modern" className="p-4">
        <h3 className="font-semibold mb-2">Modern Style</h3>
        <p className="text-muted-foreground">Clean lines, minimalist approach, and neutral colors with bold accents.</p>
      </TabsContent>
      <TabsContent value="contemporary" className="p-4">
        <h3 className="font-semibold mb-2">Contemporary Style</h3>
        <p className="text-muted-foreground">Current trends, curved furniture, and a mix of textures.</p>
      </TabsContent>
      <TabsContent value="boho" className="p-4">
        <h3 className="font-semibold mb-2">Bohemian Style</h3>
        <p className="text-muted-foreground">Eclectic mix, warm colors, plants, and global-inspired patterns.</p>
      </TabsContent>
      <TabsContent value="industrial" className="p-4">
        <h3 className="font-semibold mb-2">Industrial Style</h3>
        <p className="text-muted-foreground">Raw materials, exposed brick, metal accents, and urban aesthetic.</p>
      </TabsContent>
    </Tabs>
  ),
};
