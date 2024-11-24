import type { Stats } from 'node:fs'
import type { Theme } from '@inquirer/core'
import type { PartialDeep } from '@inquirer/type'
import fs from 'node:fs'
import path from 'node:path'
import type { KeypressEvent } from '@inquirer/core'

/**
 * ANSI escape code to hide the cursor
 */
export const CURSOR_HIDE = '\x1B[?25l'

/**
 * Check if the given key is the escape key
 */
export function isEscapeKey(key: KeypressEvent): boolean {
	return key.name === 'escape'
}

/**
 * Add a trailing slash at the end of the given path if it doesn't already have one
 */
export function ensureTrailingSlash(dir: string): string {
	return dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`
}

/**
 * Strip ANSI codes from the given string
 */
export function stripAnsiCodes(str: string): string {
	return str.replace(/\x1B\[\d+m/g, '')
}

/**
 * Get the maximum length of the given array of strings
 */
export function getMaxLength(arr: string[]): number {
	return arr.reduce(
		(max, item) => Math.max(max, stripAnsiCodes(item).length),
		0
	)
}

/**
 * Get files of a directory
 */
export function getDirFiles(dir: string): FileStats[] {
	return fs.readdirSync(dir).map(filename => {
		const filepath = path.join(dir, filename)
		const fileStat = fs.statSync(filepath)

		return Object.assign(fileStat, {
			name: filename,
			path: filepath,
			isDisabled: false
		})
	})
}

/**
 * Sort files, optionally filtering out disabled files if `showExcluded` is `false`
 */
export function sortFiles(
	files: FileStats[],
	showExcluded: boolean
): FileStats[] {
	return files
		.sort((a, b) => {
			// a is disabled, should come last
			if (a.isDisabled && !b.isDisabled) {
				return 1
			}

			// b is disabled, should come last
			if (!a.isDisabled && b.isDisabled) {
				return -1
			}

			// a is dir, should come first
			if (a.isDirectory() && !b.isDirectory()) {
				return -1
			}

			// b is dir, should come first
			if (!a.isDirectory() && b.isDirectory()) {
				return 1
			}

			// both are files or dirs, regardless of whether they are disabled - sort by name
			return a.name.localeCompare(b.name)
		})
		.filter(file => showExcluded || !file.isDisabled)
}


export type FileSelectorTheme = {
	prefix: {
		/**
		 * The prefix to use for the idle status.
		 * @default chalk.cyan('?')
		 */
		idle: string
		/**
		 * The prefix to use for the done status.
		 * @default chalk.green(figures.tick)
		 */
		done: string
		/**
		 * The prefix to use for the canceled status.
		 * @default chalk.red(figures.cross)
		 */
		canceled: string
	}
	icon: {
		/**
		 * The prefix to use for the line.
		 * @default isLast => isLast ? └── : ├──
		 */
		linePrefix: (isLast: boolean) => string
	}
	style: {
		/**
		 * The style to use for the disabled items.
		 * @default chalk.dim
		 */
		disabled: (text: string) => string
		/**
		 * The style to use for the active item.
		 * @default chalk.cyan
		 */
		active: (text: string) => string
		/**
		 * The style to use for the cancel text.
		 * @default chalk.red
		 */
		cancelText: (text: string) => string
		/**
		 * The style to use for the empty text.
		 * @default chalk.red
		 */
		emptyText: (text: string) => string
		/**
		 * The style to use for items of type directory.
		 * @default chalk.yellow
		 */
		directory: (text: string) => string
		/**
		 * The style to use for items of type file.
		 * @default chalk.white
		 */
		file: (text: string) => string
		/**
		 * The style to use for the current directory header.
		 * @default chalk.magenta
		 */
		currentDir: (text: string) => string
		/**
		 * The style to use for the message.
		 * @default chalk.bold
		 */
		message: (text: string, status: Status) => string
		/**
		 * The style to use for the key bindings help.
		 * @default chalk.white
		 */
		help: (text: string) => string
		/**
		 * The style to use for the keys in the key bindings help.
		 * @default chalk.cyan
		 */
		key: (text: string) => string
	}
}

export type FileStats = Stats & {
	/**
	 * The name of the file or directory.
	 */
	name: string
	/**
	 * The path to the file or directory.
	 */
	path: string
	/**
	 * If the file or directory is disabled, it will be displayed in the list with the `disabledLabel` property.
	 *
	 * Set to `true` if the `filter` function returns `false`.
	 */
	isDisabled: boolean
}

export type FileSelectorConfig = {
	message: string
	/**
	 * The path to the directory where it will be started.
	 * @default process.cwd()
	 */
	basePath?: string
	/**
	 * The type of elements that are valid selection options.
	 * @default 'file'
	 */
	type?: 'file' | 'directory' | 'file+directory'
	/**
	 * The maximum number of items to display in the list.
	 * @default 10
	 */
	pageSize?: number
	/**
	 * If `true`, the list will loop from the last item to the first item and vice versa.
	 * @default false
	 */
	loop?: boolean
	/**
	 * A function to filter files and directories. It returns `true` to include the file or directory in the list,
	 * and `false` to exclude it.
	 *
	 * If not provided, all files and directories will be included by default.
	 */
	filter?: (file: FileStats) => boolean
	/**
	 * If `true`, the list will include files and directories that are excluded by the `filter` function.
	 * @default false
	 */
	showExcluded?: boolean
	/**
	 * The label to display when a file is disabled.
	 * @default ' (not allowed)'
	 */
	disabledLabel?: string
	/**
	 * If true, the prompt will allow the user to cancel the selection.
	 * @default false
	 */
	allowCancel?: boolean
	/**
	 * The message to display when the user cancels the selection.
	 * @default 'Canceled.'
	 */
	cancelText?: string
	/**
	 * The message that will be displayed when the directory is empty.
	 * @default 'Directory is empty.'
	 */
	emptyText?: string
	/**
	 * The theme to use for the file selector.
	 */
	theme?: PartialDeep<Theme<FileSelectorTheme>>
}

/**
 * Internal types
 */

export type Status = 'idle' | 'done' | 'canceled'