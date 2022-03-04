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
 * delay-until:
 *********************************************/
'use strict';
/** --- Type Defs ---
  * @typedef {import('./types/typedefs.js').runtimeRED} runtimeRED
  * @typedef {import('./types/typedefs.js').runtimeNode} runtimeNode
  * @typedef {import('./types/typedefs.js').runtimeNodeConfig} runtimeNodeConfig
  * @typedef {import("./lib/dateTimeHelper.js").ITimeObject} ITimeObject
  * @typedef {import("./lib/dateTimeHelper.js").ILimitationsObj} ILimitationsObj
  * @typedef {import("./10-position-config.js").ITypedValue} ITypedValue
  * @typedef {import("./10-position-config.js").IValuePropertyType} IValuePropertyType
  * @typedef {import("./10-position-config.js").ITimePropertyType} ITimePropertyType
  * @typedef {import("./10-position-config.js").IPositionConfigNode} IPositionConfigNode
  * @typedef {import("./10-position-config.js").ITimePropertyResult} ITimePropertyResult
  */

/**
 * @typedef {Object} IDUPropertyTypeInst
 * @property {*} compare - valid days
 *
 * @typedef {ITypedValue & IDUPropertyTypeInst} IDUPropertyType
 */

/**
 * @typedef {Object} IDelayUntilNodeInstance Extensions for the nodeInstance object type
 * @property {IPositionConfigNode} positionConfig    -   tbd
 *
 * @property {ITimePropertyType} timeData       -   time definition
 * @property {('all'|'first'|'last')} queuingBehavior           -   kind of queue messages
 * @property {IDUPropertyType} flushMsgs        -   flush mesage control property definition
 * @property {IDUPropertyType} dropMsgs         -   drop mesage control property definition
 * @property {IDUPropertyType} enqueueMsg       -   enqueue mesage control property definition
 * @property {ITypedValue} ctrlProp             -   control property handling
 *
 * @property {number} tsCompare                 -   base time definition
 *
 * @property {Array} msgQueue                   -   the message queue
 *
 * @property {NodeJS.Timer} delayTimer          -   the message queue
 *
 * @property {ITimePropertyResult} nextTime     -   next time object
 * @property {boolean} nextTimeIntermedia       -   indicator if intermedia node state
 * @property {boolean} calcByMsg                -   indicator if time is calculared by message
 *
 */

/**
 * @typedef {IDelayUntilNodeInstance & runtimeNode} IDelayUntilNode Combine nodeInstance with additional, optional functions
 */
/******************************************************************************************/
/** Export the function that defines the node
 * @type {runtimeRED} */
