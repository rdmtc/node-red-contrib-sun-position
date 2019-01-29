/* genericDefinitions.js */
'use strict';

module.exports.SelectFields = {
    operatorsGroups: [
        {id: 'cmp', label: 'compate Timestamp'}
    ],
    operators: [
        {id: 1, group: 'cmp', label: '==', text: 'equal'},
        {id: 2, group: 'cmp', label: '!=', text: 'unequal'},
        {id: 3, group: 'cmp', label: '>', text: 'greater'},
        {id: 4, group: 'cmp', label: '>=', text: 'greater or equal'},
        {id: 5, group: 'cmp', label: '<', text: 'lesser'},
        {id: 6, group: 'cmp', label: '<=', text: 'lesser or equal'}
    ], outputTSFormatsGroups: [
        {id: 'time', label: 'timestamp (number)'},
        {id: 'timeround', label: 'timestamp rounded (number)'},
        {id: 'string', label: 'Text'}
    ], outputTSFormats: [
        {id: 1, group: 'time', name: 'ms', label: 'milliseconds'},
        {id: 2, group: 'time', name: 'sec', label: 'seconds'},
        {id: 3, group: 'time', name: 'min', label: 'minutes'},
        {id: 4, group: 'time', name: 'hour', label: 'hours'},
        {id: 5, group: 'time', name: 'days', label: 'days'},
        {id: 6, group: 'time', name: 'month', label: 'month'},
        {id: 7, group: 'time', name: 'years', label: 'years'},
        {id: 12, group: 'timeround', name: 'sec', label: 'seconds'},
        {id: 13, group: 'timeround', name: 'min', label: 'minutes'},
        {id: 14, group: 'timeround', name: 'hour', label: 'hours'},
        {id: 15, group: 'timeround', name: 'days', label: 'days'},
        {id: 16, group: 'timeround', name: 'month', label: 'month'},
        {id: 17, group: 'timeround', name: 'years', label: 'years'},
        {id: 99, group: 'string', name: 'Other', label: 'Other'}
    ], outputFormatsGroups: [
        {id: 'number', label: 'Number'},
        {id: 'string', label: 'Text (string)'},
        {id: 'time', label: 'time (number) since emit'},
        {id: 'dayofweek', label: 'day of week'},
        {id: 'other', label: 'Other'}
    ], outputFormats: [
        {id: 0, group: 'number', name: 'UNIX', label: 'milliseconds UNIX timestamp'},
        {id: 10, group: 'number', name: 'YYYYMMDDHHMMSS', label: 'YYYYMMDDHHMMSS'},
        {id: 11, group: 'number', name: 'YYYYMMDD_HHMMSS', label: 'YYYYMMDD.HHMMSS'},
        {id: 1, group: 'string', name: 'ECMA262', label: 'ECMA-262', add: 'standard JSON Date representation'},
        {id: 2, group: 'string', name: 'local', label: 'local date and time'},
        {id: 14, group: 'string', name: 'localLong', label: 'local date and time enh.'},
        {id: 3, group: 'string', name: 'localTime', label: 'local time'},
        {id: 13, group: 'string', name: 'localTimeLong', label: 'ocal time enh.'},
        {id: 12, group: 'string', name: 'localDate', label: 'local date'},
        {id: 15, group: 'string', name: 'localDateLong', label: 'local date long'},
        {id: 4, group: 'string', name: 'UTC', label: 'UTC date and time'},
        {id: 5, group: 'string', name: 'ISO', label: 'ISO date and time'},
        {id: 6, group: 'time', name: 'ms', label: 'milliseconds'},
        {id: 7, group: 'time', name: 'sec', label: 'seconds'},
        {id: 8, group: 'time', name: 'min', label: 'minutes'},
        {id: 9, group: 'time', name: 'hour', label: 'hours'},
        {id: 16, group: 'dayofweek', name: 'Day Name', label: 'Day Name, e.g. Monday, 22.12.'},
        {id: 17, group: 'dayofweek', name: 'Day', label: 'Day in relative, e.g. Today, 22.12.'},
        {id: -1, group: 'other', name: 'object', label: 'as object'},
        {id: 99, group: 'other', name: 'free definition', label: 'Other'}
    ], parseFormatsGroups: [
        {id: 'number', label: 'Number'},
        {id: 'string', label: 'Text (string)'},
        {id: 'other', label: 'Other'}
    ], parseFormats: [
        {id: 0, group: 'number', label: 'milliseconds UNIX timestamp', add: 'xxx'},
        {id: 1, group: 'string', label: 'ECMA-262', add: 'standard JSON Date representation'},
        {id: 2, group: 'string', label: 'various - try different Formats, prefere european formats', add: 'will try different formats, prefere european formats'},
        {id: 3, group: 'string', label: 'various - try different Formats, prefere american formats', add: 'will try different formats, prefere european formats'},
        {id: 4, group: 'number', label: 'YYYYMMDDHHMMSS', add: 'xxx'},
        {id: 5, group: 'number', label: 'YYYYMMDD.HHMMSS', add: 'xxx'},
        {id: 99, group: 'other', label: 'free definition', add: 'xxx'}
    ], multiplierGroups: [
        {id: 'std', label: 'Standard'},
        {id: 'other', label: 'Special'}
    ], multiplier: [
        {id: 1, group: 'std', label: 'milliseconds'},
        {id: 1000, group: 'std', label: 'seconds'},
        {id: 60000, group: 'std', label: 'minutes'},
        {id: 3600000, group: 'std', label: 'hours'},
        {id: 86400000, group: 'std', label: 'days'},
        {id: 604800000, group: 'other', label: 'weeks'},
        {id: -1, group: 'other', label: 'month'},
        {id: -2, group: 'other', label: 'year'}
    ]
};
module.exports.typeUndefined = {
    value: 'none',
    label: 'not used',
    // icon: "icons/node-red-contrib-sun-position/inputTypeNone.png",
    hasValue: false
};
module.exports.typeMsgPayload = {
    value: 'msgPayload',
    label: 'msg.payload',
    hasValue: false
};
module.exports.typeMsgTs = {
    value: 'msgTs',
    label: 'msg.ts',
    hasValue: false
};
module.exports.typeTimeEntered = {
    value: 'entered',
    label: 'time (current day)',
    icon: 'icons/node-red-contrib-sun-position/inputTypeTime.png',
    hasValue: true,
    validate: /^(0\d|\d|1\d|2[0-3])(?::([0-5]\d|\d))?(?::([0-5]\d|\d))?\s*(pm?)?$/
};
module.exports.typeDateEntered = {
    value: 'dateEntered',
    label: 'date',
    icon: 'icons/node-red-contrib-sun-position/inputTypeDate.png',
    hasValue: true
};
module.exports.typeTimePreDefined = {
    value: 'predefined',
    label: 'time (current day)',
    options: ['midnight (current day)', 'noon (current day)', 'last this month (0:00)']
};
module.exports.typeTimeSun = {
    value: 'pdsTime',
    label: 'sun time ',
    icon: 'icons/node-red-contrib-sun-position/inputTypeSunClock.png',
    options: [ 'astronomicalDawn', 'amateurDawn', 'nauticalDawn', 'blueHourDawnStart', 'civilDawn', 'blueHourDawnEnd',
        'sunrise', 'sunriseEnd', 'goldenHourEnd', 'solarNoon', 'goldenHourStart', 'sunsetStart', 'sunset', 'blueHourDuskStart',
        'civilDusk', 'blueHourDuskEnd', 'amateurDusk', 'astronomicalDusk', 'nadir']
};
module.exports.typeTimeMoon = {
    value: 'pdmTime',
    label: 'moon time ',
    icon: 'icons/node-red-contrib-sun-position/inputTypeMoonClock.png',
    options: ['rise', 'set']
};
module.exports.typeSunCalc = {
    value: 'pdsCalcData',
    label: 'sun caclucaltion',
    icon: 'icons/node-red-contrib-sun-position/inputTypeSun.png',
    hasValue: false
};
module.exports.typeMoonCalc = {
    value: 'pdmCalcData',
    label: 'moon caclucaltion',
    icon: 'icons/node-red-contrib-sun-position/inputTypeMoon.png',
    hasValue: false
};
module.exports.dateParseFormat = [
    {label: 'yy   Year (2 digits)', value: 'yy'},
    {label: 'yyyy Year (4 digits)', value: 'yyyy'},
    {label: 'M    Month (1 digit)', value: 'M'},
    {label: 'MM   Month (2 digits)', value: 'MM'},
    {label: 'MMM  Month (name or abbr.)', value: 'MMM'},
    {label: 'NNN  Month (abbr.)', value: 'NNN'},
    {label: 'd    Day of Month (1 digit)', value: 'd'},
    {label: 'dd   Day of Month (2 digits)', value: 'dd'},
    {label: 'E    Day of Week (abbr)', value: 'E'},
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
    {label: 'll   Milliseconds (2 digits)', value: 'll'},
    {label: 'lll  Milliseconds (3 digits)', value: 'lll'},
    {label: 't    AM/PM (1 digit)', value: 't'},
    {label: 'tt   AM/PM (2 digits)', value: 'tt'}];
