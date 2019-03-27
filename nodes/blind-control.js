/********************************************
 * blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

/*************************************************************************************************************************/

/**
  *
  */
function checkBlindPosOverwrite(node, msg) {
    if (hlp.getMsgBoolValue(msg, 'reset', 'reset', false)) {
        node.blindData.overwrite.expires = 0;
        node.blindData.overwrite.active = false;
    }

    if (hlp.getMsgBoolValue(msg, 'alarm', 'alarm', false)) {
        node.blindData.overwrite.expires = -1;
        node.blindData.overwrite.active = true;
        node.blindData.reasonCode = 1;
        node.blindData.reasonState = RED._('blindcontroller.states.alarm');
        node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.alarm');
        node.blindData.position = node.blindData.openPos;
    }

    if (node.blindData.overwrite.active && (node.blindData.overwrite.expires === -1)) {
        return true;
    }
    const now = node.time.now.getTime();
    node.blindData.overwrite.active = (node.blindData.overwrite.expires > now);
    let needOverwrite = false;

    let newPos = hlp.getMsgNumberValue(msg, 'blindPosition', 'manual');
    if (isNaN(newPos)) {
        newPos = hlp.getMsgNumberValue(msg, 'position', 'overwrite');
    }
    if (isNaN(newPos)) {
        newPos = node.blindData.position;
    } else {
        needOverwrite = true;
    }
    let expire = hlp.getMsgNumberValue(msg, 'expire', 'expire');
    if (isNaN(expire)) {
        expire = hlp.getMsgNumberValue(msg, 'blindPositionExpiry', 'posTime');
    }
    if (isNaN(expire)) {
        expire = node.blindData.overwrite.expireDuration;
    } else {
        needOverwrite = true;
    }

    if (needOverwrite) {
        if (!validPosition(newPos)) {
            node.error('Given Blind-Position "' + newPos + '" is not a valid Position!');
            return false;
        }
        if (expire === -1) {
            node.blindData.overwrite.expires = -1;
        } else {
            if (expire < 500) {
                expire = 500;
            }
            node.blindData.overwrite.expires = (now + expire);
        }
        node.blindData.position = newPos;
        node.blindData.overwrite.active = true;
        node.blindData.reasonCode = 2;
        node.blindData.reasonState = RED._('blindcontroller.states.overwrite');
        node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.overwrite');
        return true;
    }
    return false;
}

/**
 * check if a position has a valid value
 * @param {*} node the node data
 * @param {*} position the position to check
 * @returns {boolean} true if the position is valid, otherwise false
 */
function validPosition(node, position) {
    if (isNaN(position)) {
        return false;
    }
    if (position > node.blindData.closedPos) {
        return false;
    }
    if (node.blindData.position < node.blindData.openPos) {
        return false;
    }
    if (Number.isInteger(node.blindData.openPos) &&
        Number.isInteger(node.blindData.closedPos) &&
        Number.isInteger(node.blindData.increment) &&
        ((position % node.blindData.increment !== 0) ||
        !Number.isInteger(position) )) {
        return false;
    }
    return Number.isInteger(position / node.blindData.increment);
}

/******************************************************************************************/
/**
 * calculates for the blind the new position
 * @param {*} node the node data
 * @param {*} msg the message object
 * @param {*} blindData the blind data
 * @param {*} time the time data
 * @param {*} sunPosition the sun position
 * @param {*} weather the weather data
 */
