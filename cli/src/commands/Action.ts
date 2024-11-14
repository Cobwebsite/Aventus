import { Command } from "commander";

export type ActionOption<T extends { [name: string]: any }> = {
	name: keyof T,
	shortName?: string[] | string,
	type?: string,
	required?: boolean,
	typeIsArray?: boolean,
	typeIsRequired?: boolean,
	description: string,
	defaultValue?: string | boolean | string[]
}
export type ArgOption = {
	type?: string,
	typeIsArray?: boolean,
	typeIsRequired?: boolean,
	description: string,
	defaultValue?: string | boolean | string[]
}


export abstract class Action<T extends { [name: string]: any }> {

	public abstract get name(): string;
	public abstract get description(): string;

	private argsNb: number = 0;

	public register(program: Command) {
		let cmd = program
			.command(this.name)
			.description(this.description);
		cmd = this._registerArgs(cmd);
		cmd = this._registerOptions(cmd);
		cmd.action(async (...args: any[]) => {
			const _arguments: string[] = [];
			for (let i = 0; i < this.argsNb; i++) {
				_arguments.push(args[i]);
			}
			const options = args[this.argsNb];

			await this.run(_arguments, options);
			console.log("done");
			process.exit(0);
		})
	}

	private _registerArgs(program: Command): Command {
		this.registerArgs((option: ArgOption) => {
			let part1 = '';
			if (option.type) {
				let typeStart = '<';
				let typeEnd = '>';
				if (option.typeIsRequired !== undefined && !option.typeIsRequired) {
					typeStart = '[';
					typeEnd = ']';
				}
				if (option.typeIsArray) {
					typeEnd = '...' + typeEnd;
				}
				part1 += `${typeStart}${option.type}${typeEnd}`;
			}
			this.argsNb++;
			program = program.argument(part1, option.description, option.defaultValue);
		});
		return program;
	}

	/**
	 * Define options like --interactive
	 */
	protected abstract registerArgs(addArg: (arg: ArgOption) => void);


	private _registerOptions(program: Command) {
		this.registerOptions((option: ActionOption<T>) => {

			option.name = '--' + (option.name as string);
			let names = [option.name];
			if (option.shortName) {
				if (!Array.isArray(option.shortName)) {
					option.shortName = [option.shortName];
				}
				for (let shortName of option.shortName) {
					names.push('-' + shortName);
				}
			}
			let part1 = names.join(", ");
			if (option.type) {
				let typeStart = '<';
				let typeEnd = '>';
				if (option.typeIsRequired !== undefined && !option.typeIsRequired) {
					typeStart = '[';
					typeEnd = ']';
				}
				if (option.typeIsArray) {
					typeEnd = '...' + typeEnd;
				}
				part1 += ` ${typeStart}${option.type}${typeEnd}`;
			}

			if (option.required) {
				program = program.requiredOption(part1, option.description, option.defaultValue)
			}
			else {
				program = program.option(part1, option.description, option.defaultValue);
			}
		});
		return program;
	}
	/**
	 * Define options like --interactive
	 * @param addOption 
	 */
	protected abstract registerOptions(addOption: (option: ActionOption<T>) => void);



	public abstract run(args: string[], options: T): Promise<void> | void

}