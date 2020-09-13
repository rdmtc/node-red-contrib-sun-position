# node-red-contrib-sun-position

#### 1.1.8:  small enhancement

- time inject
  - allow to have a given number of timer events between two times #188
  - small enhancement in node status, shows interval if defined

- blind-control + clock-time
  - allow to change general node settings with incoming message #184


#### 1.1.7:  BugFix

- general
  - replaced some png type graphics with svg

- time inject
  - fix missing data property name. #185
  - fix not working offset #181 #182

- blind-control + clock-time
  - prevent irrelevant error when no rule with time constraint exists. #180
  - fix that autotrigger time from configuration is not used #186

- clock-time
  - fix that overrides with value false or 0 does not work #186

#### 1.1.6:  BugFix

- general
  - reworked JSONATA (preparation is now done on node creation)

#### 1.1.5:  BugFix

- general
  - fixed JSONATA are working

#### 1.1.4:  BugFix

- general
  - for a property compare implemented `contain`, `containSome` and `comtainAll` #158

- time inject
  - maybe fix of #159 by better memory cleanup on change
  - added possibility of define which time should be in payload (current or next) #163
  - now setup of payload, topic and additional payload is similar to the inject node of th newest Node-Red Version #172
  - time-inject label wrong #176

- within-time
  - fix bug not usable/visible offset for alternate times #170
  - added `withinTimeStart` and `withinTimeEnd` and `withinTime` property to message #156 + #166

- moon-position
  - moon-times now available #161
  - has now a `isUp` _Boolean_ property which gives the state if the moon is Up #162
  - additional properties are `positionAtRise` and `positionAtSet` with position information on rise and set

- clock-time
  - fixed not working overrides #171
  - fixed not existing blindCtrl property

- blind-control + clock-time
  - first implementation of allow override expire by rules #173 (not fully tested)

#### 1.1.3:  maintenance

only documentation changes

- moved contents of the readme to the wiki

#### 1.1.2:  BugFix

- blind-control + clock-time
  - fixed Error `Cannot read property 'timeType' of undefined` #152

#### 1.1.1:  BugFix + maintenance

- blind-control + clock-time
  - fixed missing topic from rules #150
  - fixed last until rule will not be evaluated
  - maybe fix of #152

- general
  - for any simple time input added possibility to add time as format `HH:MM UTC` or `HH:MM:SS UTC` to force UTC Format
  - added time calculation by azimuth and elevation (is not fully tested) #148

#### 1.1.0:  mayor release

- time-inject
  - added possibility for interval inject #135
  - added warning sign if node needs to be opened, saved and deployed
- blind-control + clock-time
  - fixed and/Or condition of rule conditions #138
  - renamed priority for Overrides to importance
  - implemented importance for rules #137
  - fixed rules "priority" execution #139
  - enhanced autoTrigger rule selection #143
- within-time
  - fixed month limitation #141
  - Removed options for message resend!
  - Removed initial calculation trigger
  - fixed `internal error` if a time could not evaluated into better error
- time-comp
  - fixed out value, if context store or any special message object
- removed interval-inject --> has moved to time-inject

