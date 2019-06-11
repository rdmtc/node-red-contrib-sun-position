/************************************************************************/
const globSelectFields = {
    operatorsGroups: [
        {id: 'default', label: 'compare Timestamp'}
    ],
    operators: [
        {id: 1, group: 'default', label: '==', text: 'equal'},
        {id: 2, group: 'default', label: '!=', text: 'unequal'},
        {id: 3, group: 'default', label: '>', text: 'greater'},
        {id: 4, group: 'default', label: '>=', text: 'greater or equal'},
        {id: 5, group: 'default', label: '<', text: 'lesser'},
        {id: 6, group: 'default', label: '<=', text: 'lesser or equal'}
    ], operatorTypesGroups: [
        {id: 'default', label: 'include into compare'},
        {id: 'spec', label: 'special'}
    ], operatorTypes: [
        {id: 11, group: 'default', label: 'Milliseconds'},
        {id: 12, group: 'default', label: 'Seconds'},
        {id: 13, group: 'default', label: 'Minutes'},
        {id: 14, group: 'default', label: 'Hours'},
        {id: 15, group: 'default', label: 'Day of Month'},
        {id: 16, group: 'default', label: 'Month'},
        {id: 17, group: 'default', label: 'Year'},
        {id: 18, group: 'spec', label: 'Day of Week'}
    ], outputTSFormatsGroups: [
        {id: 'time', label: 'timestamp (number)'},
        {id: 'timeRounded', label: 'timestamp rounded (number)'},
        {id: 'string', label: 'Text'}
    ], outputTSFormats: [
        {id: 0, group: 'time', name: 'ms', label: 'milliseconds'},
        {id: 1, group: 'time', name: 'sec', label: 'seconds'},
        {id: 2, group: 'time', name: 'min', label: 'minutes'},
        {id: 3, group: 'time', name: 'hour', label: 'hours'},
        {id: 4, group: 'time', name: 'days', label: 'days'},
        {id: 5, group: 'time', name: 'weeks', label: 'weeks'},
        {id: 6, group: 'time', name: 'month', label: 'month'},
        {id: 7, group: 'time', name: 'years', label: 'years'},
        {id: 11, group: 'timeRounded', name: 'sec', label: 'seconds'},
        {id: 12, group: 'timeRounded', name: 'min', label: 'minutes'},
        {id: 13, group: 'timeRounded', name: 'hour', label: 'hours'},
        {id: 14, group: 'timeRounded', name: 'days', label: 'days'},
        {id: 15, group: 'timeRounded', name: 'weeks', label: 'weeks'},
        {id: 16, group: 'timeRounded', name: 'month', label: 'month'},
        {id: 17, group: 'timeRounded', name: 'years', label: 'years'},
        {id: 99, group: 'string', name: 'Other', label: 'Other'}
    ], outputFormatsGroups: [
        {id: 'number', label: 'Number'},
        {id: 'string', label: 'Text (string)'},
        {id: 'time', label: 'time (number) since emit'},
        {id: 'dayOfWeek', label: 'day of week'},
        {id: 'other', label: 'Other'}
    ], outputFormats: [
        {id: 0, group: 'number', name: 'UNIX', label: 'milliseconds UNIX timestamp'},
        {id: 10, group: 'number', name: 'YYYYMMDDHHMMSS', label: 'YYYYMMDDHHMMSS'},
        {id: 11, group: 'number', name: 'YYYYMMDD_HHMMSS', label: 'YYYYMMDD.HHMMSS'},
        {id: 1, group: 'string', name: 'UTC', label: 'UTC date and time' },
        {id: 2, group: 'string', name: 'local', label: 'local date and time'},
        {id: 3, group: 'string', name: 'localTime', label: 'local time'},
        {id: 12, group: 'string', name: 'localDate', label: 'local date'},
        {id: 5, group: 'string', name: 'ISO', label: 'ISO date and time'},
        {id: 18, group: 'string', name: 'ISO-2', label: 'ISO date and time of local timezone' },
        {id: 6, group: 'time', name: 'ms', label: 'milliseconds'},
        {id: 7, group: 'time', name: 'sec', label: 'seconds'},
        {id: 8, group: 'time', name: 'min', label: 'minutes'},
        {id: 9, group: 'time', name: 'hour', label: 'hours'},
        {id: 16, group: 'dayOfWeek', name: 'Day Name', label: 'Day Name, e.g. Monday, 22.12.'},
        {id: 17, group: 'dayOfWeek', name: 'Day', label: 'Day in relative, e.g. Today, 22.12.'},
        {id: -1, group: 'other', name: 'object', label: 'as object'},
        {id: 99, group: 'other', name: 'free definition', label: 'Other'}
    ], parseFormatsGroups: [
        {id: 'number', label: 'Number'},
        {id: 'string', label: 'Text (string)'},
        {id: 'other', label: 'Other'}
    ], parseFormats: [
        {id: 0, group: 'number', label: 'milliseconds UNIX timestamp', add: 'xxx'},
        {id: 1, group: 'string', label: 'ECMA-262', add: 'standard JSON Date representation'},
        {id: 2, group: 'string', label: 'try different text Formats, prefer day first like d/M/y (e.g. European format)', add: 'will try different formats, prefer European formats'},
        {id: 3, group: 'string', label: 'try different text Formats, prefer month first like M/d/y (e.g. American format)', add: 'will try different formats, prefer American formats'},
        {id: 4, group: 'number', label: 'YYYYMMDDHHMMSS', add: 'xxx'},
        {id: 5, group: 'number', label: 'YYYYMMDD.HHMMSS', add: 'xxx'},
        {id: 98, group: 'other', label: 'various - try different Formats (object, number, text)', add: 'xxx'},
        {id: 99, group: 'other', label: 'text - free definition', add: 'xxx'}
    ], multiplierGroups: [
        {id: 'default', label: 'Standard'},
        {id: 'other', label: 'Special'}
    ], multiplier: [
        {id: 1, group: 'default', label: 'milliseconds'},
        {id: 1000, group: 'default', label: 'seconds'},
        {id: 60000, group: 'default', label: 'minutes'},
        {id: 3600000, group: 'default', label: 'hours'},
        {id: 86400000, group: 'default', label: 'days'},
        // {id: 604800000, group: 'other', label: 'weeks'}, //maximum is 2147483647
        {id: -1, group: 'other', label: 'month'},
        {id: -2, group: 'other', label: 'year'}
    ], comparatorGroups: [
        { id: 'simple', label: 'simple' },
        { id: 'compare', label: 'compare' },
        { id: 'enhanced', label: 'enhanced' }
    ], comparator: [
        { id: 'true', group: 'simple', label: 'true', operatorCount: 1 },
        { id: 'false', group: 'simple', label: 'false', operatorCount: 1 },
        { id: 'null', group: 'simple', label: 'null', operatorCount: 1 },
        { id: 'nnull', group: 'simple', label: 'not null', operatorCount: 1 },
        { id: 'empty', group: 'simple', label: 'empty', operatorCount: 1 },
        { id: 'nempty', group: 'simple', label: 'not empty', operatorCount: 1 },
        { id: 'true_expr', group: 'enhanced', label: 'true_expr', operatorCount: 1 },
        { id: 'false_expr', group: 'enhanced', label: 'false_expr', operatorCount: 1 },
        { id: 'ntrue_expr', group: 'enhanced', label: 'not true_expr', operatorCount: 1 },
        { id: 'nfalse_expr', group: 'enhanced', label: 'not false_expr', operatorCount: 1 },
        { id: 'equal', group: 'compare', label: 'equal', operatorCount: 2 },
        { id: 'nequal', group: 'compare', label: 'not equal', operatorCount: 2 },
        { id: 'lt', group: 'compare', label: 'less than', operatorCount: 2 },
        { id: 'lte', group: 'compare', label: 'less than or equal', operatorCount: 2 },
        { id: 'gt', group: 'compare', label: 'greater than', operatorCount: 2 },
        { id: 'gte', group: 'compare', label: 'greater than or equal', operatorCount: 2 },
        { id: 'contain', group: 'enhanced', label: 'contain', operatorCount: 2 },
        { id: 'containSome', group: 'enhanced', label: 'containSome', operatorCount: 2 },
        { id: 'containEvery', group: 'enhanced', label: 'containEvery', operatorCount: 2 }
    ]
};

