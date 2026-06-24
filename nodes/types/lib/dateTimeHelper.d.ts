export type IIsFoundNumberFunc = (res: number) => any;
export type INotFoundFunc = (msg: any) => any;
export type IIsFoundBoolFunc = (result: boolean, realResult: any, topic: string) => any;
/**
 * Data
 */
export type ITimeObject = any;
export type ILimitationsObj = {
    /**
     * - if __true__ the next date will be delivered starting from now, otherwise the matching date of the date from now
     */
    next?: boolean;
    /**
     * - days for which should be calculated the sun time
     */
    days?: Array<number> | string;
    /**
     * - months for which should be calculated the sun time
     */
    months?: Array<number> | string;
    /**
     * - if true only odd days will be used
     */
    onlyOddDays?: boolean;
    /**
     * - if true only even days will be used
     */
    onlyEvenDays?: boolean;
    /**
     * - if true only odd weeks will be used
     */
    onlyOddWeeks?: boolean;
    /**
     * - if true only even weeks will be used
     */
    onlyEvenWeeks?: boolean;
    /**
     * - Date for start range
     */
    dateStart?: Date;
    /**
     * - Date for end range
     * dateStart
     */
    dateEnd?: Date;
};
export type ILimitedDate = {
    /**
     * - The limited Date
     */
    date: Date;
    /**
     * - indicator if the input Date has changed
     */
    hasChanged: boolean;
    /**
     * - if an error occurs the string is not empty
     */
    error: string;
};
export const TIME_WEEK: 604800000;
export const TIME_5d: 432000000;
export const TIME_4d: 345600000;
export const TIME_3d: 259200000;
export const TIME_36h: 129600000;
export const TIME_24h: 86400000;
export const TIME_12h: 43200000;
export const TIME_1h: 3600000;
export const TIME_1min: 60000;
export const TIME_1s: 1000;
/*******************************************************************************************************/
/*******************************************************************************************************/
/*******************************************************************************************************/
/**
 * returns **true** if the parameter value is a valid boolean value for **false** or **true**
 * @param {*} val a parameter which should be checked if  it is a valid false boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for for **false** or **true**
 */
export function isBool(val: any): boolean;
/**
 * returns **true** if the parameter value is a valid boolean value for **true**
 * @param {*} val a parameter which should be checked if  it is a valid true boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **true**
 */
export function isTrue(val: any): boolean;
/**
 * returns **true** if the parameter value is a valid boolean value for **false**
 * @param {*} val a parameter which should be checked if  it is a valid false boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **false**
 */
export function isFalse(val: any): boolean;
/**
 * Exclusive OR
 * @param {*} a  -  operand one
 * @param {*} b  -  operand two
 * @returns {boolean}  -  **true** if the a expression or b expression is **true** (like ||), but not if both are **true**
 */
export function XOR(a: any, b: any): boolean;
/**
 * Exclusive AND
 * @param {*} a  -  operand one
 * @param {*} b  -  operand two
 * @returns {boolean}  -  **true** if the a expression and b expression is **true** (like &&) or if both are **false**
 */
export function XAND(a: any, b: any): boolean;
/*******************************************************************************************************/
/**
 * creates a string with two digits
 * @param {number} n number to format
 * @returns {string} number with minimum two digits
 */
export function pad2(n: number): string;
/**
 * creates a string from a number with leading zeros
 * @param {any} val number to format
 * @param {number} [len] length of number (default 2)
 * @returns {string} number with minimum digits as defined in length
 */
export function pad(val: any, len?: number): string;
/**
 * normalizes an angle
 * @param {number} angle to normalize
 */
export function angleNorm(angle: number): number;
/**
 * normalizes an angle
 * @param {number} angle to normalize
 */
export function angleNormRad(angle: number): number;
/**
 * radians to decimal grad
 * @param {number} rad angle in radians
 * @return {number} angle in decimal grad
 */