I a Node has a warning sign on the label the node needs to be opened, saved and deployed to fix the label:
![warning sign](https://user-images.githubusercontent.com/12692680/81336350-7977f980-90a9-11ea-8d14-fa412b83fe45.png)

#### 1.0.17:  small enhancement

- inspired by #132 added for a property the possibility to control by
  - is DST (Daylight saving)
  - week of the year
  - is week of the year even
  - day of the year
  - is day of the year even
With this for example the time-inject could distinguish between using standard or alternate time if Daylight saving or the week of the year is less or below a number.

#### 1.0.16:  BugFix

- general
  - fix #119
    - if a positive offset is used the next time was calculated wrong

- blind-control + clock-time
  - fix #128 for blind-control + clock-time
    - with #127 the also overrides with a priority higher than `0` will be expire. The documentation is changed to reflect this.
  - fixed problem that an override can not set as not expiring
  - fixed state text and level output if level-value of -1 is used

#### 1.0.15:  BugFix + maintenance

- blind-control + clock-time
  - fixed not visible offset field in rule edit for sun/moon times

- time-Inject, within-time
  - enhanced refresh for tooltip on offset or multiplier change

#### 1.0.14:  BugFix

- blind-control + clock-time
  - fixed bug for day of the week (String/integer format)

#### 1.0.13:  BugFix

- time-inject
  - fix not visible time input field

- blind-control + clock-time + time-inject + within-time
  - fixed bug where default expire time is not considered #112
  - reduced usage of context for store data

- time-comp / time-span
  - fixed __after first match__ #115

- general
  - i18N

#### 1.0.12:  BugFix + enhancement

##### fixes

- general
  - BugFix: Allow 0 as value for any time input, mainly for time-compare or time-span node, but affects potentially all nodes.
  - BugFix: random offset #90 now working as expected
  - BugFix: node error output for time input if time can not be evaluated has missing original message.
  - prepared new Node interval-inject (not finished, not available) - is the same as standard node-red inject node for intervals with start and end of interval able to use sun-times.

##### enhancements

- Blind-control allows now granular settings of topic
- documentation enhanced for clock-timer and general

#### 1.0.11:  enhancement

- blind-control + clock-time + time-inject + within-time
  - implement #92 additional date restriction

#### 1.0.10:  bug fix

- general
  - next try for #102

- sun-position + moon-position
  - implements #81 - now it is possible to have `msg.latitude` and `msg.longitude` (or `msg.lat` and `msg.lon`) to override settings in configuration node. The configuration Node still needs to be configured properly.

#### 1.0.9:  bug fix

- general
  - fixed #102 again - massive changes in the library with cleanup lot of functions
  - fixed and reworked caching of calculated sunTimes, MoonTimes

- blind-control + clock-time
  - documentation
  - if in startup delay, the reason code is set to `NaN` and node state, reason description stated that node is in startup
  - after startup delay ended default output will be send (due to reason code change)

- clock-time
  - additional to reason or rule change, the payload will also output on these changes
    - if type of payload has changed
    - if payload is of type `string`, `number` or `boolean` and value of the payload has changed
      - changes on `arrays`, `objects` will not detected

#### 1.0.8:  bug fix

- time-inject
  - fixes that time inject will do a recalculation every 1 ms (Problem can only occurs if the time constraints are used.) #106

- blind-control + clock-time
  - documentation
  - i18n

#### 1.0.7:  bug fix

- general
  - added additional caching of sun times calculation to reduce calculation load

- blind-control + clock-time
  - fixed start delay setting causing no output at all
  - i18n, spelling, documentation

#### 1.0.6:  bug fix

- general
  - fixed #102 - nodes calculate wrong sun times
    - this happend between midnight - TimezoneOffset to midnight
    - maybe fixes also #98
  - fixed broken rule check for time-span #103

- blind-control + clock-time
  - first implementation of #92 (needs more test)

#### 1.0.5:  bug fix

- blind-control + clock-time
  - add start delay setting where a time can be defined where no output

#### 1.0.4:  bug fix

- within-time-switch
  - fixed error day selection #100
  - fixed wrong working month selection
- sun-position
  - added `lastUpdateStr` to payload to get the original calculation base time
- moon-position
  - added `lastUpdateStr` to payload to get the original calculation base time

#### 1.0.3:  bug fix

- blind-control
  - fixed maximum rules #96

#### 1.0.2:  bug fix

- time-comp
  - fixed #93

- general
  - added random offset (not fully tested) #90
  - Improve display of days of the week and months (first try) #91

#### 1.0.1:  bug fix

- time-inject
  - fix downward compatibility for older node settings

#### 1.0.0: mayor release

- new Node: clock-time
  - This is a simplified blind-control node, with only time rules and any payload.
  - it is ideal for dimmers, Christmas lights, ...
- time-inject
  - added month selection
  - added even/odd day selection
- within-time
  - added day selection
  - added month selection
  - added even/odd day selection
- blind control
  - added possibility to limit rules for several days
  - added validation of rules (shows a hint if a rule in invalid)
  - added day selection to rules
  - added month selection to rules
  - added even/odd day selection for rules
  - added auto Trigger capability
- general
  - added on several settings the possibility to use payload if the topic of an incoming message contains special value.
  - fixed smaller problems

- The big jump in the version number is not only due to the amount change, but rather otherwise.
  - The Version starting with 1... will show that this node is tested and working with Node-Red above 1...
  - After this release, no major changes are planned in the next time and the node is for the time being feature complete. This fits a version number 1.. better than 0..

#### 0.5.3 + 0.5.4: BugFix

- general
  - fix for #68

#### 0.5.2: BugFix

- general
  - fix for error on getting tooltip #69

#### 0.5.1: BugFix and Maintenance Release

- general
  - fix for week number calculation when in daylight saving #65
  - if time output as object the week is now an extra object with properties
    - iso *array* `[year, week]`
    - week *number* week number
    - year *number* full year
    - even *boolean* is true if week is even
- blind control
  - fix for #66 if the blind not uses values between 0 and 1
  - fix for #67 mixed earliest and latest settings
  - enhanced output of the rules
  - change logic of rule execution: From rules within Until rules will now considered.
    - change should have no affect if rule setup is equal to the examples, that time restricted rules separated in first only until and afterwards only from rules

#### 0.5.0: mayor release for blind control

- configuration
  - switched latitude and longitude and added openstreetmap link/map for the position to prevent issues caused by latitude and longitude (maybe cause of #55)
  - added german translation for latitude and longitude

- time inject
  - added output of week number to enhanced date output
  - enhanced name output for enhanced date output

- sun-position
  - fixed #52 bug with implementation
    - added `positionAtSolarNoon` as additional payload property with the position data of the sun at solar noon
  - fixed problem with `msg.ts` not considered as used timestamp

- moon-position
  - fixed problem with `msg.ts` not considered as used timestamp

- blind control
  - fixed #61 by removing misleading angle
  - fixed #62 `setMode` can now deactivate sun control
  - added `resetOverwrite` additional property #54
  - add possibility to have a exact priority comparisons (e.g. only reset a specific priority)
  - redesigned rule input by dialog
  - removed previous reset option for level operator, will now be done by new special level type
  - added new type of Level: `NotDefined`, where for absolute rules default or sunControl will be used and for min/max the rule will be reset.
    - This will allow to have only one type of time rules (until/from) which could cover whole day.
    - Hopefully this makes rules easier.
  - added per rule two different times and two different conditions
    - allows to define more scenarios
    - allows to reduce amount of needed rules.

#### 0.4.10: critical bug fix

- fixed bug #57 with the code prepared for Node-Red 1.0. The recommend way for be backward compatible doesn't work. This is [also](https://discourse.nodered.org/t/knowing-when-a-node-is-done-new-node-api/15737/9) confirmed by @knolleary.

#### 0.4.9: small enhancement

- implemented #52 as height of the sun in the sky in percent (0~100 with 100% being at solarnoon and 0% being completely down) - altithudePercent
- fixed bug for #53, no longer send blind position in override mode
- updated dependencies
- more changes for node-red 1.0 (https://nodered.org/blog/2019/09/20/node-done)
- added node-red 0.19.0 as required version

#### 0.4.8: Maintenance Release

- update dependencies

#### 0.4.7: BugFix Release

- fix problems
  - if time tooltip has wrong format
  - if not initialized
  - on exception get backend data

#### 0.4.6: Maintenance Release

- time-comp
  - fixed css for multiselect in node-red Beta
  - added tooltip for time select fields
- time-span
  - added tooltip for time select fields
- enhanced readme and added links to changelog #43

#### 0.4.5: Maintenance Release

- time-compare
  - node added option "otherwise"
- time-span
  - node added option "otherwise"
  - fixed error time-span output
- dayOfMonth
  - fixed wrong entry in type edit
- fixed exception on empty date in offset calculation

#### 0.4.4: Maintenance Release

- all previous changes
- enhanced Documentation
- redesigned minimum and maximum rule level types again

#### 0.4.4-beta: Maintenance Release

- fixed critical problem in sun - calculating Julian cycle which leads into wrong sun times if it is calculated at certain times
  - [#37](https://github.com/rdmtc/node-red-contrib-sun-position/issues/37)
  - [#39](https://github.com/rdmtc/node-red-contrib-sun-position/issues/39)
- fixed problems on RedMatic call of getBackendData
  - tooltip with resolved time on typeInput now also available in RedMatic
- i18N reworked
  - for compares using mathematical signs for equal, unequal, greater than, less than
  - added more Unicode symbols
- added direct moon phase output
- added compare to current moon phase for conditions
- blind control
  - fixed error on empty ruleset
  - add clear button for rules
  - add sort button  in UI editor
  - reworked minimum/maximum blind position settings by rule, enhanced in documentation
    - addresses [#36](https://github.com/rdmtc/node-red-contrib-sun-position/issues/36)
- enhanced documentation
  - fix [#31](https://github.com/rdmtc/node-red-contrib-sun-position/issues/31)
  - fix [#33](https://github.com/rdmtc/node-red-contrib-sun-position/issues/33)
- added possibility for inverted open / close settings [#40](https://github.com/rdmtc/node-red-contrib-sun-position/issues/40)
- changed lot of internal
  - cleanup procedures
  - fixed problems with test function [#32](https://github.com/rdmtc/node-red-contrib-sun-position/issues/32)
  - optimized code to ES6 possibilities
  - changed esLint rules to be more restrictive
  - fixed a lot of wrong usages of arrow function for data validation
- optimized access to backend services
- changed lot of UTC time compare problems [#34](https://github.com/rdmtc/node-red-contrib-sun-position/issues/34)

#### 0.4.3: Maintenance Release

- Version was unpublished due to critical Bugs

#### 0.4.1 / 0.4.2: Maintenance Release

- Version was unpublished due to critical Bugs

#### 0.4.0: Maintenance Release

- i18N for type-input options
- time inject
  - introduces possibility for select if time additional output should be current or next day
- blind control
  - added additional oversteer settings (oversteer3)
  - added minimum delta for changes by sun control
  - added minimum and maximum blind position settings by rule
  - enhanced documentation
- start of changelog

#### 0.3.4: Maintenance Release

- blind control
  - added additional oversteer settings (oversteer2)
  - enhanced documentation
- fixed links in documentation

#### 0.3.3: Maintenance Release

- preparations for node-red 1.0
- fixed UTC time compare problem in blind-control
- enhanced config for own state time output format

#### 0.3.2: Maintenance Release

- prepared for own timezone settings
- added configuration for own state time output format
- added custom ISO output format
- some preparations for node-red 1.0
