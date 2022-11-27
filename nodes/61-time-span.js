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
 * time-span:
 *********************************************/
'use strict';
/** --- Type Defs ---
  * @typedef {import('./types/typedefs.js').runtimeRED} runtimeRED
  * @typedef {import('./types/typedefs.js').runtimeNode} runtimeNode
  * @typedef {import('./types/typedefs.js').runtimeNodeConfig} runtimeNodeConfig
  * @typedef {import("./10-position-config.js").ITimePropertyType} ITimePropertyType
  * @typedef {import("./10-position-config.js").IPositionConfigNode} IPositionConfigNode
  */


/**
  * @typedef {Object} ITimeSpanNodeInstance Extensions for the nodeInstance object type
  * @property {IPositionConfigNode} positionConfig    -   tbd
  *
 * @property {ITimePropertyType} operand1      -   operand1 data
 * @property {ITimePropertyType} operand2      -   operand2 data
 * @property {number} operand                  -   operand
 * @property {Array} results                -   output data
 * @property {Array} rules                  -   input data
 * @property {boolean|string} checkall      -   define if check all rules
 *
 */

/**
  * @typedef {ITimeSpanNodeInstance & runtimeNode} ITimeSpanNode Combine nodeInstance with additional, optional functions
  */
/******************************************************************************************/
/** Export the function that defines the node
  * @type {runtimeRED} */
