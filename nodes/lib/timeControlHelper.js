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
 * @typedef {import("../10-position-config.js").IPositionConfigNode} IPositionConfigNode
 */

/**
 * @typedef {Object} ITimeControlNodeInstance Extensions for the nodeInstance object type
 * @property {IPositionConfigNode} positionConfig    -   tbd
 * @property {string} addId internal used additional id
 * @property {Object} nodeData get/set generic Data of the node
 * @property {Object} reason    -   tbd
 * @property {string} contextStore    -   used context store
 * @property {Object} rules    -   tbd
 *
 * @property {boolean} [levelReverse]    -   indicator if the Level is in reverse order
 * @property {Object} [sunData]    -   the sun data Object
 * @property {Object} nowarn    -   tbd
 *
 * @property {Object} autoTrigger autotrigger options
 * @property {NodeJS.Timeout} autoTriggerObj autotrigger options
 *
 * @property {Object} startDelayTimeOut    -   tbd
 * @property {NodeJS.Timeout} startDelayTimeOutObj    -   tbd
 * @property {NodeJS.Timeout} timeOutObj    -   Overwrite Reset TimeOut Object
 *
 * @property {function} setState function for settign the state of the node
 * ... obviously there are more ...
 */

/**
 * @typedef {ITimeControlNodeInstance & runtimeNode} ITimeControlNode Combine nodeInstance with additional, optional functions
 */

const util = require('util');
const hlp = require( './dateTimeHelper.js' );

const cRuleTime = { // deprecated
    until : 0,
    from : 1
};


const cRuleType = {
    absolute : 0,
    levelMinOversteer : 1,  // ⭳❗ minimum (oversteer)
    levelMaxOversteer : 2, // ⭱️❗ maximum (oversteer)
    slatOversteer : 5,
    topicOversteer : 8,
    off : 9
};

const cRuleDefault = -1;
const cRuleLogOperatorAnd = 2;
const cRuleLogOperatorOr = 1;
const cNBC_RULE_TYPE_UNTIL = 0;
const cNBC_RULE_TYPE_FROM = 1;
const cNBC_RULE_EXEC = {
    auto: 0,
    first:1,
    last:2
};

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
    checkRules,
    initializeCtrl,
    cRuleType,
    cRuleDefault,
    cRuleLogOperatorAnd,
    cRuleLogOperatorOr,
    cRuleTime // deprecated
};

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
* @param {*} msg message object
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
 * @param {*} msg the message object
 * @param {*} tempData the temporary storage object
 */
