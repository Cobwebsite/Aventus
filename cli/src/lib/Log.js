// /**
//  * `input` type prompt
//  */

// import { filter, share } from 'rxjs';
// import { Server } from '../Server';
// import observe from 'inquirer/lib/utils/events.js'
// import Base from 'inquirer/lib/prompts/base.js'

// export default async () => {
// 	// const observe = (await (eval('import("inquirer/lib/utils/events.js")'))).default;
// 	// const Base = (await (eval('import("inquirer/lib/prompts/base.js")'))).default;

// 	return class Log extends Base {

// 		constructor(questions, rl, answers) {
// 			super(questions, rl, answers);
// 			this.errors = Server.getErrors().join("\r\n");
// 			this.onErrorRefresh = this.onErrorRefresh.bind(this);
// 		}

// 		/**
// 		 * Start the Inquiry session
// 		 * @param  {Function} cb      Callback when prompt is done
// 		 * @return {this}
// 		 */

// 		_run(cb) {
// 			this.done = cb;
// 			Server.subscribeErrors(this.onErrorRefresh);

// 			// Once user confirm (enter key)
// 			const events = observe(this.rl);

// 			events.keypress.pipe(
// 				filter(({ key }) => key.name === 'l' && key.ctrl),
// 				share()
// 			)
// 				.forEach(this.onCancelKey.bind(this));

// 			// Init
// 			this.render();

// 			return this;
// 		}

// 		/**
// 		 * Render the prompt to screen
// 		 * @return {InputPrompt} self
// 		 */

// 		render() {
// 			this.screen.render(this.errors, '');
// 		}

// 		renderDelay() {
// 			clearTimeout(this.timeout);
// 			this.timeout = setTimeout(() => {
// 				this.render();
// 			}, 1000)
// 		}

// 		onErrorRefresh(errs) {
// 			this.errors = errs.join("\r\n");
// 			this.renderDelay();
// 		}


// 		onCancelKey() {
// 			Server.unsubscribeErrors(this.onErrorRefresh);
// 			this.screen.done();
// 			this.done(null);
// 		}
// 	}
// }