module.exports = function (/** @type {runtimeRED} */ RED) {
    'use strict';
    /**
     * standard Node-Red Node handler for the rdgDelayUntilNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function rdgDelayUntilNode(config) {
        const util = require('util');

        const hlp = require('./lib/dateTimeHelper.js');

        RED.nodes.createNode(this, config);
        /** Copy 'this' object in case we need it in context of callbacks of other functions.
         * @type {IDelayUntilNode}
         */
        // @ts-ignore
        const node = this;
        // Retrieve the config node
        node.positionConfig = RED.nodes.getNode(config.positionConfig);
        // node.debug('initialize rdgDelayUntilNode ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        if (!node.positionConfig) {
            node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
            node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
            return null;
        }
        if (node.positionConfig.checkNode(
            error => {
                node.error(error);
                node.status({fill: 'red', shape: 'dot', text: error });
            }, false)) {
            return null;
        }
        node.timeData = {
            type: config.timeType,
            value : config.time,
            offsetType : config.offsetType || 'none',
            offset : config.offset,
            multiplier : config.offsetMultiplier || 60000,
            next: true
        };
        node.calcByMsg = (config.timeType === 'msg' ||
            config.timeType === 'flow' ||
            config.timeType === 'global');
        if (node.timeData.type === 'jsonata') {
            try {
                node.timeData.expr = node.positionConfig.getJSONataExpression(node, node.timeData.value);
            } catch (err) {
                node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                node.timeData.expr = null;
            }
        }
        node.queuingBehavior = config.queuingBehavior;
        if (config.flushMsgsType && config.flushMsgsType !== 'none') {
            node.flushMsgs = {
                type: config.flushMsgsType,
                value : config.flushMsgs,
                compare : RED.util.evaluateNodeProperty(config.flushMsgsValue, config.flushMsgsValueType, node)
            };
        }
        if (config.dropMsgsType && config.dropMsgsType !== 'none') {
            node.dropMsgs = {
                type: config.dropMsgsType,
                value : config.dropMsgs,
                compare : RED.util.evaluateNodeProperty(config.dropMsgsValue, config.dropMsgsValueType, node)
            };
        }
        if (config.enqueueMsgType && config.enqueueMsgType !== 'none') {
            node.enqueueMsg = {
                type: config.enqueueMsgType,
                value : config.enqueueMsg,
                compare : RED.util.evaluateNodeProperty(config.enqueueMsgValue, config.enqueueMsgValueType, node)
            };
        }
        if (config.ctrlPropChange === 'true' || config.ctrlPropChange === true) {
            node.ctrlProp = {
                type: config.ctrlPropValueType || 'delete',
                value : config.ctrlPropValue
            };
        }
        node.tsCompare = parseInt(config.tsCompare) || 0;

        node.msgQueue = [];

        node.on('input', (msg, send, done) => {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                node.debug('--------- delay-until - input');
                if (!node.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
                    node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
                    return null;
                }

                // this.debug('starting ' + util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity }));
                // this.debug('self ' + util.inspect(this, { colors: true, compact: 10, breakLength: Infinity }));
                if (node.flushMsgs) {
                    try {
                        const result = RED.util.evaluateNodeProperty(node.flushMsgs.value, node.flushMsgs.type, node, msg);
                        if (result == node.flushMsgs.compare) { // eslint-disable-line eqeqeq
                            node.debug(`flush queue control property ${node.flushMsgs.value}=${result}`);
                            flushEntireQueue();
                            clearTimer();
                            handleEnqueue(msg, done, node.flushMsgs);
                            setStatus();
                            done();
                            return null;
                        }
                    } catch(_err) {
                        node.debug(_err);
                    }
                }
                if (node.dropMsgs) {
                    try {
                        const result = RED.util.evaluateNodeProperty(node.dropMsgs.value, node.dropMsgs.type, node, msg);
                        if (result == node.dropMsgs.compare) { // eslint-disable-line eqeqeq
                            node.debug(`flush queue control property ${node.dropMsgs.value}=${result}`);
                            dropEntireQueue();
                            clearTimer();
                            handleEnqueue(msg, done, node.dropMsgs);
                            setStatus();
                            done();
                            return null;
                        }
                    } catch(_err) {
                        node.debug(_err);
                    }
                }
                addMsgToQueue(msg, done);
                setStatus();
                return null;
            } catch (err) {
                node.log(err.message);
                node.log(util.inspect(err));
                node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
                done('internal error delay-until until:' + err.message, msg);
            }
            return null;
        });

        node.on('close', () => {
            clearTimer();
        });

        /**
        * @typedef {Object} queueObject
        * @property {*} msg - the message to send
        * @property {*} done - the done function
        */

        /**
         * get the Data for compare Date
         * @param {number} comparetype - type of compare
         * @param {*} msg - message object
         * @param {*} node - node object
         * @returns {*} Date value
         */
        function getIntDate(comparetype, msg, node) {
            let id = '';
            let value = '';
            switch (comparetype) {
                case 1:
                    id = 'msg.ts';
                    value = msg.ts;
                    break;
                case 2:
                    id = 'msg.lc';
                    value = msg.lc;
                    break;
                case 3:
                    id = 'msg.time';
                    value = msg.time;
                    break;
                default:
                    return new Date();
            }
            node.debug('compare time to ' + id + ' = "' + value + '"');
            const dto = new Date(value);
            if (hlp.isValidDate(dto)) {
                return dto;
            }
            node.error('Error can not get a valid timestamp from ' + id + '="' + value + '"! Will use current timestamp!');
            return new Date();
        }

        /**
         * clears all tmers
         */
        function clearTimer() {
            if (node.delayTimer) {
                node.debug('clear timer');
                clearTimeout(node.delayTimer);
                delete node.delayTimer;
                delete node.nextTime;
            }
        }

        /**
         * send all messages in queue
         */
        function flushEntireQueue() {
            node.debug('flushEntireQueue - Flush all queued messages');

            while (node.msgQueue.length > 0) {
                const item = node.msgQueue.shift();
                node.send(item.msg);
                item.done();
            }
        }

        /**
         * drop all messages from queue
         */
        function dropEntireQueue() {
            node.debug('dropEntireQueue - Drop all queued messages');
            while (node.msgQueue.length > 0) {
                const item = node.msgQueue.shift();
                item.done();
            }
        }

        /**
         * get the schedule time
         * @param {queueObject} qObj - message queue Object
         * @returns {boolean} returns true if ok
         */
        function recalcTimeOut(qObj) {
            if (node.delayTimer) {
                clearTimer();
            }
            const dNow = getIntDate(node.tsCompare, qObj.msg, node);

            node.nextTime = node.positionConfig.getTimeProp(node, qObj.msg, node.timeData, dNow);
            if (node.nextTime.error) {
                node.debug('node.nextTime=' + util.inspect(node.nextTime, { colors: true, compact: 10, breakLength: Infinity }));
                hlp.handleError(node, node.nextTime.error, null, 'could not evaluate time');
                return;

            }
            let millisec = hlp.getTimeOut(dNow, node.nextTime.value);
            // let millisec = node.nextTime.value.valueOf() - dNow.valueOf();
            node.debug(`set timeout to ${node.nextTime.value.valueOf()} - ${dNow.valueOf()}`);
            // while (millisec < 1) {
            //    millisec += 86400000; // 24h
            // }
            if (millisec > 345600000) {
                // there is a limitation of nodejs that the maximum setTimeout time
                // should not more then 2147483647 ms (24.8 days).
                millisec = Math.min((millisec - 129600000), 2147483646);
                // node.debug('next inject is far far away, plan a inject time recalc in ' + millisec + ' ms');
                node.delayTimer = setTimeout(() => {
                    delete node.delayTimer;
                    recalcTimeOut(qObj);
                }, millisec); // 1,5 days before
                node.nextTimeIntermedia = true;
            } else {
                node.debug('set timeout to ' + millisec);
                node.delayTimer = setTimeout(() => {
                    delete node.delayTimer;
                    flushEntireQueue();
                    setStatus();
                }, millisec);
            }
            setStatus();
        }

        /**
         * adds a new message tot he queue
         * @param {*} msg - message object
         * @param {*} done - done object
         */
        function addMsgToQueue(msg, done) {
            if (node.queuingBehavior === 'first' && node.msgQueue.length > 0) {
                done();
                return;
            }
            if (node.queuingBehavior === 'last') {
                dropEntireQueue();
            }
            node.debug('test 3');
            const qObj = {msg, done};
            node.msgQueue.push(qObj);
            node.debug('test 4');
            if (!node.delayTimer || node.calcByMsg) {
                recalcTimeOut(qObj);
            }
        }

        /**
         * adds a new message tot he queue
         * @param {Object} msg - message object
         * @param {*} done - done object
         * @param {Object} ctrlProp - control property object
         */
        function handleEnqueue(msg, done, ctrlProp) {
            try {
                if (node.enqueueMsg) {
                    const enqueue = RED.util.evaluateNodeProperty(node.enqueueMsg.value, node.enqueueMsg.type, node, msg);
                    if (enqueue == node.enqueueMsg.compare) { // eslint-disable-line eqeqeq
                        if (node.ctrlProp) {
                            if (node.ctrlProp.type === 'delete') {
                                RED.util.setMessageProperty(msg, ctrlProp.value);
                                RED.util.setMessageProperty(msg, node.enqueueMsg.value);
                            } else {
                                const data = RED.util.evaluateNodeProperty(node.ctrlProp.value, node.ctrlProp.type, node, msg);
                                RED.util.setMessageProperty(msg, ctrlProp.value, data, true);
                                RED.util.setMessageProperty(msg, node.enqueueMsg.value, data, true);
                            }
                        }
                        addMsgToQueue(msg, done);
                    }
                }
            } catch(_err) {
                node.debug(_err);
            }
        }


        /**
         * adds a new message tot he queue
         */
        function setStatus() {
            if (node.msgQueue.length > 0) {
                try {
                    if (node.nextTime) {
                        node.debug('set state ' + util.inspect(node.nextTime, { colors: true, compact: 10, breakLength: Infinity }));
                        if (node.nextTime.error ) {
                            node.status({fill: 'red', shape: 'ring', text: node.nextTime.error });
                        } else if (node.nextTimeIntermedia) {
                            node.status({
                                fill: 'yellow',
                                shape: 'dot',
                                text: RED._('delay-until.state.intermedia', {
                                    queueLength:    node.msgQueue.length,
                                    sendTime:       node.positionConfig.toDateTimeString(node.nextTime.value)
                                })
                            });
                        } else {
                            node.status({
                                fill: 'green',
                                shape: 'dot',
                                text: RED._('delay-until.state.default', {
                                    queueLength:    node.msgQueue.length,
                                    sendTime:       node.positionConfig.toDateTimeString(node.nextTime.value)
                                })
                            });
                        }
                    } else {
                        node.status({
                            fill: 'green',
                            shape: 'dot',
                            text: RED._('delay-until.state.noTime', {
                                queueLength:    node.msgQueue.length
                            })
                        });
                    }
                } catch(_err) {
                    node.error(_err.message);
                    node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
                }
            } else {
                node.status({});
            }
        }
        node.status({});
        return null;
    }

    RED.nodes.registerType('rdg-delay-until', rdgDelayUntilNode);
};