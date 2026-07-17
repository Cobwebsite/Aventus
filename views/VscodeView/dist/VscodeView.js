if(!Object.hasOwn(window, "AvInstance")) {
	Object.defineProperty(window, "AvInstance", {
		get() {return Aventus?.Instance;}
	});

	(() => {
		Map.prototype._defaultHas = Map.prototype.has;
		Map.prototype._defaultSet = Map.prototype.set;
		Map.prototype._defaultGet = Map.prototype.get;
		Map.prototype.has = function(key) {
			if(Aventus.Watcher?.is(key)) {
				return Map.prototype._defaultHas.call(this,key.getTarget())
			}
			return Map.prototype._defaultHas.call(this,key);
		}

		Map.prototype.set = function(key, value) {
			if(Aventus.Watcher?.is(key)) {
				return Map.prototype._defaultSet.call(this, key.getTarget(), value)
			}
			return Map.prototype._defaultSet.call(this, key, value);
		}
		Map.prototype.get = function(key) {
			if(Aventus.Watcher?.is(key)) {
				return Map.prototype._defaultGet.call(this, key.getTarget())
			}
			return Map.prototype._defaultGet.call(this, key);
		}
	})();
}
var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `Aventus`;
const _ = {};


let _n;
let uuidv4=function uuidv4() {
    let uid = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16));
    return uid;
}
__as1(_, 'uuidv4', uuidv4);

let DateConverter=class DateConverter {
    static __converter = new DateConverter();
    static get converter() {
        return this.__converter;
    }
    static set converter(value) {
        this.__converter = value;
    }
    isStringDate(txt) {
        return /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3,6})Z$/.exec(txt) !== null;
    }
    fromString(txt) {
        return new Date(txt);
    }
    toString(date) {
        if (date.getFullYear() < 100) {
            return "0001-01-01T00:00:00.000Z";
        }
        return date.toISOString();
    }
}
DateConverter.Namespace=`Aventus`;
__as1(_, 'DateConverter', DateConverter);

let ConverterTransform=class ConverterTransform {
    transform(data) {
        return this.transformLoop(data);
    }
    createInstance(data) {
        if (data.$type) {
            let cst = Converter.info.get(data.$type);
            if (cst) {
                return new cst();
            }
        }
        return undefined;
    }
    beforeTransformObject(obj) {
    }
    afterTransformObject(obj) {
    }
    transformLoop(data) {
        if (data === null) {
            return data;
        }
        if (Array.isArray(data)) {
            let result = [];
            for (let element of data) {
                result.push(this.transformLoop(element));
            }
            return result;
        }
        if (data instanceof Date) {
            return data;
        }
        if (typeof data === 'object' && !/^\s*class\s+/.test(data.toString())) {
            let objTemp = this.createInstance(data);
            if (objTemp) {
                if (objTemp instanceof Map) {
                    if (data.values) {
                        for (const keyValue of data.values) {
                            objTemp.set(this.transformLoop(keyValue[0]), this.transformLoop(keyValue[1]));
                        }
                    }
                    return objTemp;
                }
                let obj = objTemp;
                this.beforeTransformObject(obj);
                if (obj.fromJSON) {
                    obj = obj.fromJSON(data);
                }
                else {
                    obj = Json.classFromJson(obj, data, {
                        transformValue: (key, value) => {
                            if (obj[key] instanceof Date) {
                                return value ? new Date(value) : null;
                            }
                            else if (typeof value == 'string' && DateConverter.converter.isStringDate(value)) {
                                return value ? DateConverter.converter.fromString(value) : null;
                            }
                            else if (obj[key] instanceof Map) {
                                let map = new Map();
                                if ("$type" in value && value['$type'] == "Aventus.Map") {
                                    value = value.values;
                                }
                                for (const keyValue of value) {
                                    map.set(this.transformLoop(keyValue[0]), this.transformLoop(keyValue[1]));
                                }
                                return map;
                            }
                            else if (obj instanceof Data) {
                                let cst = obj.constructor;
                                if (cst.$schema[key] == 'boolean') {
                                    return value ? true : false;
                                }
                                else if (cst.$schema[key] == 'number') {
                                    return isNaN(Number(value)) ? 0 : Number(value);
                                }
                                else if (cst.$schema[key] == 'number') {
                                    return isNaN(Number(value)) ? 0 : Number(value);
                                }
                                else if (cst.$schema[key] == 'Date') {
                                    return value ? new Date(value) : null;
                                }
                            }
                            return this.transformLoop(value);
                        }
                    });
                }
                this.afterTransformObject(obj);
                return obj;
            }
            let result = {};
            for (let key in data) {
                result[key] = this.transformLoop(data[key]);
            }
            return result;
        }
        if (typeof data == 'string' && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(data)) {
            return new Date(data);
        }
        return data;
    }
    copyValuesClass(target, src, options) {
        const realOptions = {
            isValidKey: options?.isValidKey ?? (() => true),
            replaceKey: options?.replaceKey ?? ((key) => key),
            transformValue: options?.transformValue ?? ((key, value) => value),
        };
        this.__classCopyValues(target, src, realOptions);
    }
    __classCopyValues(target, src, options) {
        let props = Object.getOwnPropertyNames(target);
        for (let prop of props) {
            let propInfo = Object.getOwnPropertyDescriptor(target, prop);
            if (propInfo?.writable) {
                if (options.isValidKey(prop)) {
                    const _target = target;
                    const _src = src;
                    _target[options.replaceKey(prop)] = options.transformValue(prop, _src[prop]);
                }
            }
        }
        let cstTemp = target.constructor;
        while (cstTemp.prototype && cstTemp != Object.prototype) {
            props = Object.getOwnPropertyNames(cstTemp.prototype);
            for (let prop of props) {
                let propInfo = Object.getOwnPropertyDescriptor(cstTemp.prototype, prop);
                if (propInfo?.set && propInfo.get) {
                    if (options.isValidKey(prop)) {
                        const _target = target;
                        const _src = src;
                        _target[options.replaceKey(prop)] = options.transformValue(prop, _src[prop]);
                    }
                }
            }
            cstTemp = Object.getPrototypeOf(cstTemp);
        }
    }
}
ConverterTransform.Namespace=`Aventus`;
__as1(_, 'ConverterTransform', ConverterTransform);

