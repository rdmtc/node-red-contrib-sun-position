/********************************************
 * sun-position:
 *********************************************/

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

// shortcuts for easier to read formulas

const PI = Math.PI,
    sin = Math.sin,
    cos = Math.cos,
    tan = Math.tan,
    asin = Math.asin,
    atan = Math.atan2,
    acos = Math.acos,
    rad = PI / 180;

const dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    J2000 = 2451545;

const e = rad * 23.4397; // obliquity of the Earth

/*
(c) 2011-2015, Vladimir Agafonkin
SunCalc is a JavaScript library for calculating sun/moon position and light phases.
https://github.com/mourner/suncalc
*/

// sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas


// date/time constants and conversions
function toJulian(date) {
    return date.valueOf() / dayMs - 0.5 + J1970;
}

function fromJulian(j) {
    return new Date((j + 0.5 - J1970) * dayMs);
}

function toDays(date) {
    return toJulian(date) - J2000;
}


// general calculations for position

function rightAscension(l, b) {
    return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
}

function declination(l, b) {
    return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
}

function azimuth(H, phi, dec) {
    return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
}

function altitude(H, phi, dec) {
    return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}

function siderealTime(d, lw) {
    return rad * (280.16 + 360.9856235 * d) - lw;
}

function astroRefraction(h) {
    if (h < 0) // the following formula works for positive altitudes only.
        h = 0; // if h = -0.08901179 a div/0 would occur.

    // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

// general sun calculations

function solarMeanAnomaly(d) {
    return rad * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(M) {

    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
        P = rad * 102.9372; // perihelion of the Earth

    return M + C + P + PI;
}

function sunCoords(d) {

    var M = solarMeanAnomaly(d),
        L = eclipticLongitude(M);

    return {
        dec: declination(L, 0),
        ra: rightAscension(L, 0)
    };
}

// moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

function moonCoords(d) { // geocentric ecliptic coordinates of the moon

    var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
        M = rad * (134.963 + 13.064993 * d), // mean anomaly
        F = rad * (93.272 + 13.229350 * d), // mean distance

        l = L + rad * 6.289 * sin(M), // longitude
        b = rad * 5.128 * sin(F), // latitude
        dt = 385001 - 20905 * cos(M); // distance to the moon in km

    return {
        ra: rightAscension(l, b),
        dec: declination(l, b),
        dist: dt
    };
}

function getConfiguration(node, msg, config) {
    let attrs = ['longitude', 'latitude', 'ts', 'azimuthWestLow', 'azimuthWestHigh', 'azimuthSouthLow', 'azimuthSouthHigh', 'azimuthEastLow', 'azimuthEastHigh', 'azimuthNorthLow', 'azimuthNorthHigh'];

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

    if ((typeof outMsg.data.ts === 'undefined') || !(outMsg.data.ts instanceof Date)) {
        outMsg.data.ts = new Date();
    }
    return outMsg;
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

                // calculates sun position for a given date and latitude/longitude
                let lw = rad * -outMsg.data.longitude;
                let phi = rad * outMsg.data.latitude;
                let days = toDays(outMsg.data.ts);
                let sunC = sunCoords(days);
                let sunH = siderealTime(days, lw) - sunC.ra;
                let sdist = 149598000; // distance from Earth to Sun in km

                this.debug('sunH=' + sunH + ' phi=' + phi + ' sunC.dec=' + sunC.dec + ' sunC.ra=' + sunC.ra);
                this.debug('sdist=' + sdist + ' days=' + days);

                //node.warn("sunCoords = " + JSON.stringify(sunC)+ " siderealTime="  + sunH + " lw=" + lw +" phi=" + phi );

                outMsg.payload.azimuth = azimuth(sunH, phi, sunC.dec) * 180 / PI + 180;
                outMsg.payload.elevation = altitude(sunH, phi, sunC.dec) * 180 / PI; //elevation = altitude;
                outMsg.payload.distance = sdist;

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

                // calculates sun position for a given date and latitude/longitude
                let lw = rad * -outMsg.data.longitude;
                let phi = rad * outMsg.data.latitude;
                let days = toDays(outMsg.data.ts);
                let sunC = sunCoords(days);
                //let sunH = siderealTime(days, lw) - sunC.ra;
                let sdist = 149598000; // distance from Earth to Sun in km

                this.debug('lw=' + lw + ' phi=' + phi + ' sunC.dec=' + sunC.dec + ' sunC.ra=' + sunC.ra);
                this.debug('sdist=' + sdist + ' days=' + days);

                let moonC = moonCoords(days),
                    moonH = siderealTime(days, lw) - moonC.ra;

                // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
                let moon_pa = atan(sin(moonH), tan(phi) * cos(moonC.dec) - sin(moonC.dec) * cos(moonH)),
                    moon_phi = acos(sin(sunC.dec) * sin(moonC.dec) + cos(sunC.dec) * cos(moonC.dec) * cos(sunC.ra - moonC.ra)),
                    moon_inc = atan(sdist * sin(phi), moonC.dist - sdist * cos(phi)),
                    moon_angle = atan(cos(sunC.dec) * sin(sunC.ra - moonC.ra), sin(sunC.dec) * cos(moonC.dec) -
                        cos(sunC.dec) * sin(moonC.dec) * cos(sunC.ra - moonC.ra));

                let moon_ele = altitude(moonH, phi, moonC.dec) //elevation = altitude
                moon_ele = moon_ele + astroRefraction(moon_ele); // elevation correction for refraction

                outMsg.payload.elevation = moon_ele * 180 / PI;
                outMsg.payload.azimuth = azimuth(moonH, phi, moonC.dec) * 180 / PI + 180;
                outMsg.payload.distance = moonC.dist;
                outMsg.payload.parallacticAngle = moon_pa;

                outMsg.payload.angle = moon_angle;
                outMsg.payload.fraction = (1 + cos(moon_inc)) / 2;
                outMsg.payload.phase = 0.5 + 0.5 * moon_inc * (moon_angle < 0 ? -1 : 1) / PI;

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