export function toDec(rad: number): number;
/**
 * decimal grad to radians
 * @param {number} dec angle in decimal grad
 * @return {number} angle in radians
 */
export function toRad(dec: number): number;
/*******************************************************************************************************/
/**
 * clip a text to a maximum length
 * @param {string} v text to clip
 * @param {number} [l] length to clip the text
* @returns {string} string not longer than the given length
 */
export function clipStrLength(v: string, l?: number): string;
/**
 * count the number of decimals of a number
 * @param {*} value number to check
 */
export function countDecimals(value: any): any;
/*******************************************************************************************************/
/*******************************************************************************************************/
/*******************************************************************************************************/
/**
 * generic function for handle a error in a node
 * @param {any} node the node where the error occurs
 * @param {String} messageText the message text
 * @param {Error} [err] the error object
 * @param {string} [stateText] the state text which should be set to the node
 */
export function handleError(node: any, messageText: string, err?: Error, stateText?: string): void;
/*******************************************************************************************************/
/**
 * check if a value is filled or returns default value
 * @param {any} val to check for undefined, null, empty
 * @param {any} defaultVal default value to use
 * @returns {any} result to use if value is undefined, null or empty string
 */
export function chkValueFilled(val: any, defaultVal: any): any;
/*******************************************************************************************************/
/**
 * check if a given number is in given limits
 * @param {number} num number angle to compare
 * @param {number} [low] low limit
 * @param {number} [high] high limit
 * @return {boolean}  **true** if the number is inside given limits, at least one limit must be validate, otherwise returns **false**
 */
export function checkLimits(num: number, low?: number, high?: number): boolean;
/**
 * @callback IIsFoundBoolFunc
 * @param  {boolean} result -   found value converted to boolean
 * @param  {*} realResult   -   real value which was found or the complete payload
 * @param  {string} topic   -   topic of the message
 */
/**
 * check if the msg or msg.property contains a property with value true or the topic contains the given name
 * @param {*} msg message
 * @param {string|Array.<string>} ids property names to check
 * @param {string|Array.<string>} [names] topic names to check
 * @param {IIsFoundBoolFunc} [isFound] if the topic is found this function will be called with the found value
 * @param {INotFoundFunc} [notFound] topic names to check
 * @return {boolean|any}
 */
export function getMsgBoolValue(msg: any, ids: string | Array<string>, names?: string | Array<string>, isFound?: IIsFoundBoolFunc, notFound?: INotFoundFunc): boolean | any;
/**
 * check if the msg contains a property with value true (no payload check)
 * @param {*} msg message
 * @param {string|Array.<string>} ids property names to check
 * @param {IIsFoundBoolFunc} [isFound] if the topic is found this function will be called with the found value
 * @param {INotFoundFunc} [notFound] topic names to check
 * @return {boolean|any}
 */
export function getMsgBoolValue2(msg: any, ids: string | Array<string>, isFound?: IIsFoundBoolFunc, notFound?: INotFoundFunc): boolean | any;
/**
 * check if thetopic contains one of the given names
 * @param {*} msg message
 * @param {string|Array.<string>} [names] topic names to check
 * @param {IIsFoundBoolFunc} [isFound] if the topic is found this function will be called with the found value
 * @param {INotFoundFunc} [notFound] topic names to check
 * @return {boolean}
 */
export function getMsgTopicContains(msg: any, names?: string | Array<string>, isFound?: IIsFoundBoolFunc, notFound?: INotFoundFunc): boolean;
/**
 * @callback IIsFoundNumberFunc
 * @param  {number} res -   Value of the found value
 */
/**
 * @callback INotFoundFunc
 * @param  {*} msg  -   message
 *  @return {any}
 */
