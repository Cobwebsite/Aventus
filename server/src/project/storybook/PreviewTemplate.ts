export function previewTemplate() {
	return `import { Preview } from '@storybook/web-components';
 
const preview: Preview = {
  parameters: {
    options: {
      storySort: (a, b) => a.title.localeCompare(b.title),
    },
  },
};
 
export default preview;`
}