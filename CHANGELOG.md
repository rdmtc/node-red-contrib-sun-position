# node-red-contrib-sun-position

## Installation

### Install of a specific Version in Node-Red:
 - change to the installation directory of Node-Red
 - enter the command `npm install node-red-contrib-sun-position@2.0.0`

### Install of a specific Version in Redmatic (on a Homematic):
- logon per ssh
- enter the commands in the order:
  - `source /usr/local/addons/redmatic/home/.profile`
  - `cd /usr/local/addons/redmatic/var`
  - `npm install --save --no-package-lock --global-style --save-prefix="~" --production node-red-contrib-sun-position@2.0.0`

### Install of a specific Version in HomeAssistant:
 - go to the Supervisor
 - go to the Node-Red AddOn
 - add unter the `Configuration` in the Node-Red options as `npm_packages`:
```yaml
npm_packages:
  - node-red-contrib-sun-position@2.0.0
```

This can be also used to go back to an older Version.

### 2.2.0-beta: enhancement

- general
  - first implementation of tests with `mocha` and some changes due to the test implementation (inject enhance and delay-until)
    - revised error handling and output messages if the configuration of nodes is not correct (missing config node, missing latitude/longitude).
  - added type checking

- inject enhance (time-inject)
  - added repletely inject with CRON expression
  - added automatic test case
    - basic inject
    - time based inject

- within-time-switch
  - changed state output in case time span is over midnight, because the shown times could be not correct #416
  - added automatic test case
    - basic test for configuration
    - test for message passing is for later

- new Node `delay-until` which allows to delay messages until defined time

- blind-control
  - fix #421
  - added for oversteer blind position the possibility to select msg property, flow or global context #423
    - This has some limitations. Changes would only have effect if the oversteer are evaluated.
  - fix not working oversteer mode limitation #431
  - show rule edit dialog no longer modal to allow usage of JSON and JSONATA editor #432

- time-comp
  - better adjustable of next time, fixes #420
  - preprocessing rules
  - added automatic test case
    - basic test for configuration

### 2.1.1: bug fixes

- clock-timer
  - merged with blind-control

### 2.1.0: bug fixes

- blind-control
  - fix bug of handling not time constrained rules be first to last evaluated

### 2.0.13: bug fixes

- general
  - Fixed bug with string with placeholder, if value is 0 it was replaced with an empty string #400

### 2.0.12: bug fixes

- general
  - Fixed bug with wrong default values for Input type in blind-control and within-time-switch node, added console error in case it occurs again.
  -  additional check for missing position configuration

### 2.0.10: maintenance release

- rerelease, no changed
### 2.0.9: maintenance release

- general
  - code cleanup
  - added string with placeholder as property value for more nodes (time-input, time comp, within-time, time-compare)

- clock-timer
  - `isDisabled` now stored to context as already implemented in blind-control

### 2.0.8: bug fixes

- general, but only used in blind-control + clock-time
  - added node.path (Node-Red 2.2) as possible output configuration, fallback to node.name or node.id if not defined
  - fixed string with placeholder output (string could not be entered)

### 2.0.7: maintenance release

- blind-control + clock-time
  - fixed blind-control example 3 and 4; clock-time example  #388
    - the function node in the example can now simulate different days for testing at the same time on different days #389
  - renamed external given time property from `.dNow` to `.now` to maintain consistency to other nodes
  - nodes can be completely disables and enabled by incoming message (topic must be `enableNode` and `disableNode`) #365

- blind-control
  - after expire of manual override with -1 force to send output #387
  - add possibility to force output to first output when topic contains `forceOutput`
  - add possibility to add offset for the open/close position of the blind in active sun control #371

### 2.0.6: bug fixes

- time-inject fix for next property #364

- within-time-switch fix error with output value #363

- blind-control + clock-time
  - reduced default startup delay to may 1s
  - do output to first output on startup #369

- blind-control
  - implemented `setSunDataFloorLength` #367
  - for an oversteer rule can now be configured if it should be active if the sun is in the window (default as previous) #362

### 2.0.5: bug fixes

- clock-time
  - fix of check if payload and topic has changed to prevent send output on not changed payload/topic to output 1 #360
  - fix of not changeable context store #358

