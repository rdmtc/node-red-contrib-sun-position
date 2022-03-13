// @ts-check
/*
 * This code is licensed under the Apache License Version 2.0.
 *
 * Copyright (c) 2022 Robert Gester
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 */

/********************************************
 * dateTimeHelper.js:
 *********************************************/
'use strict';
/** --- Type Defs ---
 * @typedef {import('../types/typedefs.js').runtimeRED} runtimeRED
 * @typedef {import('../types/typedefs.js').runtimeNode} runtimeNode
 * @typedef {import('../types/typedefs.js').runtimeNodeConfig} runtimeNodeConfig
 * @typedef {import("./dateTimeHelper.js").ITimeObject} ITimeObject
 * @typedef {import("./dateTimeHelper.js").ILimitationsObj} ILimitationsObj
 * @typedef {import("../10-position-config.js").IPositionConfigNode} IPositionConfigNode
 * @typedef {import("../10-position-config.js").ITimePropertyResult} ITimePropertyResult
 */

/**
 * @typedef {Object} IAutoTrigger object for sore autotrigger data
 * @property {number} defaultTime   - default next autotriggering time
 * @property {(0|1|2|3|4|5|6|7|8|9)} type         - type of next autotriggering
 * @property {number} time          - next autotrigger in milliseconds
 */

/**
 * @typedef {Object} IRuleCondition object for a rule condition
 *
 * @property {number} condition             - position of the condition
 * @property {string} [conditionText]       - description of the condition
 * @property {string|number} value          - first operand
 * @property {string} valueType             - first operand type
 * @property {function} [valueExpr]         - JSONATA expression
 * @property {string} [valueName]           - first operand description
 * @property {string} [valueNameShort]      - first operand description (short version)
 * @property {string} [valueWorth]          - opCallback value
 * @property {string} operator              - operator
 * @property {string} [operatorText]        - operator description
 * @property {string} [operatorDescription] - operator description enhanced
 * @property {string} threshold             - second operand
 * @property {string} thresholdType         - second operand type
 * @property {function} [thresholdExpr]     - JSONATA expression
 * @property {string} [thresholdName]       - second operand description
 * @property {string} [thresholdNameShort]  - second operand description (short version)
 * @property {string} [thresholdWorth]      - opCallback value
 * @property {string} [text]                - comparision text
 * @property {string} [textShort]           - comparision text (short version)
 * @property {boolean} result               - result of the condition evaluation
 */

/**
 * @typedef {Object} IRuleConditionResult object for a rule condition
 *
 * @property {number} index               - selected condition index
 * @property {string} [text]                - comparision text
 * @property {string} [textShort]           - comparision text (short version)
 * @property {boolean} result               - result of the condition evaluation
 */

/**
 * @typedef {Object} IRuleTimeDefSingle object for a rule time definition
 *
 * @property {string} value                 - time value
 * @property {string} type                  - type of the time
 * @property {string|number} offset         - time offset value
 * @property {string} offsetType            - time offset type
 * @property {number} multiplier            - time offset value
 * @property {boolean} next                 - time offset value
 * @property {Date} [now]                   - start time definition
 */

/**
 * @typedef {Object} IRuleTimeDef object for a rule time definition
 *
 * @property {string} value                 - time value
 * @property {string} type                  - type of the time
 * @property {string|number} offset         - time offset value
 * @property {string} offsetType            - time offset type
 * @property {number} multiplier            - time offset value
 * @property {boolean} next                 - time offset value
 * @property {Date} [now]                   - start time definition
 *
 * @property {(0|1)} [operator]             - time operator
 * @property {(0|1)} [operatorText]         - time operator text
 *
 * @property {IRuleTimeDefSingle} [min]     - minimum limitation to the time
 * @property {IRuleTimeDefSingle} [max]     - maximum limitation to the time
  */

/**
 * @typedef {ILimitationsObj & IRuleTimeDef} IRuleTimesDef object for a rule time definition
 */

/**
 * @typedef {Object} ITimePropertyResultInt object for a rule time definition
 *
 * @property {number} ts                - time in milliseconds
 * @property {number} dayId             - day id of the date
 * @property {string} [timeLocal]       - time representation
 * @property {string} [timeLocalDate]   - time representation
 * @property {string} [dateISO]         - time representation
 * @property {string} [dateUTC]         - time representation
 * @property {('default'|'min'|'max')} [source]    - source of the data if it comes from minimum or maximum limitation
 * @property {number} [now]                 - start time definition
 */

/**
 * @typedef {ITimePropertyResultInt & ITimePropertyResult} ITimePropResult object for a rule time definition
 */

/**
 * @typedef {Object} IRuleData object for a rule
 * @property {boolean} enabled                      - defines if a rle is enabled or disabled
 * @property {number} pos                           - rule position
 * @property {string} name                          - name of the rule
 * @property {number} exec                          - executuion type of a rule which is defined
 * @property {number} execUse                       - executuion type of a rule which is used
 * @property {boolean} resetOverwrite               - overwrites reset
 * @property {number} importance                    - importance of the rule
 * @property {boolean} conditional                  - defines if the rule has conditions
 * @property {Array.<IRuleCondition>} conditions    - conditions for a rule
 * @property {IRuleConditionResult} conditon        - condition resule
 * @property {IRuleTimesDef} [time]                 - rule time Data
 * @property {IRuleTimesDef} [timeMin]              - rule time Data
 * @property {IRuleTimesDef} [timeMax]              - rule time Data
 * @property {ITimePropResult} [timeData]           - object for storing time Data
 * @property {ITimePropResult} [timeDataMin]        - object for storing time Data
 * @property {ITimePropResult} [timeDataMax]        - object for storing time Data
 * @property {Object} [payload]                     - rule time Data
 * @property {Object} [level]                       - rule time Data
 * @property {Object} [slat]                        - rule time Data
 * @property {string} topic                         - rule time Data
 * @property {Object} [outputValue]                 - rule time Data
 * @property {string} [outputType]                  - rule time Data
 */