let Json=class Json {
    /**
     * Converts a JavaScript class instance to a JSON object.
     * @template T - The type of the object to convert.
     * @param {T} obj - The object to convert to JSON.
     * @param {JsonToOptions} [options] - Options for JSON conversion.
     * @returns {{ [key: string | number]: any; }} Returns the JSON representation of the object.
     */
    static classToJson(obj, options) {
        const realOptions = {
            isValidKey: options?.isValidKey ?? (() => true),
            replaceKey: options?.replaceKey ?? ((key) => key),
            transformValue: options?.transformValue ?? ((key, value) => value),
            beforeEnd: options?.beforeEnd ?? ((res) => res)
        };
        return this.__classToJson(obj, realOptions);
    }
    static __classToJson(obj, options) {
        let result = {};
        let descriptors = Object.getOwnPropertyDescriptors(obj);
        for (let key in descriptors) {
            if (options.isValidKey(key))
                result[options.replaceKey(key)] = options.transformValue(key, descriptors[key].value);
        }
        let cst = obj.constructor;
        while (cst.prototype && cst != Object.prototype) {
            let descriptorsClass = Object.getOwnPropertyDescriptors(cst.prototype);
            for (let key in descriptorsClass) {
                if (options.isValidKey(key)) {
                    let descriptor = descriptorsClass[key];
                    if (descriptor?.get) {
                        const o = obj;
                        result[options.replaceKey(key)] = options.transformValue(key, o[key]);
                    }
                }
            }
            cst = Object.getPrototypeOf(cst);
        }
        result = options.beforeEnd(result);
        return result;
    }
    /**
    * Converts a JSON object to a JavaScript class instance.
    * @template T - The type of the object to convert.
    * @param {T} obj - The object to populate with JSON data.
    * @param {*} data - The JSON data to populate the object with.
    * @param {JsonFromOptions} [options] - Options for JSON deserialization.
    * @returns {T} Returns the populated object.
    */
    static classFromJson(obj, data, options) {
        let realOptions = {
            transformValue: options?.transformValue ?? ((key, value) => value),
            replaceUndefined: options?.replaceUndefined ?? false,
            replaceUndefinedWithKey: options?.replaceUndefinedWithKey ?? false,
        };
        return this.__classFromJson(obj, data, realOptions);
    }
    static __classFromJson(obj, data, options) {
        let props = Object.getOwnPropertyNames(obj);
        for (let prop of props) {
            let propUpperFirst = prop[0].toUpperCase() + prop.slice(1);
            let value = data[prop] === undefined ? data[propUpperFirst] : data[prop];
            if (value !== undefined || options.replaceUndefined || (options.replaceUndefinedWithKey && (Object.hasOwn(data, prop) || Object.hasOwn(data, propUpperFirst)))) {
                let propInfo = Object.getOwnPropertyDescriptor(obj, prop);
                if (propInfo?.writable) {
                    const o = obj;
                    o[prop] = options.transformValue(prop, value);
                }
            }
        }
        let cstTemp = obj.constructor;
        while (cstTemp.prototype && cstTemp != Object.prototype) {
            props = Object.getOwnPropertyNames(cstTemp.prototype);
            for (let prop of props) {
                let propUpperFirst = prop[0].toUpperCase() + prop.slice(1);
                let value = data[prop] === undefined ? data[propUpperFirst] : data[prop];
                if (value !== undefined || options.replaceUndefined || (options.replaceUndefinedWithKey && (Object.hasOwn(data, prop) || Object.hasOwn(data, propUpperFirst)))) {
                    let propInfo = Object.getOwnPropertyDescriptor(cstTemp.prototype, prop);
                    if (propInfo?.set) {
                        const o = obj;
                        o[prop] = options.transformValue(prop, value);
                    }
                }
            }
            cstTemp = Object.getPrototypeOf(cstTemp);
        }
        return obj;
    }
}
Json.Namespace=`Aventus`;
__as1(_, 'Json', Json);

