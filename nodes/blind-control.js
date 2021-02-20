/********************************************
 * blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const ctrlLib = require(path.join(__dirname, '/lib/timeControlHelper.js'));
const util = require('util');

const cRuleUntil = 0;
const cRuleFrom = 1;
const cRuleAbsolute = 0;
const cRuleMinOversteer = 1; // ⭳❗ minimum (oversteer)
const cRuleMaxOversteer = 2; // ⭱️❗ maximum (oversteer)
const cautoTriggerTimeBeforeSun = 10 * 60000; // 10 min
const cautoTriggerTimeSun = 5 * 60000; // 5 min
/******************************************************************************************/
/**
 * get the absolute level from percentage level
 * @param {*} node the node settings
 * @param {*} percentPos the level in percentage (0-1)
 */
function posPrcToAbs_(node, levelPercent) {
    return posRound_(node, ((node.nodeData.levelTop - node.nodeData.levelBottom) * levelPercent) + node.nodeData.levelBottom);
}
/**
 * get the percentage level from absolute level  (0-1)
 * @param {*} node the node settings
 * @param {*} levelAbsolute the level absolute
 * @return {number} get the level percentage
 */
function posAbsToPrc_(node, levelAbsolute) {
    return (levelAbsolute - node.nodeData.levelBottom) / (node.nodeData.levelTop - node.nodeData.levelBottom);
}
/**
 * get the absolute inverse level
 * @param {*} node the node settings
 * @param {*} levelAbsolute the level absolute
 * @return {number} get the inverse level
 */
function getInversePos_(node, level) {
    return posPrcToAbs_(node, 1 - posAbsToPrc_(node, level));
}
/**
 * get the absolute inverse level
 * @param {*} node the node settings
 * @return {number} get the current level
 */
function getRealLevel_(node) {
    if (node.levelReverse) {
        return isNaN(node.level.currentInverse) ? node.previousData.levelInverse: node.level.currentInverse;
    }
    return isNaN(node.level.current) ? node.previousData.level : node.level.current;
}

/**
 * round a level to the next increment
 * @param {*} node node data
 * @param {number} pos level
 * @return {number} rounded level number
 */
function posRound_(node, pos) {
    // node.debug(`levelPrcToAbs_ ${pos} - increment is ${node.nodeData.increment}`);
    // pos = Math.ceil(pos / node.nodeData.increment) * node.nodeData.increment;
    // pos = Math.floor(pos / node.nodeData.increment) * node.nodeData.increment;
    pos = Math.round(pos / node.nodeData.increment) * node.nodeData.increment;
    pos = Number(pos.toFixed(hlp.countDecimals(node.nodeData.increment)));
    if (pos > node.nodeData.levelTop) {
        pos = node.nodeData.levelTop;
    }
    if (pos < node.nodeData.levelBottom) {
        pos = node.nodeData.levelBottom;
    }
    // node.debug(`levelPrcToAbs_ result ${pos}`);
    return pos;
}

/**
 * normalizes an angle
 * @param {number} angle to normalize
 */
function angleNorm_(angle) {
    while (angle < 0) {
        angle += 360;
    }
    while (angle > 360) {
        angle -= 360;
    }
    return angle;
}

/**
 * check if angle is between start and end
 */
function angleBetween_(angle, start, end) {
    if(start<end) return start<=angle && angle<=end;
    return               start<=angle || angle<=end;
}

/******************************************************************************************/
/**
 * calculates the current sun level
 * @param {*} node node data
 * @param {*} dNow the current timestamp
 */
function getSunPosition_(node, dNow) {
    const sunPosition = node.positionConfig.getSunCalc(dNow, false, false);
    // node.debug('sunPosition: ' + util.inspect(sunPosition, { colors: true, compact: 10, breakLength: Infinity }));
    sunPosition.InWindow = angleBetween_(sunPosition.azimuthDegrees, node.windowSettings.AzimuthStart, node.windowSettings.AzimuthEnd);
    // node.debug(`sunPosition: InWindow=${sunPosition.InWindow} azimuthDegrees=${sunPosition.azimuthDegrees} AzimuthStart=${node.windowSettings.AzimuthStart} AzimuthEnd=${node.windowSettings.AzimuthEnd}`);
    if (node.autoTrigger ) {
        if ((sunPosition.altitudeDegrees <= 0) || (node.sunData.minAltitude && (sunPosition.altitudeDegrees < node.sunData.minAltitude))) {
            node.autoTrigger.type = 3; // Sun not on horizon
        } else if (sunPosition.azimuthDegrees <= 72) {
            node.autoTrigger.type = 4; // Sun not visible
        } else if (!sunPosition.InWindow) {
            node.autoTrigger.time = Math.min(node.autoTrigger.time, cautoTriggerTimeBeforeSun);
            node.autoTrigger.type = 5; // sun before in window
        } else if (sunPosition.InWindow) {
            if (node.smoothTime > 0) {
                node.autoTrigger.time = Math.min(node.autoTrigger.time, node.smoothTime);
                node.autoTrigger.type = 6; // sun in window (smooth time set)
            } else {
                node.autoTrigger.time = Math.min(node.autoTrigger.time, (cautoTriggerTimeSun));
                node.autoTrigger.type = 7; // sun in window
            }
        }
    }
    return sunPosition;
}

