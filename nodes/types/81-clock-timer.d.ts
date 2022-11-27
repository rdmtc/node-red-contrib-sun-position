declare const _exports: runtimeRED;
export = _exports;
/**
 * --- Type Defs ---
 */
export type runtimeRED = import('./types/typedefs.js').runtimeRED;
/**
 * --- Type Defs ---
 */
export type runtimeNode = import('./types/typedefs.js').runtimeNode;
/**
 * --- Type Defs ---
 */
export type runtimeNodeConfig = import('./types/typedefs.js').runtimeNodeConfig;
/**
 * --- Type Defs ---
 */
export type ITimeObject = import("./lib/dateTimeHelper").ITimeObject;
/**
 * --- Type Defs ---
 */
export type IPositionConfigNode = import("./10-position-config.js").IPositionConfigNode;
/**
 * --- Type Defs ---
 */
export type ITimeControlNodeInstance = import("./lib/timeControlHelper.js").ITimeControlNodeInstance;
/**
 * Extensions for the nodeInstance object type
 */
export type IClockTimerNodeInstance = {
    /**
     * get/set generic Data of the node
     */
    nodeData: any;
    /**
     * -   tbd
     */
    reason: any;
    /**
     * -   used context store
     */
    contextStore: string;
    /**
     * -   tbd
     */
    oversteer: any;
    /**
     * -   tbd
     */
    rules: any;
    /**
     * -   tbd
     */
    payload: any;
    /**
     * -   tbd
     * ... obviously there are more ...
     */
    results: Array<any>;
};
/**
 * Combine nodeInstance with additional, optional functions
 */
export type IClockTimerNode = ITimeControlNodeInstance & IClockTimerNodeInstance & runtimeNode;
//# sourceMappingURL=81-clock-timer.d.ts.map