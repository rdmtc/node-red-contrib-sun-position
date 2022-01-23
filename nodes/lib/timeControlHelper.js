/********************************************
 * dateTimeHelper.js:
 *********************************************/
'use strict';
const { time } = require('console');
const { endsWith } = require('lodash');
const path = require('path');

const util = require('util');
const hlp = require( path.resolve( __dirname, './dateTimeHelper.js') );

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

module.exports = {
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
 * evaluate temporary Data
 * @param {*} node   node Data
 * @param {string} type  type of type input
 * @param {string} value  value of typeinput
 * @param {*} data  data to cache
 * @returns {*}  data which was cached
 */
function evalTempData(node, type, value, data, tempData) {
    // node.debug(`evalTempData type=${type} value=${value} data=${data}`);
    const name = `${type}.${value}`;
    if (data === null || typeof data === 'undefined') {
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
* @param {*} node node data
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
* @param {*} node node data
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
* @param {*} node node data
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
* @param {*} node node data
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
                node.debug(`reset val="${util.inspect(val, { colors: true, compact: 10, breakLength: Infinity })  }"`);
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
* @param {*} node node data
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
 * @param {*} node node data
 * @param {*} msg the message object
 * @param {*} tempData the temporary storage object
 */
function prepareRules(node, msg, tempData, dNow) {
    for (let i = 0; i < node.rules.count; ++i) {
        const rule = node.rules.data[i];
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
 * @param {*} node node data
 * @param {*} msg the message object
 * @param {*} rule the rule data
 * @param {string} timep rule type
 * @param {number} dNow base timestamp
 * @return {number} timestamp of the rule
 */
function getRuleTimeData(node, msg, rule, timep, dNow) {
    rule.time[timep].now = dNow;
    rule.timeData = node.positionConfig.getTimeProp(node, msg, rule.time[timep]);

    if (rule.timeData.error) {
        hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeData.error }), undefined, rule.timeData.error);
        return -1;
    } else if (!rule.timeData.value) {
        throw new Error('Error can not calc time!');
    }
    rule.timeData.source = 'Default';
    rule.timeData.ts = rule.timeData.value.getTime();
    // node.debug(`time=${rule.timeData.value} -> ${new Date(rule.timeData.value)}`);
    rule.timeData.dayId = hlp.getDayId(rule.timeData.value);
    if (rule.timeMin) {
        rule.timeMin.now = dNow;
        rule.timeDataMin = node.positionConfig.getTimeProp(node, msg, rule.timeMin);
        const numMin = rule.timeDataMin.value.getTime();
        rule.timeDataMin.source = 'Min';
        if (rule.timeDataMin.error) {
            hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeDataMin.error }), undefined, rule.timeDataAlt.error);
        } else if (!rule.timeDataMin.value) {
            throw new Error('Error can not calc Alt time!');
        } else {
            if (numMin > rule.timeData.ts) {
                const tmp = rule.timeData;
                rule.timeData = rule.timeDataMin;
                rule.timeDataMin = tmp;
                rule.timeData.ts = numMin;
                rule.timeData.dayId = hlp.getDayId(rule.timeDataMin.value);
            }
        }
    }
    if (rule.timeMax) {
        rule.timeMax.now = dNow;
        rule.timeDataMax = node.positionConfig.getTimeProp(node, msg, rule.timeMax);
        const numMax = rule.timeDataMax.value.getTime();
        rule.timeDataMax.source = 'Max';
        if (rule.timeDataMax.error) {
            hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeDataMax.error }), undefined, rule.timeDataAlt.error);
        } else if (!rule.timeDataMax.value) {
            throw new Error('Error can not calc Alt time!');
        } else {
            if (numMax < rule.timeData.ts) {
                const tmp = rule.timeData;
                rule.timeData = rule.timeDataMax;
                rule.timeDataMax = tmp;
                rule.timeData.ts = numMax;
                rule.timeData.dayId = hlp.getDayId(rule.timeDataMax.value);
            }
        }
    }
    return rule.timeData.ts;
}