/**
 * @typedef {Object} IRuleResultData object for a rule result
 * @property {number} ruleindex                     - index of selected rule
 * @property {IRuleData} [ruleSel]                  - selected rule
 * @property {IRuleData} [ruleSlatOvs]                  - selected rule
 * @property {IRuleData} [ruleTopicOvs]                  - selected rule
 * @property {IRuleData} [ruleSelMin]                  - selected rule
 * @property {IRuleData} [ruleSelMax]                  - selected rule
 * @property {IRuleTimesDef} [timeResult]          - object for storing time Data
 * @property {IRuleTimesDef} [timeResultMin]          - object for storing time Data
 * @property {IRuleTimesDef} [timeResultMax]          - object for storing time Data
 */

/**
 * @typedef {Object} IRulesData object for a rule
 * @property {Array.<IRuleData>} data       - the rules itself
 * @property {number} count                 - executuion type of a rule which is defined
 * @property {number} lastUntil             - last rule for first evaluation loop
 * @property {number} firstFrom             - first from rule
 * @property {number} firstTimeLimited      - first from rule with time limitation
 * @property {number} maxImportance         - maximum inportance of all rules
 * @property {boolean} canResetOverwrite    - __true__ if any rule can overwrite reset
 */

/**
 * @typedef {Object} ISunData object for a rule
 * @property {(0|1|3|16)} mode                 - mode of the sun
 * @property {(0|1|3|16)} modeMax              - maximum mode
 * @property {string} floorLength              - floorLength value
 * @property {string} floorLengthType          - type of the floorLength
 * @property {number} changeAgain              - timestamp of the next change
 * @property {number} minDelta                 - minimum delta
 * @property {Object} [level]                  - rule time Data
 * @property {Object} [slat]                   - rule time Data
 * @property {string} topic                    - rule time Data
 */

/**
 * @typedef {Object} ITimeControlNodeInstance Extensions for the nodeInstance object type
 * @property {IPositionConfigNode} positionConfig    -   tbd
 * @property {string} addId internal used additional id
 * @property {Object} nodeData get/set generic Data of the node
 * @property {Object} reason    -   tbd
 * @property {string} contextStore    -   used context store
 * @property {IRulesData} rules    -   definition of the rule Data
 *
 * @property {boolean} [levelReverse]    -   indicator if the Level is in reverse order
 * @property {ISunData} [sunData]    -   the sun data Object
 * @property {Object} nowarn    -   tbd
 *
 * @property {Array.<Object>} results    -   tbd
 *
 * @property {IAutoTrigger} autoTrigger autotrigger options
 * @property {NodeJS.Timeout} [autoTriggerObj] - autotrigger TimeOut Object
 *
 * @property {Object} startDelayTimeOut    -   tbd
 * @property {NodeJS.Timeout} startDelayTimeOutObj    -   tbd
 * @property {NodeJS.Timeout} timeOutObj    -   Overwrite Reset TimeOut Object
 * ... obviously there are more ...
 */

/**
 * @typedef {ITimeControlNodeInstance & runtimeNode} ITimeControlNode Combine nodeInstance with additional, optional functions
 */

const util = require('util');
const hlp = require( './dateTimeHelper.js' );

module.exports = {
    isNullOrUndefined,
    evalTempData,
    posOverwriteReset,
    setExpiringOverwrite,
    checkOverrideReset,
    setOverwriteReason,
    prepareRules,
    getRuleTimeData,
    validPosition,
    compareRules,
    initializeCtrl
};

const cRuleUntil = 0;
const cRuleFrom = 1;
const cRuleAbsolute = 0;
// const cRuleNone = 0;
// const cRuleMinOversteer = 1; // ⭳❗ minimum (oversteer)
// const cRuleMaxOversteer = 2; // ⭱️❗ maximum (oversteer)
const cRuleLogOperatorAnd = 2;
const cRuleLogOperatorOr = 1;
let RED = null;
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
function isNullOrUndefined(object) {
    return (object === null || typeof object === 'undefined'); // isNullOrUndefined(object)
}

/**
 * evaluate temporary Data
 * @param {ITimeControlNode} node   node Data
 * @param {string} type  type of type input
 * @param {string} value  value of typeinput
 * @param {*} data  data to cache
 * @param {Object} tempData  object which holding the chached data
 * @returns {*}  data which was cached
 */