- blind-control
  - fix of not changeable context store #358
  - fix of not working '0' value for `setBlindSettingsTop`, `setBlindSettingsBottom`, `setBlindSettingsIncrement` and `setBlindSettingsLevel` config overwrite possibility #359

### 2.0.4: flow library fix

- no changes, republished 2.0.3 because of node-red flow library missing data

### 2.0.3: small fix + enhancement

- general
  - allow to set context store in configuration node #351
  - fixed randomNumber cached again #302 + #353
  - selectable range for random number #352

- blind-control + clock-time
  - allow to set context store, if not defined using settings from configuration node, otherwise default #351
  - readjusted rules UI, edit buttons only visible on mouse over
  - allows to enable/disable rules #349

### 2.0.1: small fix + enhancement

- general
  - implemented partly #338 + #308
  - fixed randomNumber cached #302
  - implemented randomNumber cached weekly

- blind-control
  - allow to setup a rule which will only overwrite slat #345 or topic
  - enhanced overwrite possibilities for slat. Additional `msg.blindSlat` as message property allowed or if the topic contains __slatOverwrite __ the payload as slat position will be used - partly #346
  - for slat value make a deep clone as this could be any object and an object comparison

- clock-time
  - implement `resetOnSameAsLastValue` and `ignoreSameValue` #341
  - for payload value make a deep clone as this could be any object and perform an an object comparison

- time-comp
  - added next occurrence #339

### 2.0.0: enhancement

⚠ Warning: This Version could break existing flows. Please check your configuration!

🛑 Nodes (especially blind, time-control nodes) that were created or saved with this version do not work in older versions of the package. This affects the export / import of flows and when switching to an older version. It is therefore **essential** to create a **backup** before upgrading to this version!