let Converter=class Converter {
    /**
    * Map storing information about registered types.
    */
    static info = new Map([["Aventus.Map", Map]]);
    /**
    * Map storing schemas for registered types.
    */
    static schema = new Map();
    /**
     * Internal converter instance.
     */
    static __converter = new ConverterTransform();
    /**
     * Getter for the internal converter instance.
     */
    static get converterTransform() {
        return this.__converter;
    }
    /**
    * Sets the converter instance.
    * @param converter The converter instance to set.
    */
    static setConverter(converter) {
        this.__converter = converter;
    }
    /**
    * Registers a unique string type for any class.
    * @param $type The unique string type identifier.
    * @param cst The constructor function for the class.
    * @param schema Optional schema for the registered type.
    */
    static register($type, cst, schema) {
        this.info.set($type, cst);
        if (schema) {
            this.schema.set($type, schema);
        }
    }
    /**
     * Transforms the provided data using the current converter instance.
     * @template T
     * @param {*} data The data to transform.
     * @param {IConverterTransform} [converter] Optional converter instance to use for transformation.
     * @returns {T} Returns the transformed data.
     */
    static transform(data, converter) {
        if (!converter) {
            converter = this.converterTransform;
        }
        return converter.transform(data);
    }
    /**
     * Copies values from one class instance to another using the current converter instance.
     * @template T
     * @param {T} to The destination class instance to copy values into.
     * @param {T} from The source class instance to copy values from.
     * @param {ClassCopyOptions} [options] Optional options for the copy operation.
     * @param {IConverterTransform} [converter] Optional converter instance to use for the copy operation.
     * @returns {T} Returns the destination class instance with copied values.
     */
    static copyValuesClass(to, from, options, converter) {
        if (!converter) {
            converter = this.converterTransform;
        }
        return converter.copyValuesClass(to, from, options);
    }
}
Converter.Namespace=`Aventus`;
__as1(_, 'Converter', Converter);

let Data=// @Dependencies([{ type: Aventus.Converter, strong: true }, { type: Converter, strong: true }])
class Data {
    static converter = new Converter();
    /**
     * The schema for the class
     */
    static $schema;
    /**
     * The current namespace
     */
    static Namespace = "";
    /**
     * Get the unique type for the data. Define it as the namespace + class name
     */
    static get Fullname() { return this.Namespace + "." + this.name; }
    /**
     * The current namespace
     */
    get namespace() {
        return this.constructor['Namespace'];
    }
    /**
     * Get the unique type for the data. Define it as the namespace + class name
     */
    get $type() {
        return this.constructor['Fullname'];
    }
    /**
     * Get the name of the class
     */
    get className() {
        return this.constructor.name;
    }
    /**
     * Get a JSON for the current object
     */
    toJSON() {
        let toAvoid = ['className', 'namespace'];
        return Json.classToJson(this, {
            isValidKey: (key) => !toAvoid.includes(key)
        });
    }
    /**
     * Clone the object by transforming a parsed JSON string back into the original type
     */
    clone() {
        return Converter.transform(JSON.parse(JSON.stringify(this)));
    }
}
Data.Namespace=`Aventus`;
Data.$schema={"namespace":"string","$type":"string","className":"string"};
Converter.register(Data.Fullname, Data);
__as1(_, 'Data', Data);

