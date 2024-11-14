import { Command } from "commander";

export type ActionOption = {
	name: string[] | string,
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


export abstract class Action {

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
				_arguments.push(this.argsNb[i]);
			}
			const options = args[this.argsNb];

			await this.run(_arguments, options);
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
		this.registerOptions((option: ActionOption) => {
			if (!Array.isArray(option.name)) {
				option.name = [option.name];
			}
			let names = option.name.map(p => '--' + p);
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
	protected abstract registerOptions(addOption: (option: ActionOption) => void);



	public abstract run(args: string[], options: { [key: string]: string }): Promise<void> | void

}