function evalTempData(node, type, value, data, tempData) {
    // node.debug(`evalTempData type=${type} value=${value} data=${data}`);
    const name = `${type}.${value}`;
    if (isNullOrUndefined(data)) {
        if (typeof tempData[name] !== 'undefined') {
            if (type !== 'PlT') {
                node.log(RED._('node-red-contrib-sun-position/position-config:errors.usingTempValue', { type, value, usedValue: tempData[name] }));
            }
            return tempData[name];
        }
        if (node.nowarn[name]) {
            return undefined; // only one error per run
        }
        node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warning', { message: RED._('node-red-contrib-sun-position/position-config:errors.notEvaluablePropertyUsedValue', { type, value, usedValue: 'undefined' }) }));
        node.nowarn[name] = true;
        return undefined;
    }
    tempData[name] = data;
    return data;
}
/******************************************************************************************/
/**
* clears expire object properties
* @param {ITimeControlNode} node node data
*/
function deleteExpireProp(node) {
    delete node.nodeData.overwrite.expires;
    delete node.nodeData.overwrite.expireTs;
    delete node.nodeData.overwrite.expireDate;
    delete node.nodeData.overwrite.expireDateISO;
    delete node.nodeData.overwrite.expireDateUTC;
    delete node.nodeData.overwrite.expireTimeLocal;
    delete node.nodeData.overwrite.expireDateLocal;
}

/**
* reset any existing override
* @param {ITimeControlNode} node node data
*/
function posOverwriteReset(node) {
    node.debug(`posOverwriteReset expire=${node.nodeData.overwrite.expireTs}`);
    node.nodeData.overwrite.active = false;
    node.nodeData.overwrite.importance = 0;
    if (node.timeOutObj) {
        clearTimeout(node.timeOutObj);
        node.timeOutObj = null;
    }
    if (node.nodeData.overwrite.expireTs || node.nodeData.overwrite.expires) {
        deleteExpireProp(node);
    }
    node.context().set('overwrite', node.nodeData.overwrite, node.contextStore);
}

/**
* setup the expiring of n override or update an existing expiring
* @param {ITimeControlNode} node node data
* @param {ITimeObject} oNow the *current* date Object
* @param {number} dExpire the expiring time, (if it is NaN, default time will be tried to use) if it is not used, nor a Number or less than 1 no expiring activated
*/
function setExpiringOverwrite(node, oNow, dExpire, reason) {
    node.debug(`setExpiringOverwrite dExpire=${dExpire}, reason=${reason}`);
    if (node.timeOutObj) {
        clearTimeout(node.timeOutObj);
        node.timeOutObj = null;
    }

    if (isNaN(dExpire)) {
        dExpire = node.nodeData.overwrite.expireDuration;
        node.debug(`using default expire value=${dExpire}`);
    }
    node.nodeData.overwrite.expires = Number.isFinite(dExpire) && (dExpire > 0);

    if (!node.nodeData.overwrite.expires) {
        node.log(`Overwrite is set which never expire (${reason})`);
        node.debug(`expireNever expire=${dExpire}ms ${  typeof dExpire  } - isNaN=${  isNaN(dExpire)  } - finite=${  !isFinite(dExpire)  } - min=${  dExpire < 100}`);
        deleteExpireProp(node);
        node.context().set('overwrite', node.nodeData.overwrite, node.contextStore);
        return;
    }
    node.nodeData.overwrite.expireTs = (oNow.nowNr + dExpire);
    node.nodeData.overwrite.expireDate = new Date(node.nodeData.overwrite.expireTs);
    node.nodeData.overwrite.expireDateISO = node.nodeData.overwrite.expireDate.toISOString();
    node.nodeData.overwrite.expireDateUTC = node.nodeData.overwrite.expireDate.toUTCString();
    node.nodeData.overwrite.expireDateLocal = node.positionConfig.toDateString(node.nodeData.overwrite.expireDate);
    node.nodeData.overwrite.expireTimeLocal = node.positionConfig.toTimeString(node.nodeData.overwrite.expireDate);

    node.log(`Overwrite is set which expires in ${dExpire}ms = ${node.nodeData.overwrite.expireDateISO} (${reason})`);
    node.timeOutObj = setTimeout(() => {
        node.log(`Overwrite is expired (timeout)`);
        posOverwriteReset(node);
        node.emit('input', { payload: -1, topic: 'internal-triggerOnly-overwriteExpired', force: false });
    }, dExpire);
    node.context().set('overwrite', node.nodeData.overwrite, node.contextStore);
}

