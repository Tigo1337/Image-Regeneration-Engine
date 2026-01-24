import type { Preview } from "@storybook/react";
import '../client/src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#fcfcfb' },
        { name: 'dark', value: '#181a18' },
      ],
    },
  },
};

export default preview;