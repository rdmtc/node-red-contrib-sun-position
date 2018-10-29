/********************************************
 * sun-position:
 *********************************************/
const sunCalc = require('suncalc');

/*******************************************************************************************************/
const errorHandler = function (node, err, messageText, stateText) {
    if (!err) {
        return true;
    }
    if (err.message) {
        let msg = err.message.toLowerCase();
        messageText += ':' + err.message;
    } else {
        messageText += '! (No error message given!)';
    }

    if (node) {
        node.error(messageText);
        node.debug(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        node.status({
            fill: "red",
            shape: "ring",
            text: stateText
        });
    } else if (console) {
        console.error(messageText);
        console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
    return false;
}
/*******************************************************************************************************/

const moonPhases = [{
        emoji: '🌚',
        code: ':new_moon_with_face:',
        name: 'New Moon',
        weight: 1
    },
    {
        emoji: '🌒',
        code: ':waxing_crescent_moon:',
        name: 'Waxing Crescent',
        weight: 6.3825
    },
    {
        emoji: '🌓',
        code: ':first_quarter_moon:',
        name: 'First Quarter',
        weight: 1
    },
    {
        emoji: '🌔',
        code: ':waxing_gibbous_moon:',
        name: 'Waxing Gibbous',
        weight: 6.3825
    },
    {
        emoji: '🌝',
        code: ':full_moon_with_face:',
        name: 'Full Moon',
        weight: 1
    },
    {
        emoji: '🌖',
        code: ':waning_gibbous_moon:',
        name: 'Waning Gibbous',
        weight: 6.3825
    },
    {
        emoji: '🌗',
        code: ':last_quarter_moon:',
        name: 'Last Quarter',
        weight: 1
    },
    {
        emoji: '🌘',
        code: ':waning_crescent_moon:',
        name: 'Waning Crescent',
        weight: 6.3825
    }
];

function getConfiguration(node, msg, config) {
    let attrs = ['longitude', 'latitude', 'ts', 'angleType', 'azimuthWestLow', 'azimuthWestHigh', 'azimuthSouthLow', 'azimuthSouthHigh', 'azimuthEastLow', 'azimuthEastHigh', 'azimuthNorthLow', 'azimuthNorthHigh'];

    var outMsg = {
        payload: {},
        topic: msg.topic,
        data: {},
    }

    for (let attr of attrs) {
        if (config[attr]) {
            outMsg.data[attr] = config[attr];
        }
        if (msg[attr]) {
            outMsg.data[attr] = msg[attr];
        }
    }

    if (typeof msg.payload === 'object') {
        for (let attr of attrs) {
            if (msg.payload[attr]) {
                outMsg.data[attr] = msg.payload[attr];
            }
        }
    } else if ((typeof outMsg.data.ts === 'undefined') && ((typeof msg.payload === 'string') || (msg.payload instanceof Date))) {
        let dto = new Date(msg.payload);
        if (dto !== "Invalid Date" && !isNaN(dto)) {
            outMsg.data.ts = dto;
        }
    }
    //-------------------------------------------------------------------
    if (typeof outMsg.data.latitude === 'undefined' || outMsg.data.latitude === '' || isNaN(outMsg.data.latitude)) {
        node.error("configuraton error: latitude is missing!");
        node.status({
            fill: "red",
            shape: "dot",
            text: "No Region given!"
        });
        return null;
    }

    if (typeof outMsg.data.longitude === 'undefined' || outMsg.data.longitude === '' || isNaN(outMsg.data.longitude)) {
        node.error("configuraton error: longitude is missing!");
        node.status({
            fill: "red",
            shape: "dot",
            text: "No Region given!"
        });
        return null;
    }
    if (typeof outMsg.data.ts === 'string') {
        let dto = new Date(outMsg.data.ts);
        if (dto !== "Invalid Date" && !isNaN(dto)) {
            outMsg.data.ts = dto;
        }
    }

    if ((typeof outMsg.data.ts === 'undefined') || !(outMsg.data.ts instanceof Date)) {
        outMsg.data.ts = new Date();
    }

    if (outMsg.data.angleType === 'deg') {
        outMsg.data.angleType = 'deg';
    } else {
        outMsg.data.angleType = 'rad';
    }

    return outMsg;
}

function getAngle(type, angle) {
    if (type === 'deg') {
        return angle * 57.2957795130823209 //angle(rad) * (180° / Pi) =angle(deg)
    }
    return angle;
}

function getAngleRad(type, angle) {
    if (type === 'deg') {
        return angle;
    }
    return angle / 57.2957795130823209 //angle(rad) * (180° / Pi) =angle(deg)
}

function compareAzimuth(obj, name, azimuth, low, high, old) {
    if (typeof low !== 'undefined' && low !== '' && !isNaN(low)) {
        if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
            obj[name] = (azimuth > low) && (azimuth < high);
        } else {
            obj[name] = (azimuth > low);
        }
        return obj[name] != old[name];
    } else if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
        obj[name] = (azimuth < high);
        return obj[name] != old[name];
    }
    return false;
}

