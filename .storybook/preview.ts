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
        { name: 'light', value: '#fcfcfb' }, // Warm Parchment
        { name: 'dark', value: '#181a18' },  // Deep Charcoal
      ],
    },
  },
};

export default preview;