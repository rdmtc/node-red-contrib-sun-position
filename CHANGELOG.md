#### 0.4.6: Maintenance Release

- fixed css for multiselect
- time-comp added tooltip for time select fields
- time-span added tooltip for time select fields

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