/**
* check if an override can be reset
* @param {ITimeControlNode} node node data
* @param {Object} msg message object
* @param {ITimeObject} oNow the *current* date Object
*/
function checkOverrideReset(node, msg, oNow, isSignificant) {
    if (node.nodeData.overwrite &&
       node.nodeData.overwrite.expires &&
       (node.nodeData.overwrite.expireTs < oNow.nowNr)) {
        node.log(`Overwrite is expired (trigger)`);
        posOverwriteReset(node);
    }
    if (isSignificant) {
        hlp.getMsgBoolValue(msg, ['reset','resetOverwrite'], 'resetOverwrite',
            val => {
                node.debug(`reset val="${util.inspect(val, { colors: true, compact: 5, breakLength: Infinity, depth: 10 })  }"`);
                if (val) {
                    if (node.nodeData.overwrite && node.nodeData.overwrite.active) {
                        node.log(`Overwrite reset by incoming message`);
                    }
                    posOverwriteReset(node);
                }
            });
    }
}
/**
* setting the reason for override
* @param {ITimeControlNode} node node data
*/
function setOverwriteReason(node) {
    if (node.nodeData.overwrite.active) {
        if (node.nodeData.overwrite.expireTs) {
            node.reason.code = 3;
            const obj = {
                importance: node.nodeData.overwrite.importance,
                timeLocal: node.nodeData.overwrite.expireTimeLocal,
                dateLocal: node.nodeData.overwrite.expireDateLocal,
                dateISO: node.nodeData.overwrite.expireDateISO,
                dateUTC: node.nodeData.overwrite.expireDateUTC
            };
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.overwriteExpire', obj);
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.overwriteExpire', obj);
        } else {
            node.reason.code = 2;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.overwriteNoExpire', { importance: node.nodeData.overwrite.importance });
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.overwriteNoExpire', { importance: node.nodeData.overwrite.importance });
        }
        // node.debug(`overwrite exit true node.nodeData.overwrite.active=${node.nodeData.overwrite.active}`);
        return true;
    }
    // node.debug(`overwrite exit true node.nodeData.overwrite.active=${node.nodeData.overwrite.active}`);
    return false;
}
/******************************************************************************************/
/**
 * pre-checking conditions to may be able to store temp data
 * @param {ITimeControlNode} node node data
 * @param {Object} msg the message object
 * @param {Object} tempData the temporary storage object
 * @param {Date} dNow simple Date Object
 */
function prepareRules(node, msg, tempData, dNow) {
    for (let i = 0; i < node.rules.count; ++i) {
        const rule = node.rules.data[i];
        if (rule.conditional) {
            rule.conditon = {
                index : -1,
                result : false
            };
            for (let i = 0; i < rule.conditions.length; i++) {
                const el = rule.conditions[i];
                if (rule.conditon.result === true && el.condition === cRuleLogOperatorOr) {
                    break; // not nessesary, becaue already tue
                } else if (rule.conditon.result === false && el.condition === cRuleLogOperatorAnd) {
                    break; // should never bekome true
                }
                delete el.valueWorth;
                delete el.thresholdWorth;
                if (el.valueType === 'sunControlMode') {
                    el.result = (node.sunData && (node.sunData.mode === el.value));
                } else {
                    el.result = node.positionConfig.comparePropValue(node, msg,
                        {
                            value: el.value,
                            type: el.valueType,
                            // @ts-ignore
                            expr: el.valueExpr,
                            callback: (result, _obj) => { // opCallback
                                el.valueWorth = _obj.value;
                                return evalTempData(node, _obj.type, _obj.value, result, tempData);
                            }
                        },
                        el.operator,
                        {
                            value: el.threshold,
                            type: el.thresholdType,
                            callback: (result, _obj) => { // opCallback
                                el.thresholdWorth = _obj.value;
                                return evalTempData(node, _obj.type, _obj.value, result, tempData);
                            }
                        }, false, dNow
                    );
                }
                rule.conditon = {
                    index : i,
                    result : el.result,
                    text : el.text,
                    textShort : el.textShort
                };
                if (typeof el.thresholdWorth !== 'undefined') {
                    rule.conditon.text += ' ' + el.thresholdWorth;
                    rule.conditon.textShort += ' ' + hlp.clipStrLength(el.thresholdWorth, 10);
                }
            }
        }
    }
}

/**
 * get time constrainty of a rule
 * @param {ITimeControlNode} node node data
 * @param {Object} msg the message object
 * @param {IRuleData} rule the rule data
 * @param {Date} dNow base timestamp
 */
function getRuleTimeData(node, msg, rule, dNow) {
    rule.time.now = dNow;
    rule.timeData = node.positionConfig.getTimeProp(node, msg, rule.time);
    if (rule.timeData.error) {
        hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeData.error }), undefined, rule.timeData.error);
        return -1;
    } else if (!rule.timeData.value) {
        throw new Error('Error can not calc time!');
    }
    rule.timeData.source = 'default';
    rule.timeData.ts = rule.timeData.value.getTime();
    // node.debug(`time=${rule.timeData.value} -> ${new Date(rule.timeData.value)}`);
    rule.timeData.dayId = hlp.getDayId(rule.timeData.value);
    if (rule.timeMin) {
        rule.timeMin.now = dNow;
        rule.timeDataMin = node.positionConfig.getTimeProp(node, msg, rule.timeMin);
        const numMin = rule.timeDataMin.value.getTime();
        rule.timeDataMin.source = 'min';
        if (rule.timeDataMin.error) {
            hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeDataMin.error }), undefined, rule.timeDataMin.error);
        } else if (!rule.timeDataMin.value) {
            throw new Error('Error can not calc Alt time!');
        } else {
            if (numMin > rule.timeData.ts) {
                [rule.timeData, rule.timeDataMin] = [rule.timeDataMin, rule.timeData];
                rule.timeData.ts = numMin;
                rule.timeData.dayId = hlp.getDayId(rule.timeDataMin.value);
            }
        }
    }
    if (rule.timeMax) {
        rule.timeMax.now = dNow;
        rule.timeDataMax = node.positionConfig.getTimeProp(node, msg, rule.timeMax);
        const numMax = rule.timeDataMax.value.getTime();
        rule.timeDataMax.source = 'max';
        if (rule.timeDataMax.error) {
            hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeDataMax.error }), undefined, rule.timeDataMax.error);
        } else if (!rule.timeDataMax.value) {
            throw new Error('Error can not calc Alt time!');
        } else {
            if (numMax < rule.timeData.ts) {
                [rule.timeData, rule.timeDataMax] = [rule.timeDataMax, rule.timeData];
                rule.timeData.ts = numMax;
                rule.timeData.dayId = hlp.getDayId(rule.timeDataMax.value);
            }
        }
    }
    return rule.timeData.ts;
}

