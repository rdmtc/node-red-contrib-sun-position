/********************************************
 * dateTimeHelper.js:
 *********************************************/
'use strict';
const path = require('path');

const util = require('util');
const hlp = require( path.resolve( __dirname, './dateTimeHelper.js') );

module.exports = {
    evalTempData,
    posOverwriteReset,
    setExpiringOverwrite,
    checkOverrideReset,
    setOverwriteReason,
    prepareRules,
    getRuleTimeData,
    validPosition,
    initializeCtrl
};

const cRuleNoTime = -1;
const cRuleUntil = 0;
const cRuleFrom = 1;
const cRuleAbsolute = 0;
const cRuleNone = 0;
const cRuleMinOversteer = 1; // ⭳❗ minimum (oversteer)
const cRuleMaxOversteer = 2; // ⭱️❗ maximum (oversteer)
const cRuleLogOperatorAnd = 2;
const cRuleLogOperatorOr = 1;
let RED = null;

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
}

/**
* setup the expiring of n override or update an existing expiring
* @param {*} node node data
* @param {Date} dNow the current timestamp
* @param {number} dExpire the expiring time, (if it is NaN, default time will be tried to use) if it is not used, nor a Number or less than 1 no expiring activated
*/
function setExpiringOverwrite(node, dNow, dExpire, reason) {
    node.debug(`setExpiringOverwrite dNow=${dNow}, dExpire=${dExpire}, reason=${reason}`);
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
        return;
    }
    node.nodeData.overwrite.expireTs = (dNow.getTime() + dExpire);
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
}

