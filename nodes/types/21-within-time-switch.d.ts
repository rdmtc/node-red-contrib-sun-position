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
 * Extensions for the nodeInstance object type
 */
export type IWithinTimeNodeInstance = {
    /**
     * -   tbd
     */
    positionConfig: IPositionConfigNode;
    /**
     * -   ??
     */
    timeStart: ITimePropertyType;
    /**
     * -   ??
     */
    timeStartAlt: ITimePropertyType;
    /**
     * -   ??
     */
    propertyStart: IValuePropertyType;
    /**
     * -   ??
     */
    propertyStartOperator: string;
    /**
     * -   ??
     */
    propertyStartThreshold: IValuePropertyType;
    /**
     * -   ??
     */
    timeEnd: ITimePropertyType;
    /**
     * -   ??
     */
    timeEndAlt: ITimePropertyType;
    /**
     * -   ??
     */
    propertyEnd: IValuePropertyType;
    /**
     * -   ??
     */
    propertyEndOperator: string;
    /**
     * -   ??
     */
    propertyEndThreshold: IValuePropertyType;
    /**
     * -   ??
     */
    timeRestrictions: IValuePropertyType;
    /**
     * -   ??
     */
    withinTimeValue: ITypedValue;
    /**
     * -   ??
     */
    outOfTimeValue: ITypedValue;
    /**
     * -   ??
     */
    timeOnlyEvenDays: boolean;
    /**
     * -   ??
     */
    timeOnlyOddDays: boolean;
    /**
     * -   ??
     */
    timeOnlyEvenWeeks: boolean;
    /**
     * -   ??
     */
    timeOnlyOddWeeks: boolean;
    /**
     * -   ??
     */
    timeStartDate: Date;
    /**
     * -   ??
     */
    timeEndDate: Date;
    /**
     * -   ??
     */
    timeDays: Array<number>;
    /**
     * -   ??
     */
    timeMonths: Array<number>;
    /**
     * -   ??
     */
    timeOutObj: NodeJS.Timer;
    /**
     * -   ??
     */
    lastMsgObj: any;
    /**
     * -   ??
     */
    tsCompare: number;
};
/**
 * Combine nodeInstance with additional, optional functions
 */
export type IWithinTimeNode = IWithinTimeNodeInstance & runtimeNode;
//# sourceMappingURL=21-within-time-switch.d.ts.map