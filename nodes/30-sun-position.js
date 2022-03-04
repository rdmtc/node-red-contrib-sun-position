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
 * sun-position:
 *********************************************/
'use strict';
/** --- Type Defs ---
  * @typedef {import('./types/typedefs.js').runtimeRED} runtimeRED
  * @typedef {import('./types/typedefs.js').runtimeNode} runtimeNode
  * @typedef {import('./types/typedefs.js').runtimeNodeConfig} runtimeNodeConfig
  * @typedef {import("./10-position-config.js").IPositionConfigNode} IPositionConfigNode
  */

/**
 * @typedef {Object} ISunPositionNodeInstance Extensions for the nodeInstance object type
 * @property {IPositionConfigNode} positionConfig    -   tbd
 *
 * @property {string} topic output topic
 * @property {Array} rules output topic
 *
 * @property {*} start type of start value
 * @property {string} startType start value
 * @property {*} startOffset start offset value
 * @property {string} startOffsetType type of the start offset value
 * @property {number} startOffsetMultiplier start offset multipier
 *
 * @property {*} end type of end value
 * @property {string} endType end value
 * @property {*} endOffset end offset value
 * @property {string} endOffsetType type of the end offset value
 * @property {number} endOffsetMultiplier end offset multipier
 *
 * @property {*} azimuthPos end offset multipier
 */


/**
 * @typedef {ISunPositionNodeInstance & runtimeNode} ISunPositionNode Combine nodeInstance with additional, optional functions
 */
/******************************************************************************************/
/** Export the function that defines the node
 * @type {runtimeRED} */