/**
* check if an override can be reset
* @param {*} node node data
* @param {*} msg message object
* @param {*} dNow current timestamp
*/
function checkOverrideReset(node, msg, dNow, isSignificant) {
    if (node.nodeData.overwrite &&
       node.nodeData.overwrite.expires &&
       (node.nodeData.overwrite.expireTs < dNow.getTime())) {
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
function prepareRules(node, msg, tempData) {
    for (let i = 0; i < node.rules.count; ++i) {
        const rule = node.rules.data[i];
        if (rule.conditional) {
            rule.conditon = {
                result : false
            };
            for (let i = 0; i < rule.conditonData.length; i++) {
                const el = rule.conditonData[i];
                if (rule.conditon.result === true && el.condition.value === cRuleLogOperatorOr) {
                    break; // not nessesary, becaue already tue
                } else if (rule.conditon.result === false && el.condition.value === cRuleLogOperatorAnd) {
                    break; // should never bekome true
                }
                delete el.operandValue;
                delete el.thresholdValue;
                if (el.operand.type === 'sunControlMode') {
                    el.result = (node.sunData && (node.sunData.mode === el.operand.value));
                } else {
                    el.result = node.positionConfig.comparePropValue(node, msg,
                        {
                            value: el.operand.value,
                            type: el.operand.type,
                            callback: (result, _obj) => { // opCallback
                                el.operandValue = _obj.value;
                                return evalTempData(node, _obj.type, _obj.value, result, tempData);
                            }
                        },
                        el.operator.value,
                        {
                            value: el.threshold.value,
                            type: el.threshold.type,
                            callback: (result, _obj) => { // opCallback
                                el.thresholdValue = _obj.value;
                                return evalTempData(node, _obj.type, _obj.value, result, tempData);
                            }
                        }
                    );
                }
                rule.conditon = {
                    index : i,
                    result : el.result,
                    text : el.text,
                    textShort : el.textShort
                };
                if (typeof el.thresholdValue !== 'undefined') {
                    rule.conditon.text += ' ' + el.thresholdValue;
                    rule.conditon.textShort += ' ' + hlp.clipStrLength(el.thresholdValue, 10);
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
 * @return {number} timestamp of the rule
 */
function getRuleTimeData(node, msg, rule, dNow) {
    rule.timeData = node.positionConfig.getTimeProp(node, msg, {
        type: rule.timeType,
        value : rule.timeValue,
        offsetType : rule.offsetType,
        offset : rule.offsetValue,
        multiplier : rule.multiplier,
        next : false,
        dNow
    });
    if (rule.timeData.error) {
        hlp.handleError(node, RED._('node-red-contrib-sun-position/position-config:errors.error-time', { message: rule.timeData.error }), undefined, rule.timeData.error);
        return -1;
    } else if (!rule.timeData.value) {
        throw new Error('Error can not calc time!');
    }
    rule.timeData.source = 'Default';
    rule.timeData.ts = rule.timeData.value.getTime();
    rule.timeData.dayId = hlp.getDayId(rule.timeData.value);
    if (rule.timeMinType !== 'none') {
        rule.timeDataMin = node.positionConfig.getTimeProp(node, msg, {
            type: rule.timeMinType,
            value: rule.timeMinValue,
            offsetType: rule.offsetMinType,
            offset: rule.offsetMinValue,
            multiplier: rule.multiplierMin,
            next: false,
            dNow
        });
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
    if (rule.timeMaxType !== 'none') {
        rule.timeDataMax = node.positionConfig.getTimeProp(node, msg, {
            type: rule.timeMaxType,
            value: rule.timeMaxValue,
            offsetType: rule.offsetMaxType,
            offset: rule.offsetMaxValue,
            multiplier: rule.multiplierMax,
            next: false,
            dNow
        });
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
    node.debug('initialize ' + node.name + ' [' + node.id + ']');
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
        rule.name = rule.name || 'rule ' + rule.pos;
        rule.resetOverwrite = (rule.resetOverwrite === true || rule.resetOverwrite === 'true') ? true : false;
        rule.importance = Number(rule.importance) || 0;
        node.rules.maxImportance = Math.max(node.rules.maxImportance, rule.importance);
        node.rules.canResetOverwrite = node.rules.canResetOverwrite || rule.resetOverwrite;
        rule.timeOp = Number(rule.timeOp) || cRuleUntil;
        rule.levelOp = Number(rule.levelOp) || cRuleAbsolute;
        if (rule.levelOp === 3) { // cRuleMinReset = 3; // ⭳✋ reset minimum
            rule.levelOp = cRuleMinOversteer;
            rule.levelType = 'levelND';
            rule.levelValue = '';
        } else if (rule.levelOp === 4) { // cRuleMaxReset = 4; // ⭱️✋ reset maximum
            rule.levelOp = cRuleMaxOversteer;
            rule.levelType = 'levelND';
            rule.levelValue = '';
        }

        rule.timeLimited = (rule.timeType && (rule.timeType !== 'none'));

        if (!rule.timeLimited) {
            rule.timeOp = cRuleNoTime;
            delete rule.offsetType;
            delete rule.multiplier;

            delete rule.timeMinType;
            delete rule.timeMinValue;
            delete rule.offsetMinType;
            delete rule.multiplierMin;

            delete rule.timeMaxType;
            delete rule.timeMaxValue;
            delete rule.offsetMaxType;
            delete rule.multiplierMax;

            delete rule.timeDays;
            delete rule.timeMonths;
            delete rule.timeOnlyOddDays;
            delete rule.timeOnlyEvenDays;
            delete rule.timeDateStart;
            delete rule.timeDateEnd;
        } else {
            rule.offsetType = rule.offsetType || 'none';
            rule.multiplier = rule.multiplier || 60000;

            rule.timeMinType = rule.timeMinType || 'none';
            rule.timeMinValue = (rule.timeMinValue || '');
            rule.offsetMinType = rule.offsetMinType || 'none';
            rule.multiplierMin = rule.multiplierMin || 60000;

            rule.timeMaxType = rule.timeMaxType || 'none';
            rule.timeMaxValue = (rule.timeMaxValue || '');
            rule.offsetMaxType = rule.offsetMaxType || 'none';
            rule.multiplierMax = rule.multiplierMax || 60000;

            node.rules.firstTimeLimited = Math.min(i,node.rules.firstTimeLimited);
            if (rule.timeOp === cRuleUntil) {
                node.rules.lastUntil = i;
            }
            if (rule.timeOp === cRuleFrom) {
                node.rules.firstFrom = Math.min(i,node.rules.firstFrom);
            }

            if (!rule.timeDays || rule.timeDays === '*') {
                rule.timeDays = null;
            } else {
                rule.timeDays = rule.timeDays.split(',');
                rule.timeDays = rule.timeDays.map( e => parseInt(e) );
            }

            if (!rule.timeMonths || rule.timeMonths === '*') {
                rule.timeMonths = null;
            } else {
                rule.timeMonths = rule.timeMonths.split(',');
                rule.timeMonths = rule.timeMonths.map( e => parseInt(e) );
            }

            if (rule.timeOnlyOddDays && rule.timeOnlyEvenDays) {
                rule.timeOnlyOddDays = false;
                rule.timeOnlyEvenDays = false;
            }

            rule.timeDateStart = rule.timeDateStart || '';
            rule.timeDateEnd = rule.timeDateEnd || '';
            if (rule.timeDateStart || rule.timeDateEnd) {
                if (rule.timeDateStart) {
                    rule.timeDateStart = new Date(rule.timeDateStart);
                    rule.timeDateStart.setHours(0, 0, 0, 1);
                } else {
                    rule.timeDateStart = new Date(2000,0,1,0, 0, 0, 1);
                }

                if (rule.timeDateEnd) {
                    rule.timeDateEnd = new Date(rule.timeDateEnd);
                    rule.timeDateEnd.setHours(23, 59, 59, 999);
                } else {
                    rule.timeDateEnd = new Date(2000,11,31, 23, 59, 59, 999);
                }
            }
        }

        rule.conditonData = [];
        const setCondObj = (pretext, defLgOp) => {
            const operandAType = rule[pretext+'OperandAType'];
            const conditionValue = Number(rule[pretext+'LogOperator']) || defLgOp;
            if (operandAType !== 'none' && conditionValue !== cRuleNone) {
                const operandAValue = rule[pretext+'OperandAValue'];
                const operandBType = rule[pretext+'OperandBType'];
                const operandBValue = rule[pretext+'OperandBValue'];
                const el =  {
                    result: false,
                    operandName: getName(operandAType, operandAValue),
                    thresholdName: getName(operandBType, operandBValue),
                    operand: {
                        type:operandAType,
                        value:operandAValue
                    },
                    threshold: {
                        type:operandBType,
                        value:operandBValue
                    },
                    operator: {
                        value : rule[pretext+'Operator'],
                        text : rule[pretext+'OperatorText'],
                        description: RED._('node-red-contrib-sun-position/position-config:common.comparatorDescription.' + rule[pretext+'Operator'])
                    },
                    condition:  {
                        value : conditionValue,
                        text : rule[pretext+'LogOperatorText']
                    }
                };
                if (operandAType === 'sunControlMode') {
                    if (operandAValue === 'off' || operandAValue.charAt(0) === '0') {
                        el.operand.value = 0;
                    } else if (operandAValue === 'maximize' || operandAValue.charAt(0) === '1') {
                        el.operand.value = 1;
                    } else {
                        el.operand.value = 2;
                    }
                }
                if (el.operandName.length > 25) {
                    el.operandNameShort = getNameShort(operandAType, operandAValue);
                }
                if (el.thresholdName.length > 25) {
                    el.thresholdNameShort = getNameShort(operandBType, operandBValue);
                }
                el.text = el.operandName + ' ' + el.operator.text;
                el.textShort = (el.operandNameShort || el.operandName) + ' ' + el.operator.text;
                rule.conditonData.push(el);
            }
            delete rule[pretext+'OperandAType'];
            delete rule[pretext+'OperandAValue'];
            delete rule[pretext+'OperandBType'];
            delete rule[pretext+'OperandBValue'];
            delete rule[pretext+'Operator'];
            delete rule[pretext+'OperatorText'];
            delete rule[pretext+'LogOperator'];
            delete rule[pretext+'LogOperatorText'];
        };
        setCondObj('valid', cRuleLogOperatorOr);
        setCondObj('valid2', cRuleNone);
        rule.conditional = rule.conditonData.length > 0;
    }

    if (node.autoTrigger || (parseFloat(config.startDelayTime) > 9)) {
        let delay = parseFloat(config.startDelayTime) || (2000 + Math.floor(Math.random() * 8000)); // 2s - 10s
        delay = Math.min(delay, 2147483646);
        node.startDelayTimeOut = new Date(Date.now() + delay);
        setTimeout(() => {
            delete node.startDelayTimeOut;
            node.emit('input', {
                topic: 'autoTrigger/triggerOnly/start',
                payload: 'triggerOnly',
                triggerOnly: true
            });
        }, delay);
    }
}