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
        node.debug(`Position: "${level}" is NaN!`);
        return false;
    }
    if (level < node.blindData.closedPos) {
        node.debug(`Position: "${level}" < ${node.blindData.closedPos}`);
        return false;
    }
    if (node.blindData.level > node.blindData.openPos) {
        node.debug(`Position: "${level}" > ${node.blindData.openPos}`);
        return false;
    }
    if (Number.isInteger(node.blindData.openPos) &&
        Number.isInteger(node.blindData.closedPos) &&
        Number.isInteger(node.blindData.increment) &&
        ((level % node.blindData.increment !== 0) ||
        !Number.isInteger(level) )) {
        node.debug(`Position invalid "${level}" > ${node.blindData.openPos}`);
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
            return;
        }
        try {
            const val = node.positionConfig.getFloatProp(node, msg, node.cloudData.valueType, node.cloudData.value);
            if (val) {
                node.cloudData.actValue = val;
                node.cloudData.inLimit = (node.cloudData.threshold) ? val <= node.cloudData.threshold : true;
            }
        } catch (err) {
            node.error(RED._('blind-control.errors.getCloudData', err));
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        msg.cloud = node.cloudData;
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
            return node.positionConfig.getFloatProp(node, msg, type, value);
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
        node.blindData.nextchange = 0;
        if (node.blindData.overwrite.expires) {
            delete node.blindData.overwrite.expires;
            delete node.blindData.overwrite.expireNever;
            delete node.blindData.overwrite.expireDate;
        }
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }
    }

    /**
     * check if a manual overwrite of the blind level should be set
     * @param {*} node node data
     * @param {*} msg message object
     */
    function checkBlindPosOverwrite(node, msg, now) {
        node.debug(`checkBlindPosOverwrite act=${node.blindData.overwrite.active}`);
        hlp.getMsgBoolValue(msg, 'reset', 'reset',
            (val) => {
                if (val) {
                    blindPosOverwriteReset(node);
                }
            });

        const prio = hlp.getMsgBoolValue(msg, ['prio', 'priority', 'alarm'], ['prio', 'alarm']);
        if (node.blindData.overwrite.active && !prio && node.blindData.overwrite.expireNever) {
            return true;
        }
        const newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position', 'level', 'blindlevel'], ['manual', 'overwrite'], undefined, -1);
        let expire = hlp.getMsgNumberValue(msg, 'expire', 'expire', undefined, -10);
        if (prio || (newPos > -1) || (expire > -10)) {
            node.debug(`needOverwrite prio=${prio} expire=${expire} newPos=${newPos}`);
            if (newPos > -1) {
                if (!validPosition_(node, newPos)) {
                    node.error(RED._('blind-control.errors.invalid-blind-level', { pos: newPos }));
                    return false;
                }
                node.debug(`overwrite newPos=${newPos}`);
                const noSameValue = hlp.getMsgBoolValue(msg, ['ignoreSameValue', 'noSameValue'], ['ignoreSameValue', 'noSameValue']);
                if (noSameValue && (node.blindData.previous.level === newPos)) {
                    return true;
                }
                node.blindData.level = newPos;
            }
            if (prio || (expire === 0) || (expire === -1)) {
                node.blindData.overwrite.expireNever = true;
                node.blindData.overwrite.active = true;
                node.reason.Code = 2;
                node.reason.State = RED._('blind-control.states.overwritePrio');
                node.reason.Description = RED._('blind-control.reasons.overwritePrio');

                // node.blindData.level
            } else {
                if (node.timeOutObj) {
                    blindPosOverwriteReset(node);
                }
                expire = (expire < 10) ? node.blindData.overwrite.expireDuration : expire;
                node.blindData.overwrite.active = true;
                node.blindData.overwrite.expires = (now.getTime() + expire);
                node.blindData.overwrite.expireDate = new Date(node.blindData.overwrite.expires);
                node.debug(`expires in ${expire}ms = ${node.blindData.overwrite.expireDate}`);
                node.timeOutObj = setTimeout(() => {
                    node.debug('timeout overwrites expires');
                    blindPosOverwriteReset(node);
                    node.emit('input', {});
                }, expire);
                node.reason.Code = 3;
                node.reason.State = RED._('blind-control.states.overwrite', {
                    time: node.blindData.overwrite.expireDate.toLocaleTimeString()
                });
                node.reason.Description = RED._('blind-control.reasons.overwrite', {
                    time: node.blindData.overwrite.expireDate.toISOString()
                });
            }
            return true;
        }
        if (node.blindData.overwrite.active) {
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
    function calcBlindPosition(node, msg, timeData) {
        // node.debug('calcBlindPosition');
        if (timeData.levelFixed || !node.sunData.active) {
            node.debug(`absolute time pos=${node.blindData.level} reason=${node.reason.Code} description=${node.reason.Description}`);
            return;
        }
        // sun control is active
        const sunPosition = getSunPosition_(node, timeData.now);
        msg.sunPosition = sunPosition;
        if (!sunPosition.InWindow) {
            node.blindData.level = timeData.level;
            node.reason.Code = 6;
            node.reason.State = RED._('blind-control.states.sunNotInWin');
            node.reason.Description = RED._('blind-control.reasons.sunNotInWin');
            return;
        }
        checkWeather(node, msg);

        if (node.cloudData.inLimit &&
                    (!node.sunData.minAltitude ||
                    (sunPosition.altitudeDegrees >= node.sunData.minAltitude))) {
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
            if ((node.smoothTime > 0) && (node.blindData.nextchange > timeData.now.getTime())) {
                node.debug(`no change smooth - smoothTime= ${node.smoothTime}  nextchange= ${node.blindData.nextchange}`);
                node.reason.Code = 10;
                node.reason.State = RED._('blind-control.states.smooth', { pos: node.blindData.level.toString()});
                node.reason.Description = RED._('blind-control.reasons.smooth', { pos: node.blindData.level.toString()});
                node.blindData.level = node.blindData.previous.level;
            } else {
                node.reason.Code = 7;
                node.reason.State = RED._('blind-control.states.sunCtrl');
                node.reason.Description = RED._('blind-control.reasons.sunCtrl');
                node.blindData.nextchange = timeData.now.getTime() + node.smoothTime;
                // node.debug(`set next time - smoothTime= ${node.smoothTime}  nextchange= ${node.blindData.nextchange} now=` + timeData.now.getTime());
            }
        } else if (node.sunData.minAltitude && (sunPosition.altitudeDegrees < node.sunData.minAltitude)) {
            node.reason.Code = 5;
            node.reason.State = RED._('blind-control.states.sunMinAltitude');
            node.reason.Description = RED._('blind-control.reasons.sunMinAltitude');
        } else if (!node.cloudData.inLimit) {
            node.blindData.level = node.cloudData.blindPos;
            node.reason.Code = 8;
            node.reason.State = RED._('blind-control.states.cloudExceeded');
            node.reason.Description = RED._('blind-control.reasons.cloudExceeded');
        }
        node.debug(`calcBlindPosition end pos=${node.blindData.level} reason=${node.reason.Code} description=${node.reason.Description}`);
    }
    /******************************************************************************************/
    /**
       * calculates the times
       * @param {*} node node data
       * @param {*} msg the message object
       * @param {*} config the configuration object
       */
    function calcTimes(node, msg, timeData) {
        const nowNr = hlp.getTimeNumber(timeData.now);
        const rulesLength = node.timeRules.length;
        const rulesx=[];
        let ruleSel = null;
        timeData.levelMin = node.blindData.closedPos;
        timeData.levelMinType = 0;
        timeData.levelMax = node.blindData.openPos;
        timeData.levelMaxType = 0;
        // prepare
        for (let i = 0; i < rulesLength; ++i) {
            const rule = node.timeRules[i];
            rule.levelOp = Number(rule.levelOp);
            rule.timeOp = Number(rule.timeOp);
            rule.pos = i + 1;
            // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 1) + ' - ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.propertyType !== 'none') {
                try {
                    const res = RED.util.evaluateNodeProperty(rule.propertyValue, rule.propertyType, node, msg);
                    if (!hlp.isTrue(res)) {
                        continue;
                    }
                } catch (err) {
                    node.warn(RED._('blind-control.errors.getPropertyData', err));
                    node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                    continue;
                }
            }
            if (rule.timeType === 'none') {
                rulesx.push(rule);
                continue;
            }
            rule.switchTime = node.positionConfig.getTimeProp(node, msg, rule.timeType, rule.timeValue, rule.offsetValue, rule.offsetType, rule.multiplier);
            if (rule.switchTime.error) {
                hlp.handleError(node, RED._('blind-control.errors.error-time', { message: rule.switchTime.error }), undefined, rule.switchTime.error);
                continue;
            } else if (!rule.switchTime.value) {
                throw new Error('Error can not calc time!');
            }
            rule.switchTime.num = hlp.getTimeNumber(rule.switchTime.value);
            rulesx.push(rule);
            continue;
        }

        const rulesxLength = rulesx.length;
        // node.debug(`calcTimes nowNr=${nowNr}, rulesCount=${rulesLength}`); // {colors:true, compact:10}
        const fkt = (rule, cmp) => {
            if (rule.timeType === 'none') {
                return rule;
            }
            if (cmp(rule.switchTime.num, nowNr)) {
                return rule;
            }
            return null;
        };
        // node.debug('first loop ' + rulesLength);
        for (let i = 0; i < rulesxLength; ++i) {
            const rule = rulesx[i];
            // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 1) + ' - ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.timeOp !== 0) { continue; }
            const res = fkt(rule, (r,h) => (r >= h));
            if (res) {
                if (res.levelOp === 0) {
                    ruleSel = res;
                    break;
                } else if (res.levelOp === 1 && (timeData.levelMinType !== 1)) {
                    timeData.levelMin = getBlindPosFromTI(node, msg, res.levelType, res.levelValue, node.blindData.defaultPos);
                    timeData.levelMinType = 2;
                } else if (res.levelOp === 2 && (timeData.levelMaxType !== 1)) {
                    timeData.levelMax = getBlindPosFromTI(node, msg, res.levelType, res.levelValue, node.blindData.defaultPos);
                    timeData.levelMaxType = 2;
                }
            }
        }

        // node.debug('second loop ' + rulesLength);
        for (let i = (rulesxLength -1); i >= 0; --i) {
            const rule = rulesx[i];
            // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 1) + ' - ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.timeOp === 0) { continue; }
            const res = fkt(rule, (r,h) => (r <= h));
            if (res) {
                if (res.levelOp === 0) {
                    ruleSel = res;
                    break;
                } else if ((res.levelOp === 1) && (timeData.levelMinType !== 2)) {
                    timeData.levelMin = getBlindPosFromTI(node, msg, res.levelType, res.levelValue, node.blindData.defaultPos);
                    timeData.levelMinType = 2;
                } else if ((res.levelOp === 2) && (timeData.levelMaxType !== 2)) {
                    timeData.levelMax = getBlindPosFromTI(node, msg, res.levelType, res.levelValue, node.blindData.defaultPos);
                    timeData.levelMaxType = 2;
                }
            }
        }

        if (ruleSel) {
            // node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10}));
            if (ruleSel.timeType !== 'none') {
                ruleSel.text = ruleSel.timeOpText + ' ' + ruleSel.switchTime.value.toLocaleTimeString();
            }
            if (ruleSel.propertyType !== 'none') {
                ruleSel.text += '*';
            }
            node.debug(timeData.text);
            timeData.levelFixed = true;
            timeData.level = getBlindPosFromTI(node, msg, ruleSel.levelType, ruleSel.levelValue, node.blindData.defaultPos);
            node.blindData.level = timeData.level;
            node.reason.Code = 4;
            node.reason.State = RED._('blind-control.states.time', ruleSel);
            node.reason.Description = RED._('blind-control.reasons.time', ruleSel);
            // node.debug('timeData=' + util.inspect(timeData,{colors:true, compact:10}));
            return;
        }
        timeData.levelFixed = false;
        timeData.level = node.blindData.defaultPos;
        node.blindData.level = node.blindData.defaultPos;
        node.reason.Code = 1;
        node.reason.State = RED._('blind-control.states.default');
        node.reason.Description = RED._('blind-control.reasons.default');
        // node.debug('timeData default ' + util.inspect(timeData, {colors:true, compact:10}));
    }
    /******************************************************************************************/
    /******************************************************************************************/
    function sunBlindControlNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.interval = parseFloat(config.interval) || 0;
        this.once = config.once;
        this.onceDelay = (parseFloat(config.onceDelay) || 0);
        this.smoothTime = (parseFloat(config.smoothTime) || 0);
        const node = this;
        if (node.interval >= 0x7FFFFFFF) {
            node.error(RED._('blind-control.errors.intervaltoolong', this));
            delete node.interval;
        }
        if (node.smoothTime >= 0x7FFFFFFF) {
            node.error(RED._('blind-control.errors.smoothTimeToolong', this));
            delete node.smoothTime;
        }

        node.reason = {
            Code : 0,
            State: '',
            Description: ''
        };
        // Retrieve the config node
        node.sunData = {
            /** Defines if the sun control is active or not */
            active: hlp.chkValueFilled(config.sunControlActive,true),
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude,0)),
            isDay: false
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
            level: -1, // unknown
            increment: Number(hlp.chkValueFilled(config.blindIncrement,1)),
            openPos: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            closedPos: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            defaultPos: NaN,
            /** level if sun is not in window */
            overwrite : {
                active: false,
                value: config.overwriteValue || '',
                valueType: config.overwriteValueType || 'none',
                valuePrio: config.overwritePrioValue || '',
                valuePrioType: config.overwritePrioValueType || 'none',
                expireDuration: parseFloat(hlp.chkValueFilled(config.overwriteExpire, 0)),
                alarm: false
            },
            nextchange:0
        };
        node.blindData.defaultPos = getBlindPosFromTI(node, undefined, config.blindDefaultPosType, config.blindDefaultPos, node.blindData.openPos);
        node.cloudData = {
            active: (typeof config.cloudValueType !== 'undefined') && (config.cloudValueType !== 'none'),
            value: config.cloudValue || '',
            valueType: config.cloudValueType || 'none',
            actValue: 100,
            threshold: config.cloudThreshold,
            thresholdValue: 100,
            blindPos: getBlindPosFromTI(node, undefined, config.cloudBlindPosType, config.cloudBlindPos, node.blindData.openPos),
            inLimit: true
        };
        node.timeRules = config.rules || [];

        function setState() {
            let code = node.reason.Code;
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
                text: node.blindData.level.toString() + ' - ' + node.reason.State
            });
        }

        this.on('input', function (msg) {
            try {
                node.debug('input');
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
                node.blindData.previous = {
                    level: node.blindData.level,
                    reasonCode: node.reason.Code
                };
                msg.reason = node.reason;
                const timeData = { now : getNow_(node, msg, config.tsCompare) };
                // check if the message contains any weather data

                // check for manual overwrite
                if (!checkBlindPosOverwrite(node, msg, timeData.now)) {
                    // calc times:
                    calcTimes(node, msg, timeData);
                    // calc sun position:
                    calcBlindPosition(node, msg, timeData);

                    if (node.blindData.level < timeData.levelMin)  {
                        // min
                        node.debug(`${node.blindData.level} is below ${timeData.levelMin} (min)`);
                        node.blindData.level = timeData.levelMin;
                    } else if (node.blindData.level > timeData.levelMax) {
                        // max
                        node.debug(`${node.blindData.level} is above ${timeData.levelMax} (max)`);
                        node.blindData.level = timeData.levelMax;
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
                node.debug(`result pos=${node.blindData.level} manual=${node.blindData.overwrite.active} reasoncode=${node.reason.Code} description=${node.reason.Description}`);
                setState();

                if (node.blindData.level !== node.blindData.previous.level ||
                    node.reason.Code !== node.blindData.previous.reasonCode) {
                    msg.payload = node.blindData.level;
                    msg.blind = node.blindData;
                    msg.time =  timeData;
                    if (config.topic) {
                        msg.topic = config.topic;
                    }
                    node.send(msg);
                }
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
        node.repeaterSetup = function () {
            if (this.interval && !isNaN(this.interval) && this.interval > 200) {
                this.interval_id = setInterval(() => {
                    node.emit('input', {});
                }, this.interval);
            }
        };

        if (this.once) {
            this.onceTimeout = setTimeout(() => {
                node.emit('input',{});
                node.repeaterSetup();
            }, this.onceDelay);
        } else {
            node.repeaterSetup();
        }

        sunBlindControlNode.prototype.close = function() {
            if (this.onceTimeout) {
                clearTimeout(this.onceTimeout);
            }
            if (this.interval_id !== null) {
                clearInterval(this.interval_id);
            }
        };
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