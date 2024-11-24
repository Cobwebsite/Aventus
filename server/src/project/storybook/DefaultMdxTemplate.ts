export function defaultMdxTempate() {
	return `import Meta from './$name$.stories'
$blocks$
$render$

$tag$

$live$
`
}