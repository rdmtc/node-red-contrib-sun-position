/**
 * The Node-RED core object available to a custom node's .html file
 */
export type RED = any;
/**
 * The Node-RED core object available to a custom node's .html file
 */
export type editorRED = any;
/**
 * Logging. Levels that are output to the Node-RED log are controlled by the logging.console.level setting in settings.js
 */
export type runtimeLogging = {
    /**
     * Lvel 0. Lowest level, things that have broken Node-RED only.
     */
    fatal: Function;
    /**
     * Level 1. Copy is sent to Editor debug panel as well as error log.
     */
    error: Function;
    /**
     * Level 2.
     */
    warn: Function;
    /**
     * Level 3.
     */
    log: Function;
    /**
     * Level 4.
     */
    debug: Function;
    /**
     * Level 5. Very verbose output. Should tell the operator everything that is going on.
     */
    trace: Function;
    metric: Function;
    audit: Function;
    addHandler: Function;
    removeHandler: Function;
};
/**
 * Gives access to other active nodes in the flows.
 */
export type runtimeNodes = {
    /**
     * Register a new type of node to Node-RED.
     */
    registerType: Function;
    /**
     * Create a node instance (called from within registerType function).
     */
    createNode: Function;
    /**
     * Get a reference to another node instance in the current flows. Can then access its properties.
     */
    getNode: Function;
    /**
     * : [Function: eachNode],
     */
    eachNode: Function;
    /**
     * : [Function: add],
     */
    addCredentials: Function;
    /**
     * : [Function: get],
     */
    getCredentials: Function;
    /**
     * : [Function: delete],
     */
    deleteCredentials: Function;
};
/**
 * The core Node-RED runtime object
 */
export type runtimeRED = {
    /**
     * Reference to the ExpressJS app for Node-RED Admin including the Editor
     */
    httpAdmin: expressApp;
    /**
     * Reference to the ExpressJS app for Node-RED user-facing nodes including http-in/-out and Dashboard
     */
    httpNode: expressApp;
    /**
     * Node.js http(s) Server object
     */
    server: any;
    /**
     * Logging.
     */
    log: runtimeLogging;
    /**
     * Gives access to other active nodes in the flows.
     */
    nodes: runtimeNodes;
    /**
     * Static and Dynamic settings for Node-RED runtime
     */
    settings: any;
    /**
     * Get the Node-RED version
     */
    version: Function;
    /**
     * : [Function: requireModule],
     */
    require: Function;
    comms: {
        publish: Function;
    };
    library: {
        register: Function;
    };
    auth: {
        needsPermission: Function;
    };
    /**
     * : get a i18N string,
     */
    _: Function;
    /**
     * Event handler object
     */
    events: {
        on: Function;
        once: Function;
        addListener: Function;
    };
    hooks: {
        has: Function;
        clear: Function;
        add: Function;
        remove: Function;
        trigger: Function;
    };
    util: {
        encodeObject: Function;
        ensureString: Function;
        ensureBuffer: Function;
        cloneMessage: Function;
        compareObjects: Function;
        generateId: Function;
        getMessageProperty: Function;
        setMessageProperty: Function;
        getObjectProperty: Function;
        setObjectProperty: Function;
        evaluateNodeProperty: Function;
        normalisePropertyExpression: Function;
        normaliseNodeTypeName: Function;
        prepareJSONataExpression: Function;
        evaluateJSONataExpression: Function;
        parseContextStore: Function;
    };
};
/**
 * Local copy of the node instance config + other info
 */
export type runtimeNode = {
    /**
     * Send a Node-RED msg to an output port
     */
    send: Function;
    /**
     * function for let node emit a message
     */
    emit: Function;
    /**
     * Dummy done function for pre-Node-RED 1.0 servers
     */
    done: Function;
    /**
     * get/set context data. Also .flow and .global contexts
     */
    context: Function;
    /**
     * Event listeners for the node instance ('input', 'close')
     */
    on: Function;
    /**
     * Event handling
     */
    removeListener: Function;
    /**
     * Error log output, also logs to the Editor's debug panel
     */
    error: Function;
    /**
     * Warning log output, also logs to the Editor's debug panel
     */
    warn: Function;
    /**
     * information log output
     */
    log: Function;
    /**
     * debugging log output
     */
    debug: Function;
    /**
     * set the node status
     */
    status: Function;
    /**
     * Optional secured credentials
     */
    credentials?: any | undefined;
    /**
     * Internal.
     */
    name?: any | undefined;
    /**
     * Internal. uid of node instance.
     */
    id?: any | undefined;
    /**
     * Internal.
     */
    _path?: any | undefined;
    /**
     * Internal. Type of node instance.
     */
    type?: any | undefined;
    /**
     * Internal. uid of ???
     */
    z?: any | undefined;
    /**
     * Internal. Array of Array of Strings. The wires attached to this node instance (uid's)
     * ... obviously there are more ...
     */
    wires?: [Array<string>] | undefined;
};
/**
 * Configuration of node instance. Will also have Editor panel's defined variables as properties.
 */
