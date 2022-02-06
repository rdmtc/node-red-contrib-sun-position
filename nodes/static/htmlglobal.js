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

/************************************************************************/
/**
 * get selection firlds
 * @returns {Object} Object for selection fields
 */
function getSelectFields() { // eslint-disable-line no-unused-vars
    return {
        operatorsGroups: [
            { id: 'default', label: 'compare Timestamp', i18n: 'common.operatorsGroups.0'},
            { id: 'other', label: 'always', i18n: 'common.operatorsGroups.1'}
        ],
        operators: [
            {id: 1, group: 'default', label: '==', text: 'equal', i18n: 'common.operators.0'},
            {id: 2, group: 'default', label: '!=', text: 'unequal', i18n: 'common.operators.1'},
            {id: 3, group: 'default', label: '>', text: 'greater', i18n: 'common.operators.2'},
            {id: 4, group: 'default', label: '>=', text: 'greater or equal', i18n: 'common.operators.3'},
            {id: 5, group: 'default', label: '<', text: 'lesser', i18n: 'common.operators.4'},
            {id: 6, group: 'default', label: '<=', text: 'lesser or equal', i18n: 'common.operators.5'},
            {id: 99, group: 'other', label: 'otherwise', text: 'otherwise', i18n: 'common.operators.6'}
        ], operatorTypesGroups: [
            {id: 'default', label: 'include into compare', i18n: 'common.operatorTypesGroups.0'},
            {id: 'spec', label: 'special', i18n: 'common.operatorTypesGroups.1'}
        ], operatorTypes: [
            {id: 11, group: 'default', label: 'Milliseconds', i18n: 'common.operatorTypes.0'},
            {id: 12, group: 'default', label: 'Seconds', i18n: 'common.operatorTypes.1'},
            {id: 13, group: 'default', label: 'Minutes', i18n: 'common.operatorTypes.2'},
            {id: 14, group: 'default', label: 'Hours', i18n: 'common.operatorTypes.3'},
            {id: 15, group: 'default', label: 'Day of Month', i18n: 'common.operatorTypes.4'},
            {id: 16, group: 'default', label: 'Month', i18n: 'common.operatorTypes.5'},
            {id: 17, group: 'default', label: 'Year', i18n: 'common.operatorTypes.6'},
            {id: 18, group: 'spec', label: 'Day of Week', i18n: 'common.operatorTypes.7'}
        ], outputTSFormatsGroups: [
            {id: 'time', label: 'timestamp (number)', i18n: 'common.outputTSFormatsGroups.0'},
            {id: 'timeRounded', label: 'timestamp rounded (number)', i18n: 'common.outputTSFormatsGroups.1'},
            {id: 'string', label: 'Text', i18n: 'common.outputTSFormatsGroups.2'}
        ], outputTSFormats: [
            {id: 0, group: 'time', name: 'ms', label: 'milliseconds', i18n: 'common.outputTSFormats.0'},
            {id: 1, group: 'time', name: 'sec', label: 'seconds', i18n: 'common.outputTSFormats.1'},
            {id: 2, group: 'time', name: 'min', label: 'minutes', i18n: 'common.outputTSFormats.2'},
            {id: 3, group: 'time', name: 'hour', label: 'hours', i18n: 'common.outputTSFormats.3'},
            {id: 4, group: 'time', name: 'days', label: 'days', i18n: 'common.outputTSFormats.4'},
            {id: 5, group: 'time', name: 'weeks', label: 'weeks', i18n: 'common.outputTSFormats.5'},
            {id: 6, group: 'time', name: 'month', label: 'month', i18n: 'common.outputTSFormats.6'},
            {id: 7, group: 'time', name: 'years', label: 'years', i18n: 'common.outputTSFormats.7'},
            {id: 11, group: 'timeRounded', name: 'sec', label: 'seconds', i18n: 'common.outputTSFormats.8'},
            {id: 12, group: 'timeRounded', name: 'min', label: 'minutes', i18n: 'common.outputTSFormats.9'},
            {id: 13, group: 'timeRounded', name: 'hour', label: 'hours', i18n: 'common.outputTSFormats.10'},
            {id: 14, group: 'timeRounded', name: 'days', label: 'days', i18n: 'common.outputTSFormats.11'},
            {id: 15, group: 'timeRounded', name: 'weeks', label: 'weeks', i18n: 'common.outputTSFormats.12'},
            {id: 16, group: 'timeRounded', name: 'month', label: 'month', i18n: 'common.outputTSFormats.13'},
            {id: 17, group: 'timeRounded', name: 'years', label: 'years', i18n: 'common.outputTSFormats.14'},
            {id: 99, group: 'string', name: 'Other', label: 'Other', i18n: 'common.outputTSFormats.15'}
        ], outputFormatsGroups: [
            {id: 'number', label: 'Number', i18n: 'common.outputFormatsGroups.0'},
            {id: 'string', label: 'Text (string)', i18n: 'common.outputFormatsGroups.1'},
            {id: 'time', label: 'time (number) since emit', i18n: 'common.outputFormatsGroups.2'},
            {id: 'dayOfWeek', label: 'day of week', i18n: 'common.outputFormatsGroups.3'},
            {id: 'dayOfYear', label: 'day of year', i18n: 'common.outputFormatsGroups.4'},
            {id: 'WeekOfYear', label: 'week of year', i18n: 'common.outputFormatsGroups.5'},
            {id: 'other', label: 'Other', i18n: 'common.outputFormatsGroups.6'}
        ], outputFormats: [
            {id: 0, group: 'number', name: 'UNIX', label: 'milliseconds UNIX timestamp', i18n: 'common.outputFormats.0'},
            {id: 10, group: 'number', name: 'YYYYMMDDHHMMSS', label: 'YYYYMMDDHHMMSS', i18n: 'common.outputFormats.1'},
            {id: 11, group: 'number', name: 'YYYYMMDD_HHMMSS', label: 'YYYYMMDD.HHMMSS', i18n: 'common.outputFormats.2'},
            {id: 1, group: 'string', name: 'UTC', label: 'UTC date and time', i18n: 'common.outputFormats.3'},
            {id: 2, group: 'string', name: 'local', label: 'local date and time', i18n: 'common.outputFormats.4'},
            {id: 3, group: 'string', name: 'localTime', label: 'local time', i18n: 'common.outputFormats.5'},
            {id: 12, group: 'string', name: 'localDate', label: 'local date', i18n: 'common.outputFormats.6'},
            {id: 5, group: 'string', name: 'ISO', label: 'ISO date and time', i18n: 'common.outputFormats.7'},
            {id: 18, group: 'string', name: 'ISO-2', label: 'ISO date and time of local timezone', i18n: 'common.outputFormats.8'},
            {id: 6, group: 'time', name: 'ms', label: 'milliseconds', i18n: 'common.outputFormats.9'},
            {id: 7, group: 'time', name: 'sec', label: 'seconds', i18n: 'common.outputFormats.10'},
            {id: 8, group: 'time', name: 'min', label: 'minutes', i18n: 'common.outputFormats.11'},
            {id: 9, group: 'time', name: 'hour', label: 'hours', i18n: 'common.outputFormats.12'},
            {id: 16, group: 'dayOfWeek', name: 'Day Name', label: 'Day Name, e.g. Monday, 22.12.', i18n: 'common.outputFormats.13'},
            {id: 17, group: 'dayOfWeek', name: 'Day', label: 'Day in relative, e.g. Today, 22.12.', i18n: 'common.outputFormats.14'},
            {id: 19, group: 'WeekOfYear', name: 'week number', label: 'Number of week e.g. 22', i18n: 'common.outputFormats.15'},
            {id: 20, group: 'WeekOfYear', name: 'is week even', label: 'Boolean if week is even', i18n: 'common.outputFormats.16'},
            {id: 21, group: 'dayOfYear', name: 'day number', label: 'Number of day e.g. 365', i18n: 'common.outputFormats.17'},
            {id: 22, group: 'dayOfYear', name: 'is day even', label: 'Boolean if day is even', i18n: 'common.outputFormats.18'},
            {id: -1, group: 'other', name: 'object', label: 'as object', i18n: 'common.outputFormats.19'},
            {id: 99, group: 'other', name: 'free definition', label: 'Other', i18n: 'common.outputFormats.20'}
        ], parseFormatsGroups: [
            {id: 'number', label: 'Number', i18n: 'common.parseFormatsGroups.0'},
            {id: 'string', label: 'Text (string)', i18n: 'common.parseFormatsGroups.1'},
            {id: 'other', label: 'Other', i18n: 'common.parseFormatsGroups.2'}
        ], parseFormats: [
            {id: 0, group: 'number', label: 'milliseconds UNIX timestamp', add: 'xxx', i18n: 'common.parseFormats.0'},
            {id: 1, group: 'string', label: 'ECMA-262', add: 'standard JS Date representation', i18n: 'common.parseFormats.1'},
            {id: 6, group: 'string', label: 'ISO 8601', add: 'YYYY-MM-TTTHH:MM:SS.sssZ , YYYY-MM-TTTHH:MM:SS+HH:MM or YYYY-MM-TTTHH:MM:SS-HH:MM', i18n: 'common.parseFormats.2'},
            {id: 2, group: 'string', label: 'try different text Formats, prefer day first like d/M/y (e.g. European format)', add: 'will try different formats, prefer European formats', i18n: 'common.parseFormats.3'},
            {id: 3, group: 'string', label: 'try different text Formats, prefer month first like M/d/y (e.g. American format)', add: 'will try different formats, prefer American formats', i18n: 'common.parseFormats.4'},
            {id: 4, group: 'number', label: 'YYYYMMDDHHMMSS', add: 'xxx', i18n: 'common.parseFormats.5'},
            {id: 5, group: 'number', label: 'YYYYMMDD.HHMMSS', add: 'xxx', i18n: 'common.parseFormats.6'},
            {id: 98, group: 'other', label: 'various - try different Formats (object, number, text)', add: 'xxx', i18n: 'common.parseFormats.7'},
            {id: 99, group: 'other', label: 'text - free definition', add: 'xxx', i18n: 'common.parseFormats.8'}
        ], multiplierGroups: [
            {id: 'default', label: 'Standard', i18n: 'common.multiplierGroups.0'},
            {id: 'other', label: 'Special', i18n: 'common.multiplierGroups.1'}
        ], multiplier: [
            {id: 1, group: 'default', label: 'milliseconds', i18n: 'common.multiplier.0'},
            {id: 1000, group: 'default', label: 'seconds', i18n: 'common.multiplier.1'},
            {id: 60000, group: 'default', label: 'minutes', i18n: 'common.multiplier.2'},
            {id: 3600000, group: 'default', label: 'hours', i18n: 'common.multiplier.3'},
            {id: 86400000, group: 'default', label: 'days', i18n: 'common.multiplier.4'},
            {id: 604800000, group: 'other', label: 'weeks', i18n: 'common.multiplier.5'}, // maximum is 2147483647 - 24 Tage!
            {id: -1, group: 'other', label: 'month', i18n: 'common.multiplier.6'},
            {id: -2, group: 'other', label: 'year', i18n: 'common.multiplier.7'}
        ], comparatorGroups: [
            { id: 'simple', label: 'simple', i18n: 'common.comparatorGroups.0' },
            { id: 'compare', label: 'compare', i18n: 'common.comparatorGroups.1' },
            { id: 'enhanced', label: 'enhanced', i18n: 'common.comparatorGroups.2' }
        ], comparator: [
            { id: 'true', group: 'simple', label: 'true', operandCount: 1, i18n: 'common.comparator.0' },
            { id: 'false', group: 'simple', label: 'false', operandCount: 1, i18n: 'common.comparator.1' },
            { id: 'null', group: 'simple', label: 'null', operandCount: 1, i18n: 'common.comparator.2' },
            { id: 'nnull', group: 'simple', label: 'not null', operandCount: 1, i18n: 'common.comparator.3' },
            { id: 'empty', group: 'simple', label: 'empty', operandCount: 1, i18n: 'common.comparator.4' },
            { id: 'nempty', group: 'simple', label: 'not empty', operandCount: 1, i18n: 'common.comparator.5' },
            { id: 'true_expr', group: 'enhanced', label: 'true_expr', operandCount: 1, i18n: 'common.comparator.6' },
            { id: 'false_expr', group: 'enhanced', label: 'false_expr', operandCount: 1, i18n: 'common.comparator.7' },
            { id: 'ntrue_expr', group: 'enhanced', label: 'not true_expr', operandCount: 1, i18n: 'common.comparator.8'},
            { id: 'nfalse_expr', group: 'enhanced', label: 'not false_expr', operandCount: 1, i18n: 'common.comparator.9' },
            { id: 'equal', group: 'compare', label: 'equal', operandCount: 2, i18n: 'common.comparator.10' },
            { id: 'nequal', group: 'compare', label: 'not equal', operandCount: 2, i18n: 'common.comparator.11' },
            { id: 'lt', group: 'compare', label: 'less than', operandCount: 2, i18n: 'common.comparator.12' },
            { id: 'lte', group: 'compare', label: 'less than or equal', operandCount: 2, i18n: 'common.comparator.13' },
            { id: 'gt', group: 'compare', label: 'greater than', operandCount: 2, i18n: 'common.comparator.14' },
            { id: 'gte', group: 'compare', label: 'greater than or equal', operandCount: 2, i18n: 'common.comparator.15' },
            { id: 'contain', group: 'enhanced', label: 'contain', operandCount: 2, i18n: 'common.comparator.16' },
            { id: 'containSome', group: 'enhanced', label: 'containSome', operandCount: 2, i18n: 'common.comparator.17' },
            { id: 'containEvery', group: 'enhanced', label: 'containEvery', operandCount: 2, i18n: 'common.comparator.18' }
        ]
    };
}

