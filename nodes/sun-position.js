/********************************************
 * sun-position:
 *********************************************/
const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));

module.exports = function (RED) {
    "use strict";

    function sunPositionNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);

        this.on('input', function (msg) {
            try {
                var outMsg = {
                    payload: {},
                    topic: msg.topic,
                    data: {},
                    tsToday: false
                }
                outMsg.payload = this.positionConfig.getSunCalc(this, msg);
                if (!outMsg.payload.azimuth) {
                    this.error('Azimuth could not calculated!');
                    this.send(outMsg);
                    return;
                }
                if (outMsg.tsToday && (this.propertyType != 'none') && (this.property != '')) { //https://www.sonnenverlauf.de/
                    let oldvalue = this.context().global.get('sunpos');
                    if (hlp.compareAzimuth(outMsg.payload, 'west', outMsg.payload.azimuth, outMsg.data.azimuthWestLow, outMsg.data.azimuthWestHigh, oldvalue) ||
                        hlp.compareAzimuth(outMsg.payload, 'south', outMsg.payload.azimuth, outMsg.data.azimuthSouthLow, outMsg.data.azimuthSouthHigh, oldvalue) ||
                        hlp.compareAzimuth(outMsg.payload, 'east', outMsg.payload.azimuth, outMsg.data.azimuthEastLow, outMsg.data.azimuthEastHigh, oldvalue) ||
                        hlp.compareAzimuth(outMsg.payload, 'north', outMsg.payload.azimuth, outMsg.data.azimuthNorthLow, outMsg.data.azimuthNorthHigh, oldvalue)) {
                        outMsg.payload.exposureChanged = true;
                        this.context().global.set('sunpos', outMsg.payload);
                    }
                } else {
                    hlp.compareAzimuth(outMsg.payload, 'west', outMsg.payload.azimuth, outMsg.data.azimuthWestLow, outMsg.data.azimuthWestHigh, oldvalue);
                    hlp.compareAzimuth(outMsg.payload, 'south', outMsg.payload.azimuth, outMsg.data.azimuthSouthLow, outMsg.data.azimuthSouthHigh, oldvalue);
                    hlp.compareAzimuth(outMsg.payload, 'east', outMsg.payload.azimuth, outMsg.data.azimuthEastLow, outMsg.data.azimuthEastHigh, oldvalue);
                    hlp.compareAzimuth(outMsg.payload, 'north', outMsg.payload.azimuth, outMsg.data.azimuthNorthLow, outMsg.data.azimuthNorthHigh, oldvalue);
                    outMsg.payload.exposureChanged = true;
                }
                this.context().global.set(outMsg.data.cachProp, outMsg.payload);

                this.send(outMsg);
                /********************************************
                 * versenden:
                 *********************************************/
                var outMsg = hlp.getConfiguration(this, msg, config);
                //-------------------------------------------------------------------
                if (typeof outMsg === 'undefined' || outMsg === null) {
                    this.debug('configuration is wrong!?!');
                    return;
                }
                outMsg.data.cachProp += 'sun';

                outMsg.payload = positionConfig
                outMsg.payload = hlp.getSunCalc(outMsg.data.ts, outMsg.data.latitude, outMsg.data.longitude, outMsg.data.angleType);
                if (!outMsg.payload.azimuth) {
                    this.error('Azimuth could not calculated!');
                    this.send(outMsg);
                    return;
                }

                if (outMsg.tsToday && (this.propertyType != 'none') && (this.property != '')) { //https://www.sonnenverlauf.de/
                    let oldvalue = this.context().global.get('sunpos');
                    if (hlp.compareAzimuth(outMsg.payload, 'west', outMsg.payload.azimuth, outMsg.data.azimuthWestLow, outMsg.data.azimuthWestHigh, oldvalue) ||
                        hlp.compareAzimuth(outMsg.payload, 'south', outMsg.payload.azimuth, outMsg.data.azimuthSouthLow, outMsg.data.azimuthSouthHigh, oldvalue) ||
                        hlp.compareAzimuth(outMsg.payload, 'east', outMsg.payload.azimuth, outMsg.data.azimuthEastLow, outMsg.data.azimuthEastHigh, oldvalue) ||
                        hlp.compareAzimuth(outMsg.payload, 'north', outMsg.payload.azimuth, outMsg.data.azimuthNorthLow, outMsg.data.azimuthNorthHigh, oldvalue)) {
                        outMsg.payload.exposureChanged = true;
                        this.context().global.set('sunpos', outMsg.payload);
                    }
                } else {
                    hlp.compareAzimuth(outMsg.payload, 'west', outMsg.payload.azimuth, outMsg.data.azimuthWestLow, outMsg.data.azimuthWestHigh, oldvalue);
                    hlp.compareAzimuth(outMsg.payload, 'south', outMsg.payload.azimuth, outMsg.data.azimuthSouthLow, outMsg.data.azimuthSouthHigh, oldvalue);
                    hlp.compareAzimuth(outMsg.payload, 'east', outMsg.payload.azimuth, outMsg.data.azimuthEastLow, outMsg.data.azimuthEastHigh, oldvalue);
                    hlp.compareAzimuth(outMsg.payload, 'north', outMsg.payload.azimuth, outMsg.data.azimuthNorthLow, outMsg.data.azimuthNorthHigh, oldvalue);
                    outMsg.payload.exposureChanged = true;
                }
                this.context().global.set(outMsg.data.cachProp, outMsg.payload);

                this.send(outMsg);
            } catch (err) {
                hlp.errorHandler(this, err, 'Exception occured on sun-position', 'internal error');
            }
            //this.error("Input parameter wrong or missing. You need to setup (or give in the input message) the 'url' and 'content type' or the 'message' and 'language'!!");
            //this.status({fill:"red",shape:"dot",text:"error - input parameter"});
        });
    }

    RED.nodes.registerType('sun-position', sunPositionNode);
};