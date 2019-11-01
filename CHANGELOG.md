# node-red-contrib-sun-position

#### 0.5.0-alpha: mayor release for blind control

- configuration
  - switched latitude and longitude and added openstreetmap link/map for the position to prevent issues caused by latitude and longitude (maybe cause of #55)
  - added german translation for latitude and longitude

- time inject
  - added output of week number to enhanced date output
  - enhanced name output for enhanced date output

- sun-position
  - fixed #52 bug with implementation
    - added `positionAtSolarNoon` as additional payload property with the position data of the sun at solar noon
  - fixed problem with msg.ts not considered as used timestamp

- moon-position
  - fixed problem with msg.ts not considered as used timestamp

- blind control
  - fixed #61 by removing misleading angle
  - fixed #62 `setMode` can now deactivate sun control
  - added `resetOverwrite` additional property #54
  - add possibility to have a exact priority comparisons (e.g. only reset a specific priority)
  - redesigned rule input by dialog
  - removed previous reset option for level operator, will now be done by new special level type
  - added new type of Level: NotDefined, where for absolute rules default or sunControl will be used and for min/max the rule will be reset.
    - This will allow to have only one type of time rules (until/from) which could cover whole day.
    - Hopefully this makes rules easier.
  - added per rule two different times and two different conditions
    - allows to define more scenarios
    - allows to reduce amount of needed rules.
  - change in the logic of rule execution: From rules within Until rules will now considered.
    - change will have no affect if rule setup is equal to the examples, that time restricted rules separated in first only until and afterwards only from rules

TODO: rework Documentation, pictures, examples


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
