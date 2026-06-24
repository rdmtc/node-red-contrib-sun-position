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
export type IOffsetData = import("./10-position-config.js").IOffsetData;
export type ITIPropertyTypeInt = {
    /**
     * - valid days
     */
    outType: string;
    /**
     * - valid days
     */
    outValue: any;
    /**
     * - optional prepared Jsonata expression
     */
    expr?: string;
};
export type ITIPropertyType = ILimitationsObj & ITypedValue & IOffsetData & ITIPropertyTypeInt;
/**
 * Extensions for the nodeInstance object type
 */
export type ITimeInjectNodeInstance = {
    /**
     * -   tbd
     */
    positionConfig: IPositionConfigNode;
    /**
     * internal used additional id
     */
    addId: string;
    /**
     * type of the inject node
     */
    injType: number;
    /**
     * -   count of the interval
     */
    intervalCount: number;
    /**
     * -   ??
     */
    intervalCountType: string;
    /**
     * -   ??
     */
    intervalCountMultiplier: number;
    /**
     * -   ??
     */
    intervalStart: Date;
    /**
     * -   ??
     */
    intervalAmount: number;
    /**
     * -   ??
     */
    intervalCountCurrent: number;
    /**
     * -   ??
     */
    intervalCountMax: number;
    /**
     * -   the text of the interval
     */
    intervalText: string;
    /**
     * -   ??
     */
    timeStartData: ITimePropertyType;
    /**
     * -   ??
     */
    property: IValuePropertyType;
    /**
     * -   ??
     */
    propertyThreshold: ITypedValue;
    /**
     * -   ??
     */
    propertyOperator: string;
    /**
     * -   ??
     */
    timeStartAltData: ITimePropertyType;
    /**
     * -   ??
     */
    timeEndData: ITimePropertyType;
    /**
     * -   ??
     */
    cronJobObj: any;
    /**
     * -   ??
     */
    cronExpr: string;
    /**
     * -   output data
     */
    props: Array<ITIPropertyType>;
    /**
     * -   ??
     */
    recalcTime: number;
    /**
     * -   ??
     */
    timeOutStartObj: NodeJS.Timeout;
    /**
     * -   ??
     */
    timeOutEndObj: NodeJS.Timeout;
    /**
     * -   ??
     */
    intervalObj: NodeJS.Timer;
    /**
     * -   ??
     */
    onceTimeOutObj: NodeJS.Timeout;
    /**
     * -   ??
     */
    intervalTime: number;
    /**
     * -   ??
     */
    nextStartTime: Date;
    /**
     * -   ??
     */
    nextStartTimeAlt: Date;
    /**
     * -   ??
     */
    nextEndTime: Date;
    /**
     * -   ??
     */
    onceDelay: number;
    /**
     * -   ??
     */
    timedatestart: Date;
    /**
     * -   ??
     */
    timedateend: Date;
    /**
     * -   ??
     */
    isAltAvailable: boolean;
    /**
     * -   ??
     */
    isAltFirst: boolean;
    /**
     * -   ??
     */
    cacheYear: number;
    /**
     * -   ??
     */
    cacheStart: Date;
    /**
     * -   ??
     */
    cacheEnd: Date;
    /**
     * - get the limitation for time
     */
    getTimeLimitation: Function;
    /**
     * - initializes the start timer
     */
    initializeStartTimer: Function;
    /**
     * - initializes the node itself
     */
    initialize: Function;
    /**
     * - get the end time in millisecond
     */
    getMillisecEnd: IGetTimeAsMillisecond;
    /**
     * - creates the start timeout
     */
    doCreateStartTimeout: Function;
    /**
     * - creates the end timeout
     */
    doCreateEndTimeout: Function;
    /**
     * - creates the CRON interval
     */
    doCreateCRONSetup: Function;
    /**
     * - Recalculate the Start timeout
     */
    doRecalcStartTimeOut: Function;
    /**
     * - start an Intervall
     */
    doStartInterval: Function;
    /**
     * - creates the text for an interval
     */
    getIntervalText: Function;
    /**
     * - Recalculate the Interval
     */
    createNextInterval: Function;
    /**
     * - Prepares a message object for sending
     */
    prepOutMsg: Function;
    /**
     * - get and validate a given interval
     */
    getIntervalTime: Function;
    /**
     * - get and validate a given interval
     * ... obviously there are more ...
     */
    doSetStatus: Function;
};
/**
 * Description of the function
 */
export type IGetTimeAsMillisecond = Function;
/**
 * Combine nodeInstance with additional, optional functions
 */
export type ITimeInjectNode = ITimeInjectNodeInstance & runtimeNode;
//# sourceMappingURL=20-time-inject.d.ts.map