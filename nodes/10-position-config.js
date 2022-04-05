// @ts-check
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

/*******************************************************************************************************
 * position-config:
 ******************************************************************************************************/

'use strict';

/*******************************************************************************************************
 * --- imported type definitions ---
 ******************************************************************************************************/
/** --- Type Defs ---
 * @typedef {import('./types/typedefs.js').runtimeRED} runtimeRED
 * @typedef {import('./types/typedefs.js').runtimeNode} runtimeNode
 * @typedef {import('./types/typedefs.js').runtimeNodeConfig} runtimeNodeConfig
 * @typedef {import("./lib/dateTimeHelper").ITimeObject} ITimeObject
 * @typedef {import("./lib/dateTimeHelper").ILimitationsObj} ILimitationsObj
 * @typedef {import("suncalc3").ISunTimeDef} ISunTimeDef
 * @typedef {import("suncalc3").ISunTimeSingle} ISunTimeSingle
 * @typedef {import("suncalc3").ISunTimeList} ISunTimeList
 * @typedef {import("suncalc3").ISunPosition} ISunPosition
 * @typedef {import("suncalc3").IMoonPosition} IMoonPosition
 * @typedef {import("suncalc3").IMoonIllumination} IMoonIllumination
 * @typedef {import("suncalc3").IMoonData} IMoonData
 * @typedef {import("suncalc3").IMoonTimes} IMoonTimes
 */

/*******************************************************************************************************
 * --- generic type definitions ---
 ******************************************************************************************************/
/**
 * @typedef {Object} IPositionConfigNode Extensions for the nodeInstance object type
 * @property {boolean} valid
 * @property {number} latitude
 * @property {number} longitude
 * @property {('deg'|'rad')} angleType
 * @property {number} tzOffset
 * @property {number} tzDST
 * @property {string} contextStore
 * @property {object} cache
 *
 * @property {FktRegister} register register a node as child
 * @property {FktDeregister} deregister remove a previous registered node as child
 * @property {FktCheckNode} checkNode checks the node configuration
 * @property {FktFormatDate} toDateTimeString Formate a Date Object to a Date and Time String
 * @property {FktFormatDate} toTimeString Formate a Date Object to a Time String
 * @property {FktFormatDate} toDateString Formate a Date Object to a Date String
 * @property {FktGetCustomAngles} getCustomAngles get list of custom angles
 * @property {FktGetSunTimesList} getSunTimesList get list of all suntimes including custom ones
 * @property {FktGetFloatProp} getFloatProp get a float value from a type input in Node-Red
 * @property {FktFormatOutDate} formatOutDate get an formated date prepared for output
 * @property {FktGetOutDataProp} getOutDataProp get the time Data prepared for output
 * @property {FktSetMessageProp} setMessageProp Creates a out object, based on input data
 * @property {FktGetTimeProp} getTimeProp get the time Data from a typed input
 * @property {FktGetJSONataExpression} getJSONataExpression get a prepared JSONATA Expression
 * @property {FktGetPropValue} getPropValue get a property value from a type input in Node-Red
 * @property {FktComparePropValue} comparePropValue compared two property's
 * @property {FktGetSunCalc} getSunCalc
 * @property {FktGetMoonCalc} getMoonCalc
 * ... obviously there are more ...
 */

/*******************************************************************************************************
 * --- Interfaces ---
 ******************************************************************************************************/
/**
 * This callback is displayed as a global member.
 * @callback IValuePropertyTypeCallback
 * @param {*} result - the result of the property value from a type input in Node-Red
 * @param {IValuePropertyType} data - the given data to the function
 * @returns {*} value of the type input
 */

/**
 * @typedef {Object} ITypedValue
 * @property {String} type - type of the value
 * @property {*} value - value
 */

/**
 * @typedef {Object} IValuePropertyType
 * @property {String} type - type of the value
 * @property {*} value - value
 * @property {*} [expr] - optional prepared Jsonata expression
 * @property {IValuePropertyTypeCallback} [callback] - function which should be called after value was recived
 * @property {Boolean} [noError] - true if no error shoudl be given in GUI
 * @property {Date} [now] base Date to use for Date time functions
 */

/**
 * @typedef {Object} INodeCacheSunData
 * @property {ISunTimeList} times
 * @property {Number} dayId
 * @property {ISunPosition} [sunPosAtSolarNoon]
 */

/**
 * @typedef {Object} INodeCacheMoonData
 * @property {IMoonTimes} times
 * @property {Number} dayId
 * @property {IMoonPosition} positionAtRise
 * @property {IMoonPosition} positionAtSet
 */

/**
 * @typedef {Object} INodeCacheData
 * @property {ISunDataResult|{ts: number}} lastSunCalc - last mooncalc
 * @property {Object} lastMoonCalc - last mooncalc
 * @property {INodeCacheSunData} sunTimesToday - last mooncalc
 * @property {INodeCacheSunData} sunTimesTomorrow - last mooncalc
 * @property {INodeCacheSunData} sunTimesAdd1 - last mooncalc
 * @property {INodeCacheSunData} sunTimesAdd2 - last mooncalc
 * @property {INodeCacheMoonData} moonTimesToday - last mooncalc
 * @property {INodeCacheMoonData} moonTimesTomorrow - last mooncalc
 * @property {INodeCacheMoonData} moonTimes2Days - last mooncalc
 */

/**
 * @typedef {Object} ISunDataResult
 * @property {Number} ts - the date of the calculated sun data as timestamp
 * @property {Date} lastUpdate - the date of the calculated sun data
 * @property {String} lastUpdateStr - date as string
 * @property {Number} latitude - latitude
 * @property {Number} longitude - longitude
 * @property {Number} height -observer height
 * @property {('deg'|'rad')} angleType
 * @property {Number} azimuth
 * @property {Number} altitude
 * @property {Number} altitudeDegrees
 * @property {Number} azimuthDegrees
 * @property {Number} altitudeRadians
 * @property {Number} azimuthRadians
 * @property {ISunTimeList} times
 * @property {ISunPosition} [positionAtSolarNoon]
 * @property {Number} [altitudePercent]
 */

/**
 * @typedef {Object} IMoonDataResult
 * @property {Number} ts - the date of the calculated sun data as timestamp
 * @property {Date} lastUpdate - the date of the calculated sun data
 * @property {String} lastUpdateStr - date as string
 * @property {Number} latitude - latitude
 * @property {Number} longitude - longitude
 * @property {('deg'|'rad')} angleType
 * @property {Number} azimuth
 * @property {Number} altitude
 * @property {Number} altitudeDegrees
 * @property {Number} azimuthDegrees
 * @property {Number} altitudeRadians
 * @property {Number} azimuthRadians
 * @property {Number} distance
 * @property {Number} parallacticAngle
 * @property {IMoonIllumination} illumination
 * @property {Number} zenithAngle
 * @property {IMoonTimes} times
 * @property {IMoonTimes} [timesNext]
 * @property {IMoonPosition} [positionAtRise]
 * @property {IMoonPosition} [positionAtSet]
 * @property {Number} [altitudePercent]
 * @property {IMoonPosition} [highestPosition]
 * @property {Boolean} [isUp]
 */


/**
 * @typedef {Object} ITimeResult
 * @property {Date} value - a Date object of the neesed date/time
 * @property {number} ts - The time as unix timestamp
 * @property {number} pos - The position of the sun on the time
 * @property {number} angle - Angle of the sun on the time
 * @property {number} julian - The time as julian calendar
 * @property {Boolean} valid - indicates if the time is valid or not
 * @property {String} [error] - string of an error message if an error occurs
 */

/**
 * @typedef {Object} ISunTimeDefRed
 * @property {String} name - The Name of the time
 * @property {Date} value - Date object with the calculated sun-time
 * @property {number} pos - The position of the sun on the time
 * @property {number} elevation - The elevation angle
 * @property {Boolean} valid - indicates if the time is valid or not
 */

/**
 * @typedef {Object} ISunTimeDefNextLast
 * @property {ISunTimeDefRed} next - next sun time
 * @property {ISunTimeDefRed} last - previous sun time
 */

/**
 * @typedef {Object} IMoonTime
 * @property {Date|NaN} value - a Date object of the neesed date/time
 * @property {String} [error] - string of an error message if an error occurs
 */

/**
 * @typedef {Object} IOffsetData
 * @property {String} [offset] - value of the offset
 * @property {String} [offsetType] - type name of the offset
 * @property {IValuePropertyTypeCallback} [offsetCallback] - callback function for getting getPropValue
 * @property {Boolean} [noOffsetError] - true if no error should be given in GUI
 * @property {number} [multiplier] - multiplier to the time
 */

/**
 * @typedef {Object} ITimePropertyTypeInt
 * @property {String} [format]      - format of the input
 * @property {String} [days]        - valid days
 * @property {String} [months]      - valid monthss
 * @property {Date} [now]           - base date, current time as default
 * @property {number} [latitude]    - latitude
 * @property {number} [longitude]   - longitude
 * @property {number} [height]      - height definition
 * @property {*} [expr] - optional prepared Jsonata expression
 *
 * @typedef {ITimePropertyTypeInt & ILimitationsObj & ITypedValue & IOffsetData} ITimePropertyType
 */

/**
 * get a float value from a type input in Node-Red
 * @typedef {Object} IGetFloatPropData
 * @property {String} type - type of the value
 * @property {*} value - value
 * @property {*} [expr] - optional prepared Jsonata expression
 * @property {number} [def] - default value if can not get float value
 * @property {IValuePropertyTypeCallback} [callback] - callback function for getting getPropValue
 * @property {Boolean} [noError] - true if no error should be given in GUI
 * @property {Date} [now] base Date to use for Date time functions
 */

/**
 * @typedef {Object} ITimePropertyResult
 * @property {Date} value - the Date value
 * @property {String} error - error message if an error has occured
 * @property {Boolean} fix - indicator if the given time value is a fix date
 */

/*******************************************************************************************************
 * --- Functions ---
 ******************************************************************************************************/
/**
 * check this node for configuration errors
 * @typedef {function} FktRegister
 * @param {runtimeNode} srcnode node to register as child node
 * @public
 */

/**
 * check this node for configuration errors
 * @typedef {function} FktDeregister
 * @param {runtimeNode} srcnode node to register as child node
 * @param {function} done node to register as child node
 * @returns {*} result of the function
 * @public
 */

/**
 * check this node for configuration errors
 * @typedef {function} FktCheckNode
 * @property {onErrorCallback} [onError] - if an error occurs this function will be called
 * @property {any} [onOk] - the return value in case of ok
 * @return {Boolean|String} returns the result of onrror if an error occurs, otherwise onOK
 */

/**
 * Formate a Date Object
 * @typedef {function} FktFormatDate
 * @param {Date} dt Date to format to Date and Time string
 * @returns {String} formated Date object
 */

/**
 * get list of custom angles
 * @typedef {function} FktGetCustomAngles
 * @param {string} filter filter to the angle names
 * @returns {Array.<{value: string, name: string, angle: number, [i:number]}>}
 */

/**
 * get list of all suntimes including custom ones
 * @typedef {function} FktGetSunTimesList
 * @param {string} filter filter to the angle names
 * @param {boolean} [onlyCustom=false] if true only custom angles will be given
 * @returns {Array.<{value: string, name: string, angle: number, [i:number]}>}
 */

/**
 * get a float value from a type input in Node-Red
 * @typedef {function} FktGetFloatProp
 * @param {runtimeNode} _srcNode - source node information
 * @param {Object} msg - message object
 * @param {IGetFloatPropData} data - input data object
 * @returns {number} float property
 */

/**
 * get an formated date prepared for output
 * @typedef {function} FktFormatOutDate
 * @param {runtimeNode} _srcNode - source node for logging
 * @param {Object} msg - the message object
 * @param {Date} dateValue - the source date object which should be formated
 * @param {ITimePropertyType} data - additional formating and control data
 */

/**
 * get the time Data prepared for output
 * @typedef {function} FktGetOutDataProp
 * @param {runtimeNode} _srcNode - source node for logging
 * @param {Object} msg - the message object
 * @param {ITimePropertyType} data - a Data object
 * @param {Date} [dNow] base Date to use for Date time functions
 * @param {Boolean} [noError] - true if no error shoudl be given in GUI
 * @returns {*} output Data
 */

