/* eslint-disable no-irregular-whitespace */
/** Define typedefs for linting and JSDoc/ts checks - does not actually contain live code
 *
 * Original by
 * Copyright (c) 2017-2021 Julian Knight (Totally Information)
 * https://it.knightnet.org.uk, https://github.com/TotallyInformation/node-red-contrib-uibuilder
 *
 * Reworked and enhanced by
 * Copyright (c) 2022 Robert Gester (Hypnos)
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/** editorRED
 * @typedef {Object} RED The Node-RED core object available to a custom node's .html file
 *
 */


/** editorRED
 * @typedef {Object} editorRED The Node-RED core object available to a custom node's .html file
 *
 */

/** runtimeLogging
 * @typedef {Object} runtimeLogging Logging. Levels that are output to the Node-RED log are controlled by the logging.console.level setting in settings.js
 * @property {function} fatal Lvel 0. Lowest level, things that have broken Node-RED only.
 * @property {function} error Level 1. Copy is sent to Editor debug panel as well as error log.
 * @property {function} warn Level 2.
 * @property {function} log Level 3.
 * @property {function} debug Level 4.
 * @property {function} trace Level 5. Very verbose output. Should tell the operator everything that is going on.
 * @property {function} metric
 * @property {function} audit
 * @property {function} addHandler
 * @property {function} removeHandler
 */

/** runtimeNodes
 * @typedef {Object} runtimeNodes Gives access to other active nodes in the flows.
 * @property {function} registerType Register a new type of node to Node-RED.
 * @property {function} createNode Create a node instance (called from within registerType function).
 * @property {function} getNode Get a reference to another node instance in the current flows. Can then access its properties.
 * @property {function} eachNode: [Function: eachNode],
 * @property {function} addCredentials: [Function: add],
 * @property {function} getCredentials: [Function: get],
 * @property {function} deleteCredentials: [Function: delete],
 */

/** runtimeRED
 * @typedef {Object} runtimeRED The core Node-RED runtime object
 * @property {expressApp} httpAdmin Reference to the ExpressJS app for Node-RED Admin including the Editor
 * @property {expressApp} httpNode Reference to the ExpressJS app for Node-RED user-facing nodes including http-in/-out and Dashboard
 * @property {Object} server Node.js http(s) Server object
 * @property {runtimeLogging} log Logging.
 * @property {runtimeNodes} nodes Gives access to other active nodes in the flows.
 * @property {Object} settings Static and Dynamic settings for Node-RED runtime
 *
 * @property {function} version Get the Node-RED version
 * @property {function} require: [Function: requireModule],
 *
 * @property {Object} comms
 * @property {function} comms.publish: [Function: publish]
 *
 * @property {Object} library
 * @property {function} library.register: [Function: register]
 *
 * @property {Object} auth
 * @property {function} auth.needsPermission
 *
 * @property {function} _: get a i18N string,
 *
 * @property {Object} events Event handler object
 * @property {function} events.on Event Listener function. Types: 'nodes-started', 'nodes-stopped'
 * @property {function} events.once
 * @property {function} events.addListener
 *
 * @property {Object} hooks
 * @property {function} hooks.has
 * @property {function} hooks.clear
 * @property {function} hooks.add
 * @property {function} hooks.remove
 * @property {function} hooks.trigger
 *
 * @property {Object} util
 * @property {function} util.encodeObject: [Function: encodeObject],
 * @property {function} util.ensureString: [Function: ensureString],
 * @property {function} util.ensureBuffer: [Function: ensureBuffer],
 * @property {function} util.cloneMessage: [Function: cloneMessage],
 * @property {function} util.compareObjects: [Function: compareObjects],
 * @property {function} util.generateId: [Function: generateId],
 * @property {function} util.getMessageProperty: [Function: getMessageProperty],
 * @property {function} util.setMessageProperty: [Function: setMessageProperty],
 * @property {function} util.getObjectProperty: [Function: getObjectProperty],
 * @property {function} util.setObjectProperty: [Function: setObjectProperty],
 * @property {function} util.evaluateNodeProperty: [Function: evaluateNodeProperty],
 * @property {function} util.normalisePropertyExpression: [Function: normalisePropertyExpression],
 * @property {function} util.normaliseNodeTypeName: [Function: normaliseNodeTypeName],
 * @property {function} util.prepareJSONataExpression: [Function: prepareJSONataExpression],
 * @property {function} util.evaluateJSONataExpression: [Function: evaluateJSONataExpression],
 * @property {function} util.parseContextStore: [Function: parseContextStore]
 */