function calcBlindPosition(node, sunPosition) {
    if (!sunPosition.isDay) {
        node.blindData.position = node.blindData.nightpos;
        node.blindData.reasonCode = 3;
        node.blindData.reasonState = RED._('blindcontroller.states.night');
        node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.night');
    } else if (node.tempData.nok) {
        node.blindData.position = node.tempData.blindPos;
        node.blindData.reasonCode = 8;
        node.blindData.reasonState = RED._('blindcontroller.states.tempExceeded');
        node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.tempExceeded');
    } else if (!sunPosition.InWindow) {
        node.blindData.position = node.sunData.notVisiblePos;
        node.blindData.reasonCode = 5;
        node.blindData.reasonState = RED._('blindcontroller.states.sunNotInWin');
        node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.sunNotInWin');
    } else if (node.sunData.active) {
        if (((node.sunData.minAltitude && sunPosition.altitudeDegrees >= node.sunData.minAltitude) ||
            !node.sunData.minAltitude) && !node.cloudData.nok) {
            const height = Math.tan(sunPosition.altitudeRadians) * node.sunData.floorLength;
            if (height <= node.windowSettings.bottom) {
                node.blindData.position = node.blindData.closedPos;
            } else if (height >= node.windowSettings.top) {
                node.blindData.position = node.blindData.openPos;
            } else {
                node.blindData.position = 100 * (1 - (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom));
                if (Number.isInteger(node.blindData.increment)) {
                    node.blindData.position = Math.ceil(node.blindData.position);
                    node.blindData.position = Math.ceil(node.blindData.position / node.blindData.increment) * node.blindData.increment;
                }
            }
            node.blindData.reasonCode = 6;
            node.blindData.reasonState = RED._('blindcontroller.states.sunCtrl');
            node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.sunCtrl');
        } else if (node.sunData.minAltitude && sunPosition.altitudeDegrees < node.sunData.minAltitude) {
            node.blindData.reasonCode = 4;
            node.blindData.reasonState = RED._('blindcontroller.states.sunMinAltitude');
            node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.sunMinAltitude');
        } else if (node.cloudData.nok) {
            node.blindData.position = node.cloudData.threshold;
            node.blindData.reasonCode = 7;
            node.blindData.reasonState = RED._('blindcontroller.states.cloudExceeded');
            node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.cloudExceeded');
        }
    } else if (node.cloudData.nok) {
        node.blindData.position = node.cloudData.threshold;
        node.blindData.reasonCode = 7;
        node.blindData.reasonState = RED._('blindcontroller.states.cloudExceeded');
        node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.cloudExceeded');
    } else {
        node.blindData.position = node.blindData.openPos;
        node.blindData.reasonCode = 8;
        node.blindData.reasonState = RED._('blindcontroller.states.openDef');
        node.blindData.reasonDescription = RED._('blindcontroller.reasonCodes.openDef');
    }

    if (node.blindData.position > node.blindData.closedPos) {
        node.blindData.position = node.blindData.closedPos;
    }
    if (node.blindData.position < node.blindData.openPos) {
        node.blindData.position = node.blindData.openPos;
    }
}