/**
 * Creates a out object, based on input data
 * @typedef {function} FktSetMessageProp
 * @param {runtimeNode} _srcNode The base node
 * @param {Object} msg The Message Object to set the Data
 * @param {String} type type of the property to set
 * @param {*} value value of the property to set
 * @param {*} msgPropertyData Data object to set to the property
 */

/**
 * get the time Data from a typed input
 * @typedef {function} FktGetTimeProp
 * @param {runtimeNode} _srcNode - source node for logging
 * @param {Object} msg - the message object
 * @param {ITimePropertyType} data - a Data object
 * @returns {ITimePropertyResult} value of the type input
 */

/**
 * get a prepared JSONATA Expression
 * @typedef {function} FktGetJSONataExpression
 * @param {runtimeNode} _srcNode - source node information
 * @param {String} value - get an expression for a value
 * @returns {function} JSONataExpression
 */

/**
 * get a property value from a type input in Node-Red
 * @typedef {function} FktGetPropValue
 * @param {runtimeNode} _srcNode - source node information
 * @param {Object} msg - message object
 * @param {IValuePropertyType} data - data object with more information
 * @param {Boolean} [noError] - true if no error shoudl be given in GUI
 * @returns {*} value of the type input, return of the callback function if defined or __null__ if value could not resolved
*/

/**
 * compared two property's
 * @typedef {function} FktComparePropValue
 * @param {runtimeNode} _srcNode - source node information
 * @param {Object} msg - message object
 * @property {IValuePropertyType} operandA - first operand
 * @property {String} compare - compare between the both operands
 * @property {IValuePropertyType} operandB - second operand
 * @returns {*} value of the type input, return of the callback function if defined or __null__ if value could not resolved
*/

/**
 * compared two property's
 * @typedef {function} FktGetSunCalc
 * @param {Date} [date] - defines the date to calculates sun data for (can be a number too)
 * @param {Boolean} [calcTimes] - defines if times should be calculated
 * @param {Boolean} [sunInSky] - is sun in sky should determinated
 * @param {Number} [specLatitude] - optionaly special latitude
 * @param {Number} [specLongitude] - optionaly special longitude
 * @param {Number} [specHeight] - optionaly observer height
 * @returns {ISunDataResult}
 * @public
 */

/**
 * compared two property's
 * @typedef {function} FktGetMoonCalc
 * @param {Date} [date] - defines the date to calculates sun data for (can be a number too)
 * @param {Boolean} [calcTimes] - defines if times should be calculated
 * @param {Boolean} [moonInSky] - is moon in sky should determinated
 * @param {Number} [specLatitude] - optionaly special latitude
 * @param {Number} [specLongitude] - optionaly special longitude
 * @returns {IMoonDataResult}
 * @public
 */

/**
 * check an array if an array has duplicates.
 *
 * @callback FktHasDuplicates
 * @param {Array.<String>} arr - An array of strings.
 * @returns {Boolean} __true__ if array has duplicates
 */

/**
 * check an array if an array has duplicates.
 *
 * @callback FktValidateCustomTimes
 * @param {Array.<{riseName: String, setName: String, angle: number, rad: Boolean}>} riseName - An array of strings.
 * @returns {Boolean} __true__ if array has duplicates
 */

