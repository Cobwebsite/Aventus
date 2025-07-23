import { BaseTemplate } from './BaseTemplate'
import { ComponentTemplate } from './ComponentTemplate'
import { DataTemplate } from './DataTemplate'
import { LibraryTemplate } from './LibraryTemplate'
import { RamTemplate } from './RamTemplate'
import { StateManagerTemplate } from './StateManagerTemplate'
import { StateTemplate } from './StateTemplate'


export const BaseTemplateList = {
	ComponentTemplate,
	DataTemplate,
	LibraryTemplate,
	RamTemplate,
	StateManagerTemplate,
	StateTemplate
} as { [key: string]: new (...args: any[]) => BaseTemplate };