/** runtimeNode
 * @typedef {object} runtimeNode Local copy of the node instance config + other info
 * @property {Function} send Send a Node-RED msg to an output port
 * @property {Function} emit function for let node emit a message
 * @property {Function} done Dummy done function for pre-Node-RED 1.0 servers
 * @property {function} context get/set context data. Also .flow and .global contexts
 * @property {function} on Event listeners for the node instance ('input', 'close')
 * @property {Function} removeListener Event handling
 * @property {function} error Error log output, also logs to the Editor's debug panel
 * @property {function} warn Warning log output, also logs to the Editor's debug panel
 * @property {function} log information log output
 * @property {function} debug debugging log output
 * @property {function} status set the node status
 * @property {Object=} credentials Optional secured credentials
 * @property {Object=} name Internal.
 * @property {Object=} id Internal. uid of node instance.
 * @property {Object=} _path Internal.
 * @property {Object=} type Internal. Type of node instance.
 * @property {Object=} z Internal. uid of ???
 * @property {[Array<string>]=} wires Internal. Array of Array of Strings. The wires attached to this node instance (uid's)
 *  ... obviously there are more ...
 */

/** runtimeNodeConfig
 * @typedef {object} runtimeNodeConfig Configuration of node instance. Will also have Editor panel's defined variables as properties.
 * @property {Object=} id Internal. uid of node instance.
 * @property {Object=} type Internal. Type of node instance.
 * @property {Object=} x Internal
 * @property {Object=} y Internal
 * @property {Object=} z Internal
 * @property {Object=} wires Internal. The wires attached to this node instance (uid's)
 */

/** uibNode
 * @typedef {object} uibNode Local copy of the node instance config + other info
 * @property {String} uibNode.id Unique identifier for this instance
 * @property {String} uibNode.type What type of node is this an instance of? (uibuilder)
 * @property {String} uibNode.name Descriptive name, only used by Editor
 * @property {String} uibNode.topic msg.topic overrides incoming msg.topic
 * @property {String} uibNode.url The url path (and folder path) to be used by this instance
 * @property {String} uibNode.oldUrl The PREVIOUS url path (and folder path) after a url rename
 * @property {boolean} uibNode.fwdInMessages Forward input msgs to output #1?
 * @property {boolean} uibNode.allowScripts Allow scripts to be sent to front-end via msg? WARNING: can be a security issue.
 * @property {boolean} uibNode.allowStyles Allow CSS to be sent to the front-end via msg? WARNING: can be a security issue.
 * @property {boolean} uibNode.copyIndex DEPRECATED Copy index.(html|js|css) files from templates if they don't exist?
 * @property {String}  uibNode.templateFolder Folder name for the source of the chosen template
 * @property {String}  uibNode.extTemplate Degit url reference for an external template (e.g. from GitHub)
 * @property {boolean} uibNode.showfolder Provide a folder index web page?
 * @property {boolean} uibNode.useSecurity Use uibuilder's built-in security features?
 * @property {boolean} uibNode.tokenAutoExtend Extend token life when msg's received from client?
 * @property {Number} uibNode.sessionLength Lifespan of token (in seconds)
 * @property {boolean} uibNode.reload If true, notify all clients to reload on a change to any source file
 * @property {String} uibNode.sourceFolder (src or dist) the instance FE code folder to be served by ExpressJS
 * @property {String} uibNode.jwtSecret Seed string for encryption of JWT
 * @property {String} uibNode.customFolder Name of the fs path used to hold custom files & folders for THIS INSTANCE
 * @property {Number} uibNode.ioClientsCount How many Socket clients connected to this instance?
 * @property {Number} uibNode.rcvMsgCount How many msg's received since last reset or redeploy?
 * @property {Object} uibNode.ioChannels The channel names for Socket.IO
 * @property {String} uibNode.ioChannels.control SIO Control channel name 'uiBuilderControl'
 * @property {String} uibNode.ioChannels.client SIO Client channel name 'uiBuilderClient'
 * @property {String} uibNode.ioChannels.server SIO Server channel name 'uiBuilder'
 * @property {String} uibNode.ioNamespace Make sure each node instance uses a separate Socket.IO namespace
 * @property {Function} uibNode.send Send a Node-RED msg to an output port
 * @property {Function=} uibNode.done Dummy done function for pre-Node-RED 1.0 servers
 * @property {Function=} uibNode.on Event handler
 * @property {Function=} uibNode.removeListener Event handling
 * @property {Object=} uibNode.credentials Optional secured credentials
 * @property {Object=} uibNode.z Internal
 * @property {Object=} uibNode.wires Internal. The wires attached to this node instance (uid's)
 *
 * @property {boolean} uibNode.commonStaticLoaded Whether the common static folder has been added
 * @property {boolean} uibNode.initCopyDone Has the initial template copy been done?
 */

// ==== vvv These need some work vvv ==== //

