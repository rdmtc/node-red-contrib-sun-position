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
 * blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const ctrlLib = require(path.join(__dirname, '/lib/timeControlHelper.js'));
const util = require('util');
const clonedeep = require('lodash.clonedeep');
const isEqual = require('lodash.isequal');

const cRuleUntil = 0;
const cRuleFrom = 1;
const cRule = {
    levelAbsolute : 0,
    levelMinOversteer : 1,  // ⭳❗ minimum (oversteer)
    levelMaxOversteer : 2, // ⭱️❗ maximum (oversteer)
    slatOversteer : 5,
    topicOversteer : 8,
    off : 9
};
const cautoTriggerTimeBeforeSun = 10 * 60000; // 10 min
const cautoTriggerTimeSun = 5 * 60000; // 5 min
const cWinterMode = 1;
const cMinimizeMode = 3;
const cSummerMode = 16;
const cRuleDefault = -1;
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
 * check if angle is between start and end
 */
function angleBetween_(angle, start, end) {
    if(start<end) return start<=angle && angle<=end;
    return               start<=angle || angle<=end;
}

/******************************************************************************************/
module.exports = function (RED) {
    'use strict';
    /******************************************************************************************/
    /**
     * check the oversteering data
     * @param {*} node node data
     * @param {*} msg the message object
     * @param {Object} tempData the temporary data holder object
     * @param {ITimeObject} oNow the now Object
     */
    function checkOversteer(node, msg, tempData, sunPosition, oNow) {
        // node.debug(`checkOversteer ${util.inspect(node.oversteers, { colors: true, compact: 10, breakLength: Infinity })}`);
        try {
            node.oversteer.isChecked = true;
            return node.oversteers.find(el => ((el.mode === 0 || el.mode === node.sunData.mode) && (!el.onlySunInWindow || sunPosition.InWindow) &&
                node.positionConfig.comparePropValue(node, msg,
                    {
                        value: el.value,
                        type: el.valueType,
                        expr: el.valueExpr,
                        callback: (result, _obj) => {
                            return ctrlLib.evalTempData(node, _obj.type, _obj.value, result, tempData);
                        }
                    },
                    el.operator,
                    {
                        value: el.threshold,
                        type: el.thresholdType,
                        callback: (result, _obj) => {
                            return ctrlLib.evalTempData(node, _obj.type, _obj.value, result, tempData);
                        }
                    }, false, oNow.now)));
        } catch (err) {
            node.error(RED._('blind-control.errors.getOversteerData', err));
            node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        // node.debug('node.oversteers=' + util.inspect(node.oversteers, { colors: true, compact: 10, breakLength: Infinity }));
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
     * @param {ITimeObject} oNow Now Date object
     * @returns {boolean} true if override is active, otherwise false
     */
    function checkPosOverwrite(node, msg, oNow) {
        // node.debug(`checkPosOverwrite act=${node.nodeData.overwrite.active} `);
        let isSignificant = false;
        const exactImportance = hlp.getMsgBoolValue(msg, ['exactImportance', 'exactSignificance', 'exactPriority', 'exactPrivilege'], ['exactImporta', 'exactSignifican', 'exactPrivilege', 'exactPrio']);
        const nImportance = hlp.getMsgNumberValue(msg, ['importance', 'significance', 'prio', 'priority', 'privilege'], ['importa', 'significan', 'prio', 'alarm', 'privilege'], p => {
            if (exactImportance) {
                isSignificant = (node.nodeData.overwrite.importance === p);
            } else {
                isSignificant = (node.nodeData.overwrite.importance <= p);
            }
            ctrlLib.checkOverrideReset(node, msg, oNow, isSignificant);
            return p;
        }, () => {
            ctrlLib.checkOverrideReset(node, msg, oNow, true);
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
        if (msg.topic && String(msg.topic).includes('noExpir')) { // hlp.getMsgTopicContains(msg, 'noExpir')) {
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
                if (typeof msg.slat !== 'undefined' && msg.slat !== null) {
                    node.level.slat = msg.slat;
                } else if (typeof msg.blindSlat !== 'undefined' && msg.blindSlat !== null) {
                    node.level.slat = msg.blindSlat;
                } else if (typeof msg.topic === 'string' && msg.topic.includes('slatOverwrite')) {
                    node.level.slat = msg.payload;
                } else {
                    node.level.slat = node.positionConfig.getPropValue(node, msg, node.nodeData.slat, false, oNow.now);
                }
            }

            if (Number.isFinite(nExpire) || (nImportance <= 0)) {
                // will set expiring if importance is 0 or if expire is explicit defined
                node.debug(`set expiring - expire is explicit defined "${nExpire}"`);
                ctrlLib.setExpiringOverwrite(node, oNow, nExpire, 'set expiring time by message');
            } else if ((!exactImportance && (node.nodeData.overwrite.importance < nImportance)) || (!node.nodeData.overwrite.expireTs)) {
                // isSignificant
                // no expiring on importance change or no existing expiring
                node.debug(`no expire defined, using default or will not expire`);
                ctrlLib.setExpiringOverwrite(node, oNow, NaN, 'no special expire defined');
            }
            if (nImportance > 0) {
                node.nodeData.overwrite.importance = nImportance;
            }
            node.nodeData.overwrite.active = true;
            node.context().set('overwrite', node.nodeData.overwrite, node.contextStore);
        } else if (node.nodeData.overwrite.active) {
            node.debug(`overwrite active, check of nImportance=${nImportance} or nExpire=${nExpire}`);
            if (Number.isFinite(nExpire)) {
                node.debug(`set to new expiring time nExpire="${nExpire}"`);
                // set to new expiring time
                ctrlLib.setExpiringOverwrite(node, oNow, nExpire, 'set new expiring time by message');
            }
            if (nImportance > 0) {
                // set to new importance
                node.nodeData.overwrite.importance = nImportance;
            }
            node.context().set('overwrite', node.nodeData.overwrite, node.contextStore);
        }
        // node.debug(`overwrite exit node.nodeData.overwrite.active=${node.nodeData.overwrite.active}; expire=${nExpire};  newPos=${newPos}`);
        return ctrlLib.setOverwriteReason(node);
    }

    /******************************************************************************************/
    /**
     * calculates for the blind the new level
     * @param {*} node the node data
     * @param {*} msg the message object
     * @param {ITimeObject} oNow the now Object
     * @param {Object} tempData the temporary data holder object
     * @returns the sun position object
     */
    function calcBlindSunPosition(node, msg, oNow, tempData) {
        // node.debug('calcBlindSunPosition: calculate blind position by sun');
        // sun control is active
        const sunPosition = node.positionConfig.getSunCalc(oNow.now, false, false);
        // node.debug('sunPosition: ' + util.inspect(sunPosition, { colors: true, compact: 10, breakLength: Infinity }));

        const azimuthStart = node.positionConfig.getFloatProp(node, msg, node.windowSettings.azimuthStartType, node.windowSettings.azimuthStart, NaN, (result, _obj) => {
            if (result !== null && typeof result !== 'undefined') {
                tempData[_obj.type + '.' + _obj.value] = result;
            }
        }, true, oNow.now);
        const azimuthEnd = node.positionConfig.getFloatProp(node, msg, node.windowSettings.azimuthEndType, node.windowSettings.azimuthEnd, NaN, (result, _obj) => {
            if (result !== null && typeof result !== 'undefined') {
                tempData[_obj.type + '.' + _obj.value] = result;
            }
        }, true, oNow.now);

        sunPosition.InWindow = angleBetween_(sunPosition.azimuthDegrees, azimuthStart, azimuthEnd);
        // node.debug(`sunPosition: InWindow=${sunPosition.InWindow} azimuthDegrees=${sunPosition.azimuthDegrees} AzimuthStart=${azimuthStart} AzimuthEnd=${azimuthEnd}`);
        if (node.autoTrigger ) {
            if ((sunPosition.altitudeDegrees <= 0)) {
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

        if (node.oversteer.active) {
            const res = checkOversteer(node, msg, tempData, sunPosition, oNow);
            if (res) {
                node.level.current = getBlindPosFromTI(node, undefined, res.blindPos.type, res.blindPos.value, node.nodeData.levelTop);
                node.level.currentInverse = getInversePos_(node, node.level.current);
                node.level.slat = node.positionConfig.getPropValue(node, msg, res.slatPos, false, oNow.now);
                node.level.topic = node.oversteer.topic;
                node.previousData.last.sunLevel = node.level.current;
                node.reason.code = 10;
                node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.oversteer', { pos: res.pos+1 });
                node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.oversteer', { pos: res.pos+1 });
                sunPosition.oversteer = res;
                sunPosition.oversteerAll = node.oversteers;
                return sunPosition;
            }
            sunPosition.oversteerAll = node.oversteers;
        }

        // const summerMode = 2;
        if (!sunPosition.InWindow) {
            if (node.sunData.mode === cWinterMode) {
                node.level.current = node.nodeData.levelMin;
                node.level.currentInverse = getInversePos_(node, node.level.current);
                node.level.topic = node.sunData.topic;
                node.level.slat = node.positionConfig.getPropValue(node, msg, node.sunData.slat, false, oNow.now);
                node.previousData.last.sunLevel = node.level.current;
                node.reason.code = 13;
                node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunNotInWinMin');
                node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunNotInWinMin');
            } else if (node.sunData.mode === cMinimizeMode) {
                node.level.current = node.nodeData.levelMax;
                node.level.currentInverse = getInversePos_(node, node.level.current);
                node.level.topic = node.sunData.topic;
                node.level.slat = node.positionConfig.getPropValue(node, msg, node.sunData.slat, false, oNow.now);
                node.previousData.last.sunLevel = node.level.current;
                node.reason.code = 13;
                node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunNotInWinMax');
                node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunNotInWinMax');
            } else {
                node.reason.code = 8;
                node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunNotInWin');
                node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunNotInWin');
            }
            return sunPosition;
        }

        if (node.sunData.mode === cWinterMode) {
            node.level.current = node.nodeData.levelMax;
            node.level.currentInverse = getInversePos_(node, node.level.current);
            node.level.slat = node.positionConfig.getPropValue(node, msg, node.sunData.slat, false, oNow.now);
            node.level.topic = node.sunData.topic;
            node.previousData.last.sunLevel = node.level.current;
            node.reason.code = 12;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunInWinMax');
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunInWinMax');
            return sunPosition;
        } else if (node.sunData.mode === cMinimizeMode) {
            node.level.current = node.nodeData.levelMin;
            node.level.currentInverse = getInversePos_(node, node.level.current);
            node.level.slat = node.positionConfig.getPropValue(node, msg, node.sunData.slat, false, oNow.now);
            node.level.topic = node.sunData.topic;
            node.previousData.last.sunLevel = node.level.current;
            node.reason.code = 12;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunInWinMin');
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunInWinMin');
            return sunPosition;
        }

        const floorLength = node.positionConfig.getFloatProp(node, msg, node.sunData.floorLengthType, node.sunData.floorLength, NaN, (result, _obj) => {
            if (result !== null && typeof result !== 'undefined') {
                tempData[_obj.type + '.' + _obj.value] = result;
            }
        }, true, oNow.now);
        const wTop = node.positionConfig.getFloatProp(node, msg, node.windowSettings.topType, node.windowSettings.top, NaN, (result, _obj) => {
            if (result !== null && typeof result !== 'undefined') {
                tempData[_obj.type + '.' + _obj.value] = result;
            }
        }, true, oNow.now);
        const wBottom = node.positionConfig.getFloatProp(node, msg, node.windowSettings.bottomType, node.windowSettings.bottom, NaN, (result, _obj) => {
            if (result !== null && typeof result !== 'undefined') {
                tempData[_obj.type + '.' + _obj.value] = result;
            }
        }, true, oNow.now);

        const height = Math.tan(sunPosition.altitudeRadians) * floorLength;
        // node.debug(`height=${height} - altitude=${sunPosition.altitudeRadians} - floorLength=${floorLength}`);
        if (height <= wBottom) {
            node.level.current = node.nodeData.levelBottom;
            node.level.currentInverse = node.nodeData.levelTop;
        } else if (height >= wTop) {
            node.level.current = node.nodeData.levelTop;
            node.level.currentInverse = node.nodeData.levelBottom;
        } else {
            const levelPercent = (height - wBottom) / (wTop - wBottom);
            node.level.current = posRound_(node, ((node.nodeData.levelTopSun - node.nodeData.levelBottomSun) * levelPercent) + node.nodeData.levelBottomSun);
            node.level.currentInverse = getInversePos_(node, node.level.current);
        }
        node.level.slat = node.positionConfig.getPropValue(node, msg, node.sunData.slat, false, oNow.now);
        node.level.topic = node.sunData.topic;

        const delta = Math.abs(node.previousData.level - node.level.current);

        if ((node.smoothTime > 0) && (node.sunData.changeAgain > oNow.nowNr)) {
            node.debug(`no change smooth - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain}`);
            node.reason.code = 11;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.smooth', { pos: getRealLevel_(node).toString()});
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.smooth', { pos: getRealLevel_(node).toString()});
            node.level.current = node.previousData.level;
            node.level.currentInverse = node.previousData.levelInverse;
            node.level.slat = node.previousData.slat;
            node.level.topic = node.previousData.topic;
        } else if ((node.sunData.minDelta > 0) && (delta < node.sunData.minDelta) && (node.level.current > node.nodeData.levelBottom) && (node.level.current < node.nodeData.levelTop)) {
            node.reason.code = 14;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunMinDelta', { pos: getRealLevel_(node).toString()});
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunMinDelta', { pos: getRealLevel_(node).toString() });
            node.level.current = node.previousData.level;
            node.level.currentInverse = node.previousData.levelInverse;
            node.level.slat = node.previousData.slat;
            node.level.topic = node.previousData.topic;
        } else {
            node.reason.code = 9;
            node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.sunCtrl');
            node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.sunCtrl');
            node.sunData.changeAgain = oNow.nowNr + node.smoothTime;
            // node.debug(`set next time - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain} nowNr=` + oNow.nowNr);
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
     * changes the rule settings
     * @param {Object} node node data
     * @param {number} [rulePos] the position of the rule which should be changed
     * @param {string} [ruleName] the name of the rule which should be changed
     * @param {Object} ruleData the properties of the rule which should be changed
     */
    function changeRules(node, rulePos, ruleName, ruleData) {
        // node.debug(`changeRules: ${ node.rules.count } ruleData:' ${util.inspect(ruleData, {colors:true, compact:10})}`);
        for (let i = 0; i <= node.rules.count; ++i) {
            const rule = node.rules[i];
            if (((typeof rulePos !== 'undefined') && rule.pos === rulePos) ||
                ((typeof ruleName !== 'undefined') && rule.name === ruleName)) {
                node.rules[i] = Object.assign(node.rules[i], ruleData);
            }
        }
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
        ctrlLib.prepareRules(node, msg, tempData, oNow.now);
        // node.debug(`checkRules rules.count=${node.rules.count}, rules.lastUntil=${node.rules.lastUntil}, oNow=${util.inspect(oNow, {colors:true, compact:10})}`);

        let ruleSel = null;
        let ruleSlatOvs = null;
        let ruleTopicOvs = null;
        let ruleSelMin = null;
        let ruleSelMax = null;
        let ruleindex = -1;
        // node.debug(`first loop count:${ node.rules.count } lastuntil:${ node.rules.lastUntil}`);
        for (let i = 0; i <= node.rules.lastUntil; ++i) {
            const rule = node.rules.data[i];
            if (!rule.enabled) { continue; }
            if (rule.time && rule.time.operator === cRuleFrom) { continue; }
            const res = ctrlLib.compareRules(node, msg, rule, r => (r >= oNow.nowNr), oNow);
            if (res) {
                // node.debug(`1. ruleSel ${rule.name} (${rule.pos}) level.operator=${ res.level.operator }`);
                if (res.level.operator === cRule.slatOversteer) {
                    ruleSlatOvs = res;
                } else if (res.level.operator === cRule.topicOversteer) {
                    ruleTopicOvs = res;
                } else if (res.level.operator === cRule.levelMinOversteer) {
                    ruleSelMin = res;
                } else if (res.level.operator === cRule.levelMaxOversteer) {
                    ruleSelMax = res;
                } else {
                    ruleSel = res;
                    ruleindex = i;
                    break;
                }
            }
        }

        if (!ruleSel || (ruleSel.time && ruleSel.time.operator === cRuleFrom) ) {
            // node.debug('--------- starting second loop ' + node.rules.count);
            for (let i = (node.rules.count - 1); i >= 0; --i) {
                const rule = node.rules.data[i];
                // node.debug(`rule ${rule.name} (${rule.pos}) enabled=${rule.enabled} operator=${rule.time.operator} noUntil=${rule.time.operator !== cRuleUntil} data=${util.inspect(rule, {colors:true, compact:10, breakLength: Infinity })}`);
                if (!rule.enabled) { continue; }
                if (rule.time && rule.time.operator === cRuleUntil) { continue; } // - From: timeOp === cRuleFrom
                const res = ctrlLib.compareRules(node, msg, rule, r => (r <= oNow.nowNr), oNow);
                if (res) {
                    // node.debug(`2. ruleSel ${rule.name} (${rule.pos}) data=${ util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }) }`);
                    if (res.level.operator === cRule.slatOversteer) {
                        ruleSlatOvs = res;
                    } else if (res.level.operator === cRule.topicOversteer) {
                        ruleTopicOvs = res;
                    } else if (res.level.operator === cRule.levelMinOversteer) {
                        ruleSelMin = res;
                    } else if (res.level.operator === cRule.levelMaxOversteer) {
                        ruleSelMax = res;
                    } else {
                        ruleSel = res;
                        break;
                    }
                }
            }
        }

        livingRuleData.importance = 0;
        livingRuleData.resetOverwrite = false;
        if (ruleTopicOvs) {
            livingRuleData.topicOversteer = {
                id: ruleTopicOvs.pos,
                name: ruleTopicOvs.name,
                conditional: ruleTopicOvs.conditional,
                timeLimited: (!!ruleTopicOvs.time),
                conditon: ruleTopicOvs.conditon,
                time: ruleTopicOvs.timeData,
                importance: ruleTopicOvs.importance,
                topic : ruleTopicOvs.topic || ''
            };
        }
        if (ruleSlatOvs) {
            livingRuleData.slatOversteer = {
                id: ruleSlatOvs.pos,
                name: ruleSlatOvs.name,
                conditional: ruleSlatOvs.conditional,
                timeLimited: (!!ruleSlatOvs.time),
                conditon: ruleSlatOvs.conditon,
                time: ruleSlatOvs.timeData,
                slat: node.positionConfig.getPropValue(node, msg, ruleSlatOvs.slat, false, oNow.now),
                importance: ruleSlatOvs.importance
            };
        }
        livingRuleData.hasMinimum = false;
        if (ruleSelMin) {
            const lev = getBlindPosFromTI(node, msg, ruleSelMin.level.type, ruleSelMin.level.value, -1);
            // node.debug('ruleSelMin ' + lev + ' -- ' + util.inspect(ruleSelMin, { colors: true, compact: 10, breakLength: Infinity }));
            if (lev > -1) {
                livingRuleData.levelMinimum = lev;
                livingRuleData.hasMinimum = true;
                livingRuleData.minimum = {
                    id: ruleSelMin.pos,
                    name: ruleSelMin.name,
                    conditional: ruleSelMin.conditional,
                    timeLimited: (!!ruleSelMin.time),
                    conditon: ruleSelMin.conditon,
                    time: ruleSelMin.timeData
                    // slat: node.positionConfig.getPropValue(node, msg, ruleSelMin.slat, false, oNow.now)
                    // importance: ruleSelMin.importance,
                    // resetOverwrite: ruleSelMin.resetOverwrite,
                    // topic : ruleSelMin.topic
                };
            }
        }
        livingRuleData.hasMaximum = false;
        if (ruleSelMax) {
            const lev = getBlindPosFromTI(node, msg, ruleSelMax.level.type, ruleSelMax.level.value, -1);
            // node.debug('ruleSelMax ' + lev + ' -- ' + util.inspect(ruleSelMax, { colors: true, compact: 10, breakLength: Infinity }) );
            if (lev > -1) {
                livingRuleData.levelMaximum = lev;
                livingRuleData.hasMaximum = true;
                livingRuleData.maximum = {
                    id: ruleSelMax.pos,
                    name: ruleSelMax.name,
                    conditional: ruleSelMax.conditional,
                    timeLimited: (!!ruleSelMax.time),
                    conditon: ruleSelMax.conditon,
                    time: ruleSelMax.timeData
                    // slat: node.positionConfig.getPropValue(node, msg, ruleSelMax.slat, false, oNow.now)
                    // importance: ruleSelMax.importance,
                    // resetOverwrite: ruleSelMax.resetOverwrite,
                    // topic : ruleSelMax.topic
                };
            }
        }
        const checkRuleForAT = rule => {
            if (!rule.time) {
                return;
            }
            const num = ctrlLib.getRuleTimeData(node, msg, rule, oNow);
            if (num > oNow.nowNr) {
                node.debug('autoTrigger set to rule ' + rule.pos);
                const diff = num - oNow.nowNr;
                node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                node.autoTrigger.type = 2; // next rule
            }
        };
        if (ruleSel) {
            // ruleSel.text = '';
            // node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10, breakLength: Infinity }));
            livingRuleData.id = ruleSel.pos;
            livingRuleData.name = ruleSel.name;
            livingRuleData.importance = ruleSel.importance;
            livingRuleData.resetOverwrite = ruleSel.resetOverwrite;
            livingRuleData.code = 4;
            livingRuleData.topic = ruleSel.topic;

            if (node.autoTrigger) {
                if (ruleSel.time && ruleSel.timeData.ts > oNow.nowNr) {
                    node.debug('autoTrigger set to rule ' + ruleSel.pos + ' (current)');
                    const diff = ruleSel.timeData.ts - oNow.nowNr;
                    node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                    node.autoTrigger.type = 1; // current rule end
                } else {
                    for (let i = (ruleindex+1); i < node.rules.count; ++i) {
                        const rule = node.rules.data[i];
                        if (!rule.time) {
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

            livingRuleData.conditional = ruleSel.conditional;
            livingRuleData.timeLimited = (!!ruleSel.time);

            const data = { number: ruleSel.pos, name: ruleSel.name };
            let name = 'rule';
            if (ruleSel.conditional) {
                livingRuleData.conditon = ruleSel.conditon;
                data.text = ruleSel.conditon.text;
                data.textShort = ruleSel.conditon.textShort;
                name = 'ruleCond';
            }
            if (ruleSel.time && ruleSel.timeData) {
                livingRuleData.time = ruleSel.timeData;
                livingRuleData.time.timeLocal = node.positionConfig.toTimeString(ruleSel.timeData.value);
                livingRuleData.time.timeLocalDate = node.positionConfig.toDateString(ruleSel.timeData.value);
                livingRuleData.time.dateISO= ruleSel.timeData.value.toISOString();
                livingRuleData.time.dateUTC= ruleSel.timeData.value.toUTCString();
                data.timeOp = ruleSel.time.operatorText;
                data.timeLocal = livingRuleData.time.timeLocal;
                data.time = livingRuleData.time.dateISO;
                name = (ruleSel.conditional) ? 'ruleTimeCond' : 'ruleTime';
            }
            livingRuleData.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.'+name, data);
            livingRuleData.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.'+name, data);
            // node.debug(`checkRules end livingRuleData=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);

            if (ruleSel.level.operator === cRule.off) {
                livingRuleData.isOff = true;
            } else if (ruleSel.level.operator === cRule.levelAbsolute) { // absolute rule
                livingRuleData.level = getBlindPosFromTI(node, msg, ruleSel.level.type, ruleSel.level.value, -1);
                livingRuleData.slat = node.positionConfig.getPropValue(node, msg, ruleSel.slat, false, oNow.now);
                livingRuleData.active = (livingRuleData.level > -1);
            } else {
                livingRuleData.active = false;
                livingRuleData.level = node.nodeData.levelDefault;
                livingRuleData.slat = node.positionConfig.getPropValue(node, msg, node.nodeData.slat, false, oNow.now);
            }
            return livingRuleData;
        }
        livingRuleData.active = false;
        livingRuleData.id = cRuleDefault;
        livingRuleData.importance = 0;
        livingRuleData.resetOverwrite = false;
        livingRuleData.level = node.nodeData.levelDefault;
        livingRuleData.slat = node.positionConfig.getPropValue(node, msg, node.nodeData.slat, false, oNow.now);
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
        const node = this;
        if (!this.positionConfig) {
            node.status({
                fill: 'red',
                shape: 'dot',
                text: 'Node not properly configured!!'
            });
            return;
        }
        if (!Array.isArray(config.results)) {
            config.results = [{
                p: '',
                pt: 'msgPayload',
                v: '',
                vt: 'level'
            },
            {
                p: 'slat',
                pt: 'msg',
                v: '',
                vt: 'slat'
            },
            {
                p: '',
                pt: 'msgTopic',
                v: '',
                vt: 'topic'
            },
            {
                p: 'blindCtrl',
                pt: 'msg',
                v: 'full',
                vt: 'ctrlObj'
            }];
        }

        if (config.autoTrigger) {
            node.autoTrigger = {
                defaultTime : parseInt(config.autoTriggerTime) || 3600000 // 1h
            };
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
        node.contextStore = config.contextStore || this.positionConfig.contextStore;
        // Retrieve the config node
        node.sunData = {
            /** Defines if the sun control is active or not */
            active: false,
            mode: Number(hlp.chkValueFilled(config.sunControlMode, 0)),
            topic: config.sunTopic,
            /** define how long could be the sun on the floor **/
            floorLength: config.sunFloorLength || 0,
            floorLengthType: config.sunFloorLengthType || 'num',
            /** minimum altitude of the sun */
            minDelta: Number(hlp.chkValueFilled(config.sunMinDelta, 0)),
            slat : {
                type : config.sunSlatType || 'none',
                value : config.sunSlat || ''
            },
            changeAgain: 0
        };
        if (node.sunData.mode === 2) { node.sunData.mode = cSummerMode; } // backwards compatibility
        node.sunData.modeMax = node.sunData.mode;
        node.windowSettings = {
            /** The top of the window */
            top: config.windowTop,
            topType:config.windowTopType || 'num',
            /** The bottom of the window */
            bottom: config.windowBottom,
            bottomType: config.windowBottomType || 'num',
            /** the orientation angle to the geographical north */
            azimuthStart: config.windowAzimuthStart,
            azimuthStartType: config.windowAzimuthStartType || 'num',
            /** an offset for the angle clockwise offset */
            azimuthEnd: config.windowAzimuthEnd,
            azimuthEndType: config.windowAzimuthEndType || 'num'
        };
        node.nodeData = {
            isDisabled: node.context().get('isDisabled', node.contextStore) || false,
            /** The Level of the window */
            levelTop: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            levelBottom: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            levelTopOffset: Number(hlp.chkValueFilled(config.blindOpenPosOffset, 0)),
            levelBottomOffset: Number(hlp.chkValueFilled(config.blindClosedPosOffset, 0)),
            increment: Number(hlp.chkValueFilled(config.blindIncrement, 1)),
            levelDefault: NaN,
            levelMin: NaN,
            levelMax: NaN,
            slat : {
                type : config.slatPosDefaultType || 'none',
                value : config.slatPosDefault || ''
            },
            topic: config.topic,
            addId: config.addId,
            addIdType: config.addIdType||'none',
            /** The override settings */
            overwrite: node.context().get('overwrite', node.contextStore) || {
                active: false,
                importance: 0
            }
        };
        node.nodeData.overwrite.expireDuration = parseFloat(hlp.chkValueFilled(config.overwriteExpire, NaN));

        if (node.nodeData.levelTop < node.nodeData.levelBottom) {
            [node.nodeData.levelTop, node.nodeData.levelBottom] = [node.nodeData.levelBottom, node.nodeData.levelTop];
            [node.nodeData.levelTopOffset, node.nodeData.levelBottomOffset] = [node.nodeData.levelBottomOffset, node.nodeData.levelTopOffset];
            node.levelReverse = true;
        }
        node.nodeData.levelBottomSun = node.nodeData.levelBottom + node.nodeData.levelBottomOffset;
        if (node.nodeData.levelBottomSun < node.nodeData.levelBottom || node.nodeData.levelBottomSun > node.nodeData.levelTop) {
            node.nodeData.levelBottomSun = node.nodeData.levelBottom;
            node.error(RED._('blind-control.errors.invalidOpenPosOffset'));
        }

        node.nodeData.levelTopSun = node.nodeData.levelTop - node.nodeData.levelTopOffset;
        if (node.nodeData.levelTopSun < node.nodeData.levelBottom || node.nodeData.levelTopSun > node.nodeData.levelTop) {
            node.nodeData.levelTopSun = node.nodeData.levelTop;
            node.error(RED._('blind-control.errors.invalidClosedPosOffset'));
        }
        delete node.nodeData.levelBottomOffset;
        delete node.nodeData.levelTopOffset;

        node.nodeData.levelDefault = getBlindPosFromTI(node, undefined, config.blindPosDefaultType, config.blindPosDefault, node.nodeData.levelTop);
        node.nodeData.levelMin = getBlindPosFromTI(node, undefined, config.blindPosMinType, config.blindPosMin, node.nodeData.levelBottom);
        node.nodeData.levelMax = getBlindPosFromTI(node, undefined, config.blindPosMaxType, config.blindPosMax, node.nodeData.levelTop);
        if (!config.oversteers) {
            config.oversteers = [];
            if (config.sunMinAltitude) {
                config.oversteers.push({
                    valueType       : 'pdsCalcElevation',
                    value           : '',
                    operator        : 'lt',
                    operatorText    : '<',
                    thresholdType   : 'num',
                    threshold       : config.sunMinAltitude,
                    mode            : 2,
                    onlySunInWindow : true,
                    blindPos        : {
                        type        : config.blindPosDefaultType,
                        value       : config.blindPosDefault
                    },
                    slatPos         : {
                        type        : 'none',
                        value       : ''
                    }
                });
                delete config.sunMinAltitude;
            }
            if (config.oversteerValueType && (typeof config.oversteerValueType !== 'undefined') && (config.oversteerValueType !== 'none') && (config.oversteerValueType !== '')) {
                config.oversteers.push({
                    value           : config.oversteerValue,
                    valueType       : config.oversteerValueType,
                    operator        : config.oversteerCompare,
                    threshold       : config.oversteerThreshold,
                    thresholdType   : config.oversteerThresholdType,
                    mode            : 0,
                    onlySunInWindow : true,
                    blindPos        : {
                        type        : config.oversteerBlindPosType,
                        value       : config.oversteerBlindPos
                    },
                    slatPos         : {
                        type        : 'none',
                        value       : ''
                    }
                });
                if (config.oversteer2ValueType && (typeof config.oversteer2ValueType !== 'undefined') && (config.oversteer2ValueType !== 'none') && (config.oversteer2ValueType !== '')) {
                    config.oversteers.push({
                        value           : config.oversteer2Value,
                        valueType       : config.oversteer2ValueType,
                        operator        : config.oversteer2Compare,
                        threshold       : config.oversteer2Threshold,
                        thresholdType   : config.oversteer2ThresholdType,
                        mode            : 0,
                        onlySunInWindow : true,
                        blindPos        : {
                            type        : config.oversteer2BlindPosType,
                            value       : config.oversteer2BlindPos
                        },
                        slatPos         : {
                            type        : 'none',
                            value       : ''
                        }
                    });
                    if (config.oversteer3ValueType && (typeof config.oversteer3ValueType !== 'undefined') && (config.oversteer3ValueType !== 'none') && (config.oversteer3ValueType !== '')) {
                        config.oversteers.push({
                            value           : config.oversteer3Value,
                            valueType       : config.oversteer3ValueType,
                            operator        : config.oversteer3Compare,
                            threshold       : config.oversteer3Threshold,
                            thresholdType   : config.oversteer3ThresholdType,
                            mode            : 0,
                            onlySunInWindow : true,
                            blindPos        : {
                                type        : config.oversteer3BlindPosType,
                                value       : config.oversteer3BlindPos
                            },
                            slatPos         : {
                                type        : 'none',
                                value       : ''
                            }
                        });
                    }
                }
                delete config.oversteerValue;
                delete config.oversteerValueType;
                delete config.oversteerCompare;
                delete config.oversteerThreshold;
                delete config.oversteerThresholdType;
                delete config.oversteerBlindPos;
                delete config.oversteerBlindPosType;
                delete config.oversteer2Value;
                delete config.oversteer2ValueType;
                delete config.oversteer2Compare;
                delete config.oversteer2Threshold;
                delete config.oversteer2ThresholdType;
                delete config.oversteer2BlindPos;
                delete config.oversteer2BlindPosType;
                delete config.oversteer3Value;
                delete config.oversteer3ValueType;
                delete config.oversteer3Compare;
                delete config.oversteer3Threshold;
                delete config.oversteer3ThresholdType;
                delete config.oversteer3BlindPos;
                delete config.oversteer3BlindPosType;
            }
        }

        node.oversteers = config.oversteers;
        node.oversteers.forEach( (val, _index) => {
            val.pos = _index;
            if (!Object.prototype.hasOwnProperty.call(val, 'onlySunInWindow')) {
                val.onlySunInWindow = true;
            }
            if (node.positionConfig && val.valueType === 'jsonata') {
                try {
                    val.valueExpr = node.positionConfig.getJSONataExpression(node, val.value);
                } catch (err) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                    val.valueExpr = null;
                }
            }
        });

        node.oversteer = {
            active: node.oversteers.length >0,
            topic: config.oversteerTopic || config.sunTopic,
            isChecked: false
        };

        node.rules = {
            data: config.rules || []
        };
        node.level = {
            current: NaN, // unknown
            currentInverse: NaN
        };
        node.previousData = node.context().get('lastData', node.contextStore) || {
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
            let modeSign = '';
            if (node.sunData.mode === cWinterMode) {
                modeSign = '❆ ';
            } else if (node.sunData.mode === cSummerMode) {
                modeSign = '☀ ';
            } else if (node.sunData.mode === cMinimizeMode) {
                modeSign = '🕶 ';
            }

            node.reason.stateComplete = (isNaN(blindCtrl.level)) ? node.reason.state : blindCtrl.level.toString() + ' - ' + modeSign + node.reason.state;
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
                node.debug(`--------- blind-control - input msg.topic=${msg.topic} msg.payload=${msg.payload} msg.ts=${msg.ts}`);
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
                    node.context().set('mode', newMode, node.contextStore);
                }

                if (msg.topic && (typeof msg.topic === 'string') &&
                    (msg.topic.startsWith('set') ||
                    msg.topic.startsWith('disable') ||
                    msg.topic.startsWith('enable'))) {
                    const getFloatValue = def => {
                        const val = parseFloat(msg.payload);
                        if (isNaN(val)) {
                            return def;
                        }
                        return val;
                    };
                    switch (msg.topic) {
                        /* Blind Settings */
                        case 'setBlindSettingsTop':
                            node.nodeData.levelTop = getFloatValue(node.nodeData.levelTop);
                            break;
                        case 'setBlindSettingsBottom':
                            node.nodeData.levelBottom = getFloatValue(node.nodeData.levelBottom);
                            break;
                        case 'setBlindSettingsIncrement':
                            node.nodeData.increment = getFloatValue(node.nodeData.increment);
                            break;
                        /* Default Settings */
                        case 'setBlindSettingsLevel':
                            node.nodeData.levelDefault = getFloatValue(node.nodeData.levelDefault);
                            break;
                        case 'setSettingsTopic':
                            node.nodeData.topic = msg.payload || node.nodeData.topic;
                            break;
                        /* sun Control Settings */
                        case 'setSunDataTopic':
                            node.sunData.topic = msg.payload || node.sunData.topic;
                            break;
                        case 'setSunDataFloorLength': {
                            const val = getFloatValue(node.sunData.floorLength);
                            if (val !== node.sunData.floorLength) {
                                node.sunData.floorLengthType = 'num';
                                node.sunData.floorLength = val;
                            }
                            break;
                        }
                        /* minimum changes Settings */
                        case 'setSunDataMinDelta':
                            node.sunData.minDelta = parseFloat(msg.payload) || node.sunData.minDelta; // payload of 0 makes no sense, use then default
                            break;
                        case 'setSmoothTime':
                            node.smoothTime = parseFloat(msg.payload) || node.smoothTime; // payload of 0 makes no sense, use then default
                            break;
                        /* advanced Settings */
                        case 'setAutoTriggerTime':
                            node.autoTrigger.defaultTime = parseInt(msg.payload) || node.autoTrigger.defaultTime; // payload of 0 makes no sense, use then default
                            break;
                        case 'setContextStore':
                            node.contextStore = msg.payload || node.contextStore;
                            break;
                        case 'disableRule':
                            changeRules(node, undefined, msg.payload, { enabled: false });
                            break;
                        case 'enableRule':
                            changeRules(node, undefined, msg.payload, { enabled: true });
                            break;
                        case 'disableRuleByPos':
                            changeRules(node, parseInt(msg.payload), undefined, { enabled: false });
                            break;
                        case 'enableRuleByPos':
                            changeRules(node, parseInt(msg.payload), undefined, { enabled: true });
                            break;
                        case 'enableNode':
                            node.nodeData.isDisabled = false;
                            node.context().set('isDisabled', false, node.contextStore);
                            break;
                        case 'disableNode':
                            node.nodeData.isDisabled = true;
                            node.context().set('isDisabled', true, node.contextStore);
                            node.status({
                                fill: 'grey',
                                shape: 'dot',
                                text: (typeof msg.payload === 'string') ? msg.payload : 'disabled'
                            });
                            break;
                        default:
                            break;
                    }
                    if (node.nodeData.levelTop < node.nodeData.levelBottom) {
                        [node.nodeData.levelBottom, node.nodeData.levelTop] = [node.nodeData.levelTop, node.nodeData.levelBottom];
                        node.levelReverse = true;
                    }
                }
                if (node.nodeData.isDisabled) {
                    done();
                    return null;
                }

                // initialize
                node.nowarn = {};
                const tempData = node.context().get('cacheData',node.contextStore) || {};
                if (!isNaN(node.level.current)) {
                    node.previousData.level = node.level.current;
                    node.previousData.levelInverse = node.level.currentInverse;
                    node.previousData.slat = clonedeep(node.level.slat); // deep copy
                    node.previousData.topic = node.level.topic;
                    node.previousData.reasonCode = node.reason.code;
                    node.previousData.reasonState = node.reason.state;
                    node.previousData.reasonDescription = node.reason.description;
                    if (String(msg.topic).includes('forceOutput')) { // hlp.getMsgTopicContains(msg, 'forceOutput')) {
                        node.previousData.forceNext = true;
                    }
                } else {
                    node.previousData.forceNext = true;
                }
                node.oversteer.isChecked = false;
                node.reason.code = NaN;
                node.level.topic = '';
                const oNow = hlp.getNowObject(node, msg);
                if (node.autoTrigger) {
                    node.autoTrigger.time = node.autoTrigger.defaultTime;
                    node.autoTrigger.type = 0; // default time
                }

                if (node.nodeData.addIdType !== 'none') {
                    node.addId = node.positionConfig.getPropValue(node, msg, {
                        type: node.nodeData.addIdType,
                        value: node.nodeData.addId,
                        callback: (result, _obj) => {
                            if (result !== null && typeof result !== 'undefined') {
                                tempData[_obj.type + '.' + _obj.value] = result;
                            }
                        }
                    }, true, oNow.now);
                }
                const blindCtrl = {
                    reason : node.reason,
                    blind: node.nodeData,
                    autoTrigger : node.autoTrigger,
                    lastEvaluated: node.previousData.last,
                    name: node.name || node.id,
                    id: node.addId || node.id,
                    srcId: node.id,
                    path: node._path || node.id
                };

                let ruleId = NaN;
                // check for manual overwrite
                let overwrite = checkPosOverwrite(node, msg, oNow);
                if (!overwrite || node.rules.canResetOverwrite || (node.rules.maxImportance > 0 && node.rules.maxImportance > node.nodeData.overwrite.importance)) {
                    // calc times:
                    blindCtrl.rule = checkRules(node, msg, oNow, tempData);
                    node.previousData.last.ruleId = blindCtrl.rule.id;
                    node.previousData.last.ruleLevel = blindCtrl.rule.level;
                    node.previousData.last.ruleTopic = blindCtrl.rule.topic;
                    if (blindCtrl.rule.isOff === true) {
                        node.previousData.forceNext = true;
                        node.context().set('lastData', node.previousData, node.contextStore);
                        node.context().set('cacheData', tempData, node.contextStore);
                        // rule set the controller off
                        done();
                        return null;
                    }

                    // node.debug(`overwrite=${overwrite}, node.rules.maxImportance=${node.rules.maxImportance}, node.nodeData.overwrite.importance=${node.nodeData.overwrite.importance}, blindCtrl.rule.importance=${blindCtrl.rule.importance}, blindCtrl.rule.resetOverwrite=${blindCtrl.rule.resetOverwrite}, blindCtrl.rule.id=${blindCtrl.rule.id}, node.previousData.usedRule=${node.previousData.usedRule}`);
                    if (overwrite && blindCtrl.rule.resetOverwrite && blindCtrl.rule.id !== node.previousData.usedRule) {
                        node.debug(`Overwrite expired caused by rule rule=${blindCtrl.rule.id}, previousRule=${node.previousData.usedRule}`);
                        ctrlLib.posOverwriteReset(node);
                        overwrite = false;
                    }

                    if (!overwrite || blindCtrl.rule.importance > node.nodeData.overwrite.importance) {
                        ruleId = blindCtrl.rule.id;
                        node.level.current = blindCtrl.rule.level;
                        node.level.currentInverse = getInversePos_(node, blindCtrl.rule.level);
                        node.level.slat = blindCtrl.rule.slat;
                        node.level.topic = blindCtrl.rule.topic;
                        node.reason.code = blindCtrl.rule.code;
                        node.reason.state = blindCtrl.rule.state;
                        node.reason.description = blindCtrl.rule.description;
                        if (!blindCtrl.rule.active && (node.sunData.mode > 0)) {
                            // calc sun position:
                            blindCtrl.sunPosition = calcBlindSunPosition(node, msg, oNow, tempData);
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
                    if (blindCtrl.rule.topicOversteer && (!overwrite || (blindCtrl.rule.topicOversteer.importance > node.nodeData.overwrite.importance))) {
                        node.level.topic = blindCtrl.rule.topicOversteer.topic;
                    }
                    if (blindCtrl.rule.slatOversteer && (!overwrite || (blindCtrl.rule.slatOversteer.importance > node.nodeData.overwrite.importance))) {
                        node.level.slat = blindCtrl.rule.slatOversteer.slat;
                    }
                }

                if (node.oversteer.active && !node.oversteer.isChecked) {
                    node.oversteers.forEach(el => {
                        node.positionConfig.getPropValue(node, msg, {
                            type: el.valueType,
                            value: el.value,
                            callback: (result, _obj) => {
                                if (result !== null && typeof result !== 'undefined') {
                                    tempData[_obj.type + '.' + _obj.value] = result;
                                }
                            },
                            operator: el.operator
                        }, false, oNow.now);
                    });
                }

                blindCtrl.slat = node.level.slat;
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
                const replaceAttrs = {
                    name: blindCtrl.name,
                    id: blindCtrl.id,
                    srcId: blindCtrl.srcId,
                    path: blindCtrl.path,
                    level: blindCtrl.level,
                    levelInverse: blindCtrl.levelInverse,
                    slat: blindCtrl.slat,
                    code: node.reason.code,
                    state: node.reason.state,
                    description: node.reason.description,
                    rule: ruleId,
                    mode: node.context().get('mode', node.contextStore) || node.sunData.mode,
                    topic: msg.topic,
                    payload: msg.payload
                };
                if (topic) {
                    topic = hlp.topicReplace(topic, replaceAttrs);
                }

                if ((!node.startDelayTimeOut) &&
                    (!isNaN(node.level.current)) &&
                    (node.previousData.forceNext === true ||
                    (node.level.current !== node.previousData.level) ||
                    (!isEqual(node.level.slat, node.previousData.slat)) ||
                    (node.level.topic !== node.previousData.topic))) {
                    const msgOut = {};
                    for (let i = 0; i < node.results.length; i++) {
                        const prop = node.results[i];
                        let resultObj = null;
                        if (prop.type === 'topic') {
                            resultObj = topic;
                        } else if (prop.type === 'level') {
                            resultObj = blindCtrl.level;
                        } else if (prop.type === 'levelInverse') {
                            resultObj = blindCtrl.levelInverse;
                        } else if (prop.type === 'slat') {
                            resultObj = node.level.slat;
                        } else if (prop.type === 'ctrlObj') {
                            resultObj = blindCtrl;
                        } else if (prop.type === 'strPlaceholder') {
                            resultObj = hlp.topicReplace(''+prop.value, replaceAttrs);
                        } else {
                            resultObj = node.positionConfig.getPropValue(this, msg, prop, false, oNow.now);
                        }
                        if (typeof resultObj !== 'undefined') {
                            if (resultObj.error) {
                                this.error('error on getting result: "' + resultObj.error + '"');
                            } else {
                                node.positionConfig.setMessageProp(this, msgOut, prop.outType, prop.outValue, resultObj);
                            }
                        }
                    }
                    send([msgOut, { topic, payload: blindCtrl, reason: node.reason, mode: node.sunData.mode }]);
                    delete node.previousData.forceNext;
                } else {
                    send([null, { topic, payload: blindCtrl, reason: node.reason, mode: node.sunData.mode }]);
                }
                if (isNaN(ruleId)) {
                    node.previousData.usedRule = ruleId;
                }
                node.context().set('cacheData', tempData, node.contextStore);
                node.context().set('lastData', node.previousData, node.contextStore);
                if (node.autoTrigger) {
                    node.debug('next autoTrigger will set to ' + node.autoTrigger.time + ' - ' + node.autoTrigger.type);
                    if (node.autoTriggerObj) {
                        clearTimeout(node.autoTriggerObj);
                        delete node.autoTriggerObj;
                    }
                    node.autoTriggerObj = setTimeout(() => {
                        clearTimeout(node.autoTriggerObj);
                        delete node.autoTriggerObj;
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
                delete node.autoTriggerObj;
            }
            if (node.startDelayTimeOutObj) {
                clearTimeout(node.startDelayTimeOutObj);
                delete node.startDelayTimeOutObj;
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

    RED.httpAdmin.post('/blind-control/:id', RED.auth.needsPermission('blind-control.write'), (req, res) => {
        const node = RED.nodes.getNode(req.params.id);
        if (node !== null && typeof node !== 'undefined') {
            try {
                if (req.body && req.body.ruleData) {
                    changeRules(node, req.body.rulePos, req.body.ruleName, req.body.ruleData);
                }
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
                node.error(RED._('node-red:inject.failed',{error:err.toString()}));
            }
        } else {
            res.status(404).send(JSON.stringify({
                error: 'can not find node "' +req.params.id+'" '+String(node)
            }));
            return;
        }
    });
};