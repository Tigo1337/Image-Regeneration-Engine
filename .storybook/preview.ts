import type { Preview } from "@storybook/react";
import '../client/src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#ece9e5' }, // Deep Linen
        { name: 'dark', value: '#121417' },  // Deep Obsidian
      ],
    },
  },
};

export default preview;