let GenericError=// @Dependencies([{ type: Aventus.Converter, strong: true }, { type: Converter, strong: true }])
class GenericError {
    static converter = new Converter();
    static get Fullname() { return "Aventus.GenericError"; }
    /**
     * Code for the error
     */
    code;
    /**
     * Description of the error
     */
    message;
    /**
     * Additional details related to the error.
     */
    details = [];
    /**
     * Creates a new instance of GenericError.
     * @param {EnumValue<T>} code - The error code.
     * @param {string | Error | unknown} message - The error message.
     */
    constructor(code, message) {
        this.code = code;
        if (message instanceof Error) {
            this.message = message.message;
        }
        else {
            this.message = message + '';
        }
    }
}
GenericError.Namespace=`Aventus`;
GenericError.$schema={"code":"Aventus.EnumValue","message":"string"};
Converter.register(GenericError.Fullname, GenericError);
__as1(_, 'GenericError', GenericError);

let VoidWithError=class VoidWithError {
    static get Fullname() { return "Aventus.VoidWithError"; }
    /**
     * Determine if the action is a success
     */
    get success() {
        return this.errors.length == 0;
    }
    /**
     * List of errors
     */
    errors = [];
    /**
     * Converts the current instance to a VoidWithError object.
     * @returns {VoidWithError} A new instance of VoidWithError with the same error list.
     */
    toGeneric() {
        const result = new VoidWithError();
        result.errors = this.errors;
        return result;
    }
    /**
    * Checks if the error list contains a specific error code.
    * @template U - The type of error, extending GenericError.
    * @template T - The type of the error code, which extends either number or Enum.
    * @param {EnumValue<T>} code - The error code to check for.
    * @param {new (...args: any[]) => U} [type] - Optional constructor function of the error type.
    * @returns {boolean} True if the error list contains the specified error code, otherwise false.
    */
    containsCode(code, type) {
        if (type) {
            for (let error of this.errors) {
                if (error instanceof type) {
                    if (error.code == code) {
                        return true;
                    }
                }
            }
        }
        else {
            for (let error of this.errors) {
                if (error.code == code) {
                    return true;
                }
            }
        }
        return false;
    }
    run(fct) {
        if (this.success) {
            let result = fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
        }
        return this;
    }
    async runAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
        }
        return this;
    }
    extract(fct) {
        if (this.success) {
            let result = fct();
            if (result.success && result.result) {
                return result.result;
            }
            this.errors = [...this.errors, ...result.errors];
        }
        return undefined;
    }
    async extractAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (result.success && result.result) {
                return result.result;
            }
            this.errors = [...this.errors, ...result.errors];
        }
        return undefined;
    }
}
VoidWithError.Namespace=`Aventus`;
VoidWithError.$schema={"success":"boolean","errors":"T[]"};
Converter.register(VoidWithError.Fullname, VoidWithError);
__as1(_, 'VoidWithError', VoidWithError);

let ResultWithError=class ResultWithError extends VoidWithError {
    static get Fullname() { return "Aventus.ResultWithError"; }
    /**
      * The result value of the action.
      * @type {U | undefined}
      */
    result;
    /**
     * Converts the current instance to a ResultWithError object.
     * @returns {ResultWithError<U>} A new instance of ResultWithError with the same error list and result value.
     */
    toGeneric() {
        const result = new ResultWithError();
        result.errors = this.errors;
        result.result = this.result;
        return result;
    }
    run(fct) {
        if (this.success) {
            let result = fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
            if (result instanceof ResultWithError && result.success && result.result) {
                this.result = result.result;
            }
        }
        return this;
    }
    async runAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
            if (result instanceof ResultWithError && result.success && result.result) {
                this.result = result.result;
            }
        }
        return this;
    }
}
ResultWithError.Namespace=`Aventus`;
ResultWithError.$schema={...(VoidWithError?.$schema ?? {}), };
Converter.register(ResultWithError.Fullname, ResultWithError);
__as1(_, 'ResultWithError', ResultWithError);


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var VscodeView;
(VscodeView||(VscodeView = {}));
(function (VscodeView) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `VscodeView`;
const _ = {};


let _n;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["unknow"] = 0] = "unknow";
    ErrorCode[ErrorCode["differentChannel"] = 1] = "differentChannel";
    ErrorCode[ErrorCode["timeout"] = 2] = "timeout";
})(ErrorCode || (ErrorCode = {}));
__as1(_, 'ErrorCode', ErrorCode);

