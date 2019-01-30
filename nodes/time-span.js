/********************************************
 * time-span:
 *********************************************/
'use strict';
const util = require('util');

const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
// const def = require(path.join(__dirname, '/lib/genericDefinitions.js'));

const perSecond = 1000;
const perMinute = 60000;
const perHour = 3600000;
const perDay = 86400000;
const perWeek = 604800000;

function getMonthDiff(d1,d2) {
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();
    const md1 = (new Date(d1.getFullYear(), d1.getMonth()+1, 0).getDate());

    months += (md1 - d1.getDate()) / md1 ;
    months += d2.getDate() / (new Date(d2.getFullYear(), d2.getMonth()+1, 0).getDate());
    return months;
}

function getMonthDiffAbs(d1,d2) {
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();
    if (d2.getDate() >= d1.getDate())
        months++;
    return months;
}

function getYearDiffAbs(d1,d2) {
    let years = (d2.getFullYear() - d1.getFullYear());
    if (d2.getMonth() >= d1.getMonth()) {
        years++;
    }
    return years;
}

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
        const dTmp = d1;
        d1 = d2;
        d2 = dTmp;
    }

    const tl = timeSpan;
    const ts = Math.floor(timeSpan / perSecond);
    const tm = Math.floor(timeSpan / perMinute);
    const tH = Math.floor(timeSpan / perHour);
    const td = Math.floor(timeSpan / perDay);
    const w = Math.floor(timeSpan / perWeek);
    const M = getMonthDiffAbs(d1, d2);
    const y = getYearDiffAbs(d1, d2);

    const L = timeSpan % 1000;
    const s = Math.floor(timeSpan / perSecond) % 60;
    const m = Math.floor(timeSpan / perMinute) % 60;
    const H = Math.floor(timeSpan / perHour) % 24;
    const d = Math.floor(timeSpan / perDay) % 7;

    const flags = {
        y,
        yy: pad(y),
        M,
        MM:pad(M),
        w,
        ww:pad(w),
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
        lll: pad(L, 3),
        ll: pad(Math.round(L / 10)),
        l: L,
        tlll: pad(tl, 3),
        tll: pad(Math.round(tl / 10)),
        tl,
        L: pad(L > 99 ? Math.round(L / 10) : L),
        t: H < 12 ? 'a' : 'p',
        tt: H < 12 ? 'am' : 'pm',
        T: H < 12 ? 'A' : 'P',
        TT: H < 12 ? 'AM' : 'PM',
        S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
    };

    return format.replace(token, $0 => {
        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
}

function getFormatedTimeSpanOut(date1, date2, format) {
    format = format || 0;
    if (isNaN(format)) {
        return formatTS(date1, date2, String(format));
    }
    switch (Number(format)) {
        case 0: // milliseconds
            return (date1.getTime() - date2.getTime());
        case 1: // sec
            return (date1.getTime() - date2.getTime()) / perSecond;
        case 2: // min
            return (date1.getTime() - date2.getTime()) / perMinute;
        case 3: // hour
            return (date1.getTime() - date2.getTime()) / perHour;
        case 4: // days
            return (date1.getTime() - date2.getTime()) / perDay;
        case 5: // weeks
            return (date1.getTime() - date2.getTime()) / perWeek;
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
            return Math.floor((date1.getTime() - date2.getTime()) / perSecond);
        case 12: // min
            return Math.floor((date1.getTime() - date2.getTime()) / perMinute);
        case 13: // hour
            return Math.floor((date1.getTime() - date2.getTime()) / perHour);
        case 14: // days
            return Math.floor((date1.getTime() - date2.getTime()) / perDay);
        case 15: // weeks
            return Math.floor((date1.getTime() - date2.getTime()) / perWeek);
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
    return null;
}

module.exports = function (RED) {
    'use strict';

    function tsGetCompOperandData(node, msg, type, value, multiplier) {
        let data;
        // 'msg', 'flow', 'global', 'num', 'bin', 'env', 'jsonata'
        if (type === 'msgPayload') {
            data = msg.payload;
        } else if (type === 'msgTs') {
            data = msg.ts;
        } else {
            data = RED.util.evaluateNodeProperty(value, type, node, msg);
        }
        if (data === null || typeof data === undefined) {
            throw new Error('could not evaluate ' + type + '.' + value);
        }
        data = parseFloat(data);
        if (isNaN(data)) {
            throw new Error('the value of ' + type + '.' + value + ' is not a valid Number!');
        }
        if (!isNaN(multiplier) && multiplier !== 0) {
            return data * multiplier;
        }
        return data;
    }

    function tsGetOperandData(node, msg, type, value, format, offset, multiplier) {
        let result = {};
        if (type === null || type === 'none' || type === '') {
            return Date.now();
        }

        if (type === 'entered' ||
            type === 'pdsTime' ||
            type === 'pdmTime' ||
            type === 'date'
        ) {
            result = node.positionConfig.getTimeProp(node, msg, type, value, offset, multiplier);
            if (result === null) {
                throw new Error('could not evaluate ' + type + '.' + value);
            } else if (result.error) {
                throw new Error('error on getting operand: ' + result.error);
            }
            return result.value;
        }
        let data;
        if (type === 'msgPayload') {
            data = msg.payload;
        } else if (type === 'msgTs') {
            data = msg.ts;
        } else {
            // msg, flow, global, str, num, env
            data = RED.util.evaluateNodeProperty(value, type, node, msg);
        }
        if (data === null || typeof data === undefined) {
            throw new Error('could not evaluate ' + type + '.' + value);
        }

        result.value = hlp.parseDateFromFormat(data, format, RED._('time-comp.days'), RED._('time-comp.month'), RED._('time-comp.dayDiffNames'));

        if (result.value === 'Invalid Date' || isNaN(result.value) || result.value === null) {
            throw new Error('could not evaluate format of ' + data);
        }
        return hlp.addOffset(result.value, offset, multiplier);
    }

    function tsGetPropData(node, msg, type, value, format, offset, multiplier, days) {
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

        if (type === 'entered' ||
            type === 'pdsTime' ||
            type === 'pdmTime' ||
            type === 'date') {
            const data = node.positionConfig.getTimeProp(node, msg, type, value, offset, multiplier, 1, days);
            if (!data.error) {
                return hlp.getFormatedDateOut(data.value, format, RED._('time-inject.days'), RED._('time-inject.month'), RED._('time-inject.dayDiffNames'));
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
            node.debug('config ' + util.inspect(config)); // eslint-disable-line
            node.debug('on input - msg ' + util.inspect(msg)); // eslint-disable-line
            if (node.positionConfig === null ||
                config.operator === null ||
                config.operand1Type === null ||
                config.operand2Type === null) {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'Configuration is missing!!'
                });
                throw new Error('Configuration is missing!!');
            }

            try {
                const operand1 = tsGetOperandData(node, msg, config.operand1Type, config.operand1, config.operand1Format, config.operand1Offset, config.operand1OffsetMultiplier);
node.debug('operand1 ' + util.inspect(operand1)); // eslint-disable-line
                if (operand1 === null) {
                    return null;
                }
                const operand2 = tsGetOperandData(node, msg, config.operand2Type, config.operand2, config.operand2Format, config.operand2Offset, config.operand2OffsetMultiplier);
node.debug('operand2 ' + util.inspect(operand2)); // eslint-disable-line
                if (operand2 === null) {
                    return null;
                }
                let timeSpan = operand1.getTime() - operand2.getTime();
                if (config.operand === 0) {
                    timeSpan = Math.abs(timeSpan);
                }

                if (config.result1Type !== 'none') {
                    let resObj = null;
node.debug('resObj1 ' + util.inspect(config.result1ValueType) + ' + ' + util.inspect(config.result1Format)); // eslint-disable-line
                    if (config.result1ValueType === 'timespan') {
                        resObj = getFormatedTimeSpanOut(operand1, operand2, config.result1TSFormat);
                    } else if (config.result1ValueType === 'operand1') {
                        resObj = hlp.getFormatedDateOut(operand1, config.result1Format, RED._('time-inject.days'), RED._('time-inject.month'), RED._('time-inject.dayDiffNames'));
                    } else if (config.result1ValueType === 'operand2') {
                        resObj = hlp.getFormatedDateOut(operand2, config.result1Format, RED._('time-inject.days'), RED._('time-inject.month'), RED._('time-inject.dayDiffNames'));
                    } else {
                        resObj = tsGetPropData(node, msg, config.result1ValueType, config.result1Value, config.result1Format, config.result1Offset, config.result1Multiplier);
                    }
                    // to
node.debug('resObj1 ' + util.inspect(resObj)); // eslint-disable-line
                    if (config.result1Type === 'msgPayload') {
                        config.result1Type = 'msg';
                        config.result1 = 'payload';
                    }
                    if (config.result1Type === 'msgTs') {
                        config.result1Type = 'msg';
                        config.result1 = 'ts';
                    }
node.debug('resObj2 ' + util.inspect(resObj)); // eslint-disable-line
                    if (resObj === null) {
                        throw new Error('could not evaluate ' + config.result1ValueType + '.' + config.result1Value);
                    } else if (resObj.error) {
                        this.error('error on getting result: ' + resObj.error);
                    } else if (config.result1Type === 'msg' || config.result1Type === 'msgProperty') {
                        RED.util.setMessageProperty(msg, config.result1, resObj);
                    } else if (config.result1Type === 'flow' || config.result1Type === 'global') {
                        const contextKey = RED.util.parseContextStore(config.result1);
                        node.context()[config.result1Type].set(contextKey.key, resObj, contextKey.store);
                    }
                }

node.debug('msg ' + util.inspect(msg)); // eslint-disable-line
                const resObj = [];
                const rules = config.rules;
                const rulesLength = rules.length;
                for (let i = 0; i < rulesLength; ++i) {
                    const rule = rules[i];
node.debug('checking rule ' + util.inspect(rule)); // eslint-disable-line
                    try {
                        const ruleoperand = tsGetCompOperandData(this, msg, rule.operandType, rule.operandValue,  rule.multiplier);

                        node.debug('operand ' + util.inspect(ruleoperand));
                        node.debug('operator ' + util.inspect(rule.operator));
                        node.debug('operatorType ' + util.inspect(rule.operatorType));

                        let result = false;
                        switch (rule.operator) {
                            case 1: // equal
                                result = (timeSpan === ruleoperand);
                                break;
                            case 2: // unequal
                                result = (timeSpan !== ruleoperand);
                                break;
                            case 3: // greater
                                result = (timeSpan > ruleoperand);
                                break;
                            case 4: // greaterOrEqual
                                result = (timeSpan >= ruleoperand);
                                break;
                            case 5: // lesser
                                result = (timeSpan < ruleoperand);
                                break;
                            case 6: // lesserOrEqual
                                result = (timeSpan <= ruleoperand);
                                break;
                        }
                        if (result) {
                            resObj.push(msg);
                            if (!config.checkall) {
                                break;
                            }
                        } else {
                            resObj.push(null);
                        }
                    } catch (err) {
                        hlp.handleError(this, RED._('time-calc.errors.error-text'), err, RED._('time-calc.errors.error-title'));
                        resObj.push(null);
                        continue;
                    }

                }

                for (let i = resObj.length; i < rulesLength; ++i) {
                    resObj.push(null);
                }

                resObj.push(msg);
node.debug('result object ' + util.inspect(resObj)); // eslint-disable-line
                this.send(resObj);
            } catch (err) {
                hlp.handleError(this, RED._('time-calc.errors.error-text'), err, RED._('time-calc.errors.error-title'));
            }
        });
    }

    RED.nodes.registerType('time-span', timeCalcNode);

    RED.httpAdmin.get('/sun-position/js/*', RED.auth.needsPermission('sun-position.read'), (req,res) => {
        // if (req.params[0] === 'definitions') {
        //    res.json(def);
        // } else {
        const options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
        // }
    });
};