/*************************************************************************************************************************/
/**
* Timestamp compare function
* @name ICompareTimeStamp
* @function
* @param {number} timeStamp The timestamp which should be compared
* @returns {Boolean} return true if if the timestamp is valid, otherwise false
*/

/**
* support timeData
* @name ITimeObject Data
* @param {Date} now
* @param {number} nowNr
* @param {number} dayNr
* @param {number} monthNr
* @param {number} dateNr
* @param {number} yearNr
* @param {number} dayId
*/

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
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
            return null;
        }
    }
    if (!rule.time) {
        return rule;
    }
    if (rule.time.start) {
        if (rule.time.start.days && !rule.time.start.days.includes(data.dayNr)) {
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid days`);
            return null;
        }
        if (rule.time.start.months && !rule.time.start.months.includes(data.monthNr)) {
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid month`);
            return null;
        }
        if (rule.time.start.onlyOddDays && (data.dateNr % 2 === 0)) { // even
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid even days`);
            return null;
        }
        if (rule.time.start.onlyEvenDays && (data.dateNr % 2 !== 0)) { // odd
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid odd days`);
            return null;
        }
        if (rule.time.start.onlyOddWeeks && (data.weekNr % 2 === 0)) { // even
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid even week`);
            return null;
        }
        if (rule.time.start.onlyEvenWeeks && (data.weekNr % 2 !== 0)) { // odd
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid odd week`);
            return null;
        }
        if (rule.time.start.dateStart || rule.time.start.dateEnd) {
            rule.time.start.dateStart.setFullYear(data.yearNr);
            rule.time.start.dateEnd.setFullYear(data.yearNr);
            if (rule.time.start.dateEnd > rule.time.start.dateStart) {
                // in the current year
                if (data.now < rule.time.start.dateStart || data.now > rule.time.start.dateEnd) {
                    node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid date range within year`);
                    return null;
                }
            } else {
                // switch between year from end to start
                if (data.now < rule.time.start.dateStart && data.now > rule.time.start.dateEnd) {
                    node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid date range over year`);
                    return null;
                }
            }
        }
    } else if (rule.time.end) {
        if (rule.time.end.days && !rule.time.end.days.includes(data.dayNr)) {
            return null;
        }
        if (rule.time.end.months && !rule.time.end.months.includes(data.monthNr)) {
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid month`);
            return null;
        }
        if (rule.time.end.onlyOddDays && (data.dateNr % 2 === 0)) { // even
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid even days`);
            return null;
        }
        if (rule.time.end.onlyEvenDays && (data.dateNr % 2 !== 0)) { // odd
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid odd days`);
            return null;
        }
        if (rule.time.end.onlyOddWeeks && (data.weekNr % 2 === 0)) { // even
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid even week`);
            return null;
        }
        if (rule.time.end.onlyEvenWeeks && (data.weekNr % 2 !== 0)) { // odd
            node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid odd week`);
            return null;
        }
        if (rule.time.end.dateStart || rule.time.end.dateEnd) {
            rule.time.end.dateStart.setFullYear(data.yearNr);
            rule.time.end.dateEnd.setFullYear(data.yearNr);
            if (rule.time.end.dateEnd > rule.time.end.dateStart) {
                // in the current year
                if (data.now < rule.time.end.dateStart || data.now > rule.time.end.dateEnd) {
                    node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid date range within year`);
                    return null;
                }
            } else {
                // switch between year from end to start
                if (data.now < rule.time.end.dateStart && data.now > rule.time.end.dateEnd) {
                    node.debug(`compareRules rule ${rule.name} (${rule.pos}) invalid date range over year`);
                    return null;
                }
            }
        }
    } else {
        return null;
    }
    const num = getRuleTimeData(node, msg, rule, data.now);
    // node.debug(`compareRules ${rule.name} (${rule.pos}) type=${rule.time.operatorText} - ${rule.time.value} - num=${num} - rule.timeData = ${ util.inspect(rule.timeData, { colors: true, compact: 40, breakLength: Infinity }) }`);
    if (data.dayId === rule.timeData.dayId && num >=0 && (cmp(num) === true)) {
        return rule;
    }
    // node.debug(`compareRules rule ${rule.name} (${rule.pos}) dayId=${data.dayId} rule-DayID=${rule.timeData.dayId} num=${num} cmp=${cmp(num)} invalid time`);
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
    const livingRuleData = {};
    prepareRules(node, msg, tempData, oNow.dNow);
    // node.debug(`checkRules rules.count=${node.rules.count}, rules.lastUntil=${node.rules.lastUntil}, oNow=${util.inspect(oNow, {colors:true, compact:10})}`);
    const result = {
        ruleindex : -1,
        ruleSel : null
    };

    for (let i = 0; i <= node.rules.lastUntil; ++i) {
        const rule = node.rules.data[i];
        // node.debug('rule ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
        if (!rule.enabled) { continue; }
        if (rule.time && !rule.time.end) { continue; }
        // const res = fktCheck(rule, r => (r >= nowNr));
        const res = compareRules(node, msg, rule, r => (r >= oNow.nowNr), oNow); // now is less time
        if (res) {
            // node.debug('1. ruleSel ' + util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }));
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
            if (!rule.enabled) { continue; }
            if (rule.time && !rule.time.start) { continue; }
            const res = compareRules(node, msg, rule, r => (r <= oNow.nowNr), oNow); // now is greater time
            if (res) {
                // node.debug('2. ruleSel ' + util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }));
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
 * @param {*} node the node data
 * @param {number} level the level to check
 * @returns {boolean} true if the level is valid, otherwise false
 */
function validPosition(node, level, allowRound) {
    // node.debug('validPosition level='+level);
    if (level === '' || level === null || typeof level === 'undefined') {
        node.warn(`Position is empty!`);
        return false;
    }
    if (isNaN(level)) {
        node.warn(`Position: "${level}" is NaN!`);
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
    node.debug(`initialize ${ node.name || node.id}`);
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
    node.rules.firstTimeLimited = node.rules.count;
    node.rules.maxImportance = 0;
    node.rules.canResetOverwrite = false;

    for (let i = 0; i < node.rules.count; ++i) {
        const rule = node.rules.data[i];
        rule.pos = i + 1;
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
                if (rule.timeDays && rule.timeDays !== '*') rule.time[ttype].days = rule.timeDays;
                if (rule.timeMonths && rule.timeMonths !== '*') rule.time[ttype].months = rule.timeMonths;
                if (rule.timeOnlyOddDays) rule.time[ttype].onlyOddDays = rule.timeOnlyOddDays;
                if (rule.timeOnlyEvenDays) rule.time[ttype].onlyEvenDays = rule.timeOnlyEvenDays;
                if (rule.timeDateStart) rule.time[ttype].dateStart = rule.timeDateStart;
                if (rule.timeDateEnd) rule.time[ttype].dateEnd = rule.timeDateEnd;
            }
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
        if (rule.time && rule.time.operator) {
            let ttype = 'end'; // cNBC_RULE_TYPE_UNTIL
            if (rule.time.operator === cNBC_RULE_TYPE_FROM) {
                ttype = 'start';
            }
            rule.time[ttype] = {
                type            : rule.time.type,
                value           : rule.time.value,
                offsetType      : rule.time.offsetType,
                offset          : rule.time.offset,
                multiplier      : rule.time.multiplier
            };
            if (rule.timeMin && rule.timeMin.type !== 'none' ) {
                rule.time[ttype].min = {
                    type            : rule.timeMin.type,
                    value           : (rule.timeMin.value || ''),
                    offsetType      : (rule.timeMin.offsetType || 'none'),
                    offset          : (rule.timeMin.offset || 1),
                    multiplier      : (parseInt(rule.timeMin.multiplier) || 60000)
                };
            }
            if (rule.timeMax && rule.timeMax.type !== 'none' ) {
                rule.time[ttype].max = {
                    type            : rule.timeMax.type,
                    value           : (rule.timeMax.value || ''),
                    offsetType      : (rule.timeMax.offsetType || 'none'),
                    offset          : (rule.timeMax.offset || 1),
                    multiplier      : (parseInt(rule.timeMax.multiplier) || 60000)
                };
            }
            if (rule.time.days && rule.time.days !== '*') rule.time[ttype].days = rule.time.days;
            if (rule.time.months && rule.time.months !== '*') rule.time[ttype].months = rule.time.months;
            if (rule.time.onlyOddDays) rule.time[ttype].onlyOddDays = rule.time.onlyOddDays;
            if (rule.time.onlyEvenDays) rule.time[ttype].onlyEvenDays = rule.time.onlyEvenDays;
            if (rule.time.dateStart) rule.time[ttype].dateStart = rule.time.dateStart;
            if (rule.time.dateEnd) rule.time[ttype].dateEnd = rule.time.dateEnd;
            delete rule.time.type;
            delete rule.time.value;
            delete rule.time.offsetType;
            delete rule.time.offset;
            delete rule.time.multiplier;
            delete rule.time.days;
            delete rule.time.months;
            delete rule.time.onlyOddDays;
            delete rule.time.onlyEvenDays;
            delete rule.time.dateStart;
            delete rule.time.dateEnd;
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
            if (!rule.slat) {
                rule.slat = {
                    type            : 'str',
                    value           : ''
                };
            }
            if ((rule.level.operator === 3) || (rule.level.operator === 4)) { // 3 -> ⭳✋ reset minimum; 4 -> ⭱️✋ reset maximum
                rule.level.operator.type = 'levelND';
                rule.level.operator.value = '';
                rule.level.operator = rule.level.operator - 2;
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
        /// check generic rule settings
        rule.name = rule.name || 'rule ' + rule.pos;
        rule.enabled = !(rule.enabled === false || rule.enabled === 'false');
        rule.resetOverwrite = hlp.isTrue(rule.resetOverwrite === true) ? true : false;
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
                if (!rule.time[id].days || rule.time[id].days === '*') {
                    delete rule.time[id].days;
                } else {
                    rule.time[id].days = rule.time[id].days.split(',');
                    rule.time[id].days = rule.time[id].days.map( e => parseInt(e) );
                }
                if (!rule.time[id].months || rule.time[id].months === '*') {
                    delete rule.time[id].months;
                } else {
                    rule.time[id].months = rule.time[id].months.split(',');
                    rule.time[id].months = rule.time[id].months.map( e => parseInt(e) );
                }
                if (rule.time[id].onlyOddDays && rule.time[id].onlyEvenDays) {
                    delete rule.time[id].onlyOddDays;
                    delete rule.time[id].onlyEvenDays;
                }
                if (rule.time[id].onlyOddWeeks && rule.time[id].onlyEvenWeeks) {
                    delete rule.time[id].onlyOddWeeks;
                    delete rule.time[id].onlyEvenWeeks;
                }
                if (rule.time[id].dateStart || rule.time[id].dateEnd) {
                    if (rule.time[id].dateStart) {
                        rule.time[id].dateStart = new Date(rule.time[id].dateStart);
                        rule.time[id].dateStart.setHours(0, 0, 0, 1);
                    } else {
                        rule.time[id].dateStart = new Date(2000,0,1,0, 0, 0, 1);
                    }
                    if (rule.time[id].dateEnd) {
                        rule.time[id].dateEnd = new Date(rule.time[id].dateEnd);
                        rule.time[id].dateEnd.setHours(23, 59, 59, 999);
                    } else {
                        rule.time[id].dateEnd = new Date(2000,11,31, 23, 59, 59, 999);
                    }
                }
            };
            rule.time.next = false;
            node.rules.firstTimeLimited = Math.min(i, node.rules.firstTimeLimited);
            if (rule.time.start) { // cNBC_RULE_TYPE_FROM
                checkTimeR('start');
            }
            if (rule.time.end) { // cNBC_RULE_TYPE_UNTIL
                node.rules.lastUntil = i;
                checkTimeR('end');
            }
            if (rule.time.start && rule.time.end) {
                // if both are defined, only use limitations on start
                delete rule.time.end.days;
                delete rule.time.end.months;
                delete rule.time.end.onlyOddDays;
                delete rule.time.end.onlyEvenDays;
                delete rule.time.end.dateStart;
                delete rule.time.end.dateEnd;
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