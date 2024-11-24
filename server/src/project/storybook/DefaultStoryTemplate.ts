export function defaultStoryTempate() {
	return `import type { Meta, Story } from '@aventusjs/storybook'
import Template from './$name$_.mdx'

const meta: Meta = {
	title: '$fullname$',
	parameters: {
        docs: {
            page: Template,
            description: {
                component: \`$description$\`
            },
        }
    },
    $argTypes$
    $args$
    $aventus$
}

export default meta;

$defaultStory$
`
}

export function defaultStoryTempateComponent() {
	return `import { type Meta, type Story, render } from '@aventusjs/storybook'
import Template from './$name$_.mdx'
$importPathes$

const meta: Meta = {
	title: '$fullname$',
    render: (args) => render(args, $name$),
	parameters: {
        docs: {
            page: Template,
            description: {
                component: \`$description$\`
            },
        }
    },
    $argTypes$
    $args$
    $aventus$
}

export default meta;

$defaultStory$
`
}