/*************************************************************************************************************************/
/**
 * function to check a rule
 * @param {ITimeControlNode} node the node object
 * @param {Object} msg the message object
 * @param {IRuleData} rule a rule object to test
 * @param {ICompareTimeStamp} cmp a function to compare two timestamps.
 * @param {ITimeObject} tData Now time object
 * @returns {IRuleData|null} returns the rule if rule is valid, otherwhise null
 */
function compareRules(node, msg, rule, cmp, tData) {
    // node.debug(`compareRules rule ${rule.name} (${rule.pos}) rule=${util.inspect(rule, {colors:true, compact:10})}`);
    if (rule.conditional) {
        try {
            if (!rule.conditon.result) {
                node.debug(`compareRules rule ${rule.name} (${rule.pos}) conditon does not match`);
                return null;
            }
        } catch (err) {
            node.warn(RED._('node-red-contrib-sun-position/position-config:errors.getPropertyData', err));
            node.debug(util.inspect(err));
            return null;
        }
    }
    if (!rule.time) {
        return rule;
    }

    // @ts-ignore
    if (rule.time.days && !rule.time.days.includes(tData.dayNr)) {
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid days`);
        return null;
    }
    // @ts-ignore
    if (rule.time.months && !rule.time.months.includes(tData.monthNr)) {
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid month`);
        return null;
    }
    if (rule.time.onlyOddDays && (tData.dateNr % 2 === 0)) { // even
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid even days`);
        return null;
    }
    if (rule.time.onlyEvenDays && (tData.dateNr % 2 !== 0)) { // odd
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid odd days`);
        return null;
    }
    if (rule.time.onlyOddWeeks && (tData.weekNr % 2 === 0)) { // even
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid even week`);
        return null;
    }
    if (rule.time.onlyEvenWeeks && (tData.weekNr % 2 !== 0)) { // odd
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid odd week`);
        return null;
    }
    if (rule.time.dateStart || rule.time.dateEnd) {
        rule.time.dateStart.setFullYear(tData.yearNr);
        rule.time.dateEnd.setFullYear(tData.yearNr);
        if (rule.time.dateEnd > rule.time.dateStart) {
            // in the current year
            if (tData.now < rule.time.dateStart || tData.now > rule.time.dateEnd) {
                node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid date range within year`);
                return null;
            }
        } else {
            // switch between year from end to start
            if (tData.now < rule.time.dateStart && tData.now > rule.time.dateEnd) {
                node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid date range over year`);
                return null;
            }
        }
    }
    const num = getRuleTimeData(node, msg, rule, tData.now);
    // node.debug(`compareRules ${rule.name} (${rule.pos}) type=${rule.time.operatorText} - ${rule.time.value} - num=${num} - rule.timeData = ${ util.inspect(rule.timeData, { colors: true, compact: 40, breakLength: Infinity }) }`);
    if (tData.dayId === rule.timeData.dayId && num >=0 && (cmp(num) === true)) {
        return rule;
    }
    // node.debug(`compareRules rule ${rule.name} (${rule.pos}) dayId=${tData.dayId} rule-DayID=${rule.timeData.dayId} num=${num} cmp=${cmp(num)} invalid time`);
    return null;
}
/*************************************************************************************************************************/
/**
 * check if a level has a valid value
 * @param {ITimeControlNode} node the node data
 * @param {number} level the level to check
 * @returns {boolean} true if the level is valid, otherwise false
 */
function validPosition(node, level, allowRound) {
    // node.debug('validPosition level='+level);
    if (typeof level !== 'number' || level === null || typeof level === 'undefined' || isNaN(level)) {
        node.warn(`Position: "${String(level)}" is empty or not a valid number!`);
        return false;
    }

    if (level < node.nodeData.levelBottom) {
        if (node.levelReverse) {
            node.warn(`Position: "${level}" < open level ${node.nodeData.levelBottom}`);
        } else {
            node.warn(`Position: "${level}" < closed level ${node.nodeData.levelBottom}`);
        }
        return false;
    }
    if (level > node.nodeData.levelTop) {
        if (node.levelReverse) {
            node.warn(`Position: "${level}" > closed level ${node.nodeData.levelTop}`);
        } else {
            node.warn(`Position: "${level}" > open level ${node.nodeData.levelTop}`);
        }
        return false;
    }
    if (Number.isInteger(node.nodeData.levelTop) &&
        Number.isInteger(node.nodeData.levelBottom) &&
        Number.isInteger(node.nodeData.increment) &&
        ((level % node.nodeData.increment !== 0) ||
        !Number.isInteger(level) )) {
        node.warn(`Position invalid "${level}" not fit to increment ${node.nodeData.increment}`);
        return false;
    }
    if (allowRound) {
        return true;
    }
    return Number.isInteger(Number((level / node.nodeData.increment).toFixed(hlp.countDecimals(node.nodeData.increment) + 2)));
}
// ####################################################################################################
/**
 * initializes the node
 * @param {runtimeRED} REDLib the level to check
 * @param {ITimeControlNode} node the node data
 * @param {Object} config the level to check
 */