function prepareRules(node, msg, tempData, dNow) {
    for (let i = 0; i < node.rules.count; ++i) {
        const rule = node.rules.data[i];
        if (rule.time) {
            delete rule.timeData;
        }
        if (rule.conditional) {
            rule.conditon = {
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
 * @param {Object} node node data
 * @param {Object} msg the message object
 * @param {Object} rule the rule data
 * @param {string} timep rule type
 * @param {Date} dNow base timestamp
 * @return {number} timestamp of the rule
 */
function getRuleTimeData(node, msg, rule, timep, dNow) {
    if (!rule.time[timep] || rule.timeData[timep]) {
        return;
    }
    rule.time[timep].now = dNow;

    rule.timeData[timep] = node.positionConfig.getTimeProp(node, msg, rule.time[timep]);

    if (rule.timeData[timep].error) {
        hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeData[timep].error }), undefined, rule.timeData[timep].error);
        node.debug('rule data complete');
        node.debug(util.inspect(rule, { colors: true, compact: 10, depth: 10, breakLength: Infinity }));
        return;
    } else if (!rule.timeData[timep].value) {
        throw new Error('Error can not calc time!');
    }
    rule.timeData[timep].source = 'Default';
    rule.timeData[timep].ts = rule.timeData[timep].value.getTime();
    // node.debug(`time=${rule.timeData[timep].value} -> ${new Date(rule.timeData[timep].value)}`);
    if (rule.time[timep].min) {
        rule.time[timep].min.now = dNow;
        if (!rule.timeDataMin) rule.timeDataMin = { start:{}, end:{} };
        rule.timeDataMin[timep] = node.positionConfig.getTimeProp(node, msg, rule.time[timep].min);
        rule.timeDataMin[timep].ts = rule.timeDataMin[timep].value.getTime();
        rule.timeDataMin[timep].source = 'Min';
        if (rule.timeDataMin[timep].error) {
            hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeDataMin[timep].error }), undefined, rule.timeDataAlt.error);
        } else if (!rule.timeDataMin[timep].value) {
            throw new Error('Error can not calc Alt time!');
        } else {
            if (rule.timeDataMin[timep].ts > rule.timeData[timep].ts) {
                [rule.timeData[timep], rule.timeDataMin[timep]] = [rule.timeDataMin[timep], rule.timeData[timep]];
            }
        }
    }
    if (rule.time[timep].max) {
        rule.time[timep].max.now = dNow;
        if (!rule.timeDataMax) rule.timeDataMax = { start:{}, end:{} };
        rule.timeDataMax[timep] = node.positionConfig.getTimeProp(node, msg, rule.time[timep].max);
        rule.timeDataMax[timep].ts = rule.timeDataMax[timep].value.getTime();
        rule.timeDataMax[timep].source = 'Max';
        if (rule.timeDataMax[timep].error) {
            hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeDataMax[timep].error }), undefined, rule.timeDataAlt.error);
        } else if (!rule.timeDataMax[timep].value) {
            throw new Error('Error can not calc Alt time!');
        } else {
            if (rule.timeDataMax[timep].ts < rule.timeData[timep].ts) {
                [rule.timeData[timep], rule.timeDataMax[timep]] = [rule.timeDataMax[timep], rule.timeData[timep]];
            }
        }
    }
    rule.timeData[timep].dayId = hlp.getDayId(rule.timeData[timep].value);
    return;
}

/*************************************************************************************************************************/
/**
 * function to check a rule
 * @param {Object} node the node object
 * @param {Object} msg the message object
 * @param {Object} rule a rule object to test
 * @param {ICompareTimeStamp} cmp a function to compare two timestamps.
 * @param {ITimeObject} data Now time object
 * @returns {Object|null} returns the rule if rule is valid, otherwhise null
 */
function compareRules(node, msg, rule, cmp, data) {
    // node.debug(`compareRules rule ${rule.name} (${rule.pos}) data=${util.inspect(rule, {colors:true, compact:10})}`);
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

    if (rule.time.days && !rule.time.days.includes(data.dayNr)) {
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid days`);
        return null;
    }
    if (rule.time.months && !rule.time.months.includes(data.monthNr)) {
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid month`);
        return null;
    }
    if (rule.time.onlyOddDays && (data.dateNr % 2 === 0)) { // even
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid even days`);
        return null;
    }
    if (rule.time.onlyEvenDays && (data.dateNr % 2 !== 0)) { // odd
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid odd days`);
        return null;
    }
    if (rule.time.onlyOddWeeks && (data.weekNr % 2 === 0)) { // even
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid even week`);
        return null;
    }
    if (rule.time.onlyEvenWeeks && (data.weekNr % 2 !== 0)) { // odd
        node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid odd week`);
        return null;
    }
    if (rule.time.dateStart || rule.time.dateEnd) {
        rule.time.dateStart.setFullYear(data.yearNr);
        rule.time.dateEnd.setFullYear(data.yearNr);
        if (rule.time.dateEnd > rule.time.dateStart) {
            // in the current year
            if (data.now < rule.time.dateStart || data.now > rule.time.dateEnd) {
                node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid date range within year`);
                return null;
            }
        } else {
            // switch between year from end to start
            if (data.now < rule.time.dateStart && data.now > rule.time.dateEnd) {
                node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid date range over year`);
                return null;
            }
        }
    }

    rule.timeData = {
        start:{
            ts: Number.MIN_VALUE
        },
        end:{
            ts: Number.MAX_VALUE
        },
        now: data.now
    };

    if (rule.time.start) {
        getRuleTimeData(node, msg, rule, 'start', data.now);
        if (rule.time.end) {
            getRuleTimeData(node, msg, rule, 'end', data.now);
            if (rule.timeData.start.ts > rule.timeData.end.ts) {
                if (data.dayId === rule.timeData.start.dayId &&
                    rule.timeData.start.ts <= data.nowNr) {
                    return rule;
                }
                if (data.dayId === rule.timeData.end.dayId &&
                    rule.timeData.end.ts > data.nowNr) {
                    return rule;
                }
                return null;
            }
            if (data.dayId !== rule.timeData.end.dayId) {
                return null;
            }
        }
        if (data.dayId !== rule.timeData.start.dayId) {
            return null;
        }
    } else if (rule.time.end) {
        getRuleTimeData(node, msg, rule, 'end', data.now);
        if (data.dayId !== rule.timeData.end.dayId) {
            return null;
        }
    }
    if (rule.timeData.start.ts <= data.nowNr &&
        rule.timeData.end.ts > data.nowNr) {
        return rule;
    }
    // node.debug(`compareRules rule ${rule.name} (${rule.pos}) dayId=${data.dayId} rule-DayID=${rule.timeData[timep].dayId} num=${num} cmp=${cmp(num)} invalid time`);
    return null;
}
/******************************************************************************************/
/**
 * check all rules and determinate the active rule
 * @param {Object} node node data
 * @param {Object} msg the message object
 * @param {ITimeObject} oNow the *current* date Object
 * @param {Object} tempData the object storing the temporary caching data
 * @returns the active rule or null
 */
