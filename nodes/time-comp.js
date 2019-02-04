/********************************************
 * time-comp:
 *********************************************/
'use strict';
const util = require('util');

const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

module.exports = function (RED) {
    'use strict';

    function timeCompNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize time Node ' + util.inspect(config));
        const node = this;

        this.on('input', msg => {
            try {
                node.debug('input ' + util.inspect(msg));
                if (
                    node.positionConfig === null ||
                    config.operator === null ||
                    config.inputType === null
                ) {
                    throw new Error('Configuration is missing!!');
                }

                const offset1 = this.positionConfig.getFloatProp(node,msg,config.inputOffsetType, config.inputOffset);
                const inputData = this.positionConfig.getDateFromProp(node, msg, config.inputType, config.input, config.inputFormat, offset1, config.inputOffsetMultiplier);

                if (config.result1Type !== 'none' && config.result1Value) {
                    let resObj = null;
                    if (config.result1Type === 'input') {
                        resObj = hlp.getFormattedDateOut(inputData, config.result1Format, RED._('time-inject.days'), RED._('time-inject.month'), RED._('time-inject.dayDiffNames'));
                    } else {
                        resObj = this.positionConfig.getOutDataProp(node, msg, config.result1ValueType, config.result1Value, config.result1Format, config.result1Offset, config.result1Multiplier);
                    }

                    node.debug('resObj ' + util.inspect(resObj));
                    if (resObj === null) {
                        throw new Error('could not evaluate ' + config.result1ValueType + '.' + config.result1Value);
                    } else if (resObj.error) {
                        this.error('error on getting result: ' + resObj.error);
                    } else if (config.result1Type === 'msgPayload') {
                        msg.payload = resObj;
                    } else if (config.result1Type === 'msgTs') {
                        msg.ts = resObj;
                    } else if (config.result1Type === 'msg') {
                        RED.util.setMessageProperty(msg, config.result1Value, resObj, true);
                    } else if (config.result1Type === 'flow' || config.result1Type === 'global') {
                        const contextKey = RED.util.parseContextStore(config.result1Value);
                        node.context()[config.result1Type].set(contextKey.key, resObj, contextKey.store);
                    }
                }

                node.debug('input ' + util.inspect(inputData));
                const resObj = null;
                const rules = config.rules;
                const rulesLength = rules.length;
                for (let i = 0; i < rulesLength; ++i) {
                    const rule = rules[i];
                    let operatorValid = true;
                    if (rule.propertyType !== 'none') {
                        const res = RED.util.evaluateNodeProperty(rule.propertyValue, rule.propertyType, node, msg);
                        operatorValid = hlp.toBoolean(res);
                    }

                    if (operatorValid) {
                        const ruleoperand = this.positionConfig.getDateFromProp(node, msg, rule.operandType, rule.operandValue, rule.format, rule.offsetValue, rule.multiplier);
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
                            const inputOperant = new Date(inputData);
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
                hlp.handleError(this, RED._('time-comp.errors.error-text'), err, RED._('time-comp.errors.error-title'));
            }
        });
    }

    RED.nodes.registerType('time-comp', timeCompNode);

    RED.httpAdmin.get('/sun-position/js/*', (_req,_res) => {
        const options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        _res.sendFile(_req.params[0], options);
    });
};