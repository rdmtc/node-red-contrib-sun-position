/********************************************
 * blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

/*************************************************************************************************************************/
/**
 * check if a position has a valid value
 * @param {*} node the node data
 * @param {*} position the position to check
 * @returns {boolean} true if the position is valid, otherwise false
 */
function validPosition_(node, position) {
    if (isNaN(position)) {
        node.debug('Position: "' + position + '" is NaN!');
        return false;
    }
    if (position < node.blindData.closedPos) {
        node.debug('Position: "' + position + '" < ' + node.blindData.closedPos);
        return false;
    }
    if (node.blindData.position > node.blindData.openPos) {
        node.debug('Position: "' + position + '" > ' + node.blindData.openPos);
        return false;
    }
    if (Number.isInteger(node.blindData.openPos) &&
        Number.isInteger(node.blindData.closedPos) &&
        Number.isInteger(node.blindData.increment) &&
        ((position % node.blindData.increment !== 0) ||
        !Number.isInteger(position) )) {
        node.debug('Position invalid "' + position + '" > ' + node.blindData.openPos);
        return false;
    }
    return Number.isInteger(position / node.blindData.increment);
}

/******************************************************************************************/
function checkWeather_(node, msg) {
    const maxTemp = hlp.getMsgNumberValue(msg, 'maxtemp', 'temp');
    if (!isNaN(maxTemp)) {
        node.weatherData.maxtemp = maxTemp;
    }
    node.tempData.nok = (node.weatherData.maxtemp && node.tempData.threshold) ? node.weatherData.maxtemp > node.tempData.threshold : false;

    const clouds = hlp.getMsgNumberValue(msg, 'clouds', 'cloud');
    if (!isNaN(clouds)) {
        node.weatherData.clouds = clouds;
    }
    node.cloudData.nok = (node.weatherData.clouds && node.cloudData.threshold) ? node.weatherData.clouds > node.cloudData.threshold : false;
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
    node.debug('compare time to ' + id + ' = "' + value + '"');
    const dto = new Date(msg.ts);
    if (dto !== 'Invalid Date' && !isNaN(dto)) {
        return dto;
    }
    node.error('Error can not get a valide timestamp from ' + id + '="' + value + '"! Will use current timestamp!');
    return new Date();
}

/******************************************************************************************/
/**
 * round a level to the next increment
 * @param {*} node node data
 * @param {number} pos position
 * @return {number} rounded position number
 */
function roundPos_(node, pos) {
    if (Number.isInteger(node.blindData.increment)) {
        pos = Math.ceil(pos);
        pos = Math.ceil(node.blindData.position / node.blindData.increment) * node.blindData.increment;
        return pos;
    }
    throw new Error('implementation needed for floating point number rounding to next increment');
}
/******************************************************************************************/
/**
 * calculates the current sun position
 * @param {*} node node data
 * @param {*} msg the message object
 * @param {*} config the configuration object
 * @param {*} time the time object
 * @param {*} blindData the blind Data
 */
