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
export type ITimeObject = import("./lib/dateTimeHelper.js").ITimeObject;
/**
 * --- Type Defs ---
 */
export type ILimitationsObj = import("./lib/dateTimeHelper.js").ILimitationsObj;
/**
 * --- Type Defs ---
 */
export type ITypedValue = import("./10-position-config.js").ITypedValue;
/**
 * --- Type Defs ---
 */
export type IValuePropertyType = import("./10-position-config.js").IValuePropertyType;
/**
 * --- Type Defs ---
 */
export type ITimePropertyType = import("./10-position-config.js").ITimePropertyType;
/**
 * --- Type Defs ---
 */
export type IPositionConfigNode = import("./10-position-config.js").IPositionConfigNode;
/**
 * --- Type Defs ---
 */
export type ITimePropertyResult = import("./10-position-config.js").ITimePropertyResult;
export type IDUPropertyTypeInst = {
    /**
     * - valid days
     */
    compare: any;
};
export type IDUPropertyType = ITypedValue & IDUPropertyTypeInst;
/**
 * Extensions for the nodeInstance object type
 */
export type IDelayUntilNodeInstance = {
    /**
     * -   tbd
     */
    positionConfig: IPositionConfigNode;
    /**
     * -   time definition
     */
    timeData: ITimePropertyType;
    /**
     * -   kind of queue messages
     */
    queuingBehavior: ('all' | 'first' | 'last');
    /**
     * -   flush mesage control property definition
     */
    flushMsgs: IDUPropertyType;
    /**
     * -   drop mesage control property definition
     */
    dropMsgs: IDUPropertyType;
    /**
     * -   enqueue mesage control property definition
     */
    enqueueMsg: IDUPropertyType;
    /**
     * -   control property handling
     */
    ctrlProp: ITypedValue;
    /**
     * -   base time definition
     */
    tsCompare: number;
    /**
     * -   the message queue
     */
    msgQueue: any[];
    /**
     * -   the message queue
     */
    delayTimer: NodeJS.Timer;
    /**
     * -   next time object
     */
    nextTime: ITimePropertyResult;
    /**
     * -   indicator if intermedia node state
     */
    nextTimeIntermedia: boolean;
    /**
     * -   indicator if time is calculared by message
     */
    calcByMsg: boolean;
};
/**
 * Combine nodeInstance with additional, optional functions
 */
export type IDelayUntilNode = IDelayUntilNodeInstance & runtimeNode;
//# sourceMappingURL=22-delay-until.d.ts.map