module.exports.dateOutTSFormat = [
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
    {label: 'tl   total Milliseconds (0-999)', value: 'l'},
    {label: 'tll  total Milliseconds (2 digits 00-99)', value: 'll'},
    {label: 'tlll total Milliseconds (3 digits 000-999)', value: 'lll'},
    {label: 't    AM/PM (1 digit - Lowercase)', value: 't'},
    {label: 'tt   AM/PM (2 digits - Lowercase)', value: 'tt'},
    {label: 'T    AM/PM (1 digit - Uppercase)', value: 'T'},
    {label: 'TT   AM/PM (2 digits - Uppercase)', value: 'TT'},
    {label: 'S    date\'s ordinal suffix (st, nd, rd, or th)', value: 'S'}];
module.exports.dateOutFormat = [{label: 'yyyy Year (4 digits)', value: 'yyyy'},
    {label: 'yy   Year (2 digits)', value: 'yy'},
    {label: 'M    Month (1 digit)', value: 'M'},
    {label: 'MM   Month (2 digits)', value: 'MM'},
    {label: 'MMM  Month (abbr.)', value: 'MMM'},
    {label: 'NNN  Month (name)', value: 'NNN'},
    {label: 'd    Day of Month (1 digit)', value: 'd'},
    {label: 'dd   Day of Month (2 digits)', value: 'dd'},
    {label: 'E    Day of Week (abbr)', value: 'E'},
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
    {label: 'll   Milliseconds (2 digits 00-99)', value: 'll'},
    {label: 'lll  Milliseconds (3 digits 000-999)', value: 'lll'},
    {label: 't    AM/PM (1 digit - Lowercase)', value: 't'},
    {label: 'tt   AM/PM (2 digits - Lowercase)', value: 'tt'},
    {label: 'T    AM/PM (1 digit - Uppercase)', value: 'T'},
    {label: 'TT   AM/PM (2 digits - Uppercase)', value: 'TT'},
    {label: 'Z    timezone (abbr.)', value: 'Z'},
    {label: 'o    timezone offset (abbr.)', value: 'o'},
    {label: 'S    date\'s ordinal suffix (st, nd, rd, or th)', value: 'S'},
    {label: 'x    Day difference', value: 'x'},
    {label: 'xx   Day difference (name)', value: 'xx'}];

/* EOL */