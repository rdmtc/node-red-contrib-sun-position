/********************************************
 * clock-timer:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

const cRuleNoTime = -1;
const cRuleUntil = 0;
const cRuleFrom = 1;
// const cRuleAbsolute = 0;
const cRuleNone = 0;
const cRuleLogOperatorAnd = 2;
const cRuleLogOperatorOr = 1;

/******************************************************************************************/
module.exports = function (RED) {
    'use strict';
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
                    node.log(RED._('clock-timer.errors.usingTempValue', { type, value, usedValue: tempData[name] }));
                }
                return tempData[name];
            }
            if (node.nowarn[name]) {
                return undefined; // only one error per run
            }
            node.warn(RED._('clock-timer.errors.warning', { message: RED._('clock-timer.errors.notEvaluableProperty', { type, value, usedValue: 'undefined' }) }));
            node.nowarn[name] = true;
            return undefined;
        }
        tempData[name] = data;
        return data;
    }

    /******************************************************************************************/
    /**
     * reset any existing override
     * @param {*} node node data
     */
    function timePosOverwriteReset(node) {
        node.debug(`timePosOverwriteReset expire=${node.timeClockData.overwrite.expireTs}`);
        node.timeClockData.overwrite.active = false;
        node.timeClockData.overwrite.priority = 0;
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }
        if (node.timeClockData.overwrite.expireTs || node.timeClockData.overwrite.expires) {
            delete node.timeClockData.overwrite.expires;
            delete node.timeClockData.overwrite.expireTs;
            delete node.timeClockData.overwrite.expireDate;
            delete node.timeClockData.overwrite.expireDateISO;
            delete node.timeClockData.overwrite.expireDateUTC;
            delete node.timeClockData.overwrite.expireTimeLocal;
            delete node.timeClockData.overwrite.expireDateLocal;
        }
    }

    /**
     * setup the expiring of n override or update an existing expiring
     * @param {*} node node data
     * @param {Date} dNow the current timestamp
     * @param {number} expire the expiring time, (if it is NaN, default time will be tried to use) if it is not used, nor a Number or less than 1 no expiring activated
     */
    function setExpiringOverwrite(node, dNow, expire) {
        node.debug(`setExpiringOverwrite now=${dNow}, expire=${expire}`);
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }

        if (isNaN(expire)) {
            expire = node.timeClockData.overwrite.expireDuration;
            node.debug(`using default expire value ${expire}`);
        }
        node.timeClockData.overwrite.expires = Number.isFinite(expire) && (expire > 0);

        if (!node.timeClockData.overwrite.expires) {
            node.debug(`expireNever expire=${expire} ${  typeof expire  } - isNaN=${  isNaN(expire)  } - finite=${  !isFinite(expire)  } - min=${  expire < 100}`);
            delete node.timeClockData.overwrite.expireTs;
            delete node.timeClockData.overwrite.expireDate;
            return;
        }
        node.timeClockData.overwrite.expireTs = (dNow.getTime() + expire);
        node.timeClockData.overwrite.expireDate = new Date(node.timeClockData.overwrite.expireTs);
        node.timeClockData.overwrite.expireDateISO = node.timeClockData.overwrite.expireDate.toISOString();
        node.timeClockData.overwrite.expireDateUTC = node.timeClockData.overwrite.expireDate.toUTCString();
        node.timeClockData.overwrite.expireDateLocal = node.positionConfig.toDateString(node.timeClockData.overwrite.expireDate);
        node.timeClockData.overwrite.expireTimeLocal = node.positionConfig.toTimeString(node.timeClockData.overwrite.expireDate);

        node.debug(`expires in ${expire}ms = ${node.timeClockData.overwrite.expireDate}`);
        node.timeOutObj = setTimeout(() => {
            node.debug('timeout - overwrite expired');
            timePosOverwriteReset(node);
            node.emit('input', { payload: -1, topic: 'internal-triggerOnly-overwriteExpired', force: false });
        }, expire);
    }

    /**
     * check if an override can be reset
     * @param {*} node node data
     * @param {*} msg message object
     * @param {*} dNow current timestamp
     */
    function checkOverrideReset(node, msg, dNow, prioOk) {
        if (node.timeClockData.overwrite &&
            node.timeClockData.overwrite.expires &&
            (node.timeClockData.overwrite.expireTs < dNow.getTime())) {
            timePosOverwriteReset(node);
        }
        if (prioOk) {
            hlp.getMsgBoolValue(msg, ['reset','resetOverwrite'], 'resetOverwrite',
                val => {
                    node.debug(`reset val="${util.inspect(val, { colors: true, compact: 10, breakLength: Infinity })  }"`);
                    if (val) {
                        timePosOverwriteReset(node);
                    }
                });
        }
    }
    /**
     * setting the reason for override
     * @param {*} node node data
     */
    function setOverwriteReason(node) {
        if (node.timeClockData.overwrite.expireTs) {
            node.reason.code = 3;
            const obj = {
                prio: node.timeClockData.overwrite.priority,
                timeLocal: node.timeClockData.overwrite.expireTimeLocal,
                dateLocal: node.timeClockData.overwrite.expireDateLocal,
                dateISO: node.timeClockData.overwrite.expireDateISO,
                dateUTC: node.timeClockData.overwrite.expireDateUTC
            };
            node.reason.state = RED._('clock-timer.states.overwriteExpire', obj);
            node.reason.description = RED._('clock-timer.reasons.overwriteExpire', obj);
        } else {
            node.reason.code = 2;
            node.reason.state = RED._('clock-timer.states.overwriteNoExpire', { prio: node.timeClockData.overwrite.priority });
            node.reason.description = RED._('clock-timer.states.overwriteNoExpire', { prio: node.timeClockData.overwrite.priority });
        }
        // node.debug(`overwrite exit true node.timeClockData.overwrite.active=${node.timeClockData.overwrite.active}`);
    }

    /**
     * check if a manual overwrite of the rule should be set
     * @param {*} node node data
     * @param {*} msg message object
     * @returns true if override is active, otherwise false
     */
    function checkTCPosOverwrite(node, msg, now) {
        // node.debug(`checkTCPosOverwrite act=${node.timeClockData.overwrite.active} `);
        let priook = false;
        const prioMustEqual = hlp.getMsgBoolValue2(msg, ['exactPriority', 'exactPrivilege']);
        const prio = hlp.getMsgNumberValue2(msg, ['prio', 'priority', 'privilege'], null, p => {
            if (prioMustEqual) {
                priook = (node.timeClockData.overwrite.priority === p);
            } else {
                priook = (node.timeClockData.overwrite.priority <= p);
            }
            checkOverrideReset(node, msg, now, priook);
            return p;
        }, () => {
            checkOverrideReset(node, msg, now, true);
            return 0;
        });

        if (node.timeClockData.overwrite.active && (node.timeClockData.overwrite.priority > 0) && !priook) {
        // if (node.timeClockData.overwrite.active && (node.timeClockData.overwrite.priority > 0) && (node.timeClockData.overwrite.priority > prio)) {
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.timeClockData.overwrite.active=${node.timeClockData.overwrite.active}, prio=${prio}, node.timeClockData.overwrite.priority=${node.timeClockData.overwrite.priority}`);
            // if active, the prio must be 0 or given with same or higher as current overwrite otherwise this will not work
            return true;
        }
        const onlyTrigger = hlp.getMsgBoolValue(msg, ['trigger', 'noOverwrite'], ['triggerOnly', 'noOverwrite']);

        let overrideData = undefined;
        let overrideTopic = undefined;
        if (!onlyTrigger && typeof msg.payload !== 'undefined') {
            if (msg.topic && (msg.topic.includes('manual') ||
                msg.topic.includes('overwrite'))) {
                overrideData = msg.payload;
                overrideTopic = msg.topic;
            } else if (typeof msg.payload === 'object' && (msg.payload.value && (msg.payload.expires || msg.payload.prio || msg.payload.priority))) {
                overrideData = msg.payload.value;
                overrideTopic = msg.topic;
            }
        }

        const expire = hlp.getMsgNumberValue(msg, 'expire');
        if (!overrideData && node.timeClockData.overwrite.active) {
            node.debug(`overwrite active, check of prio=${prio} or expire=${expire}`);
            if (Number.isFinite(expire)) {
                // set to new expiring time
                setExpiringOverwrite(node, now, expire);
            }
            if (prio > 0) {
                // set to new priority
                node.timeClockData.overwrite.priority = prio;
            }
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.timeClockData.overwrite.active=${node.timeClockData.overwrite.active}, expire=${expire}`);
            return true;
        } else if (overrideData) {
            node.debug(`needOverwrite prio=${prio} expire=${expire}`);
            if (overrideData) {
                node.debug(`overwrite overrideData=${overrideData}`);
                node.payload.current = overrideData;
                node.payload.topic = overrideTopic;
            }

            if (Number.isFinite(expire) || (prio <= 0)) {
                // will set expiring if prio is 0 or if expire is explizit defined
                setExpiringOverwrite(node, now, expire);
            } else if ((!prioMustEqual && (node.timeClockData.overwrite.priority < prio)) || (!node.timeClockData.overwrite.expireTs)) {
                // priook
                // no expiring on prio change or no existing expiring
                setExpiringOverwrite(node, now, -1);
            }
            if (prio > 0) {
                node.timeClockData.overwrite.priority = prio;
            }
            node.timeClockData.overwrite.active = true;
        }
        if (node.timeClockData.overwrite.active) {
            setOverwriteReason(node);
            // node.debug(`overwrite exit true node.timeClockData.overwrite.active=${node.timeClockData.overwrite.active}`);
            return true;
        }
        // node.debug(`overwrite exit false node.timeClockData.overwrite.active=${node.timeClockData.overwrite.active}`);
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
                delete rule.conditon;
                delete rule.conditonData[0].operandValue;
                delete rule.conditonData[0].thresholdValue;
                rule.conditonData[0].result = node.positionConfig.comparePropValue(node, msg,
                    rule.validOperandAType,
                    rule.validOperandAValue,
                    rule.validOperator,
                    rule.validOperandBType,
                    rule.validOperandBValue,
                    (result, _obj) => { // opCallback
                        if (_obj.addID === 1) {
                            rule.conditonData[0].operandValue = _obj.value;
                        } else if (_obj.addID === 2) {
                            rule.conditonData[0].thresholdValue = _obj.value;
                        }
                        return evalTempData(node, _obj.type, _obj.value, result, tempData);
                    }
                );
                rule.conditon = {
                    result : rule.conditonData[0].result,
                    text : rule.conditonData[0].text,
                    textShort : rule.conditonData[0].textShort,
                    data : rule.conditonData
                };
                if (typeof rule.conditonData[0].thresholdValue !== 'undefined') {
                    rule.conditon.text += ' ' + rule.conditonData[0].thresholdValue;
                    rule.conditon.textShort += ' ' + hlp.clipStrLength(rule.conditonData[0].thresholdValue, 10);
                }

                if (rule.conditonData[1]) {
                    delete rule.conditonData[1].operandValue;
                    delete rule.conditonData[1].thresholdValue;
                    rule.conditonData[1].result = node.positionConfig.comparePropValue(node, msg,
                        rule.valid2OperandAType,
                        rule.valid2OperandAValue,
                        rule.valid2Operator,
                        rule.valid2OperandBType,
                        rule.valid2OperandBValue,
                        (result, _obj) => { // opCallback
                            if (_obj.addID === 1) {
                                rule.conditonData[0].operandValue = _obj.value;
                            } else if (_obj.addID === 2) {
                                rule.conditonData[0].thresholdValue = _obj.value;
                            }
                            return evalTempData(node, _obj.type, _obj.value, result, tempData);
                        }
                    );

                    if ((rule.valid2LogOperator === cRuleLogOperatorAnd && rule.conditonData.result) ||
                        (rule.valid2LogOperator === cRuleLogOperatorOr && !rule.conditonData.result)) {
                        rule.conditon.result = rule.conditonData[1].result;
                        rule.conditon.text = rule.conditonData[1].text;
                        rule.conditon.textShort = rule.conditonData[1].textShort;
                        if (typeof rule.conditonData[1].thresholdValue !== 'undefined') {
                            rule.conditon.text += ' ' + rule.conditonData[1].thresholdValue;
                            rule.conditon.textShort += ' ' + hlp.clipStrLength(rule.conditonData[1].thresholdValue, 10);
                        }
                    }
                }
                // console.log(util.inspect(rule, Object.getOwnPropertyNames(rule)));
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
    function getRuleTimeData(node, msg, rule, now) {
        rule.timeData = node.positionConfig.getTimeProp(node, msg, {
            type: rule.timeType,
            value : rule.timeValue,
            offsetType : rule.offsetType,
            offset : rule.offsetValue,
            multiplier : rule.multiplier,
            next : false,
            now
        });
        if (rule.timeData.error) {
            hlp.handleError(node, RED._('clock-timer.errors.error-time', { message: rule.timeData.error }), undefined, rule.timeData.error);
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
                now
            });
            const numMin = rule.timeDataMin.value.getTime();
            rule.timeDataMin.source = 'Min';
            if (rule.timeDataMin.error) {
                hlp.handleError(node, RED._('clock-timer.errors.error-time', { message: rule.timeDataMin.error }), undefined, rule.timeDataAlt.error);
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
                now
            });
            const numMax = rule.timeDataMax.value.getTime();
            rule.timeDataMax.source = 'Max';
            if (rule.timeDataMax.error) {
                hlp.handleError(node, RED._('clock-timer.errors.error-time', { message: rule.timeDataMax.error }), undefined, rule.timeDataAlt.error);
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

    /**
     * check all rules and determinate the active rule
     * @param {Object} node node data
     * @param {Object} msg the message object
     * @param {Date} dNow the *current* date Object
     * @param {Object} tempData the object storing the temporary caching data
     * @returns
     */
    function checkRules(node, msg, dNow, tempData) {
        // node.debug('checkRules --------------------');
        const livingRuleData = {};
        const nowNr = dNow.getTime();
        const dayNr = dNow.getDay();
        const dateNr = dNow.getDate();
        const monthNr = dNow.getMonth();
        const dayId =  hlp.getDayId(dNow);
        prepareRules(node, msg, tempData);
        // node.debug(`checkRules now=${dNow.toISOString()}, nowNr=${nowNr}, rules.count=${node.rules.count}, rules.lastUntil=${node.rules.lastUntil}`); // {colors:true, compact:10}

        /**
        * Timestamp compare function
        * @name ICompareTimeStamp
        * @function
        * @param {number} timeStamp The timestamp which should be compared
        * @returns {Boolean} return true if if the timestamp is valid, otherwise false
        */

        /**
         * function to check a rule
         * @param {object} rule a rule object to test
         * @param {ICompareTimeStamp} cmp a function to compare two timestamps.
         * @returns {Object|null} returns the rule if rule is valid, otherwhise null
         */
        const fktCheck = (rule, cmp) => {
            // node.debug('rule ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.conditional) {
                try {
                    if (!rule.conditon.result) {
                        return null;
                    }
                } catch (err) {
                    node.warn(RED._('clock-timer.errors.getPropertyData', err));
                    node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                    return null;
                }
            }
            if (!rule.timeLimited) {
                return rule;
            }
            if (rule.timeDays && rule.timeDays !== '*' && !rule.timeDays.includes(dayNr)) {
                return null;
            }
            if (rule.timeMonths && rule.timeMonths !== '*' && !rule.timeMonths.includes(monthNr)) {
                return null;
            }
            if (rule.timeOnlyOddDays && (dateNr % 2 === 0)) { // even
                return null;
            }
            if (rule.timeOnlyEvenDays && (dateNr % 2 !== 0)) { // odd
                return null;
            }
            if (rule.timeDateStart || rule.timeDateEnd) {
                rule.timeDateStart.setFullYear(dNow.getFullYear());
                rule.timeDateEnd.setFullYear(dNow.getFullYear());
                if (rule.timeDateEnd > rule.timeDateStart) {
                    // in the current year
                    if (dNow < rule.timeDateStart || dNow > rule.timeDateEnd) {
                        return null;
                    }
                } else {
                    // switch between year from end to start
                    if (dNow < rule.timeDateStart && dNow > rule.timeDateEnd) {
                        return null;
                    }
                }
            }
            const num = getRuleTimeData(node, msg, rule, dNow);
            // node.debug(`pos=${rule.pos} type=${rule.timeOpText} - ${rule.timeValue} - num=${num}- rule.timeData = ${ util.inspect(rule.timeData, { colors: true, compact: 40, breakLength: Infinity }) }`);
            if (dayId === rule.timeData.dayId && num >=0  && (cmp(num) === true)) {
                return rule;
            }
            return null;
        };

        let ruleSel = null;
        let ruleindex = -1;
        // node.debug('first loop ' + node.rules.count);
        for (let i = 0; i < node.rules.count; ++i) { //  node.rules.lastUntil
            const rule = node.rules.data[i];
            // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== cRuleFrom) + ' - ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
            if (rule.timeOp === cRuleFrom) { continue; }
            // const res = fktCheck(rule, r => (r >= nowNr));
            let res = null;
            if (rule.timeOp === cRuleFrom) {
                res = fktCheck(rule, r => (r <= nowNr));
            } else {
                res = fktCheck(rule, r => (r >= nowNr));
            }
            if (res) {
                // node.debug('1. ruleSel ' + util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }));
                ruleSel = res;
                ruleindex = i;
                if (rule.timeOp !== cRuleFrom) {
                    break;
                }
            }
        }

        if (!ruleSel || (ruleSel.timeOp === cRuleFrom) ) {
            // node.debug('--------- starting second loop ' + node.rules.count);
            for (let i = (node.rules.count - 1); i >= 0; --i) {
                const rule = node.rules.data[i];
                // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== cRuleUntil) + ' - ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
                if (rule.timeOp === cRuleUntil) { continue; } // - From: timeOp === cRuleFrom
                const res = fktCheck(rule, r => (r <= nowNr));
                if (res) {
                    // node.debug('2. ruleSel ' + util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }));
                    ruleSel = res;
                    break;
                }
            }
        }

        if (ruleSel) {
            if (node.autoTrigger) {
                if (ruleSel.timeLimited && ruleSel.timeData.ts > nowNr) {
                    const diff = ruleSel.timeData.ts - nowNr;
                    node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                    node.autoTrigger.type = 1;
                } else {
                    for (let i = (ruleindex+1); i < node.rules.count; ++i) {
                        const rule = node.rules.data[i];
                        if (!rule.timeLimited) {
                            continue;
                        }
                        const num = getRuleTimeData(node, msg, rule, dNow);
                        if (num > nowNr) {
                            const diff = num - nowNr;
                            node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                            node.autoTrigger.type = 2;
                        }
                    }
                }
            }
            // ruleSel.text = '';
            // node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10, breakLength: Infinity }));
            livingRuleData.id = ruleSel.pos;
            livingRuleData.name = ruleSel.name;
            node.reason.code = 4;

            livingRuleData.active = true;
            livingRuleData.outputValue = ruleSel.outputValue;
            livingRuleData.outputType = ruleSel.outputType;

            livingRuleData.conditional = ruleSel.conditional;
            livingRuleData.timeLimited = ruleSel.timeLimited;
            node.payload.current = node.positionConfig.getOutDataProp(node, msg, {
                type: ruleSel.payloadType,
                value: ruleSel.payloadValue,
                format: ruleSel.payloadFormat,
                offsetType: ruleSel.payloadOffsetType,
                offset: ruleSel.payloadOffsetValue,
                multiplier: ruleSel.payloadOffsetMultiplier,
                next: true
            });
            node.payload.topic = ruleSel.topic;

            const data = { number: ruleSel.pos, name: ruleSel.name };
            let name = 'rule';
            if (ruleSel.conditional) {
                livingRuleData.conditon = ruleSel.conditon;
                data.text = ruleSel.conditon.text;
                data.textShort = ruleSel.conditon.textShort;
                name = 'ruleCond';
            }
            if (ruleSel.timeLimited) {
                livingRuleData.time = ruleSel.timeData;
                livingRuleData.time.timeLocal = node.positionConfig.toTimeString(ruleSel.timeData.value);
                livingRuleData.time.timeLocalDate = node.positionConfig.toDateString(ruleSel.timeData.value);
                livingRuleData.time.dateISO= ruleSel.timeData.value.toISOString();
                livingRuleData.time.dateUTC= ruleSel.timeData.value.toUTCString();
                data.timeOp = ruleSel.timeOpText;
                data.timeLocal = livingRuleData.time.timeLocal;
                data.time = livingRuleData.time.dateISO;
                name = (ruleSel.conditional) ? 'ruleTimeCond' : 'ruleTime';
            }
            node.reason.state= RED._('clock-timer.states.'+name, data);
            node.reason.description = RED._('clock-timer.reasons.'+name, data);
            // node.debug(`checkRules data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })}`);
            // node.debug(`checkRules end pos=${node.payload.current} reason=${node.reason.code} description=${node.reason.description} all=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);
            return livingRuleData;
        }
        livingRuleData.active = false;
        livingRuleData.id = -1;
        node.payload.current = node.positionConfig.getOutDataProp(node, msg, {
            type: node.timeClockData.payloadDefaultType,
            value: node.timeClockData.payloadDefault,
            format: node.timeClockData.payloadDefaultTimeFormat,
            offsetType: node.timeClockData.payloadDefaultOffsetType,
            offset: node.timeClockData.payloadDefaultOffset,
            multiplier: node.timeClockData.payloadDefaultOffsetMultiplier,
            next: true
        });
        node.payload.topic = node.timeClockData.topic;
        node.reason.code = 1;
        node.reason.state = RED._('clock-timer.states.default');
        node.reason.description = RED._('clock-timer.reasons.default');
        // node.debug(`checkRules end pos=${node.payload.current} reason=${node.reason.code} description=${node.reason.description} all=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);
        return livingRuleData;
    }
    /******************************************************************************************/
    /******************************************************************************************/
    /**
     * standard Node-Red Node handler for the clockTimerNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function clockTimerNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.outputs = Number(config.outputs || 1);
        this.startDelayTime = parseFloat(config.startDelayTime);
        if (isNaN(this.startDelayTime) || this.startDelayTime < 10) {
            delete this.startDelayTime;
        } else {
            this.startDelayTime = Math.min(this.startDelayTime, 2147483646);
        }

        if (config.autoTrigger) {
            this.autoTrigger = {
                deaultTime : config.autoTriggerTime || 20 * 60000
            };
            this.autoTriggerObj = null;
        }
        const node = this;

        node.nowarn = {};
        node.reason = {
            code : 0,
            state: '',
            description: ''
        };
        // temporary node Data
        node.storeName = config.storeName || '';
        node.timeClockData = {
            /** The Level of the window */
            payloadDefault: config.payloadDefault,
            payloadDefaultType: config.payloadDefaultType,
            payloadDefaultTimeFormat: config.payloadDefaultTimeFormat,
            payloadDefaultOffset: config.payloadDefaultOffset,
            payloadDefaultOffsetType: config.payloadDefaultOffsetType,
            payloadDefaultOffsetMultiplier: config.payloadDefaultOffsetMultiplier,
            topic:config.topic,
            /** The override settings */
            overwrite: {
                active: false,
                expireDuration: parseFloat(hlp.chkValueFilled(config.overwriteExpire, NaN)),
                priority: 0
            }
        };

        node.rules = {
            data: config.rules || []
        };
        node.payload = {
            current:undefined,
            topic:node.timeClockData.topic
        };

        /**
         * set the state of the node
         */
        function setState(pLoad) {
            const code = node.reason.code;
            let shape = 'ring';
            let fill = 'yellow';

            if (isNaN(code)) {
                fill = 'red'; // block
                shape = 'dot';
            } else if (code <= 3) {
                fill = 'blue'; // override
            } else if (code === 4 || code === 15 || code === 16) {
                fill = 'grey'; // rule
            } else if (code === 1 || code === 8) {
                fill = 'green'; // not in window or oversteerExceeded
            }

            node.reason.stateComplete = node.reason.state ;
            if (pLoad === null || typeof pLoad !== 'object') {
                node.reason.stateComplete = hlp.clipStrLength(''+pLoad,20) + ' - ' + node.reason.stateComplete;
            } else if (typeof pLoad === 'object') {
                node.reason.stateComplete = hlp.clipStrLength(JSON.stringify(pLoad),20) + ' - ' + node.reason.stateComplete;
            }
            node.status({
                fill,
                shape,
                text: node.reason.stateComplete
            });
        }

        /**
         * handles the input of a message object to the node
         */
        this.on('input', function (msg, send, done) {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) {if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                node.debug(`--------- clock-timer - input msg.topic=${msg.topic} msg.payload=${msg.payload} msg.ts=${msg.ts}`);
                if (!this.positionConfig) {
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'Node not properly configured!!'
                    });
                    done(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'), msg);
                    return null;
                }
                node.nowarn = {};
                const tempData = node.context().get('cacheData',node.storeName) || {};
                const previousData = node.context().get('previous',node.storeName) || {};
                previousData.payloadType = (typeof node.payload.current);
                previousData.reasonCode = node.reason.code;
                previousData.reasonState = node.reason.state;
                previousData.reasonDescription = node.reason.description;
                if (previousData.payloadType === 'string' ||
                    previousData.payloadType === 'boolean' ||
                    previousData.payloadType === 'number') {
                    previousData.payloadValue = node.payload.current;
                    previousData.payloadSimple = true;
                }
                node.reason.code = NaN;
                const dNow = hlp.getNowTimeStamp(node, msg);
                if (node.autoTrigger) {
                    node.autoTrigger.time = node.autoTrigger.deaultTime;
                    node.autoTrigger.type = 0;
                }

                // check if the message contains any oversteering data
                let ruleId = -2;
                const timeCtrl = {
                    autoTrigger : node.autoTrigger
                };

                // check for manual overwrite
                if (!checkTCPosOverwrite(node, msg, dNow)) {
                    // calc times:
                    timeCtrl.rule = checkRules(node, msg, dNow, tempData);
                    ruleId = timeCtrl.rule.id;
                }

                // node.debug(`result manual=${node.timeClockData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                timeCtrl.reason = node.reason;
                timeCtrl.timeClock = node.timeClockData;

                if (node.startDelayTime) {
                    node.reason.code = NaN;
                    node.reason.state = RED._('clock-timer.states.startDelay');
                    node.reason.description = RED._('clock-timer.reasons.startDelay', {dateISO:node.startDelayTimeOut.toISOString()});
                }
                setState(node.payload.current);

                let topic = node.payload.topic;
                if (topic) {
                    const topicAttrs = {
                        name: node.name,
                        code: node.reason.code,
                        state: node.reason.state,
                        rule: ruleId,
                        newtopic: node.payload.topic,
                        orgtopic: msg.topic
                    };
                    topic = hlp.topicReplace(topic, topicAttrs);
                }

                if ((typeof node.payload.current !== 'undefined') &&
                    (node.payload.current !== 'none') &&
                    (node.payload.current !== null) &&
                    !isNaN(node.reason.code) &&
                    ((node.reason.code !== previousData.reasonCode) ||
                    (ruleId !== previousData.usedRule) ||
                    (typeof node.payload.current !== previousData.payloadType) ||
                    ((typeof previousData.payloadValue  !== 'undefined') && (previousData.payloadValue !== node.payload.current))) ) {
                    msg.payload = node.payload.current;
                    msg.topic =  topic;
                    msg.timeCtrl = timeCtrl;
                    if (node.outputs > 1) {
                        send([msg, { topic, payload: timeCtrl, payloadOut: node.payload.current }]); // node.send([msg, { topic, payload: timeCtrl }]);
                    } else {
                        msg.timeCtrl = timeCtrl;
                        send(msg, null); // node.send(msg, null);
                    }
                } else if (node.outputs > 1) {
                    send([null, { topic, payload: timeCtrl }]); // node.send([null, { topic, payload: timeCtrl }]);
                }
                previousData.usedRule = ruleId;
                node.context().set('cacheData', tempData, node.storeName);
                node.context().set('previous', previousData, node.storeName);
                node.context().set('current', timeCtrl, node.storeName);
                if (node.autoTrigger) {
                    node.debug('------------- autotrigger ---------------- ' + node.autoTrigger.time + ' - ' + node.autoTrigger.type);
                    if (node.autoTriggerObj) {
                        clearTimeout(node.autoTriggerObj);
                        node.autoTriggerObj = null;
                    }
                    node.autoTriggerObj = setTimeout(() => {
                        clearTimeout(node.autoTriggerObj);
                        node.emit('input', {
                            topic: 'autoTrigger/triggerOnly',
                            payload: 'triggerOnly',
                            triggerOnly: true
                        });
                    }, node.autoTrigger.time);
                }
                done();
                return null;
            } catch (err) {
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'internal error: ' + err.message
                });
                done(RED._('node-red-contrib-sun-position/position-config:errors.error', err), msg);
            }
            return null;
        });

        this.on('close', () => {
            if (node.autoTriggerObj) {
                clearTimeout(node.autoTriggerObj);
                node.autoTriggerObj = null;
            }
            // tidy up any state
        });
        // ####################################################################################################
        /**
         * initializes the node
         */
        function initialize() {
            node.debug('initialize');
            if (!node.context().get('cacheData', node.storeName)) {
                node.context().set('cacheData', { }, node.storeName);
            }

            if (!node.context().get('previous', node.storeName)) {
                node.context().set('previous', {
                    reasonCode: -1,
                    usedRule: NaN
                }, node.storeName);
            }

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
            node.rules.count = node.rules.data.length;
            node.rules.lastUntil = node.rules.count -1;
            node.rules.checkUntil = false;
            node.rules.checkFrom = false;
            node.rules.firstFrom = node.rules.lastUntil;

            for (let i = 0; i < node.rules.count; ++i) {
                const rule = node.rules.data[i];
                rule.pos = i + 1;
                rule.name = rule.name || 'rule ' + rule.pos;
                rule.timeOp = Number(rule.timeOp) || cRuleUntil;

                rule.conditional = (rule.validOperandAType !== 'none');
                rule.timeLimited = (rule.timeType !== 'none');
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

                if (!rule.timeDays || rule.timeDays === '*') {
                    rule.timeDays = null;
                } else {
                    rule.timeDays = rule.timeDays.split(',');
                }

                if (!rule.timeMonths || rule.timeMonths === '*') {
                    rule.timeMonths = null;
                } else {
                    rule.timeMonths = rule.timeMonths.split(',');
                }

                if (!rule.timeLimited) {
                    rule.timeOp = cRuleNoTime;
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
                        rule.timeDateStart.setHours(23, 59, 59, 999);
                    } else {
                        rule.timeDateStart = new Date(2000,11,31, 23, 59, 59, 999);
                    }
                }

                if (rule.conditional) {
                    rule.conditonData = [{
                        result: false,
                        operandName: getName(rule.validOperandAType,rule.validOperandAValue),
                        thresholdName: getName(rule.validOperandBType, rule.validOperandBValue),
                        operatorDescription: RED._('node-red-contrib-sun-position/position-config:common.comparatorDescription.' + rule.validOperator)
                    }];
                    if (rule.conditonData[0].operandName.length > 25) {
                        rule.conditonData[0].operandNameShort = getNameShort(rule.validOperandAType, rule.validOperandAValue);
                    }
                    if (rule.conditonData[0].thresholdName.length > 25) {
                        rule.conditonData[0].thresholdNameShort = getNameShort(rule.validOperandBType, rule.validOperandBValue);
                    }
                    rule.conditonData[0].text = rule.conditonData[0].operandName + ' ' + rule.validOperatorText;
                    rule.conditonData[0].textShort = (rule.conditonData[0].operandNameShort || rule.conditonData[0].operandName) + ' ' + rule.validOperatorText;

                    rule.valid2LogOperator = Number(rule.valid2LogOperator) || cRuleNone;
                    if (rule.valid2LogOperator > cRuleNone) {
                        rule.conditonData.push(
                            {
                                condition: rule.valid2LogOperatorText,
                                result: false,
                                operandName: getName(rule.valid2OperandAType,rule.valid2OperandAValue),
                                thresholdName: getName(rule.valid2OperandBType, rule.valid2OperandBValue),
                                operatorDescription: RED._('node-red-contrib-sun-position/position-config:common.comparatorDescription.' + rule.valid2Operator)
                            });
                        if (rule.conditonData[1].operandName.length > 25) {
                            rule.conditonData[1].operandNameShort = getNameShort(rule.valid2OperandAType, rule.valid2OperandAValue);
                        }
                        if (rule.conditonData[1].thresholdName.length > 25) {
                            rule.conditonData[1].thresholdNameShort = getNameShort(rule.valid2OperandBType, rule.valid2OperandBValue);
                        }
                        rule.conditonData[1].text = rule.conditonData[1].operandName + ' ' + rule.valid2OperatorText;
                        rule.conditonData[1].textShort = (rule.conditonData[1].operandNameShort || rule.conditonData[1].operandName) + ' ' + rule.valid2OperatorText;
                    }
                }
                if (rule.timeOp === cRuleUntil) {
                    node.rules.lastUntil = i;
                    node.rules.checkUntil = true;
                }
                if (rule.timeOp === cRuleFrom && !node.rules.checkFrom) {
                    node.rules.firstFrom = i;
                    node.rules.checkFrom = true;
                }
            }

            if (node.autoTrigger || (node.startDelayTime)) {
                const delay = node.startDelayTime || (30000 + Math.floor(Math.random() * 30000)); // 30s - 1min
                node.startDelayTimeOut = new Date(Date.now() + delay);
                setTimeout(() => {
                    delete node.startDelayTime;
                    delete node.startDelayTimeOut;
                    node.emit('input', {
                        topic: 'autoTrigger/triggerOnly/start',
                        payload: 'triggerOnly',
                        triggerOnly: true
                    });
                }, delay);
            }
        }

        try {
            initialize();
        } catch (err) {
            node.error(err.message);
            node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
            node.status({
                fill: 'red',
                shape: 'ring',
                text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
            });
        }
    }

    RED.nodes.registerType('clock-timer', clockTimerNode);
};