/********************************************
 * time-span:
 *********************************************/
'use strict';
const util = require('util');
const path = require('path');
const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

// const path = require('path');
// const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

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
    const tw = Math.floor(timeSpan / perWeek);

    const l = timeSpan % 1000;
    const s = Math.floor(timeSpan / perSecond) % 60;
    const m = Math.floor(timeSpan / perMinute) % 60;
    const H = Math.floor(timeSpan / perHour) % 24;
    const d = Math.floor(timeSpan / perDay) % 7;
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
        S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
    };

    return format.replace(token, $0 => {
        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
}

function getFormattedTimeSpanOut(date1, date2, format) {
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
    const timeSpan = date1.getTime() - date2.getTime();
    return {
        start : {
            date: date1,
            ts: date1.getTime(),
            timeUTCStr: date1.toUTCString(),
            timeISOStr: date1.toISOString()
        },
        end: {
            date: date2,
            ts: date2.getTime(),
            timeUTCStr: date2.toUTCString(),
            timeISOStr: date2.toISOString()
        },
        timeSpan: timeSpan,
        timeSpanAbs: {
            ms: timeSpan % 1000,
            sec: Math.floor(timeSpan / perSecond) % 60,
            min: timeSpan % 1000,
            hours: Math.floor(timeSpan / perHour) % 24,
            days: Math.floor(timeSpan / perDay) % 7,
            month: getMonthDiffAbs(date1, date2),
            years: getYearDiffAbs(date1, date2)
        },
        timeSpanRel: {
            ms: timeSpan,
            sec: (timeSpan / perSecond),
            min: (timeSpan / perMinute),
            hour: (timeSpan / perHour),
            day: (timeSpan / perDay),
            week: (timeSpan / perWeek),
            month: getMonthDiff(date1, date2),
            year:  getMonthDiff(date1, date2) / 12
        }
    };
}

module.exports = function (RED) {
    'use strict';

    function timeSpanNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        const node = this;

        this.on('input', msg => {
            if (node.positionConfig === null ||
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
                const operand1 = node.positionConfig.getDateFromProp(node, msg, config.operand1Type, config.operand1, config.operand1Format, config.operand1Offset, config.operand1OffsetType, config.operand1OffsetMultiplier);
                if (operand1 === null) {
                    return null;
                }
                const operand2 = node.positionConfig.getDateFromProp(node, msg, config.operand2Type, config.operand2, config.operand2Format, config.operand2Offset, config.operand2OffsetType, config.operand2OffsetMultiplier);
                if (operand2 === null) {
                    return null;
                }
                let timeSpan = operand1.getTime() - operand2.getTime();
                if (config.operand === 0) {
                    timeSpan = Math.abs(timeSpan);
                }

                if (config.result1Type !== 'none') {
                    let resultObj = null;
                    if (config.result1ValueType === 'timespan') {
                        resultObj = getFormattedTimeSpanOut(operand1, operand2, config.result1TSFormat);
                        resultObj.start.timeLocaleTimeStr = node.positionConfig.toTimeString(resultObj.start.date);
                        resultObj.start.timeLocaleDateStr = node.positionConfig.toDateString(resultObj.start.date);
                        resultObj.end.timeLocaleTimeStr = node.positionConfig.toTimeString(resultObj.end.date);
                        resultObj.end.timeLocaleDateStr = node.positionConfig.toDateString(resultObj.end.date);
                    } else if (config.result1ValueType === 'operand1') {
                        resultObj = hlp.getFormattedDateOut(operand1, config.result1Format);
                    } else if (config.result1ValueType === 'operand2') {
                        resultObj = hlp.getFormattedDateOut(operand2, config.result1Format);
                    } else {
                        resultObj = node.positionConfig.getOutDataProp(node, msg, config.result1ValueType, config.result1Value, config.result1Format, config.result1Offset, config.result1OffsetType, config.result1Multiplier);
                    }
                    // to

                    if (resultObj === null) {
                        throw new Error('could not evaluate ' + config.result1ValueType + '.' + config.result1Value);
                    } else if (resultObj.error) {
                        node.error('error on getting result: ' + resultObj.error);
                    } else if (config.result1Type === 'msgPayload') {
                        msg.payload = resultObj;
                    } else if (config.result1Type === 'msgTs') {
                        msg.ts = resultObj;
                    } else if (config.result1Type === 'msgLc') {
                        msg.lc = resultObj;
                    } else if (config.result1Type === 'msgValue') {
                        msg.value = resultObj;
                    } else if (config.result1Type === 'msg') {
                        RED.util.setMessageProperty(msg, config.result1, resultObj);
                    } else if (config.result1Type === 'flow' || config.result1Type === 'global') {
                        const contextKey = RED.util.parseContextStore(config.result1);
                        node.context()[config.result1Type].set(contextKey.key, resultObj, contextKey.store);
                    }
                }

                const resObj = [];
                const rules = config.rules;
                const rulesLength = rules.length;
                for (let i = 0; i < rulesLength; ++i) {
                    const rule = rules[i];
                    try {
                        let ruleoperand = node.positionConfig.getFloatProp(node, msg, rule.operandType, rule.operandValue, 0);
                        if (!isNaN(rule.multiplier) && rule.multiplier !== 0) {
                            ruleoperand = ruleoperand * rule.multiplier;
                        }
                        /*
                        node.debug('operand ' + util.inspect(ruleoperand));
                        node.debug('operator ' + util.inspect(rule.operator));
                        node.debug('operatorType ' + util.inspect(rule.operatorType)); */

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
                        node.error(err.message);
                        node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
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
                    text: (operand1.getTime() - operand2.getTime()) / 1000 + 's'
                });

                node.send(resObj);
            } catch (err) {
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text:  RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
                throw err;
            }
        });
    }

    RED.nodes.registerType('time-span', timeSpanNode);
};