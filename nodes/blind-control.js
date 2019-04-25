/********************************************
 * blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

/*************************************************************************************************************************/
/**
 * check if a level has a valid value
 * @param {*} node the node data
 * @param {*} level the level to check
 * @returns {boolean} true if the level is valid, otherwise false
 */
function validPosition_(node, level) {
    // node.debug('validPosition_ level='+level);
    if (isNaN(level)) {
        node.warn(`Position: "${level}" is NaN!`);
        return false;
    }
    if (level < node.blindData.closedPos) {
        node.warn(`Position: "${level}" < closedPos ${node.blindData.closedPos}`);
        return false;
    }
    if (level > node.blindData.openPos) {
        node.warn(`Position: "${level}" > openPos ${node.blindData.openPos}`);
        return false;
    }
    if (Number.isInteger(node.blindData.openPos) &&
        Number.isInteger(node.blindData.closedPos) &&
        Number.isInteger(node.blindData.increment) &&
        ((level % node.blindData.increment !== 0) ||
        !Number.isInteger(level) )) {
        node.warn(`Position invalid "${level}" not fit to increment ${node.blindData.increment}`);
        return false;
    }
    return Number.isInteger(Number((level / node.blindData.increment).toFixed(hlp.countDecimals(node.blindData.increment) + 2)));
}
/******************************************************************************************/
/**
   * the definition of the time to compare
   * @param {*} compareType type to compare
   * @param {*} msg the message object
   * @param {*} node the current node object
   */
function getNow_(node, msg, compareType) {
    let id = '';
    let value = '';
    switch (compareType) {
        case '1':
            id = 'msg.ts';
            value = msg.ts;
            break;
        case '2':
            id = 'msg.lc';
            value = msg.lc;
            break;
        case '3':
            id = 'msg.time';
            value = msg.time;
            break;
        case '4':
            id = 'msg.value';
            value = msg.value;
            break;
        default:
            return new Date();
    }
    node.debug(`compare time to ${id} = "${value}"`);
    const dto = new Date(msg.ts);
    if (dto !== 'Invalid Date' && !isNaN(dto)) {
        return dto;
    }
    node.error('Error can not get a valide timestamp from ' + id + '="' + value + '"! Will use current timestamp!');
    return new Date();
}

/******************************************************************************************/
/**
 * get the absolute level from percentage level
 * @param {*} node the node settings
 * @param {*} percentPos the level in percentage
 */
function posPrcToAbs_(node, levelPercent) {
    return posRound_(node, ((node.blindData.openPos - node.blindData.closedPos) * levelPercent) + node.blindData.closedPos);
}
/**
 * round a level to the next increment
 * @param {*} node node data
 * @param {number} pos level
 * @return {number} rounded level number
 */