/**
 * check the type of the message
 * @param {*} msg message
 * @param {string|Array.<string>} ids property names to check
 * @param {string|Array.<string>} [names] topic names to check
 * @param {IIsFoundNumberFunc} [isFound] if the topic is found this function will be called with the found value
 * @param {INotFoundFunc} [notFound] topic names to check
 * @return {number|any}
 */
export function getMsgNumberValue(msg: any, ids: string | Array<string>, names?: string | Array<string>, isFound?: IIsFoundNumberFunc, notFound?: INotFoundFunc): number | any;
/**
 * check the type of the message
 * @param {*} msg message
 * @param {string|Array.<string>} ids property names to check
 * @param {IIsFoundNumberFunc} [isFound] if the topic is found this function will be called with the found value
 * @param {INotFoundFunc} [notFound] topic names to check
 * @return {number|any}
 */
export function getMsgNumberValue2(msg: any, ids: string | Array<string>, isFound?: IIsFoundNumberFunc, notFound?: INotFoundFunc): number | any;
/**
 * get a date for the special day in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {string} dayName  Name of the special day
 * @returns {Date|null} last day of given month or null
 */
export function getSpecialDayOfMonth(year: number, month: number, dayName: string): Date | null;
/*******************************************************************************************************/
/**
 * get a date for the first day of week in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} [dayOfWeek]  Day of week, where 0 is Sunday, 1 Monday ... 6 Saturday
 * @returns {Date} first day of given month
 */
/**
 * get a date for the specific day of week in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} [dayOfWeek] day of week 0=Sunday, 1=Monday, ..., 6=Saturday
 * @param {number} [n] the nTh Numer of the day of week - 0 based
 * @returns {Date} weekday of given month
 */
export function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek?: number, n?: number): Date;
/**
 * get a date for the last day of week in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} [dayOfWeek]  Day of week, where 0 is Sunday, 1 Monday ... 6 Saturday
 * @returns {Date} last day of given month
 */
export function getLastDayOfMonth(year: number, month: number, dayOfWeek?: number): Date;
/*******************************************************************************************************/
/**
 * get the standard timezone offset without DST
 * @param {Date} d - Date to check
 * @returns {number} minutes of the timezone offset
 */
export function getStdTimezoneOffset(d: Date): number;
/**
 * check mif a given Date is DST
 * @param {Date} d - Date to check
 * @returns {boolean} _true_ if the given Date has DST
 */
export function isDSTObserved(d: Date): boolean;
/*******************************************************************************************************/
/**
 * adds an offset to a given Date object (Warning: No copy of Date Object will be created and original Date Object could be changed!!)
 * @param {Date} d Date object where the offset should be added
 * @param {number} offset the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
 * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
 * @return {Date|undefined|null}  Date with added offset
 */
export function addOffset(d: Date, offset: number, multiplier?: number): Date | undefined | null;
/*******************************************************************************************************/
/**
 * calculates the number of days to get a positive date object
 * @param {Array.<number>} days array of allowed days
 * @param {number} daystart start day (0=Sunday)
 * @return {number} number of days for the next valid day as offset to the daystart
 */
export function calcDayOffset(days: Array<number>, daystart: number): number;
/**
 * calculates the number of month to get a positive date object
 * @param {Array.<number>} months array of allowed months
 * @param {number} monthstart start month (0=January)
 * @return {number} number of months for the next valid day as offset to the monthstart
 */
export function calcMonthOffset(months: Array<number>, monthstart: number): number;
/**
 * changes the time based on a timezone
 * @param {Date} date Javascript Date object
 * @param {number} timeZoneOffset Offset in Minutes
  * @return {date} new date object with changed timezone to use with .toLocaleString()
 */
export function convertDateTimeZone(date: Date, timeZoneOffset: number): Date;
/**
 * checks if a value is a valid Date object
 * @param {*} d - a value to check
 * @returns {boolean} returns __true__ if it is a valid Date, otherwhise __false__
 */
