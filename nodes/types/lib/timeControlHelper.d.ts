/**
 * Timestamp compare function
 */
export type ICompareTimeStamp = (timeStamp: number) => boolean;
/**
 * --- Type Defs ---
 */
export type runtimeRED = import('../types/typedefs.js').runtimeRED;
/**
 * --- Type Defs ---
 */
export type runtimeNode = import('../types/typedefs.js').runtimeNode;
/**
 * --- Type Defs ---
 */
export type runtimeNodeConfig = import('../types/typedefs.js').runtimeNodeConfig;
/**
 * --- Type Defs ---
 */
export type ITimeObject = import("./dateTimeHelper.js").ITimeObject;
/**
 * --- Type Defs ---
 */
export type ILimitationsObj = import("./dateTimeHelper.js").ILimitationsObj;
/**
 * --- Type Defs ---
 */
export type IPositionConfigNode = import("../10-position-config.js").IPositionConfigNode;
/**
 * --- Type Defs ---
 */
export type ITimePropertyResult = import("../10-position-config.js").ITimePropertyResult;
/**
 * object for sore autotrigger data
 */
export type IAutoTrigger = {
    /**
     * - default next autotriggering time
     */
    defaultTime: number;
    /**
     * - type of next autotriggering
     */
    type: (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
    /**
     * - next autotrigger in milliseconds
     */
    time: number;
    /**
     * - autotrigger TimeOut Object
     */
    timer?: NodeJS.Timeout;
};
/**
 * object for a rule condition
 */
export type IRuleCondition = {
    /**
     * - position of the condition
     */
    condition: number;
    /**
     * - description of the condition
     */
    conditionText?: string;
    /**
     * - first operand
     */
    value: string | number;
    /**
     * - first operand type
     */
    valueType: string;
    /**
     * - JSONATA expression
     */
    valueExpr?: Function;
    /**
     * - first operand description
     */
    valueName?: string;
    /**
     * - first operand description (short version)
     */
    valueNameShort?: string;
    /**
     * - opCallback value
     */
    valueWorth?: string;
    /**
     * - operator
     */
    operator: string;
    /**
     * - operator description
     */
    operatorText?: string;
    /**
     * - operator description enhanced
     */
    operatorDescription?: string;
    /**
     * - second operand
     */
    threshold: string;
    /**
     * - second operand type
     */
    thresholdType: string;
    /**
     * - JSONATA expression
     */
    thresholdExpr?: Function;
    /**
     * - second operand description
     */
    thresholdName?: string;
    /**
     * - second operand description (short version)
     */
    thresholdNameShort?: string;
    /**
     * - opCallback value
     */
    thresholdWorth?: string;
    /**
     * - comparision text
     */
    text?: string;
    /**
     * - comparision text (short version)
     */
    textShort?: string;
    /**
     * - result of the condition evaluation
     */
    result: boolean;
};
/**
 * object for a rule condition
 */
export type IRuleConditionResult = {
    /**
     * - selected condition index
     */
    index: number;
    /**
     * - comparision text
     */
    text?: string;
    /**
     * - comparision text (short version)
     */
    textShort?: string;
    /**
     * - result of the condition evaluation
     */
    result: boolean;
};
/**
 * object for a rule time definition
 */
export type IRuleTimeDefSingle = {
    /**
     * - time value
     */
    value: string;
    /**
     * - type of the time
     */
    type: string;
    /**
     * - time offset value
     */
    offset: string | number;
    /**
     * - time offset type
     */
    offsetType: string;
    /**
     * - time offset value
     */
    multiplier: number;
    /**
     * - time offset value
     */
    next: boolean;
    /**
     * - start time definition
     */
    now?: Date;
};
/**
 * object for a rule time definition
 */
export type IRuleTimeDef = {
    /**
     * - time value
     */
    value: string;
    /**
     * - type of the time
     */
    type: string;
    /**
     * - time offset value
     */
    offset: string | number;
    /**
     * - time offset type
     */
    offsetType: string;
    /**
     * - time offset value
     */
    multiplier: number;
    /**
     * - time offset value
     */
    next: boolean;
    /**
     * - start time definition
     */
    now?: Date;
    /**
     * - minimum limitation to the time
     */
    min?: IRuleTimeDefSingle;
    /**
     * - maximum limitation to the time
     */
    max?: IRuleTimeDefSingle;
};
/**
 * object for a rule time definition
 */
export type IRuleTimesDefInt = {
    /**
     * - start time definition
     */
    start?: IRuleTimeDef;
    /**
     * - end time definition
     */
    end?: IRuleTimeDef;
};
/**
 * object for a rule time definition
 */
export type IRuleTimesDef = ILimitationsObj & IRuleTimesDefInt;
/**
 * object for a rule time definition
 */
export type ITimePropertyResultInt = {
    /**
     * - time in milliseconds
     */
    ts: number;
    /**
     * - day id of the date
     */
    dayId: number;
    /**
     * - time representation
     */
    timeLocal?: string;
    /**
     * - time representation
     */
    timeLocalDate?: string;
    /**
     * - time representation
     */
    dateISO?: string;
    /**
     * - time representation
     */
    dateUTC?: string;
    /**
     * - source of the data if it comes from minimum or maximum limitation
     */
    source?: ('default' | 'min' | 'max');
};
/**
 * object for a rule time definition
 */
export type ITimePropResult = ITimePropertyResultInt & ITimePropertyResult;
/**
 * object for a rule time definition
 */
export type IRuleTimeDataDef = {
    /**
     * - start time definition
     */
    start?: ITimePropResult;
    /**
     * - end time definition
     */
    end?: ITimePropResult;
    /**
     * - start time definition
     */
    now?: number;
};
/**
 * object for a rule time definition
 */
export type IRuleTimeDataMinMaxDef = {
    /**
     * - start time definition
     */
    start?: ITimePropResult;
    /**
     * - end time definition
     */
    end?: ITimePropResult;
};
/**
 * object for a rule
 */
export type IRuleData = {
    /**
     * - defines if a rle is enabled or disabled
     */
    enabled: boolean;
    /**
     * - rule position
     */
    pos: number;
    /**
     * - name of the rule
     */
    name: string;
    /**
     * - executuion type of a rule which is defined
     */
    exec: number;
    /**
     * - executuion type of a rule which is used
     */
    execUse: number;
    /**
     * - overwrites reset
     */
    resetOverwrite: boolean;
    /**
     * - importance of the rule
     */
    importance: number;
    /**
     * - defines if the rule has conditions
     */
    conditional: boolean;
    /**
     * - conditions for a rule
     */
    conditions: Array<IRuleCondition>;
    /**
     * - condition resule
     */
    conditonResult: IRuleConditionResult;
    /**
     * - rule time Data
     */
    time?: IRuleTimesDef;
    /**
     * - object for storing time Data
     */
    timeResult?: IRuleTimeDataDef;
    /**
     * - object for storing time Data
     */
    timeResultMin?: IRuleTimeDataMinMaxDef;
    /**
     * - object for storing time Data
     */
    timeResultMax?: IRuleTimeDataMinMaxDef;
    /**
     * - rule time Data
     */
    payload?: any;
    /**
     * - rule time Data
     */
    level?: any;
    /**
     * - rule time Data
     */
    slat?: any;
    /**
     * - rule time Data
     */
    topic: string;
    /**
     * - rule time Data
     */
    outputValue?: any;
    /**
     * - rule time Data
     */
    outputType?: string;
};
/**
 * object for a rule result
 */
export type IRuleResultData = {
    /**
     * - index of selected rule
     */
    ruleindex: number;
    /**
     * - selected rule
     */
    ruleSel?: IRuleData;
    /**
     * - selected rule
     */
    ruleSlatOvs?: IRuleData;
    /**
     * - selected rule
     */
    ruleTopicOvs?: IRuleData;
    /**
     * - selected rule
     */
    ruleSelMin?: IRuleData;
    /**
     * - selected rule
     */
    ruleSelMax?: IRuleData;
    /**
     * - object for storing time Data
     */
    timeResult?: IRuleTimeDataDef;
    /**
     * - object for storing time Data
     */
    timeResultMin?: IRuleTimeDataDef;
    /**
     * - object for storing time Data
     */
    timeResultMax?: IRuleTimeDataDef;
};
/**
 * object for a rule
 */
export type IRulesData = {
    /**
     * - the rules itself
     */
    data: Array<IRuleData>;
    /**
     * - executuion type of a rule which is defined
     */
    count: number;
    /**
     * - last rule for first evaluation loop
     */
    last1stRun: number;
    /**
     * - maximum inportance of all rules
     */
    maxImportance: number;
    /**
     * - __true__ if any rule can overwrite reset
     */
    canResetOverwrite: boolean;
};
/**
 * object for a rule
 */
export type ISunData = {
    /**
     * - mode of the sun
     */
    mode: (0 | 1 | 3 | 16);
    /**
     * - maximum mode
     */
    modeMax: (0 | 1 | 3 | 16);
    /**
     * - floorLength value
     */
    floorLength: string;
    /**
     * - type of the floorLength
     */
    floorLengthType: string;
    /**
     * - timestamp of the next change
     */
    changeAgain: number;
    /**
     * - minimum delta
     */
    minDelta: number;
    /**
     * - rule time Data
     */
    level?: any;
    /**
     * - rule time Data
     */
    slat?: any;
    /**
     * - rule time Data
     */
    topic: string;
};
/**
 * Extensions for the nodeInstance object type
 */
export type ITimeControlNodeInstance = {
    /**
     * -   tbd
     */
    positionConfig: IPositionConfigNode;
    /**
     * internal used additional id
     */
    addId: string;
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
     * -   definition of the rule Data
     */
    rules: IRulesData;
    /**
     * -   indicator if the Level is in reverse order
     */
    levelReverse?: boolean;
    /**
     * -   the sun data Object
     */
    sunData?: ISunData;
    /**
     * -   tbd
     */
    nowarn: any;
    /**
     * -   tbd
     */
    results: Array<any>;
    /**
     * autotrigger options
     */
    autoTrigger: IAutoTrigger;
    /**
     * -   tbd
     */
    startDelayTimeOut: any;
    /**
     * -   tbd
     */
    startDelayTimeOutObj: NodeJS.Timeout;
    /**
     * -   Overwrite Reset TimeOut Object
     * ... obviously there are more ...
     */
    timeOutObj: NodeJS.Timeout;
};
/**
 * Combine nodeInstance with additional, optional functions
 */
export type ITimeControlNode = ITimeControlNodeInstance & runtimeNode;
/******************************************************************************************/
/**
* Timestamp compare function
* @callback ICompareTimeStamp
* @param {number} timeStamp The timestamp which should be compared
* @returns {Boolean} return true if if the timestamp is valid, otherwise false
*/
/******************************************************************************************/
/**
 * Returns true if the given object is null or undefined. Otherwise, returns false.
 * @param {*} object    object to check
 * @returns {boolean}   true if the given object is null or undefined. Otherwise, returns false.
 */
export function isNullOrUndefined(object: any): boolean;
/**
 * evaluate temporary Data
 * @param {ITimeControlNode} node   node Data
 * @param {string} type  type of type input
 * @param {string} value  value of typeinput
 * @param {*} data  data to cache
 * @param {Object} tempData  object which holding the chached data
 * @returns {*}  data which was cached
 */
export function evalTempData(node: ITimeControlNode, type: string, value: string, data: any, tempData: any): any;
/**
* reset any existing override
* @param {ITimeControlNode} node node data
*/
export function posOverwriteReset(node: ITimeControlNode): void;
/**
* setup the expiring of n override or update an existing expiring
* @param {ITimeControlNode} node node data
* @param {ITimeObject} oNow the *current* date Object
* @param {number} dExpire the expiring time, (if it is NaN, default time will be tried to use) if it is not used, nor a Number or less than 1 no expiring activated
*/
export function setExpiringOverwrite(node: ITimeControlNode, oNow: ITimeObject, dExpire: number, reason: any): void;
/**
* check if an override can be reset
* @param {ITimeControlNode} node node data
* @param {Object} msg message object
* @param {ITimeObject} oNow the *current* date Object
*/
export function checkOverrideReset(node: ITimeControlNode, msg: any, oNow: ITimeObject, isSignificant: any): void;
/**
* setting the reason for override
* @param {ITimeControlNode} node node data
*/
export function setOverwriteReason(node: ITimeControlNode): boolean;
/******************************************************************************************/
/**
 * pre-checking conditions to may be able to store temp data
 * @param {ITimeControlNode} node node data
 * @param {Object} msg the message object
 * @param {Object} tempData the temporary storage object
 * @param {Date} dNow simple Date Object
 */
export function prepareRules(node: ITimeControlNode, msg: any, tempData: any, dNow: Date): void;
/**
 * get time constrainty of a rule
 * @param {ITimeControlNode} node node data
 * @param {Object} msg the message object
 * @param {IRuleData} rule the rule data
 * @param {('start'|'end')} timep rule type
 * @param {Date} dNow base timestamp
 * @param {number} def default value
 */
export function getRuleTimeData(node: ITimeControlNode, msg: any, rule: IRuleData, timep: ('start' | 'end'), dNow: Date, def: number): void;
/*************************************************************************************************************************/
/**
 * check if a level has a valid value
 * @param {ITimeControlNode} node the node data
 * @param {number} level the level to check
 * @returns {boolean} true if the level is valid, otherwise false
 */
export function validPosition(node: ITimeControlNode, level: number, allowRound: any): boolean;
/*************************************************************************************************************************/
/**
 * function to check a rule
 * @param {ITimeControlNode} node the node object
 * @param {Object} msg the message object
 * @param {IRuleData} rule a rule object to test
 * @param {ITimeObject} tData Now time object
 * @returns {IRuleData|null} returns the rule if rule is valid, otherwhise null
 */
export function compareRules(node: ITimeControlNode, msg: any, rule: IRuleData, tData: ITimeObject): IRuleData | null;
/******************************************************************************************/
/**
 * check all rules and determinate the active rule
 * @param {ITimeControlNode} node node data
 * @param {Object} msg the message object
 * @param {ITimeObject} oNow the *current* date Object
 * @param {Object} tempData the object storing the temporary caching data
 * @returns {IRuleResultData} the active rule or null
 */
export function getActiveRules(node: ITimeControlNode, msg: any, oNow: ITimeObject, tempData: any): IRuleResultData;
/**
 * initializes the node
 * @param {runtimeRED} REDLib the level to check
 * @param {ITimeControlNode} node the node data
 * @param {Object} config the level to check
 */
export function initializeCtrl(REDLib: runtimeRED, node: ITimeControlNode, config: any): void;
export namespace cRuleType {
    const absolute: number;
    const levelMinOversteer: number;
    const levelMaxOversteer: number;
    const slatOversteer: number;
    const topicOversteer: number;
    const off: number;
}
export const cRuleDefault: -1;
export const cRuleLogOperatorAnd: 2;
export const cRuleLogOperatorOr: 1;
//# sourceMappingURL=timeControlHelper.d.ts.map