export type runtimeNodeConfig = {
    /**
     * Internal. uid of node instance.
     */
    id?: any | undefined;
    /**
     * Internal. Type of node instance.
     */
    type?: any | undefined;
    /**
     * Internal
     */
    x?: any | undefined;
    /**
     * Internal
     */
    y?: any | undefined;
    /**
     * Internal
     */
    z?: any | undefined;
    /**
     * Internal. The wires attached to this node instance (uid's)
     */
    wires?: any | undefined;
};
/**
 * Local copy of the node instance config + other info
 */
export type uibNode = {
    /**
     * Unique identifier for this instance
     */
    id: string;
    /**
     * What type of node is this an instance of? (uibuilder)
     */
    type: string;
    /**
     * Descriptive name, only used by Editor
     */
    name: string;
    /**
     * msg.topic overrides incoming msg.topic
     */
    topic: string;
    /**
     * The url path (and folder path) to be used by this instance
     */
    url: string;
    /**
     * The PREVIOUS url path (and folder path) after a url rename
     */
    oldUrl: string;
    /**
     * Forward input msgs to output #1?
     */
    fwdInMessages: boolean;
    /**
     * Allow scripts to be sent to front-end via msg? WARNING: can be a security issue.
     */
    allowScripts: boolean;
    /**
     * Allow CSS to be sent to the front-end via msg? WARNING: can be a security issue.
     */
    allowStyles: boolean;
    /**
     * DEPRECATED Copy index.(html|js|css) files from templates if they don't exist?
     */
    copyIndex: boolean;
    /**
     * Folder name for the source of the chosen template
     */
    templateFolder: string;
    /**
     * Degit url reference for an external template (e.g. from GitHub)
     */
    extTemplate: string;
    /**
     * Provide a folder index web page?
     */
    showfolder: boolean;
    /**
     * Use uibuilder's built-in security features?
     */
    useSecurity: boolean;
    /**
     * Extend token life when msg's received from client?
     */
    tokenAutoExtend: boolean;
    /**
     * Lifespan of token (in seconds)
     */
    sessionLength: number;
    /**
     * If true, notify all clients to reload on a change to any source file
     */
    reload: boolean;
    /**
     * (src or dist) the instance FE code folder to be served by ExpressJS
     */
    sourceFolder: string;
    /**
     * Seed string for encryption of JWT
     */
    jwtSecret: string;
    /**
     * Name of the fs path used to hold custom files & folders for THIS INSTANCE
     */
    customFolder: string;
    /**
     * How many Socket clients connected to this instance?
     */
    ioClientsCount: number;
    /**
     * How many msg's received since last reset or redeploy?
     */
    rcvMsgCount: number;
    /**
     * The channel names for Socket.IO
     */
    ioChannels: {
        control: string;
        client: string;
        server: string;
    };
    /**
     * Make sure each node instance uses a separate Socket.IO namespace
     */
    ioNamespace: string;
    /**
     * Send a Node-RED msg to an output port
     */
    send: Function;
    /**
     * Dummy done function for pre-Node-RED 1.0 servers
     */
    done?: Function | undefined;
    /**
     * Event handler
     */
    on?: Function | undefined;
    /**
     * Event handling
     */
    removeListener?: Function | undefined;
    /**
     * Optional secured credentials
     */
    credentials?: any | undefined;
    /**
     * Internal
     */
    z?: any | undefined;
    /**
     * Internal. The wires attached to this node instance (uid's)
     */
    wires?: any | undefined;
    /**
     * Whether the common static folder has been added
     */
    commonStaticLoaded: boolean;
    /**
     * Has the initial template copy been done?
     */
    initCopyDone: boolean;
};
/**
 * ExpessJS `app` object
 */