export function isValidDate(d: any): boolean;
/**
 * Parse an ISO date string (i.e. "2019-01-18T00:00:00.000Z",
 * "2019-01-17T17:00:00.000-07:00", or "2019-01-18T07:00:00.000+07:00",
 * which are the same time) and return a JavaScript Date object with the
 * value represented by the string.
 * @param {string} isoString - a ISO 8601 format string
 * @returns {Date} returns Date represtntation of the string
 */
export function isoStringToDate(isoString: string): Date;
/**
 * Round a date to the nearest full Hour
 * @param {Date} date Date to round
 * @returns {Date} Date round to next full Hour
 */
export function roundToHour(date: Date): Date;
/*******************************************************************************************************/
/**
 * normalize date by adding offset, get only the next valid date, etc...
 * @param {Date|number|object} d input Date to normalize
 * @param {number} offset offset to add tot he Date object
 * @param {number} multiplier multiplier for the offset
 * @param {ILimitationsObj} [limit] additional limitations for the calculation
 * @return {Date} a normalized date moved tot the future to fulfill all conditions
 */
export function normalizeDate(d: Date | number | object, offset: number, multiplier: number, limit?: ILimitationsObj): Date;
/**
 * calculates limitation of a date
 * @param {ILimitationsObj} limit    -   limitation object
 * @param {Date} d  -   Date to check
 * @returns {ILimitedDate} result limited Date Object.
 */
export function limitDate(limit: ILimitationsObj, d: Date): ILimitedDate;
/*******************************************************************************************************/
/**
 * parses a string which contains only a time to a Date object of today
 * @param {string} t text representation of a time
 * @param {Date} [date] bade Date object for parsing the time, now will be used if not defined
 * @param {boolean} [utc] define if the time should be in utc
 * @param {number} [timeZoneOffset] define a time zone offset if required
 * @return {Date|null} the parsed date object or **null** if can not parsed
 */
export function getTimeOfText(t: string, date?: Date, utc?: boolean, timeZoneOffset?: number): Date | null;
/*******************************************************************************************************/
/**
 * parses a string which contains a date or only a time to a Date object
 * @param {any} dt number or text which contains a date or a time
 * @param {boolean} preferMonthFirst if true, Dates with moth first should be preferd, otherwise month last (european)
 * @param {boolean} [utc] indicates if the date should be in utc
 * @param {number} [timeZoneOffset] timezone offset in minutes of the input date
 * @param {Date} [dNow] base Date, if defined missing parts will be used from this Date object
 * @return {Date} the parsed date object, throws an error if can not parsed
 */
export function getDateOfText(dt: any, preferMonthFirst: boolean, utc?: boolean, timeZoneOffset?: number, dNow?: Date): Date;
/**
 * For a given date, get the day number
 * @param {Date} date date to get day number
 * @returns {Array} day number, [UTCFullYear, dayNumber]
 */
export function getDayOfYear(date: Date): any[];
/**
 * For a given date, get the ISO week number
 *
 * Based on information at:
 *
 *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
 *
 * Algorithm is to find nearest thursday, it's year
 * is the year of the week number. Then get weeks
 * between that date and the first day of that year.
 *
 * Note that dates in one year can be weeks of previous
 * or next year, overlap is up to 3 days.
 *
 * e.g. 2014/12/29 is Monday in week  1 of 2015
 *      2012/1/1   is Sunday in week 52 of 2011
 *
 * @param {Date} date date to get week number
 * @returns {Array} ISO week number, [UTCFullYear, weekNumber]
 */
export function getWeekOfYear(date: Date): any[];
/**
 * gets a day id from a date
 * @param {Date} d date to get day id from
 */
export function getUTCDayId(d: Date): number;
/**
 * gets a day id from a date
 * @param {Date} d date to get day id from
 */
export function getDayId(d: Date): number;
/*******************************************************************************************************/
/*******************************************************************************************************/
/**
 * convert the time part of a date into a comparable number
 * @param {Date} date  - date to convert
 * @return {number}   numeric representation of the time part of the date
 */