- general
  - added only even and only odd weeks
  - added css property to moonPhases object an using css from [here](https://github.com/Paul-Reed/weather-icons-lite/blob/master/css_mappings.md)
  - for offset values of a random number a cached value will be used which will be only generated once per day. #302
  - selection of random number is available in more places
  - allow negative altitudePercent #259

- time-inject
  - fixed error if only flow/global context is set #252
  - fixed missing interval multiplier
  - added possibility for inject special values from config menu like default inject node
  - reworked simple interval (only simple interval)
    - added start timestamp
    - added selection for interval of days and weeks #313
    - added possibility to setup interval greater than 24.9 days (2147483647 - 32bit integer limit of NodeJs)

- within-time-switch
  - configurable `msg.payload` of the outgoing message #292

- moon-position
  - moon times will now be has additional property `timesNext` with the values for the times of the next day #307
  - added next moon phase date time #296

- blind-control + clock-time
  - added possibility to copy rules to clipboard and paste rules from clipboard
  - nodes have now always 2 outputs - may breaks existing flows!
    - First output is configurable.
  - redesigned rule conditions, now unlimited conditions could be defined
  - additional nodeID which will be also in the output (if set will override nodeId)
    - added as rule condition operator - usable in subFlows
  - No more messages are sent at the first output if the rule has changed but the payload (level/slat) has remained the same.
    - A message will be sent if the topic has changed.
  - overwrite will be written to node context and restored on recreation - allows overwrite be stable on deploy #300
  - No longer configuration of number of outputs. Node will always have two outputs
    - The message send to the first output will no longer be send on rule change, only on level/payload changes.
    - The message on the first output is fully configurable.
    - A property can be setup to be a string with placeholders. (The same placeholders can be used for the topic.):
      - blind-control
        - `%name%` - name of the node
        - `%id%` - ID of the node
        - `%level%` - level
        - `%levelInverse%` - level, but inverse
        - `%slat%` slat position
        - `%code%` - node.reason.code,
        - `%state%` - node.reason.state,
        - `%description%` - node.reason.description,
        - `%rule%` - ID of the active rule (if rule was active)
        - `%mode%` - current mode
        - `%topic%` - `msg.topic` of the incoming (trigger) message (if available)
        - `%payload%` - `msg.payload` of the incoming (trigger) message (if available)
      - clock-timer
        - `%name%` - name of the node
        - `%id%` - ID of the node
        - `%code%` - node.reason.code
        - `%state%` - node.reason.state
        - `%description%` - node.reason.description
        - `%rule%` - ID of the active rule (if rule was active)
        - `%topic%` - `msg.topic` of the incoming (trigger) message (if available)
        - `%payload%` - `msg.payload` of the incoming (trigger) message (if available)
  - The name of the node (or the id if no name is given in the config) can be configured in the output message - #238
    - this information will be send as `msg.payload.name` to the second output
  - ID of the node can be send
    - this information will be send as `msg.payload.id` to the second output if two outputs are configured
  - blind-control only changes
    - redesigned oversteer, now unlimited oversteer can defined
    - oversteer can be defined only valid for special mode
    - removed minimum altitude settings
      - for functionality the downward compatibility is given by automatic adoption of the setting as new first oversteer, which has the same effect.
      - no longer specific output of the reason (instead of "below the minimum elevation angle" will output "oversteer 1")
    - window settings as typedInput, which allow to use from flow, global context or environment - node can better used in a subFlow
    - per message set mode will be written to node context and to thus this will be stable on deploy
      - needs to delete values of context on change
    - current mode will no longer part of the node label/name, it will be displayed in the node state #321
    - added option to setup a rule which prevents the node to send anything out #280

- *time compare and change* + *time span*
  - fixed parsing of ECMA-262 (simplified ISO8601) Format times (e.g. 2021-05-17T08:45:00.000Z) #250
  - added parsing of full ISO8601 Format (e.g 2019-01-18T00:00:00.000Z, 2019-01-17T17:00:00.000-07:00, 2019-01-18T07:00:00.000+07:00)

### 1.2.4: maintenance + critical bugfix

- time-span
  - fixed bug that second operand displayed wrong in config!
  - fixed critical output bug #240

- blind-control + clock-time
  - added additional information in the output
    - last data which contain data from the last evaluation (when the rules was last time evaluated) - #223
      - for blind-control `msg.blindCtrl.lastEvaluated.sunLevel`, `msg.blindCtrl.lastEvaluated.ruleLevel`, `msg.blindCtrl.lastEvaluated.ruleTopic`, `msg.blindCtrl.lastEvaluated.level`, `msg.blindCtrl.lastEvaluated.ruleId`
      - for clock-time `msg.timeCtrl.lastEvaluated.payload`, `msg.timeCtrl.lastEvaluated.topic`, `msg.timeCtrl.lastEvaluated.ruleId` `msg.timeCtrl.lastEvaluated.ruleTopic`
    - `msg.blindCtrl.name` / `msg.timeCtrl.name` which is the name of the node (or the id if no name is given in the config) - #238
      - this information will be send as `msg.payload.name` to the second output if two outputs are configured
    - `msg.blindCtrl.id` / `msg.timeCtrl.id` which is the id of the node
    - this information will be send as `msg.payload.id` to the second output if two outputs are configured

- blind-control only
  - renamed `msg.resetOnSameValue` to `msg.resetOnSameAsLastValue` parameter to reset existing overwrite if `msg.payload` equals to position (`node.previousData.level`) (#223)
  - added slat position #250
  - in opposite to the mode `maximize sunlight (⛄ Winter)` added the `minimize sunlight (🕶️)` mode #284

### 1.2.3:  BugFix

- within-time-switch
  - fix bug that time limitations does not work #236 upstream of #192)

### 1.2.2:  BugFix

- general
  - internal object property `sunset` renamed to `sunsetEnd` and `sunrise` to `sunriseStart` (#213). This leads into problems with backward compatibilities. In any select box where `sunset` or `sunrise` is selected, it needs to reselect the right time.

- blind-control + clock-time
  - fix that note settings overwrite by message and payload does not working #233
  - fix bug with missing function #223

### 1.2.1:  rework

- general
  - changed several links to documentation #151
  - replaced all remaining png type graphics with svg
  - added examples
  - minor bug fixes (#196, )

- blind-control + clock-time
  - Standardization and consolidation of the same and similar functions #186
    - minor bugs fixed with it (#198, #200)

- blind-control only
  - for Blind control the current used mode as operator (#197)
  - add a `msg.resetOnSameValue` parameter to reset existing overwrite if `msg.payload` equals to position (`node.previousData.level`) (#223)

- time inject
  - fixed bug, that interval between times does not start when load node and time in in the interval #189
  - smaller changes which leads into more options for outgoing data

- time-comp
  - redesign of the output, allows similar to the inject node set multiple properties
    - so the node becomes like a kind of a change node

- time-span
  - redesign of the output similar as time-comp

- within-time-switch
  - allows to have setup the time limitation also by msg, flow, global or env variable. #192

### 1.1.8:  small enhancement

- time inject
  - allow to have a given number of timer events between two times #188
  - small enhancement in node status, shows interval if defined

- blind-control + clock-time
  - allow to change general node settings with incoming message #184

### 1.1.7:  BugFix

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

### 1.1.6:  BugFix

- general
  - reworked JSONATA (preparation is now done on node creation)

### 1.1.5:  BugFix

- general
  - fixed JSONATA are working

### 1.1.4:  BugFix

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

### 1.1.3:  maintenance

only documentation changes

- moved contents of the readme to the wiki

### 1.1.2:  BugFix

- blind-control + clock-time
  - fixed Error `Cannot read property 'timeType' of undefined` #152

### 1.1.1:  BugFix + maintenance

- blind-control + clock-time
  - fixed missing topic from rules #150
  - fixed last until rule will not be evaluated
  - maybe fix of #152

- general
  - for any simple time input added possibility to add time as format `HH:MM UTC` or `HH:MM:SS UTC` to force UTC Format
  - added time calculation by azimuth and elevation (is not fully tested) #148

### 1.1.0:  mayor release

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

### 1.0.17:  small enhancement

- inspired by #132 added for a property the possibility to control by
  - is DST (Daylight saving)
  - week of the year
  - is week of the year even
  - day of the year
  - is day of the year even
With this for example the time-inject could distinguish between using standard or alternate time if Daylight saving or the week of the year is less or below a number.

### 1.0.16:  BugFix

- general
  - fix #119
    - if a positive offset is used the next time was calculated wrong

- blind-control + clock-time
  - fix #128 for blind-control + clock-time
    - with #127 the also overrides with a priority higher than `0` will be expire. The documentation is changed to reflect this.
  - fixed problem that an override can not set as not expiring
  - fixed state text and level output if level-value of -1 is used

### 1.0.15:  BugFix + maintenance

- blind-control + clock-time
  - fixed not visible offset field in rule edit for sun/moon times

- time-Inject, within-time
  - enhanced refresh for tooltip on offset or multiplier change

### 1.0.14:  BugFix

- blind-control + clock-time
  - fixed bug for day of the week (String/integer format)

### 1.0.13:  BugFix

- time-inject
  - fix not visible time input field

- blind-control + clock-time + time-inject + within-time
  - fixed bug where default expire time is not considered #112
  - reduced usage of context for store data

- time-comp / time-span
  - fixed __after first match__ #115

- general
  - i18N

### 1.0.12:  BugFix + enhancement

#### fixes

- general
  - BugFix: Allow 0 as value for any time input, mainly for time-compare or time-span node, but affects potentially all nodes.
  - BugFix: random offset #90 now working as expected
  - BugFix: node error output for time input if time can not be evaluated has missing original message.
  - prepared new Node interval-inject (not finished, not available) - is the same as standard node-red inject node for intervals with start and end of interval able to use sun-times.

#### enhancements

- Blind-control allows now granular settings of topic
- documentation enhanced for clock-timer and general

### 1.0.11:  enhancement

- blind-control + clock-time + time-inject + within-time
  - implement #92 additional date restriction

### 1.0.10:  bug fix

- general
  - next try for #102

- sun-position + moon-position
  - implements #81 - now it is possible to have `msg.latitude` and `msg.longitude` (or `msg.lat` and `msg.lon`) to override settings in configuration node. The configuration Node still needs to be configured properly.

### 1.0.9:  bug fix

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

### 1.0.8:  bug fix

- time-inject
  - fixes that time inject will do a recalculation every 1 ms (Problem can only occurs if the time constraints are used.) #106

- blind-control + clock-time
  - documentation
  - i18n

### 1.0.7:  bug fix

- general
  - added additional caching of sun times calculation to reduce calculation load

- blind-control + clock-time
  - fixed start delay setting causing no output at all
  - i18n, spelling, documentation

### 1.0.6:  bug fix

- general
  - fixed #102 - nodes calculate wrong sun times
    - this happend between midnight - TimezoneOffset to midnight
    - maybe fixes also #98
  - fixed broken rule check for time-span #103

- blind-control + clock-time
  - first implementation of #92 (needs more test)

### 1.0.5:  bug fix

- blind-control + clock-time
  - add start delay setting where a time can be defined where no output

### 1.0.4:  bug fix

- within-time-switch
  - fixed error day selection #100
  - fixed wrong working month selection
- sun-position
  - added `lastUpdateStr` to payload to get the original calculation base time
- moon-position
  - added `lastUpdateStr` to payload to get the original calculation base time

### 1.0.3:  bug fix

- blind-control
  - fixed maximum rules #96

### 1.0.2:  bug fix

- time-comp
  - fixed #93

- general
  - added random offset (not fully tested) #90
  - Improve display of days of the week and months (first try) #91

### 1.0.1:  bug fix

- time-inject
  - fix downward compatibility for older node settings

### 1.0.0: mayor release

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

### 0.5.3 + 0.5.4: BugFix

- general
  - fix for #68

### 0.5.2: BugFix

- general
  - fix for error on getting tooltip #69

### 0.5.1: BugFix and Maintenance Release

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

### 0.5.0: mayor release for blind control

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

### 0.4.10: critical bug fix

- fixed bug #57 with the code prepared for Node-Red 1.0. The recommend way for be backward compatible doesn't work. This is [also](https://discourse.nodered.org/t/knowing-when-a-node-is-done-new-node-api/15737/9) confirmed by @knolleary.

### 0.4.9: small enhancement

- implemented #52 as height of the sun in the sky in percent (0~100 with 100% being at solarnoon and 0% being completely down) - altithudePercent
- fixed bug for #53, no longer send blind position in override mode
- updated dependencies
- more changes for node-red 1.0 (https://nodered.org/blog/2019/09/20/node-done)
- added node-red 0.19.0 as required version

### 0.4.8: Maintenance Release

- update dependencies

### 0.4.7: BugFix Release

- fix problems
  - if time tooltip has wrong format
  - if not initialized
  - on exception get backend data

### 0.4.6: Maintenance Release

- time-comp
  - fixed css for multiselect in node-red Beta
  - added tooltip for time select fields
- time-span
  - added tooltip for time select fields
- enhanced readme and added links to changelog #43

### 0.4.5: Maintenance Release

- time-compare
  - node added option "otherwise"
- time-span
  - node added option "otherwise"
  - fixed error time-span output
- dayOfMonth
  - fixed wrong entry in type edit
- fixed exception on empty date in offset calculation

### 0.4.4: Maintenance Release

- all previous changes
- enhanced Documentation
- redesigned minimum and maximum rule level types again

### 0.4.4-beta: Maintenance Release

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

### 0.4.3: Maintenance Release

- Version was unpublished due to critical Bugs

### 0.4.1 / 0.4.2: Maintenance Release

- Version was unpublished due to critical Bugs

### 0.4.0: Maintenance Release

- i18N for type-input options
- time inject
  - introduces possibility for select if time additional output should be current or next day
- blind control
  - added additional oversteer settings (oversteer3)
  - added minimum delta for changes by sun control
  - added minimum and maximum blind position settings by rule
  - enhanced documentation
- start of changelog

### 0.3.4: Maintenance Release

- blind control
  - added additional oversteer settings (oversteer2)
  - enhanced documentation
- fixed links in documentation

### 0.3.3: Maintenance Release

- preparations for node-red 1.0
- fixed UTC time compare problem in blind-control
- enhanced config for own state time output format

### 0.3.2: Maintenance Release

- prepared for own timezone settings
- added configuration for own state time output format
- added custom ISO output format
- some preparations for node-red 1.0