// ExpressJS App
/**
 * @typedef {Object} expressApp ExpessJS `app` object
 * @property {Object} _events: [Object: null prototype] { mount: [Function: onmount] },
 * @property {number} _eventsCount: 1,
 * @property {number} _maxListeners: undefined,
 * @property {function} setMaxListeners: [Function: setMaxListeners],
 * @property {function} getMaxListeners: [Function: getMaxListeners],
 * @property {function} emit: [Function: emit],
 * @property {function} addListener: [Function: addListener],
 * @property {function} on: [Function: addListener],
 * @property {function} prependListener: [Function: prependListener],
 * @property {function} once: [Function: once],
 * @property {function} prependOnceListener: [Function: prependOnceListener],
 * @property {function} removeListener: [Function: removeListener],
 * @property {function} off: [Function: removeListener],
 * @property {function} removeAllListeners: [Function: removeAllListeners],
 * @property {function} listeners: [Function: listeners],
 * @property {function} rawListeners: [Function: rawListeners],
 * @property {function} listenerCount: [Function: listenerCount],
 * @property {function} eventNames: [Function: eventNames],
 * @property {function} init: [Function: init],
 * @property {function} defaultConfiguration: [Function: defaultConfiguration],
 * @property {function} lazyrouter: [Function: lazyrouter],
 * @property {function} handle: [Function: handle],
 * @property {function} use: [Function: use],
 * @property {function} route: [Function: route],
 * @property {function} engine: [Function: engine],
 * @property {function} param: [Function: param],
 * @property {function} set: [Function: set],
 * @property {function} path: [Function: path],
 * @property {function} enabled: [Function: enabled],
 * @property {function} disabled: [Function: disabled],
 * @property {function} enable: [Function: enable],
 * @property {function} disable: [Function: disable],
 * @property {function} acl: [Function (anonymous)],
 * @property {function} bind: [Function (anonymous)],
 * @property {function} checkout: [Function (anonymous)],
 * @property {function} connect: [Function (anonymous)],
 * @property {function} copy: [Function (anonymous)],
 * @property {function} delete: [Function (anonymous)],
 * @property {function} get: [Function (anonymous)],
 * @property {function} head: [Function (anonymous)],
 * @property {function} link: [Function (anonymous)],
 * @property {function} lock: [Function (anonymous)],
 * // @ property {function} m-search: [Function (anonymous)],
 * @property {function} merge: [Function (anonymous)],
 * @property {function} mkactivity: [Function (anonymous)],
 * @property {function} mkcalendar: [Function (anonymous)],
 * @property {function} mkcol: [Function (anonymous)],
 * @property {function} move: [Function (anonymous)],
 * @property {function} notify: [Function (anonymous)],
 * @property {function} options: [Function (anonymous)],
 * @property {function} patch: [Function (anonymous)],
 * @property {function} post: [Function (anonymous)],
 * @property {function} pri: [Function (anonymous)],
 * @property {function} propfind: [Function (anonymous)],
 * @property {function} proppatch: [Function (anonymous)],
 * @property {function} purge: [Function (anonymous)],
 * @property {function} put: [Function (anonymous)],
 * @property {function} rebind: [Function (anonymous)],
 * @property {function} report: [Function (anonymous)],
 * @property {function} search: [Function (anonymous)],
 * @property {function} source: [Function (anonymous)],
 * @property {function} subscribe: [Function (anonymous)],
 * @property {function} trace: [Function (anonymous)],
 * @property {function} unbind: [Function (anonymous)],
 * @property {function} unlink: [Function (anonymous)],
 * @property {function} unlock: [Function (anonymous)],
 * @property {function} unsubscribe: [Function (anonymous)],
 * @property {function} all: [Function: all],
 * @property {function} del: [Function (anonymous)],
 * @property {function} render: [Function: render],
 * @property {function} listen: [Function: listen],
 * @property {function} request: IncomingMessage { app: [Circular *1] },
 * @property {function} response: ServerResponse { app: [Circular *1] },
 * @property {Object} cache: {},
 * @property {Object} engines: {},
 *
 * @property {Object} settings:
 * // @ property {boolean}  settings.'x-powered-by': true,
 * @property {string}   settings.etag: 'weak',
 * // @ property {function} settings.'etag fn': [Function: generateETag],
 * @property {string}   settings.env: 'development',
 * // @ property {string}   settings.'query parser': 'extended',
 * // @ property {function} settings.'query parser fn': [Function: parseExtendedQueryString],
 * // @ property {number}   settings.'subdomain offset': 2,
 * @property {function} settings.view: [Function: View],
 * @property {string}   settings.views: 'C:\\src\\nr2\\views',
 * // @ property {string}   settings.'jsonp callback name': 'callback'
 *
 * @property {Object} locals: [Object: null prototype] { settings: [Object] },
 * @property {string} mountpath: '/nr/',
 *
 * @property {function} parent: [Function: app] {
 * @property {function}   parent._events: [Object: null prototype],
 * @property {function}   parent._eventsCount: 1,
 * @property {function}   parent._maxListeners: undefined,
 * @property {function}   parent.setMaxListeners: [Function: setMaxListeners],
 * @property {function}   parent.getMaxListeners: [Function: getMaxListeners],
 * @property {function}   parent.emit: [Function: emit],
 * @property {function}   parent.addListener: [Function: addListener],
 * @property {function}   parent.on: [Function: addListener],
 * @property {function}   parent.prependListener: [Function: prependListener],
 * @property {function}   parent.once: [Function: once],
 * @property {function}   parent.prependOnceListener: [Function: prependOnceListener],
 * @property {function}   parent.removeListener: [Function: removeListener],
 * @property {function}   parent.off: [Function: removeListener],
 * @property {function}   parent.removeAllListeners: [Function: removeAllListeners],
 * @property {function}   parent.listeners: [Function: listeners],
 * @property {function}   parent.rawListeners: [Function: rawListeners],
 * @property {function}   parent.listenerCount: [Function: listenerCount],
 * @property {function}   parent.eventNames: [Function: eventNames],
 * @property {function}   parent.init: [Function: init],
 * @property {function}   parent.defaultConfiguration: [Function: defaultConfiguration],
 * @property {function}   parent.lazyrouter: [Function: lazyrouter],
 * @property {function}   parent.handle: [Function: handle],
 * @property {function}   parent.use: [Function: use],
 * @property {function}   parent.route: [Function: route],
 * @property {function}   parent.engine: [Function: engine],
 * @property {function}   parent.param: [Function: param],
 * @property {function}   parent.set: [Function: set],
 * @property {function}   parent.path: [Function: path],
 * @property {function}   parent.enabled: [Function: enabled],
 * @property {function}   parent.disabled: [Function: disabled],
 * @property {function}   parent.enable: [Function: enable],
 * @property {function}   parent.disable: [Function: disable],
 * @property {function}   parent.acl: [Function (anonymous)],
 * @property {function}   parent.bind: [Function (anonymous)],
 * @property {function}   parent.checkout: [Function (anonymous)],
 * @property {function}   parent.connect: [Function (anonymous)],
 * @property {function}   parent.copy: [Function (anonymous)],
 * @property {function}   parent.delete: [Function (anonymous)],
 * @property {function}   parent.get: [Function (anonymous)],
 * @property {function}   parent.head: [Function (anonymous)],
 * @property {function}   parent.link: [Function (anonymous)],
 * @property {function}   parent.lock: [Function (anonymous)],
 * // @ property {function}   parent.'m-search': [Function (anonymous)],
 * @property {function}   parent.merge: [Function (anonymous)],
 * @property {function}   parent.mkactivity: [Function (anonymous)],
 * @property {function}   mkcalendar: [Function (anonymous)],
 * @property {function}   mkcol: [Function (anonymous)],
 * @property {function}   move: [Function (anonymous)],
 * @property {function}   notify: [Function (anonymous)],
 * @property {function}   options: [Function (anonymous)],
 * @property {function}   patch: [Function (anonymous)],
 * @property {function}   post: [Function (anonymous)],
 * @property {function}   pri: [Function (anonymous)],
 * @property {function}   propfind: [Function (anonymous)],
 * @property {function}   proppatch: [Function (anonymous)],
 * @property {function}   purge: [Function (anonymous)],
 * @property {function}   put: [Function (anonymous)],
 * @property {function}   rebind: [Function (anonymous)],
 * @property {function}   report: [Function (anonymous)],
 * @property {function}   search: [Function (anonymous)],
 * @property {function}   source: [Function (anonymous)],
 * @property {function}   subscribe: [Function (anonymous)],
 * @property {function}   trace: [Function (anonymous)],
 * @property {function}   unbind: [Function (anonymous)],
 * @property {function}   unlink: [Function (anonymous)],
 * @property {function}   unlock: [Function (anonymous)],
 * @property {function}   unsubscribe: [Function (anonymous)],
 * @property {function}   all: [Function: all],
 * @property {function}   del: [Function (anonymous)],
 * @property {function}   render: [Function: render],
 * @property {function}   listen: [Function: listen],
 * @property {function}   request: [IncomingMessage],
 * @property {function}   response: [ServerResponse],
 * @property {function}   cache: {},
 * @property {function}   engines: {},
 * @property {function}   settings: [Object],
 * @property {function}   locals: [Object: null prototype],
 * @property {function}   mountpath: '/',
 * @property {function}   _router: [Function]
 */

module.exports = {};