/*******************************************************************************************************/
// Implementation
/*******************************************************************************************************/
/** Export the function that defines the node */
module.exports = function (/** @type {runtimeRED} */ RED) {
    'use strict';

    const hlp = require('./lib/dateTimeHelper.js');
    const util = require('util');
    const sunCalc = require('suncalc3');

    /** generic configuration Node
     * @class
     * @extends {runtimeNode}
     * @constructor
     * @public
     */
    class positionConfigurationNode {
        /**
         * creates a new instance of the settings node and initializes them
         * @param {*} config - configuration of the node
         */
        constructor(config) {
            RED.nodes.createNode(this, config);
            /** Copy 'this' object in case we need it in context of callbacks of other functions.
             * @type {runtimeNode}
             * @private
             */
            // @ts-ignore
            const node = this;

            try {
                /** @type {String} - name of the node */
                this.name = config.name;
                /** @type {Boolean} - indicator if the node is valid */
                this.valid = true;
                /** @type {number} - latitude angle */
                this.latitude = parseFloat(Object.prototype.hasOwnProperty.call(
                    // @ts-ignore
                    this.credentials, 'posLatitude') ? this.credentials.posLatitude : config.latitude);
                /** @type {number} - longitude angle */
                this.longitude = parseFloat(Object.prototype.hasOwnProperty.call(
                    // @ts-ignore
                    this.credentials, 'posLongitude') ? this.credentials.posLongitude : config.longitude);
                /** @type {number} - observer height */
                this.height = parseFloat(
                    // @ts-ignore
                    this.credentials.height);
                /** @type {FktCheckNode} - checkNode checks the node configuration */
                this.checkNode(
                    error => {
                        // @ts-ignore
                        this.error(error);
                        // @ts-ignore
                        this.status({fill: 'red', shape: 'dot', text: error });
                        this.valid = false;
                    });
                /** @type {('deg'|'rad')} - type of the angle */
                this.angleType = config.angleType;
                /** @type {number} - time zone offset */
                this.tzOffset = parseInt(config.timeZoneOffset || 99);
                /** @type {number} - time zone DST */
                this.tzDST = parseInt(config.timeZoneDST || 0);
                /** @type {String} - type of the angle */
                this.contextStore = config.contextStore;

                /** @type {FktHasDuplicates} - check an array if an array has duplicates */
                this.hasDuplicates = arr => {
                    return arr.some(item => {
                        return (arr.indexOf(item) !== arr.lastIndexOf(item));
                    });
                };

                /** @type {Array.<{name: String, angle: number}>} - custom angle definition */
                this.customAngles = [];
                if (config.predefAngles && (config.predefAngles.length > 0)) {
                    const EXP = /^[0-9a-zA-Z_\s]+$/;
                    const names = [];

                    config.predefAngles.forEach((/** @type {{ angle: number; name: String;rad: Boolean }} */ time) => {
                        if (!EXP.test(time.name) ||
                            isNaN(time.angle)) {
                            node.error(RED._('position-config.errors.custom-angles', time));
                        } else if (names.includes(time.name)) {
                            node.error(RED._('position-config.errors.custom-angles-duplicate', time));
                        } else {
                            names.push(time.name);
                            this.customAngles.push({
                                name: time.name,
                                angle: time.angle
                            });
                        }
                    });
                }

                const times = config.sunPositions;
                if (times) {
                    times.forEach((/** @type {{ angle: number; riseName: String; setName: String }} */ time, /** @type {number} */ index) => {
                        if (!sunCalc.addTime(time.angle, time.riseName, time.setName, index+100, index+200, this.angleType === 'deg')) {
                            node.error(RED._('position-config.errors.invalid-custom-suntime', time));
                        }
                    });
                }

                /** @type {INodeCacheData} - cache object */
                this.cache = {
                    lastSunCalc: {
                        ts: 0
                    },
                    lastMoonCalc: {
                        ts: 0
                    },
                    // @ts-ignore
                    sunTimesToday: {},
                    // @ts-ignore
                    sunTimesTomorrow: {},
                    // @ts-ignore
                    sunTimesAdd1: {},
                    // @ts-ignore
                    sunTimesAdd2: {},
                    // @ts-ignore
                    moonTimesToday: {},
                    // @ts-ignore
                    moonTimesTomorrow: {},
                    // @ts-ignore
                    moonTimes2Days: {}
                };

                if (isNaN(this.tzOffset) || this.tzOffset > 99 || this.tzOffset < -99) {
                    this.tzOffset = 99;
                }
                if (this.tzOffset !== 99) {
                    this.tzOffset += this.tzDST;
                    this.tzOffset = (this.tzOffset * -60);
                    // @ts-ignore
                    this.debug('tzOffset is set to ' + this.tzOffset + ' tzDST=' + this.tzDST);
                } else {
                    this.tzOffset = null;
                    // this.debug('no tzOffset defined (tzDST=' + this.tzDST + ')');
                }
                // this.debug(`initialize latitude=${this.latitude} longitude=${this.longitude} tzOffset=${this.tzOffset} tzDST=${this.tzDST}`);

                /** @type {number|string} - standard time format */
                this.stateTimeFormat = config.stateTimeFormat || 3;
                /** @type {number|string} - standard date format */
                this.stateDateFormat = config.stateDateFormat || 12;
                // this.debug('load position-config ' + this.name + ' latitude:' + this.latitude + ' long:' + this.longitude + ' angelt:' + this.angleType + ' TZ:' + this.tzOffset);

                const today = new Date();
                const dayId = hlp.getDayId(today); // this._getUTCDayId(today);
                this._sunTimesRefresh(today.valueOf(), dayId);
                this._moonTimesRefresh(today.valueOf(), dayId);
                hlp.initializeParser(RED._('common.days', { returnObjects: true}), RED._('common.months', { returnObjects: true}), RED._('common.dayDiffNames', { returnObjects: true}));

                /** @type {Object} - cache object */
                this.subNodes = {};
            } catch (err) {
                // @ts-ignore
                this.debug(util.inspect(err));
                // @ts-ignore
                this.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('errors.error-title')
                });
                throw err;
            }
        }

        /**
         * register a node as child
         * @param {runtimeNode} srcnode node to register as child node
         * @public
         */
        register(srcnode) {
            this.subNodes[srcnode.id] = srcnode;
        }

        /**
         * remove a previous registered node as child
         * @param {runtimeNode} srcnode node to remove
         * @param {function} done function which should be executed after deregister
         * @returns {*} result of the function
         * @public
         */
        deregister(srcnode, done) {
            delete this.subNodes[srcnode.id];
            return done();
        }
        /*******************************************************************************************************/
        /**
         * This callback type is called `requestCallback` and is displayed as a global symbol.
         *
         * @callback onErrorCallback
         * @param {String} errorMessage - the error message
         * @return {Boolean|String} returns true if ok otherwise an string with the error
         */

        /**
         * check this node for configuration errors
         * @property {onErrorCallback} [onError] - if an error occurs this function will be called
         * @property {any} [onOk] - the return value in case of ok
         * @return {Boolean|String} returns the result of onrror if an error occurs, otherwise onOK
         * @public
         */
        checkNode(onError, onOk) {
            if ((Number.isNaN(this.latitude) && Number.isNaN(this.longitude))) {
                return onError(RED._('position-config.errors.coordinates-missing'));
            }
            if (isNaN(this.latitude) || (this.latitude < -90) || (this.latitude > 90)) {
                return onError(RED._('position-config.errors.latitude-missing'));
            }
            if (isNaN(this.longitude) || (this.longitude < -180) || (this.longitude > 180)) {
                return onError(RED._('position-config.errors.longitude-missing'));
            }
            return onOk;
        }
        /*******************************************************************************************************/
        /**
         * gets sun time by Name
         * @param {Date} dNow current time
         * @param {String} name name of the sun time
         * @param {number} [offset] the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
         * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
         * @param {ILimitationsObj} [limit] additional limitations for the calculation
         * @param {number} [latitude] latitude
         * @param {number} [longitude] longitude
         * @param {number} [height] height definition
         * @return {ITimeResult} result object of sunTime
         * @private
         */
        _getSunTimeByName(dNow, name, offset, multiplier, limit, latitude, longitude, height) {
            // this.debug('_getSunTimeByName dNow=' + dNow + ' limit=' + util.inspect(limit, { colors: true, compact: 10, breakLength: Infinity }));
            let result;
            const dayId = hlp.getDayId(dNow); // this._getUTCDayId(dNow);
            const mheight = (height || this.height);
            if (latitude && longitude) {
                result = Object.assign({}, sunCalc.getSunTimes(dNow.getTime(), latitude, longitude, mheight, true)[name]);
            } else {
                latitude = this.latitude;
                longitude = this.longitude;
                this._sunTimesCheck(); // refresh if needed, get dayId
                // this.debug(`_getSunTimeByName name=${name} offset=${offset} multiplier=${multiplier} dNow=${dNow} dayId=${dayId} limit=${util.inspect(limit, { colors: true, compact: 10, breakLength: Infinity })}`);
                if (dayId === this.cache.sunTimesToday.dayId) {
                    result = Object.assign({}, this.cache.sunTimesToday.times[name]); // needed for a object copy
                } else if (dayId === this.cache.sunTimesTomorrow.dayId) {
                    result = Object.assign({}, this.cache.sunTimesTomorrow.times[name]); // needed for a object copy
                } else if (dayId === this.cache.sunTimesAdd1.dayId) {
                    result = Object.assign({},this.cache.sunTimesAdd1.times[name]); // needed for a object copy
                } else if (dayId === this.cache.sunTimesAdd2.dayId) {
                    result = Object.assign({},this.cache.sunTimesAdd2.times[name]); // needed for a object copy
                } else {
                    // this.debug('sun-time not in cache - calc time');
                    this.cache.sunTimesAdd2 = {
                        dayId: this.cache.sunTimesAdd1.dayId,
                        times: this.cache.sunTimesAdd1.times
                    };
                    this.cache.sunTimesAdd1 = {
                        dayId,
                        times : sunCalc.getSunTimes(dNow.getTime(), latitude, longitude, mheight, true)
                    };
                    result = Object.assign({},this.cache.sunTimesAdd1.times[name]); // needed for a object copy
                }
            }
            if (!result) {
                // @ts-ignore
                this.error(RED._('position-config.errors.invalid-custom-suntime', {name}));
                return {
                    error: RED._('position-config.errors.invalid-custom-suntime', {name}),
                    valid: false,
                    ts: dNow.valueOf(),
                    value: dNow,
                    pos: NaN,
                    angle: NaN,
                    julian: NaN
                };
            }

            result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            if (limit.next && result.value.getTime() <= dNow.getTime()) {
                if (dayId === this.cache.sunTimesToday.dayId) {
                    result = Object.assign({}, this.cache.sunTimesTomorrow.times[name]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                }
                const dateBase = new Date(dNow);
                while (result.value.getTime() <= dNow.getTime()) {
                    dateBase.setUTCDate(dateBase.getUTCDate() + 1);
                    result = Object.assign(result, sunCalc.getSunTimes(dateBase.getTime(), latitude, longitude, mheight, true)[name]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                }
            }
            const r = hlp.limitDate(limit, result.value);
            if (r.error) {
                result.error = r.error;
            } else {
                result.value = r.date;
            }

            if (r.hasChanged) {
                this.checkNode(error => { throw new Error(error); });
                result = Object.assign(result, sunCalc.getSunTimes(result.value.valueOf(), latitude, longitude, mheight, true)[name]);
                result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            }

            // this.debug('_getSunTimeByName result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }

        /**
         * gets sun time by Elevation
         * @param {Date} dNow current time
         * @param {number} elevationAngle name of the sun time
         * @param {ITimePropertyType} tprop additional limitations for the calculation
         * @param {('set'|'rise'|'both')} [prop=both] property (set, rise or both) to return
         * @return {ISunTimeSingle} result object of sunTime
         * @private
         */
        _getSunTimeByElevation(dNow, elevationAngle, tprop, prop) {
            if (!hlp.isValidDate(dNow)) {
                const dto = new Date(dNow);
                if (hlp.isValidDate(dto)) {
                    dNow = dto;
                } else {
                    dNow = new Date();
                }
            }
            // this.debug('_getSunTimeByElevation dNow=' + dNow + ' tprop=' + util.inspect(tprop, { colors: true, compact: 10, breakLength: Infinity }));
            const latitude = (tprop.latitude || this.latitude);
            const longitude = (tprop.longitude || this.longitude);
            const height = (tprop.height || this.height);
            const degree = (this.angleType === 'deg');
            const result = Object.assign({},sunCalc.getSunTime(dNow.valueOf(), latitude, longitude, elevationAngle, height, degree));

            const offsetX = this._getOffsetVal(
                // @ts-ignore
                this,
                null, tprop, dNow);
            const calc = (result, recalc) => {
                result.value = hlp.addOffset(new Date(result.value), offsetX, tprop.multiplier);
                if (tprop.next && result.value.getTime() <= dNow.getTime()) {
                    const datebase = new Date(dNow);
                    while (result.value.getTime() <= dNow.getTime()) {
                        datebase.setUTCDate(datebase.getUTCDate() + 1);
                        result = Object.assign({},recalc(datebase.valueOf()));
                        result.value = hlp.addOffset(new Date(result.value), offsetX, tprop.multiplier);
                    }
                }
                const r = hlp.limitDate(tprop, result.value);
                if (r.error) {
                    result.error = r.error;
                } else {
                    result.value = r.date;
                }

                if (r.hasChanged) {
                    this.checkNode(error => { throw new Error(error); });
                    result = Object.assign(result, recalc(result.value.valueOf()));
                    result.value = hlp.addOffset(new Date(result.value), offsetX, tprop.multiplier);
                }
            };
            if (prop==='rise') {
                calc(result.rise, dt => sunCalc.getSunTime(dt, latitude, longitude, elevationAngle, height, degree).rise);
                return result;
            } else if (prop==='set') {
                calc(result.set, dt => sunCalc.getSunTime(dt, latitude, longitude, elevationAngle, height, degree).set);
                return result;
            }
            calc(result.rise, dt => sunCalc.getSunTime(dt, latitude, longitude, elevationAngle, height, degree).rise);
            calc(result.set, dt => sunCalc.getSunTime(dt, latitude, longitude, elevationAngle, height, degree).set);
            return result;
        }

        /**
         * gets sun time by Azimuth
         * @param {Date} dNow current time
         * @param {number} azimuthAngle angle of the sun
         * @param {ITimePropertyType} [tprop] additional limitations for the calculation
         * @param {number} [latitude] latitude
         * @param {number} [longitude] longitude
         * @return {Date} result object of sunTime
         * @private
         */
        _getSunTimeByAzimuth(dNow, azimuthAngle, degree, tprop, latitude, longitude) {
            if (!hlp.isValidDate(dNow)) {
                const dto = new Date(dNow);
                if (hlp.isValidDate(dto)) {
                    dNow = dto;
                } else {
                    dNow = new Date();
                }
            }
            // this.debug('_getSunTimeByAzimuth dNow=' + dNow + ' tprop=' + util.inspect(tprop, { colors: true, compact: 10, breakLength: Infinity }));
            latitude = (latitude || tprop.latitude || this.latitude);
            longitude = (longitude || tprop.longitude || this.longitude);
            let result = sunCalc.getSunTimeByAzimuth(dNow, latitude, longitude, azimuthAngle, degree);

            const offsetX = this._getOffsetVal(
                // @ts-ignore
                this,
                null, tprop, dNow);
            result = hlp.addOffset(result, offsetX, tprop.multiplier);
            if (tprop.next && result.getTime() <= dNow.getTime()) {
                const datebase = new Date(dNow);
                while (result.getTime() <= dNow.getTime()) {
                    datebase.setUTCDate(datebase.getUTCDate() + 1);
                    result = sunCalc.getSunTimeByAzimuth(datebase, latitude, longitude, azimuthAngle, degree);
                    result = hlp.addOffset(result, offsetX, tprop.multiplier);
                }
            }
            const r = hlp.limitDate(tprop, result);
            if (r.error) {
                result = null;
            } else {
                result = r.date;
            }

            if (r.hasChanged) {
                this.checkNode(error => { throw new Error(error); });
                result = sunCalc.getSunTimeByAzimuth(result, latitude, longitude, azimuthAngle, degree);
                result = hlp.addOffset(result, offsetX, tprop.multiplier);
            }

            return result;
        }

        /**
         * gets previous and next sun time
         * @param {Date} dNow current time
         * @return {ISunTimeDefNextLast} result object of sunTime
         * @private
         */
        _getSunTimePrevNext(dNow) {
            let dayId = hlp.getDayId(dNow); // this._getUTCDayId(dNow);
            this._sunTimesCheck(); // refresh if needed, get dayId
            let result;
            // this.debug(`_getSunTimePrevNext dNow=${dNow} dayId=${dayId} today=${util.inspect(today, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (dayId === this.cache.sunTimesToday.dayId) {
                result = this.cache.sunTimesToday.times;
            } else if (dayId === this.cache.sunTimesTomorrow.dayId) {
                result = this.cache.sunTimesTomorrow.times;
            } else if (dayId === this.cache.sunTimesAdd1.dayId) {
                result = this.cache.sunTimesAdd1.times;
            } else if (dayId === this.cache.sunTimesAdd2.dayId) {
                result = this.cache.sunTimesAdd2.times;
            } else {
                // @ts-ignore
                this.debug('sun-time not in cache - calc time (2)');
                this.cache.sunTimesAdd2 = {
                    dayId: this.cache.sunTimesAdd1.dayId,
                    times: this.cache.sunTimesAdd1.times
                };
                this.cache.sunTimesAdd1 = {
                    dayId,
                    times: sunCalc.getSunTimes(dNow.valueOf(), this.latitude, this.longitude, this.height, false)
                };
                result = this.cache.sunTimesAdd1.times;
            }
            const sortable = [];
            for (const key in result) {
                if (result[key].pos >= 0) {
                    sortable.push(result[key]);
                }
            }
            sortable.sort((a, b) => {
                return a.ts - b.ts;
            });
            const dNowTs = dNow.getTime() + 300; // offset to get really next
            // this.debug(`_getSunTimePrevNext dNowTs=${dNowTs} sortable=${util.inspect(sortable, { colors: true, compact: 10, breakLength: Infinity })}`);
            let last = sortable[0];
            if (last.ts >= dNowTs) {
                return {
                    next : {
                        value : new Date(last.value),
                        name : last.name,
                        pos : last.pos,
                        valid : last.valid,
                        elevation : last.elevation
                    },
                    last : {
                        value : new Date(result['nadir'].value),
                        name : result['nadir'].name,
                        pos : result['nadir'].pos,
                        valid : result['nadir'].valid,
                        elevation : result['nadir'].elevation
                    }
                };
            }
            for (let i = 1; i < sortable.length; i++) {
                const element = sortable[i];
                if (dNowTs < element.ts) {
                    return {
                        next : {
                            value : new Date(element.value),
                            name : element.name,
                            pos : element.pos,
                            valid : element.valid,
                            elevation : element.elevation
                        },
                        last : {
                            value : new Date(last.value),
                            name : last.name,
                            pos : last.pos,
                            valid : last.valid,
                            elevation : last.elevation
                        }
                    };
                }
                last = element;
            }
            dayId += 1;
            if (dayId === this.cache.sunTimesToday.dayId) {
                result = this.cache.sunTimesToday.times;
            } else if (dayId === this.cache.sunTimesTomorrow.dayId) {
                result = this.cache.sunTimesTomorrow.times;
            } else if (dayId === this.cache.sunTimesAdd1.dayId) {
                result = this.cache.sunTimesAdd1.times;
            } else if (dayId === this.cache.sunTimesAdd2.dayId) {
                result = this.cache.sunTimesAdd2.times;
            } else {
                result = sunCalc.getSunTimes(dNow.valueOf() + hlp.TIME_24h, this.latitude, this.longitude, this.height, false); // needed for a object copy
            }
            const sortable2 = [];
            for (const key in result) {
                if (result[key].pos >=0) {
                    sortable2.push(result[key]);
                }
            }
            sortable2.sort((a, b) => {
                return a.ts - b.ts;
            });
            return {
                next : {
                    value : new Date(sortable2[0].value),
                    name : sortable2[0].name,
                    pos : sortable2[0].pos,
                    valid : sortable2[0].valid,
                    elevation : sortable2[0].elevation
                },
                last : {
                    value : new Date(last.value),
                    name : last.name,
                    pos : last.pos,
                    valid : last.valid,
                    elevation : last.elevation
                }
            };
        }
        /*******************************************************************************************************/
        /**
        * gets moon time
        * @param {Date} dNow current time
        * @param {String} value name of the moon time
        * @param {number} [offset] the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
        * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
        * @param {ILimitationsObj} [limit] additional limitations for the calculation
        * @param {number} [latitude] optional latitude angle
        * @param {number} [longitude] optional longitude angle
        * @return {IMoonTime} result object of moon time
        * @private
        */
        _getMoonTimeByName(dNow, value, offset, multiplier, limit, latitude, longitude) {
            const result = {};
            const dateBase = new Date(dNow);
            const dayId = hlp.getDayId(dNow); // this._getUTCDayId(dNow);
            if (latitude && longitude) {
                result.value = sunCalc.getMoonTimes(dNow.getTime(), latitude, longitude)[value];
            } else {
                latitude = this.latitude;
                longitude = this.longitude;

                this._moonTimesCheck(); // refresh if needed, get dayId
                // this.debug(`_getMoonTimeByName value=${value} offset=${offset} multiplier=${multiplier} dNow=${dNow} dayId=${dayId} limit=${util.inspect(limit, { colors: true, compact: 10, breakLength: Infinity })}`);

                if (dayId === this.cache.moonTimesToday.dayId) {
                    result.value = this.cache.moonTimesToday.times[value]; // needed for a object copy
                } else if (dayId === this.cache.moonTimesTomorrow.dayId) {
                    result.value = this.cache.moonTimesTomorrow.times[value]; // needed for a object copy
                } else if (dayId === this.cache.moonTimes2Days.dayId) {
                    result.value = this.cache.moonTimes2Days.times[value]; // needed for a object copy
                } else {
                    result.value = sunCalc.getMoonTimes(dNow.getTime(), this.latitude, this.longitude)[value]; // needed for a object copy
                }
            }
            if (hlp.isValidDate(result.value)) {
                result.value = hlp.addOffset(new Date(result.value.getTime()), offset, multiplier);
                if (limit.next && result.value.getTime() <= dNow.getTime()) {
                    if (dayId === this.cache.moonTimesToday.dayId) {
                        result.value = this.cache.moonTimesTomorrow.times[value];
                        result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                    } else if (dayId === this.cache.moonTimesTomorrow.dayId) {
                        result.value = this.cache.moonTimes2Days.times[value];
                        result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                    }
                    while (hlp.isValidDate(result.value) && result.value.getTime() <= dNow.getTime()) {
                        dateBase.setUTCDate(dateBase.getUTCDate() + 1);
                        result.value = sunCalc.getMoonTimes(dateBase.getTime(), latitude, longitude)[value];
                        result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                    }
                }
            }
            while (!hlp.isValidDate(result.value)) {
                dateBase.setUTCDate(dateBase.getUTCDate() + 1);
                result.value = sunCalc.getMoonTimes(dateBase.getTime(), latitude, longitude)[value];
            }
            result.value = new Date(result.value.getTime());

            const r = hlp.limitDate(limit, result.value);
            if (r.error) {
                result.error = r.error;
            } else {
                result.value = r.date;
            }

            if (r.hasChanged) {
                this.checkNode(error => { throw new Error(error); });
                result.value = new Date(sunCalc.getMoonTimes(result.value.valueOf(), latitude, longitude)[value]);
                result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            }

            // this.debug('_getMoonTimeByName result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }
        /*******************************************************************************************************/
        /**
         * Formate a Date Object to a Date and Time String
         * @param {Date} dt Date to format to Date and Time string
         * @returns {String} formated Date object
         * @public
         */
        toDateTimeString(dt) {
            return (dt && this.toDateString(dt) + ' ' + this.toTimeString(dt)).trim();
        }

        /**
         * Formate a Date Object to a Time String
         * @param {Date} dt Date to format to trime string
         * @returns {String} formated Date object
         * @public
         */
        toTimeString(dt) {
            if (dt && !this.tzOffset && this.stateTimeFormat === '3') {
                return dt.toLocaleTimeString();
            }
            return hlp.getFormattedDateOut(dt, this.stateTimeFormat, (this.tzOffset === 0), this.tzOffset);
        }

        /**
         * Formate a Date Object to a Date String
         * @param {Date} dt Date to format to Date string
         * @returns {String} formated Date object
         * @public
         */
        toDateString(dt) {
            if (dt && !this.tzOffset && this.stateDateFormat === '12') {
                return dt.toLocaleDateString();
            }
            return hlp.getFormattedDateOut(dt, this.stateDateFormat, (this.tzOffset === 0), this.tzOffset);
        }

        /*******************************************************************************************************/
        /**
         * get list of custom angles
         * @param {string} filter filter to the angle names
         * @returns {Array.<{value: string, name: string, angle: number, [i:number]}>}
         * @public
         */
        getCustomAngles(filter) {
            const matches = [];
            if (filter) {
                filter = filter.toLowerCase();
                this.customAngles.forEach(v => {
                    const i = v.name.toLowerCase().indexOf(filter.toLowerCase());
                    if (i > -1) {
                        matches.push({
                            value: v.name,
                            label: v.name,
                            angle: v.angle,
                            i
                        });
                    }
                });
                matches.sort((a,b) => a.i-b.i);
            } else {
                this.customAngles.forEach(v => {
                    matches.push({
                        value: v.name,
                        label: v.name,
                        angle: v.angle
                    });
                });
                matches.sort((a,b) => ((a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0)));
            }
            return matches;
        }

        /**
         * get list of all suntimes including custom ones
         * @param {string} filter filter to the angle names
         * @returns {Array.<{value: string, name: string, angle: number, [i:number]}>}
         * @public
         */
        getSunTimesList(filter) {
            const matches = [];
            if (filter) {
                filter = filter.toLowerCase();
                sunCalc.times.forEach(v => {
                    const r = v.riseName.toLowerCase().indexOf(filter.toLowerCase());
                    if (r > -1) {
                        matches.push({
                            value: v.riseName,
                            label: v.riseName,
                            angle: v.angle,
                            pos: v.risePos,
                            type: 'rise',
                            i: r
                        });
                    }
                    const s = v.setName.toLowerCase().indexOf(filter.toLowerCase());
                    if (s > -1) {
                        matches.push({
                            value: v.setName,
                            label: v.setName,
                            angle: v.angle,
                            pos: v.setPos,
                            type: 'set',
                            i: s
                        });
                    }
                });
                matches.sort((a,b) => a.i-b.i);
            } else {
                sunCalc.times.forEach(v => {
                    matches.push({
                        value: v.riseName,
                        label: v.riseName,
                        angle: v.angle,
                        pos: v.risePos
                    });
                    matches.push({
                        value: v.setName,
                        label: v.setName,
                        angle: v.angle,
                        pos: v.setPos,
                        type: 'set'
                    });
                });
                matches.sort((a,b) => ((a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0)));
            }
            return matches;
        }
        /*******************************************************************************************************/
        /**
         * @typedef {Object} ICacheData
         * @property {Object} day - the cached data for day
         * @property {Object} week - the cached data forweek
         */

        /**
         * get the random number cache for a node
         * @param {runtimeNode} _srcNode - source node information
         * @param {Date} dNow base Date to use for Date time functions
         * @param {String} store used context store
         * @returns {ICacheData} random number cache
        */
        _getNodeNumberCache(_srcNode, dNow, store) {
            const cache = _srcNode.context().get('randomNumberCache', store) || {};
            if (!cache.day || cache.day.v !== dNow.getDate()) {
                cache.day = {
                    v : dNow.getDate()
                };
                const w = hlp.getWeekOfYear(dNow);
                if (cache.week !== w) {
                    cache.week = {
                        v : w
                    };
                }
            }
            return cache;
        }
        /**
         * get a random number for a node cached per day
         * @param {runtimeNode} _srcNode - source node information
         * @param {number} limit1 - lower limit for random number
         * @param {number} limit2 - upper limit for random number
         * @param {Date} [dNow] base Date to use for Date time functions
         * @returns {number} random number
         * @private
        */
        _getCachedRandomDayNumber(_srcNode, limit1, limit2, dNow) {
            // _srcNode.debug(`_getCachedRandomDayNumber limit1=${String(limit1)} limit2=${String(limit2)} dNow=${dNow}`);
            if (isNaN(limit1)) {
                _srcNode.error(`the value for random number limit is wrong limit1=${String(limit1)} limit2=${String(limit2)}, using 60`);
                limit1 = 60;
            }
            const low = Math.min(limit1, isNaN(limit2) ? 0 : limit2);
            const high = Math.max(limit1, isNaN(limit2) ? 0 : limit2);
            const name = 'min_'+low+'_max_'+high;
            // @ts-ignore
            const store = _srcNode.contextStore || this.contextStore;
            const cache = this._getNodeNumberCache(_srcNode, dNow, store);
            if (isNaN(cache.day[name])) {
                cache.day[name] = low + (Math.random() * (high - low));
                _srcNode.context().set('randomNumberCache', cache, store);
            }
            return cache.day[name];
        }
        /**
         * get a random number for a node cached per day
         * @param {runtimeNode} _srcNode - source node information
         * @param {number} limit1 - lower limit for random number
         * @param {number} limit2 - upper limit for random number
         * @param {Date} [dNow] base Date to use for Date time functions
         * @returns {number} random number
         * @private
        */
        _getCachedRandomWeekNumber(_srcNode, limit1, limit2, dNow) {
            // _srcNode.debug(`getCachedRandomWeekNumber limit1=${limit1} limit2=${limit2} dNow=${dNow}`);
            if (isNaN(limit1)) {
                _srcNode.error(`the value for random number limit is wrong limit1=${limit1} limit2=${limit2}, using 60`);
                limit1 = 60;
            }
            const low = Math.min(limit1, isNaN(limit2) ? 0 : limit2);
            const high = Math.max(limit1, isNaN(limit2) ? 0 : limit2);
            const name = 'min_'+low+'_max_'+high;
            // @ts-ignore
            const store = _srcNode.contextStore || this.contextStore;
            const cache = this._getNodeNumberCache(_srcNode, dNow, store);
            if (isNaN(cache.week[name])) {
                cache.week[name] = low + (Math.random() * (high - low));
                _srcNode.context().set('randomNumberCache', cache, store);
            }
            return cache.week[name];
        }

        /**
         * get a float value from a type input in Node-Red
         * @param {runtimeNode} _srcNode - source node information
         * @param {Object} msg - message object
         * @param {ITimePropertyType} offsetData - input data object
         * @param {Date} [dNow] base Date to use for Date time functions
         * @returns {number} float property
         * @public
         */
        _getOffsetVal(_srcNode, msg, offsetData, dNow) {
            return this.getFloatProp(
                _srcNode,
                msg,
                {
                    type: offsetData.offsetType,
                    value: offsetData.offset,
                    def: 0,
                    callback: offsetData.offsetCallback,
                    noError: offsetData.noOffsetError,
                    now: dNow || offsetData.now
                });
        }
        /**
         * get a float value from a type input in Node-Red
         * @param {runtimeNode} _srcNode - source node information
         * @param {Object} msg - message object
         * @param {IGetFloatPropData} data - input data object
         * @returns {number} float property
         * @public
         */
        getFloatProp(_srcNode, msg, data) {
            // _srcNode.debug(`getFloatProp type=${data.type} value=${value} def=${def} callback=${callback} noError=${noError}`);
            let result; // 'msg', 'flow', 'global', 'num', 'bin', 'env', 'jsonata'
            if (data.type === 'num') {
                result = Number(data.value); // extra conversation to handle empty string as 0
            } else if (data.type === '' || (typeof data.type === 'undefined') || data.type === null) {
                if (isNaN(data.value)) {
                    return data.def || NaN;
                }
                result = data.value;
            } else if (data.type === 'numAzimuth' || data.type === 'numAltitude') {
                if (this.angleType === 'rad') {
                    result = hlp.angleNorm(Number(data.value));
                } else {
                    result = hlp.angleNormRad(Number(data.value));
                }
            } else if (data.type === 'numAnglePreDef') {
                const val = this.customAngles.find( el => el.name === data.value);
                if (typeof val === 'undefined') {
                    if (data.noError) { return NaN; }
                    throw new Error(RED._('errors.notEvaluableCustomAngle', data));
                }
                if (this.angleType === 'rad') {
                    result = hlp.angleNormRad(Number(val.angle));
                } else {
                    result = hlp.angleNorm(Number(val.angle));
                }
            } else if (data.type === 'none') {
                return data.def || NaN;
            } else {
                result = this.getPropValue(_srcNode, msg, data);
            }
            if (result === null || typeof result === 'undefined') {
                if (data.noError) { return NaN; }
                throw new Error(RED._('errors.notEvaluableProperty', data));
            }
            result = parseFloat(result);
            if (isNaN(result)) {
                if (data.noError) { return NaN; }
                throw new Error('the value of ' + data.type + '.' + data.value + ' is not a valid Number!');
            }
            return result;
        }
        /*******************************************************************************************************/
        /**
          * get an formated date prepared for output
          * @param {runtimeNode} _srcNode - source node for logging
          * @param {Object} msg - the message object
          * @param {Date} dateValue - the source date object which should be formated
          * @param {ITimePropertyType} data - additional formating and control data
          * @public
          */
        formatOutDate(_srcNode, msg, dateValue, data) {
            const offsetX = this.getFloatProp(
                _srcNode,
                msg,
                {
                    type: data.offsetType,
                    value: data.offset,
                    def: 0,
                    callback: data.offsetCallback,
                    noError: data.noOffsetError,
                    now:data.now
                });
            const result = hlp.normalizeDate(dateValue, offsetX, data.multiplier, data);
            return hlp.getFormattedDateOut(result, data.format, (this.tzOffset === 0), this.tzOffset);
        }

        /**
         * get the time Data prepared for output
         * @param {runtimeNode} _srcNode - source node for logging
         * @param {Object} msg - the message object
         * @param {ITimePropertyType} data - a Data object
         * @param {Date} [dNow] base Date to use for Date time functions
         * @param {Boolean} [noError] - true if no error shoudl be given in GUI
         * @returns {*} output Data
         * @public
         */
        getOutDataProp(_srcNode, msg, data, dNow, noError) {
            // _srcNode.debug(`getOutDataProp IN data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity }) } tzOffset=${this.tzOffset} dNow=${dNow}`);
            dNow = dNow || ((hlp.isValidDate(data.now)) ? new Date(data.now) : new Date());

            let result = null;
            if (data.type === null || data.type === 'none' || data.type === '' || data.type === 'null' || (typeof data.type === 'undefined')) {
                return null;
            } else if (data.type === 'date') {
                if (this.tzOffset) {
                    return hlp.convertDateTimeZone(dNow, this.tzOffset);
                }
                return Date.now();
            } else if (data.type === 'dateSpecific') {
                return this.formatOutDate(_srcNode, msg, dNow, data);
            } else if ((data.type === 'pdsTime') || (data.type === 'pdsTimeCustom') || (data.type === 'pdmTime')) {
                if ((data.type === 'pdsTime')  || (data.type === 'pdsTimeCustom')) { // sun
                    const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                    result = this._getSunTimeByName(dNow, data.value, offsetX, data.multiplier, data, data.latitude, data.longitude, data.height);
                } else if (data.type === 'pdmTime') { // moon
                    const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                    result = this._getMoonTimeByName(dNow, data.value, offsetX, data.multiplier, data, data.latitude, data.longitude);
                    _srcNode.debug(`_getMoonTimeByName data=${util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) }`);
                }
                if (result && result.value && !result.error) {
                    return hlp.getFormattedDateOut(result.value, data.format, (this.tzOffset === 0), this.tzOffset);
                }
                return null;
            } else if (data.type === 'pdsTimeNow') {
                result = Object.assign({}, this._getSunTimePrevNext(dNow));
                const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                result.last.value = hlp.normalizeDate(result.last.value, offsetX, data.multiplier, data);
                result.next.value = hlp.normalizeDate(result.next.value, offsetX, data.multiplier, data);
                if (this.tzOffset) {
                    // @ts-ignore
                    result.last.value = hlp.convertDateTimeZone(result.last.value, this.tzOffset).getTime();
                    // @ts-ignore
                    result.next.value = hlp.convertDateTimeZone(result.next.value, this.tzOffset).getTime();
                }
                return result;
            } else if (data.type === 'entered' || data.type === 'dateEntered') {
                result = hlp.getDateOfText(String(data.value), true, (this.tzOffset === 0), this.tzOffset);
                return this.formatOutDate(_srcNode, msg, result, data);
            } else if (data.type === 'dayOfMonth') {
                result = hlp.getSpecialDayOfMonth(dNow.getFullYear(),dNow.getMonth(), data.value);
                if (result !== null && typeof result !== 'undefined') {
                    return this.formatOutDate(_srcNode, msg, result, data);
                }
                return null;
            }
            // _srcNode.debug(`getOutDataProp OUT data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })} tzOffset=${this.tzOffset} result=${util.inspect(result, { colors: true, compact: 10, breakLength: Infinity })}`);
            return this.getPropValue(_srcNode, msg, { type: data.type, value: data.value, noError, now:dNow });
        }
        /*******************************************************************************************************/
        /**
         * Creates a out object, based on input data
         * @param {runtimeNode} _srcNode The base node
         * @param {Object} msg The Message Object to set the Data
         * @param {*} type type of the property to set
         * @param {*} value value of the property to set
         * @param {*} msgPropertyData Data object to set to the property
         * @public
         */
        setMessageProp(_srcNode, msg, type, value, msgPropertyData) {
            // _srcNode.debug(`setMessageProp type=${type} value=${value} msg=${util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })} data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (type === 'msgInput') {
                return;
            } else if (type === 'msgPayload') {
                msg.payload = msgPropertyData;
            } else if (type === 'msgTopic') {
                msg.topic = msgPropertyData;
            } else if (type === 'msgTs') {
                msg.ts = msgPropertyData;
            } else if (type === 'msgLc') {
                msg.lc = msgPropertyData;
            } else if (type === 'msgValue') {
                msg.value = msgPropertyData;
            } else if (type === 'msg') {
                RED.util.setMessageProperty(msg, value, msgPropertyData, true);
            } else if ((type === 'flow' || type === 'global')) {
                const contextKey = RED.util.parseContextStore(value.trim());
                _srcNode.context()[type].set(contextKey.key, msgPropertyData, contextKey.store);
            }
        }
        /*******************************************************************************************************/
        /**
         * get the time Data from a typed input
         * @param {runtimeNode} _srcNode - source node for logging
         * @param {Object} msg - the message object
         * @param {ITimePropertyType} data - a Data object
         * @returns {ITimePropertyResult} value of the type input
         * @public
         */
        getTimeProp(_srcNode, msg, data) {
            // _srcNode.debug(`getTimeProp data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })} tzOffset=${this.tzOffset}`);
            const result = {
                value: null,
                error: null,
                fix: true
            };
            const dNow = ((hlp.isValidDate(data.now)) ? new Date(data.now) : new Date());
            try {
                if (data.type === '' || data.type === 'none' || data.type === null || typeof data.type === 'undefined') {
                    result.error = 'internal error - time-type is not defined (type="' + String(data.type) + '" value="' + String(data.value) + '")';
                    _srcNode.error(result.error);
                    _srcNode.debug(util.inspect(data, {colors:true, compact:10}));
                } else if (data.type === 'date') {
                    result.value = dNow;
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'dateSpecific') {
                    const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                    result.value = hlp.normalizeDate(dNow, offsetX, data.multiplier, data);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'dayOfMonth') {
                    result.value = hlp.getSpecialDayOfMonth(dNow.getFullYear(), dNow.getMonth(), data.value);
                    const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                    result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                } else if (data.type === 'entered') {
                    result.value = hlp.getTimeOfText(String(data.value), dNow, (this.tzOffset === 0), this.tzOffset);
                    if (result.value !== null && typeof result.value !== 'undefined') {
                        const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                    }
                    result.fix = true;
                } else if (data.type === 'dateEntered') {
                    result.value =  hlp.getDateOfText(String(data.value), true, (this.tzOffset === 0), this.tzOffset);
                    if (result.value !== null && typeof result.value !== 'undefined') {
                        const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                    }
                    result.fix = true;
                } else if ((data.type === 'pdsTime')  || (data.type === 'pdsTimeCustom')) {
                    // sun
                    const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                    Object.assign(result, this._getSunTimeByName(dNow, data.value, offsetX, data.multiplier, data, data.latitude, data.longitude, data.height));
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'pdmTime') {
                    // moon
                    const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                    Object.assign(result, this._getMoonTimeByName(dNow, data.value, offsetX, data.multiplier, data, data.latitude, data.longitude));
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'pdsTimeNow') {
                    Object.assign(result, this._getSunTimePrevNext(dNow).next);
                    result.fix = true;
                    const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                    result.value = hlp.addOffset(new Date(result.value), offsetX, data.multiplier);
                } else if (data.type === 'str') {
                    result.fix = true;
                    if (data.format) {
                        result.value = hlp.parseDateFromFormat(data.value, data.format, RED._('position-config.days'), RED._('position-config.month'), RED._('position-config.dayDiffNames'));
                    } else {
                        result.value = hlp.getDateOfText(data.value, true, (this.tzOffset === 0), this.tzOffset);
                    }
                    const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                    result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                } else {
                    // can handle context, json, jsonata, env, ...
                    result.fix = false; // is not a fixed time if can be changed
                    const res = this.getPropValue(_srcNode, msg, data, true, dNow);
                    if (typeof res !== 'undefined' && res !== null) {
                        if (data.format) {
                            result.value = hlp.parseDateFromFormat(res, data.format, RED._('position-config.days'), RED._('position-config.month'), RED._('position-config.dayDiffNames'));
                        } else {
                            result.value = hlp.getDateOfText(res, true, (this.tzOffset === 0), this.tzOffset);
                        }
                        const offsetX = this._getOffsetVal(_srcNode, msg, data, dNow);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                        if (this.tzOffset) {
                            result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                        }
                        // this.debug(String(res) + '  --  ' + result.value);
                    } else {
                        result.error = RED._('errors.notEvaluableProperty', {type:data.type, value: data.value});
                    }
                }
            } catch (err) {
                _srcNode.debug(util.inspect(err));
                const e = new Error(RED._('errors.notEvaluablePropertyAdd', {type:data.type, value: data.value, err:err.message}));
                // @ts-ignore
                e.original = err;
                e.stack = e.stack.split('\n').slice(0,2).join('\n')+'\n'+err.stack;
                throw e;
            }
            if (!hlp.isValidDate(result.value)) {
                if (!result.error) {
                    result.error = 'Can not get time for ' + data.type + '=' + data.value;
                }
                result.value = new Date(dNow);
            }
            // _srcNode.debug(`getTimeProp data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })} tzOffset=${this.tzOffset} result=${ util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) }`);
            return result;
        }
        /*******************************************************************************************************/
        /**
        * get a prepared JSONATA Expression
        * @param {runtimeNode} _srcNode - source node information
        * @param {String} value - get an expression for a value
        * @returns {function} JSONataExpression
        * @public
        */
        getJSONataExpression(_srcNode, value) {
            // _srcNode.debug(`getJSONataExpression - data= ${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })}`);
            const expr = RED.util.prepareJSONataExpression(value, _srcNode);
            // expr.assign('sunTimes', function (val, store) {
            //     return node.context().global.get(val, store);
            // });
            // expr.registerFunction('clone', cloneMessage, '<(oa)-:o>');
            expr.registerFunction('isValidDate', date => {
                return hlp.isValidDate(date);
            }, '<x?:b>');
            expr.registerFunction('isBool', val => {
                return hlp.isBool(val);
            }, '<x:b>');
            expr.registerFunction('isTrue', val => {
                return hlp.isTrue(val);
            }, '<x:b>');
            expr.registerFunction('isFalse', val => {
                return hlp.isFalse(val);
            }, '<x:b>');
            expr.registerFunction('XOR', (a,b) => {
                return hlp.XOR(a,b);
            }, '<bb:b>');
            expr.registerFunction('XAND', (a, b) => {
                return hlp.XAND(a,b);
            }, '<bb:b>');
            expr.registerFunction('countDecimals', val => {
                return hlp.countDecimals(val);
            }, '<n:n>');
            expr.registerFunction('pad', (val, len) => {
                return hlp.pad(val, len);
            }, '<(nsb)n?:s>');
            expr.registerFunction('clipStrLength', (val, len) => {
                return hlp.clipStrLength(val, len);
            }, '<sn:s>');
            expr.registerFunction('getLastDayOfMonth', (year, month, weekday) => {
                if (weekday < 0) { weekday = 6; }
                if (weekday > 6) { weekday = 0; }
                return hlp.getLastDayOfMonth(year, month, weekday);
            }, '<nnn?n?:s>');
            expr.registerFunction('getNthWeekdayOfMonth', (year, month, weekday, nTh) => {
                return hlp.getNthWeekdayOfMonth(year, month, weekday, nTh);
            }, '<nnn?n?:s>');
            expr.registerFunction('getWeekOfYear', date => {
                return hlp.getWeekOfYear(new Date(date));
            }, '<(osn)?:a<n>>');
            expr.registerFunction('getDayOfYear', date => {
                return hlp.getDayOfYear(new Date(date));
            }, '<(osn)?:a<n>>');
            expr.registerFunction('getStdTimezoneOffset', date => {
                return hlp.getStdTimezoneOffset(new Date(date));
            }, '<(osn)?:n>');
            expr.registerFunction('isDSTObserved', date => {
                return hlp.isDSTObserved(new Date(date));
            }, '<(osn)?:b>');
            expr.registerFunction('addOffsetToDate', (date, offset, multiplier) => {
                return hlp.addOffset(new Date(date), offset, multiplier);
            }, '<(osn)?nn:b>');
            expr.registerFunction('getFormattedDateOut', (date, format, utc, timeZoneOffset) => {
                return hlp.getFormattedDateOut(date, format, utc, timeZoneOffset);
            }, '<(osn)?(sn)?b?n?:o>');
            expr.registerFunction('parseDateFromFormat', (date, format, utc, timeZoneOffset, dayNames, monthNames, dayDiffNames) => {
                return hlp.parseDateFromFormat(date, format, dayNames, monthNames, dayDiffNames, utc, timeZoneOffset);
            }, '<xs?b?n?a<s>?a<s>?a<s>?:s>');
            expr.registerFunction('parseTimeString', (text, date, utc, timeZoneOffset) => {
                return hlp.getTimeOfText(text, date, utc, timeZoneOffset);
            }, '<s(osn)?b?n?:o>');
            expr.registerFunction('isoStringToDate', text => {
                return hlp.isoStringToDate(text);
            }, '<s:o>');
            expr.registerFunction('parseDateTimeObject', (text, utc, timeZoneOffset, preferMonthFirst) => {
                return hlp.getDateOfText(text, preferMonthFirst, utc, timeZoneOffset);
            }, '<xb?n?b?:o>');
            expr.registerFunction('getSunTimeByName', (value, offset, multiplier, dNow, latitude, longitude, next, days, month, onlyOddDays, onlyEvenDays, onlyOddWeeks, onlyEvenWeeks, height) => {
                if (!hlp.isValidDate(dNow)) {
                    const dto = new Date(dNow); // if dNow is given as Number in milliseconds, try to convert
                    if (hlp.isValidDate(dto)) {
                        dNow = dto;
                    } else {
                        dNow = new Date();
                    }
                }
                const limit = {
                    next,
                    days: (Array.isArray(days)) ? days : '*',
                    month: (Array.isArray(month)) ? month : '*',
                    onlyOddDays,
                    onlyEvenDays,
                    onlyOddWeeks,
                    onlyEvenWeeks
                };
                return this._getSunTimeByName(dNow, value, offset, multiplier, limit, latitude, longitude, height).value;
            }, '<sn?n?(osn)?n?n?b?a?a?b?b?b?b?n?:(ol)>');
            expr.registerFunction('getSunTimePrevNext', dNow => {
                if (!hlp.isValidDate(dNow)) {
                    const dto = new Date(dNow); // if dNow is given as Number in milliseconds, try to convert
                    if (hlp.isValidDate(dto)) {
                        dNow = dto;
                    } else {
                        dNow = new Date();
                    }
                }
                return this._getSunTimePrevNext(dNow);
            }, '<(osn)?:(ol)>');
            expr.registerFunction('getSunTimeByElevationNext', (elevation, dNow) => {
                if (!hlp.isValidDate(dNow)) {
                    const dto = new Date(dNow); // if dNow is given as Number in milliseconds, try to convert
                    if (hlp.isValidDate(dto)) {
                        dNow = dto;
                    } else {
                        dNow = new Date();
                    }
                }
                return this._getSunTimeByElevation(dNow, parseFloat(elevation), {
                    type: 'str',
                    value: ''
                });
            }, '<sn?n?>');
            expr.registerFunction('getMoonTimeByName', (value, offset, multiplier, dNow) => {
                if (!hlp.isValidDate(dNow)) {
                    const dto = new Date(dNow); // if dNow is given as Number in milliseconds, try to convert
                    if (hlp.isValidDate(dto)) {
                        dNow = dto;
                    } else {
                        dNow = new Date();
                    }
                }
                return this._getMoonTimeByName(dNow, value, offset, multiplier).value;
            }, '<sn?n?(osn)?:(ol)>');
            expr.registerFunction('getSunCalc', (date, calcTimes, sunInSky) => {
                return this.getSunCalc(date, calcTimes, sunInSky);
            }, '<(osn)?b?b?:(ol)>');
            expr.registerFunction('getSunInSky', date => {
                return this._getSunInSky(date);
            }, '<(osn)?:n>');
            expr.registerFunction('getMoonCalc', (date, calcTimes, moonInSky) => {
                return this.getMoonCalc(new Date(date), calcTimes, moonInSky);
            }, '<(osn)?b?:(ol)>');
            expr.registerFunction('getMoonIllumination', date => {
                return this._getMoonIllumination(date);
            }, '<(osn)?:(ol)>');
            expr.registerFunction('getMoonPhase', date => {
                return this._getMoonIllumination(date).phase;
            }, '<(osn)?:(ol)>');
            return expr;
        }

        /**
         * get a property value from a type input in Node-Red
         * @param {runtimeNode} _srcNode - source node information
         * @param {Object} msg - message object
         * @param {IValuePropertyType} data - data object with more information
         * @param {Boolean} [noError] - true if no error shoudl be given in GUI
         * @param {Date} [dNow] base Date to use for Date time functions
         * @returns {*} value of the type input, return of the callback function if defined or __null__ if value could not resolved
         * @public
        */
        getPropValue(_srcNode, msg, data, noError, dNow) {
            // _srcNode.debug(`getPropValue ${data.type}.${data.value} (${data.addID}) - data= ${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })}`);
            noError = noError || data.noError;
            dNow = dNow || data.now;
            let result = null;
            if (typeof data.type === 'undefined' || data.type === null || data.type === '') {
                result = null;
            } else if (data.type === 'none') {
                if (typeof data.callback === 'function') {
                    return data.callback(undefined, data);
                }
                return undefined;
            } else if (data.type === 'num') {
                result = Number(data.value);
            } else if (data.type === 'numAzimuth' || data.type === 'numAltitude') {
                if (this.angleType === 'rad') {
                    result = hlp.angleNormRad(Number(data.value));
                } else {
                    result = hlp.angleNorm(Number(data.value));
                }
            } else if (data.type === 'numAnglePreDef') {
                const val = this.customAngles.find( el => el.name === data.value);
                if (typeof val === 'undefined') {
                    if (noError) { return NaN; }
                    throw new Error(RED._('errors.notEvaluableCustomAngle', data));
                }
                if (this.angleType === 'rad') {
                    result = hlp.angleNormRad(Number(val.angle));
                } else {
                    result = hlp.angleNorm(Number(val.angle));
                }
            } else if (data.type === 'str') {
                result = ''+data.value;
            } else if (data.type === 'strPlaceholder') {
                const replaceAttrs = {
                    name: _srcNode.name,
                    id: _srcNode.id,
                    path: _srcNode._path || _srcNode.id,
                    topic: ((!msg) ? '' : msg.topic)
                };
                result = hlp.textReplace(''+data.value, replaceAttrs, RED, msg);
            } else if (data.type === 'bool') {
                result = /^true$/i.test(data.value);
            } else if (data.type === 'date') {
                result = Date.now();
            } else if (data.type === 'msgPayload') {
                result = msg.payload;
            } else if (data.type === 'msgTopic') {
                result = msg.topic;
            } else if (data.type === 'msgValue') {
                result = msg.value;
            } else if (data.type === 'msgTs') {
                result =  msg.ts;
            } else if (data.type === 'msgLc') {
                result = msg.lc;
            } else if (data.type === 'numPct') {
                return parseFloat(data.value) / 100;
            } else if (data.type === 'nodeId') {
                // @ts-ignore
                return _srcNode.addId || _srcNode.id;
            } else if (data.type === 'nodeName') {
                return _srcNode.name || _srcNode._path || _srcNode.id; // if empty fallback to node ID
            } else if (data.type === 'nodePath') {
                return _srcNode._path || _srcNode.id; // if empty fallback to node ID
            } else if (data.type === 'randmNumCachedDay') {
                const val = data.value.split(/((?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?)/);
                return this._getCachedRandomDayNumber(_srcNode, parseFloat(val[1]), parseFloat(val[3]), dNow);
                // return (isNaN(rv) ? 0 : rv);
            } else if (data.type === 'randmNumCachedWeek') {
                const val = data.value.split(/((?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?)/);
                return this._getCachedRandomWeekNumber(_srcNode, parseFloat(val[1]), parseFloat(val[3]), dNow);
                // return (isNaN(rv) ? 0 : rv);
            } else if (data.type === 'randomNum') {
                const val = data.value.split(/((?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?)/);
                const limit1 = parseFloat(val[1]);
                if (isNaN(limit1)) {
                    _srcNode.error(`the value for random number limit is wrong "${data.value}", using 60`);
                    return Math.random() * 60;
                }
                const limit2 = parseFloat(val[3]);
                const low = Math.min(limit1, isNaN(limit2) ? 0 : limit2);
                const range = Math.max(limit1, isNaN(limit2) ? 0 : limit2) - low;
                return low + (Math.random() * range);
            } else if (data.type === 'PlT') {
                if (msg.topic && data.value && msg.topic.includes(data.value)) {
                    result = msg.payload;
                } else {
                    result = undefined;
                }
            } else if (data.type === 'pdsCalcData') {
                result = this.getSunCalc(dNow, true, false);
            } else if (data.type === 'pdsCalcPercent') {
                result = this._getSunInSky(dNow);
            } else if (data.type === 'pdsCalcAzimuth') {
                if (this.angleType === 'deg') {
                    result = this.getSunCalc(dNow, false, false).azimuthDegrees;
                } else {
                    result = this.getSunCalc(dNow, false, false).azimuthRadians;
                }
            } else if (data.type === 'pdsCalcElevation') {
                if (this.angleType === 'deg') {
                    result = this.getSunCalc(dNow, false, false).altitudeDegrees;
                } else {
                    result = this.getSunCalc(dNow, false, false).altitudeRadians;
                }
            } else if (data.type === 'pdsTimeByElevation') { // gives an object back
                result = this._getSunTimeByElevation(dNow, parseFloat(data.value), data);
            } else if (data.type === 'pdsTimeByAzimuth') {
                result = this._getSunTimeByAzimuth(dNow, parseFloat(data.value), data);
            } else if (data.type === 'pdsTimeByElevationNext') {
                result = this._getSunTimeByElevation(dNow, parseFloat(data.value), data);
                if (result.set.value.getTime() < result.rise.value.getTime()) {
                    return result.set;
                }
                return result.rise;
            } else if (data.type === 'pdsTimeByElevationRise') {
                result = this._getSunTimeByElevation(dNow, parseFloat(data.value), data, 'rise').rise;
            } else if (data.type === 'pdsTimeByElevationSet') {
                result = this._getSunTimeByElevation(dNow, parseFloat(data.value), data, 'set').set;
            } else if (data.type === 'pdmCalcData') {
                result = this.getMoonCalc(dNow, true, false);
            } else if (data.type === 'pdmPhase') {
                result = this._getMoonIllumination(dNow).phase;
            } else if (data.type === 'pdmPhaseCheck') {
                const phase = this._getMoonIllumination(dNow).phase;
                result = (phase.id === data.value);
            } else if (data.type === 'entered' || data.type === 'dateEntered') {
                result = hlp.getDateOfText(String(data.value), true, (this.tzOffset === 0), this.tzOffset);
            } else if (data.type === 'pdbIsDST') {
                result = hlp.isDSTObserved(dNow);
            } else if (data.type === 'pdnWeekOfYear') {
                result = hlp.getWeekOfYear(dNow);
            } else if (data.type === 'pdbWeekOfYearEven') {
                result = (hlp.getWeekOfYear(dNow)[1] % 2 === 0);
            } else if (data.type === 'pdnDayOfYear') {
                result = hlp.getDayOfYear(dNow);
            } else if (data.type === 'pdbDayOfYearEven') {
                result = (hlp.getDayOfYear(dNow)[1] % 2 === 0);
            } else if (data.type === 'jsonata') {
                try {
                    if (!data.expr) {
                        data.expr = this.getJSONataExpression(_srcNode, data.value);
                    }
                    result = RED.util.evaluateJSONataExpression(data.expr, msg);
                } catch (err) {
                    _srcNode.debug(util.inspect(err));
                }
            } else {
                try {
                    result = RED.util.evaluateNodeProperty(data.value, data.type, _srcNode, msg);
                } catch (err) {
                    _srcNode.log(util.inspect(err));
                }
            }
            if (typeof data.callback === 'function') {
                // _srcNode.debug('getPropValue result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) + ' - ' + typeof result);
                return data.callback(result, data);
            } else if (result === null || typeof result === 'undefined') {
                if (noError !== true) {
                    _srcNode.error(RED._('errors.notEvaluableProperty', data));
                }
                return undefined;
            }
            // _srcNode.debug('getPropValue result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) + ' - ' + typeof result);
            return result;
        }
        /*******************************************************************************************************/
        /**
         * compared two property's
         * @param {runtimeNode} _srcNode - source node information
         * @param {Object} msg - message object
         * @property {IValuePropertyType} operandA - first operand
         * @property {String} compare - compare between the both operands
         * @property {IValuePropertyType} operandB - second operand
         * @returns {*} value of the type input, return of the callback function if defined or __null__ if value could not resolved
         * @public
        */
        comparePropValue(_srcNode, msg, operandA, compare, operandB) {
            // _srcNode.debug(`getComparablePropValue operandA='${util.inspect(operandA, { colors: true, compact: 10, breakLength: Infinity })}' operandB='${util.inspect(operandB, { colors: true, compact: 10, breakLength: Infinity })}' compare='${util.inspect(compare, { colors: true, compact: 10, breakLength: Infinity })}'`);
            if (operandA.type === 'none' || operandA.type === '' || typeof operandA.type === 'undefined' || operandA.type === null) {
                return false;
            } else if (operandA.type === 'jsonata' || operandA.type === 'pdmPhaseCheck') {
                compare = 'true';
            }
            const a = this.getPropValue(_srcNode, msg, operandA);
            switch (compare) {
                case 'true':
                    return (a === true);
                case 'false':
                    return (a === false);
                case 'null':
                    return (typeof a == 'undefined' || a === null); // eslint-disable-line eqeqeq
                case 'nnull':
                    return (typeof a != 'undefined' && a !== null); // eslint-disable-line eqeqeq
                case 'empty':
                    if (typeof a === 'string' || Array.isArray(a) || Buffer.isBuffer(a)) {
                        return a.length === 0;
                    } else if (typeof a === 'object' && a !== null) {
                        return Object.keys(a).length === 0;
                    }
                    return false;
                case 'nempty':
                    if (typeof a === 'string' || Array.isArray(a) || Buffer.isBuffer(a)) {
                        return a.length !== 0;
                    } else if (typeof a === 'object' && a !== null) {
                        return Object.keys(a).length !== 0;
                    }
                    return false;
                case 'true_expr':
                    return hlp.isTrue(a);
                case 'false_expr':
                    return hlp.isFalse(a);
                case 'ntrue_expr':
                    return !hlp.isTrue(a);
                case 'nfalse_expr':
                    return !hlp.isFalse(a);
                case 'equal':
                    return (a == this.getPropValue(_srcNode, msg, operandB));  // eslint-disable-line eqeqeq
                case 'nequal':
                    return (a != this.getPropValue(_srcNode, msg, operandB));  // eslint-disable-line eqeqeq
                case 'lt':
                    return (a < this.getPropValue(_srcNode, msg, operandB));
                case 'lte':
                    return (a <= this.getPropValue(_srcNode, msg, operandB));
                case 'gt':
                    return (a > this.getPropValue(_srcNode, msg, operandB));
                case 'gte':
                    return (a >= this.getPropValue(_srcNode, msg, operandB));
                case 'contain': {
                    let val = this.getPropValue(_srcNode, msg, operandB);
                    if (!val) { return false; }
                    val = (val + '').trim();
                    return ((a + '').includes(val));
                }
                case 'containSome': {
                    let vals = this.getPropValue(_srcNode, msg, operandB);
                    if (!vals) { return false; }
                    vals = (vals + '').trim().split(/\s*[,;|]\s*/).filter(x => x);
                    const txt = (a + '');
                    return vals.some(v => txt.includes(v));
                }
                case 'containEvery': {
                    let vals = this.getPropValue(_srcNode, msg, operandB);
                    if (!vals) { return false; }
                    vals = (vals + '').trim().split(/\s*[,;|]\s*/).filter(x => x);
                    const txt = (a + '');
                    return vals.every(v => txt.includes(v));
                }
                default:
                    _srcNode.error(RED._('errors.unknownCompareOperator', { operator: compare, opTypeA: operandA.type, opValueA: operandA.value, opTypeB:operandB.type, opValueB:operandB.value}));
                    _srcNode.debug(`getComparablePropValue operandA='${util.inspect(operandA, { colors: true, compact: 10, breakLength: Infinity })}' operandB='${util.inspect(operandB, { colors: true, compact: 10, breakLength: Infinity })}' compare='${util.inspect(compare, { colors: true, compact: 10, breakLength: Infinity })}'`);
                    console.trace(); // eslint-disable-line
                    return hlp.isTrue(a);
            }
        }
        /**************************************************************************************************************/
        /**
         * calculates the sun position and times
         * @param {Date} [date] - defines the date to calculates sun data for (can be a number too)
         * @param {Boolean} [calcTimes] - defines if times should be calculated
         * @param {Boolean} [sunInSky] - is sun in sky should determinated
         * @param {Number} [specLatitude] - optionaly special latitude
         * @param {Number} [specLongitude] - optionaly special longitude
         * @param {Number} [specHeight] - optionaly observer height
         * @returns {ISunDataResult}
         * @public
         */
        getSunCalc(date, calcTimes, sunInSky, specLatitude, specLongitude, specHeight) {
            // this.debug(`getSunCalc for date="${date}" calcTimes="${calcTimes}" sunInSky="${sunInSky}"`);
            if (!hlp.isValidDate(date)) {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                } else {
                    date = new Date();
                }
            }

            const cacheEnabled = isNaN(specLatitude) && isNaN(specLongitude) && isNaN(specHeight);
            if (cacheEnabled && (Math.abs(date.getTime() - this.cache.lastSunCalc.ts) < 3000)) {
                // @ts-ignore
                this.log('getSunCalc, time difference since last output to low, do no calculation');
                // @ts-ignore
                return this.cache.lastSunCalc;
            }
            specLatitude = specLatitude || this.latitude;
            specLongitude = specLongitude || this.longitude;
            specHeight = specHeight || this.height;

            const sunPos = sunCalc.getPosition(date.valueOf(), specLatitude, specLongitude);

            /** @type {ISunDataResult} */
            const result = {
                ts: date.getTime(),
                lastUpdate:     date,
                lastUpdateStr:  date.getFullYear() + '-' // return custom format
                                + hlp.pad2(date.getMonth() + 1) + '-'
                                + hlp.pad2(date.getDate()) + 'T'
                                + hlp.pad2(date.getHours()) + ':'
                                + hlp.pad2(date.getMinutes()) + ':'
                                + hlp.pad2(date.getSeconds()),
                latitude:       specLatitude,
                longitude:      specLongitude,
                height:         specHeight,
                angleType:      this.angleType,
                azimuth:        (this.angleType === 'deg') ? sunPos.azimuthDegrees : sunPos.azimuth,
                altitude:       (this.angleType === 'deg') ? sunPos.altitudeDegrees : sunPos.altitude, // elevation = altitude
                altitudeDegrees:    sunPos.altitudeDegrees,
                azimuthDegrees:     sunPos.azimuthDegrees,
                altitudeRadians:    sunPos.altitude,
                azimuthRadians:     sunPos.azimuth,
                times:              undefined
            };

            if (!calcTimes) { return result; }

            this._sunTimesCheck(); // refresh if needed, get dayId
            const dayId = hlp.getDayId(date);
            if (cacheEnabled && dayId === this.cache.sunTimesToday.dayId) {
                result.times = this.cache.sunTimesToday.times;
                result.positionAtSolarNoon = this.cache.sunTimesToday.sunPosAtSolarNoon;
            } else if (cacheEnabled && dayId === this.cache.sunTimesTomorrow.dayId) {
                result.times = this.cache.sunTimesTomorrow.times;
                result.positionAtSolarNoon = this.cache.sunTimesTomorrow.sunPosAtSolarNoon;
            } else if (cacheEnabled && dayId === this.cache.sunTimesAdd1.dayId) {
                result.times = this.cache.sunTimesAdd1.times;
            } else if (cacheEnabled && dayId === this.cache.sunTimesAdd2.dayId) {
                result.times = this.cache.sunTimesAdd2.times;
            } else {
                // this.debug('getSunTimes calc extra time');
                result.times = sunCalc.getSunTimes(date.valueOf(), specLatitude, specLongitude, specHeight, true); // needed for a object copy
            }
            if (!result.positionAtSolarNoon && sunInSky && result.times.solarNoon.valid) {
                result.positionAtSolarNoon = sunCalc.getPosition(result.times.solarNoon.value.valueOf(), specLatitude, specLongitude);
            }

            if (result.positionAtSolarNoon && result.times.solarNoon.valid) {
                result.altitudePercent = (result.altitudeDegrees / result.positionAtSolarNoon.altitudeDegrees) * 100;
                /* if (result.altitudeDegrees > 0) { - allow negative altitudePercent #259
                    result.altitudePercent = (result.altitudeDegrees / result.positionAtSolarNoon.altitudeDegrees) * 100;
                } else {
                    result.altitudePercent = 0;
                } */
            }

            if (cacheEnabled) {
                this.cache.lastSunCalc = result;
            }
            // this.debug('getSunCalc result= ' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }

        /**************************************************************************************************************/
        /**
         * calculates if the sun is in the sky
         * @param {Date} [date] - defines the date to calculates sun data for (can be a number too)
         * @returns {Number}
         * @private
         */
        _getSunInSky(date) {
            const result = this.getSunCalc(date, true, true);
            return result.altitudePercent;
        }
        /**************************************************************************************************************/
        /**
         * calculates if the sun is in the sky
         * @param {Date} [date] - defines the date to calculates sun data for (can be a number too)
         * @returns {IMoonIllumination}
         * @private
         */
        _getMoonIllumination(date) {
            if (!hlp.isValidDate(date)) {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                } else {
                    date = new Date();
                }
            }

            const dayIdReq = hlp.getDayId(date);
            const dayIdNow = hlp.getDayId(new Date());
            if (this.moonIlluminationToday && dayIdNow === dayIdReq && dayIdNow === this.moonIlluDayId) {
                return Object.assign({}, this.moonIlluminationToday); // needed for a object copy
            }

            const result = sunCalc.getMoonIllumination(date.valueOf());
            result.phase.nameAlt = RED._('common.typeOptions.' + result.phase.id);
            // result.phase.angle = (this.angleType === 'rad') ? (moonIllum.angle * 360) / (180 / Math.PI) : moonIllum.angle * 360;
            // angle: (this.angleType === 'deg') ? 180 / Math.PI * moonIllum.angle : moonIllum.angle,

            if (dayIdNow !== this.moonIlluDayId && dayIdNow === dayIdReq) {
                /** @type {IMoonIllumination} */
                this.moonIlluminationToday = Object.assign({}, result);
                /** @type {number} */
                this.moonIlluDayId = dayIdNow;
            }
            return result;
        }

        /**
         * calculates the moon position
         * @param {Date} [date] - defines the date to calculates sun data for (can be a number too)
         * @param {Boolean} [calcTimes] - defines if times should be calculated
         * @param {Boolean} [moonInSky] - is moon in sky should determinated
         * @param {Number} [specLatitude] - optionaly special latitude
         * @param {Number} [specLongitude] - optionaly special longitude
         * @returns {IMoonDataResult}
         * @public
         */
        getMoonCalc(date, calcTimes, moonInSky, specLatitude, specLongitude) {
            if (!hlp.isValidDate(date)) {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                } else {
                    date = new Date();
                }
            }

            const cacheEnabled = isNaN(specLatitude) && isNaN(specLongitude);
            if (cacheEnabled && (Math.abs(date.getTime() - this.cache.lastMoonCalc.ts) < 3000)) {
                // @ts-ignore
                this.log('getMoonCalc, time difference since last output to low, do no calculation');
                return this.cache.lastMoonCalc;
            }
            specLatitude = specLatitude || this.latitude;
            specLongitude = specLongitude || this.longitude;

            const moonData = sunCalc.getMoonData(date.valueOf(), specLatitude, specLongitude);

            /** @type {IMoonDataResult} */
            const result = {
                ts: date.getTime(),
                lastUpdate:     date,
                lastUpdateStr:  date.getFullYear() + '-'
                                + hlp.pad2(date.getMonth() + 1) + '-'
                                + hlp.pad2(date.getDate()) + 'T'
                                + hlp.pad2(date.getHours()) + ':'
                                + hlp.pad2(date.getMinutes()) + ':'
                                + hlp.pad2(date.getSeconds()),
                latitude:       specLatitude,
                longitude:      specLongitude,
                angleType:      this.angleType,
                azimuth:        (this.angleType === 'deg') ? moonData.azimuthDegrees : moonData.azimuth,
                altitude:       (this.angleType === 'deg') ? moonData.altitudeDegrees : moonData.altitude, // elevation = altitude
                altitudeDegrees:    moonData.altitudeDegrees,
                azimuthDegrees:     moonData.azimuthDegrees,
                altitudeRadians:    moonData.altitude,
                azimuthRadians:     moonData.azimuth,
                distance:           moonData.distance,
                parallacticAngle:   (this.angleType === 'deg') ? moonData.parallacticAngleDegrees : moonData.parallacticAngle,
                illumination:       moonData.illumination,
                zenithAngle:        (this.angleType === 'deg') ? hlp.toDec(moonData.zenithAngle) : moonData.zenithAngle,
                times: undefined
            };

            if (!calcTimes) { return result; }

            this._moonTimesCheck();
            const dayId = hlp.getDayId(date);
            if (cacheEnabled && dayId === this.cache.moonTimesToday.dayId) {
                result.times = this.cache.moonTimesToday.times;
                result.timesNext = this.cache.moonTimesTomorrow.times;
                result.positionAtRise = this.cache.moonTimesToday.positionAtRise;
                result.positionAtSet = this.cache.moonTimesToday.positionAtSet;
            } else if (cacheEnabled && dayId === this.cache.moonTimesTomorrow.dayId) {
                result.times = this.cache.moonTimesTomorrow.times;
                result.timesNext = this.cache.moonTimes2Days.times;
                result.positionAtRise = this.cache.moonTimesTomorrow.positionAtRise;
                result.positionAtSet = this.cache.moonTimesTomorrow.positionAtSet;
            } else if (cacheEnabled && dayId === this.cache.moonTimes2Days.dayId) {
                result.times = this.cache.moonTimes2Days.times;
                result.positionAtRise = this.cache.moonTimes2Days.positionAtRise;
                result.positionAtSet = this.cache.moonTimes2Days.positionAtSet;
            } else {
                result.times = sunCalc.getMoonTimes(date.valueOf(), specLatitude, specLongitude);
            }

            if (moonInSky) {
                if (!result.positionAtRise && result.times.rise) {
                    result.positionAtRise = sunCalc.getMoonPosition(result.times.rise.valueOf(), specLatitude, specLongitude);
                }

                if (!result.positionAtSet && result.times.set) {
                    result.positionAtSet = sunCalc.getMoonPosition(result.times.set.valueOf(), specLatitude, specLongitude);
                }
            }

            if (result.times.highest) {
                result.highestPosition = sunCalc.getMoonPosition(result.times.highest.valueOf(), specLatitude, specLongitude);
                result.altitudePercent = (result.altitudeDegrees / result.highestPosition.altitudeDegrees) * 100;
            }

            if (cacheEnabled) {
                this.cache.lastMoonCalc = result;
            }

            if (result.times.alwaysUp) {
                result.isUp = true;
            } else if (result.times.alwaysDown) {
                result.isUp = false;
            } else {
                if (result.positionAtRise && result.positionAtSet) {
                    result.isUp = (result.positionAtRise.azimuthDegrees < result.azimuthDegrees) &&
                                  (result.positionAtSet.azimuthDegrees > result.azimuthDegrees);
                }
            }

            return result;
        }
        /**************************************************************************************************************/
        /**
         * refreshes cached sun times
         * @param {Number} todayValue - timestamp of today
         * @param {Number} dayId - number of current day
         * @private
         */
        _sunTimesRefresh(todayValue, dayId) {
            if (!this.valid) { return; }
            if (this.cache.sunTimesToday.dayId === (dayId + 1)) {
                this.cache.sunTimesToday.times = this.cache.sunTimesTomorrow.times;
                this.cache.sunTimesToday.sunPosAtSolarNoon = this.cache.sunTimesTomorrow.sunPosAtSolarNoon;
                this.cache.sunTimesToday.dayId = this.cache.sunTimesTomorrow.dayId;
            } else {
                this.cache.sunTimesToday.times = sunCalc.getSunTimes(todayValue, this.latitude, this.longitude, this.height, true);
                this.cache.sunTimesToday.sunPosAtSolarNoon = sunCalc.getPosition(this.cache.sunTimesToday.times.solarNoon.value.valueOf(), this.latitude, this.longitude);
                this.cache.sunTimesToday.dayId = dayId;
            }
            // @ts-ignore
            this.cache.sunTimesTomorrow = {};
            this.cache.sunTimesTomorrow.times = sunCalc.getSunTimes(todayValue + hlp.TIME_24h, this.latitude, this.longitude, this.height, true);
            this.cache.sunTimesTomorrow.sunPosAtSolarNoon = sunCalc.getPosition(this.cache.sunTimesTomorrow.times.solarNoon.value.valueOf(), this.latitude, this.longitude);
            this.cache.sunTimesTomorrow.dayId = (dayId + 1);

            // this.debug(`sunTimesRefresh - calculate sun times - dayId=${dayId}, today=${today.toISOString()}, this.cache=${util.inspect(this.cache, { colors: true, compact: 10, breakLength: Infinity })}`);
        }

        /**
         * check if sun times needs refresh
         * @param {Boolean} [force=false] - forces refresh
         * @private
         */
        _sunTimesCheck(force) {
            // this.debug(`_sunTimesCheck - force=${force}`);
            const today = new Date();
            const dayId = hlp.getDayId(today); // _getUTCDayId(today);
            if (force || this.cache.sunTimesToday.dayId !== dayId) {
                this._sunTimesRefresh(today.valueOf(), dayId);
            }
        }

        /**
         * refreshes cached moon times
         * @param {Number} todayValue - timestamp of today
         * @param {Number} dayId - number of current day
         * @private
         */
        _moonTimesRefresh(todayValue, dayId) {
            if (!this.valid) { return; }

            if (this.cache.moonTimesToday.dayId === (dayId + 1)) {
                this.cache.moonTimesTomorrow.dayId = this.cache.moonTimes2Days.dayId;
                this.cache.moonTimesTomorrow.times = this.cache.moonTimes2Days.times;
                this.cache.moonTimesToday.dayId = this.cache.moonTimesTomorrow.dayId;
                this.cache.moonTimesToday.times = this.cache.moonTimesTomorrow.times;
                // @ts-ignore
                this.cache.moonTimes2Days = {};
            } else {
                this.cache.moonTimesToday.dayId = dayId;
                this.cache.moonTimesToday.times = sunCalc.getMoonTimes(todayValue, this.latitude, this.longitude);
                this.cache.moonTimesTomorrow.times = sunCalc.getMoonTimes(todayValue + hlp.TIME_24h, this.latitude, this.longitude);
                this.cache.moonTimesTomorrow.dayId = (dayId + 1);
            }
            this.cache.moonTimes2Days.times = sunCalc.getMoonTimes(todayValue + hlp.TIME_24h + hlp.TIME_24h, this.latitude, this.longitude);
            this.cache.moonTimes2Days.dayId = (dayId + 2);
        }

        /**
         * check if moon times needs refresh
         * @param {Boolean} [force=false] - forces refresh
         * @private
         */
        _moonTimesCheck(force) {
            // this.debug(`_moonTimesCheck - force=${force}`);
            const today = new Date();
            const dayId = hlp.getDayId(today); // this._getUTCDayId(dateb);
            if (force || this.cache.moonTimesToday.dayId !== dayId) {
                this._moonTimesRefresh(today.valueOf(), dayId);
            }
        }
    }

    /**************************************************************************************************************/
    RED.nodes.registerType('position-config', positionConfigurationNode, {
        credentials: {
            posLatitude: { type: 'text' },
            posLongitude: { type: 'text' },
            height: { type: 'text' }
        }
    });

    RED.httpAdmin.get('/sun-position/js/*', RED.auth.needsPermission('sun-position.read'), (req, res) => {
        const options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });

    RED.httpAdmin.get('/sun-position/data', RED.auth.needsPermission('sun-position.read'), (req, res) => {
        if (req.query.config && req.query.config !== '_ADD_') {
            /** @type {IPositionConfigNode} */
            const posConfig = RED.nodes.getNode(req.query.config);
            if (!posConfig) {
                res.status(500).send(JSON.stringify({
                    error: 'can not find position config node "' +req.query.config+'" '+String(posConfig)
                }));
                return;
            }
            let scrNode;
            if (req.query.nodeId) {
                scrNode = RED.nodes.getNode(req.query.nodeId);
            }
            if (!scrNode) {
                scrNode = posConfig;
            }
            let obj = { value:'none', useful: false};
            try {
                if (req.query.kind === 'autoComplete') {
                    if (req.query.type === 'numAnglePreDef') {
                        obj = posConfig.getCustomAngles(req.query.value);
                        res.status(200).send(JSON.stringify(obj)); // ...getOwnProper... does not work for arrays!
                    } else if (req.query.type === 'pdsTimeCustom') {
                        obj = posConfig.getSunTimesList(req.query.value);
                        res.status(200).send(JSON.stringify(obj)); // ...getOwnProper... does not work for arrays!
                    } else {
                        res.status(400).send(JSON.stringify({value: '', error: 'no valid configuration!!'}));
                    }
                } else if (req.query.kind === 'getTimeData') {
                    obj = posConfig.getTimeProp(scrNode, undefined, req.query); // req.query.type, req.query.value, req.query.offsetType, req.query.offset, req.query.multiplier, req.query.next, req.query.days);
                    obj.useful = true;
                    res.status(200).send(JSON.stringify(obj, Object.getOwnPropertyNames(obj)));
                } else if (req.query.kind === 'getOutDataData') {
                    obj.value = posConfig.getOutDataProp(scrNode, undefined, req.query, req.query.now); // req.query.type, req.query.value, req.query.format, req.query.offset, req.query.offsetType, req.query.multiplier, req.query.next, req.query.days);
                    obj.useful = true;
                    res.status(200).send(JSON.stringify(obj, Object.getOwnPropertyNames(obj)));
                } else {
                    res.status(400).send(JSON.stringify(obj, Object.getOwnPropertyNames(obj)));
                }
            } catch(err) {
                console.log('RED.httpAdmin.get data ERR'); // eslint-disable-line no-console
                console.log(err); // eslint-disable-line no-console
                delete obj.value;
                obj.useful = false;
                obj.error = err.message;
                obj.errorStack= err.stack;
                scrNode.debug(util.inspect(err));
                scrNode.error(err.message);
                res.status(200).send(JSON.stringify(obj, Object.getOwnPropertyNames(obj)));
            }
        } else {
            res.status(400).send(JSON.stringify({value: '', error: 'no valid configuration!!'}));
        }
    });
};
// })();