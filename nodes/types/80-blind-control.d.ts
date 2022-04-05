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
export type ITypedValue = import("./10-position-config.js").ITypedValue;
/**
 * --- Type Defs ---
 */
export type ITimeControlNode = import("./lib/timeControlHelper.js").ITimeControlNode;
/**
 * --- Type Defs ---
 */
export type IPositionConfigNode = import("./lib/timeControlHelper.js").IPositionConfigNode;
/**
 * Node data object
 */
export type IBlindNodeData = {
    /**
     * - is the node disabled
     */
    isDisabled: boolean;
    /**
     * - the blind top level
     */
    levelTop: number;
    /**
     * - the blind bottom level
     */
    levelBottom: number;
    /**
     * - the blind top level offset
     */
    levelTopOffset?: number;
    /**
     * - the blind bottom level
     */
    levelBottomOffset?: number;
    /**
     * - open/closing increment
     */
    increment: number;
    /**
     * - defaulot level
     */
    levelDefault: ITypedValue;
    /**
     * - minimum level
     */
    levelMin: ITypedValue;
    /**
     * - maximum levell
     */
    levelMax: ITypedValue;
    /**
     * - default slat setting
     */
    slat: ITypedValue;
    /**
     * - default topic
     */
    topic: string;
    /**
     * - additional id of the node
     */
    addId: ITypedValue;
    /**
     * - open/closing increment
     */
    overwrite: {
        active: boolean;
        importance: number;
        expireDuration: number;
    };
};
/**
 * the window settings
 */
export type IBlindWindowSettings = {
    /**
     * - the top of the window
     */
    top: any;
    /**
     * - type of the top of the window
     */
    topType: string;
    /**
     * - the bottom of the window
     */
    bottom: any;
    /**
     * - type of the bottom of the window
     */
    bottomType: string;
    /**
     * - mode of the start/end angles
     */
    setMode: ('setMode' | 'orientation');
    /**
     * - the start position angle to the geographical north
     */
    azimuthStart: any;
    /**
     * - type of the start position angle to the geographical north
     */
    azimuthStartType: string;
    /**
     * - the end position angle to the geographical north
     */
    azimuthEnd: any;
    /**
     * - type of the end position angle to the geographical north
     */
    azimuthEndType: string;
    /**
     * - the orientation angle to the geographical north
     */
    windowOrientation: any;
    /**
     * - type of the  the orientation angle to the geographical north
     */
    windowOrientationType: string;
    /**
     * - an offset for the angle clockwise offset
     */
    windowOffsetP: number;
    /**
     * - an offset for the angle anti-clockwise offset
     */
    windowOffsetN: number;
};
/**
 * the window settings
 */
export type IOversteerSettings = {
    /**
     * - the top of the window
     */
    isChecked: boolean;
    /**
     * - type of the top of the window
     */
    active: boolean;
    /**
     * - the topic of the oversteer
     */
    topic: string;
};
/**
 * the window settings
 */
export type IOversteerData = {
    /**
     * - position
     */
    pos: number;
    /**
     * - the top of the window
     */
    mode: (0 | 1 | 3 | 16);
    /**
     * - type of the top of the window
     */
    value: any;
    /**
     * - type of the value operator 1
     */
    valueType: string;
    /**
     * - value operator 1
     */
    valueExpr: Function;
    /**
     * - compare operator
     */
    operator: string;
    /**
     * - compare operator text
     */
    operatorText?: string;
    /**
     * - type of the value operator 2
     */
    thresholdType: string;
    /**
     * - value operator 2
     */
    threshold: string;
    /**
     * - blind position
     */
    blindPos: ITypedValue;
    /**
     * - slat position
     */
    slatPos: ITypedValue;
    /**
     * - slat position
     */
    onlySunInWindow: boolean;
};
/**
 * Extensions for the nodeInstance object type
 */
export type IBlindControlNodeInstance = {
    /**
     * get/set generic Data of the node
     */
    nodeData: IBlindNodeData;
    /**
     * -   the window settings Object
     */
    windowSettings: IBlindWindowSettings;
    /**
     * smoothTime
     */
    smoothTime: number;
    /**
     * -   tbd
     */
    oversteers: Array<IOversteerData>;
    /**
     * -   tbd
     */
    oversteer: IOversteerSettings;
    /**
     * -   tbd
     */
    level: any;
    /**
     * -   tbd
     * ... obviously there are more ...
     */
    results: Array<any>;
};
/**
 * Combine nodeInstance with additional, optional functions
 */
export type IBlindControlNode = ITimeControlNode & IBlindControlNodeInstance;
//# sourceMappingURL=80-blind-control.d.ts.map