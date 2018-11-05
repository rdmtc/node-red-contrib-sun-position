/********************************************
 * sun-position:
 *********************************************/
const sunCalc = require('suncalc');
//const moment = require('moment');


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

/*******************************************************************************************************/
//const errorHandler = function (node, err, messageText, stateText) {
module.exports.errorHandler = (node, err, messageText, stateText) => {
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
//function getConfiguration(node, msg, config, attrs) {
module.exports.getConfiguration = (node, msg, config, attrs) => {
    var outMsg = {
        payload: {},
        topic: msg.topic,
        data: {},
        tsToday: false
    }

    if (!sunCalc) {
        this.error('sunCalc module not defined!! - Installation Problem, Please reinstall!');
        this.status({
            fill: 'red',
            shape: 'dot',
            text: 'installation error'
        });
        return null;
    }

    /*
    if (!moment) {
        this.error('moment module not defined!! - Installation Problem, Please reinstall!');
        this.status({
            fill: 'red',
            shape: 'dot',
            text: 'installation error'
        });
        return null;
    }*/

    if (node.positionConfig) {
        // Do something with:
        //  this.server.host
        //  this.server.port
        outMsg.data.name = node.positionConfig.name;
        outMsg.data.longitude = node.positionConfig.longitude;
        outMsg.data.latitude = node.positionConfig.latitude;
        outMsg.data.angleType = node.positionConfig.angleType;
        outMsg.data.azimuthWestLow = node.positionConfig.azimuthWestLow;
        outMsg.data.azimuthWestHigh = node.positionConfig.azimuthWestHigh;
        outMsg.data.azimuthSouthLow = node.positionConfig.azimuthSouthLow;
        outMsg.data.azimuthSouthHigh = node.positionConfig.azimuthSouthHigh;
        outMsg.data.azimuthEastLow = node.positionConfig.azimuthEastLow;
        outMsg.data.azimuthEastHigh = node.positionConfig.azimuthEastHigh;
        outMsg.data.azimuthNorthLow = node.positionConfig.azimuthNorthLow;
        outMsg.data.azimuthNorthHigh = node.positionConfig.azimuthNorthHigh;
        outMsg.data.cachProp = node.positionConfig.cachProp;
    }

    if (!attrs) {
        attrs = ['longitude', 'latitude', 'ts', 'angleType', 'azimuthWestLow', 'azimuthWestHigh', 'azimuthSouthLow', 'azimuthSouthHigh', 'azimuthEastLow', 'azimuthEastHigh', 'azimuthNorthLow', 'azimuthNorthHigh'];
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
        outMsg.tsToday = true;
    }

    if (outMsg.data.angleType === 'deg') {
        outMsg.data.angleType = 'deg';
    } else {
        outMsg.data.angleType = 'rad';
    }

    return outMsg;
}

//function getAngle(type, angle) {
module.exports.getAngle = (type, angle) => {
    if (type === 'deg') {
        return angle * (180 / Math.PI) //angle(rad) * (180° / Pi) =angle(deg)
    }
    return angle;
}

//function compareAzimuth(obj, name, azimuth, low, high, old) {
module.exports.compareAzimuth = (obj, name, azimuth, low, high, old) => {
    if (typeof low !== 'undefined' && low !== '' && !isNaN(low)) {
        if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
            if (high > low) {
                obj[name] = (azimuth > low) && (azimuth < high);
            } else {
                obj[name] = (azimuth > low) || (azimuth < high);
            }
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
/*

{"solarNoon":"2018-11-01T10:49:56.550Z",
"nadir":"2018-10-31T22:49:56.550Z",
"sunrise":"2018-11-01T05:58:13.904Z",
"sunset":"2018-11-01T15:41:39.196Z",
"sunriseEnd":"2018-11-01T06:01:54.246Z",
"sunsetStart":"2018-11-01T15:37:58.854Z",
"dawn":"2018-11-01T05:23:28.111Z",
"dusk":"2018-11-01T16:16:24.989Z",
"nauticalDawn":"2018-11-01T04:44:25.813Z",
"nauticalDusk":"2018-11-01T16:55:27.288Z",
"nightEnd":"2018-11-01T04:06:06.184Z",
"night":"2018-11-01T17:33:46.916Z",
"goldenHourEnd":"2018-11-01T06:47:04.923Z",
"goldenHour":"2018-11-01T14:52:48.178Z"}
*/

//const getSunCalc = (date, latitude, longitude, angleType) => {
module.exports.getSunCalc = (date, latitude, longitude, angleType) => {
    var sunPos = sunCalc.getPosition(date, latitude, longitude);
    return {
        lastUpdate: date,
        latitude: latitude,
        longitude: longitude,
        angleType: angleType,
        azimuth: (angleType === 'deg') ? 180 + 180 / Math.PI * sunPos.azimuth : sunPos.azimuth,
        altitude: (angleType === 'deg') ? 180 / Math.PI * sunPos.altitude : sunPos.altitude, //elevation = altitude
        times: sunCalc.getTimes(date, latitude, longitude)
    }
}

//const getMoonCalc = (date, latitude, longitude, angleType) => {
module.exports.getMoonCalc = (date, latitude, longitude, angleType) => {
    var moonPos = sunCalc.getMoonPosition(outMsg.data.ts, outMsg.data.latitude, outMsg.data.longitude);
    var moonIllum = sunCalc.getMoonIllumination(outMsg.data.ts);

    var result = {
        lastUpdate: date,
        latitude: latitude,
        longitude: longitude,
        angleType: angleType,
        azimuth: (outMsg.data.angleType === 'deg') ? 180 + 180 / Math.PI * moonPos.azimuth : moonPos.azimuth,
        altitude: (outMsg.data.angleType === 'deg') ? 180 / Math.PI * moonPos.altitude : moonPos.altitude, //elevation = altitude
        distance: moonPos.distance,
        parallacticAngle: getAngle(outMsg.data.angleType, moonPos.parallacticAngle),
        illumination: {
            angle: getAngle(outMsg.data.angleType, moonIllum.angle),
            fraction: moonIllum.fraction,
            phase: moonIllum.phase,
            phaseAngle: (outMsg.data.angleType === 'rad') ? (moonIllum.phase * 360) / (180 / Math.PI) : moonIllum.phase * 360,
            zenithAngle: getAngle(outMsg.data.angleType, moonIllum.angle - moonPos.parallacticAngle),
        },
        times: sunCalc.getMoonTimes(outMsg.data.ts, outMsg.data.latitude, outMsg.data.longitude, true)
    }
    //getAngle : angle / 57.2957795130823209 //angle(rad) * (180° / Pi) = angle(deg)

    if (moonIllum.phase < 0.01) {
        // 0            New Moon            -   Neumond(Phasenwinkel = 0°)
        result.illumination.phaseEmoji = moonPhases[0];
    } else if (moonIllum.phase < 0.25) {
        // 0 - 0.25     Waxing Crescent     -   erstes Viertel bzw.zunehmende Sichel(0° < Phasenwinkel < 90°),
        result.illumination.phaseEmoji = moonPhases[1];
    } else if (moonIllum.phase < 0.26) {
        // 0.25	        First Quarter       -   zunehmender Halbmond(astronomisch: erstes Viertel, Phasenwinkel = 90°),
        result.illumination.phaseEmoji = moonPhases[2];
    } else if (moonIllum.phase < 0.50) {
        // 0.25 - 0.5   Waxing Gibbous      -   zweites Viertel(90° < Phasenwinkel < 180°),
        result.illumination.phaseEmoji = moonPhases[3];
    } else if (moonIllum.phase < 0.51) {
        // 0.5	        Full Moon           -   Vollmond(Phasenwinkel = 180°),
        result.illumination.phaseEmoji = moonPhases[4];
    } else if (moonIllum.phase <= 0.75) {
        // 0.5 - 0.75    Waning Gibbous     -   drittes Viertel (180° < Phasenwinkel < 270°),
        result.illumination.phaseEmoji = moonPhases[5];
    } else if (moonIllum.phase < 0.76) {
        // 0.75	        Last Quarter        -   abnehmender Halbmond(astronomisch: letztes Viertel, Phasenwinkel = 270°),
        result.illumination.phaseEmoji = moonPhases[6];
    } else {
        // Waning Crescent                  -   letztes Viertel bzw.abnehmende Sichel(Phasenwinkel > 270°).
        result.illumination.phaseEmoji = moonPhases[7];
    }

    if (!result.times.alwaysUp) {
        //true if the moon never rises/sets and is always above the horizon during the day
        result.times.alwaysUp = false;
    }
    if (!result.times.alwaysDown) {
        //true if the moon is always below the horizon
        result.times.alwaysDown = false;
    }

    return result;
}

module.exports.getTimeOfText = (t, offset) => {
    let d = new Date();
    if (t) {
        let matches = t.match(/(0[0-9]|[0-9]|1[0-9]|2[0-3]|[0-9])(?::([0-5][0-9]|[0-9]))?(?::([0-5][0-9]|[0-9]))?\s*(p?)/);
        console.log(matches);
        d.setHours(parseInt(matches[1]) + (matches[4] ? 12 : 0));
        d.setMinutes(parseInt(matches[2]) || 0);
        d.setSeconds(parseInt(matches[3]) || 0);
        if (offset && !isNaN(offset) && offset !== 0) {
            d = new Date(d.getTime() + offset * 60000);
        }
    }
    return d;
}

module.exports.getSunTime = (config, d, t, offset) => {
    if (!config) {
        return d;
    }
    let chachedSunCalc = this.context().global.get(config.cachProp + 'sun');
    let needRefresh = (!chachedSunCalc || !chachedSunCalc.times);
    if (!needRefresh) {
        let oldd = new Date(chachedSunCalc.lastUpdate);
        needRefresh = (oldd.getDay != d.getDay);
    }

    if (needRefresh) {
        chachedSunCalc = hlp.getSunCalc(d, config.latitude, config.longitude, config.angleType);
        this.context().global.set(config.cachProp + 'sun', chachedSunCalc);
    }

    const date = new Date(chachedSunCalc.times[t]);
    if (offset && !isNaN(offset) && offset !== 0) {
        return new Date(date.getTime() + offset * 60000);
    }
    return date;
}

module.exports.getMoonTime = (config, d, t, offset) => {
    if (!config) {
        return d;
    }
    let chachedMoonCalc = this.context().global.get(config.cachProp + 'moon');
    let needRefresh = (!chachedMoonCalc || !chachedMoonCalc.times);
    if (!needRefresh) {
        let oldd = new Date(chachedMoonCalc.lastUpdate);
        needRefresh = (oldd.getDay != d.getDay);
    }

    if (needRefresh) {
        chachedMoonCalc = hlp.getMoonCalc(d, config.latitude, config.longitude, config.angleType);
        this.context().global.set(config.cachProp + 'moon', chachedMoonCalc);
    }

    const date = new Date(chachedMoonCalc.times[t]);
    if (offset && !isNaN(offset) && offset !== 0) {
        return new Date(date.getTime() + offset * 60000);
    }
    return date;
}