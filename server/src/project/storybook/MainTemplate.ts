export function mainTemplate() {
	return `import type { StorybookConfig } from "@storybook/web-components-vite";
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  stories: ["$path$/**/!(*_).mdx", "$path$/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-styling-webpack",
    {
      name: '@storybook/addon-docs',
      options: {
        csfPluginOptions: null,
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  framework: {
    name: "@storybook/web-components-vite",
    options: {},
  },
  managerHead: (head) => \`
    \${head}
    <style>.sidebar-item[data-item-id$="--default-story"] { display: none; }</style>
  \`,
  staticDirs: ['../static'],
  docs: {
    autodocs: true
  }
};
export default config;
`
}