export type expressApp = {
    /**
     * : [Object: null prototype] { mount: [Function: onmount] },
     */
    _events: any;
    /**
     * : 1,
     */
    _eventsCount: number;
    /**
     * : undefined,
     */
    _maxListeners: number;
    /**
     * : [Function: setMaxListeners],
     */
    setMaxListeners: Function;
    /**
     * : [Function: getMaxListeners],
     */
    getMaxListeners: Function;
    /**
     * : [Function: emit],
     */
    emit: Function;
    /**
     * : [Function: addListener],
     */
    addListener: Function;
    /**
     * : [Function: addListener],
     */
    on: Function;
    /**
     * : [Function: prependListener],
     */
    prependListener: Function;
    /**
     * : [Function: once],
     */
    once: Function;
    /**
     * : [Function: prependOnceListener],
     */
    prependOnceListener: Function;
    /**
     * : [Function: removeListener],
     */
    removeListener: Function;
    /**
     * : [Function: removeListener],
     */
    off: Function;
    /**
     * : [Function: removeAllListeners],
     */
    removeAllListeners: Function;
    /**
     * : [Function: listeners],
     */
    listeners: Function;
    /**
     * : [Function: rawListeners],
     */
    rawListeners: Function;
    /**
     * : [Function: listenerCount],
     */
    listenerCount: Function;
    /**
     * : [Function: eventNames],
     */
    eventNames: Function;
    /**
     * : [Function: init],
     */
    init: Function;
    /**
     * : [Function: defaultConfiguration],
     */
    defaultConfiguration: Function;
    /**
     * : [Function: lazyrouter],
     */
    lazyrouter: Function;
    /**
     * : [Function: handle],
     */
    handle: Function;
    /**
     * : [Function: use],
     */
    use: Function;
    /**
     * : [Function: route],
     */
    route: Function;
    /**
     * : [Function: engine],
     */
    engine: Function;
    /**
     * : [Function: param],
     */
    param: Function;
    /**
     * : [Function: set],
     */
    set: Function;
    /**
     * : [Function: path],
     */
    path: Function;
    /**
     * : [Function: enabled],
     */
    enabled: Function;
    /**
     * : [Function: disabled],
     */
    disabled: Function;
    /**
     * : [Function: enable],
     */
    enable: Function;
    /**
     * : [Function: disable],
     */
    disable: Function;
    /**
     * : [Function (anonymous)],
     */
    acl: Function;
    /**
     * : [Function (anonymous)],
     */
    bind: Function;
    /**
     * : [Function (anonymous)],
     */
    checkout: Function;
    /**
     * : [Function (anonymous)],
     */
    connect: Function;
    /**
     * : [Function (anonymous)],
     */
    copy: Function;
    /**
     * : [Function (anonymous)],
     */
    delete: Function;
    /**
     * : [Function (anonymous)],
     */
    get: Function;
    /**
     * : [Function (anonymous)],
     */
    head: Function;
    /**
     * : [Function (anonymous)],
     */
    link: Function;
    /**
     * : [Function (anonymous)],
     * // @ property {function} m-search: [Function (anonymous)],
     */
    lock: Function;
    /**
     * : [Function (anonymous)],
     */
    merge: Function;
    /**
     * : [Function (anonymous)],
     */
    mkactivity: Function;
    /**
     * : [Function (anonymous)],
     */
    mkcalendar: Function;
    /**
     * : [Function (anonymous)],
     */
    mkcol: Function;
    /**
     * : [Function (anonymous)],
     */
    move: Function;
    /**
     * : [Function (anonymous)],
     */
    notify: Function;
    /**
     * : [Function (anonymous)],
     */
    options: Function;
    /**
     * : [Function (anonymous)],
     */
    patch: Function;
    /**
     * : [Function (anonymous)],
     */
    post: Function;
    /**
     * : [Function (anonymous)],
     */
    pri: Function;
    /**
     * : [Function (anonymous)],
     */
    propfind: Function;
    /**
     * : [Function (anonymous)],
     */
    proppatch: Function;
    /**
     * : [Function (anonymous)],
     */
    purge: Function;
    /**
     * : [Function (anonymous)],
     */
    put: Function;
    /**
     * : [Function (anonymous)],
     */
    rebind: Function;
    /**
     * : [Function (anonymous)],
     */
    report: Function;
    /**
     * : [Function (anonymous)],
     */
    search: Function;
    /**
     * : [Function (anonymous)],
     */
    source: Function;
    /**
     * : [Function (anonymous)],
     */
    subscribe: Function;
    /**
     * : [Function (anonymous)],
     */
    trace: Function;
    /**
     * : [Function (anonymous)],
     */
    unbind: Function;
    /**
     * : [Function (anonymous)],
     */
    unlink: Function;
    /**
     * : [Function (anonymous)],
     */
    unlock: Function;
    /**
     * : [Function (anonymous)],
     */
    unsubscribe: Function;
    /**
     * : [Function: all],
     */
    all: Function;
    /**
     * : [Function (anonymous)],
     */
    del: Function;
    /**
     * : [Function: render],
     */
    render: Function;
    /**
     * : [Function: listen],
     */
    listen: Function;
    /**
     * : IncomingMessage { app: [Circular *1] },
     */
    request: Function;
    /**
     * : ServerResponse { app: [Circular *1] },
     */
    response: Function;
    /**
     * : {},
     */
    cache: any;
    /**
     * : {},
     */
    engines: any;
    /**
     * :
     * // @ property {boolean}  settings.'x-powered-by': true,
     */
    settings: {
        etag: string;
        env: string;
        view: Function;
        views: string;
    };
    /**
     * : [Object: null prototype] { settings: [Object] },
     */
    locals: any;
    /**
     * : '/nr/',
     */
    mountpath: string;
    /**
     * : [Function: app] {
     */
    parent: Function;
    /**
     * : [Function]
     */
    _router: Function;
};
//# sourceMappingURL=typedefs.d.ts.map