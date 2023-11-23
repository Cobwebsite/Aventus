if ('WebSocket' in window) {
	(function () {

		var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
		var address = protocol + window.location.host + window.location.pathname + '/ws';
		var socket = new WebSocket(address);
		const getElement = function (name) {
			let current = window
			let splitted = name.split(".")
			for (let part of splitted) {
				if (!current[part]) {
					return null;
				}
				current = current[part];
			}
			return current;
		}
		const setElement = function (name, cst) {
			let current = window
			let splitted = name.split(".")
			for (let i = 0; i < splitted.length - 1; i++) {
				let part = splitted[i];
				if (!current[part]) {
					return null;
				}
				current = current[part];
			}
			if (current) {
				current[splitted[splitted.length - 1]] = cst;
			}
			return current;
		}
		socket.onmessage = function (ev) {
			try {
				let content = ev.data;
				let message = JSON.parse(content);
				if (message.cmd == "reload") {
					window.location.reload(true);
				}
				else if (message.cmd == "update_css") {
					let element = getElement(message.params.element);
					if (element) {
						element.__style = message.params.css;
						let allInstances = Aventus.WebComponentInstance.getAllInstances(element);
						let checkedType = [];
						for (let webComp of allInstances) {
							let cst = webComp.constructor;
							if (!checkedType.includes(cst) && cst.__styleSheets['@local']) {
								checkedType.push(cst);
								let styleTxt = webComp.__getStyle().join("\\r\\n");
								cst.__styleSheets['@local'].replaceSync(styleTxt)
							}
						}
					}
				}
				else if (message.cmd == "update_global_css") {
					Aventus.Style.store(message.params.name, message.params.css)
				}
				else if (message.cmd == "update_component") {
					let element = getElement(message.params.element);
					if (element) {
						eval(`var __aventusHotReload = \${message.params.js}`);
						let oldProps = Object.getOwnPropertyNames(element.prototype);
						let newProps = Object.getOwnPropertyNames(__aventusHotReload.prototype);
						let avoidProps = ['__getStatic', '__getStyle'];
						for (let newPropName of newProps) {
							let index = oldProps.indexOf(newPropName)
							if (index != -1) {
								oldProps.splice(index, 1);
							}
							if (avoidProps.includes(newPropName)) {
								continue;
							}
							let descriptor = Object.getOwnPropertyDescriptor(element.prototype, newPropName);
							let descriptor2 = Object.getOwnPropertyDescriptor(__aventusHotReload.prototype, newPropName);
							if (descriptor && descriptor.writable) {
								element.prototype[newPropName] = __aventusHotReload.prototype[newPropName];
							}
							else if (descriptor && descriptor2) {
								if (descriptor.get) {
									descriptor.get = descriptor2.get;
								}
								if (descriptor.set) {
									descriptor.set = descriptor2.set;
								}
							}
						}
						for (let oldPropName of oldProps) {
							delete element.prototype[oldPropName];
						}
						Object.defineProperty(__aventusHotReload, '__styleSheets', {
							get() { return element.__styleSheets }
						})
						element.__template = null;
						let allInstances = Aventus.WebComponentInstance.getAllInstances(element)
						for (let webComp of allInstances) {
							let newInstance = new element();

							for (let attr of webComp.attributes) {
								newInstance[attr.name] = attr.value;
							}
							if (webComp.parentNode) {
								webComp.parentNode.insertBefore(newInstance, webComp);
							}
							webComp.remove();
							webComp.destructor();
						}
					}
				}
			}
			catch (e) { console.log(e); }
		}
		socket.onerror = function () {
			window.close();
		}
		//onclose
	})();
}