/**
 * check types of deprecate values
 * @param {*} type type to check
 * @param {*} value value to check
 * @returns original value or replaced one
 */
function checkDeprecatedValues(type, value) {
    if (type === 'pdsTime') {
        const data = [
            ['dawn', 'civilDawn'],
            ['dusk', 'civilDusk'],
            ['nightEnd', 'astronomicalDawn'],
            ['night', 'astronomicalDusk'],
            ['nightStart', 'astronomicalDusk'],
            ['goldenHour', 'goldenHourDuskStart'],
            ['sunrise', 'sunriseStart'],
            ['sunset', 'sunsetEnd'],
            ['goldenHourEnd', 'goldenHourDawnEnd'],
            ['goldenHourStart', 'goldenHourDuskStart']
        ];
        for (let index = 0; index < data.length; index++) {
            if (value === data[index][0]) {
                value = data[index][1];
                break;
            }
        }
    }
    return value;
}

/**
 * get types for typeInputs
 * @param {*} node - node representation for access to i18N function (node._())
 * @returns {Object} object of types
 */
function getTypes(node) { // eslint-disable-line no-unused-vars
    return {
        Unlimited: {
            value: 'none',
            label: node._('node-red-contrib-sun-position/position-config:common.types.unlimited','no limitation'),
            hasValue: false
        },
        Undefined: {
            value: 'none',
            label: node._('node-red-contrib-sun-position/position-config:common.types.undefined'),
            hasValue: false
        },
        DateSpecific: {
            value: 'dateSpecific',
            label: node._('node-red-contrib-sun-position/position-config:common.types.datespecific'),
            hasValue: false
        },
        MsgInput: {
            value: 'msgInput',
            label: node._('node-red-contrib-sun-position/position-config:common.types.msgInput'),
            hasValue: false
        },
        MsgPayload: {
            value: 'msgPayload',
            label: 'msg.payload',
            hasValue: false
        },
        MsgTs: {
            value: 'msgTs',
            label: 'msg.ts',
            hasValue: false
        },
        MsgLc: {
            value: 'msgLc',
            label: 'msg.lc',
            hasValue: false
        },
        MsgValue: {
            value: 'msgValue',
            label: 'msg.value',
            hasValue: false
        },
        MsgTopic: {
            value: 'msgTopic',
            label: 'msg.topic',
            hasValue: false
        },
        MsgPayloadByTopic: {
            value: 'PlT',
            label: node._('node-red-contrib-sun-position/position-config:common.types.PlTRes'),
            icon: 'icons/node-red-contrib-sun-position/inputTypePayloadByTopic.svg',
            hasValue: true
        },
        strPlaceholder: {
            value: 'strPlaceholder',
            label: node._('node-red-contrib-sun-position/position-config:common.types.strPlaceholder'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeStrPlaceholder.svg',
            hasValue: true
        },
        numPercent: {
            value: 'numPct',
            label: node._('node-red-contrib-sun-position/position-config:common.types.numPercent'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeNumberPercent.svg',
            hasValue: true,
            validate: RED.validators.number() // ^[1-9]\d*(\.\d+)?\s?%?$
        },
        nodeId: {
            value: 'nodeId',
            label: node._('node-red-contrib-sun-position/position-config:common.types.nodeId','node ID'),
            hasValue: false
        },
        nodeName: {
            value: 'nodeName',
            label: node._('node-red-contrib-sun-position/position-config:common.types.nodeName','node name'),
            hasValue: false
        },
        nodePath: {
            value: 'nodePath',
            label: node._('node-red-contrib-sun-position/position-config:common.types.nodePath','node name'),
            hasValue: false
        },
        TimeEntered: {
            value: 'entered',
            label: node._('node-red-contrib-sun-position/position-config:common.types.timeentered','time (next)'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeTime.svg',
            hasValue: true,
            validate: /^(0\d|\d|1\d|2[0-3])(?::([0-5]\d|\d))?(?::([0-5]\d|\d))?\s*(pm|p|PM|P|utc|UTC|local|LOCAL)?$/
        },
        DateEntered: {
            value: 'dateEntered',
            label: node._('node-red-contrib-sun-position/position-config:common.types.dateentered','date'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeDate.svg',
            hasValue: true,
            validate: /^(\d{1,4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])|(0?[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[0-2])\.\d{1,4}|(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{1,4})([\s.:,-T](00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9])(:([0-9]|[0-5][0-9])([.:]\d{1,3})?)?)?$/
        },
        DayOfMonth: {
            value: 'dayOfMonth',
            label: node._('node-red-contrib-sun-position/position-config:common.types.dayofmonth','day of month'),
            options: [{
                value: 'fMon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.fMon')
            }, {
                value: 'fTue',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.fTue')
            }, {
                value: 'fWed',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.fWed')
            }, {
                value: 'fThu',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.fThu')
            }, {
                value: 'fFri',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.fFri')
            }, {
                value: 'fSat',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.fSat')
            }, {
                value: 'fSun',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.fSun')
            }, {
                value: 'lMon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.lMon')
            }, {
                value: 'lTue',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.lTue')
            }, {
                value: 'lWed',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.lWed')
            }, {
                value: 'lThu',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.lThu')
            }, {
                value: 'lFri',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.lFri')
            }, {
                value: 'lSat',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.lSat')
            }, {
                value: 'lSun',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.lSun')
            }]
        },
        randomNumber: {
            value: 'randomNum',
            label: node._('node-red-contrib-sun-position/position-config:common.types.randomNumber','randomNumber'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeRandomNumber.svg',
            hasValue: true,
            validate: RED.validators.regex(/^(?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?([\/|](?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?)?$/)()
        },
        randmNumCachedDay: {
            value: 'randmNumCachedDay',
            label: node._('node-red-contrib-sun-position/position-config:common.types.randmNumCachedDay','randmNumCachedDay'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeRandomNumber.svg',
            hasValue: true,
            validate: RED.validators.regex(/^(?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?([\/|](?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?)?$/)()
        },
        randmNumCachedWeek: {
            value: 'randmNumCachedWeek',
            label: node._('node-red-contrib-sun-position/position-config:common.types.randmNumCachedWeek','randmNumCachedWeek'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeRandomNumber.svg',
            hasValue: true,
            validate: RED.validators.regex(/^(?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?([\/|](?:[1-9]|-0\.|0\.|-)\d*(?:\.\d+)?)?$/)()
        },
        TimeSun: {
            value: 'pdsTime',
            label: node._('node-red-contrib-sun-position/position-config:common.types.timesun','sun time'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunClock.svg',
            options: [{
                value: 'astronomicalDawn',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.astronomicalDawn')
            }, {
                value: 'amateurDawn',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.amateurDawn')
            }, {
                value: 'nauticalDawn',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.nauticalDawn')
            }, {
                value: 'blueHourDawnStart',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.blueHourDawnStart')
            }, {
                value: 'civilDawn',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.civilDawn')
            }, {
                value: 'blueHourDawnEnd',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.blueHourDawnEnd')
            }, {
                value: 'goldenHourDawnStart',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.goldenHourDawnStart')
            }, {
                value: 'sunriseStart',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.sunriseStart')
            }, {
                value: 'sunriseEnd',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.sunriseEnd')
            }, {
                value: 'goldenHourDawnEnd',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.goldenHourDawnEnd')
            }, {
                value: 'solarNoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.solarNoon')
            }, {
                value: 'goldenHourDuskStart',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.goldenHourDuskStart')
            }, {
                value: 'sunsetStart',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.sunsetStart')
            }, {
                value: 'sunsetEnd',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.sunsetEnd')
            }, {
                value: 'goldenHourDuskEnd',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.goldenHourDuskEnd')
            }, {
                value: 'blueHourDuskStart',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.blueHourDuskStart')
            }, {
                value: 'civilDusk',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.civilDusk')
            }, {
                value: 'blueHourDuskEnd',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.blueHourDuskEnd')
            }, {
                value: 'nauticalDusk',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.nauticalDusk')
            }, {
                value: 'amateurDusk',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.amateurDusk')
            }, {
                value: 'astronomicalDusk',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.astronomicalDusk')
            }, {
                value: 'nadir',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.nadir')
            }]
        },
        TimeSunNow: {
            value: 'pdsTimeNow',
            label: node._('node-red-contrib-sun-position/position-config:common.types.timesunnow'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunTimeNow.svg',
            hasValue: false
        },
        TimeMoon: {
            value: 'pdmTime',
            label: node._('node-red-contrib-sun-position/position-config:common.types.timemoon','moon time'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeMoonClock.svg',
            options: [{
                value: 'rise',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.moonRise', 'rise')
            }, {
                value: 'set',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.moonSet', 'set')
            }]
        },
        SunCalc: {
            value: 'pdsCalcData',
            label: node._('node-red-contrib-sun-position/position-config:common.types.suncalc','sun calculation'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSun.svg',
            hasValue: false
        },
        SunInSky: {
            value: 'pdsCalcPercent',
            label: node._('node-red-contrib-sun-position/position-config:common.types.suninsky','sun in the sky (percent)'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunPercent.svg',
            hasValue: false
        },
        SunAzimuth: {
            value: 'pdsCalcAzimuth',
            label: node._('node-red-contrib-sun-position/position-config:common.types.sunAzimuth','Azimuth'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunAzimuth.svg',
            hasValue: false
        },
        numAzimuth: {
            value: 'numAzimuth',
            label: node._('node-red-contrib-sun-position/position-config:common.types.numAzimuth'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunAzimuth.svg',
            hasValue: true,
            validate(v) {
                const n = parseFloat(v);
                return (RED.validators.number()(v) && (n >= -360) && (n <= 720));
            }
        },
        numAzimuthRad: {
            value: 'numAzimuth',
            label: node._('node-red-contrib-sun-position/position-config:common.types.numAzimuthRad'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunAzimuth.svg',
            hasValue: true,
            validate(v) {
                const n = parseFloat(v);
                return (RED.validators.number()(v) && (n > -6.3) && (n < 12.6));
            }
        },
        SunElevation: {
            value: 'pdsCalcElevation',
            label: node._('node-red-contrib-sun-position/position-config:common.types.sunElevation'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunElevation.svg',
            hasValue: false
        },
        numAltitude: {
            value: 'numAltitude',
            label: node._('node-red-contrib-sun-position/position-config:common.types.numAltitude'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunElevation.svg',
            hasValue: true,
            validate(v) {
                const n = parseFloat(v);
                return (RED.validators.number()(v) && (n >= -90) && (n <= 90));
            }
        },
        SunAzimuthRad: {
            value: 'pdsCalcAzimuthRad',
            label: node._('node-red-contrib-sun-position/position-config:common.types.sunAzimuthRad','Azimuth'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunAzimuthRad.svg',
            hasValue: false
        },
        numAltitudeRad: {
            value: 'numAltitudeRad',
            label: node._('node-red-contrib-sun-position/position-config:common.types.numAltitudeRad'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunElevation.svg',
            hasValue: true,
            validate(v) {
                const n = parseFloat(v);
                return (RED.validators.number()(v) && (n > -1.56) && (n < 1.56));
            }
        },
        SunElevationRad: {
            value: 'pdsCalcElevationRad',
            label: node._('node-red-contrib-sun-position/position-config:common.types.sunElevationRad'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunElevation.svg',
            hasValue: false
        },
        SunTimeByElevation: {
            value: 'pdsTimeByElevation',
            label: node._('node-red-contrib-sun-position/position-config:common.types.sunTimeByElevation','Time by Elevation'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunTimeElevation.svg',
            hasValue: true,
            validate: RED.validators.number()
        },
        SunTimeByAzimuth: {
            value: 'pdsTimeByAzimuth',
            label: node._('node-red-contrib-sun-position/position-config:common.types.sunTimeByAzimuth','Time by Azimuth'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunTimeAzimuth.svg',
            hasValue: true,
            validate: RED.validators.number()
        },
        SunTimeByElevationRad: {
            value: 'pdsTimeByElevationRad',
            label: node._('node-red-contrib-sun-position/position-config:common.types.sunTimeByElevationRad','Time by Elevation Rad'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunTimeElevationRad.svg',
            hasValue: true,
            validate: RED.validators.number()
        },
        SunTimeByAzimuthRad: {
            value: 'pdsTimeByAzimuthRad',
            label: node._('node-red-contrib-sun-position/position-config:common.types.sunTimeByAzimuthRad','Time by Azimuth Rad'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunTimeAzimuthRad.svg',
            hasValue: true,
            validate: RED.validators.number()
        },
        isDST: {
            value: 'pdbIsDST',
            label: node._('node-red-contrib-sun-position/position-config:common.types.isDST','is daylight saving time'),
            hasValue: false
        },
        WeekOfYear: {
            value: 'pdnWeekOfYear',
            label: node._('node-red-contrib-sun-position/position-config:common.types.WeekOfYear','week Of year'),
            hasValue: false
        },
        WeekOfYearEven: {
            value: 'pdbWeekOfYearEven',
            label: node._('node-red-contrib-sun-position/position-config:common.types.isWeekOfYearEven','week Of year'),
            hasValue: false
        },
        DayOfYear: {
            value: 'pdnDayOfYear',
            label: node._('node-red-contrib-sun-position/position-config:common.types.DayOfYear','day Of year'),
            hasValue: false
        },
        DayOfYearEven: {
            value: 'pdbDayOfYearEven',
            label: node._('node-red-contrib-sun-position/position-config:common.types.isDayOfYearEven','day Of year'),
            hasValue: false
        },
        MoonCalc: {
            value: 'pdmCalcData',
            label: node._('node-red-contrib-sun-position/position-config:common.types.mooncalc','moon calculation'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeMoon.svg',
            hasValue: false
        },
        MoonPhase: {
            value: 'pdmPhase',
            label: node._('node-red-contrib-sun-position/position-config:common.types.moonPhase','moon phase'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeMoonPhase.svg',
            hasValue: false
        },
        PhaseMoon: {
            value: 'pdmPhaseCheck',
            label: node._('node-red-contrib-sun-position/position-config:common.types.moonPhaseCheck','moon phase'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeMoonPhase2.svg',
            options: [{
                value: 'newMoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.newMoon')
            }, {
                value: 'waxingCrescentMoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.waxingCrescentMoon')
            }, {
                value: 'firstQuarterMoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.firstQuarterMoon')
            }, {
                value: 'waxingGibbousMoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.waxingGibbousMoon')
            }, {
                value: 'fullMoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.fullMoon')
            }, {
                value: 'waningGibbousMoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.waningGibbousMoon')
            }, {
                value: 'lastQuarterMoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.lastQuarterMoon')
            }, {
                value: 'waningCrescentMoon',
                label: node._('node-red-contrib-sun-position/position-config:common.typeOptions.waningCrescentMoon')
            }]
        }
    };
}

/**
 * get auto complete formats
 * @returns {Object} object of auto complete formats
 */
function getAutocompleteFormats() {
    return {
        dateParseFormat : [
            {label: 'yy   Year (2 digits)', value: 'yy'},
            {label: 'yyyy Year (4 digits)', value: 'yyyy'},
            {label: 'M    Month (1 digit)', value: 'M'},
            {label: 'MM   Month (2 digits)', value: 'MM'},
            {label: 'MMM  Month (name or abbr.)', value: 'MMM'},
            {label: 'NNN  Month (abbr.)', value: 'NNN'},
            {label: 'd    Day of Month (1 digit)', value: 'd'},
            {label: 'dd   Day of Month (2 digits)', value: 'dd'},
            {label: 'E    Day of Week (abbr.)', value: 'E'},
            {label: 'EE   Day of Week (name)', value: 'EE'},
            {label: 'h    Hour (1 digit 1-12)', value: 'h'},
            {label: 'hh   Hour (2 digits 1-12)', value: 'hh'},
            {label: 'H    Hour (1 digit 0-23)', value: 'H'},
            {label: 'HH   Hour (2 digits 0-23)', value: 'HH'},
            {label: 'K    Hour (1 digit 0-11)', value: 'K'},
            {label: 'KK   Hour (2 digits 0-11)', value: 'KK'},
            {label: 'k    Hour (1 digit 1-24)', value: 'k'},
            {label: 'kk   Hour (2 digits 1-24)', value: 'kk'},
            {label: 'm    Minute (1 digit)', value: 'm'},
            {label: 'mm   Minute (2 digits)', value: 'mm'},
            {label: 's    Second (1 digit)', value: 's'},
            {label: 'ss   Second (2 digits)', value: 'ss'},
            {label: 'l    Milliseconds (1-3 digits)', value: 'l'},
            {label: 'll   Milliseconds (2/3 digits)', value: 'll'},
            {label: 'lll  Milliseconds (3 digits)', value: 'lll'},
            {label: 'L    Milliseconds (1 digit rounded)', value: 'L'},
            {label: 'LL   Milliseconds (2 digits rounded)', value: 'LL'},
            {label: 't    AM/PM (1 digit)', value: 't'},
            {label: 'tt   AM/PM (2 digits)', value: 'tt'}
        ],
        dateOutTSFormat: [
            {label: 'd    Days (1 digit)', value: 'd'},
            {label: 'dd   Days (2 digits)', value: 'dd'},
            {label: 'td   total Days (1 digit)', value: 'td'},
            {label: 'tdd  total Days (2 digits)', value: 'tdd'},
            {label: 'h    Hours (1-12)', value: 'h'},
            {label: 'hh   Hours (2 digits 01-12)', value: 'hh'},
            {label: 'th   total Hours (1-12)', value: 'h'},
            {label: 'thh  total Hours (2 digits 01-12)', value: 'hh'},
            {label: 'H    Hours (0-23)', value: 'H'},
            {label: 'HH   Hours (2 digits 00-23)', value: 'HH'},
            {label: 'tH   total Hours (0-23)', value: 'H'},
            {label: 'tHH  total Hours (2 digits 00-23)', value: 'HH'},
            {label: 'K    Hours (0-11)', value: 'K'},
            {label: 'KK   Hours (2 digits 00-11)', value: 'KK'},
            {label: 'tK   total Hours (0-11)', value: 'K'},
            {label: 'tKK  total Hours (2 digits 00-11)', value: 'KK'},
            {label: 'k    Hours (1-24)', value: 'k'},
            {label: 'kk   Hours (2 digits 01-24)', value: 'kk'},
            {label: 'tk   total Hours (1-24)', value: 'k'},
            {label: 'tkk  total Hours (2 digits 01-24)', value: 'kk'},
            {label: 'm    Minutes (0-59)', value: 'm'},
            {label: 'mm   Minutes (2 digits 00-59)', value: 'mm'},
            {label: 'tm   total Minutes (0-59)', value: 'm'},
            {label: 'tmm  total Minutes (2 digits 00-59)', value: 'mm'},
            {label: 's    Second (0-59)', value: 's'},
            {label: 'ss   Second (2 digits 00-59)', value: 'ss'},
            {label: 'ts   total Second (0-59)', value: 's'},
            {label: 'tss  total Second (2 digits 00-59)', value: 'ss'},
            {label: 'l    Milliseconds (0-999)', value: 'l'},
            {label: 'll   Milliseconds (2 digits 00-99)', value: 'll'},
            {label: 'lll  Milliseconds (3 digits 000-999)', value: 'lll'},
            {label: 'L    Milliseconds (1 digit rounded)', value: 'L'},
            {label: 'LL   Milliseconds (2 digits rounded)', value: 'LL'},
            {label: 'tl   total Milliseconds (0-999)', value: 'l'},
            {label: 'tll  total Milliseconds (2 digits 00-99)', value: 'll'},
            {label: 'tlll total Milliseconds (3 digits 000-999)', value: 'lll'},
            {label: 't    AM/PM (1 digit - Lowercase)', value: 't'},
            {label: 'tt   AM/PM (2 digits - Lowercase)', value: 'tt'},
            {label: 'T    AM/PM (1 digit - Uppercase)', value: 'T'},
            {label: 'TT   AM/PM (2 digits - Uppercase)', value: 'TT'},
            {label: 'S    date\'s ordinal suffix (st, nd, rd, or th)', value: 'S'}
        ],
        dateOutFormat: [
            {label: 'yyyy Year (4 digits)', value: 'yyyy'},
            {label: 'yy   Year (2 digits)', value: 'yy'},
            {label: 'M    Month (1 digit)', value: 'M'},
            {label: 'MM   Month (2 digits)', value: 'MM'},
            {label: 'MMM  Month (abbr.)', value: 'MMM'},
            {label: 'NNN  Month (name)', value: 'NNN'},
            {label: 'd    Day of Month (1 digit)', value: 'd'},
            {label: 'dd   Day of Month (2 digits)', value: 'dd'},
            {label: 'E    Day of Week (abbr.)', value: 'E'},
            {label: 'EE   Day of Week (name)', value: 'EE'},
            {label: 'h    Hour (1-12)', value: 'h'},
            {label: 'hh   Hour (2 digits 01-12)', value: 'hh'},
            {label: 'H    Hour (0-23)', value: 'H'},
            {label: 'HH   Hour (2 digits 00-23)', value: 'HH'},
            {label: 'K    Hour (0-11)', value: 'K'},
            {label: 'KK   Hour (2 digits 00-11)', value: 'KK'},
            {label: 'k    Hour (1-24)', value: 'k'},
            {label: 'kk   Hour (2 digits 01-24)', value: 'kk'},
            {label: 'm    Minute (0-59)', value: 'm'},
            {label: 'mm   Minute (2 digits 00-59)', value: 'mm'},
            {label: 's    Second (0-59)', value: 's'},
            {label: 'ss   Second (2 digits 00-59)', value: 'ss'},
            {label: 'l    Milliseconds (0-999)', value: 'l'},
            {label: 'll   Milliseconds (2/3 digits 00-999)', value: 'll'},
            {label: 'lll  Milliseconds (3 digits 000-999)', value: 'lll'},
            {label: 'L    Milliseconds (round to 1 digit 0-9)', value: 'L'},
            {label: 'LL   Milliseconds (round to 2 digits 00-99)', value: 'LL'},
            {label: 't    AM/PM (1 digit - Lowercase)', value: 't'},
            {label: 'tt   AM/PM (2 digits - Lowercase)', value: 'tt'},
            {label: 'T    AM/PM (1 digit - Uppercase)', value: 'T'},
            {label: 'TT   AM/PM (2 digits - Uppercase)', value: 'TT'},
            {label: 'w    week of year (0-53)', value: 'w'},
            {label: 'ww   week of year (2 digits 00-53)', value: 'ww'},
            {label: 'dy   day of year (0-365)', value: 'dy'},
            {label: 'ddy  day of year (3 digits 000-365)', value: 'ddy'},
            {label: 'Z    time zone (abbr.)', value: 'Z'},
            {label: 'o    time zone offset (abbr.)', value: 'o'},
            {label: 'S    date\'s ordinal suffix (st, nd, rd, or th)', value: 'S'},
            {label: 'x    Day difference', value: 'x'},
            {label: 'xx   Day difference (name)', value: 'xx'}
        ]
    };
}

// #region functions
/**
 * getcurrent cursor position
 * @returns {number|undefined} current cursor position
 */
$.fn.getCursorPosition = function () {
    const input = this.get(0);
    if (!input) {
        return undefined;
    } // No (input) element found

    if ('selectionStart' in input) {
        // Standard-compliant browsers
        return input.selectionStart;
    }
    if (document.selection) {
        // IE
        input.focus();
        const sel = document.selection.createRange();
        const selLen = document.selection.createRange().text.length;
        sel.moveStart('character', -input.value.length);
        return sel.text.length - selLen;
    }
    return undefined;
};

/**
 *initializes a value
 * @param {*} data - object containing property
 * @param {string} id - id of the property
 * @param {*} newVal returns the new value
 */
function initializeValue(data, id, newVal) { // eslint-disable-line no-unused-vars
    if (data[id] === null || typeof data[id] === 'undefined') {
        // let idHtml = "#node-input-" + id;
        // data[id] = newVal;
        $('#node-input-' + id).val(newVal);
        // console.log('not initialized value !! "' + id + '" = "' + newVal + '" - ' + data[id]); // eslint-disable-line
    }
}

/**
 * initializes an inputbos with autocomplete
 * @param {jQuery} inputBox - jsQuery selector of the input box
 * @param {string} dataListID - id of the datalist from getAutocompleteFormats()
 */
function autocomplete(inputBox, dataListID) { // eslint-disable-line no-unused-vars
    const dataList = getAutocompleteFormats()[dataListID];
    // don't navigate away from the field on tab when selecting an item
    inputBox.on('keydown', function (event) {
        if (event.keyCode === $.ui.keyCode.TAB && $(this).autocomplete('instance') && $(this).autocomplete('instance').menu.active) {
            event.preventDefault();
        }
    }).autocomplete({
        minLength: 0,
        source(request, response) {
            if (inputBox.getCursorPosition() < request.term.length) {
                return;
            }

            // delegate back to autocomplete, but extract the last term
            const term = request.term.split(/\W+/).pop();
            const result = dataList.filter(x => x.value.startsWith(term));
            response(result);
        },
        focus() {
            // prevent value inserted on focus
            return false;
        },
        select(event, ui) {
            const terms = this.value.split(/\W+/);
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push(ui.item.value);
            // add placeholder to get the comma-and-space at the end
            terms.push('');
            this.value = terms.join(' ');
            return false;
        }
    });
}

/**
 * append options to a select field
 * @param {*} node - node representation for access to i18N function (node._())
 * @param {jQuery} parent - jQuery selector of the parent element (<select> - field)
 * @param {string} elementName - name of the element from getSelectFields()
 * @param {Function} filter - function for filter the elements
 */
function appendOptions(node, parent, elementName, filter) { // eslint-disable-line no-unused-vars
    // console.log('[IN appendOptions] elementName='+ elementName + ' limit='+limit);
    const groups = getSelectFields()[elementName + 'Groups'];
    if (!groups) {
        throw new Error('no group "' + elementName + 'Groups" in getSelectFields() found!');
    }
    const elements = getSelectFields()[elementName];
    if (!groups) {
        throw new Error('no elements "' + elementName + '" in getSelectFields() found!');
    }
    const groupLength = groups.length;
    const elementsLength = elements.length;
    for (let gIndex = 0; gIndex < groupLength; gIndex++) {
        const group = $('<optgroup/>', {label: node._('node-red-contrib-sun-position/position-config:' + groups[gIndex].i18n)}).appendTo(parent);
        for (let eIndex = 0; eIndex < elementsLength; eIndex++) {
            if (groups[gIndex].id === elements[eIndex].group) {
                if (filter) {
                    if (filter(elements[eIndex])) {
                        group.append($('<option></option>').val(elements[eIndex].id).text(node._('node-red-contrib-sun-position/position-config:' + elements[eIndex].i18n)).attr('addText', elements[eIndex].add));
                    }
                } else {
                    group.append($('<option></option>').val(elements[eIndex].id).text(node._('node-red-contrib-sun-position/position-config:' + elements[eIndex].i18n)).attr('addText', elements[eIndex].add));
                }
            }
        }
    }
}

/**
* @typedef {Object} tiData
* @property {string} valueProp - the name of the value property
* @property {string} typeProp - the name of the type property
* @property {string} [defaultValue] - value for the default value
* @property {string} [defaultType] - value for the default type
* @property {string} [tooltip] - a tootlip for the input field
* @property {string} [width] - width of the input field
* @property {string} [onChange] - on change function
* @property {string} [onFocus] - on focus / focus lost function
*/

/**
 * setup a typedInput for node-red
 * @param {*} node - node representation for access to i18N function (node._())
 * @param {tiData} data - data of the typed input
 * @returns {jQuery} jQuery selector of the typeInput field - ideal for chaining
 */
function setupTInput(node, data) { // eslint-disable-line no-unused-vars
    const $inputField = $('#node-input-' + data.valueProp);
    const $typeField = $('#node-input-' + data.typeProp);
    let type='';
    if (typeof node[data.typeProp] === 'undefined' || node[data.typeProp] === null) {
        if (typeof data.defaultType !== 'undefined') {
            type = data.defaultType;
            node[data.typeProp] = type;
            $typeField.val(type);
        }
    } else {
        type = node[data.typeProp];
        $typeField.val(type);
    }
    if (Array.isArray(data.types) && !data.types.find(el => (el === type || el.value === type))) {
        console.error(`unknown typeInput type: ${data.typeProp} = '${type}', using default '${data.defaultType}' allowed types=`,data.types); // eslint-disable-line no-console
        type = data.defaultType;
        $typeField.val(type);
    }
    if (typeof node[data.valueProp] === 'undefined' || node[data.valueProp] === null) {
        if (typeof data.defaultValue !== 'undefined') {
            node[data.valueProp] = data.defaultValue;
            $inputField.val(data.defaultValue);
        }
    } else {
        node[data.valueProp] = checkDeprecatedValues(type, node[data.valueProp]);
        $inputField.val(node[data.valueProp]);
    }
    $inputField.typedInput({
        typeField: $typeField,
        types: data.types
    });
    if (data.tooltip) {
        $inputField.$attr('title', data.tooltip);
    }
    if (data.width) {
        $inputField.typedInput('width', data.width);
    }
    if (data.onChange) {
        $inputField.on('change', data.onChange);
    }
    if (data.onFocus) {
        $inputField.on('change focus focusin focusout', data.onFocus);
    }
    return $inputField;
}

/**
 * set Data for typed input
 * @param {*} $field Typed input field
 * @param {*} value value to set
 * @param {*} type type to set
 */
function setTInputValue($field, value, type) { // eslint-disable-line no-unused-vars
    try {
        if (type === 'flow' || type === 'global') {
            $field.typedInput('type', 'env'); // env haben alle, bug fix
            $field.typedInput('value', checkDeprecatedValues(type, value));
            $field.typedInput('type', type);
        } else {
            $field.typedInput('type', type);
            $field.typedInput('value', checkDeprecatedValues(type, value));
        }
    } catch (err) {
        console.log('error setting type input', value, type, err); // eslint-disable-line no-console
    }
}

/**
 * sets a checkbox matrix
 * @param {string} element name of the element as jQuery element name
 * @param {string} val value of the element
 */
function initCheckboxesBlock(element, val) { // eslint-disable-line no-unused-vars
    if (val === '*' || typeof val === 'undefined' || val === null) {
        $(element + ' input[type=checkbox]').prop('checked', true);
    } else if (val === '' || val === 'none') {
        $(element + ' input[type=checkbox]').removeAttr('checked');
    } else {
        $(element + ' input[type=checkbox]').removeAttr('checked');
        val.split(',').forEach(v => {
            $(element + ' [value=' + v + ']').prop('checked', true);
        });
    }
}

// ************************************************************************************************
/**
 * initializes a combobox (combination of input and select box)
 * @param {*} node - node representation for access to i18N function (node._())
 * @param {jQuery} $inputSelect - jQuery selector of the select element
 * @param {jQuery} $inputBox - jQuery selector of the input element
 * @param {string} dataListID - id of the datalist from getAutocompleteFormats()
 * @param {string} optionElementName - name of the element from getSelectFields()
 * @param {string} value - value of the input/select field
 * @param {number} baseWidth - base widtrh of the field combination
 * @param {string} [timeFormat] - name of tzhe timeformat from position-config:common.timeFormat...
 */
function initCombobox(node, $inputSelect, $inputBox, dataListID, optionElementName, value, baseWidth, timeFormat) { // eslint-disable-line no-unused-vars
    // console.log('[IN initCombobox] node=' + node + ' dataList=' + dataList + ' optionElementName=' + optionElementName + ' value=' + value + ' width=' + width); // eslint-disable-line
    appendOptions(node, $inputSelect, optionElementName);
    autocomplete($inputBox, dataListID);
    const valueNum = Number(value);
    timeFormat = timeFormat || 'default';
    if (isNaN(valueNum)) {
        $inputSelect.val(99);
        $inputBox.val(value);
    } else {
        $inputSelect.val(valueNum);
    }

    $inputSelect.on('change focus focusout', (_type, _value) => {
        if (Number($inputSelect.val()) === 99) {
            $inputSelect.css({ width: '100px' });
            const width = (205 + baseWidth);
            $inputBox.css({ width: 'calc(100% - ' + width + 'px)' });
            $inputBox.show();
            if (!isNaN($inputBox.val())) {
                $inputBox.val(node._('node-red-contrib-sun-position/position-config:common.timeFormat.' + timeFormat));
            }
        } else {
            $inputBox.hide();
            const width = (100 + baseWidth);
            $inputSelect.css({ width: 'calc(100% - ' + width + 'px)' });
            $inputBox.val($inputSelect.val());
        }
    });

    $inputSelect.change();
}
// ************************************************************************************************

/**
 * add a label to a html element
 * @param {jQuery} parent - element (row) to append the label
 * @param {string} forEl - name of the element to what the label is
 * @param {string} [symb] - class name of the symbol e.g. 'fa fa-clock'
 * @param {string} [text] - text of the label
 * @param {string} [width] - width of the label
 * @returns {jQuery} jQuery selector of the new label
 */
function addLabel(parent, forEl, symb, text, width) { // eslint-disable-line no-unused-vars
    const lbl = $('<label class="' + forEl + '-lbl" style="width:auto;"/>').attr('for', forEl).appendTo(parent);
    if (symb) {
        lbl.append('<i class= "' + symb + '" >');
    }
    if (text) {
        const span = $('<span class="' + forEl + '-span" style="float: right; margin-left: 5px; margin-right: 2px;">' + text + '</span>');
        lbl.append(span);
        // lbl.attr('style', 'margin-left: 5px; width:' + 20 + span.width() + 'px;');
        width = width || 'auto';
        lbl.attr('style', 'margin-left: 5px; margin-right: 2px; width:' + width + ';');
    } else {
        width = width || '20px';
        lbl.attr('style', 'margin-left: 5px; margin-right: 2px; width:' + width + ';');
    }
    return lbl;
}

/**
* @typedef {Object} multiselectTypes
* @property {string} label - the name of the type property
* @property {regex} selection - regular expression selector
*/

/**
 * return the label who matches the regex selector for types
 * @param {string} val - value to test
 * @param {number} [length] - optional output if nothing is found
 * @param {multiselectTypes[]} types - array of types
 * @returns {string} the selected label or the given length or 'NA'
 */
function getMultiselectText(val, length, types) { // eslint-disable-line no-unused-vars
    for (let index = 0; index < types.length; index++) {
        if (types[index].selection.test(val)) {
            return types[index].label;
        }
    }
    if (length && (length > 0)) {
        return length;
    }
    return 'NA';
}

/**
 * set the checkboxes in a multiselect combo box to a value
 * @param {string} value - value of the array
 * @param {jQuery} field - parent jquery selector element
 * @param {multiselectTypes[]} types - array of types
 */
function setMultiselect(value, field, types) { // eslint-disable-line no-unused-vars
    if (value === '*' || typeof value === 'undefined') {
        field.find('.option-checkboxes input[type=checkbox]').prop('checked', true);
        field.find('.multiselect-option').text(getMultiselectText('*', 99, types));
    } else {
        field.find('.option-checkboxes input[type=checkbox]').removeAttr('checked');
        const elm = value.split(',');
        elm.forEach(v => {
            field.find('.option-checkboxes [value=' + v + ']').prop('checked', true);
        });
        field.find('.multiselect-option').text(getMultiselectText(value, elm.length, types));
    }
}

/**
 * adds a multiselect combo box to the form
 * @param {*} node - Node Red Source Node
 * @param {jQuery} parent - parent jQuery selector to add multiselect
 * @param {string} elementName - Name of the element in the node, e.g. 'operatorTypes'
 * @param {string} i18N - i18N element name, e.g. 'time-comp.operatorTypes'
 * @param {string} id - element id, e.g. 'node-input-rule-operatorType-1'
 * @returns {jQuery} jQuery selector of the multiselect
 */
function multiselect(node, parent, elementName, i18N, id) { // eslint-disable-line no-unused-vars
    const types = getSelectFields()[elementName + 'Short'];
    const getSelection = function getCBText(parent) {
        const value = parent.find('.option-checkboxes input[type=checkbox]:checked');
        const elements = value.map((_, el) => { return $(el).val(); }).get();
        parent.find('.multiselect-option').text(getMultiselectText(elements.join(','), elements.length, types));
    };
    const multiselect = $('<div/>', {class: 'multiselect', id}).appendTo(parent);
    const selectbox = $('<div/>', {
        class: 'selectBox',
        html: $('<select/>', {
            id: id+'multiselect-select',
            class: 'multiselect-select',
            html: $('<option></option>', {
                id: 'multiselect-option',
                class: 'multiselect-option'
            }).text('x')
        })
    }).appendTo(multiselect);
    $('<div/>', {class: 'overSelect'}).appendTo(selectbox);
    const list = $('<div/>', {
        id: id +'option-checkboxes',
        class: 'option-checkboxes'
    }).appendTo(multiselect);
    list.attr('expanded', 'false');
    const groups = getSelectFields()[elementName + 'Groups'];
    const groupLength = groups.length;
    const elements = getSelectFields()[elementName];
    const elementsLength = elements.length;
    for (let gIndex = 0; gIndex < groupLength; gIndex++) {
        list.append($('<label></label>', {
            class: 'header',
            html: node._(i18N + 'Groups.' + gIndex)
        }));
        for (let eIndex = 0; eIndex < elementsLength; eIndex++) {
            if (groups[gIndex].id === elements[eIndex].group) {
                list.append($('<label></label>', {
                    for: id + '-' + elements[eIndex].id,
                    html: [$('<input>', {
                        class: id + '-checkbox',
                        type: 'checkbox',
                        value: elements[eIndex].id,
                        id: id + '-' + elements[eIndex].id
                    }).on('change', _event => {
                        getSelection(multiselect);
                    }), node._(i18N + '.' + eIndex)]
                }));
            // elements[eIndex].label
            }
        }
    }
    selectbox.on('click', _event => {
        const checkboxes = parent.find('.option-checkboxes');
        const expanded = (checkboxes.attr('expanded') === 'true');
        if (!expanded) {
            checkboxes.css('display', 'block');
            checkboxes.attr('expanded', 'true');
        } else {
            checkboxes.css('display', 'none');
            checkboxes.attr('expanded', 'false');
        }
    });
    return multiselect;
}

/**
* @typedef {Object} backendData
* @property {string} config - the config object
* @property {('getTimeData'|'getOutDataData')} kind - kind of request
* @property {string} type - type input type
* @property {string} value - type input value
* @property {string} [offsetType] - type input type for offset
* @property {string} [offset] - type input value for offset
* @property {number} [multiplier] - multiplier to value
* @property {boolean} [next] - identifier if the next should be output
* @property {string} [days] - allowed days identifier
* @property {string} [months] - allowed months identifier
* @property {string} [format] - output format
*/

/**
 * get type Data from the backend
 * @param {*} result
 * @param {backendData} data
 * @returns {*} object based on the request
 */
function getBackendData(result, data) { // eslint-disable-line no-unused-vars
    // console.log('[IN getBackendData]',data);
    try {
        const res = {
            value:'',
            useful: false
        };
        if (!data || data.type === 'none' || data.type === '' || data.type === 'json' || data.type === 'bin') {
            res.value = data.type;
        } else if ( data.type === 'bool' || data.type === 'num' || data.type === 'str' || data.type === 'numAzimuth' || data.type === 'numAltitude') {
            res.value = String(data.value);
            res.useful = true;
        } else if (data.type === 'msg' || data.type === 'env') {
            res.value = data.type + '.' + data.value;
        } else if (data.type === 'msgPayload') {
            res.value = 'msg.payload';
        } else if (data.type === 'msgTopic') {
            res.value = 'msg.topic';
        } else if (data.type === 'PlT') {
            res.value = 'msg.payload if msg.topic contains "' + data.value + '"';
        } else if (data.type === 'msgTs') {
            res.value = 'msg.ts';
        } else if (data.type === 'msgLC') {
            res.value = 'msg.lc';
        } else if (data.type === 'msgValue') {
            res.value = 'msg.value';
        } else if (data.timeDays === '') {
            res.value = 'No valid days given! Please check settings!';
        } else if (data.timeMonths === '') {
            res.value = 'No valid month given! Please check settings!';
        } else {
            const url = 'sun-position/data?' + jQuery.param( data );
            $.getJSON(url, result);
            return;
        }
        result(res);
    } catch (err) {
        console.log('can not get data from Server',err); // eslint-disable-line no-console
    }
}

/**
 * returns **true** if the parameter value is a valid boolean value for **true**
 * @param {*} val a parameter which should be checked if  it is a valid true boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **true**
 */
function isTrue(val) {  // eslint-disable-line no-unused-vars
    val = (val+'').toLowerCase();
    return (['true', 'yes', 'on', 'ja'].includes(val) || (!isNaN(val) && (Number(val) > 0)));
}

/**
 * checks if a value is a valid Date object
 * @param {*} d - a value to check
 * @returns {boolean} returns __true__ if it is a valid Date, otherwhise __false__
 */
function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
    // d !== 'Invalid Date' && !isNaN(d)
}

/**
 * formate Dtae to local time
 * @param {*} d - Date
 */
function bdDateToTime(d, add) { // eslint-disable-line no-unused-vars
    // console.log('[IN bdDateToTime]',d,add);
    if (d) {
        if (d.error) {
            return add + 'Error: ' + d.error;
        }
        if (d.value) {
            d = d.value;
        }
        const dv = new Date(d);
        if (isValidDate(dv)) {
            return dv.toLocaleTimeString() + ' (' + dv.toISOString() + ')' + ((add) ? ' ' + add : '');
        }
    }
    if (typeof d === 'string') {
        return d + ((add) ? ' ' + add : '');
    }
    return ((add) ? add : '');
}

/**
 * get the value for the day checkbox array
 * @param {jQuery} value - the checkbox array
 * * @param {number} max - the maximum count of elements
 * @returns {string} the value of the checkboxes
 */
function getCheckboxesStr(value, max) { // eslint-disable-line no-unused-vars
    const days = value.map((_, el) => { return $(el).val(); }).get();
    if (days.length === 0) { return ''; }
    if (days.length === max) { return '*'; }
    return days.join(',');
}