/********************************************
 * time-calc:
 *********************************************/
'use strict';
const util = require('util');

const path = require('path');

const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
// const cron = require("cron");

module.exports = function (RED) {
    'use strict';

    function tsGetOperandData(
        node,
        msg,
        type,
        value,
        format,
        offset,
        multiplier
    ) {
        let result = {};
        if (type === null || type === 'none' || type === '') {
            return Date.now();
        }

        if (
            type === 'entered' ||
            type === 'pdsTime' ||
            type === 'pdmTime' ||
            type === 'date'
        ) {
            result = node.positionConfig.getTimeProp(node, msg, type, value);
            if (result === null) {
                throw new Error('could not evaluate ' + type + '.' + value);
            } else if (result.error) {
                throw new Error('error on getting operand: ' + result.error);
            }
        } else {
            // msg, flow, global, str, num, env
            const data = RED.util.evaluateNodeProperty(value, type, node, msg);
            if (!data) {
                throw new Error('could not evaluate ' + type + '.' + value);
            }

            result.value = hlp.parseDateFromFormat(
                data,
                format,
                RED._('time-calc.days'),
                RED._('time-calc.month'),
                RED._('time-calc.dayDiffNames')
            );

            if (result.value === 'Invalid Date' || isNaN(result.value)) {
                throw new Error('could not evaluate format of ' + data);
            }
        }

        if (offset !== 0 && multiplier > 0) {
            return new Date(result.value.getTime() + offset * multiplier);
        }

        if (offset !== 0 && multiplier === -1) {
            result.value.setMonth(result.value.getMonth() + offset);
        } else if (offset !== 0 && multiplier === -2) {
            result.value.setFullYear(result.value.getFullYear() + offset);
        }

        return result.value;
    }

    function tsGetPropData(node, msg, type, value, format, offset, days) {
        if (type === null || type === 'none' || type === '') {
            if (value === '' || typeof value === 'undefined') {
                return Date.now();
            }

            return value;
        }

        if (type === 'pdsCalcData') {
            return node.positionConfig.getSunCalc(msg.ts);
        }

        if (type === 'pdmCalcData') {
            return node.positionConfig.getMoonCalc(msg.ts);
        }

        if (
            type === 'entered' ||
            type === 'pdsTime' ||
            type === 'pdmTime' ||
            type === 'date'
        ) {
            const data = node.positionConfig.getTimeProp(
                node,
                msg,
                type,
                value,
                offset,
                1,
                days
            );
            if (!data.error) {
                return hlp.getFormatedDateOut(
                    data.value,
                    format,
                    false,
                    RED._('time-inject.days'),
                    RED._('time-inject.month'),
                    RED._('time-inject.dayDiffNames')
                );
            }

            return data;
        }

        return RED.util.evaluateNodeProperty(value, type, node, msg);
    }

    function timeCalcNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize timeCalcNode ' + util.inspect(config));
        const node = this;

        this.on('input', msg => {
            try {
                node.debug('input ' + util.inspect(msg));
                if (
                    node.positionConfig === null ||
                    config.operator === null ||
                    config.operand1Type === null
                ) {
                    throw new Error('Configuration is missing!!');
                }

                const operand1 = tsGetOperandData(this, msg, config.operand1Type, config.operand1, config.operand1Format, config.operand1Offset, config.operand1OffsetMultiplier);

                if (config.result1Type !== 'none' && config.result1Value) {
                    let resObj = null;
                    if (config.result1Type === 'operand1') {
                        resObj = hlp.getFormatedDateOut(operand1, config.result1Format, false, RED._('time-inject.days'), RED._('time-inject.month'), RED._('time-inject.dayDiffNames'));
                    } else {
                        resObj = tsGetPropData(node, msg, config.result1ValueType, config.result1Value, config.result1Format, config.result1Offset);
                    }

                    node.debug('resObj ' + util.inspect(resObj));
                    if (resObj === null) {
                        throw new Error('could not evaluate ' + config.result1ValueType + '.' + config.result1Value);
                    } else if (resObj.error) {
                        this.error('error on getting result: ' + resObj.error);
                    } else if (config.result1Type === 'msg' || config.result1Type === 'msgProperty') {
                        RED.util.setMessageProperty(msg, name, resObj);
                    } else if (config.result1Type === 'flow' || config.result1Type === 'global') {
                        const contextKey = RED.util.parseContextStore(config.result1Value);
                        node.context()[config.result1Type].set(contextKey.key, resObj, contextKey.store);
                    }
                }

                node.debug('operand1 ' + util.inspect(operand1));
                const resObj = null;
                const rules = config.rules;
                const rulesLength = rules.length;
                for (let i = 0; i < rulesLength; ++i) {
                    const rule = rules[i];
                    let operatorValid = true;
                    if (rule.propertyType !== 'none') {
                        const res = RED.util.evaluateNodeProperty(rule.propertyValue, rule.propertyType, node, msg);
                        operatorValid = (res === true || res === 'true');
                    }

                    if (operatorValid) {
                        const ruleoperand = tsGetOperandData(this, msg, rule.operandType, rule.operandValue, rule.format, rule.offsetType, rule.offsetValue, rule.multiplier);
                        node.debug('operand ' + util.inspect(ruleoperand));
                        node.debug('operator ' + util.inspect(rule.operator));
                        node.debug('operatorType ' + util.inspect(rule.operatorType));

                        let compare = null;
                        switch (rule.operator) {
                            case 1: // equal             { id: 1, group: "ms", label: "==", "text": "equal" },
                                compare = (op1, op2) => op1 === op2;
                                break;
                            case 2: // unequal           { id: 2, group: "ms", label: "!=", "text": "unequal" },
                                compare = (op1, op2) => op1 !== op2;
                                break;
                            case 3: // greater           { id: 3, group: "ms", label: ">", "text": "greater" },
                                compare = (op1, op2) => op1 > op2;
                                break;
                            case 4: // greaterOrEqual    { id: 5, group: "ms", label: ">=", "text": "greater or equal" },
                                compare = (op1, op2) => op1 >= op2;
                                break;
                            case 5: // lesser            { id: 6, group: "ms", label: "<", "text": "lesser" },
                                compare = (op1, op2) => op1 < op2;
                                break;
                            case 6: // lesserOrEqual     { id: 7, group: "ms", label: "<=", "text": "lesser or equal" },
                                compare = (op1, op2) => op1 <= op2;
                                break;
                        }

                        let result = false;
                        if (compare) {
                            const inputOperant = new Date(operand1);
                            // result = inputOperant.getTime() <= ruleoperand.getTime();
                            if (rule.operatorType !== '*' && typeof rule.operatorType !== 'undefined') {
                                switch (rule.operatorType) {
                                    case '11': // ms
                                        result = compare(inputOperant.getMilliseconds(), ruleoperand.getMilliseconds());
                                        break;
                                    case '12': // only sec
                                        result = compare(inputOperant.getSeconds(), ruleoperand.getSeconds());
                                        break;
                                    case '13': // only min
                                        result = compare(inputOperant.getMinutes(), ruleoperand.getMinutes());
                                        break;
                                    case '14': // only hour
                                        result = compare(inputOperant.getHours(), ruleoperand.getHours());
                                        break;
                                    case '15': // only day
                                        result = compare(inputOperant.getDate(), ruleoperand.getDate());
                                        break;
                                    case '16': // only Month
                                        result = compare(inputOperant.getMonth(), ruleoperand.getMonth());
                                        break;
                                    case '17': // only FullYear
                                        result = compare(inputOperant.getFullYear(), ruleoperand.getFullYear());
                                        break;
                                    case '18': // only dayOfWeek
                                        result = compare(inputOperant.getDay(), ruleoperand.getDay());
                                        break;
                                    default:
                                        if (rule.operatorType.indexOf('11') < 0) {
                                            inputOperant.setMilliseconds(0);
                                            ruleoperand.setMilliseconds(0);
                                        }

                                        if (rule.operatorType.indexOf('12') < 0) {
                                            inputOperant.setSeconds(0);
                                            ruleoperand.setSeconds(0);
                                        }

                                        if (rule.operatorType.indexOf('13') < 0) {
                                            inputOperant.setMinutes(0);
                                            ruleoperand.setMinutes(0);
                                        }

                                        if (rule.operatorType.indexOf('14') < 0) {
                                            inputOperant.setHours(0);
                                            ruleoperand.setHours(0);
                                        }

                                        if (rule.operatorType.indexOf('15') < 0) {
                                            inputOperant.setDate(0);
                                            ruleoperand.setDate(0);
                                        }

                                        if (rule.operatorType.indexOf('16') < 0) {
                                            inputOperant.setMonth(0);
                                            ruleoperand.setMonth(0);
                                        }

                                        if (rule.operatorType.indexOf('17') < 0) {
                                            inputOperant.setFullYear(0);
                                            ruleoperand.setFullYear(0);
                                        }

                                        result = compare(inputOperant.getTime(), ruleoperand.getTime());
                                        if (rule.operatorType.indexOf('18') >= 0) {
                                            result = result && compare(inputOperant.getDay(), ruleoperand.getDay());
                                        }

                                        break;
                                }
                            }
                        }

                        if (result) {
                            resObj.push(msg);
                            if (!config.checkall) {
                                break;
                            }
                        } else {
                            resObj.push(null);
                        }
                    }
                }

                for (let i = resObj.length; i < rulesLength; ++i) {
                    resObj.push(null);
                }

                resObj.push(msg);
                return resObj;
            } catch (err) {
                hlp.errorHandler(
                    this,
                    err,
                    RED._('time-calc.errors.error-text'),
                    RED._('time-calc.errors.error-title')
                );
            }
        });
    }

    RED.nodes.registerType('time-calc', timeCalcNode);

    /*
      RED.httpAdmin.get('/sun-position/js/*', function(req,res) {
          var options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
          };
          res.sendFile(req.params[0], options);
      });/* */
};