export function getTimeNumberUTC(date: Date): number;
/*******************************************************************************************************/
/**
 * get the timeout time
 * @param {Date} base - base time (tyically new Date())
 * @param {Date} time - time to schedule the timeout
 * @returns {number} milliseconds until the defined Date
 */
export function getTimeOut(base: Date, time: Date): number;
/*******************************************************************************************************/
/**
 * gives a ID of a node
 * @param {any} node a node
 * @returns {string} id of the given node
 */
export function getNodeId(node: any): string;
/**
 * pre defined formats of a given date
 * @param  {Array.<string>}  [dayNames]      -  Array of day Names in short and ["Sunday", "Monday", ..., "Mo", "Tu", ...]
 * @param  {Array.<string>}  [monthNames]    -  Array of month Names long and short ["January", "February", ..., "Jan", "Feb", ...]
 * @param  {Array.<string>}  [dayDiffNames]  -  Array of names for relative day, starting 7 days ago ["1 week ago", "6 days ago", ..., "Yesterday", "Today", "Tomorrow", ...]
 * @return {any}   returns a number, string or object depending on the given Format
 */
export function initializeParser(dayNames?: Array<string>, monthNames?: Array<string>, dayDiffNames?: Array<string>): any;
/**
 * pre defined formats of a given date
 * @param  {Date | number}            date            -  JavaScript Date to format
 * @param  {string | number}          [format]        -  format of the date
 * @param  {boolean} [utc] - indicates if the formatted date should be in utc or not
 * @param  {number} [timeZoneOffset] - timezone offset for conversation in minutes
 * @return {any}   returns a number, string or object depending on the given Format
 */
export function getFormattedDateOut(date: Date | number, format?: string | number, utc?: boolean, timeZoneOffset?: number): any;
/**
 * parses a date string to given format definition
 * @param {string} date date string to parse
 * @param {number|string} format Format definition, if it is a number a predefined format will be try
 * @param {Array.<string>} [dayNames] list of day names
 * @param {Array.<string>} [monthNames] list of month names
 * @param {Array.<string>} [dayDiffNames] list of day diff names
 * @param {boolean} [utc] indicates if the date should be in utc
 * @param {number} [timeZoneOffset] timezone offset in minutes of the input date
 * @param {Date} [dNow] base Date, if defined missing parts will be used from this Date object
 * @returns {Date} a Date object or throws an error if no patterns match.
 */
export function parseDateFromFormat(date: string, format: number | string, dayNames?: Array<string>, monthNames?: Array<string>, dayDiffNames?: Array<string>, utc?: boolean, timeZoneOffset?: number, dNow?: Date): Date;
/**
 * replaces placeholder in a string
 * @param {string} text - the text to replace placeholders
 * @param {object} textAttrs - an object with different propertys who are allowed as placeholders
 * @param {object} RED - the object for the Node-Red API
 * @param {object} [msg] - (optional) the message object for additional replace of message properties
 * @returns {string} the text with replaced placeholders
 */
export function textReplace(text: string, textAttrs: object, RED: object, msg?: object): string;
/******************************************************************************************/
/**
 * the definition of the time to compare
 * @param {*} node the current node object
 * @param {*} msg the message object
* @returns {Date} Date object of given Date or now
 */
export function getNowTimeStamp(node: any, msg: any): Date;
/**
* the definition of the time to compare
* @param {*} node the current node object
* @param {*} msg the message object
* @returns {ITimeObject} Date object of given Date or now
*/
export function getNowObject(node: any, msg: any): ITimeObject;
/**
 * get a value by a path
 * @param {object} obj      object to get path from
 * @param {string} path     path to property
 * @returns the value of the property
 */
export function getDeepValue(obj: object, path: string): any;
//# sourceMappingURL=dateTimeHelper.d.ts.map