let Error=class Error extends Aventus.GenericError {
}
Error.Namespace=`VscodeView`;
Error.$schema={...(Aventus.GenericError?.$schema ?? {}), };
Aventus.Converter.register(Error.Fullname, Error);
__as1(_, 'Error', Error);

let Router=class Router {
    static get isVscode() {
        return 'acquireVsCodeApi' in window;
    }
    static getInstance() {
        return Aventus.Instance.get(Router);
    }
    routes = {};
    waitingList = {};
    vscode;
    constructor() {
        this.vscode = acquireVsCodeApi();
        window.addEventListener('message', (e) => this.onMessage(e));
    }
    addRoute(route) {
        if (!this.routes.hasOwnProperty(route.channel)) {
            this.routes[route.channel] = [];
        }
        for (let info of this.routes[route.channel]) {
            if (info.callback == route.callback) {
                return;
            }
        }
        const { params, regex } = Aventus.Uri.prepare(route.channel);
        let prepared = {
            callback: route.callback,
            channel: route.channel,
            regex,
            params
        };
        this.routes[route.channel].push(prepared);
    }
    removeRoute(route) {
        for (let i = 0; i < this.routes[route.channel].length; i++) {
            let info = this.routes[route.channel][i];
            if (info.callback == route.callback) {
                this.routes[route.channel].splice(i, 1);
                i--;
            }
        }
    }
    onMessage(event) {
        let response = event.data;
        let data = {};
        try {
            data = Aventus.Converter.transform(response.data);
        }
        catch (e) {
            console.error(e);
        }
        for (let channel in this.routes) {
            let current = this.routes[channel];
            for (let info of current) {
                let params = Aventus.Uri.getParams(info, response.channel);
                if (params) {
                    let valueCb = data;
                    if (data instanceof Aventus.ResultWithError) {
                        valueCb = data.result;
                    }
                    else if (data instanceof Aventus.VoidWithError) {
                        valueCb = undefined;
                    }
                    info.callback(valueCb, params, response.uid);
                }
            }
        }
        if (response.uid) {
            if (this.waitingList.hasOwnProperty(response.uid)) {
                this.waitingList[response.uid](response.channel, data);
                delete this.waitingList[response.uid];
            }
        }
    }
    send(options) {
        let result = new Aventus.VoidWithError();
        try {
            let message = {
                channel: options.channel,
            };
            if (options.uid) {
                message.uid = options.uid;
            }
            if (options.body) {
                message.data = options.body;
            }
            this.vscode.postMessage(message);
        }
        catch (e) {
            result.errors.push(new Error(ErrorCode.unknow, e));
        }
        return result;
    }
    sendWithResponse(options) {
        return new Promise(async (resolve) => {
            let result = new Aventus.ResultWithError();
            try {
                let _uid = options.uid;
                if (!_uid) {
                    _uid = Aventus.uuidv4();
                }
                options.uid = _uid;
                let timeoutInfo;
                this.waitingList[_uid] = (channel, data) => {
                    clearTimeout(timeoutInfo);
                    if (channel.toLowerCase() != options.channel.toLowerCase()) {
                        result.errors.push(new Error(ErrorCode.differentChannel, `We sent a message on ${options.channel} but we receive on ${channel}`));
                        resolve(result);
                    }
                    else {
                        if (data instanceof Aventus.VoidWithError) {
                            for (let error of data.errors) {
                                result.errors.push(error);
                            }
                            if (data instanceof Aventus.ResultWithError) {
                                result.result = data.result;
                            }
                        }
                        else {
                            result.result = data;
                        }
                        resolve(result);
                    }
                };
                if (options.timeout !== undefined) {
                    timeoutInfo = setTimeout(() => {
                        delete this.waitingList[_uid];
                        result.errors.push(new Error(ErrorCode.timeout, "No message received after " + options.timeout + "ms"));
                        resolve(result);
                    }, options.timeout);
                }
                let sendMessageResult = this.send(options);
                if (!sendMessageResult.success) {
                    for (let error of sendMessageResult.errors) {
                        result.errors.push(error);
                    }
                    resolve(result);
                }
            }
            catch (e) {
                result.errors.push(new Error(ErrorCode.unknow, e));
                resolve(result);
            }
        });
    }
}
Router.Namespace=`VscodeView`;
__as1(_, 'Router', Router);


for(let key in _) { VscodeView[key] = _[key] }
})(VscodeView);
