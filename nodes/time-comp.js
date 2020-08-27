/********************************************
 * time-comp:
 *********************************************/
'use strict';
const util = require('util');
const path = require('path');
const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

module.exports = function (RED) {
    'use strict';
    /**
     * timeCompNode
     * @param {*} config - configuration
     */
    function timeCompNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize time Node ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        this.input = {
            type: config.inputType,
            value: config.input,
            format: config.inputFormat,
            offsetType: config.inputOffsetType,
            offset: config.inputOffset,
            multiplier: config.inputOffsetMultiplier
        };

        this.result1 = {
            type   : config.result1Type,
            value  : config.result1,
            format : config.result1Format
        };

        this.result1Value = {
            type: config.result1ValueType,
            value: config.result1Value,
            format: config.result1Format,
            offsetType: config.result1OffsetType,
            offset: config.result1Offset,
            multiplier: config.result1Multiplier,
            next: true
        };
        if (this.positionConfig && this.result1Value.type === 'jsonata') {
            try {
                this.result1Value.expr = this.positionConfig.getJSONataExpression(this, this.result1Value.value);
            } catch (err) {
                this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                this.result1Value.expr = null;
            }
        }

        this.rules = config.rules;
        this.checkall = config.checkall;
        const node = this;

        this.on('input', (msg, send, done) => {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            if (node.positionConfig === null ||
                typeof node.positionConfig === 'undefined' ||
                node.input.type === null ||
                typeof node.input.type === 'undefined') {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'Configuration is missing!!'
                });
                throw new Error('Configuration is missing!!');
            }

            try {
                // const inputData = node.positionConfig.getDateFromProp(node, msg, node.input.type, node.input.value);
                const inputData = node.positionConfig.getTimeProp(node, msg, node.input);
                if (inputData.error) {
                    throw new Error(inputData.error);
                }

                if (node.result1.type !== 'none') {
                    let resultObj = null;
                    if (node.result1Value.type === 'input') {
                        resultObj = hlp.getFormattedDateOut(inputData.value, node.result1.format);
                    } else {
                        resultObj = node.positionConfig.getOutDataProp(node, msg, node.result1Value);
                    }

                    if (resultObj === null || typeof resultObj === 'undefined') {
                        throw new Error('could not evaluate ' + node.result1Value.type + '.' + node.result1Value.value);
                    } else if (resultObj.error) {
                        node.error('error on getting result: ' + resultObj.error);
                    } else {
                        node.positionConfig.setMessageProp(this, msg, node.result1.type, node.result1.value, resultObj);
                    }
                }

                const resObj = [];
                const rulesLength = node.rules.length;
                for (let i = 0; i < rulesLength; ++i) {
                    const rule = node.rules[i];
                    let operatorValid = true;
                    if (rule.propertyType !== 'none') {
                        const res = RED.util.evaluateNodeProperty(rule.propertyValue, rule.propertyType, node, msg);
                        operatorValid = hlp.toBoolean(res);
                    }

                    if (operatorValid) {
                        if (rule.format === 'time-calc.timeFormat.default') {
                            rule.format = 0;
                        }
                        // node.debug(i + ' rule=' + util.inspect(rule, { colors: true, compact: 10, breakLength: Infinity }));

                        let compare = null;
                        let result = false;
                        switch (Number(rule.operator)) {
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
                            case 99: // otherwise
                                result = true;
                                break;
                        }

                        if (compare) {
                            let ruleoperand = null;
                            try {
                                ruleoperand = node.positionConfig.getTimeProp(node, msg, {
                                    type: rule.operandType,
                                    value: rule.operandValue,
                                    format: rule.format,
                                    offsetType: 'num',
                                    offset: rule.offsetValue,
                                    multiplier: rule.multiplier
                                });
                            } catch (ex) {
                                continue;
                            }

                            // node.debug(i + ' operand=' + util.inspect(ruleoperand, { colors: true, compact: 10, breakLength: Infinity }));
                            if (!ruleoperand || ruleoperand.error) {
                                continue;
                            }
                            ruleoperand = ruleoperand.value;

                            const inputOperant = new Date(inputData.value);
                            // node.debug(i + ' inputOperant=' + util.inspect(inputOperant, { colors: true, compact: 10, breakLength: Infinity }));
                            // node.debug(i + ' operatorType=' + util.inspect(rule.operatorType, { colors: true, compact: 10, breakLength: Infinity }));
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

                                        // node.debug(i + ' inputOperant=' + util.inspect(inputOperant, { colors: true, compact: 10, breakLength: Infinity }));
                                        // node.debug(i + ' ruleoperand=' + util.inspect(ruleoperand, { colors: true, compact: 10, breakLength: Infinity }));

                                        result = compare(inputOperant.getTime(), ruleoperand.getTime());
                                        if (rule.operatorType.indexOf('18') >= 0) {
                                            result = result && compare(inputOperant.getDay(), ruleoperand.getDay());
                                        }
                                        // node.debug(i + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                                        // node.debug(i + ' inputData=' + util.inspect(inputData, { colors: true, compact: 10, breakLength: Infinity }));
                                        // node.debug(i + ' operand=' + util.inspect(ruleoperand, { colors: true, compact: 10, breakLength: Infinity }));
                                        break;
                                }
                            }
                        }
                        // node.debug(i + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));

                        if (result) {
                            resObj.push(msg);
                            node.debug(i + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                            if (node.checkall != 'true') { // eslint-disable-line eqeqeq
                                node.debug(i + ' end cause checkall');
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
                node.status({
                    text: inputData.value.toISOString()
                });
                send(resObj); // node.send(resObj);
                done();
                return null;
            } catch (err) {
                node.log(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text:  RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
                done('internal error time-comp:' + err.message, msg);
                // throw err;
            }
            return null;
        });
    }

    RED.nodes.registerType('time-comp', timeCompNode);
};