function getSelectFields() { // eslint-disable-line no-unused-vars
    return globSelectFields;
}

function getTypes(node) { // eslint-disable-line no-unused-vars
    return {
        Unlimited: {
            value: 'none',
            label: node._('node-red-contrib-sun-position/position-config:common.types.unlimited','no limitation'),
            // icon: "icons/node-red-contrib-sun-position/inputTypeNone.png",
            hasValue: false
        },
        Undefined: {
            value: 'none',
            label: node._('node-red-contrib-sun-position/position-config:common.types.undefined'),
            // label: node._('node-red-contrib-sun-position/position-config:common.types.undefined','not used'),
            // icon: "icons/node-red-contrib-sun-position/inputTypeNone.png",
            hasValue: false
        },
        DateSpecific: {
            value: 'dateSpecific',
            label: node._('node-red-contrib-sun-position/position-config:common.types.datespecific','timestamp enhanced'),
            // icon: "icons/node-red-contrib-sun-position/inputTypeNone.png",
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
        TimeEntered: {
            value: 'entered',
            label: node._('node-red-contrib-sun-position/position-config:common.types.timeentered','time (next)'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeTime.png',
            hasValue: true,
            validate: /^(0\d|\d|1\d|2[0-3])(?::([0-5]\d|\d))?(?::([0-5]\d|\d))?\s*(pm?)?$/
        },
        DateEntered: {
            value: 'dateEntered',
            label: node._('node-red-contrib-sun-position/position-config:common.types.dateentered','date'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeDate.png',
            hasValue: true,
            validate: /^(\d{1,4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])|(0?[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[0-2])\.\d{1,4}|(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{1,4})([\s.:,-T](00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9])(:([0-9]|[0-5][0-9])([.:]\d{1,3})?)?)?$/
        },
        TimePredefined: {
            value: 'TimePredefined',
            label: node._('node-red-contrib-sun-position/position-config:common.types.timepredefined','fixed times'),
            options: ['next midnight', 'next noon']
        },
        DayOfMonth: {
            value: 'DayOfMonth',
            label: node._('node-red-contrib-sun-position/position-config:common.types.dayofmonth','day of month'),
            options: [
                'first Monday',
                'first Tuesday',
                'first Wednesday',
                'first Thursday',
                'first Friday',
                'first Saturday',
                'first Sunday',
                'last Monday',
                'last Tuesday',
                'last Wednesday',
                'last Thursday',
                'last Friday',
                'last Saturday',
                'last Sunday'
            ]
        },
        TimeSun: {
            value: 'pdsTime',
            label: node._('node-red-contrib-sun-position/position-config:common.types.timesun','sun time'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSunClock.png',
            options: [ 'astronomicalDawn', 'amateurDawn', 'nauticalDawn', 'blueHourDawnStart', 'civilDawn', 'blueHourDawnEnd',
                'goldenHourDawnStart', 'sunrise', 'sunriseEnd', 'goldenHourDawnEnd', 'solarNoon', 'goldenHourDuskStart',
                'sunsetStart', 'sunset', 'goldenHourDuskEnd', 'blueHourDuskStart', 'civilDusk', 'blueHourDuskEnd',
                'nauticalDusk', 'amateurDusk', 'astronomicalDusk', 'nadir']
        },
        TimeMoon: {
            value: 'pdmTime',
            label: node._('node-red-contrib-sun-position/position-config:common.types.timemoon','moon time'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeMoonClock.png',
            options: ['rise', 'set']
        },
        SunCalc: {
            value: 'pdsCalcData',
            label: node._('node-red-contrib-sun-position/position-config:common.types.suncalc','sun calculation'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeSun.png',
            hasValue: false
        },
        MoonCalc: {
            value: 'pdmCalcData',
            label: node._('node-red-contrib-sun-position/position-config:common.types.mooncalc','moon calculation'),
            icon: 'icons/node-red-contrib-sun-position/inputTypeMoon.png',
            hasValue: false
        }
    };
}

const autocompleteFormats = {
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
    dateOutFormat: [{label: 'yyyy Year (4 digits)', value: 'yyyy'},
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
        {label: 'Z    time zone (abbr.)', value: 'Z'},
        {label: 'o    time zone offset (abbr.)', value: 'o'},
        {label: 'S    date\'s ordinal suffix (st, nd, rd, or th)', value: 'S'},
        {label: 'x    Day difference', value: 'x'},
        {label: 'xx   Day difference (name)', value: 'xx'}
    ]
};

// #region functions
$.fn.getCursorPosition = function () {
    const input = this.get(0);
    if (!input) {
        return;
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
};

function initializeValue(data, id, newVal) { // eslint-disable-line no-unused-vars
    if (data[id] === null || typeof data[id] === 'undefined') {
        // let idHtml = "#node-input-" + id;
        // data[id] = newVal;
        $('#node-input-' + id).val(newVal);
        // console.log('not initialized value !! "' + id + '" = "' + newVal + '" - ' + data[id]); // eslint-disable-line
    }
}

function autocomplete(inputBox, dataListID) { // eslint-disable-line no-unused-vars
    const dataList = autocompleteFormats[dataListID];
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

function appendOptions(node, parent, elementName, limit) { // eslint-disable-line no-unused-vars
    // console.log('appendOptions elementName='+ elementName + ' limit='+limit);
    const groups = globSelectFields[elementName + 'Groups'];
    if (!groups) {
        throw new Error('no group "' + elementName + 'Groups" in globSelectFields found!');
    }
    const elements = globSelectFields[elementName];
    if (!groups) {
        throw new Error('no elements "' + elementName + '" in globSelectFields found!');
    }
    const groupLength = groups.length;
    const elementsLength = elements.length;
    for (let gIndex = 0; gIndex < groupLength; gIndex++) {
        const group = $('<optgroup/>', {label: node._('node-red-contrib-sun-position/position-config:common.' + elementName + 'Groups.' + gIndex)}).appendTo(parent);
        for (let eIndex = 0; eIndex < elementsLength; eIndex++) {
            if (groups[gIndex].id === elements[eIndex].group) {
                if (limit) {
                    if (limit(elements[eIndex])) {
                        group.append($('<option></option>').val(elements[eIndex].id).text(node._('node-red-contrib-sun-position/position-config:common.' + elementName + '.' + eIndex)).attr('addText', elements[eIndex].add));
                    }
                } else {
                    group.append($('<option></option>').val(elements[eIndex].id).text(node._('node-red-contrib-sun-position/position-config:common.' + elementName + '.' + eIndex)).attr('addText', elements[eIndex].add));
                }
            }
        }
    }
}

function setupTInput(node, data) { // eslint-disable-line no-unused-vars
    const $inputField = $('#node-input-' + data.valueProp);
    const $typeField = $('#node-input-' + data.typeProp);
    if (typeof node[data.typeProp] === 'undefined' ||
        node[data.typeProp] === null) {
        if (typeof data.defaultType !== 'undefined') {
            node[data.typeProp] = data.defaultType;
            $typeField.val(data.defaultType);
        }
    } else {
        $typeField.val(node[data.typeProp]);
    }
    if (typeof node[data.valueProp] === 'undefined' ||
        node[data.valueProp] === null) {
        if (typeof data.defaultValue !== 'undefined') {
            node[data.valueProp] = data.defaultValue;
            $inputField.val(node[data.defaultValue]);
        }
    } else {
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
 * sets a checkbox matrix
 * @param {string} element name of the element as jQuery element name
 * @param {string} val value of the element
 */
function initDaysCheckbox(element, val) { // eslint-disable-line no-unused-vars
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

function initCombobox(node, $inputSelect, $inputBox, dataList, optionElementName, value, baseWidth, timeFormat) { // eslint-disable-line no-unused-vars
    // console.log('initCombobox node=' + node + ' dataList=' + dataList + ' optionElementName=' + optionElementName + ' value=' + value + ' width=' + width); // eslint-disable-line
    appendOptions(node, $inputSelect, optionElementName);
    autocomplete($inputBox, dataList);
    const valueNum = Number(value);
    timeFormat = timeFormat || 'default';
    if (isNaN(valueNum)) {
        $inputSelect.val(99);
        $inputBox.val(value);
    } else {
        $inputSelect.val(valueNum);
    }

    $inputSelect.on('change', (_type, _value) => {
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

function addLabel(row, forEl, symb, text) { // eslint-disable-line no-unused-vars
    const lbl = $('<label class="' + forEl + '-lbl" style="width:auto"/>').attr('for', forEl).appendTo(row);
    if (symb) {
        lbl.append('<i class= "' + symb + '" >');
    }
    if (text) {
        const span = $('<span class="' + forEl + '-span" style="float: right; margin-left: 5px; margin-right: 2px;*/">' + text + '</span>');
        lbl.append(span);
        lbl.attr('style', 'margin-left: 5px; width:' + 20 + span.width() + 'px;');
    } else {
        lbl.attr('style', 'margin-left: 5px; margin-right: 2px; width:20px');
    }
    return lbl;
}

function getMultiselectText(val, length, types) { // eslint-disable-line no-unused-vars
    for (let index = 0; index < types.length; index++) {
        if (types[index].selection.test(val)) {
            return types[index].label;
        }
    }
    if (length > 0) {
        return length;
    }
    return 'NA';
}

function setMultiselect(value, field, types) { // eslint-disable-line no-unused-vars
    if (value === '*' || typeof value === 'undefined') {
        field.find('#option-checkboxes input[type=checkbox]').prop('checked', true);
        field.find('.multiselect-option').text(getMultiselectText('*', 99, types));
    } else {
        field.find('#option-checkboxes input[type=checkbox]').removeAttr('checked');
        const elm = value.split(',');
        elm.forEach(v => {
            field.find('#option-checkboxes [value=' + v + ']').prop('checked', true);
        });
        field.find('.multiselect-option').text(getMultiselectText(value, elm.length, types));
    }
}

/**
 * adds a multiselect combo box to the form
 * @param {*} node Node Red Source Node
 * @param {*} parent Parent jQuery Element to add multiselect
 * @param {*} elementName Name of the element in the node, e.g. 'operatorTypes'
 * @param {*} i18N i18N element name, e.g. 'time-comp.operatorTypes'
 * @param {*} id element id, e.g. 'node-input-rule-operatorType-1'
 */
function multiselect(node, parent, elementName, i18N, id) { // eslint-disable-line no-unused-vars
    const types = globSelectFields[elementName + 'Short'];
    const getSelection = function getCBText(parent) {
        const value = parent.find('#option-checkboxes input[type=checkbox]:checked');
        const elements = value.map((_, el) => { return $(el).val(); }).get();
        parent.find('.multiselect-option').text(getMultiselectText(elements.join(','), elements.length, types));
    };
    const multiselect = $('<div/>', {class: 'multiselect', id}).appendTo(parent);
    const selectbox = $('<div/>', {
        class: 'selectBox',
        html: $('<select/>', {
            id: 'multiselect-select',
            class: 'multiselect-select',
            html: $('<option></option>', {
                id: 'multiselect-option',
                class: 'multiselect-option'
            }).text('x')
        })
    }).appendTo(multiselect);
    $('<div/>', {class: 'overSelect'}).appendTo(selectbox);
    const list = $('<div/>', {
        id: 'option-checkboxes',
        class: 'option-checkboxes'
    }).appendTo(multiselect);
    list.attr('expanded', 'false');
    const groups = globSelectFields[elementName + 'Groups'];
    const groupLength = groups.length;
    const elements = globSelectFields[elementName];
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

function getTimeData(result, data) { // eslint-disable-line no-unused-vars
    if (!data || data.type === 'none' || data.type === '' || data.type === 'json' || data.type === 'jsonata' || data.type === 'bin') {
        result({ value: data.type});
    } else if (data.type === 'num' || data.type === 'str' || data.type === 'bool') {
        result({ value: data.value });
    } else if (data.type === 'msg' || data.type === 'flow' || data.type === 'global' || data.type === 'env') {
        result({ value: data.type + '.' + data.value });
    } else if (data.type === 'msgPayload') {
        result({ value: 'msg.payload' });
    } else if (data.type === 'msgTs') {
        result({ value: 'msg.ts' });
    } else if (data.type === 'msgLC') {
        result({ value: 'msg.lc' });
    } else if (data.type === 'msgValue') {
        result({ value: 'msg.value' });
    } else {
        const url = '/sun-position/data?kind=getTimeData&' + jQuery.param( data );
        $.getJSON(url, result);
    }
}

function getDateData(result, data) { // eslint-disable-line no-unused-vars
    const url = '/sun-position/data?kind=getDateData&' + jQuery.param( data );
    $.getJSON(url, result);
}

function getOutDataData(result, data) { // eslint-disable-line no-unused-vars
    if (data.type === 'none' || data.type === '' || data.type === 'json' || data.type === 'jsonata' || data.type === 'bin') {
        result(data.type);
    } else if (data.type === 'num' || data.type === 'str' || data.type === 'bool') {
        result(data.value);
    } else if (data.type === 'msg' || data.type === 'flow' || data.type === 'global' || data.type === 'env') {
        result(data.type + '.' + data.value);
    } else if (data.type === 'msgPayload') {
        result('msg.payload');
    } else if (data.type === 'msgTs') {
        result('msg.ts');
    } else if (data.type === 'msgLC') {
        result('msg.lc');
    } else if (data.type === 'msgValue') {
        result('msg.value');
    } else {
        const url = '/sun-position/data?kind=getOutDataData&' + jQuery.param( data );
        $.getJSON(url, result);
    }
}