module.exports = function (/** @type {runtimeRED} */ RED) {
    'use strict';
    const hlp = require('./lib/dateTimeHelper.js');
    const util = require('util');

    /******************************************************************************************/
    /**
     * standard Node-Red Node handler for the sunPositionNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function sunPositionNode(config) {
        RED.nodes.createNode(this, config);
        /** Copy 'this' object in case we need it in context of callbacks of other functions.
         * @type {ISunPositionNode}
         */
        // @ts-ignore
        const node = this;
        // Retrieve the config node
        node.positionConfig = RED.nodes.getNode(config.positionConfig);
        node.topic = config.topic || '';
        node.rules = config.rules || [];
        node.azimuthPos = {};
        node.start = config.start;
        node.startType = config.startType || 'none';
        node.startOffset = config.startOffset || 0;
        node.startOffsetType = config.startOffsetType || 'none';
        node.startOffsetMultiplier = config.startOffsetMultiplier || 60;
        node.end = config.end;
        node.endType = config.endType || 'none';
        node.endOffset = config.endOffset || 0;
        node.endOffsetType = config.endOffsetType || 'none';
        node.endOffsetMultiplier = config.endOffsetMultiplier || 60;

        if (!node.positionConfig) {
            node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
            node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
            return;
        }

        node.on('input', function (msg, send, done) {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                let errorStatus = '';
                const dNow = hlp.getNowTimeStamp(this, msg);

                if (!node.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
                    node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
                    done(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'), msg);
                    return null;
                }
                const ports = new Array(node.rules.length);

                ports[0] = RED.util.cloneMessage(msg);
                ports[0].payload = node.positionConfig.getSunCalc(dNow, true, false, msg.latitude || msg.lat,  msg.longitude || msg.lon);
                ports[0].topic = node.topic;
                if (!ports[0].payload.azimuth) {
                    // node.error('Azimuth could not calculated!');
                    send(ports); // node.send(ports);
                    done('Azimuth could not calculated!', msg);
                    return null;
                }

                ports[0].payload.pos = [];
                ports[0].payload.posChanged = false;
                if (node.startType !== 'none') {
                    // const startTime = node.positionConfig.getTimeProp(node, msg, node.startType, node.start, node.startOffsetType, node.startOffset, node.startOffsetMultiplier);
                    const startTime = node.positionConfig.getTimeProp(node, msg, {
                        type: node.startType,
                        value : node.start,
                        offsetType : node.startOffsetType,
                        offset : node.startOffset,
                        multiplier : node.startOffsetMultiplier,
                        now: dNow,
                        latitude: msg.latitude || msg.lat,
                        longitude: msg.longitude || msg.lon
                    });

                    node.debug('startTime: ' + util.inspect(startTime, { colors: true, compact: 10, breakLength: Infinity }));
                    if (startTime.error) {
                        errorStatus = 'could not evaluate start time';
                        node.error(startTime.error);
                        // node.debug('startTime: ' + util.inspect(startTime, { colors: true, compact: 10, breakLength: Infinity }));
                    } else {
                        ports[0].payload.startTime = startTime.value.getTime();
                    }
                }

                if (node.endType !== 'none') {
                    // const endTime = node.positionConfig.getTimeProp(node, msg, node.endType, node.end, node.endOffsetType, node.endOffset, node.endOffsetMultiplier);
                    const endTime = node.positionConfig.getTimeProp(node, msg, {
                        type: node.endType,
                        value : node.end,
                        offsetType : node.endOffsetType,
                        offset : node.endOffset,
                        multiplier : node.endOffsetMultiplier,
                        now: dNow,
                        latitude: msg.latitude || msg.lat,
                        longitude: msg.longitude || msg.lon
                    });

                    node.debug('endTime: ' + util.inspect(endTime, { colors: true, compact: 10, breakLength: Infinity }));
                    if (endTime.error) {
                        errorStatus = 'could not evaluate end time';
                        node.error(endTime.error);
                        // node.debug('endTime: ' + util.inspect(endTime, { colors: true, compact: 10, breakLength: Infinity }));
                    } else {
                        ports[0].payload.endTime = endTime.value.getTime();
                    }
                }

                if (ports[0].payload.startTime && ports[0].payload.endTime) {
                    const nowMillis = dNow.getTime();
                    ports[0].payload.sunInSky = nowMillis > ports[0].payload.startTime && nowMillis < ports[0].payload.endTime;
                }

                for (let i = 0; i < node.rules.length; i += 1) {
                    const rule = node.rules[i];
                    const low = getNumProp(node, msg, rule.valueLowType, rule.valueLow);
                    const high = getNumProp(node, msg, rule.valueHighType, rule.valueHigh);
                    const chk = hlp.checkLimits(ports[0].payload.azimuth, low, high);
                    const chg = (node.azimuthPos[i] !== chk);
                    ports[0].payload.pos.push(chk);
                    ports[0].payload.posChanged = ports[0].payload.posChanged && chg;
                    if (chk) {
                        ports[i + 1] = RED.util.cloneMessage(msg);
                        ports[i + 1].sunPos = chk;
                        ports[i + 1].posChanged = chg;
                        ports[i + 1].azimuth = ports[0].payload.azimuth;
                    }
                }
                node.azimuthPos = ports[0].payload.pos;

                if (errorStatus) {
                    node.status({
                        fill:   'red',
                        shape:  'dot',
                        text:   errorStatus
                    });
                } else if (ports[0].payload.startTime && ports[0].payload.endTime) {
                    if (ports[0].payload.sunInSky === true) {
                        node.status({
                            fill:   'yellow',
                            shape:  'dot',
                            text:   node.positionConfig.toTimeString(new Date(ports[0].payload.startTime)) + ' - ' +
                                    node.positionConfig.toTimeString(new Date(ports[0].payload.endTime))
                        });
                    } else {
                        node.status({
                            fill:   'blue',
                            shape:  'dot',
                            text:   node.positionConfig.toTimeString(new Date(ports[0].payload.startTime)) + ' - ' +
                                    node.positionConfig.toTimeString(new Date(ports[0].payload.endTime))
                        });
                    }
                } else {
                    let fill = 'red';
                    let text = 'no Data loaded!';

                    if (ports[0] && ports[0].payload && ports[0].payload.lastUpdate) {
                        const azimuth = (ports[0].payload.azimuth) ? ports[0].payload.azimuth.toFixed(2) : '?';
                        const altitude = (ports[0].payload.altitude) ? ports[0].payload.altitude.toFixed(2) : '?';
                        text = azimuth + '/' + altitude + ' - ' + node.positionConfig.toDateTimeString(ports[0].payload.lastUpdate);
                        fill = 'grey';
                    }
                    node.status({
                        fill,
                        shape:  'dot',
                        text
                    });
                }
                send(ports); // node.send(ports);
                done();
                return null;
            } catch (err) {
                node.log(err.message);
                node.log(util.inspect(err));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'internal error: ' + err.message
                });
                done('internal error sun-position:' + err.message, msg);
            }
            return null;
        });

        /**
         * get the value ofd a numeric property
         * @param {*} srcNode - source node
         * @param {*} msg - message object
         * @param {string} vType - type
         * @param {string} value - value
         * @returns {number} the result value for the type and value
         */
        function getNumProp(srcNode, msg, vType, value) {
            try {
                if (vType === 'none') {
                    return undefined;
                }
                return node.positionConfig.getFloatProp(node, msg, vType, value, 0);
            } catch (err) {
                return undefined;
            }
        }
    }

    RED.nodes.registerType('sun-position', sunPositionNode);
};