function getSunPosition_(node, now) {
    const sunPosition = node.positionConfig.getSunCalc(now);
    // calc sunInSky:
    sunPosition.InWindow = false;
    if ((node.windowSettings.angle - node.windowSettings.angleOffsetStart) < 0) {
        if ( (360 + node.windowSettings.angle - node.windowSettings.angleOffsetStart <= sunPosition.altitudeDegrees) & (sunPosition.azimuthDegrees <= 360) ||
              (0 <= sunPosition.azimuthDegrees && sunPosition.azimuthDegrees <= node.windowSettings.angle + node.windowSettings.angleOffsetEnd)
        ) {
            sunPosition.InWindow = true;
        }
    } else if (node.windowSettings.angle + node.windowSettings.angleOffsetStart > 360) {
        if ( (0 <= sunPosition.azimuthDegrees) & (sunPosition.azimuthDegrees <= node.windowSettings.angle + node.windowSettings.angleOffsetStart - 360) ||
            (node.windowSettings.angle - node.windowSettings.angleOffsetEnd <= sunPosition.azimuthDegrees && sunPosition.azimuthDegrees <= 360)
        ) {
            sunPosition.InWindow = true;
        }
    } else {
        if ( (node.windowSettings.angle - node.windowSettings.angleOffsetEnd <= sunPosition.azimuthDegrees) &&
             (sunPosition.azimuthDegrees <= node.windowSettings.angle + node.windowSettings.angleOffsetStart)
        ) {
            sunPosition.InWindow = true;
        }
    }
    return sunPosition;
}
/******************************************************************************************/
module.exports = function (RED) {
    'use strict';
    function blindPosOverwriteReset(node) {
        if (node.blindData.overwrite.expires >= 0) {
            delete node.blindData.overwrite.expires;
            delete node.blindData.overwrite.expireNever;
            delete node.blindData.overwrite.expireDate;
            node.blindData.overwrite.active = false;
        }
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }
    }

    /**
      *
      */
    function checkBlindPosOverwrite(node, msg, now) {
        if (hlp.getMsgBoolValue(msg, 'alarm', 'alarm', false)) {
            blindPosOverwriteReset(node);
            node.blindData.overwrite.expireNever = true;
            node.blindData.overwrite.active = true;
            node.reason.Code = 1;
            node.reason.State = RED._('blind-control.states.overwriteAlarm');
            node.reason.Description = RED._('blind-control.reasons.overwriteAlarm');
            node.blindData.position = node.blindData.openPos;
            return true;
        }

        if (hlp.getMsgBoolValue(msg, 'reset', 'reset', false)) {
            blindPosOverwriteReset(node);
        }

        const nowTS = now.getTime();
        if (node.blindData.overwrite.active) {
            if (node.blindData.overwrite.expireNever) {
                return true;
            }
            if (!node.blindData.overwrite.expires || (node.blindData.overwrite.expires > nowTS)) {
                blindPosOverwriteReset(node);
            }
        }

        let needOverwrite = false;
        const newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position'], ['manual', 'overwrite'], () => {
            return node.blindData.position;
        }, () => {
            needOverwrite = true;
        });
        needOverwrite = needOverwrite || (node.blindData.position !== newPos);

        let expire = hlp.getMsgNumberValue(msg, 'expire', 'expire');
        if (isNaN(expire) || expire < 500) {
            expire = node.blindData.overwrite.expireDuration;
        } else {
            needOverwrite = true;
        }

        if (needOverwrite) {
            if (!validPosition_(node, newPos)) {
                node.error(RED._('invalid-blind-position', { pos: newPos }));
                return false;
            }
            node.blindData.position = newPos;
            node.blindData.overwrite.active = true;
            const prio = hlp.getMsgBoolValue(msg, 'prio', 'priority', false);
            if (prio || (expire < 500)) {
                node.blindData.overwrite.expireNever = true;
                node.reason.Code = 2;
                node.reason.State = RED._('blind-control.states.overwritePrio');
                node.reason.Description = RED._('blind-control.reasons.overwritePrio');
            } else {
                node.blindData.overwrite.expires = (now + expire);
                node.blindData.overwrite.expireDate = new Date(now + expire);
                node.debug('expires in ' + expire + 'ms = ' + node.blindData.overwrite.expireDate);
                if (node.timeOutObj) {
                    blindPosOverwriteReset(node);
                }
                node.timeOutObj = setTimeout(() => {
                    node.debug('overwrites expires');
                    blindPosOverwriteReset(node);
                    node.emit('retrigger', msg);
                }, expire);
                node.reason.Code = 3;
                node.reason.State = RED._('blind-control.states.overwrite');
                node.reason.Description = RED._('blind-control.reasons.overwrite', {
                    time: node.blindData.overwrite.expireDate.toISOString()
                });
            }
            return true;
        }
        return false;
    }

    /**
     * calculates for the blind the new position
     * @param {*} node the node data
     * @param {*} msg the message object
     */
    function calcBlindPosition(node, msg) {

        if (node.time.operator === 0) {
            node.blindData.position = node.time.level;
            node.reason.Code = 4;
            node.reason.State = RED._('blind-control.states.abs');
            node.reason.Description = RED._('blind-control.reasons.abs');
            return;
        } else if (node.tempData.nok) {
            node.blindData.position = node.tempData.blindPos;
            node.reason.Code = 9;
            node.reason.State = RED._('blind-control.states.tempExceeded');
            node.reason.Description = RED._('blind-control.reasons.tempExceeded');
        } else {
            const sunPosition = getSunPosition_(this, node.time.now);
            msg.sunPosition = sunPosition;
            if (!sunPosition.InWindow) {
                node.blindData.position = node.time.level;
                node.reason.Code = 6;
                node.reason.State = RED._('blind-control.states.sunNotInWin');
                node.reason.Description = RED._('blind-control.reasons.sunNotInWin');
            } else if (node.sunData.active) {
                if (((node.sunData.minAltitude && sunPosition.altitudeDegrees >= node.sunData.minAltitude) ||
                    !node.sunData.minAltitude) && !node.cloudData.nok) {
                    const height = Math.tan(sunPosition.altitudeRadians) * node.sunData.floorLength;
                    if (height <= node.windowSettings.bottom) {
                        node.blindData.position = node.blindData.closedPos;
                    } else if (height >= node.windowSettings.top) {
                        node.blindData.position = node.blindData.openPos;
                    } else {
                        node.blindData.position = roundPos_(node, 100 * (1 - (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom)));
                    }
                    node.reason.Code = 7;
                    node.reason.State = RED._('blind-control.states.sunCtrl');
                    node.reason.Description = RED._('blind-control.reasons.sunCtrl');
                } else if (node.sunData.minAltitude && sunPosition.altitudeDegrees < node.sunData.minAltitude) {
                    node.reason.Code = 5;
                    node.reason.State = RED._('blind-control.states.sunMinAltitude');
                    node.reason.Description = RED._('blind-control.reasons.sunMinAltitude');
                } else if (node.cloudData.nok) {
                    node.blindData.position = node.cloudData.threshold;
                    node.reason.Code = 8;
                    node.reason.State = RED._('blind-control.states.cloudExceeded');
                    node.reason.Description = RED._('blind-control.reasons.cloudExceeded');
                }
            } else if (node.cloudData.nok) {
                node.blindData.position = node.cloudData.threshold;
                node.reason.Code = 8;
                node.reason.State = RED._('blind-control.states.cloudExceeded');
                node.reason.Description = RED._('blind-control.reasons.cloudExceeded');
            } else {
                node.blindData.position = node.time.level;
                node.reason.Code = 10;
                node.reason.State = RED._('blind-control.states.openDef');
                node.reason.Description = RED._('blind-control.reasons.openDef');
            }
        }
        if ((node.time.operator === 1) && (node.blindData.position < node.time.level))  {
            // min
            node.blindData.position = node.time.level;
        } else if ((node.time.operator === 2) && (node.blindData.position > node.time.level)) {
            // max
            node.blindData.position = node.time.level;
        }
        if (node.blindData.position > node.blindData.closedPos) {
            node.blindData.position = node.blindData.closedPos;
        }
        if (node.blindData.position < node.blindData.openPos) {
            node.blindData.position = node.blindData.openPos;
        }
    }

    /**
       * calculates the times
       * @param {*} node node data
       * @param {*} msg the message object
       * @param {*} config the configuration object
       */
    function calcTimes(node, msg, config, now) {
        const nowNr = hlp.getTimeNumber(now);
        const rulesLength = node.timeRules.length;
        for (let i = 0; i < rulesLength; ++i) {
            const rule = node.timeRules[i];
            let operatorValid = true;
            if (rule.propertyType !== 'none') {
                const res = RED.util.evaluateNodeProperty(rule.propertyValue, rule.propertyType, node, msg);
                operatorValid = hlp.toBoolean(res);
            }
            if (operatorValid) {
                node.time.switchTime = node.positionConfig.getTimeProp(node, msg, rule.timeType, rule.timeValue, rule.offsetValue, rule.offsetType, rule.multiplier);
                if (node.time.switchTime.error) {
                    hlp.handleError(node, RED._('blind-control.errors.error-time', { message: node.time.switchTime.error }), undefined, node.time.switchTime.error);
                    continue;
                } else if (!node.time.switchTime.value) {
                    throw new Error('Error can not calc time!');
                }
                node.time.switchTimeNr = hlp.getTimeNumber(node.time.switchTime.value);
                if (node.time.switchTimeNr > nowNr) {
                    node.time.level = node.blindData.openPos;
                    if (rule.levelType !== 'levelFixed') {
                        if (rule.levelValue === 'closed (min)') {
                            node.time.level = node.blindData.closedPos;
                        } else if (rule.levelValue === '~75%') {
                            node.time.level = roundPos_(((node.blindData.openPos - node.blindData.closedPos) * 0.75) + node.blindData.closedPos);
                        } else if (rule.levelValue === '~50%') {
                            node.time.level = roundPos_(((node.blindData.openPos - node.blindData.closedPos) * 0.5) + node.blindData.closedPos);
                        } else if (rule.levelValue === '~25%') {
                            node.time.level = roundPos_(((node.blindData.openPos - node.blindData.closedPos) * 0.25) + node.blindData.closedPos);
                        }
                    } else {
                        node.time.level = node.positionConfig.getFloatProp(node, msg, rule.levelType, rule.levelValue);
                    }
                    node.time.operator = Number(rule.operator);
                    return;
                }
            }
        }
        node.time.operator = 2; // max
        node.time.level = node.blindData.openPos;
        delete node.time.switchTime;
        delete node.time.switchTimeNr;
    }

    function sunBlindControlNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.reason = {
            Code : 0,
            State: '',
            Description: ''
        };
        // Retrieve the config node
        this.windowSettings = {
            /** The Height of the window */
            height: Number(config.windowHeight),
            /** The bottom of the window */
            bottom: Number(config.windowBottom),
            /** The top of the window */
            top: Number(config.windowBottom) + Number(config.windowHeight),
            /** the orientation to the geographical north */
            angle: Number(config.windowOrientation),
            /** an offset for the angle anti-clockwise offset */
            angleOffsetStart: Number(hlp.chkValueFilled(config.windowAngleOffsetStart, 0)),
            /** an offset for the angle clockwise offset */
            angleOffsetEnd: Number(hlp.chkValueFilled(config.windowAngleOffsetEnd, 0))
        };
        this.sunData = {
            /** Defines if the sun control is active or not */
            active: hlp.chkValueFilled(config.sunControlActive,true),
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude,0)),
            isDay: false
        };
        this.blindData = {
            position: -1, // unknown
            increment: Number(hlp.chkValueFilled(config.blindIncrement,1)),
            openPos: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            closedPos: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            /** position if sun is not in window */
            overwrite : {
                active: false,
                expireDuration: Number(hlp.chkValueFilled(config.blindPosOverwriteExpire, 0)) * Number(hlp.chkValueFilled(config.blindPosOverwriteExpireMultiplier, 60000)),
                alarm: false
            }
        };
        this.tempData = {
            threshold: config.tempThreshold,
            blindPos: Number(hlp.chkValueFilled(config.tempBlindPos, undefined)),
            ok: true
        };
        this.cloudData = {
            threshold: config.cloudThreshold,
            blindPos: Number(hlp.chkValueFilled(config.cloudBlindPos, undefined)),
            ok: true
        };
        this.weatherData = {
            /** forecast of the max temp of the day */
            maxtemp : -1,
            /** percentage 0 - 100 of the sky occluded by clouds */
            clouds : 0
        };
        this.timeRules = config.rules;
        this.time = {};
        const node = this;

        this.on('input', function (msg) {
            try {
                msg.reason = node.reason;
                node.time.now = getNow_(node, msg, config.tsCompare);
                // check if the message contains any weather data
                checkWeather_(this, msg);

                const previous = {
                    position: node.blindData.position,
                    reasonCode: node.reason.Code
                };
                // check for manual overwrite
                if (checkBlindPosOverwrite(this, msg, node.time.now)) {
                    // calc times:
                    calcTimes(this, msg, config, node.time.now);
                    // calc sun position:
                    calcBlindPosition(node, msg);
                }

                if (node.blindData.position !== previous.position ||
                    node.reason.Code !== previous.reasonCode) {
                    msg.payload = node.blindData.position;
                    msg.blind = node.blindData;
                    msg.temp = node.tempData;
                    msg.cloud = node.cloudData;
                    if (config.topic) {
                        msg.topic = config.topic;
                    }
                    node.send(msg);

                    node.status({
                        fill: (node.reason.Code <= 3) ? 'blue' :
                            ((node.reason.Code === 4) ? 'grey' :
                                ((node.reason.Code >= 8) ? 'green' : 'yellow')),
                        shape: node.blindData.position === node.blindData.openPos ? 'dot' : 'ring',
                        text: node.blindData.position + ' - ' + node.reason.State + ' (' + node.reason.Code + ')'
                    });
                }
                return null;
            } catch (err) {
                node.error(err.message);
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'internal error'
                });
            }
        });
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