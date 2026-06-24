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
export type ITimePropertyType = import("./10-position-config.js").ITimePropertyType;
/**
 * --- Type Defs ---
 */
export type IPositionConfigNode = import("./10-position-config.js").IPositionConfigNode;
/**
 * Extensions for the nodeInstance object type
 */
export type ITimeSpanNodeInstance = {
    /**
     * -   tbd
     */
    positionConfig: IPositionConfigNode;
    /**
     * -   operand1 data
     */
    operand1: ITimePropertyType;
    /**
     * -   operand2 data
     */
    operand2: ITimePropertyType;
    /**
     * -   operand
     */
    operand: number;
    /**
     * -   output data
     */
    results: any[];
    /**
     * -   input data
     */
    rules: any[];
    /**
     * -   define if check all rules
     */
    checkall: boolean | string;
};
/**
 * Combine nodeInstance with additional, optional functions
 */
export type ITimeSpanNode = ITimeSpanNodeInstance & runtimeNode;
//# sourceMappingURL=61-time-span.d.ts.map