module.exports = function (/** @type {runtimeRED} */ RED) {
    'use strict';

    const util = require('util');
    const hlp = require('./lib/dateTimeHelper.js');

    /**
     * get the differense between two month relative
     * @param {Date} d1 - Date 1
     * @param {Date} d1 - Date 2
     * @returns {number} differences in month between the two dates
     */
    function getMonthDiff(d1,d2) {
        let months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth() + 1;
        months += d2.getMonth();
        const md1 = (new Date(d1.getFullYear(), d1.getMonth()+1, 0).getDate());

        months += (md1 - d1.getDate()) / md1 ;
        months += d2.getDate() / (new Date(d2.getFullYear(), d2.getMonth()+1, 0).getDate());
        return months;
    }

    /**
     * get the differense between two month absolute
     * @param {Date} d1 - Date 1
     * @param {Date} d1 - Date 2
     * @returns {number} differences in month between the two dates
     */
    function getMonthDiffAbs(d1,d2) {
        let months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth() + 1;
        months += d2.getMonth();
        if (d2.getDate() >= d1.getDate())
            months++;
        return months;
    }

    /**
     * get the differense between years absolute
     * @param {Date} d1 - Date 1
     * @param {Date} d1 - Date 2
     * @returns {number} differences in years between the two dates
     */
    function getYearDiffAbs(d1,d2) {
        let years = (d2.getFullYear() - d1.getFullYear());
        if (d2.getMonth() >= d1.getMonth()) {
            years++;
        }
        return years;
    }

    /**
     * format timespan
     * @param {Date} d1 - Date 1
     * @param {Date} d1 - Date 2
     * @param {string} format - the out format
     * @returns {string} differences in years between the two dates
     */
    function formatTS(d1, d2, format) {
        const token = /[yMw]{1,2}|t?[dhHkKms]{1,2}|t?l{1,3}|[tT]{1,2}|S|L|"[^"]*"|'[^']*'/g;

        const pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) {
                val = '0' + val;
            }

            return val;
        };

        let timeSpan = (d2.getTime() - d1.getTime());
        if (timeSpan < 0) {
            timeSpan = timeSpan * -1;
            [d1, d2] = [d2, d1];
        }

        const tl = timeSpan;
        const ts = Math.floor(timeSpan / hlp.TIME_1s);
        const tm = Math.floor(timeSpan / hlp.TIME_1min);
        const tH = Math.floor(timeSpan / hlp.TIME_1h);
        const td = Math.floor(timeSpan / hlp.TIME_24h);
        const tw = Math.floor(timeSpan / hlp.TIME_WEEK);

        const l = timeSpan % 1000;
        const s = Math.floor(timeSpan / hlp.TIME_1s) % 60;
        const m = Math.floor(timeSpan / hlp.TIME_1min) % 60;
        const H = Math.floor(timeSpan / hlp.TIME_1h) % 24;
        const d = Math.floor(timeSpan / hlp.TIME_24h) % 7;
        const M = getMonthDiffAbs(d1, d2);
        const y = getYearDiffAbs(d1, d2);

        const flags = {
            y,
            yy: pad(y),
            M,
            MM:pad(M),
            tw,
            tww:pad(tw),
            d,
            dd: pad(d),
            td,
            tdd: pad(td),
            h: H % 12 || 12,
            hh: pad(H % 12 || 12),
            th: tH % 12 || 12,
            thh: pad(tH % 12 || 12),
            H, // 0-23
            HH: pad(H), // 00-23
            tH, // 0-23
            tHH: pad(tH), // 00-23
            k: (H % 12 || 12) - 1,
            kk: pad((H % 12 || 12) - 1),
            tk: (tH % 12 || 12) - 1,
            tkk: pad((tH % 12 || 12) - 1),
            K: H + 1, // 1-24
            KK: pad(H + 1), // 01-24
            tK: tH + 1,
            tKK: pad(tH + 1),
            m,
            mm: pad(m),
            tm,
            tmm: pad(tm),
            s,
            ss: pad(s),
            ts,
            tss: pad(ts),
            l,
            ll: pad(l),
            lll: pad(l, 3),
            L: Math.round(l / 100),
            LL: pad(Math.round(l / 10)),
            LLL: pad(l, 3),
            tl,
            tll: pad(Math.round(tl / 10)),
            tlll: pad(tl, 3),
            t: H < 12 ? 'a' : 'p',
            tt: H < 12 ? 'am' : 'pm',
            T: H < 12 ? 'A' : 'P',
            TT: H < 12 ? 'AM' : 'PM',
            // @ts-ignore
            S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
        };

        return format.replace(token, $0 => {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    }

    /**
     * get a formated timespan
     * @param {Date} date1 - Date 1
     * @param {Date} date2 - Date 2
     * @param {number|string} format - the out format
     * @returns {number|object} the formatet timespan
     */
    function getFormattedTimeSpanOut(node, date1, date2, format) {
        const timeSpan = date1.getTime() - date2.getTime();

        format = format || 0;
        // @ts-ignore
        if (isNaN(format)) {
            return formatTS(date1, date2, String(format));
        }
        switch (Number(format)) {
            case 1: // sec
                return (timeSpan) / hlp.TIME_1s;
            case 2: // min
                return (timeSpan) / hlp.TIME_1min;
            case 3: // hour
                return (timeSpan) / hlp.TIME_1h;
            case 4: // days
                return (timeSpan) / hlp.TIME_24h;
            case 5: // weeks
                return (timeSpan) / hlp.TIME_WEEK;
            case 6: // month
                if (date1.getTime() > date2.getTime()) {
                    return getMonthDiff(date2, date1) * -1;
                }
                return getMonthDiff(date1, date2);
            case 7: // year
                if (date1.getTime() > date2.getTime()) {
                    return (getMonthDiff(date2, date1) / 12) * -1;
                }
                return (getMonthDiff(date1, date2) / 12);
            case 11: // sec
                return Math.floor((timeSpan) / hlp.TIME_1s);
            case 12: // min
                return Math.floor((timeSpan) / hlp.TIME_1min);
            case 13: // hour
                return Math.floor((timeSpan) / hlp.TIME_1h);
            case 14: // days
                return Math.floor((timeSpan) / hlp.TIME_24h);
            case 15: // weeks
                return Math.floor((timeSpan) / hlp.TIME_WEEK);
            case 16: // full month
                if (date1.getTime() > date2.getTime()) {
                    return getMonthDiffAbs(date2, date1) * -1;
                }
                return getMonthDiffAbs(date1, date2);
            case 17: // full year
                if (date1.getTime() > date2.getTime()) {
                    return getYearDiffAbs(date2, date1) * -1;
                }
                return getYearDiffAbs(date1, date2);
        }

        return {
            start : {
                date: date1,
                ts: date1.getTime(),
                timeUTCStr: date1.toUTCString(),
                timeISOStr: date1.toISOString(),
                timeLocaleTimeStr: node.positionConfig.toTimeString(date1),
                timeLocaleDateStr: node.positionConfig.toDateString(date1)
            },
            end: {
                date: date2,
                ts: date2.getTime(),
                timeUTCStr: date2.toUTCString(),
                timeISOStr: date2.toISOString(),
                timeLocaleTimeStr: node.positionConfig.toTimeString(date2),
                timeLocaleDateStr: node.positionConfig.toDateString(date2)
            },
            timeSpan,
            timeSpanAbs: {
                ms: timeSpan % 1000,
                sec: Math.floor(timeSpan / hlp.TIME_1s) % 60,
                min: timeSpan % 1000,
                hours: Math.floor(timeSpan / hlp.TIME_1h) % 24,
                days: Math.floor(timeSpan / hlp.TIME_24h) % 7,
                month: getMonthDiffAbs(date1, date2),
                years: getYearDiffAbs(date1, date2)
            },
            timeSpanRel: {
                ms: timeSpan,
                sec: (timeSpan / hlp.TIME_1s),
                min: (timeSpan / hlp.TIME_1min),
                hour: (timeSpan / hlp.TIME_1h),
                day: (timeSpan / hlp.TIME_24h),
                week: (timeSpan / hlp.TIME_WEEK),
                month: getMonthDiff(date1, date2),
                year:  getMonthDiff(date1, date2) / 12
            }
        };
    }

    /**
     * standard Node-Red Node handler for the timeSpanNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function timeSpanNode(config) {
        RED.nodes.createNode(this, config);
        /** Copy 'this' object in case we need it in context of callbacks of other functions.
         * @type {ITimeSpanNode}
         */
        // @ts-ignore
        const node = this;

        // Retrieve the config node
        node.positionConfig = RED.nodes.getNode(config.positionConfig);
        if (!node.positionConfig) {
            node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
            node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
            return;
        }
        if (node.positionConfig.checkNode(
            error => {
                const text = RED._('node-red-contrib-sun-position/position-config:errors.config-error', { error });
                node.error(text);
                node.status({fill: 'red', shape: 'dot', text });
                return true;
            }, false)) {
            return;
        }
        node.operand1 = {
            type: config.operand1Type,
            value: config.operand1,
            next: hlp.isTrue(config.operand1Next),
            format: config.operand1Format,
            offsetType: config.operand1OffsetType,
            offset: config.operand1Offset,
            multiplier: config.operand1OffsetMultiplier
        };
        if (node.operand1.type !== 'entered' && node.operand1.type !== 'pdsTime' && node.operand1.type !== 'pdsTimeCustom' && node.operand1.type !== 'pdmTime') {
            node.operand1.next = false;
        }

        node.operand2 = {
            type: config.operand2Type,
            value: config.operand2,
            next: hlp.isTrue(config.operand2Next),
            format: config.operand2Format,
            offsetType: config.operand2OffsetType,
            offset: config.operand2Offset,
            multiplier: config.operand2OffsetMultiplier
        };
        if (node.operand2.type !== 'entered' && node.operand2.type !== 'pdsTime' && node.operand2.type !== 'pdsTimeCustom' && node.operand2.type !== 'pdmTime') {
            node.operand2.next = false;
        }

        if (!Array.isArray(config.results)) {
            config.results = [];
            if (config.result1Type && config.result1Type !== 'none') {
                config.results.push({
                    p           : config.result1 ? config.result1 : 'msgPayload',
                    pt          : config.result1Type ? config.result1Type : 'input',
                    v           : config.result1Value ? config.result1Value : '',
                    vt          : config.result1ValueType ? config.result1ValueType : 'input',
                    fTs         : config.result1TSFormat ? config.result1TSFormat : 1,
                    o           : config.result1Offset ? config.result1Offset : 1,
                    oT          : (config.result1OffsetType === 0 || config.result1OffsetType === '') ? 'none' : (config.result1OffsetType ? config.result1OffsetType : 'num'),
                    oM          : config.result1OffsetMultiplier ? config.result1OffsetMultiplier : 60000,
                    f           : config.result1Format ? config.result1Format : 0,
                    next        : true,
                    days        : '*',
                    months      : '*',
                    onlyEvenDays: false,
                    onlyOddDays : false
                });
            }

            delete config.result1;
            delete config.result1Type;
            delete config.result1Value;
            delete config.result1ValueType;
            delete config.result1TSFormat;
            delete config.result1Format;
            delete config.result1Offset;
            delete config.result1OffsetType;
            delete config.result1OffsetMultiplier;
        }

        node.results = [];
        config.results.forEach(prop => {
            const propNew = {
                outType         : prop.pt,
                outValue        : prop.p,
                type            : prop.vt,
                value           : prop.v,
                format          : prop.f,
                offsetType      : prop.oT,
                offset          : prop.o,
                multiplier      : parseFloat(prop.oM) || 60000,
                outTSFormat     : prop.fTs,
                next            : (typeof prop.next === 'undefined' || prop.next === null || hlp.isTrue(prop.next)) ? true : false,
                days            : prop.days,
                months          : prop.months,
                onlyEvenDays    : prop.onlyEvenDays === 'true' || prop.onlyEvenDays === true,
                onlyOddDays     : prop.onlyOddDays === 'true' || prop.onlyOddDays === true,
                onlyEvenWeeks   : prop.onlyEvenWeeks === 'true' || prop.onlyEvenWeeks === true,
                onlyOddWeeks    : prop.onlyOddWeeks === 'true' || prop.onlyOddWeeks === true
            };
            if (propNew.type !== 'entered' && propNew.type !== 'pdsTime' && propNew.type !== 'pdsTimeCustom' && propNew.type !== 'pdmTime') {
                propNew.next = false;
            }

            if (node.positionConfig && propNew.type === 'jsonata') {
                try {
                    propNew.expr = node.positionConfig.getJSONataExpression(node, propNew.value);
                } catch (err) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error: err.message }));
                    propNew.expr = null;
                }
            }
            node.results.push(propNew);
        });
        node.checkall = config.checkall === 'true' || config.checkall === true;
        node.rules = config.rules;
        const rulesLength = node.rules.length;
        for (let i = 0; i < rulesLength; ++i) {
            const rule = node.rules[i];
            rule.operator = Number(rule.operator);

            if (rule.operator === 99) {
                rule.next = false;
            } else {
                if (rule.operandType !== 'entered' && rule.operandType !== 'pdsTime' && rule.operandType !== 'pdsTimeCustom' && rule.operandType !== 'pdmTime') {
                    rule.next = false;
                }
            }
            rule.compare = null;
            rule.result = false;
            switch (rule.operator) {
                case 1: // equal             { id: 1, group: "ms", label: "==", "text": "equal" },
                    rule.compare = (op1, op2) => op1 === op2;
                    break;
                case 2: // unequal           { id: 2, group: "ms", label: "!=", "text": "unequal" },
                    rule.compare = (op1, op2) => op1 !== op2;
                    break;
                case 3: // greater           { id: 3, group: "ms", label: ">", "text": "greater" },
                    rule.compare = (op1, op2) => op1 > op2;
                    break;
                case 4: // greaterOrEqual    { id: 5, group: "ms", label: ">=", "text": "greater or equal" },
                    rule.compare = (op1, op2) => op1 >= op2;
                    break;
                case 5: // lesser            { id: 6, group: "ms", label: "<", "text": "lesser" },
                    rule.compare = (op1, op2) => op1 < op2;
                    break;
                case 6: // lesserOrEqual     { id: 7, group: "ms", label: "<=", "text": "lesser or equal" },
                    rule.compare = (op1, op2) => op1 <= op2;
                    break;
                case 99: // otherwise
                    rule.result = true;
                    break;
            }
        }

        node.on('input', (msg, send, done) => {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };
            const dNow = new Date();

            if (node.positionConfig === null ||
                typeof node.positionConfig === 'undefined' ||
                node.operand1.type === null ||
                typeof node.operand1.type === 'undefined' ||
                node.operand2.type === null ||
                typeof node.operand2.type === 'undefined') {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'Configuration is missing!!'
                });
                throw new Error('Configuration is missing!!');
            }

            try {
                const operand1 = node.positionConfig.getTimeProp(node, msg, node.operand1);
                if (operand1.error) {
                    throw new Error(operand1.error);
                }

                const operand2 = node.positionConfig.getTimeProp(node, msg, node.operand2);
                if (operand2.error) {
                    throw new Error(operand2.error);
                }

                // node.debug('operand1=' + util.inspect(operand1, { colors: true, compact: 10, breakLength: Infinity }));
                // node.debug('operand2=' + util.inspect(operand2, { colors: true, compact: 10, breakLength: Infinity }));

                for (let i = 0; i < node.results.length; i++) {
                    const prop = node.results[i];
                    // node.debug(`prepOutMsg-${i} node.results[${i}]=${util.inspect(prop, { colors: true, compact: 10, breakLength: Infinity })}`);

                    let resultObj = null;
                    if (prop.type === 'timespan') {
                        resultObj = getFormattedTimeSpanOut(node, operand1.value, operand2.value, prop.outTSFormat);
                    } else if (prop.type === 'operand1') {
                        resultObj = node.positionConfig.formatOutDate(node, msg, operand1.value, prop);
                    } else if (prop.type === 'operand2') {
                        resultObj = node.positionConfig.formatOutDate(node, msg, operand2.value, prop);
                    } else {
                        resultObj = node.positionConfig.getOutDataProp(node, msg, prop, dNow);
                    }

                    if (resultObj === null || (typeof resultObj === 'undefined')) {
                        node.error('Could not evaluate ' + prop.type + '.' + prop.value + '. - Maybe settings outdated (open and save again)!');
                    } else if (resultObj.error) {
                        node.error('error on getting result: "' + resultObj.error + '"');
                    } else {
                        node.positionConfig.setMessageProp(node, msg, prop.outType, prop.outValue, resultObj);
                    }
                    // node.debug(`prepOutMsg-${i} msg=${util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })}`);
                }

                const timeSpan = operand1.value.getTime() - operand2.value.getTime();

                const resObj = [];
                for (let i = 0; i < rulesLength; ++i) {
                    const rule = node.rules[i];
                    try {
                        rule.result =  rule.operator === 99;
                        if (rule.compare) {
                            let ruleoperand = node.positionConfig.getFloatProp(node, msg,
                                { type: rule.operandType, value: rule.operandValue, def: 0 });
                            if (!isNaN(rule.multiplier) && rule.multiplier !== 0) {
                                ruleoperand = ruleoperand * rule.multiplier;
                            }
                            rule.result = rule.compare(timeSpan, ruleoperand);
                        }
                        if (rule.result) {
                            resObj.push(msg);
                            if (!node.checkall) { // eslint-disable-line eqeqeq
                                break;
                            }
                        } else {
                            resObj.push(null);
                        }
                    } catch (err) {
                        node.error(err.message);
                        node.log(util.inspect(err));
                        node.status({
                            fill: 'red',
                            shape: 'ring',
                            text:  err.message
                        });
                        resObj.push(null);
                        continue;
                    }
                }

                for (let i = resObj.length; i < rulesLength; ++i) {
                    resObj.push(null);
                }

                resObj.push(msg);
                node.status({
                    text: (operand1.value.getTime() - operand2.value.getTime()) / 1000 + 's'
                });
                send(resObj); // node.send(resObj);
                done();
                return null;
            } catch (err) {
                node.log(err.message);
                node.log(util.inspect(err));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text:  RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
                done('internal error time-span:' + err.message, msg);
                // throw err;
            }
            return null;
        });
        node.status({});
    }

    RED.nodes.registerType('time-span', timeSpanNode);
};