module.exports = function (RED) {
    'use strict';
    /******************************************************************************************/
    /**
     * check the oversteering data
     * @param {*} node node data
     * @param {*} msg the message object
     */
    function checkOversteer(node, msg, tempData) {
        // node.debug('checkOversteer');
        try {
            node.oversteer.isChecked = true;
            return node.oversteerData.find(el => node.positionConfig.comparePropValue(node, msg,
                {
                    value: el.operand.value,
                    type: el.operand.type,
                    callback: (result, _obj) => {
                        return ctrlLib.evalTempData(node, _obj.type, _obj.value, result, tempData);
                    }
                },
                el.operator,
                {
                    value: el.threshold.value,
                    type: el.threshold.type,
                    callback: (result, _obj) => {
                        return ctrlLib.evalTempData(node, _obj.type, _obj.value, result, tempData);
                    }
                }));
        } catch (err) {
            node.error(RED._('blind-control.errors.getOversteerData', err));
            node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        // node.debug('node.oversteerData=' + util.inspect(node.oversteerData, { colors: true, compact: 10, breakLength: Infinity }));
        return undefined;
    }
    /******************************************************************************************/
    /**
     * get the blind level from a typed input
     * @param {*} node node data
     * @param {*} type type field
     * @param {*} value value field
     * @returns blind level as number or NaN if not defined
     */
    function getBlindPosFromTI(node, msg, type, value, def) {
        // node.debug(`getBlindPosFromTI - type=${type} value=${value} def=${def} nodeData=${ util.inspect(node.nodeData, { colors: true, compact: 10, breakLength: Infinity }) }`);
        def = def || NaN;
        if (type === 'none' || type === ''|| type === 'levelND') {
            return def;
        }
        try {
            if (type === 'levelFixed') {
                const val = parseFloat(value);
                if (isNaN(val)) {
                    if (value.includes('close')) {
                        return node.nodeData.levelBottom;
                    } else if (value.includes('open')) {
                        return node.nodeData.levelTop;
                    } else if (val === '') {
                        return def;
                    }
                } else {
                    if (val < 1) {
                        return node.nodeData.levelBottom;
                    } else if (val > 99) {
                        return node.nodeData.levelTop;
                    }
                    return posPrcToAbs_(node, val / 100);
                }
                throw new Error(`unknown value "${value}" of type "${type}"` );
            }
            const res = node.positionConfig.getFloatProp(node, msg, type, value, def);
            if (node.levelReverse) {
                return getInversePos_(node, res);
            }
            return res;
        } catch (err) {
            node.error(RED._('blind-control.errors.getBlindPosData', err));
            node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        return def;
    }
    /******************************************************************************************/
    /**
     * check if a manual overwrite should be set
     * @param {*} node node data
     * @param {*} msg message object
     * @returns {boolean} true if override is active, otherwise false
     */
    function checkPosOverwrite(node, msg, dNow) {
        // node.debug(`checkPosOverwrite act=${node.nodeData.overwrite.active} `);
        let isSignificant = false;
        const exactImportance = hlp.getMsgBoolValue(msg, ['exactImportance', 'exactSignificance', 'exactPriority', 'exactPrivilege'], ['exactImporta', 'exactSignifican', 'exactPrivilege', 'exactPrio']);
        const nImportance = hlp.getMsgNumberValue(msg, ['importance', 'significance', 'prio', 'priority', 'privilege'], ['importa', 'significan', 'prio', 'alarm', 'privilege'], p => {
            if (exactImportance) {
                isSignificant = (node.nodeData.overwrite.importance === p);
            } else {
                isSignificant = (node.nodeData.overwrite.importance <= p);
            }
            ctrlLib.checkOverrideReset(node, msg, dNow, isSignificant);
            return p;
        }, () => {
            ctrlLib.checkOverrideReset(node, msg, dNow, true);
            return 0;
        });

        if (node.nodeData.overwrite.active && (node.nodeData.overwrite.importance > 0) && !isSignificant) {
            // if (node.nodeData.overwrite.active && (node.nodeData.overwrite.importance > 0) && (node.nodeData.overwrite.importance > importance)) {
            // node.debug(`overwrite exit true node.nodeData.overwrite.active=${node.nodeData.overwrite.active}, importance=${nImportance}, node.nodeData.overwrite.importance=${node.nodeData.overwrite.importance}`);
            // if active, the importance must be 0 or given with same or higher as current overwrite otherwise this will not work
            node.debug(`do not check any overwrite, importance of message ${nImportance} not matches current overwrite importance ${node.nodeData.overwrite.importance}`);
            return ctrlLib.setOverwriteReason(node);
        }
        const onlyTrigger = hlp.getMsgBoolValue(msg, ['trigger', 'noOverwrite'], ['triggerOnly', 'noOverwrite']);
        if (onlyTrigger) {
            return ctrlLib.setOverwriteReason(node);
        }
        let newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position', 'level', 'blindLevel'], ['manual', 'levelOverwrite']);
        let nExpire = hlp.getMsgNumberValue(msg, 'expire', 'expire');
        if (msg.topic && String(msg.topic).includes('noExpir')) {
            nExpire = -1;
        }
        if (!isNaN(newPos)) {
            node.debug(`needOverwrite nImportance=${nImportance} nExpire=${nExpire} newPos=${newPos}`);
            if (newPos === -1) {
                node.level.current = NaN;
                node.level.currentInverse = NaN;
            } else if (!isNaN(newPos)) {
                const allowRound = (msg.topic ? (msg.topic.includes('roundLevel') || msg.topic.includes('roundLevel')) : false);
                if (!ctrlLib.validPosition(node, newPos, allowRound)) {
                    node.error(RED._('blind-control.errors.invalid-blind-level', { pos: newPos }));
                    return false;
                }
                if (allowRound) {
                    newPos = posRound_(node, newPos);
                }
                node.debug(`overwrite newPos=${newPos}`);
                if (hlp.getMsgBoolValue(msg, 'resetOnSameAsLastValue') && (node.previousData.level === newPos)) {
                    node.debug(`resetOnSameAsLastValue active, reset overwrite and exit newPos=${newPos}`);
                    ctrlLib.posOverwriteReset(node);
                    return ctrlLib.setOverwriteReason(node);
                } else if (hlp.getMsgBoolValue(msg, 'ignoreSameValue') && (node.previousData.level === newPos)) {
                    node.debug(`overwrite exit true (ignoreSameValue), newPos=${newPos}`);
                    return ctrlLib.setOverwriteReason(node);
                }
                node.level.current = newPos;
                node.level.currentInverse = newPos;
                node.level.topic = msg.topic;
            }

            if (Number.isFinite(nExpire) || (nImportance <= 0)) {
                // will set expiring if importance is 0 or if expire is explizit defined
                node.debug(`set expiring - expire is explizit defined "${nExpire}"`);
                ctrlLib.setExpiringOverwrite(node, dNow, nExpire, 'set expiring time by message');
            } else if ((!exactImportance && (node.nodeData.overwrite.importance < nImportance)) || (!node.nodeData.overwrite.expireTs)) {
                // isSignificant
                // no expiring on importance change or no existing expiring
                node.debug(`no expire defined, using default or will not expire`);
                ctrlLib.setExpiringOverwrite(node, dNow, NaN, 'no special expire defined');
            }
            if (nImportance > 0) {
                node.nodeData.overwrite.importance = nImportance;
            }
            node.nodeData.overwrite.active = true;
        } else if (node.nodeData.overwrite.active) {
            node.debug(`overwrite active, check of nImportance=${nImportance} or nExpire=${nExpire}`);
            if (Number.isFinite(nExpire)) {
                node.debug(`set to new expiring time nExpire="${nExpire}"`);
                // set to new expiring time
                ctrlLib.setExpiringOverwrite(node, dNow, nExpire, 'set new expiring time by message');
            }
            if (nImportance > 0) {
                // set to new importance
                node.nodeData.overwrite.importance = nImportance;
            }
        }
        // node.debug(`overwrite exit node.nodeData.overwrite.active=${node.nodeData.overwrite.active};  xpire=${nExpire};  newPos=${newPos}``);
        return ctrlLib.setOverwriteReason(node);
    }

    /******************************************************************************************/
    /**
     * calculates for the blind the new level
     * @param {*} node the node data
     * @param {*} msg the message object
     * @returns the sun position object
     */
    function calcBlindSunPosition(node, msg, dNow, tempData) {
        // node.debug('calcBlindSunPosition: calculate blind position by sun');
        // sun control is active
        const sunPosition = getSunPosition_(node, dNow);
        const winterMode = 1;
        const summerMode = 2;

        if (!sunPosition.InWindow) {
            if (node.sunData.mode === winterMode) {
                node.level.current = node.nodeData.levelMin;
                node.level.currentInverse = getInversePos_(node, node.level.current);
                node.level.topic = node.sunData.topic;
                node.previousData.last.sunLevel = node.level.current;
                node.reason.code = 13;
                node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunNotInWinMin');
                node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunNotInWin');
            } else {
                node.reason.code = 8;
                node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunNotInWin');
                node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunNotInWin');
            }
            return sunPosition;
        }

        if ((node.sunData.mode === summerMode) && node.sunData.minAltitude && (sunPosition.altitudeDegrees < node.sunData.minAltitude)) {
            node.reason.code = 7;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunMinAltitude');
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunMinAltitude');
            return sunPosition;
        }

        if (node.oversteer.active) {
            const res = checkOversteer(node, msg, tempData);
            if (res) {
                node.level.current = res.blindPos;
                node.level.currentInverse = getInversePos_(node, node.level.current);
                node.previousData.last.sunLevel = node.level.current;
                node.level.topic = node.oversteer.topic;
                node.reason.code = 10;
                node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.oversteer');
                node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.oversteer');
                sunPosition.oversteer = res;
                sunPosition.oversteerAll = node.oversteerData;
                return sunPosition;
            }
            sunPosition.oversteerAll = node.oversteerData;
        }

        if (node.sunData.mode === winterMode) {
            node.level.current = node.nodeData.levelMax;
            node.level.currentInverse = getInversePos_(node, node.level.current);
            node.previousData.last.sunLevel = node.level.current;
            node.level.topic = node.sunData.topic;
            node.reason.code = 12;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunInWinMax');
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunInWinMax');
            return sunPosition;
        }

        // node.debug('node.windowSettings: ' + util.inspect(node.windowSettings, { colors: true, compact: 10 }));
        const height = Math.tan(sunPosition.altitudeRadians) * node.sunData.floorLength;
        // node.debug(`height=${height} - altitude=${sunPosition.altitudeRadians} - floorLength=${node.sunData.floorLength}`);
        if (height <= node.windowSettings.bottom) {
            node.level.current = node.nodeData.levelBottom;
            node.level.currentInverse = node.nodeData.levelTop;
            node.level.topic = node.sunData.topic;
        } else if (height >= node.windowSettings.top) {
            node.level.current = node.nodeData.levelTop;
            node.level.currentInverse = node.nodeData.levelBottom;
            node.level.topic = node.sunData.topic;
        } else {
            node.level.current = posPrcToAbs_(node, (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom));
            node.level.currentInverse = getInversePos_(node, node.level.current);
            node.level.topic = node.sunData.topic;
        }

        const delta = Math.abs(node.previousData.level - node.level.current);

        if ((node.smoothTime > 0) && (node.sunData.changeAgain > dNow.getTime())) {
            node.debug(`no change smooth - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain}`);
            node.reason.code = 11;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.smooth', { pos: getRealLevel_(node).toString()});
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.smooth', { pos: getRealLevel_(node).toString()});
            node.level.current = node.previousData.level;
            node.level.currentInverse = node.previousData.levelInverse;
            node.level.topic = node.previousData.topic;
        } else if ((node.sunData.minDelta > 0) && (delta < node.sunData.minDelta) && (node.level.current > node.nodeData.levelBottom) && (node.level.current < node.nodeData.levelTop)) {
            node.reason.code = 14;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunMinDelta', { pos: getRealLevel_(node).toString()});
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunMinDelta', { pos: getRealLevel_(node).toString() });
            node.level.current = node.previousData.level;
            node.level.currentInverse = node.previousData.levelInverse;
            node.level.topic = node.previousData.topic;
        } else {
            node.reason.code = 9;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunCtrl');
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunCtrl');
            node.sunData.changeAgain = dNow.getTime() + node.smoothTime;
            // node.debug(`set next time - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain} dNow=` + dNow.getTime());
        }
        if (node.level.current < node.nodeData.levelMin)  {
            // min
            node.debug(`${node.level.current} is below ${node.nodeData.levelMin} (min)`);
            node.reason.code = 5;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunCtrlMin', {org: node.reason.state});
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunCtrlMin', {org: node.reason.description, level:node.level.current});
            node.level.current = node.nodeData.levelMin;
            node.level.currentInverse = getInversePos_(node, node.level.current); // node.nodeData.levelMax;
        } else if (node.level.current > node.nodeData.levelMax) {
            // max
            node.debug(`${node.level.current} is above ${node.nodeData.levelMax} (max)`);
            node.reason.code = 6;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunCtrlMax', {org: node.reason.state});
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunCtrlMax', {org: node.reason.description, level:node.level.current});
            node.level.current = node.nodeData.levelMax;
            node.level.currentInverse = getInversePos_(node, node.level.current); // node.nodeData.levelMin;
        }
        node.previousData.last.sunLevel = node.level.current;
        // node.debug(`calcBlindSunPosition end pos=${node.level.current} reason=${node.reason.code} description=${node.reason.description}`);
        return sunPosition;
    }
    /******************************************************************************************/
    /**
     * check all rules and determinate the active rule
     * @param {Object} node node data
     * @param {Object} msg the message object
     * @param {Date} dNow the *current* date Object
     * @param {Object} tempData the object storing the temporary caching data
     * @returns the active rule or null
     */
    function checkRules(node, msg, dNow, tempData) {
        // node.debug('checkRules --------------------');
        const livingRuleData = {};
        const nowNr = dNow.getTime();
        const dayNr = dNow.getDay();
        const dateNr = dNow.getDate();
        const monthNr = dNow.getMonth();
        const dayId =  hlp.getDayId(dNow);
        ctrlLib.prepareRules(node, msg, tempData);
        // node.debug(`checkRules dNow=${dNow.toISOString()}, nowNr=${nowNr}, dayNr=${dayNr}, dateNr=${dateNr}, monthNr=${monthNr}, dayId=${dayId}, rules.count=${node.rules.count}, rules.lastUntil=${node.rules.lastUntil}`);

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
            // node.debug('fktCheck rule ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.conditional) {
                try {
                    if (!rule.conditon.result) {
                        return null;
                    }
                } catch (err) {
                    node.warn(RED._('node-red-contrib-sun-position/position-config:errors.getPropertyData', err));
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
            const num = ctrlLib.getRuleTimeData(node, msg, rule, dNow);
            // node.debug(`pos=${rule.pos} type=${rule.timeOpText} - ${rule.timeValue} - num=${num} - rule.timeData = ${ util.inspect(rule.timeData, { colors: true, compact: 40, breakLength: Infinity }) }`);
            if (dayId === rule.timeData.dayId && num >=0 && (cmp(num) === true)) {
                return rule;
            }
            return null;
        };

        let ruleSel = null;
        let ruleSelMin = null;
        let ruleSelMax = null;
        let ruleindex = -1;
        // node.debug('first loop count:' + node.rules.count + ' lastuntil:' + node.rules.lastUntil);
        for (let i = 0; i <= node.rules.lastUntil; ++i) {
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
                if (res.levelOp === cRuleMinOversteer) {
                    ruleSelMin = res;
                } else if (res.levelOp === cRuleMaxOversteer) {
                    ruleSelMax = res;
                } else {
                    ruleSel = res;
                    ruleindex = i;
                    if (rule.timeOp !== cRuleFrom) {
                        break;
                    }
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
                    if (res.levelOp === cRuleMinOversteer) {
                        ruleSelMin = res;
                    } else if (res.levelOp === cRuleMaxOversteer) {
                        ruleSelMax = res;
                    } else {
                        ruleSel = res;
                        break;
                    }
                }
            }
        }

        livingRuleData.hasMinimum = false;
        livingRuleData.importance = 0;
        livingRuleData.resetOverwrite = false;
        if (ruleSelMin) {
            const lev = getBlindPosFromTI(node, msg, ruleSelMin.levelType, ruleSelMin.levelValue, -1);
            // node.debug('ruleSelMin ' + lev + ' -- ' + util.inspect(ruleSelMin, { colors: true, compact: 10, breakLength: Infinity }));
            if (lev > -1) {
                livingRuleData.levelMinimum = lev;
                livingRuleData.hasMinimum = true;
                livingRuleData.minimum = {
                    id: ruleSelMin.pos,
                    name: ruleSelMin.name,
                    importance: ruleSelMin.importance,
                    resetOverwrite: ruleSelMin.resetOverwrite,
                    conditional: ruleSelMin.conditional,
                    timeLimited: ruleSelMin.timeLimited,
                    conditon: ruleSelMin.conditon,
                    time: ruleSelMin.timeData,
                    topic : ruleSelMin.topic
                };
            }
        }
        livingRuleData.hasMaximum = false;
        if (ruleSelMax) {
            const lev = getBlindPosFromTI(node, msg, ruleSelMax.levelType, ruleSelMax.levelValue, -1);
            // node.debug('ruleSelMax ' + lev + ' -- ' + util.inspect(ruleSelMax, { colors: true, compact: 10, breakLength: Infinity }) );
            if (lev > -1) {
                livingRuleData.levelMaximum = lev;
                livingRuleData.hasMaximum = true;
                livingRuleData.maximum = {
                    id: ruleSelMax.pos,
                    name: ruleSelMax.name,
                    importance: ruleSelMax.importance,
                    resetOverwrite: ruleSelMax.resetOverwrite,
                    conditional: ruleSelMax.conditional,
                    timeLimited: ruleSelMax.timeLimited,
                    conditon: ruleSelMax.conditon,
                    time: ruleSelMax.timeData,
                    topic : ruleSelMax.topic
                };
            }
        }
        const checkRuleForAT = rule => {
            if (!rule.timeLimited) {
                return;
            }
            const num = ctrlLib.getRuleTimeData(node, msg, rule, dNow);
            if (num > nowNr) {
                node.debug('autoTrigger set to rule ' + rule.pos);
                const diff = num - nowNr;
                node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                node.autoTrigger.type = 2; // next rule
            }
        };
        if (ruleSel) {
            if (node.autoTrigger) {
                if (ruleSel.timeLimited && ruleSel.timeData.ts > nowNr) {
                    node.debug('autoTrigger set to rule ' + ruleSel.pos + ' (current)');
                    const diff = ruleSel.timeData.ts - nowNr;
                    node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                    node.autoTrigger.type = 1; // current rule end
                } else {
                    for (let i = (ruleindex+1); i < node.rules.count; ++i) {
                        const rule = node.rules.data[i];
                        if (!rule.timeLimited) {
                            continue;
                        }
                        checkRuleForAT(rule);
                    }
                    // check first rule, maybe next day
                    if ((node.autoTrigger.type !== 2) && (node.rules.firstTimeLimited < node.rules.count)) {
                        checkRuleForAT(node.rules.data[node.rules.firstTimeLimited]);
                    }
                }
            }
            // ruleSel.text = '';
            // node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10, breakLength: Infinity }));
            livingRuleData.id = ruleSel.pos;
            livingRuleData.name = ruleSel.name;
            livingRuleData.importance = ruleSel.importance;
            livingRuleData.resetOverwrite = ruleSel.resetOverwrite;
            livingRuleData.code = 4;
            livingRuleData.topic = ruleSel.topic;

            if (ruleSel.levelOp === cRuleAbsolute) { // absolute rule
                livingRuleData.level = getBlindPosFromTI(node, msg, ruleSel.levelType, ruleSel.levelValue, -1);
                livingRuleData.active = (livingRuleData.level > -1);
            } else {
                livingRuleData.active = false;
                livingRuleData.level = node.nodeData.levelDefault;
            }

            livingRuleData.conditional = ruleSel.conditional;
            livingRuleData.timeLimited = ruleSel.timeLimited;
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
            livingRuleData.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.'+name, data);
            livingRuleData.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.'+name, data);
            // node.debug(`checkRules end livingRuleData=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);
            return livingRuleData;
        }
        livingRuleData.active = false;
        livingRuleData.id = -1;
        livingRuleData.level = node.nodeData.levelDefault;
        livingRuleData.topic = node.nodeData.topic;
        livingRuleData.code = 1;
        livingRuleData.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.default');
        livingRuleData.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.default');

        if (node.autoTrigger && node.rules && node.rules.count > 0) {
            // check first rule, maybe next day
            if (node.rules.firstTimeLimited < node.rules.count) {
                checkRuleForAT(node.rules.data[node.rules.firstTimeLimited]);
            }
            if (node.rules.firstTimeLimited !== node.rules.firstFrom) {
                checkRuleForAT(node.rules.data[node.rules.firstFrom]);
            }
        }
        // node.debug(`checkRules end livingRuleData=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);
        return livingRuleData;
    }
    /******************************************************************************************/
    /******************************************************************************************/
    /**
     * standard Node-Red Node handler for the sunBlindControlNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function sunBlindControlNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.outputs = Number(config.outputs || 1);
        const node = this;

        if (config.autoTrigger) {
            node.autoTrigger = {
                defaultTime : config.autoTriggerTime || 3600000 // 1h
            };
            node.autoTriggerObj = null;
        }

        node.smoothTime = (parseFloat(config.smoothTime) || -1);
        if (node.smoothTime >= 0x7FFFFFFF) {
            node.error(RED._('blind-control.errors.smoothTimeToolong', this));
            delete node.smoothTime;
        }
        node.nowarn = {};
        node.reason = {
            code : 0,
            state: '',
            description: ''
        };
        // temporary node Data
        node.levelReverse = false;
        node.storeName = config.storeName || '';
        // Retrieve the config node
        node.sunData = {
            /** Defines if the sun control is active or not */
            active: false,
            mode: Number(hlp.chkValueFilled(config.sunControlMode, 0)),
            topic: config.sunTopic,
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude, 0)),
            minDelta: Number(hlp.chkValueFilled(config.sunMinDelta, 0)),
            changeAgain: 0
        };
        node.sunData.modeMax = node.sunData.mode;
        node.windowSettings = {
            /** The top of the window */
            top: Number(config.windowTop),
            /** The bottom of the window */
            bottom: Number(config.windowBottom),
            /** the orientation angle to the geographical north */
            AzimuthStart: angleNorm_(Number(hlp.chkValueFilled(config.windowAzimuthStart, 0))),
            /** an offset for the angle clockwise offset */
            AzimuthEnd: angleNorm_(Number(hlp.chkValueFilled(config.windowAzimuthEnd, 0)))
        };
        node.nodeData = {
            /** The Level of the window */
            levelTop: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            levelBottom: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            increment: Number(hlp.chkValueFilled(config.blindIncrement, 1)),
            levelDefault: NaN,
            levelMin: NaN,
            levelMax: NaN,
            topic: config.topic,
            /** The override settings */
            overwrite: {
                active: false,
                expireDuration: parseFloat(hlp.chkValueFilled(config.overwriteExpire, NaN)),
                importance: 0
            }
        };

        if (node.nodeData.levelTop < node.nodeData.levelBottom) {
            const tmp = node.nodeData.levelBottom;
            node.nodeData.levelBottom = node.nodeData.levelTop;
            node.nodeData.levelTop = tmp;
            node.levelReverse = true;
        }

        node.nodeData.levelDefault = getBlindPosFromTI(node, undefined, config.blindPosDefaultType, config.blindPosDefault, node.nodeData.levelTop);
        node.nodeData.levelMin = getBlindPosFromTI(node, undefined, config.blindPosMinType, config.blindPosMin, node.nodeData.levelBottom);
        node.nodeData.levelMax = getBlindPosFromTI(node, undefined, config.blindPosMaxType, config.blindPosMax, node.nodeData.levelTop);
        node.oversteer = {
            active: (typeof config.oversteerValueType !== 'undefined') && (config.oversteerValueType !== 'none'),
            topic: config.oversteerTopic || config.sunTopic,
            isChecked: false
        };
        node.oversteerData = [];
        if (node.oversteer.active) {
            node.oversteerData.push({
                operand: {
                    value: config.oversteerValue || '',
                    type: config.oversteerValueType || 'none'
                },
                operator: config.oversteerCompare,
                threshold: {
                    value: config.oversteerThreshold || '',
                    type: config.oversteerThresholdType
                },
                blindPos: getBlindPosFromTI(node, undefined, config.oversteerBlindPosType, config.oversteerBlindPos, node.nodeData.levelTop)
            });
            if ((typeof config.oversteer2ValueType !== 'undefined') && (config.oversteer2ValueType !== 'none')) {
                node.oversteerData.push({
                    operand: {
                        value: config.oversteer2Value || '',
                        type: config.oversteer2ValueType || 'none'
                    },
                    operator: config.oversteer2Compare,
                    threshold: {
                        value: config.oversteer2Threshold || '',
                        type: config.oversteer2ThresholdType
                    },
                    blindPos: getBlindPosFromTI(node, undefined, config.oversteer2BlindPosType, config.oversteer2BlindPos, node.nodeData.levelTop)
                });
            }
            if ((typeof config.oversteer3ValueType !== 'undefined') && (config.oversteer3ValueType !== 'none')) {
                node.oversteerData.push({
                    operand: {
                        value: config.oversteer3Value || '',
                        type: config.oversteer3ValueType || 'none'
                    },
                    operator: config.oversteer3Compare,
                    threshold: {
                        value: config.oversteer3Threshold || '',
                        type: config.oversteer3ThresholdType
                    },
                    blindPos: getBlindPosFromTI(node, undefined, config.oversteer3BlindPosType, config.oversteer3BlindPos, node.nodeData.levelTop)
                });
            }
            node.oversteerData.forEach( (val, _index) => {
                if (node.positionConfig && val.operand.type === 'jsonata') {
                    try {
                        val.operand.expr = node.positionConfig.getJSONataExpression(node, val.operand.value);
                    } catch (err) {
                        node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                        val.operand.expr = null;
                    }
                }
            });
        }

        node.rules = {
            data: config.rules || []
        };
        node.level = {
            current: NaN, // unknown
            currentInverse: NaN
        };
        node.previousData = {
            level: NaN, // unknown
            reasonCode: -1,
            usedRule: NaN,
            last : {}
        };

        /**
         * set the state of the node
         */
        this.setState = blindCtrl => {
            let code = node.reason.code;
            let shape = 'ring';
            let fill = 'yellow';
            if (code === 10 && node.previousData) { // smooth;
                code = node.previousData.reasonCode;
            }

            if (blindCtrl.level === node.nodeData.levelTop) {
                shape = 'dot';
            }
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

            node.reason.stateComplete = (isNaN(blindCtrl.level)) ? node.reason.state : blindCtrl.level.toString() + ' - ' + node.reason.state;
            node.status({
                fill,
                shape,
                text: node.reason.stateComplete
            });
        };

        /**
         * handles the input of a message object to the node
         */
        this.on('input', function (msg, send, done) {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) {if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                node.debug(`---------  blind-control - input msg.topic=${msg.topic} msg.payload=${msg.payload} msg.ts=${msg.ts}`);
                if (!this.positionConfig) {
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'Node not properly configured!!'
                    });
                    done(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'), msg);
                    return null;
                }

                // allow to overwrite settings by incomming message
                const newMode = hlp.getMsgNumberValue(msg, ['mode'], ['setMode']);
                if (Number.isFinite(newMode) && newMode >= 0 && newMode <= node.sunData.modeMax) {
                    node.debug(`set mode from ${node.sunData.mode} to ${newMode}`);
                    node.sunData.mode = newMode;
                }
                if (msg.topic && (typeof msg.topic === 'string') && msg.topic.startsWith('set')) {
                    switch (msg.topic) {
                        /* Blind Settings */
                        case 'setBlindSettingsTop':
                            node.nodeData.levelTop = parseFloat(msg.payload) || node.nodeData.levelTop;
                            break;
                        case 'setBlindSettingsBottom':
                            node.nodeData.levelBottom = parseFloat(msg.payload) || node.nodeData.levelBottom;
                            break;
                        case 'setBlindSettingsIncrement':
                            node.nodeData.increment = parseFloat(msg.payload) || node.nodeData.increment;
                            break;
                        /* Default Settings */
                        case 'setBlindSettingsLevel':
                            node.nodeData.levelDefault = parseFloat(msg.payload) || node.nodeData.levelDefault;
                            break;
                        case 'setSettingsTopic':
                            node.nodeData.topic = msg.payload || node.nodeData.topic;
                            break;
                        /* Window Settings */
                        case 'setWindowSettingsTop':
                            node.windowSettings.top = parseFloat(msg.payload) || node.windowSettings.top;
                            break;
                        case 'setWindowSettingsBottom':
                            node.windowSettings.bottom = parseFloat(msg.payload) || node.windowSettings.bottom;
                            break;
                        case 'setWindowSettingsAzimuthStart':
                            node.windowSettings.AzimuthStart = parseFloat(msg.payload) || node.windowSettings.AzimuthStart;
                            break;
                        case 'setWindowSettingsAzimuthEnd':
                            node.windowSettings.AzimuthEnd = parseFloat(msg.payload) || node.windowSettings.AzimuthEnd;
                            break;
                        /* sun Control Settings */
                        case 'setSunDataTopic':
                            node.sunData.topic = msg.payload || node.sunData.topic;
                            break;
                        case 'setSunDataFloorLength':
                            node.sunData.floorLength = parseFloat(msg.payload) || node.sunData.floorLength;
                            break;
                        case 'setSunDataMinAltitude':
                            node.sunData.minAltitude = parseFloat(msg.payload) || node.sunData.minAltitude;
                            break;
                        /* minimum changes Settings */
                        case 'setSunDataMinDelta':
                            node.sunData.minDelta = parseFloat(msg.payload) || node.sunData.minDelta;
                            break;
                        case 'setSmoothTime':
                            node.smoothTime = parseFloat(msg.payload) || node.smoothTime;
                            break;
                        /* advanced Settings */
                        case 'setAutoTriggerTime':
                            node.autoTrigger.defaultTime = parseFloat(msg.payload) || node.autoTrigger.defaultTime;
                            break;
                        case 'setStoreName':
                            node.storeName = msg.payload || node.storeName;
                            break;
                        default:
                            break;
                    }
                    if (node.nodeData.levelTop < node.nodeData.levelBottom) {
                        const tmp = node.nodeData.levelBottom;
                        node.nodeData.levelBottom = node.nodeData.levelTop;
                        node.nodeData.levelTop = tmp;
                        node.levelReverse = true;
                    }
                }

                // initialize
                node.nowarn = {};
                const tempData = node.context().get('cacheData',node.storeName) || {};
                if (!isNaN(node.level.current)) {
                    node.previousData.level = node.level.current;
                    node.previousData.levelInverse = node.level.currentInverse;
                    node.previousData.topic = node.level.topic;
                    node.previousData.reasonCode = node.reason.code;
                    node.previousData.reasonState = node.reason.state;
                    node.previousData.reasonDescription = node.reason.description;
                }
                node.oversteer.isChecked = false;
                node.reason.code = NaN;
                node.level.topic = '';
                const dNow = hlp.getNowTimeStamp(node, msg);
                if (node.autoTrigger) {
                    node.autoTrigger.time = node.autoTrigger.defaultTime;
                    node.autoTrigger.type = 0; // default time
                }
                const blindCtrl = {
                    reason : node.reason,
                    blind: node.nodeData,
                    autoTrigger : node.autoTrigger,
                    lastEvaluated: node.previousData.last,
                    name: node.name || node.id,
                    id: node.id
                };
                let ruleId = -1;

                // check for manual overwrite
                let overwrite = checkPosOverwrite(node, msg, dNow);
                if (!overwrite || node.rules.canResetOverwrite || (node.rules.maxImportance > 0 && node.rules.maxImportance > node.nodeData.overwrite.importance)) {
                    // calc times:
                    blindCtrl.rule = checkRules(node, msg, dNow, tempData);
                    node.previousData.last.ruleId = blindCtrl.rule.id;
                    node.previousData.last.ruleLevel = blindCtrl.rule.level;
                    node.previousData.last.ruleTopic = blindCtrl.rule.topic;

                    node.debug(`overwrite=${overwrite}, node.rules.maxImportance=${node.rules.maxImportance}, node.nodeData.overwrite.importance=${node.nodeData.overwrite.importance}, blindCtrl.rule.importance=${blindCtrl.rule.importance}`);
                    if (overwrite && blindCtrl.rule.resetOverwrite && blindCtrl.rule.id !== node.previousData.usedRule) {
                        ctrlLib.posOverwriteReset(node);
                        overwrite = false;
                    }

                    if (!overwrite || blindCtrl.rule.importance > node.nodeData.overwrite.importance) {
                        ruleId = blindCtrl.rule.id;
                        node.level.current = blindCtrl.rule.level;
                        node.level.currentInverse = getInversePos_(node, blindCtrl.rule.level);
                        node.level.topic = blindCtrl.rule.topic;
                        node.reason.code = blindCtrl.rule.code;
                        node.reason.state = blindCtrl.rule.state;
                        node.reason.description = blindCtrl.rule.description;
                        if (!blindCtrl.rule.active && (node.sunData.mode > 0)) {
                            // calc sun position:
                            blindCtrl.sunPosition = calcBlindSunPosition(node, msg, dNow, tempData);
                        }
                        if (blindCtrl.rule.hasMinimum && (node.level.current < blindCtrl.rule.levelMinimum)) {
                            node.debug(`${node.level.current} is below rule minimum ${blindCtrl.rule.levelMinimum}`);
                            node.reason.code = 15;
                            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.ruleMin', { org: node.reason.state, number: blindCtrl.rule.minimum.id, name: blindCtrl.rule.minimum.name });
                            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.ruleMin',
                                { org: node.reason.description, level: getRealLevel_(node), number: blindCtrl.rule.minimum.id, name: blindCtrl.rule.minimum.name  });
                            node.level.current = blindCtrl.rule.levelMinimum;
                            node.level.currentInverse = getInversePos_(node, node.level.current);
                        } else if (blindCtrl.rule.hasMaximum && (node.level.current > blindCtrl.rule.levelMaximum)) {
                            node.debug(`${node.level.current} is above rule maximum ${blindCtrl.rule.levelMaximum}`);
                            node.reason.code = 26;
                            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.ruleMax', { org: node.reason.state, number: blindCtrl.rule.maximum.id, name: blindCtrl.rule.maximum.name });
                            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.ruleMax',
                                { org: node.reason.description, level: getRealLevel_(node), number: blindCtrl.rule.maximum.id, name: blindCtrl.rule.maximum.name });
                            node.level.current = blindCtrl.rule.levelMaximum;
                            node.level.currentInverse = getInversePos_(node, node.level.current);
                        }
                        if (node.level.current < node.nodeData.levelBottom) {
                            node.debug(`${node.level.current} is below ${node.nodeData.levelBottom}`);
                            node.level.current = node.nodeData.levelBottom;
                            node.level.currentInverse = node.nodeData.levelTop;
                        }
                        if (node.level.current > node.nodeData.levelTop) {
                            node.debug(`${node.level.current} is above ${node.nodeData.levelBottom}`);
                            node.level.current = node.nodeData.levelTop;
                            node.level.currentInverse = node.nodeData.levelBottom;
                        }
                        node.previousData.last.level = node.level.current;
                        node.previousData.last.topic = node.level.topic;
                    }
                }

                if (node.oversteer.active && !node.oversteer.isChecked) {
                    node.oversteerData.forEach(el => {
                        node.positionConfig.getPropValue(node, msg, {
                            type: el.valueType,
                            value: el.value,
                            callback: (result, _obj) => {
                                if (result !== null && typeof result !== 'undefined') {
                                    tempData[_obj.type + '.' + _obj.value] = result;
                                }
                            },
                            operator: el.operator
                        });
                    });
                }

                if (node.levelReverse) {
                    blindCtrl.level = isNaN(node.level.currentInverse) ? node.previousData.levelInverse : node.level.currentInverse;
                    blindCtrl.levelInverse = isNaN(node.level.current) ? node.previousData.level : node.level.current;
                } else {
                    blindCtrl.level = isNaN(node.level.current) ? node.previousData.level : node.level.current;
                    blindCtrl.levelInverse = isNaN(node.level.currentInverse) ? node.previousData.levelInverse : node.level.currentInverse;
                }

                if (node.startDelayTimeOut) {
                    node.reason.code = NaN;
                    node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.startDelay', {date:node.positionConfig.toTimeString(node.startDelayTimeOut)});
                    node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.startDelay', {dateISO:node.startDelayTimeOut.toISOString()});
                }
                node.setState(blindCtrl);

                let topic = node.level.topic || node.nodeData.topic || msg.topic;
                if (topic) {
                    const topicAttrs = {
                        name: blindCtrl.name,
                        id: blindCtrl.id,
                        level: blindCtrl.level,
                        levelInverse: blindCtrl.levelInverse,
                        code: node.reason.code,
                        state: node.reason.state,
                        rule: ruleId,
                        mode: node.sunData.mode,
                        newtopic: topic,
                        topic: msg.topic,
                        payload: msg.payload
                    };
                    topic = hlp.topicReplace(topic, topicAttrs);
                }

                if ((!isNaN(node.level.current)) &&
                    (!isNaN(node.reason.code)) &&
                    ((node.level.current !== node.previousData.level) ||
                    (node.reason.code !== node.previousData.reasonCode) ||
                    (ruleId !== node.previousData.usedRule))) {
                    msg.payload = blindCtrl.level;
                    msg.topic =  topic;
                    msg.blindCtrl = blindCtrl;
                    if (node.outputs > 1) {
                        send([msg, { topic, payload: blindCtrl }]);
                    } else {
                        send([msg, null]);
                    }
                } else if (node.outputs > 1) {
                    send([null, { topic, payload: blindCtrl }]);
                }
                node.previousData.usedRule = ruleId;
                node.context().set('cacheData', tempData, node.storeName);
                if (node.autoTrigger) {
                    node.debug('------------- autoTrigger ---------------- ' + node.autoTrigger.time + ' - ' + node.autoTrigger.type);
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
        try {
            ctrlLib.initializeCtrl(RED, node, config);
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

    RED.nodes.registerType('blind-control', sunBlindControlNode);
};