module.exports = function (RED) {
    function sunPositionNode(config) {
        RED.nodes.createNode(this, config);

        this.on('input', function (msg) {
            try {
                if (!sunCalc) {
                    this.error('sunCalc not defined!! - Installation Problem, Please reinstall!');
                    this.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'installation error'
                    });
                    return;
                }
                /********************************************
                 * versenden:
                 *********************************************/
                //var creds = RED.nodes.getNode(config.creds); - not used
                var outMsg = getConfiguration(this, msg, config);
                //-------------------------------------------------------------------
                if (typeof outMsg === 'undefined' || outMsg === null) {
                    this.debug('configuration is wrong!?!');
                    return;
                }
                var sunPos = sunCalc.getPosition(outMsg.data.ts, outMsg.data.latitude, outMsg.data.longitude);

                outMsg.payload.azimuth = getAngle(outMsg.data.angleType, sunPos.azimuth);
                outMsg.payload.elevation = getAngle(outMsg.data.angleType, sunPos.altitude); //elevation = altitude;

                outMsg.payload.times = sunCalc.getTimes(outMsg.data.ts, outMsg.data.latitude, outMsg.data.longitude);

                if (!outMsg.payload.azimuth) {
                    this.error('Azimuth could not calculated!');
                    this.send(outMsg);
                    return;
                }

                //https://www.sonnenverlauf.de/
                let oldvalue = this.context().get("sunpos");
                if (compareAzimuth(outMsg.payload, 'west', outMsg.payload.azimuth, outMsg.data.azimuthWestLow, outMsg.data.azimuthWestHigh, oldvalue) ||
                    compareAzimuth(outMsg.payload, 'south', outMsg.payload.azimuth, outMsg.data.azimuthSouthLow, outMsg.data.azimuthSouthHigh, oldvalue) ||
                    compareAzimuth(outMsg.payload, 'east', outMsg.payload.azimuth, outMsg.data.azimuthEastLow, outMsg.data.azimuthEastHigh, oldvalue) ||
                    compareAzimuth(outMsg.payload, 'north', outMsg.payload.azimuth, outMsg.data.azimuthNorthLow, outMsg.data.azimuthNorthHigh, oldvalue)) {
                    outMsg.payload.exposureChanged = true;
                }
                this.context().set("sunpos", msg.payload);
                this.send(outMsg);
            } catch (err) {
                errorHandler(this, err, 'Exception occured on get german holidays', 'internal error');
            }
            //this.error("Input parameter wrong or missing. You need to setup (or give in the input message) the 'url' and 'content type' or the 'message' and 'language'!!");
            //this.status({fill:"red",shape:"dot",text:"error - input parameter"});
        });
    }

    RED.nodes.registerType('sun-position', sunPositionNode);

    function moonPositionNode(config) {
        RED.nodes.createNode(this, config);

        this.on('input', function (msg) {
            try {
                if (!sunCalc) {
                    this.error('sunCalc not defined!! - Installation Problem, Please reinstall!');
                    this.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'installation error'
                    });
                    return;
                }
                /********************************************
                 * versenden:
                 *********************************************/
                //var creds = RED.nodes.getNode(config.creds); - not used
                var outMsg = getConfiguration(this, msg, config);
                //-------------------------------------------------------------------
                if (typeof outMsg === 'undefined' || outMsg === null) {
                    this.debug('configuration is wrong!?!');
                    return;
                }

                var moonPos = sunCalc.getMoonPosition(outMsg.data.ts, outMsg.data.latitude, outMsg.data.longitude);
                outMsg.payload.altitude = getAngle(outMsg.data.angleType, moonPos.altitude);
                outMsg.payload.azimuth = getAngle(outMsg.data.angleType, moonPos.azimuth);
                outMsg.payload.distance = moonPos.distance;
                outMsg.payload.parallacticAngle = getAngle(outMsg.data.angleType, moonPos.parallacticAngle);

                var moonIllum = sunCalc.getMoonIllumination(outMsg.data.ts);
                outMsg.payload.illumination = {
                    angle: getAngle(outMsg.data.angleType, moonIllum.angle),
                    fraction: moonIllum.fraction,
                    phase: moonIllum.phase,
                    phaseAngle: getAngleRad(outMsg.data.angleType, moonIllum.phase * 360),
                    zenithAngle: getAngle(outMsg.data.angleType, moonIllum.angle - moonPos.parallacticAngle),
                }

                if (moonIllum.phase < 0.01) {
                    // 0            New Moon            -   Neumond(Phasenwinkel = 0°)
                    outMsg.payload.illumination.phaseEmoji = moonPhases[0];
                } else if (moonIllum.phase < 0.25) {
                    // 0 - 0.25     Waxing Crescent     -   erstes Viertel bzw.zunehmende Sichel(0° < Phasenwinkel < 90°),
                    outMsg.payload.illumination.phaseEmoji = moonPhases[1];
                } else if (moonIllum.phase < 0.26) {
                    // 0.25	        First Quarter       -   zunehmender Halbmond(astronomisch: erstes Viertel, Phasenwinkel = 90°),
                    outMsg.payload.illumination.phaseEmoji = moonPhases[2];
                } else if (moonIllum.phase < 0.50) {
                    // 0.25 - 0.5   Waxing Gibbous      -   zweites Viertel(90° < Phasenwinkel < 180°),
                    outMsg.payload.illumination.phaseEmoji = moonPhases[3];
                } else if (moonIllum.phase < 0.51) {
                    // 0.5	        Full Moon           -   Vollmond(Phasenwinkel = 180°),
                    outMsg.payload.illumination.phaseEmoji = moonPhases[4];
                } else if (moonIllum.phase <= 0.75) {
                    // 0.5 - 0.75    Waning Gibbous     -   drittes Viertel (180° < Phasenwinkel < 270°),
                    outMsg.payload.illumination.phaseEmoji = moonPhases[5];
                } else if (moonIllum.phase < 0.76) {
                    // 0.75	        Last Quarter        -   abnehmender Halbmond(astronomisch: letztes Viertel, Phasenwinkel = 270°),
                    outMsg.payload.illumination.phaseEmoji = moonPhases[6];
                } else {
                    // Waning Crescent                  -   letztes Viertel bzw.abnehmende Sichel(Phasenwinkel > 270°).
                    outMsg.payload.illumination.phaseEmoji = moonPhases[7];
                }

                var moonTimes = sunCalc.getMoonTimes(outMsg.data.ts, outMsg.data.latitude, outMsg.data.longitude, true);
                outMsg.payload.times = moonTimes;
                if (!outMsg.payload.times.alwaysUp) {
                    //true if the moon never rises/sets and is always above the horizon during the day
                    outMsg.payload.times.alwaysUp = false;
                }
                if (!outMsg.payload.times.alwaysDown) {
                    //true if the moon is always below the horizon
                    outMsg.payload.times.alwaysDown = false;
                }

                this.send(outMsg);

            } catch (err) {
                errorHandler(this, err, 'Exception occured on get german holidays', 'internal error');
            }
            //this.error("Input parameter wrong or missing. You need to setup (or give in the input message) the 'url' and 'content type' or the 'message' and 'language'!!");
            //this.status({fill:"red",shape:"dot",text:"error - input parameter"});
        });
    }

    RED.nodes.registerType('moon-position', moonPositionNode);
};