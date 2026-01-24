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
      disable: true,
    },
  },
  decorators: [
    (Story) => {
      document.documentElement.classList.add('dark');
      return Story();
    },
  ],
};

export default preview;
