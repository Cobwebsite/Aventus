import * as connect from 'connect';
import * as send from 'send';
import * as url from 'url';
import { createServer, Server, ServerResponse } from 'http';
import { extname } from 'path';
import { readFileSync } from 'fs';
import { replace } from 'event-stream';
import serveIndex = require('serve-index');
import { INJECTED_CODE } from './injectedCode';
import { WebSocket, WebSocketServer } from 'ws';
import { ServerStart } from '../notification/httpServer/ServerStart';
import { ServerStop } from '../notification/httpServer/ServerStop';
import open = require('open');
import { LiveServerSettings, SettingsManager } from '../settings/Settings';

export class HttpServer {
	private static instance: HttpServer;
	public static getInstance(): HttpServer {
		if (!this.instance) {
			this.instance = new HttpServer();
		}
		return this.instance;
	}


	private config: LiveServerSettings;
	private server: Server<any, any> | undefined;
	private wss: WebSocketServer | undefined;
	private reloadTimeout;
	private clients: WebSocket[] = [];

	private constructor() {
		this.config = SettingsManager.getInstance().settings.liveserver;
	}

	public toggle() {
		if (this.server && this.server.listening) {
			this.stop();
		}
		else {
			this.start();
		}
	}
	public async start() {
		if (!this.server || !this.server.listening) {

			this.config = SettingsManager.getInstance().settings.liveserver;
			var app = connect();
			let staticServer = this.createStaticServer();
			app.use(staticServer)
				.use(this.entryPoint(staticServer, this.config.indexFile))
				.use(serveIndex(this.config.rootFolder, { icons: true }) as any);
			this.server = createServer(app);

			this.server.addListener('listening', (/*e*/) => {
				let host = this.config.host
				if (host == "0.0.0.0") {
					host = "127.0.0.1";
				}
				ServerStart.send(host, this.config.port);
				if (this.config.launch_browser) {
					let config: open.Options = {};
					if (this.config.browser) {
						config = { app: { name: this.config.browser } }
					}

					open(`http://${host}:${this.config.port}`, config)
				}
			})
			this.clients = [];
			this.wss = new WebSocketServer({ server: this.server });
			this.wss.on('connection', (ws) => {
				ws.onclose = () => {
					this.clients = this.clients.filter(function (x) {
						return x !== ws;
					});
				}
				this.clients.push(ws);
			})

			this.server.listen(this.config.port, this.config.host);
		}
	}
	public stop() {
		for (let client of this.clients) {
			client.close();
		}
		this.clients = [];
		if (this.server) {
			this.server.close();
			this.server = undefined;
		}
		if (this.wss) {
			this.wss.close();
			this.wss = undefined;
		}
		ServerStop.send();
	}

	public updateCSS(css: string, element: string, children: string[]) {
		this.send("update_css", { css, element, children });
	}
	public updateComponent(js: string, element: string, children: string[]) {
		this.send("update_component", { js, element, children });
	}
	public updateGlobalCSS(name: string, css: string) {
		this.send("update_global_css", { name, css });
	}
	public reload() {
		if (this.reloadTimeout) {
			clearTimeout(this.reloadTimeout);
		}
		this.reloadTimeout = setTimeout(() => {
			this._reload();
		}, this.config.delay)
	}
	private _reload() {
		this.send("reload", {});
	}
	private send(cmd: string, obj: {}) {
		let message = {
			cmd: cmd,
			params: obj
		}
		let content = JSON.stringify(message);
		for (let client of this.clients) {
			if (client.readyState == WebSocket.OPEN) {
				client.send(content);
			}
		}
	}

	private escape(html: string) {
		return String(html)
			.replace(/&(?!\w+;)/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
	private entryPoint(staticHandler, file) {
		return function (req, res, next) {
			req.url = "/" + file;
			staticHandler(req, res, next);
		};
	}
	private createStaticServer() {
		return (req: connect.IncomingMessage, res: ServerResponse<connect.IncomingMessage>, next: connect.NextFunction) => {
			if (req.method !== "GET" && req.method !== "HEAD") return next();
			var reqpath = url.parse(req.url || '').pathname || '';
			var hasNoOrigin = !req.headers.origin;
			var injectCandidates = [new RegExp("</head>", "i"), new RegExp("</body>", "i")];
			var injectTag: string | null = null;

			if (req.url?.startsWith("/?get_injected_code")) {
				// /?get_injected_code&host=123
				let host = req.headers.host;
				if (!host) {
					host = this.config.host;
					let splited = req.url.split("&");
					if (splited.length > 1) {
						host = splited[1].replace("host=", '');
					}
					if (host == "0.0.0.0") {
						host = "127.0.0.1";
					}
					host += ":" + this.config.port;
				}
				
				let newUrl = 'ws://' + host + '/ws';
				let manualCode = INJECTED_CODE.replace('<script type="text/javascript">', '');
				manualCode = manualCode.replace("var address = protocol + window.location.host + window.location.pathname + '/ws';", "var address = '" + newUrl + "';")
				manualCode = manualCode.replace('</script>', '');
				res.setHeader('Content-Length', manualCode.length);
				res.setHeader('Content-type', 'text/javascript');
				res.setHeader('Access-Control-Allow-Origin', '*');
				res.write(manualCode, 'utf8');
				res.end();
				return;
			}

			const directory = () => {
				var pathname = url.parse(req.originalUrl || '').pathname;
				res.statusCode = 301;
				res.setHeader('Location', pathname + '/');
				res.end('Redirecting to ' + this.escape(pathname || '') + '/');
			}

			function file(filepath /*, stat*/) {
				var x = extname(filepath).toLocaleLowerCase(), match,
					possibleExtensions = ["", ".html"];
				if (hasNoOrigin && (possibleExtensions.indexOf(x) > -1)) {
					// TODO: Sync file read here is not nice, but we need to determine if the html should be injected or not
					var contents = readFileSync(filepath, "utf8");
					for (var i = 0; i < injectCandidates.length; ++i) {
						match = injectCandidates[i].exec(contents);
						if (match) {
							injectTag = match[0];
							break;
						}
					}

				}
			}

			function error(err) {
				if (err.status === 404) return next();
				next(err);
			}

			const inject = (stream) => {
				if (injectTag) {
					let tagToUse = injectTag;
					let addedCode = INJECTED_CODE;
					if (this.config.auto_close) {
						addedCode = addedCode.replace("//onclose", "socket.onclose = function () { window.close(); }")
					}
					// We need to modify the length given to browser
					var len = addedCode.length + Number(res.getHeader('Content-Length'));
					res.setHeader('Content-Length', len);
					var originalPipe = stream.pipe;

					stream.pipe = function (resp) {
						originalPipe.call(stream, replace(new RegExp(tagToUse, "i"), addedCode + injectTag)).pipe(resp);
					};
				}
			}

			send(req, reqpath, { root: this.config.rootFolder })
				.on('error', error)
				.on('directory', directory)
				.on('file', file)
				.on('stream', inject)
				.pipe(res);
		};
	}
}