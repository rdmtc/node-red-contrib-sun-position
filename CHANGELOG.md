# node-red-contrib-sun-position


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
 - adde start delay setting where a time can be defined where no output


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
