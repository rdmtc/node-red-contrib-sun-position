# Generic Functions, Parameter and more

## Introduction

This documents described the default functions, which are used over multiple nodes of this node collection.

## Table of contents

- [Generic Functions, Parameter and more](#generic-functions-parameter-and-more)
  - [Introduction](#introduction)
  - [Table of contents](#table-of-contents)
  - [Possible Node Output Formats](#possible-node-output-formats)
    - [Standard node Output Formats](#standard-node-output-formats)
    - [enhanced timestamp OutputFormat](#enhanced-timestamp-outputformat)
      - [offset](#offset)
      - [formats](#formats)
      - [timestamp values](#timestamp-values)
    - [special output](#special-output)
  - [Times definitions](#times-definitions)
    - [sun times](#sun-times)
      - [remarks to the Times definitions](#remarks-to-the-times-definitions)
        - [blue hour](#blue-hour)
        - [amateurDawn /amateurDusk](#amateurdawn-amateurdusk)
        - [alternate properties](#alternate-properties)
    - [moon times](#moon-times)
    - [message, flow or global property or JSONATA expression](#message-flow-or-global-property-or-jsonata-expression)
  - [input parse formats](#input-parse-formats)
  - [output timestamp formats](#output-timestamp-formats)
  - [output timespan formats](#output-timespan-formats)
  - [Conditions](#conditions)
  - [Special JSOATA Functions](#special-jsoata-functions)
    - [simple helper functions](#simple-helper-functions)
      - [validation functions](#validation-functions)
        - [$isValidDate(param1)](#isvaliddateparam1)
        - [$isBool(param1)](#isboolparam1)
        - [$isTrue(param1)](#istrueparam1)
        - [$isFalse(param1)](#isfalseparam1)
      - [logical functions](#logical-functions)
        - [$XOR(param1, param2)](#xorparam1-param2)
        - [$XAND(param1, param2)](#xandparam1-param2)
      - [number and string functions](#number-and-string-functions)
        - [$countDecimals(param1)](#countdecimalsparam1)
        - [$pad(param1, [param2])](#padparam1-param2)
        - [$clipStrLength(param1, [param2])](#clipstrlengthparam1-param2)
      - [date helper functions](#date-helper-functions)
        - [$getNthWeekdayOfMonth(param1, [param2], [param3], [param4])](#getnthweekdayofmonthparam1-param2-param3-param4)
        - [$getLastDayOfMonth(param1,[param2, [param3])](#getlastdayofmonthparam1param2-param3)
        - [$getWeekOfYear(param1)](#getweekofyearparam1)
        - [$getDayOfYear(param1)](#getdayofyearparam1)
        - [$getStdTimezoneOffset(param1)](#getstdtimezoneoffsetparam1)
        - [$isDSTObserved(param1)](#isdstobservedparam1)
        - [$addOffsetToDate(param1, param2, [param3])](#addoffsettodateparam1-param2-param3)
      - [date parse and format functions](#date-parse-and-format-functions)
        - [$getFormattedDateOut(param1, [param2], [param3], [param4])](#getformatteddateoutparam1-param2-param3-param4)
        - [$parseDateFromFormat(param1, param2, [param3])](#parsedatefromformatparam1-param2-param3)
      - [sun functions](#sun-functions)
        - [$getSunTimeByName(param1, [param2], [param3], [param4])](#getsuntimebynameparam1-param2-param3-param4)
        - [$getSunTimePrevNext([param1])](#getsuntimeprevnextparam1)
        - [$getSunCalc([param1], [param2], [param3])](#getsuncalcparam1-param2-param3)
        - [$getSunInSky([param1])](#getsuninskyparam1)
      - [moon functions](#moon-functions)
        - [$getMoonTimeByName(param1, [param2], [param3], [param4])](#getmoontimebynameparam1-param2-param3-param4)
        - [$getMoonCalc([param1], [param2])](#getmooncalcparam1-param2)
        - [$getMoonIllumination([param1])](#getmoonilluminationparam1)
        - [$getMoonPhase([param1])](#getmoonphaseparam1)

## Possible Node Output Formats

Lot of the nodes of these package allows to define additional output formats of payload or message properties additional to the standard Node-Red data types.

![payload Formats](https://user-images.githubusercontent.com/12692680/75714307-c3201e80-5ccb-11ea-97cc-2fb456dd0809.png)

Many of these output formats can also be used when choosing a property for a condition, example if the alternate time should be used in the  - [time-inject](#time-inject) node or the if a rule should be valid in a [blind-control](#blind-control) or [clock-timer](#clock-timer) node.

![property for a condition](https://user-images.githubusercontent.com/12692680/78409659-87e67780-760a-11ea-9c96-dcfa93b2528d.png)

### Standard node Output Formats

see Node-Red documentation for more Information

- timestamp - timestamp as the number of millisecond since midnight January 1, 1970 UTC
- flow
- global
- string
- number
- boolean
- JSON
- buffer
- env variable
- JSONATA expression

### enhanced timestamp OutputFormat

Additional to the node-red standard `timestamp` output which represents the current timestamp as the number of millisecond since midnight January 1, 1970 UTC there are possibility for different timestamps with different output format.

![timestamp output](https://user-images.githubusercontent.com/12692680/75715301-7b01fb80-5ccd-11ea-9acc-da4acaf00ee3.png)

#### offset

Typical it is that there is the possibility to can add an offset or subtract an offset by using a negative offset value.

![offset](https://user-images.githubusercontent.com/12692680/75762629-488ee780-5d3b-11ea-9761-aada4f6ccfdc.png)

The Offset itself must be a number which is defined direct as number or given by a flow or global context. Additional the offset could be random number then the offset will be between 0 and the given value.

#### formats

For the enhances timestamps the output format could be defined.

![output format definition](https://user-images.githubusercontent.com/12692680/75715251-66256800-5ccd-11ea-9a53-a733110c925c.png)

See the following chapters for possible formats:

- [output timestamp formats](#output-timestamp-formats)
- [output timespan formats](#output-timespan-formats)

#### timestamp values

complete free definition of the format:

- timestamp enhanced
  - equal to th Node-Red standard timestamp the current timestamp (e.g. inject timestamp) with all the enhanced offset and output format options
- time (next) - a definable time in the format
  - HH:MM
  - HH:MM:SS
  - HH:MM pm
  - HH:MM am
  - HH:MM:SS pm
  - HH:MM:SS am
  - ...
- date - a date and time in the format:
  - YYYY-MM-DD
  - YYYY-M-D
  - D.M.YYYY
  - DD.MM.YYYY
  - YYYY-MM-DD HH:MM
  - YYYY-MM-DDTHH:MM:SS.MS
  - YYYY-MM-DD HH:MM:SS
  - DD.MM.YYYY HH:MM
  - DD.MM.YYYY HH:MM:SS
  - ...
- sun time - a timestamp based on a sun time (e.g. sunrise or sunset)
  - moon time - a timestamp based on a moon rise or moon set
- day of month - a day based of the month for the inject timestamp

### special output

Additional special values could be defined as output.

- sun calculation - the sun position object equal to the output of the sun-position node
- sun in the sky (percent) - the percentage of the sun in the sky
- moon calculation - the moon position object equal to the output of the moon-position node
- moon phase - the current moon-phase
- azimuth of sun - the azimuth of the sun on the inject timestamp in decimal degree
- elevation of sun - the elevation of the sun on the inject timestamp in decimal degree
- azimuth of sun (rad) - the azimuth of the sun on the inject timestamp in rad
- elevation of sun (rad) - the azimuth of the sun on the inject timestamp in rad
- is daylight saving time - gives a `boolean` of _true_ if is daylight saving time, otherwise _false_
- week of the year - gives a `number` of the current week of the year
- week of the year is even - gives a `boolean` of _true_ if the current week of the year is even, otherwise _false_
- day of the year - gives a `number` of the current day of the year
- day of the year is even - gives a `boolean` of _true_ if the current day of the year is even, otherwise _false_

## Times definitions

The time definitions of the nodes has different configuration possibilities

![within-time-startTime](https://user-images.githubusercontent.com/12692680/57134526-b62e5800-6da6-11e9-9b95-b0e9998c41c4.png)

manual timestamps can be entered as one of the following formats:

- `00:00 ... 23:59` 24h Format
- `00:00:00 ... 23:59:00` 24h Format with seconds
- `00:00pm ... 12:59pm` 12h Format
- `00:00:00pm ... 12:59:00pm` 12h Format with seconds

### sun times

following Sun times will be calculated and can be chosen:

| Time                | Description                                                              | SunBH |
| ------------------- | ------------------------------------------------------------------------ | ----- |
| `astronomicalDawn`  | night ends (morning astronomical twilight starts)                        | 18    |
| `amateurDawn`       | amateur astronomical dawn (sun at 12° before sunrise)                    | 15    |
| `nauticalDawn`      | nautical dawn (morning nautical twilight starts)                         | 12    |
| `blueHourDawnStart` | blue Hour start (time for special photography photos starts)             | 8     |
| `civilDawn`         | dawn (morning nautical twilight ends, morning civil twilight starts)     | 6     |
| `blueHourDawnEnd`   | blue Hour end (time for special photography photos end)                  | 4     |
| `goldenHourDawnStart` | morning golden hour (soft light, best time for photography) starts     | -1    |
| `sunrise`           | sunrise (top edge of the sun appears on the horizon)                     | 0.833 |
| `sunriseEnd`        | sunrise ends (bottom edge of the sun touches the horizon)                | 0.3   |
| `goldenHourDawnEnd`   | morning golden hour (soft light, best time for photography) ends       | -6    |
| `solarNoon`         | solar noon (sun is in the highest position)                              |       |
| `goldenHourDuskStart` | evening golden hour (soft light, best time for photography) starts     | -6    |
| `sunsetStart`       | sunset starts (bottom edge of the sun touches the horizon)               | 0.3   |
| `sunset`            | sunset (sun disappears below the horizon, evening civil twilight starts) | 0.833 |
| `goldenHourDuskEnd` | evening golden hour (soft light, best time for photography) ends         | 1     |
| `blueHourDuskStart` | blue Hour start (time for special photography photos starts)             | 4     |
| `civilDusk`         | dusk (evening nautical twilight starts)                                  | 6     |
| `blueHourDuskEnd`   | blue Hour end (time for special photography photos end)                  | 8     |
| `nauticalDusk`      | nautical dusk end (evening astronomical twilight starts)                 | 12    |
| `amateurDusk`       | amateur astronomical dusk (sun at 12° after sunrise)                     | 15    |
| `astronomicalDusk`  | night starts (dark enough for astronomical observations)                 | 18    |
| `nadir`             | nadir (darkest moment of the night, sun is in the lowest position)       |       |

SunBH is the angle of the sun below the horizon

![sun-times](https://user-images.githubusercontent.com/12692680/57134546-c6dece00-6da6-11e9-8a32-c3517c5211fe.png)

#### remarks to the Times definitions

##### blue hour

Although the blue hour does not have an official definition, the blue color spectrum is most prominent when the Sun is between 4° and 8° below the horizon.

##### amateurDawn /amateurDusk

This is not an official definition, this is happend when the Sun is 15° below the horizon

##### alternate properties

The following time parameters are exists in the output for backward compatibility. These are equal to parameters in the table above:

| time parameter    | is equal to              |
| ----------------- | ------------------------ |
| `dawn`            | `civilDawn`              |
| `dusk`            | `civilDusk`              |
| `nightEnd`        | `astronomicalDawn`       |
| `night`           | `astronomicalDusk`       |
| `nightStart`      | `astronomicalDusk`       |
| `goldenHour`      | `goldenHourDuskStart`    |
| `sunsetEnd`       | `sunset`                 |
| `sunriseStart`    | `sunrise`                |
| `goldenHourEnd`   | `goldenHourDawnEnd`      |
| `goldenHourStart` | `goldenHourDuskStart`    |

### moon times

moon rise and moon set can be used

### message, flow or global property or JSONATA expression

any message, flow or global property which contain any of the following types:

- Integer which is a [Unix Time Stamp](http://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html#tag_04_16) representing the number of milliseconds since January 1, 1970, 00:00:00 UTC, with leap seconds ignored.
- String value representing a valid JavaScript date-string.

String as one of the following formats:

- `00:00 ... 23:59` 24h Format
- `00:00:00 ... 23:59:00` 24h Format with seconds
- `00:00pm ... 12:59pm` 12h Format
- `00:00:00pm ... 12:59:00pm` 12h Format with seconds

**Offsets:**
The start and end time can have an offset. This is specified in seconds,minutes or hours:

- negative number brings the time forward. E.g. if the time is dusk and offset is -60 minutes, the start time will be 60 minutes before dusk.
- positive number delays the time by the specified number

## input parse formats

Some nodes has the ability to get an input time out of different pre defined formats or a free format definition.

The formats are:

- **milliseconds UNIX timestamp** This is the default for Node-ed. Timestamps are a numeric representation of the time in milliseconds since 1970-01-01 UTC
- **ECMA-262** YYYY-MM-DDTHH:mm:ss.sssZ - This is the default toString output of JavaScript. This is a simplification of the ISO 8601 Extended Format.
- **YYYYMMDDHHMMSS** is a number of the format YYYYMMDDHHMMSS.
- **YYYYMMDD.HHMMSS** is a number of the format YYYYMMDD.HHMMSS.
- **various** the system will try to parse different string formats
- **other** there you can define a format like "yyyy-MM-dd HH:mm:ss" of the given time. Possible format placeholders are:

 | Field        | Full Form           | Short Form                       |
 | ------------ | ------------------- | -------------------------------- |
 | Year         | yyyy (4 digits)     | yy (2 digits), y (2 or 4 digits) |
 | Month        | MMM (name or abbr.) | MM (2 digits), M (1 or 2 digits) |
 | Month        | NNN (abbr.)         |
 | Day of Month | dd (2 digits)       | d (1 or 2 digits)                |
 | Day of Week  | EE (name)           | E (abbr.)                        |
 | Hour (1-12)  | hh (2 digits)       | h (1 or 2 digits)                |
 | Hour (0-23)  | HH (2 digits)       | H (1 or 2 digits)                |
 | Hour (0-11)  | KK (2 digits)       | K (1 or 2 digits)                |
 | Hour (1-24)  | kk (2 digits)       | k (1 or 2 digits)                |
 | Minute       | mm (2 digits)       | m (1 or 2 digits)                |
 | Second       | ss (2 digits)       | s (1 or 2 digits)                |
 | Millisecond  | ll (3 digits)       | l (1, 2 or 3 digits)             |
 | AM/PM        | tt  (2 digits)      | t (1 or 2 digits)                |

## output timestamp formats

For timestamp outputs some nodes has the ability to define the format of the timestamp. Therefore different pre defined formats exists or a free format definition.

The formats are:

- **milliseconds UNIX timestamp** Timestamps are a numeric representation of the time in milliseconds since 1970-01-01 UTC
- **ECMA-262** YYYY-MM-DDTHH:mm:ss.sssZ - This is the default toString output of JavaScript. This is a simplification of the ISO 8601 Extended Format.
- **YYYYMMDDHHMMSS** is a number of the format YYYYMMDDHHMMSS.
- **YYYYMMDD.HHMMSS** is a number of the format YYYYMMDD.HHMMSS.
- **local** is the java script output of date.toLocaleString()
- **localLong** is the java script output of date.toString()
- **localTime** is the java script output of date.toLocaleTimeString()
- **localTimeLong** is the java script output of date.toTimeString()
- **localDate** is the java script output of date.toLocaleDateString()
- **localDateLong** is the java script output of date.toDateString()
- **UTC** is the java script output of date.toUTCString()
- **ISO** YYYY-MM-DDTHH:mm:ss.sssZ (output of date.toISOString())
- **ms** the time in milliseconds between output and timestamp
- **sec** the time in seconds between output and timestamp
- **min** the time in minutes between output and timestamp
- **hour** the time in hours between output and timestamp
- **Day Name** the timestamps day in the format Monday, 22.12.
- **Day in relative** the timestamps day in relative to output time in the format Today, 22.12.
- **object** gives back an object for the timestamp with the following properties:
  - **date** Java script Date object
  - **ts** number - Unix timestamp (milliseconds since 1970-01-01 UTC)
  - **timeUTCStr** string representation of the Time in UTC format
  - **timeISOStr** string representation of the Time in ISO format
  - **timeLocaleStr** the java script output of date.toLocaleString()
  - **timeLocaleTimeStr** the java script output of date.toLocaleTimeString()
  - **delay** the time in milliseconds between output and timestamp
  - **delaySec** the time in seconds between output and timestamp
- **other** there you can define a format like "yyyy-MM-dd HH:mm:ss" of the given time. Possible format placeholders are:

| placeholder | Description                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| d           | Day of the month as digits; no leading zero for single-digit days.                                                                                            |
| dd          | Day of the month as digits; leading zero for single-digit days.                                                                                               |
| ddd         | Day of the week as a three-letter abbreviation. (same as E)                                                                                                   |
| dddd        | Day of the week as its full name.  (same as EE)                                                                                                               |
| E           | Day of the week as a three-letter abbreviation.                                                                                                               |
| EE          | Day of the week as its full name.                                                                                                                             |
| M           | Month as digits; no leading zero for single-digit months.                                                                                                     |
| MM          | Month as digits; leading zero for single-digit months.                                                                                                        |
| MMM         | Month as a three-letter abbreviation.                                                                                                                         |
| MMMM        | Month as its full name.                                                                                                                                       |
| yy          | Year as last two digits; leading zero for years less than 10.                                                                                                 |
| yyyy        | Year represented by four digits.                                                                                                                              |
| h           | Hours; no leading zero for single-digit hours (12-hour clock 1-12).                                                                                           |
| hh          | Hours; leading zero for single-digit hours (12-hour clock 01-12).                                                                                             |
| H           | Hours; no leading zero for single-digit hours (24-hour clock  0-23).                                                                                          |
| HH          | Hours; leading zero for single-digit hours (24-hour clock 00-23).                                                                                             |
| k           | Hours; no leading zero for single-digit hours (12-hour clock 0-11).                                                                                           |
| kk          | Hours; leading zero for single-digit hours (12-hour clock  00-11).                                                                                            |
| K           | Hours; no leading zero for single-digit hours (24-hour clock 1-24).                                                                                           |
| KK          | Hours; leading zero for single-digit hours (24-hour clock 01-24).                                                                                             |
| m           | Minutes; no leading zero for single-digit minutes.                                                                                                            |
| mm          | Minutes; leading zero for single-digit minutes.                                                                                                               |
| s           | Seconds; no leading zero for single-digit seconds.                                                                                                            |
| ss          | Seconds; leading zero for single-digit seconds.                                                                                                               |
| l           | Milliseconds; no leading zeros for single-digit                                                                                                               |
| ll          | Milliseconds; 1 leading zero for single-digit; no for 3 digits                                                                                                |
| lll         | Milliseconds; 2 leading zero for single-digit; 2 for 2 digits                                                                                                 |
| L           | Milliseconds divided by 100 round to 0; no leading zero                                                                                                       |
| LL          | Milliseconds divided by 10 round to 0; leading zero for single-digit                                                                                          |
| t           | Lowercase, single-character time marker string: a or p.                                                                                                       |
| tt          | Lowercase, two-character time marker string: am or pm.                                                                                                        |
| T           | Uppercase, single-character time marker string: A or P.                                                                                                       |
| TT          | Uppercase, two-character time marker string: AM or PM.                                                                                                        |
| ww          | workweek, number                                                                                                                                              |
| Z           | timezone abbreviation, e.g. EST, MDT, MESZ or MEZ.                                                                                                            |
| z           | timezone offset, e.g. GMT-0500                                                                                                                                |
| zz          | timezone offset - nothing for GMT/UTC, e.g. -0500 or +0230.                                                                                                   |
| o           | GMT/UTC timezone offset in  hours:minutes, e.g. -05:00 or +02:30.                                                                                             |
| oo          | GMT/UTC timezone offset, e.g. -0500 or +0230.                                                                                                                 |
| ooo         | GMT/UTC timezone offset - 'Z' for GMT/UTC, e.g. -0500 or +0230.                                                                                               |
| oooo        | GMT/UTC timezone offset - 'UTC' for GMT/UTC, e.g. -0500 or +0230.                                                                                             |
| S           | The date's ordinal suffix (st, nd, rd, or th). Works well with d.                                                                                             |
| x           | difference of days from timestamp day to output day                                                                                                           |
| xx          | difference of days from timestamp day to output day with relative names for today, tomorrow, ...                                                              |
| '…' or "…"  | Literal character sequence. Surrounding quotes are removed.                                                                                                   |
| UTC:        | Must be the first four characters of the mask. Converts the date from local time to UTC/GMT/Zulu time before applying the mask. The "UTC:" prefix is removed. |

## output timespan formats

For timespan output the calc-timespan node has the ability to define the format of the timespan. Therefore different pre defined formats exists or a free format definition.

The formats are:

- **ms** timespan im milliseconds (integer value)
- **sec**, **min**,..., **month**, **years** timespan as a floating point number or as a integer number of the the chosen unit.
- **object** gives back an object for the timespan with the following properties:
  - **date** Java script Date object
  - **ts** number - Unix timestamp (milliseconds since 1970-01-01 UTC)
  - **timeUTCStr** string representation of the Time in UTC format
  - **timeISOStr** string representation of the Time in ISO format
  - **timeLocaleStr** the java script output of date.toLocaleString()
  - **timeLocaleTimeStr** the java script output of date.toLocaleTimeString()
  - **delay** the time in milliseconds between output and timestamp
  - **delaySec** the time in seconds between output and timestamp
- **other** there you can define a format like "yyyy-MM-dd HH:mm:ss" of the given time. Possible format placeholders are:

## Conditions

A condition usually consists of a *property*, an *operator* and depending on the operator, a *threshold*.

*property*, an *operator*:

![condition-1](https://user-images.githubusercontent.com/12692680/57455030-81207a80-726a-11e9-8803-eb7e526950b4.png)

*property*, *operator* and *threshold*:
![condition-2](https://user-images.githubusercontent.com/12692680/57455031-81b91100-726a-11e9-9987-d53c201f79b0.png)

The operators are:

- `is true` - the value of the *property* must be of type boolean and the condition is fulfilled if the value is `true`
- `is false` - the value of the *property* must be of type boolean and the condition is fulfilled if the value is `false`
- `is null` - the value of the *property* must be `undefined` or `null`
- `is not null` - the value of the *property* can have an obscure value that is not `undefined` or `null`
- `is empty` - the condition is fulfilled if the *property* is an empty `string`, `array`, `buffer` or an object with no properties
- `is not empty` - the condition is fulfilled if the *property* is an  `string`, `array`, `buffer` which is not empty or an object which has properties
- `true expression` - the condition is fulfilled if the *property* is a number and greater `0` or a Boolean which is `true` or a string containing one of the following values `true`, `yes`, `on`, `ja`. If the property has a string `switchon` then this would evaluate to true, because `on` is part of the string.
- `false expression` - the condition is fulfilled if the *property* is a number and less than or equal `0` or a Boolean which is `false` or a string containing one of the following values `false`, `no`, `off`, `nein`.  If the property has a string `nonsens` then this would evaluate to true, because `no` is part of the string.
- `not true expression` - the condition is fulfilled if the *property* is a number and **not** greater `0` or a Boolean which is **not** `true` or a string containing **none** of the following values `true`, `yes`, `on`, `ja`. It the property is a number and **NaN** then this would evaluate to true.
- `false expression` - the condition is fulfilled if the *property* is a number and **not** less than or equal `0` or a Boolean which is **not** `false` or a string containing **none** of the following values `false`, `no`, `off`, `nein`.
- `<`, `<=`, `==`, `!=`, `>`, `>=` - compares the value of the *property* with a *threshold*. Typically this makes only sense if the *property* and the *threshold* are numbers.
- `contain` - the condition is fulfilled if the *property* contains the string defined in the *threshold*.
- `containSome` - the *threshold* must be a string separated with comma `,`, semicolon `;` or pipe `|`. The condition is fulfilled as soon as only one of the separated parts of the *threshold* string is is included in the *property* value.
- `containEvery` - the *threshold* must be a string separated with comma `,`, semicolon `;` or pipe `|`. The condition is fulfilled as soon as all of the separated parts of the *threshold* string are included in the *property* value.

A JSONata expression in the *property* must be always a boolean with value true, in this case the operator can not be chosen.

## Special JSOATA Functions

The JSONATA expression allows additional functions.

- These JSONATA expressions only available in the JSONATA of nodes in this collection, because Node-Red does currently not support a possibility to enhance JSONATA for other nodes.
- the editor does also not support these functions

![image](https://user-images.githubusercontent.com/12692680/79616619-c8afb780-8105-11ea-9fc7-2ba89b9f9af4.png)

![image](https://user-images.githubusercontent.com/12692680/79616539-9b630980-8105-11ea-919b-b929a4cb7029.png)

### simple helper functions

#### validation functions

##### $isValidDate(param1)

- checks if a value is a valid Date object
- Parameter
  - `param1` *any type* - the value to check
- Returns
  - *boolean* - **true** if the given parameter is a valid JavaScript Date, otherwise **false**

##### $isBool(param1)

- returns **true** if the parameter
  - is a number
  - or can be converted to one of the following strings:
    - 'true', 'yes', 'on', 'ja', 'false', 'no', 'off', 'nein'

- Parameter
  - `param1` *any type* - the value to check
- Returns
  - *boolean* - **true** if the parameter value is a valid boolean value for **false** or **true**

##### $isTrue(param1)

- returns **true** if the parameter
  - is a number and greater than 0
  - or can be converted to one of the following strings:
    - 'true', 'yes', 'on', 'ja'

- Parameter
  - `param1` *any type* - the value to check
- Returns
  - *boolean* - **true** if the parameter value is a valid boolean value for **true**

##### $isFalse(param1)

- returns **true** if the parameter
  - is a number and less than or equal 0
  - or can be converted to one of the following strings:
    - 'false', 'no', 'off', 'nein'

- Parameter
  - `param1` *any type* - the value to check
- Returns
  - *boolean* - **true** if the parameter value is a valid boolean value for **false**

#### logical functions

##### $XOR(param1, param2)

- Exclusive OR

- Parameter
  - `param1` *boolean* - operand one
  - `param2` *boolean* - operand two
- Returns
  - *boolean* - **true** if the a expression or b expression is **true** (like ||), but not if both are **true**

##### $XAND(param1, param2)

- Exclusive AND

- Parameter
  - `param1` *boolean* - operand one
  - `param2` *boolean* - operand two
- Returns
  - *boolean* - **true** if the a expression and b expression is **true** (like &&) or if both are **false**

#### number and string functions

##### $countDecimals(param1)

- count the number of decimals of a number

- Parameter
  - `param1` *number* - number to get the decimals
- Returns
  - *number* - number of decimals for the given number

##### $pad(param1, [param2])

- creates a string from a object (typical number) with leading zeros

- Parameter
  - `param1` *any type* - number/string to format
  - `param2` *number* - (optional) length of number (default 2)
- Returns
  - *string* - string (number) with minimum digits as defined in length

##### $clipStrLength(param1, [param2])

- clip a text to a maximum length (adds ... if clipped)

- Parameter
  - `param1` *string* - string to clip
  - `param2` *number* - (optional) length to clip the text (default 15)
- Returns
  - *string* - string not longer than the given length

#### date helper functions

##### $getNthWeekdayOfMonth(param1, [param2], [param3], [param4])

- clip a text to a maximum length (adds ... if clipped)

- Parameter
  - `param1` *number* - year to check (4-digit number)
  - `param2` *number* - month to check (0 is January, 11 is December)
  - `param3` *number* - (optional) dayOfWeek to check, Day of week, where 0 is Sunday, 1 Monday ... 6 Saturday (default is 1 - Monday)
  - `param4` *number* - (optional) the nTh Number of the day of week - 0 based (base 0 = last day of month)
- Returns
  - *Date* -weekday of given month

Examples:

- $getNthWeekdayOfMonth(2020, 1, 1, 0) - returns the date of the first Monday in February
- $getNthWeekdayOfMonth(2020, 0, 0, 0) - returns the date of the first Sunday in January
- $getNthWeekdayOfMonth(2020, 0, 3, 2) - returns the date of the Wednesday of the second week in January

##### $getLastDayOfMonth(param1,[param2, [param3])

- clip a text to a maximum length (adds ... if clipped)

- Parameter
  - `param1` *number* - year to check (4-digit number)
  - `param2` *number* - month to check (0 is January, 11 is December)
  - `param3` *number* - (optional) dayOfWeek to check, Day of week, where 0 is Sunday, 1 Monday ... 6 Saturday (default is 1 - Monday)
- Returns
  - *Date* - last day of given month

Examples:

- $getLastDayOfMonth(2020, 1, 1) - returns the date of the last Monday in February
- $getLastDayOfMonth(2020, 0, 0) - returns the date of the last Sunday in January
- $getLastDayOfMonth(2020, 11, 3) - returns the date of the last Wednesday in December

##### $getWeekOfYear(param1)

- for a given date, get the ISO week number

Based on information at:

http://www.merlyn.demon.co.uk/weekcalc.htm#WNR

Algorithm is to find nearest Thursday, it's year is the year of the week number. Then get weeks between that date and the first day of that year.

Note that dates in one year can be weeks of previous or next year, overlap is up to 3 days.

e.g. 2014/12/29 is Monday in week  1 of 2015
     2012/1/1   is Sunday in week 52 of 2011

- Parameter
  - `param1` *number* - (optional) date to get week number (default now)
- Returns
  - *array [number, number]* - ISO week number, [UTCFullYear, weekNumber]

##### $getDayOfYear(param1)

- for a given date, get the day number

- Parameter
  - `param1` *number* - (optional) date to get week number (default now)
- Returns
  - *array [number, number]* - day number, [UTCFullYear, dayNumber]

##### $getStdTimezoneOffset(param1)

- get the standard timezone offset without DST

- Parameter
  - `param1` *number* - (optional) date to get timezone offset (default now)
- Returns
  - *number* - minutes of the timezone offset

##### $isDSTObserved(param1)

- check if a given Date is DST

- Parameter
  - `param1` *number* - (optional) date to check (default now)
- Returns
  - *boolean* - *true* if the given Date has DST

##### $addOffsetToDate(param1, param2, [param3])

- adds an offset to a given Date object

- Parameter
  - `param1` *number, string, Date* - Date where the offset should be added
  - `param2` *number* - the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
  - `param3` *number* - (optional) additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
- Returns
  - *boolean* - *true* if the given Date has DST

#### date parse and format functions

##### $getFormattedDateOut(param1, [param2], [param3], [param4])

- converts a date to a string or any other form

- Parameter
  - `param1` *number, string, Date* - Date where the offset should be added
  - `param2` *string, number* - (optional) format of the date, see above
    - if the parameter is a string, the output will be a string in the defined format. See [output timestamp formats](#output-timestamp-formats) for more information.
    - if the parameter is a number one of the following outputs are possible
      - *-1* outputs an *object*
      - **0** - *number* -  milliseconds since Jan 1, 1970 00:00
      - **1** - *string* -  date as string ECMA-262
      - **2** / **14** - *string* -  date.toUTCString() or date.toLocaleString()
        - utc variant used if `param3` is given with **true**
        - timezone offset for conversation if `param4` is given
      - **3** / **13** - *string* -  date.toLocaleTimeString()
        - utc variant used if `param3` is given with **true**
        - timezone offset for conversation if `param4` is given
      - **12** / **15** - *string* - date.toLocaleDateString()
        - utc variant used if `param3` is given with **true**
        - timezone offset for conversation if `param4` is given
      - **18** - *string* - custom ISO string YYYY-MM-DDTHH:MM:SSZ+00:00
        - utc variant used if `param3` is given with **true**
        - timezone offset for conversation if `param4` is given
      - **4** - *string* - date.toUTCString()
      - **5** - *string* - date.toISOString()
      - **6** - *number* - milliseconds between now and given date
      - **7** - *number* - seconds between now and given date
      - **8** - *number* - minutes between now and given date
      - **9** - *number* - hours between now and given date
      - **10** - *number* - number in the format YYYYMMDDHHMMSS
        - utc variant used if `param3` is given with **true**
      - **11** - *number* - number in the format YYYYMMDD.HHMMSS
        - utc variant used if `param3` is given with **true**
      - **16** - *string* - date in the format *dddd, d.M.* e.g. *Montag, 22.12*
      - **17** - *string* - date in the format *xx, d.M.* e.g. *heute 22.12.,*
      - **19** - *number* - workweek
      - **20** - *boolean* - **true** if workweek is even otherwise **false**
      - **21** - *number* - day of year
      - **22** - *boolean* - **true** if day of year is even otherwise **false**
  - `param3` *boolean* - (optional) indicates if the formatted date should be in utc or not
  - `param4` *boolean* - (optional) timezone offset for conversation in minutes
- Returns
  - *boolean* - *any* the given result

##### $parseDateFromFormat(param1, param2, [param3])

- parses a date string to given format definition

- Parameter
  - `param1` *string, date string to parse
  - `param2` *string, number* - Format definition, if it is a number a predefined format will be try If no multiplier is given, the offset must be in milliseconds.
    - if the parameter is a string, the string defines the format of the string to be able to parse into a date. See [input parse formats](#input-parse-formats) for more information.
    - if the parameter is a number one of the following parsers are active
      - *-1* outputs an *object*
      - **0** -  new Date(Number(date))
      - **1** -  Date.parse(date)
      - **2** -  various - try different Formats, prefer day first like d/M/y (e.g. European format)
      - **3** -  various - try different Formats, prefer month first like M/d/y (e.g. American format)
      - **4** -  number of the format YYYYMMDDHHMMSS
      - **5** -  number of the format YYYYMMDD.HHMMSS
  - `param3` *boolean* - (optional) indicates if the formatted date should be in utc or not
- Returns
  - *boolean* - *true* if the given Date has DST

#### sun functions

##### $getSunTimeByName(param1, [param2], [param3], [param4])

- gets sun time by Name

- Parameter
  - `param1` *string* - name of the sun time
  - `param2` *number* - (optional) the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
  - `param3` *number* - (optional) additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
  - `param4` *number, string, Date* - (optional) date to get the sun time (default now)
- Returns
  - *object* - sun time object

##### $getSunTimePrevNext([param1])

- gets sun time by Name

- Parameter
  - `param1` *number, string, Date* - (optional) date to get the previous an next sun time (default now)
- Returns
  - *object* - previous and next sun time

##### $getSunCalc([param1], [param2], [param3])

- gets sun calculation azimuth, elevation

- Parameter
  - `param1` *number, string, Date* - (optional) date to get the sun data
  - `param2` *boolean* - (optional) set to **true** if sun times should be included in output object
  - `param3` *boolean* - (optional) set to **true** if sun in sky calculation should be included in output object
- Returns
  - *object* - sun calculated data

##### $getSunInSky([param1])

- gets sun in sky percentage value

- Parameter
  - `param1` *number, string, Date* - (optional) date to get the data for
- Returns
  - *number* - sun in sky in percentage

#### moon functions

##### $getMoonTimeByName(param1, [param2], [param3], [param4])

- gets moon time by Name

- Parameter
  - `param1` *string* - **rise** or **set**
  - `param2` *number* - (optional) the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
  - `param3` *number* - (optional) additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
  - `param4` *number, string, Date* - (optional) date to get the moon time (default now)
- Returns
  - *object* - sun time object

##### $getMoonCalc([param1], [param2])

- gets moon calculation azimuth, elevation

- Parameter
  - `param1` *number, string, Date* - (optional) date to get the moon data
  - `param2` *boolean* - (optional) set to **true** if moon times should be included in output object
- Returns
  - *object* - moon calculated data

##### $getMoonIllumination([param1])

- gets moon illumination object

- Parameter
  - `param1` *number, string, Date* - (optional) date to get the data for
- Returns
  - *object* - moon illumination of the given date or for now

##### $getMoonPhase([param1])

- gets moon phase object

- Parameter
  - `param1` *number, string, Date* - (optional) date to get the data for
- Returns
  - *object* - moon phase of the given date or for now
