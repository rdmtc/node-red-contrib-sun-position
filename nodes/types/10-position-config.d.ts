declare function _exports(RED: runtimeRED): void;
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
export type ILimitationsObj = import("./lib/dateTimeHelper").ILimitationsObj;
/**
 * --- Type Defs ---
 */
export type ISunTimeDef = any;
/**
 * --- Type Defs ---
 */
export type ISunTimeSingle = any;
/**
 * --- Type Defs ---
 */
export type ISunTimeList = any;
/**
 * --- Type Defs ---
 */
export type ISunPosition = any;
/**
 * --- Type Defs ---
 */
export type IMoonPosition = any;
/**
 * --- Type Defs ---
 */
export type IMoonIllumination = any;
/**
 * --- Type Defs ---
 */
export type IMoonData = any;
/**
 * --- Type Defs ---
 */
export type IMoonTimes = any;
/**
 * Extensions for the nodeInstance object type
 */
export type IPositionConfigNode = {
    valid: boolean;
    latitude: number;
    longitude: number;
    angleType: ('deg' | 'rad');
    tzOffset: number;
    tzDST: number;
    contextStore: string;
    cache: object;
    /**
     * register a node as child
     */
    register: FktRegister;
    /**
     * remove a previous registered node as child
     */
    deregister: FktDeregister;
    /**
     * checks the node configuration
     */
    checkNode: FktCheckNode;
    /**
     * Formate a Date Object to a Date and Time String
     */
    toDateTimeString: FktFormatDate;
    /**
     * Formate a Date Object to a Time String
     */
    toTimeString: FktFormatDate;
    /**
     * Formate a Date Object to a Date String
     */
    toDateString: FktFormatDate;
    /**
     * get list of custom angles
     */
    getCustomAngles: FktGetCustomAngles;
    /**
     * get list of all suntimes including custom ones
     */
    getSunTimesList: FktGetSunTimesList;
    /**
     * get a float value from a type input in Node-Red
     */
    getFloatProp: FktGetFloatProp;
    /**
     * get an formated date prepared for output
     */
    formatOutDate: FktFormatOutDate;
    /**
     * get the time Data prepared for output
     */
    getOutDataProp: FktGetOutDataProp;
    /**
     * Creates a out object, based on input data
     */
    setMessageProp: FktSetMessageProp;
    /**
     * get the time Data from a typed input
     */
    getTimeProp: FktGetTimeProp;
    /**
     * get a prepared JSONATA Expression
     */
    getJSONataExpression: FktGetJSONataExpression;
    /**
     * get a property value from a type input in Node-Red
     */
    getPropValue: FktGetPropValue;
    /**
     * compared two property's
     */
    comparePropValue: FktComparePropValue;
    getSunCalc: FktGetSunCalc;
    /**
     * ... obviously there are more ...
     */
    getMoonCalc: FktGetMoonCalc;
};
/**
 * This callback is displayed as a global member.
 */