function checkRules(node, msg, oNow, tempData) {
    // node.debug('checkRules --------------------');
    prepareRules(node, msg, tempData, oNow.now);
    // node.debug(`checkRules rules.count=${node.rules.count}, rules.last1stRun=${node.rules.last1stRun}, oNow=${util.inspect(oNow, {colors:true, compact:10})}`);
    const result = {
        ruleindex : -1,
        ruleSel : null
    };

    for (let i = 0; i <= node.rules.last1stRun; ++i) {
        const rule = node.rules.data[i];
        // node.debug('rule ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
        if (!rule.enabled || rule.execUse === cNBC_RULE_EXEC.last) { continue; }
        const res = compareRules(node, msg, rule, r => (r >= oNow.nowNr), oNow); // now is less time
        if (res) {
            // node.debug('new 1. ruleSel ' + util.inspect(res, { colors: true, compact: 5, breakLength: Infinity, depth: 10 }));
            if (res.level.operator === cRuleType.slatOversteer) {
                result.ruleSlatOvs = res;
            } else if (res.level.operator === cRuleType.topicOversteer) {
                result.ruleTopicOvs = res;
            } else if (res.level.operator === cRuleType.levelMinOversteer) {
                result.ruleSelMin = res;
            } else if (res.level.operator === cRuleType.levelMaxOversteer) {
                result.ruleSelMax = res;
            } else {
                result.ruleSel = res;
                result.ruleindex = i;
                break;
            }
        }
    }

    if (!result.ruleSel) {
        // node.debug('--------- starting second loop ' + node.rules.count);
        for (let i = (node.rules.count - 1); i >= 0; --i) {
            const rule = node.rules.data[i];
            // node.debug('rule ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
            if (!rule.enabled || rule.execUse === cNBC_RULE_EXEC.first) { continue; }
            const res = compareRules(node, msg, rule, r => (r <= oNow.nowNr), oNow); // now is greater time
            if (res) {
                // node.debug('new 2. ruleSel ' + util.inspect(res, { colors: true, compact: 5, breakLength: Infinity, depth: 10 }));
                if (res.level.operator === cRuleType.slatOversteer) {
                    result.ruleSlatOvs = res;
                } else if (res.level.operator === cRuleType.topicOversteer) {
                    result.ruleTopicOvs = res;
                } else if (res.level.operator === cRuleType.levelMinOversteer) {
                    result.ruleSelMin = res;
                } else if (res.level.operator === cRuleType.levelMaxOversteer) {
                    result.ruleSelMax = res;
                } else {
                    result.ruleSel = res;
                    break;
                }
            }
        }
    }

    return result;
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
    node.rules.last1stRun = node.rules.count -1;
    node.rules.lastUntil = node.rules.count -1;
    node.rules.firstFrom = node.rules.lastUntil;
    node.rules.firstTimeLimited = node.rules.count;
    node.rules.maxImportance = 0;
    node.rules.canResetOverwrite = false;
    node.debug('all node.rules before convert');
    node.debug(util.inspect(node.rules, { colors: true, compact: 10, depth: 10, breakLength: Infinity }));
    for (let i = 0; i < node.rules.count; ++i) {
        const rule = node.rules.data[i];
        rule.pos = i + 1;
        rule.exec = rule.exec || cNBC_RULE_EXEC.auto;
        // Backward compatibility
        if (!rule.conditions) {
            rule.conditions = [];
            if (rule.validOperandAType && rule.validOperandAType !==  'none') {
                rule.conditions.push({
                    condition       : cRuleLogOperatorOr,
                    conditionText    : '',
                    value           : rule.validOperandAValue,
                    valueType       : rule.validOperandAType,
                    operator        : rule.validOperator,
                    operatorText     : rule.validOperatorText,
                    threshold       : rule.validOperandBValue,
                    thresholdType   : (rule.validOperandBType || 'num')
                });
                const conditionValue = parseInt(rule.valid2LogOperator);
                if (conditionValue > 0 && rule.valid2OperandAType) {
                    rule.conditions.push({
                        condition       : conditionValue,
                        conditionText    : rule.valid2LogOperatorText,
                        value           : rule.valid2OperandAValue,
                        valueType       : (rule.valid2OperandAType || 'msg'),
                        operator        : rule.valid2Operator,
                        operatorText     : rule.valid2OperatorText,
                        threshold       : rule.valid2OperandBValue,
                        thresholdType   : (rule.valid2OperandBType || 'num')
                    });
                }
            }

            delete rule.validOperandAValue;
            delete rule.validOperandAType;
            delete rule.validOperator;
            delete rule.validOperatorText;
            delete rule.validOperandBValue;
            delete rule.validOperandBType;
            delete rule.valid2LogOperator;
            delete rule.valid2LogOperatorText;
            delete rule.valid2OperandAValue;
            delete rule.valid2OperandAType;
            delete rule.valid2Operator;
            delete rule.valid2OperatorText;
            delete rule.valid2OperandBValue;
            delete rule.valid2OperandBType;
        }
        if(rule.timeType) {
            if (!rule.time && rule.timeType !== 'none') {
                const operator = (parseInt(rule.timeOp) || cNBC_RULE_TYPE_UNTIL);
                rule.time = { };
                let ttype = 'end'; // cNBC_RULE_TYPE_UNTIL
                if (operator === cNBC_RULE_TYPE_FROM) {
                    rule.time.start = {};
                    ttype = 'start';
                }
                rule.time[ttype] = {
                    type            : rule.timeType,
                    value           : (rule.timeValue || ''),
                    offsetType      : (rule.offsetType || 'none'),
                    offset          : (rule.offsetValue || 1),
                    multiplier      : (parseInt(rule.multiplier) || 60000)
                };
                if (rule.timeMinType && rule.timeMinType !== 'none') {
                    rule.time[ttype].min = {
                        type            : rule.timeMinType,
                        value           : (rule.timeMinValue || ''),
                        offsetType      : (rule.offsetMinType || 'none'),
                        offset          : (rule.offsetMinValue || 1),
                        multiplier      : (parseInt(rule.multiplierMin) || 60000)
                    };
                }
                if (rule.timeMaxType && rule.timeMaxType !== 'none') {
                    rule.time[ttype].max = {
                        type            : rule.timeMaxType,
                        value           : (rule.timeMaxValue || ''),
                        offsetType      : (rule.offsetMaxType || 'none'),
                        offset          : (rule.offsetMaxValue || 1),
                        multiplier      : (parseInt(rule.multiplierMax) || 60000)
                    };
                }
            }
            if (rule.timeDays && rule.timeDays !== '*') rule.time.days = rule.timeDays;
            if (rule.timeMonths && rule.timeMonths !== '*') rule.time.months = rule.timeMonths;
            if (rule.timeOnlyOddDays) rule.time.onlyOddDays = rule.timeOnlyOddDays;
            if (rule.timeOnlyEvenDays) rule.time.onlyEvenDays = rule.timeOnlyEvenDays;
            if (rule.timeDateStart) rule.time.dateStart = rule.timeDateStart;
            if (rule.timeDateEnd) rule.time.dateEnd = rule.timeDateEnd;
            delete rule.timeType;
            delete rule.timeValue;
            delete rule.timeOp;
            delete rule.offsetType;
            delete rule.offsetValue;
            delete rule.multiplier;
            delete rule.timeDays;
            delete rule.timeMonths;
            delete rule.timeOnlyOddDays;
            delete rule.timeOnlyEvenDays;
            delete rule.timeDateStart;
            delete rule.timeDateEnd;
            delete rule.timeOpText;
            delete rule.timeMinType;
            delete rule.timeMinValue;
            delete rule.offsetMinType;
            delete rule.offsetMinValue;
            delete rule.multiplierMin;
            delete rule.timeMinOp;
            delete rule.timeMaxType;
            delete rule.timeMaxValue;
            delete rule.offsetMaxType;
            delete rule.offsetMaxValue;
            delete rule.multiplierMax;
            delete rule.timeMaxOp;
        }
        if (rule.time && (typeof rule.time.operator !== 'undefined')) {
            let ttype = 'end'; // cNBC_RULE_TYPE_UNTIL
            if (rule.time.operator === cNBC_RULE_TYPE_FROM) {
                ttype = 'start';
            }
            rule.time[ttype] = Object.assign({
                type            : rule.time.type,
                value           : rule.time.value,
                offsetType      : rule.time.offsetType,
                offset          : rule.time.offset,
                multiplier      : rule.time.multiplier
            }, rule.time[ttype]);
            if (rule.timeMin && rule.timeMin.type !== 'none' ) {
                rule.time[ttype].min = Object.assign({
                    type            : rule.timeMin.type,
                    value           : (rule.timeMin.value || ''),
                    offsetType      : (rule.timeMin.offsetType || 'none'),
                    offset          : (rule.timeMin.offset || 1),
                    multiplier      : (parseInt(rule.timeMin.multiplier) || 60000)
                }, rule.time[ttype].min);
            }
            if (rule.timeMax && rule.timeMax.type !== 'none' ) {
                rule.time[ttype].max = Object.assign({
                    type            : rule.timeMax.type,
                    value           : (rule.timeMax.value || ''),
                    offsetType      : (rule.timeMax.offsetType || 'none'),
                    offset          : (rule.timeMax.offset || 1),
                    multiplier      : (parseInt(rule.timeMax.multiplier) || 60000)
                }, rule.time[ttype].max);
            }
            delete rule.time.operator;
            delete rule.time.operatorText;
            delete rule.time.type;
            delete rule.time.value;
            delete rule.time.offsetType;
            delete rule.time.offset;
            delete rule.time.multiplier;
            delete rule.timeMin;
            delete rule.timeMax;
        }
        if (rule.levelType) {
            if (!rule.level) {
                rule.level = {
                    type            : (rule.levelType || 'levelFixed'),
                    value           : (rule.levelValue || 'closed (min)'),
                    operator        : (parseInt(rule.levelOp) || cRuleType.absolute),
                    operatorText    : rule.levelOpText || RED._('node-red-contrib-sun-position/position-config:ruleCtrl.label.ruleLevelAbs')
                };
            }
            if ((rule.level.operator === 3) || (rule.level.operator === 4)) { // 3 -> ⭳✋ reset minimum; 4 -> ⭱️✋ reset maximum
                rule.level.type = 'levelND';
                rule.level.value = '';
                rule.level.operator = cRuleType.absolute; // rule.level.operator - 2;
            }
            delete rule.levelType;
            delete rule.levelValue;
            delete rule.levelOp;
            delete rule.levelOpText;
        }
        if (rule.payloadType) {
            if (!rule.payload && rule.payloadType !== 'none') {
                rule.payload = {
                    type            : rule.payloadType,
                    value           : (rule.payloadValue || ''),
                    offsetType      : (rule.payloadOffsetType || 'none'),
                    offset          : (rule.payloadOffsetValue || '1'),
                    multiplier      : (parseInt(rule.payloadOffsetMultiplier) || 60000),
                    format          : (parseInt(rule.payloadFormat) || 99)
                };
            }
            delete rule.payloadType;
            delete rule.payloadValue;
            delete rule.payloadOffsetType;
            delete rule.payloadOffsetValue;
            delete rule.payloadOffsetMultiplier;
            delete rule.payloadFormat;
        }
        if (rule.payload && !('next' in rule)) {
            rule.payload.next = true;
        }

        rule.execUse = rule.exec;
        if (rule.exec === cNBC_RULE_EXEC.first || (rule.time && !rule.time.start && rule.time.end)) {
            rule.execUse = cNBC_RULE_EXEC.first;
            node.rules.last1stRun = i;
        } else if (rule.exec === cNBC_RULE_EXEC.last || (rule.time && rule.time.start && !rule.time.end)) {
            rule.execUse = cNBC_RULE_EXEC.last;
        }

        /// check generic rule settings
        rule.name = rule.name || 'rule ' + rule.pos;
        rule.enabled = !(rule.enabled === false || rule.enabled === 'false');
        rule.resetOverwrite = hlp.isTrue(rule.resetOverwrite === true) ? true : false;

        if (rule.level) {
            if (!rule.slat) {
                rule.slat = {
                    type            : 'none',
                    value           : ''
                };
            }
            if (rule.level.type === 'levelND') {
                rule.level.operator = cRuleType.absolute;
            }
        }
        if (rule.payload || (rule.level && (rule.level.operator === cRuleType.absolute))) {
            rule.importance = Number(rule.importance) || 0;
            node.rules.maxImportance = Math.max(node.rules.maxImportance, rule.importance);
            node.rules.canResetOverwrite = node.rules.canResetOverwrite || rule.resetOverwrite;
        }
        /// readout timesettings
        if (rule.time) {
            const checkTimeR = id => {
                if (rule.time[id].max) { rule.time[id].max.next = false; }
                if (rule.time[id].min) { rule.time[id].min.next = false; }
                rule.time[id].next = false;
            };
            node.rules.firstTimeLimited = Math.min(i, node.rules.firstTimeLimited);
            if (rule.time.start) { // cNBC_RULE_TYPE_FROM
                node.rules.firstFrom = Math.min(i, node.rules.firstFrom);
                checkTimeR('start');
            }
            if (rule.time.end) { // cNBC_RULE_TYPE_UNTIL
                node.rules.lastUntil = i;
                checkTimeR('end');
            }
            if (!rule.time.days || rule.time.days === '*') {
                delete rule.time.days;
            } else {
                rule.time.days = rule.time.days.split(',');
                rule.time.days = rule.time.days.map( e => parseInt(e) );
            }
            if (!rule.time.months || rule.time.months === '*') {
                delete rule.time.months;
            } else {
                rule.time.months = rule.time.months.split(',');
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
                if (cond.value === 'off' || cond.value.charAt(0) === '0') {
                    cond.value = 0;
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
    node.debug('all node.rules after convert');
    node.debug(util.inspect(node.rules, { colors: true, compact: 10, depth: 10, breakLength: Infinity }));

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