function initializeCtrl(REDLib, node, config) {
    node.debug(`initialize ${ node.name || node._path || node.id}`);
    RED = REDLib;

    const getName = (type, value) => {
        if (type === 'num') {
            return value;
        } else if (type === 'str') {
            return '"' + value + '"';
        } else if (type === 'bool') {
            return '"' + value + '"';
        } else if (type === 'global' || type === 'flow') {
            value = value.replace(/^#:(.+)::/, '');
        }
        return type + '.' + value;
    };
    const getNameShort = (type, value) => {
        if (type === 'num') {
            return value;
        } else if (type === 'str') {
            return '"' + hlp.clipStrLength(value,20) + '"';
        } else if (type === 'bool') {
            return '"' + value + '"';
        } else if (type === 'global' || type === 'flow') {
            value = value.replace(/^#:(.+)::/, '');
            // special for Homematic Devices
            if (/^.+\[('|").{18,}('|")\].*$/.test(value)) {
                value = value.replace(/^.+\[('|")/, '').replace(/('|")\].*$/, '');
                if (value.length > 25) {
                    return '...' + value.slice(-22);
                }
                return value;
            }
        }
        if ((type + value).length > 25) {
            return type + '...' + value.slice(-22);
        }
        return type + '.' + value;
    };

    node.results = [];
    config.results.forEach(prop => {
        const propNew = {
            outType     : prop.pt,
            outValue    : prop.p,
            type        : prop.vt,
            value       : prop.v
        };

        if (this.positionConfig && propNew.type === 'jsonata') {
            try {
                propNew.expr = this.positionConfig.getJSONataExpression(this, propNew.value);
            } catch (err) {
                this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error: err.message }));
                propNew.expr = null;
            }
        }
        node.results.push(propNew);
    });

    // Prepare Rules
    node.rules.count = node.rules.data.length;
    node.rules.lastUntil = node.rules.count -1;
    node.rules.firstFrom = node.rules.lastUntil;
    node.rules.firstTimeLimited = node.rules.count;
    node.rules.maxImportance = 0;
    node.rules.canResetOverwrite = false;

    for (let i = 0; i < node.rules.count; ++i) {
        const rule = node.rules.data[i];
        rule.pos = i + 1;
        // Backward compatibility
        if (!rule.conditions) {
            rule.conditions = [];
            // @ts-ignore
            if (rule.validOperandAType && rule.validOperandAType !==  'none') {
                rule.conditions.push({
                    condition       : cRuleLogOperatorOr,
                    conditionText    : '',
                    // @ts-ignore
                    value           : rule.validOperandAValue,
                    // @ts-ignore
                    valueType       : rule.validOperandAType,
                    // @ts-ignore
                    operator        : rule.validOperator,
                    // @ts-ignore
                    operatorText     : rule.validOperatorText,
                    // @ts-ignore
                    threshold       : rule.validOperandBValue,
                    // @ts-ignore
                    thresholdType   : (rule.validOperandBType || 'num'),
                    result          : false
                });
                // @ts-ignore
                const conditionValue = parseInt(rule.valid2LogOperator);
                // @ts-ignore
                if (conditionValue > 0 && rule.valid2OperandAType) {
                    rule.conditions.push({
                        // @ts-ignore
                        condition       : conditionValue,
                        // @ts-ignore
                        conditionText    : rule.valid2LogOperatorText,
                        // @ts-ignore
                        value           : rule.valid2OperandAValue,
                        // @ts-ignore
                        valueType       : (rule.valid2OperandAType || 'msg'),
                        // @ts-ignore
                        operator        : rule.valid2Operator,
                        // @ts-ignore
                        operatorText     : rule.valid2OperatorText,
                        // @ts-ignore
                        threshold       : rule.valid2OperandBValue,
                        // @ts-ignore
                        thresholdType   : (rule.valid2OperandBType || 'num'),
                        result          : false
                    });
                }
            }
            // @ts-ignore
            delete rule.validOperandAValue; // @ts-ignore
            delete rule.validOperandAType; // @ts-ignore
            delete rule.validOperator; // @ts-ignore
            delete rule.validOperatorText; // @ts-ignore
            delete rule.validOperandBValue; // @ts-ignore
            delete rule.validOperandBType; // @ts-ignore
            delete rule.valid2LogOperator; // @ts-ignore
            delete rule.valid2LogOperatorText; // @ts-ignore
            delete rule.valid2OperandAValue; // @ts-ignore
            delete rule.valid2OperandAType; // @ts-ignore
            delete rule.valid2Operator; // @ts-ignore
            delete rule.valid2OperatorText; // @ts-ignore
            delete rule.valid2OperandBValue; // @ts-ignore
            delete rule.valid2OperandBType; // @ts-ignore
        }
        // @ts-ignore
        if(rule.timeType) {
            // @ts-ignore
            if (!rule.time && rule.timeType !== 'none') {
                // @ts-ignore
                rule.time = {
                    // @ts-ignore
                    type            : rule.timeType,
                    // @ts-ignore
                    value           : (rule.timeValue || ''),
                    // @ts-ignore
                    operator        : (parseInt(rule.timeOp) || cRuleUntil),
                    // @ts-ignore
                    offsetType      : (rule.offsetType || 'none'),
                    // @ts-ignore
                    offset          : (rule.offsetValue || 1),
                    // @ts-ignore
                    multiplier      : (parseInt(rule.multiplier) || 60000),
                    // @ts-ignore
                    days            : (rule.timeDays || '*'),
                    // @ts-ignore
                    months          : (rule.timeMonths || '*')
                };
                // @ts-ignore
                if (rule.timeOnlyOddDays) rule.time.onlyOddDays = rule.timeOnlyOddDays; // @ts-ignore
                if (rule.timeOnlyEvenDays) rule.time.onlyEvenDays = rule.timeOnlyEvenDays; // @ts-ignore
                if (rule.timeDateStart) rule.time.dateStart = rule.timeDateStart; // @ts-ignore
                if (rule.timeDateEnd) rule.time.dateEnd = rule.timeDateEnd; // @ts-ignore
                if (rule.timeOpText) rule.time.operatorText = rule.timeOpText; // @ts-ignore
                if (rule.timeMinType) {
                    // @ts-ignore
                    if (!rule.timeMin && rule.timeMinType !== 'none') {
                        rule.timeMin = {
                            // @ts-ignore
                            type            : rule.timeMinType, // @ts-ignore
                            value           : (rule.timeMinValue || ''), // @ts-ignore
                            offsetType      : (rule.offsetMinType || 'none'), // @ts-ignore
                            offset          : (rule.offsetMinValue || 1), // @ts-ignore
                            multiplier      : (parseInt(rule.multiplierMin) || 60000),
                            next            : false
                        };
                    }
                }
                // @ts-ignore
                if (rule.timeMaxType) {
                    // @ts-ignore
                    if (!rule.timeMax && rule.timeMaxType !== 'none') {
                        rule.timeMax = {
                            // @ts-ignore
                            type            : rule.timeMaxType, // @ts-ignore
                            value           : (rule.timeMaxValue || ''), // @ts-ignore
                            offsetType      : (rule.offsetMaxType || 'none'), // @ts-ignore
                            offset          : (rule.offsetMaxValue || 1), // @ts-ignore
                            multiplier      : (parseInt(rule.multiplierMax) || 60000),
                            next            : false
                        };
                    }
                }
            }
            // @ts-ignore
            delete rule.timeType; // @ts-ignore
            delete rule.timeValue; // @ts-ignore
            delete rule.timeOp; // @ts-ignore
            delete rule.offsetType; // @ts-ignore
            delete rule.offsetValue; // @ts-ignore
            delete rule.multiplier; // @ts-ignore
            delete rule.timeDays; // @ts-ignore
            delete rule.timeMonths; // @ts-ignore
            delete rule.timeOnlyOddDays; // @ts-ignore
            delete rule.timeOnlyEvenDays; // @ts-ignore
            delete rule.timeDateStart; // @ts-ignore
            delete rule.timeDateEnd; // @ts-ignore
            delete rule.timeOpText; // @ts-ignore
            delete rule.timeMinType; // @ts-ignore
            delete rule.timeMinValue; // @ts-ignore
            delete rule.offsetMinType; // @ts-ignore
            delete rule.offsetMinValue; // @ts-ignore
            delete rule.multiplierMin; // @ts-ignore
            delete rule.timeMinOp; // @ts-ignore
            delete rule.timeMaxType; // @ts-ignore
            delete rule.timeMaxValue; // @ts-ignore
            delete rule.offsetMaxType; // @ts-ignore
            delete rule.offsetMaxValue; // @ts-ignore
            delete rule.multiplierMax; // @ts-ignore
            delete rule.timeMaxOp;
        }
        // @ts-ignore
        if (rule.levelType) {
            if (!rule.level) {
                rule.level = {
                    // @ts-ignore
                    type            : (rule.levelType || 'levelFixed'),
                    // @ts-ignore
                    value           : (rule.levelValue || 'closed (min)'),
                    // @ts-ignore
                    operator        : (parseInt(rule.levelOp) || cRuleAbsolute),
                    // @ts-ignore
                    operatorText    : rule.levelOpText || RED._('node-red-contrib-sun-position/position-config:ruleCtrl.label.ruleLevelAbs')
                };
            }
            if (!rule.slat) {
                rule.slat = {
                    type            : 'str',
                    value           : ''
                };
            }
            if ((rule.level.operator === 3) || (rule.level.operator === 4)) { // 3 -> ⭳✋ reset minimum; 4 -> ⭱️✋ reset maximum
                rule.level.type = 'levelND';
                rule.level.value = '';
                rule.level.operator = rule.level.operator - 2;
            }
            // @ts-ignore
            delete rule.levelType; // @ts-ignore
            delete rule.levelValue; // @ts-ignore
            delete rule.levelOp; // @ts-ignore
            delete rule.levelOpText;
        }
        // @ts-ignore
        if (rule.payloadType) {
            // @ts-ignore
            if (!rule.payload && rule.payloadType !== 'none') {
                rule.payload = {
                    // @ts-ignore
                    type            : rule.payloadType,
                    // @ts-ignore
                    value           : (rule.payloadValue || ''),
                    // @ts-ignore
                    offsetType      : (rule.payloadOffsetType || 'none'),
                    // @ts-ignore
                    offset          : (rule.payloadOffsetValue || '1'),
                    // @ts-ignore
                    multiplier      : (parseInt(rule.payloadOffsetMultiplier) || 60000),
                    // @ts-ignore
                    format          : (parseInt(rule.payloadFormat) || 99)
                };
            }
            // @ts-ignore
            delete rule.payloadType; // @ts-ignore
            delete rule.payloadValue; // @ts-ignore
            delete rule.payloadOffsetType; // @ts-ignore
            delete rule.payloadOffsetValue; // @ts-ignore
            delete rule.payloadOffsetMultiplier; // @ts-ignore
            delete rule.payloadFormat;
        }
        if (rule.payload && !('next' in rule)) {
            rule.payload.next = true;
        }
        /// check generic rule settings
        rule.name = rule.name || 'rule ' + rule.pos;
        // @ts-ignore
        rule.enabled = !(rule.enabled === false || rule.enabled === 'false');
        rule.resetOverwrite = hlp.isTrue(rule.resetOverwrite === true) ? true : false;
        if (rule.payload || (rule.level && (rule.level.operator === cRuleAbsolute))) {
            rule.importance = Number(rule.importance) || 0;
            node.rules.maxImportance = Math.max(node.rules.maxImportance, rule.importance);
            node.rules.canResetOverwrite = node.rules.canResetOverwrite || rule.resetOverwrite;
        }
        /// readout timesettings
        if (rule.time) {
            rule.time.next = false;
            if (rule.timeMax) { rule.timeMax.next = false; }
            if (rule.timeMin) { rule.timeMin.next = false; }
            node.rules.firstTimeLimited = Math.min(i, node.rules.firstTimeLimited);
            if (rule.time.operator === cRuleUntil) {
                node.rules.lastUntil = i;
            }
            if (rule.time.operator === cRuleFrom) {
                node.rules.firstFrom = Math.min(i,node.rules.firstFrom);
            }
            if (!rule.time.days || rule.time.days === '*') {
                delete rule.time.days;
            } else {
                // @ts-ignore
                rule.time.days = rule.time.days.split(',');
                // @ts-ignore
                rule.time.days = rule.time.days.map( e => parseInt(e) );
            }
            if (!rule.time.months || rule.time.months === '*') {
                delete rule.time.months;
            } else {
                // @ts-ignore
                rule.time.months = rule.time.months.split(',');
                // @ts-ignore
                rule.time.months = rule.time.months.map( e => parseInt(e) );
            }
            if (rule.time.onlyOddDays && rule.time.onlyEvenDays) {
                delete rule.time.onlyOddDays;
                delete rule.time.onlyEvenDays;
            }
            if (rule.time.onlyOddWeeks && rule.time.onlyEvenWeeks) {
                delete rule.time.onlyOddWeeks;
                delete rule.time.onlyEvenWeeks;
            }
            if (rule.time.dateStart || rule.time.dateEnd) {
                if (rule.time.dateStart) {
                    rule.time.dateStart = new Date(rule.time.dateStart);
                    rule.time.dateStart.setHours(0, 0, 0, 1);
                } else {
                    rule.time.dateStart = new Date(2000,0,1,0, 0, 0, 1);
                }
                if (rule.time.dateEnd) {
                    rule.time.dateEnd = new Date(rule.time.dateEnd);
                    rule.time.dateEnd.setHours(23, 59, 59, 999);
                } else {
                    rule.time.dateEnd = new Date(2000,11,31, 23, 59, 59, 999);
                }
            }
        }
        rule.conditions.forEach(cond => {
            cond.operatorDescription = RED._('node-red-contrib-sun-position/position-config:common.comparatorDescription.' + rule[cond.operator]);
            if (cond.valueType === 'sunControlMode') {
                // @ts-ignore
                if (cond.value === 'off' || cond.value.charAt(0) === '0') {
                    cond.value = 0;
                // @ts-ignore
                } else if (cond.value === 'maximize' || cond.value.charAt(0) === '1') {
                    cond.value = 1;
                } else {
                    cond.value = 2;
                }
            } else if (node.positionConfig && cond.valueType === 'jsonata') {
                try {
                    cond.valueExpr = node.positionConfig.getJSONataExpression(node, cond.value);
                } catch (err) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                    cond.valueExpr = null;
                }
            }

            cond.valueName = getName(cond.valueType, cond.value);
            if (cond.valueName.length > 25) {
                cond.valueNameShort = getNameShort(cond.valueType, cond.value);
            }
            cond.thresholdName = getName(cond.thresholdType, cond.threshold);
            if (cond.thresholdName.length > 25) {
                cond.thresholdNameShort = getNameShort(cond.thresholdType, cond.threshold);
            }
            cond.text = cond.valueName + ' ' + cond.operatorText;
            cond.textShort = (cond.valueNameShort || cond.valueName) + ' ' + cond.operatorText;
            cond.result = false;
        });
        rule.conditional = rule.conditions.length > 0;
    }

    if (node.autoTrigger || (parseFloat(config.startDelayTime) > 9)) {
        let delay = parseFloat(config.startDelayTime) || (300 + Math.floor(Math.random() * 700)); // default = 300ms - 1s
        delay = Math.min(delay, 2147483646);
        node.startDelayTimeOut = new Date(Date.now() + delay);
        node.startDelayTimeOutObj = setTimeout(() => {
            delete node.startDelayTimeOut;
            delete node.startDelayTimeOutObj;
            node.emit('input', {
                topic: 'autoTrigger/triggerOnly/start',
                payload: 'triggerOnly',
                triggerOnly: true
            });
        }, delay);
    }
}