export type IValuePropertyTypeCallback = (result: any, data: IValuePropertyType) => any;
export type ITypedValue = {
    /**
     * - type of the value
     */
    type: string;
    /**
     * - value
     */
    value: any;
};
export type IValuePropertyType = {
    /**
     * - type of the value
     */
    type: string;
    /**
     * - value
     */
    value: any;
    /**
     * - optional prepared Jsonata expression
     */
    expr?: any;
    /**
     * - function which should be called after value was recived
     */
    callback?: IValuePropertyTypeCallback;
    /**
     * - true if no error shoudl be given in GUI
     */
    noError?: boolean;
    /**
     * base Date to use for Date time functions
     */
    now?: Date;
};
export type INodeCacheSunData = {
    times: any;
    dayId: number;
    sunPosAtSolarNoon?: any;
};
export type INodeCacheMoonData = {
    times: any;
    dayId: number;
    positionAtRise: any;
    positionAtSet: any;
};
export type INodeCacheData = {
    /**
     * - last mooncalc
     */
    lastSunCalc: ISunDataResult | {
        ts: number;
    };
    /**
     * - last mooncalc
     */
    lastMoonCalc: any;
    /**
     * - last mooncalc
     */
    sunTimesToday: INodeCacheSunData;
    /**
     * - last mooncalc
     */
    sunTimesTomorrow: INodeCacheSunData;
    /**
     * - last mooncalc
     */
    sunTimesAdd1: INodeCacheSunData;
    /**
     * - last mooncalc
     */
    sunTimesAdd2: INodeCacheSunData;
    /**
     * - last mooncalc
     */
    moonTimesToday: INodeCacheMoonData;
    /**
     * - last mooncalc
     */
    moonTimesTomorrow: INodeCacheMoonData;
    /**
     * - last mooncalc
     */
    moonTimes2Days: INodeCacheMoonData;
};
export type ISunDataResult = {
    /**
     * - the date of the calculated sun data as timestamp
     */
    ts: number;
    /**
     * - the date of the calculated sun data
     */
    lastUpdate: Date;
    /**
     * - date as string
     */
    lastUpdateStr: string;
    /**
     * - latitude
     */
    latitude: number;
    /**
     * - longitude
     */
    longitude: number;
    /**
     * -observer height
     */
    height: number;
    angleType: ('deg' | 'rad');
    azimuth: number;
    altitude: number;
    altitudeDegrees: number;
    azimuthDegrees: number;
    altitudeRadians: number;
    azimuthRadians: number;
    times: any;
    positionAtSolarNoon?: any;
    altitudePercent?: number;
};
export type IMoonDataResult = {
    /**
     * - the date of the calculated sun data as timestamp
     */
    ts: number;
    /**
     * - the date of the calculated sun data
     */
    lastUpdate: Date;
    /**
     * - date as string
     */
    lastUpdateStr: string;
    /**
     * - latitude
     */
    latitude: number;
    /**
     * - longitude
     */
    longitude: number;
    angleType: ('deg' | 'rad');
    azimuth: number;
    altitude: number;
    altitudeDegrees: number;
    azimuthDegrees: number;
    altitudeRadians: number;
    azimuthRadians: number;
    distance: number;
    parallacticAngle: number;
    illumination: any;
    zenithAngle: number;
    times: any;
    timesNext?: any;
    positionAtRise?: any;
    positionAtSet?: any;
    altitudePercent?: number;
    highestPosition?: any;
    isUp?: boolean;
};
export type ITimeResult = {
    /**
     * - a Date object of the neesed date/time
     */
    value: Date;
    /**
     * - The time as unix timestamp
     */
    ts: number;
    /**
     * - The position of the sun on the time
     */
    pos: number;
    /**
     * - Angle of the sun on the time
     */
    angle: number;
    /**
     * - The time as julian calendar
     */
    julian: number;
    /**
     * - indicates if the time is valid or not
     */
    valid: boolean;
    /**
     * - string of an error message if an error occurs
     */
    error?: string;
};
export type ISunTimeDefRed = {
    /**
     * - The Name of the time
     */
    name: string;
    /**
     * - Date object with the calculated sun-time
     */
    value: Date;
    /**
     * - The position of the sun on the time
     */
    pos: number;
    /**
     * - The elevation angle
     */
    elevation: number;
    /**
     * - indicates if the time is valid or not
     */
    valid: boolean;
};
export type ISunTimeDefNextLast = {
    /**
     * - next sun time
     */
    next: ISunTimeDefRed;
    /**
     * - previous sun time
     */
    last: ISunTimeDefRed;
};
export type IMoonTime = {
    /**
     * - a Date object of the neesed date/time
     */
    value: Date | number;
    /**
     * - string of an error message if an error occurs
     */
    error?: string;
};
export type IOffsetData = {
    /**
     * - value of the offset
     */
    offset?: string;
    /**
     * - type name of the offset
     */
    offsetType?: string;
    /**
     * - callback function for getting getPropValue
     */
    offsetCallback?: IValuePropertyTypeCallback;
    /**
     * - true if no error should be given in GUI
     */
    noOffsetError?: boolean;
    /**
     * - multiplier to the time
     */
    multiplier?: number;
};
export type ITimePropertyTypeInt = {
    /**
     * - format of the input
     */
    format?: string;
    /**
     * - valid days
     */
    days?: string;
    /**
     * - valid monthss
     */
    months?: string;
    /**
     * - base date, current time as default
     */
    now?: Date;
    /**
     * - latitude
     */
    latitude?: number;
    /**
     * - longitude
     */
    longitude?: number;
    /**
     * - height definition
     */
    height?: number;
    /**
     * - optional prepared Jsonata expression
     */
    expr?: any;
};
export type ITimePropertyType = ITimePropertyTypeInt & ILimitationsObj & ITypedValue & IOffsetData;
/**
 * get a float value from a type input in Node-Red
 */
export type IGetFloatPropData = {
    /**
     * - type of the value
     */
    type: string;
    /**
     * - value
     */
    value: any;
    /**
     * - optional prepared Jsonata expression
     */
    expr?: any;
    /**
     * - default value if can not get float value
     */
    def?: number;
    /**
     * - callback function for getting getPropValue
     */
    callback?: IValuePropertyTypeCallback;
    /**
     * - true if no error should be given in GUI
     */
    noError?: boolean;
    /**
     * base Date to use for Date time functions
     */
    now?: Date;
};
export type ITimePropertyResult = {
    /**
     * - the Date value
     */
    value: Date;
    /**
     * - error message if an error has occured
     */
    error: string;
    /**
     * - indicator if the given time value is a fix date
     */
    fix: boolean;
};
/**
 * check this node for configuration errors
 */
export type FktRegister = Function;
/**
 * check this node for configuration errors
 */
export type FktDeregister = Function;
/**
 * check this node for configuration errors
 */
export type FktCheckNode = Function;
/**
 * Formate a Date Object
 */
export type FktFormatDate = Function;
/**
 * get list of custom angles
 */
export type FktGetCustomAngles = Function;
/**
 * get list of all suntimes including custom ones
 */
export type FktGetSunTimesList = Function;
/**
 * get a float value from a type input in Node-Red
 */
export type FktGetFloatProp = Function;
/**
 * get an formated date prepared for output
 */
export type FktFormatOutDate = Function;
/**
 * get the time Data prepared for output
 */
export type FktGetOutDataProp = Function;
/**
 * Creates a out object, based on input data
 */
export type FktSetMessageProp = Function;
/**
 * get the time Data from a typed input
 */
export type FktGetTimeProp = Function;
/**
 * get a prepared JSONATA Expression
 */
export type FktGetJSONataExpression = Function;
/**
 * get a property value from a type input in Node-Red
 */
export type FktGetPropValue = Function;
/**
 * compared two property's
 */
export type FktComparePropValue = Function;
/**
 * compared two property's
 */
export type FktGetSunCalc = Function;
/**
 * compared two property's
 */
export type FktGetMoonCalc = Function;
/**
 * check an array if an array has duplicates.
 */
export type FktHasDuplicates = (arr: Array<string>) => boolean;
/**
 * check an array if an array has duplicates.
 */
export type FktValidateCustomTimes = (riseName: Array<{
    riseName: string;
    setName: string;
    angle: number;
    rad: boolean;
}>) => boolean;
//# sourceMappingURL=10-position-config.d.ts.map