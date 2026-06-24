/* eslint-disable require-jsdoc */
/* eslint-disable prefer-arrow-callback */
/* global describe it */
'use strict';

const should = require('should');
const ctrlLib = require('../nodes/lib/timeControlHelper.js');
const hlp = require('../nodes/lib/dateTimeHelper.js');

describe('time control helper', function() {
    it('keeps a from-rule active across midnight', function() {
        const node = {
            debug() {},
            warn() {},
            positionConfig: {
                getTimeProp() {
                    const result = {
                        value: new Date('2024-01-01T22:00:00.000Z'),
                        error: null
                    };
                    return result;
                }
            }
        };
        const msg = {};
        const rule = {
            name: 'night rule',
            pos: 1,
            time: {
                type: 'entered',
                value: '22:00',
                operator: 1,
                operatorText: 'from'
            }
        };
        const now = new Date('2024-01-02T00:30:00.000Z');
        const tData = {
            now,
            nowNr: now.getTime(),
            dayId: hlp.getDayId(now),
            monthNr: now.getMonth(),
            dateNr: now.getDate(),
            weekNr: 1,
            yearNr: now.getFullYear()
        };

        const result = ctrlLib.compareRules(node, msg, rule, r => (r <= now.getTime()), tData);

        should(result).equal(rule);
    });
});