function calcWeather(node, msg) {
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

/**
   * the definition of the time to compare
   * @param {*} compareType type to compare
   * @param {*} msg the message object
   * @param {*} node the current node object
   */
function getDate(compareType, msg, node) {
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

/**
   * calculates the times
   * @param {*} node node data
   * @param {*} msg the message object
   * @param {*} config the configuration object
   */
function calcTimes(node, msg, config) {
    node.time = {
        now: getDate(config.tsCompare, msg, node),
        start: {},
        end: {},
        altStartTime: false,
        altEndTime: false
    };
    if ((node.propertyStartType !== 'none') && (msg || (node.propertyStartType !== 'msg'))) {
        try {
            const res = RED.util.evaluateNodeProperty(node.propertyStart, node.propertyStartType, node, msg);
            node.time.altStartTime = hlp.isTrue(res);
        } catch (err) {
            node.time.altStartTime = false;
            hlp.handleError(node, RED._('blind-control.errors.invalid-propertyStart-type', {
                type: node.propertyStartType,
                value: node.propertyStart
            }), err);
            node.debug(util.inspect(err));
        }
    }

    if ((node.propertyEndType !== 'none') && (msg || (node.propertyEndType !== 'msg'))) {
        try {
            const res = RED.util.evaluateNodeProperty(node.propertyEnd, node.propertyEndType, node, msg);
            node.time.altEndTime = hlp.isTrue(res);
        } catch (err) {
            node.time.altEndTime = false;
            hlp.handleError(node, RED._('blind-control.errors.invalid-propertyEnd-type', {
                type: node.propertyEndType,
                value: node.propertyEnd
            }), err);
            node.debug(util.inspect(err));
        }
    }

    if (node.time.altStartTime && config.startTimeAltType !== 'none') {
        node.time.start = node.positionConfig.getTimeProp(node, msg, config.startTimeAltType, config.startTimeAlt, config.startOffsetAlt, config.startOffsetAltType, config.startOffsetAltMultiplier);
    } else {
        node.time.start = node.positionConfig.getTimeProp(node, msg, config.startTimeType, config.startTime, config.startOffset, config.startOffsetType, config.startOffsetMultiplier);
    }

    if (node.time.altEndTime && config.endTimeAltType !== 'none') {
        node.time.end = node.positionConfig.getTimeProp(node, msg, config.endTimeAltType, config.endTimeAlt, config.endOffsetAlt, config.endOffsetAltType, config.endOffsetAltMultiplier);
    } else {
        node.time.end = node.positionConfig.getTimeProp(node, msg, config.endTimeType, config.endTime, config.endOffset, config.endOffsetType, config.endOffsetMultiplier);
    }
    node.time.startNr = hlp.getTimeNumber(node.time.start.value);
    node.time.endNr = hlp.getTimeNumber(node.time.end.value);
    node.time.cmpNow = hlp.getTimeNumber(node.time.now);
}

/**
 * calculates the current sun position
 * @param {*} node node data
 * @param {*} msg the message object
 * @param {*} config the configuration object
 * @param {*} time the time object
 * @param {*} blindData the blind Data
 */
function calcSunPosition(node) {
    const sunPosition = node.positionConfig.getSunCalc(node.time.now);
    // calc sunInSky:
    sunPosition.isDay = false;
    if (node.time.startNr < node.time.endNr) {
        sunPosition.isDay = (node.time.cmpNow >= node.time.startNr && node.time.cmpNow < node.time.endNr);
    } else {
        sunPosition.isDay = (!(node.time.cmpNow >= node.time.endNr && node.time.cmpNow < node.time.startNr));
    }
    sunPosition.InWindow = false;
    if (!sunPosition.isDay) {
        return sunPosition;
    }
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

module.exports = function (RED) {
    'use strict';

    function sunBlindControlNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
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
            /** an offset for the angle */
            angleOffsetStart: Number(hlp.chkValueFilled(config.windowAngleOffsetStart, 0)),
            /** an offset for the angle */
            angleOffsetEnd: Number(hlp.chkValueFilled(config.windowAngleOffsetEnd, 0))
        };
        this.sunData = {
            /** Defines if the sun control is active or not */
            active: hlp.chkValueFilled(config.sunControlActive,true),
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude,0)),
            /** position if sun is not in window */
            notVisiblePos: Number(hlp.chkValueFilled(config.blindPosSunnotVisible, (hlp.chkValueFilled(config.blindOpenPos, 100))))
        };
        this.blindData = {
            position: -1, // unknown
            increment: Number(hlp.chkValueFilled(config.blindIncrement,1)),
            openPos: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            closedPos: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            nightpos: Number(hlp.chkValueFilled(config.blindNightPos, (hlp.chkValueFilled(config.blindClosedPos, 0)))),
            overwrite : {
                active: false,
                expires: 0,
                expireDuration: Number(hlp.chkValueFilled(config.blindPosOverwriteExpire, 0)),
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
        const node = this;

        this.on('input', function (msg) {
            try {
                // calc times:
                calcTimes(this, msg, config);
                // check if the message contains any weather data
                calcWeather(this, msg);

                const previous = {
                    position: node.blindData.position,
                    reasonCode: node.blindData.reasonCode
                };
                // check for manual overwrite
                if (checkBlindPosOverwrite(this,msg)) {
                    // calc sun position:
                    const sunPosition = calcSunPosition(this);
                    msg.sunPosition = sunPosition;

                    if (!this.time.start.value || !this.time.end.value) {
                        throw new Error('Error can not calc time!');
                    }

                    if (!node.blindData.overwrite.active) {
                        calcBlindPosition(node, sunPosition);
                    }

                }

                if (node.blindData.position !== previous.position ||
                    node.blindData.reasonCode !== previous.reasonCode) {
                    msg.payload = node.blindData.position;
                    msg.blind = node.blindData;
                    msg.temp = node.tempData;
                    msg.cloud = node.cloudData;
                    if (config.topic) {
                        msg.topic = config.topic;
                    }
                    node.send(msg);

                    node.status({
                        fill: (node.blindData.reasonCode < 3) ? 'blue' :
                            ((node.blindData.reasonCode === 3) ? 'grey' :
                                ((node.blindData.reasonCode >= 7) ? 'green' : 'yellow')),
                        shape: node.blindData.position === node.blindData.openPos ? 'dot' : 'ring',
                        text: node.blindData.position + ' - ' + node.blindData.reasonState + ' (' + node.blindData.reasonCode + ')'
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