function posRound_(node, pos) {
    // node.debug(`levelPrcToAbs_ ${pos} - increment is ${node.blindData.increment}`);
    // pos = Math.ceil(pos / node.blindData.increment) * node.blindData.increment;
    // pos = Math.floor(pos / node.blindData.increment) * node.blindData.increment;
    pos = Math.round(pos / node.blindData.increment) * node.blindData.increment;
    pos = Number(pos.toFixed(hlp.countDecimals(node.blindData.increment)));
    if (pos > node.blindData.openPos) {
        pos = node.blindData.openPos;
    }
    if (pos < node.blindData.closedPos) {
        pos = node.blindData.closedPos;
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
/******************************************************************************************/
/**
 * calculates the current sun level
 * @param {*} node node data
 * @param {*} now the current timestamp
 */
function getSunPosition_(node, now) {
    const sunPosition = node.positionConfig.getSunCalc(now);
    // node.debug('sunPosition: ' + util.inspect(sunPosition, Object.getOwnPropertyNames(sunPosition)));
    sunPosition.InWindow = (sunPosition.azimuthDegrees >= node.windowSettings.AzimuthStart) &&
                           (sunPosition.azimuthDegrees <= node.windowSettings.AzimuthEnd);
    return sunPosition;
}

module.exports = function (RED) {
    'use strict';
    /******************************************************************************************/
    function checkWeather(node, msg) {
        // node.debug('checkWeather');
        if (!node.cloudData.active) {
            node.cloudData.inLimit = true;
            return;
        }
        try {
            node.cloudData.inLimit = !node.positionConfig.comparePropValue(node, msg, node.cloudData.valueType, node.cloudData.value,
                node.cloudData.operator, node.cloudData.thresholdType, node.cloudData.thresholdValue, node.cloudData.temp);
        } catch (err) {
            node.error(RED._('blind-control.errors.getCloudData', err));
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
            node.cloudData.inLimit = true;
        }
        msg.blindCtrl.cloud = node.cloudData;
        // node.debug('node.cloudData=' + util.inspect(node.cloudData));
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
        def = def || NaN;
        if (type === 'none' || type === '') {
            return def;
        }
        try {
            if (type === 'levelFixed') {
                if (value.includes('close')) {
                    return node.blindData.closedPos;
                } else if (value === '75%') {
                    return posPrcToAbs_(node, 0.75);
                } else if (value === '66%') {
                    return posPrcToAbs_(node, 0.66666);
                } else if (value === '50%') {
                    return posPrcToAbs_(node, 0.5);
                } else if (value === '33%') {
                    return posPrcToAbs_(node, 0.33333);
                } else if (value === '25%') {
                    return posPrcToAbs_(node, 0.25);
                } else if (value === '10%') {
                    return posPrcToAbs_(node, 0.1);
                } else if (value.includes('open')) {
                    return node.blindData.openPos;
                }
                throw new Error('unknown value "'+ value + '" of type "' + type + '"' );
            }
            return node.positionConfig.getFloatProp(node, msg, type, value, def);
        } catch (err) {
            node.error(RED._('blind-control.errors.getBlindPosData', err));
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        return def;
    }
    /******************************************************************************************/

    function blindPosOverwriteReset(node) {
        node.debug(`blindPosOverwriteReset expire=${node.blindData.overwrite.expires}`);
        node.blindData.overwrite.active = false;
        node.blindData.overwrite.priority = 0;
        node.blindData.overwrite.level = -1;
        delete node.blindData.overwrite.expireNever;
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }
        if (node.blindData.overwrite.expires) {
            delete node.blindData.overwrite.expires;
            delete node.blindData.overwrite.expireDate;
        }
    }

    function setExpiringOverwrite(node, now, expire) {
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }

        if (isNaN(expire)) {
            expire = node.blindData.overwrite.expireDuration;
        }
        node.blindData.overwrite.expireNever = (typeof expire === 'undefined') || isNaN(expire) || isFinite(expire) || (expire < 100);

        if (node.blindData.overwrite.expireNever) {
            delete node.blindData.overwrite.expires;
            delete node.blindData.overwrite.expireDate;
            return;
        }
        node.blindData.overwrite.expires = (now.getTime() + expire);
        node.blindData.overwrite.expireDate = new Date(node.blindData.overwrite.expires);
        node.debug(`expires in ${expire}ms = ${node.blindData.overwrite.expireDate}`);
        node.timeOutObj = setTimeout(() => {
            node.debug('timeout - overwrite expired');
            blindPosOverwriteReset(node);
            node.emit('input', { payload: -1, topic: 'internal-trigger-overwriteExpired', force: false });
        }, expire);
    }
    /**
     * check if a manual overwrite of the blind level should be set
     * @param {*} node node data
     * @param {*} msg message object
     */
    function checkBlindPosOverwrite(node, msg, now) {
        // node.debug(`checkBlindPosOverwrite act=${node.blindData.overwrite.active}`);
        hlp.getMsgBoolValue(msg, 'reset', 'resetOverwrite',
            (val) => {
                if (val) {
                    blindPosOverwriteReset(node);
                }
            });

        const prio = hlp.getMsgNumberValue(msg, ['prio', 'priority'], ['prio', 'alarm'], undefined, 0);

        if (node.blindData.overwrite.active && (node.blindData.overwrite.priority > 0) && (node.blindData.overwrite.priority > prio)) {
            // if active, the prio must be 0 or given with same or higher as current overwrite otherwise this will not work
            return true;
        }
        const newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position', 'level', 'blindLevel'], ['manual', 'levelOverwrite']);
        const expire = hlp.getMsgNumberValue(msg, 'expire', 'expire');
        if (node.blindData.overwrite.active && isNaN(newPos)) {
            node.debug(`change of prio=${prio} or expire=${expire}`);
            if (isNaN(expire)) {
                setExpiringOverwrite(node, now, expire);
            }
            if (prio > 0) {
                node.blindData.overwrite.priority = prio;
            }
            return true;
        } else if (!isNaN(newPos)) {
            node.debug(`needOverwrite prio=${prio} expire=${expire} newPos=${newPos}`);
            if (newPos === -1) {
                node.blindData.overwrite.level = NaN;
            } else if (!isNaN(newPos)) {
                if (!validPosition_(node, newPos)) {
                    node.error(RED._('blind-control.errors.invalid-blind-level', { pos: newPos }));
                    return false;
                }
                node.debug(`overwrite newPos=${newPos}`);
                const noSameValue = hlp.getMsgBoolValue(msg, ['ignoreSameValue', 'noSameValue'], ['ignoreSameValue', 'noSameValue']);
                if (noSameValue && (node.blindData.previous.level === newPos)) {
                    return true;
                }
                node.blindData.overwrite.level = newPos;
                node.blindData.level = newPos;
            }

            if (!isNaN(expire) || (prio <= 0)) {
                // will set expiring if prio is 0 or if expire is explizit defined
                setExpiringOverwrite(node, now, expire);
            } else {
                // otherwise set to never expire
                setExpiringOverwrite(node, now);
            }
            if (prio > 0) {
                node.blindData.overwrite.priority = prio;
            }
            node.blindData.overwrite.active = true;
        }
        if (node.blindData.overwrite.active) {
            node.reason.code = 2;
            if (node.blindData.overwrite.expires) {
                node.reason.state = RED._('blind-control.states.overwriteExpire', {
                    prio: node.blindData.overwrite.priority,
                    time: node.blindData.overwrite.expireDate.toLocaleTimeString()
                });
                node.reason.description = RED._('blind-control.reasons.overwriteExpire', {
                    prio: node.blindData.overwrite.priority,
                    time: node.blindData.overwrite.expireDate.toISOString()
                });
            } else {
                node.reason.state = RED._('blind-control.states.overwriteNoExpire', { prio: node.blindData.overwrite.priority });
                node.reason.description = RED._('blind-control.states.overwriteNoExpire', { prio: node.blindData.overwrite.priority });
            }
            return true;
        }
        return false;
    }

    /******************************************************************************************/
    /**
     * calculates for the blind the new level
     * @param {*} node the node data
     * @param {*} msg the message object
     */
    function calcBlindSunPosition(node, msg, now) {
        // node.debug('calcBlindSunPosition: calculate blind position by sun');
        // sun control is active
        const sunPosition = getSunPosition_(node, now);
        msg.blindCtrl.sunPosition = sunPosition;
        // to be able to store values
        checkWeather(node, msg);

        if (!sunPosition.InWindow) {
            node.reason.code = 7;
            node.reason.state = RED._('blind-control.states.sunNotInWin');
            node.reason.description = RED._('blind-control.reasons.sunNotInWin');
            return;
        }

        if (node.sunData.minAltitude && (sunPosition.altitudeDegrees < node.sunData.minAltitude)) {
            node.reason.code = 6;
            node.reason.state = RED._('blind-control.states.sunMinAltitude');
            node.reason.description = RED._('blind-control.reasons.sunMinAltitude');
            return;
        }
        // set default values:
        if (!node.cloudData.inLimit) {
            node.blindData.level = node.cloudData.blindPos;
            node.reason.code = 9;
            node.reason.state = RED._('blind-control.states.cloudExceeded');
            node.reason.description = RED._('blind-control.reasons.cloudExceeded');
            return;
        }

        // node.debug('node.windowSettings: ' + util.inspect(node.windowSettings, Object.getOwnPropertyNames(node.windowSettings)));
        const height = Math.tan(sunPosition.altitudeRadians) * node.sunData.floorLength;
        // node.debug(`height=${height} - altitude=${sunPosition.altitudeRadians} - floorLength=${node.sunData.floorLength}`);
        if (height <= node.windowSettings.bottom) {
            node.blindData.level = node.blindData.closedPos;
        } else if (height >= node.windowSettings.top) {
            node.blindData.level = node.blindData.openPos;
        } else {
            node.blindData.level = posPrcToAbs_(node, (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom));
        }
        if ((node.smoothTime > 0) && (node.sunData.changeAgain > now.getTime())) {
            // node.debug(`no change smooth - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain}`);
            node.reason.code = 10;
            node.reason.state = RED._('blind-control.states.smooth', { pos: node.blindData.level.toString()});
            node.reason.description = RED._('blind-control.reasons.smooth', { pos: node.blindData.level.toString()});
            node.blindData.level = node.blindData.previous.level;
        } else {
            node.reason.code = 8;
            node.reason.state = RED._('blind-control.states.sunCtrl');
            node.reason.description = RED._('blind-control.reasons.sunCtrl');
            node.sunData.changeAgain = now.getTime() + node.smoothTime;
            // node.debug(`set next time - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain} now=` + now.getTime());
        }
        if (node.blindData.level < node.blindData.levelMin)  {
            // min
            // node.debug(`${node.blindData.level} is below ${node.blindData.levelMin} (min)`);
            node.reason.code = 4;
            node.reason.state = RED._('blind-control.states.sunCtrlMin', {org: node.reason.state});
            node.reason.description = RED._('blind-control.reasons.sunCtrlMin', {org: node.reason.description, level:node.blindData.level});
            node.blindData.level = node.blindData.levelMin;
        } else if (node.blindData.level > node.blindData.levelMax) {
            // max
            // node.debug(`${node.blindData.level} is above ${node.blindData.levelMax} (max)`);
            node.reason.code = 5;
            node.reason.state = RED._('blind-control.states.sunCtrlMax', {org: node.reason.state});
            node.reason.description = RED._('blind-control.reasons.sunCtrlMax', {org: node.reason.description, level:node.blindData.level});
            node.blindData.level = node.blindData.levelMax;
        }
        // node.debug(`calcBlindSunPosition end pos=${node.blindData.level} reason=${node.reason.code} description=${node.reason.description}`);
    }
    /******************************************************************************************/
    /**
       * calculates the times
       * @param {*} node node data
       * @param {*} msg the message object
       * @param {*} config the configuration object
       */
    function checkRules(node, msg, timeData) {
        const nowNr = hlp.getTimeNumber(timeData.now);
        // node.debug(`checkRules nowNr=${nowNr}, node.timeRulesLength=${node.timeRulesLength}`); // {colors:true, compact:10}
        const fkt = (rule, cmp) => {
            // node.debug('rule ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.conditional) {
                try {
                    if (!node.positionConfig.comparePropValue(node, msg, rule.validOperandAType, rule.validOperandAValue, rule.validOperator, rule.validOperandBType, rule.validOperandBValue, rule.temp)) {
                        return null;
                    }
                } catch (err) {
                    node.warn(RED._('blind-control.errors.getPropertyData', err));
                    node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                    return null;
                }
            }
            if (!rule.timeLimited) {
                return rule;
            }
            rule.switchTime = node.positionConfig.getTimeProp(node, msg, rule.timeType, rule.timeValue, rule.offsetValue, rule.offsetType, rule.multiplier);
            if (rule.switchTime.error) {
                hlp.handleError(node, RED._('blind-control.errors.error-time', { message: rule.switchTime.error }), undefined, rule.switchTime.error);
                return null;
            } else if (!rule.switchTime.value) {
                throw new Error('Error can not calc time!');
            }
            rule.switchTime.num = hlp.getTimeNumber(rule.switchTime.value);

            if (cmp(rule.switchTime.num, nowNr)) {
                return rule;
            }
            return null;
        };

        let ruleSel = null;
        // node.debug('first loop ' + node.timeRulesLength);
        for (let i = 0; i < node.timeRulesLength; ++i) {
            const rule = node.timeRules[i];
            // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 1) + ' - ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.timeOp !== 0) { continue; }
            const res = fkt(rule, (r,h) => (r >= h));
            if (res) {
                ruleSel = res;
                break;
            }
        }
        if (!ruleSel || ruleSel.timeLimited) {
            // node.debug('second loop ' + node.timeRulesLength);
            for (let i = (node.timeRulesLength -1); i >= 0; --i) {
                const rule = node.timeRules[i];
                // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 1) + ' - ' + util.inspect(rule, {colors:true, compact:10}));
                if (rule.timeOp === 0) { continue; }
                const res = fkt(rule, (r,h) => (r <= h));
                if (res) {
                    ruleSel = res;
                    break;
                }
            }
        }

        if (ruleSel) {
            // node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10}));
            if (ruleSel.timeLimited) {
                ruleSel.text = ruleSel.timeOpText + ' ' + ruleSel.switchTime.value.toLocaleTimeString();
            }
            if (ruleSel.conditional) {
                ruleSel.text += '*';
            }
            timeData.ruleId = ruleSel.pos;
            timeData.levelFixed = true;
            timeData.level = getBlindPosFromTI(node, msg, ruleSel.levelType, ruleSel.levelValue, node.blindData.defaultPos);
            node.blindData.level = timeData.level;
            node.reason.code = 3;
            node.reason.state= RED._('blind-control.states.time', ruleSel);
            node.reason.description = RED._('blind-control.reasons.time', ruleSel);
            node.reason.code = 1;
            // node.debug('checkRules end: timeData=' + util.inspect(timeData,{colors:true, compact:10}));
            return;
        }
        timeData.levelFixed = false;
        timeData.ruleId = -1;
        node.blindData.level = node.blindData.defaultPos;
        node.reason.code = 1;
        node.reason.state = RED._('blind-control.states.default');
        node.reason.description = RED._('blind-control.reasons.default');

        // node.debug('checkRules end default: timeData=' + util.inspect(timeData, {colors:true, compact:10}));
    }
    /******************************************************************************************/
    /******************************************************************************************/
    function sunBlindControlNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.smoothTime = (parseFloat(config.smoothTime) || 0);
        const node = this;
        if (node.smoothTime >= 0x7FFFFFFF) {
            node.error(RED._('blind-control.errors.smoothTimeToolong', this));
            delete node.smoothTime;
        }

        node.reason = {
            code : 0,
            state: '',
            description: ''
        };
        // Retrieve the config node
        node.sunData = {
            /** Defines if the sun control is active or not */
            active: hlp.chkValueFilled(config.sunControlActive,true),
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude, 0)),
            changeAgain: 0
        };
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
        node.blindData = {
            level: NaN, // unknown
            increment: Number(hlp.chkValueFilled(config.blindIncrement,1)),
            openPos: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            closedPos: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            defaultPos: NaN,
            minPos: NaN,
            maxPos: NaN,
            /** level if sun is not in window */
            overwrite : {
                active: false,
                expireDuration: parseFloat(hlp.chkValueFilled(config.overwriteExpire, -1)),
                priority: 0
            }
        };
        node.blindData.defaultPos = getBlindPosFromTI(node, undefined, config.blindPosDefaultType, config.blindPosDefault, node.blindData.openPos);
        node.blindData.levelMin = getBlindPosFromTI(node, undefined, config.blindPosMinType, config.blindPosMin, node.blindData.closedPos);
        node.blindData.levelMax = getBlindPosFromTI(node, undefined, config.blindPosMaxType, config.blindPosMax, node.blindData.openPos);
        node.cloudData = {
            active: (typeof config.cloudValueType !== 'undefined') && (config.cloudValueType !== 'none'),
            value: config.cloudValue || '',
            valueType: config.cloudValueType || 'none',
            operator: config.cloudCompare,
            thresholdValue: config.cloudThreshold,
            thresholdType: config.cloudThresholdType,
            blindPos: getBlindPosFromTI(node, undefined, config.cloudBlindPosType, config.cloudBlindPos, node.blindData.openPos),
            inLimit: true,
            temp: {}
        };
        node.timeRules = config.rules || [];

        function setState() {
            let code = node.reason.code;
            let shape = 'ring';
            let fill = 'yellow';
            if (code === 10) { // smooth;
                code = node.blindData.previous.reasonCode;
                shape = 'dot';
            } else if (node.blindData.level === node.blindData.openPos) {
                shape = 'dot';
            }

            if (code <= 3) {
                fill = 'blue';
            } else if (code === 4) {
                fill = 'grey';
            } else if (code >= 8) {
                fill = 'green';
            }

            node.status({
                fill: fill,
                shape: shape,
                text: (isNaN(node.blindData.level)) ? node.reason.state : node.blindData.level.toString() + ' - ' + node.reason.state
            });
        }

        this.on('input', function (msg) {
            try {
                node.debug(`input msg.topic=${msg.topic} msg.payload=${msg.payload} msg.force=${msg.force}`);
                if (msg.payload<0) {
                    msg.payload = node.blindData.level;
                }
                // node.debug('input ' + util.inspect(msg, {colors:true, compact:10})); // Object.getOwnPropertyNames(msg)
                if (!this.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'Node not properly configured!!'
                    });
                    return null;
                }
                msg.blindCtrl = {
                    reason : node.reason
                };

                node.blindData.previous = {
                    level: node.blindData.level,
                    reasonCode: node.reason.code
                };
                const timeData = { now : getNow_(node, msg, config.tsCompare) };
                // check if the message contains any weather data

                // node.debug(`start pos=${node.blindData.level} manual=${node.blindData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description} timeData.level=${timeData.level} timeData.code=${timeData.code} timeData.description=${timeData.description}`);
                // check for manual overwrite
                if (!checkBlindPosOverwrite(node, msg, timeData.now)) {
                    // calc times:
                    checkRules(node, msg, timeData);

                    if (!timeData.levelFixed && node.sunData.active) {
                        // calc sun position:
                        calcBlindSunPosition(node, msg, timeData.now);
                    }
                    if (node.blindData.level < node.blindData.closedPos) {
                        node.debug(`${node.blindData.level} is below ${node.blindData.closedPos}`);
                        node.blindData.level = node.blindData.closedPos;
                    }
                    if (node.blindData.level > node.blindData.openPos) {
                        node.debug(`${node.blindData.level} is above ${node.blindData.closedPos}`);
                        node.blindData.level = node.blindData.openPos;
                    }
                }
                node.debug(`result pos=${node.blindData.level} manual=${node.blindData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                setState();

                if ((node.blindData.level !== node.blindData.previous.level ||
                    node.reason.code !== node.blindData.previous.reasonCode ||
                    timeData.ruleId !== node.blindData.previous.timeRule ||
                    (msg.force === true)) &&
                    (!isNaN(node.blindData.level))) {
                    msg.payload = node.blindData.level;
                    msg.blindCtrl.blind = node.blindData;
                    msg.blindCtrl.time =  timeData;
                    if (config.topic) {
                        msg.topic = config.topic;
                    }
                    node.send(msg);
                }
                node.blindData.previous.timeRule = timeData.ruleId;
                return null;
            } catch (err) {
                node.error(RED._('blind-control.errors.internal', err));
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'internal error'
                });
            }
        });
        // ####################################################################################################
        // initialize
        function initialize() {
            node.debug('initialize');
            node.timeRulesLength = node.timeRules.length;
            for (let i = 0; i < node.timeRulesLength; ++i) {
                const rule = node.timeRules[i];
                rule.timeOp = Number(rule.timeOp);
                rule.pos = i + 1;
                rule.conditional = (rule.validOperandAType !== 'none');
                rule.timeLimited = (rule.timeType !== 'none');
                rule.temp = {};
            }
        }
        initialize();
    }

    RED.nodes.registerType('blind-control', sunBlindControlNode);

    RED.httpAdmin.get('/sun-position/js/*', RED.auth.needsPermission('sun-position.read'), (req, res) => {
        const options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });
};