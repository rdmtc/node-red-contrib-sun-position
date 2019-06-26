# Blind Controller

## blind-control

Used to control a blind with many possibilities. This can be time-dependent and it can calculate the blind position based on the current position of the sun to limit the sun light To limit the sunlight on the floor of a window.

![blind-control](images/appearance2.png?raw=true)

### Table of contents

* [Blind Controller](#Blind-Controller)
  * [blind-control](#blind-control)
    * [Table of contents](#Table-of-contents)
    * [The node](#The-node)
    * [Node settings](#Node-settings)
      * [general settings](#general-settings)
      * [blind settings](#blind-settings)
      * [rule settings](#rule-settings)
      * [overwrite settings](#overwrite-settings)
      * [sun settings](#sun-settings)
        * [maximize sunlight (Winter)](#maximize-sunlight-Winter)
        * [restrict sunlight (Summer)](#restrict-sunlight-Summer)
        * [sun position settings](#sun-position-settings)
    * [Node Input](#Node-Input)
    * [Node Output](#Node-Output)
    * [Node Status](#Node-Status)
  * [rules](#rules)
    * [rules example](#rules-example)
  * [Samples](#Samples)
    * [testing rules and overrides](#testing-rules-and-overrides)
  * [Additional FAQ](#Additional-FAQ)
    * [Why is there no multi blind controller? (FAQ)](#Why-is-there-no-multi-blind-controller-FAQ)
    * [How to define a Temperature Overwrite? (FAQ)](#How-to-define-a-Temperature-Overwrite-FAQ)
    * [How do I achieve that when opening a window the blind opens? (FAQ)](#How-do-I-achieve-that-when-opening-a-window-the-blind-opens-FAQ)
  * [Other](#Other)

### The node

Thanks a lot [alisdairjsmyth](https://github.com/alisdairjsmyth) with its node [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller). To be able to use the node [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller), a lot of functions around the node would have been necessary. As a result, I landed at a new node. So this node originated in the style of [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller) but internally has become a complete new development. I did not make the decision easy as to whether this node should be developed as a standalone node or as part of that node collection. The decisive factor was that this node uses many of the existing functions of that node collection.

Depending on the use case, this node may be the more appropriate one or the node [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller). The differences from this node to [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller) are:

* The output at the [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller) node is different to that node.
  * The node is designed to determine the degree of opening, so the higher number is open and the lower number is closed.
  * There is a `blindCtrl.blind.levelInverse` output who will have the inverse value if needed.
  * The levels can be integer or floating point numbers. It is depending on the configuration of Open-level, closed-level and increment. This means the node can be configured to have 100=open, 0=closed with an increment of 1, but also 1=open, 0=closed with an increment of 0.01.
* This node is very flexible where information comes to the blind controller. So these do not always have to be part of the msg object, but can also come from environment variables or contexts.
* This node has the possibility for manual override with different priority. This can be used to differentiate between manual operation, fire alarm, window knob handle, etc. ...
* Various conditions for the absolute position are selectable, which unfortunately does not make the configuration easy. An example is if in the morning the blind should open depending on the position of the sun, but at the earliest at a defined time, which must be different between week and weekend.

### Node settings

#### general settings

![blind-control-settings-1](https://user-images.githubusercontent.com/12692680/57134454-8c753100-6da6-11e9-95e9-bdff86f1e3d4.png)

* **Position Konfiguration** connects to the central configuration node, which contains the current position, but also handles a lot of internal shared functions. Thus, this configuration is always needed, even if the sense does not always open up.
* **topic** if defined, the topic of any outgoing message will be set to this value, otherwise the topic of the ingoing message will not changed
* **name** the name of the node

#### blind settings

![blind-control-settings-2](https://user-images.githubusercontent.com/12692680/57134458-8d0dc780-6da6-11e9-80c3-2d8e130bd8fb.png)

* **Increment** defines the minimum degree the blind position can be controlled
* **open position** The value for maximum open degree of a blind.
* **closed position** The value for minimum close degree of a blind.

All values could be floating point values.

#### rule settings

![blind-control-settings-3](https://user-images.githubusercontent.com/12692680/57134461-8d0dc780-6da6-11e9-8235-a5bd141fef99.png)

* **default position** The value which will be used if no other value given by condition, time or sun applies.

![blind-control-settings-4](https://user-images.githubusercontent.com/12692680/59666684-9d8ecb80-91b5-11e9-8ea6-ddbe2293988b.png)

* If a rule with a absolute blind position applies, the blind position defined by the rule will be used.
  * sun control will then not be active
* If a rule has a condition, the rule only applies if the condition matches.
  * For some conditions a comparisons needs to be defined.
  * If the values of comparison comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages.
* If a rule has a time limitation
  * `until` the first rule is taken, where the given time is greater than the current time.
  * `from` the last rule is taken, where the given time is less than the current time.

* For some time definitions an Offset could be added (or be reduced with a negative value)
* If for the blind position a value from a message object and the value can not be determined the defined default blind position will be used.

#### overwrite settings

![blind-control-settings-5](https://user-images.githubusercontent.com/12692680/57134465-8d0dc780-6da6-11e9-97a6-8f3b61ed2de9.png)

* **expire** the duration in minutes a manual setting will remain is place. If not defined, there will be no default expiring of overrides.

![blind-control-settings-6](https://user-images.githubusercontent.com/12692680/57134466-8da65e00-6da6-11e9-84d2-425ca0be5e3d.png)

#### sun settings

Sun control is only active if no override and no rule with an absolute blind position applies!

If sun-control checkbox is not checked, the defined **default position** will be used.

The sun control (maximize or restrict sunlight) is only active, if no other rule (with an absolute blind position) or override matches.

* Requirements that should be valid with a higher priority should be set up as rules.
  * Example: if the blind should set to a level if a temperature threshold exceeded, this could be setup as rule

##### maximize sunlight (Winter)

![image](https://user-images.githubusercontent.com/12692680/59666961-34f41e80-91b6-11e9-8ad0-958a650565d1.png)

In this mode if no override and no rule with an absolute blind position matches:

* If the sun is *not* in the window the blind will set to defined **min position**. (oversteer will be ignored)
* If the sun is in the window
  * If any oversteer data are setup and oversteer conditions are fulfilled the blind will set to the defined oversteer blind position.
  * otherwise the blind level is set to defined **max position**.

##### restrict sunlight (Summer)

![image](https://user-images.githubusercontent.com/12692680/59667118-797fba00-91b6-11e9-9b7f-5837c7fd4a29.png)

In this mode if no override and no rule with an absolute blind position matches, the node calculates the appropriate blind position to restrict the amount of direct sunlight entering the room.

This calculation includes:

* Determination of whether direct sunlight is entering the room based on the orientation of the blind and the azimuth of the sun
* Dimensions of the window and the current altitude of the sun.
* consideration of weather conditions against defined thresholds

##### sun position settings

* **start** The azimuth (in degree) of the sun, when the sun start falls into the window.
* **end** The azimuth (in degree) of the sun, when the sun no longer falls into the window.

![sun-azimuth2](https://user-images.githubusercontent.com/12692680/57704950-2f5d6300-7663-11e9-9ce1-4f90bbf3eed6.png)

under the simplest assumption starting from the bearing representing the perpendicular of the window to geographical north:

* start = orientation - 90 degree
* end = orientation + 90 degree

![sun-bottom-top](https://user-images.githubusercontent.com/12692680/57705862-ee664e00-7664-11e9-9e73-1306ffd2a6f8.png)

* The units of length is measure agnostic, They must be all in the same unit, but it does not matter which unit is used. If as lengths are used meter all lengths must be in meter. If used centimeters, all must be in centimeter.
* **top** Measurement from the floor to top of the window covered by the blind.
* **bottom** Measurement from the floor to bottom of the window covered by the blind.
* **length on the floor** (optional) the extent to which direct sunlight is to be allowed into the room through the window, defined as a length on the floor.
* **min altitude threshold** (optional) minimum altitude (in degree) of the sun for determination of blind position.
* **min position** minimum blind position if the sun is in the window. The blind will not close more than this minimum value, even if the calculated value results in a lower position.
* **max position** maximum blind position if the sun is in the window. The blind will not open more than this maximum value, even if the calculated value results in a higher position.

![blind-control-settings-8](https://user-images.githubusercontent.com/12692680/57453633-2df8f880-7267-11e9-85be-721ca916d2b1.png)

![blind-control-settings-9](https://user-images.githubusercontent.com/12692680/57453639-30f3e900-7267-11e9-9fbe-6688d075b988.png)

* **oversteer**, **oversteer Operator**, **Threshold** allows to define a blind position which should be used in a given [condition](README.md#conditions) to be used instead of the calculated value by the sun. Typical use-case is a weather condition but it is not limited to that.
  * the value for **Threshold** can only be entered if needed by selected **operator**
  * Example: If the **oversteer** is a property which contains a numerical value representing the percentage of sky occluded by clouds and an operator *greater than or equal* is used with a **Threshold** a numerical value representing the maximum percentage of sky occluded by clouds. Then if the **oversteer** value exceeds the **Threshold** the **blind position** will be used instead of the position calculated by the sun.
  * If the values of **oversteer** or **Threshold** comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages.
  * **blind position** the blind position which should be used instead of the calculated value by the sun if the defined expression for **oversteer** with **operator** (and maybe **Threshold**) is **true**.
  * can be used for overrides of sunPosition calculation by weather, cloud, temperature, UV-index, ... conditions
* **oversteer2**, **oversteer2 Operator**, **Threshold** equal to **oversteer**, but an additional oversteer possibility. Lower priority than **oversteer**
* **oversteer3**, **oversteer3 Operator**, **Threshold** equal to **oversteer** and **oversteer2**, but an additional oversteer possibility. Lower priority than **oversteer2**

### Node Input

The Input is for triggering the calculation and for setting overwrites of the blind position.

* **reset** an incoming message with `msg.reset` is `true` or `msg.payload.reset` is `true` or where the `msg.topic` contains `resetOverwrite` and the value of `msg.payload` = `true` will reset any existing overrides.
  * **priority** (optional) when a priority is given the existing override will only reset if the priority of the message is equal or higher then the priority of the existing override. The message priority can be defined by
    * a property `msg.prio`, `msg.payload.prio`, `msg.priority` or `msg.payload.priority` with a valid numeric value
    * or when the `msg.topic` contains `prio` or `alarm` and the value of `msg.payload` is a valid numeric value
    * a higher number is a higher priority. So prio 1 is the lowest priority
* **position** an incoming message with a numeric property of `msg.blindPosition`, `msg.position`, `msg.level`, `msg.blindLevel`,  `msg.payload.blindPosition`, `msg.payload.position`, `msg.payload.level`, `msg.payload.blindLevel` or where the  `msg.topic` contains `manual` or `levelOverwrite` and the value of `msg.payload` is a numeric value will override any of rule/sun/.. based level of the blind.
  * If an override is already active a new message changes the blind level if the **priority** of the existing override allows this.
    * The override could also limited if  a property `msg.ignoreSameValue`, `msg.payload.ignoreSameValue` is set to true an existing override will only be changed if the position value differs from the active override position.
  * Except `-1` the position must be a valid blind Position as defined in the node settings or otherwise it will throw an error.
  * The **position** of the special value of `-1` will set the node in override mode without sending any message out until override **position** is changed, override is **expired** or **reset**.
    * Example: This could be useful if a blind is controlled by an external button, where not known the blind position after button press. In this case the Button-event can used to trigger the override-mode of the node without knowing the real **position** of the blind.
* **priority** (optional) Enables to handles overrides of different priorities. Default value will be `0`.
  * A message property `msg.prio`, `msg.payload.prio`, `msg.priority` or `msg.payload.priority` with a valid numeric value
  * or when the `msg.topic` contains `prio` or `alarm` and the value of `msg.payload` is a valid numeric value
  * A `boolean` value `true` is considered as numeric `1`
  * a higher number is a higher priority. So prio 1 is the lowest priority
* **expire** (optional) Enables to define an override as automatically expiring. As default value for overrides of priority `0` the value in the settings is be used. Overrides with a priority higher than `0` will not expire by default.
  * A message property `msg.expire` or `msg.payload.expire`
  * or when the `msg.topic` contains `expire` and the value of `msg.payload` is a valid numeric value
  * The value must be a time in milliseconds which is greater than 100. Otherwise the override will be set to not expiring.
  * If an override is already active a new message with **expire** can change the existing expire behavior if the **priority** of the existing override allows this.

Useful to know:

* If a **reset** and a new override is set in the same message, any existing override will be reset and the new will be set afterwards. In this scenario no existing override **priority** will be considered.
* An already existing Override can only be changed if the prio of the existing is `0` (default - can always be changed) or the message object has a **priority** set with a value that is equal or greater than the existing override. If that is given the **expire**, **priority** or **position** can be changed.
* There are a special configuration for rules with a condition, with which it can be prevented to allow overrides.
* an incoming message with `msg.mode`, `msg.payload.mode` or where the `msg.topic` contains `setMode` and the value of `msg.payload` is a valid number, will allow to set the mode of the sun control.
  * a value of `0` will deactivate sun control, `1` will set to maximize sunlight (Winter) and `2` will set to restrict sunlight (Summer).
  * The maximum adjustable mode is influenced by the settings of the node. The mode can not be set to restrict sunlight (`2`) if in the settings is setup only maximize sunlight (`1`).

### Node Output

In then enhanced option are configurable if the node has one single (default) or two outputs.

An output can be triggered by an incoming message or by an expiring timeout from an override. If the trigger is a incoming message, the incoming message will be forwarded to the first output if the blind position has changed.

The incoming message is changed as following:

* `msg.topic` if a topic is defined this topic will be used, otherwise no change of the topic from the incoming message
* `msg.payload` the payload will be set to the new blind level (numeric value)

If the output is set to single, an object property `msg.blindCtrl` will be attached to the message and forwarded to the first output.
If the node is configured with two outputs this object is set as the `msg.payload` property of the message that is send to the second output. The difference is also, that the second output will give this object every time a recalculation will is triggered, where the first output only send a message on blind position change.

* `blindCtrl` a object will be added add as `msg.blindCtrl` property on single output mode or send as `msg.payload` on slit output mode with the following properties:
  * `blindCtrl.reason` object for the reason of the current blind position
    * `blindCtrl.reason.code` a number representing the reason for the blind position. The possible codes are
      * **1** - defined default blind position, because no other rule/condition/behavior
      * **2** - manual override
      * **3** - manual override - expiring
      * **4** - based blind position based by rule
      * **5** - calculated blind position by sun control is below defined minimum blind position (minimum blind position used)
      * **6** - calculated blind position by sun control is above defined maximum blind position (maximum blind position used)
      * **7** - Sun below altitude threshold
      * **8** - Sun is not in window, default blind position is used
      * **9** - blind position calculated by sun position
      * **10** - defined oversteer condition applies
      * **11** - (enhanced settings) blind position calculated by sun position was not used caused by smooth settings
      * **12** - sun is in window (maximize mode), max blind position used
      * **13** - sun is not in window (maximize mode), min blind position used
      * **14** - change is below defined minimum delta
      * **15** - blind position is below defined minimum blind position by rule
      * **16** - blind position is above defined maximum blind position by rule
    * `blindCtrl.reason.state` a short text (same as node status text) representing the reason for the blind position
    * `blindCtrl.reason.description` a text, describe the reason for the blind position
  * `blindCtrl.blind` a object containing all blind settings, only the most interesting ones are explained here
    * `blindCtrl.blind.level` - the new blind level (numeric value) - equal to `msg.payload` of the first output message.
    * `blindCtrl.blind.levelInverse` - if `blindCtrl.blind.overwrite.active` is true, the value of `blindCtrl.blind.levelInverse` will be equal to the value of `blindCtrl.blind.level`, otherwise it will be the inverse to `blindCtrl.blind.level`. This means if `blindCtrl.blind.level` indicates how much the blind is open, then `blindCtrl.blind.levelInverse` indicates how much the blind is closed. So if `blindCtrl.blind.level` is equal to **min position**, `blindCtrl.blind.levelInverse` will be **max position**.
    * `blindCtrl.blind.overwrite`
      * `blindCtrl.blind.overwrite.active` - is `true` when overwrite is active, otherwise `false`
      * `blindCtrl.blind.overwrite.priority` - the priority of the override
      * `blindCtrl.blind.overwrite.expires` -  is `true` when overwrite expires [exists only if overwrite active]
      * `blindCtrl.blind.overwrite.expireTs` - a timestamp (UNIX) when overwrite expiring [exists only if overwrite expires]
      * `blindCtrl.blind.overwrite.expireDate` - a timestamp (String) when overwrite expiring [exists only if overwrite expires]
  * `blindCtrl.rule` - exists only if no override is active
    * `blindCtrl.rule.active` - `true` if a rule applies
    * `blindCtrl.rule.id` - number of the rule who applies (is `-1` if no rule has applied)
    * `blindCtrl.rule.level` - the blind level defined by the rule if level type is __absolute__, otherwise the defined default blind position [exists only if a rule applies]
    * `blindCtrl.rule.conditional` - `true` if the rule has a condition [exists only if a rule applies]
    * `blindCtrl.rule.timeLimited` - `true` if the rule has a time [exists only if a rule applies]
    * `blindCtrl.rule.conditon` - __object__ with additional data about the condition [exists only if `blindCtrl.rule.conditional` is true] - good for debugging purpose
    * `blindCtrl.rule.time` - __object__ with additional data about the time [exists only if `blindCtrl.rule.timeLimited` is true] - good for debugging purpose
    * `blindCtrl.rule.hasMinimum` - is __true__ if to the level of the rule an additional __minimum__ rule will be active, otherwise __false__
    * `blindCtrl.rule.levelMinimum` - exists only if `blindCtrl.rule.hasMinimum` is __true__ and then contains then the blind level defined by the rule
    * `blindCtrl.rule.hasMaximum` - is __true__ if  to the level of the rule an additional __maximum__ rule will be active, otherwise __false__
    * `blindCtrl.rule.levelMinimum` - exists only if `blindCtrl.rule.hasMaximum` is __true__ and then contains then the blind level defined by the rule
  * `blindCtrl.sunPosition` - calculated sub-position data - exists only if sun position is calculated
    * `blindCtrl.sunPosition.InWindow` - `true` if sun is in window, otherwise `false`
    * `blindCtrl.sunPosition.oversteer` - object containing the active oversteer data

### Node Status

The node status representing the value of the `blindCtrl.reason.state` of the output.
The color of the output is as following:

* red - any error
* blue - override active
* grey - level by rule
* green - default value or sun not in window
* yellow - any other

The shape indicates whether the blind is fully closed or not.

## rules

The rules are not easy to understand.

There are basically 4 generic types of rules:

* no time and no condition rule
  * a rule with no time and no condition will be always active if checked.
  * such rules are evaluated in the order of time __until__ and time __from__ rules
* a rule with a condition - conditional rule
  * a rule with a condition will only be active if the condition matches, otherwise the rule will be ignored
  * rules with only a condition are evaluated in the order of time __until__ and time __from__ rules
* a rule with a given time - time rule
  * time rules differ again in 2 ways
    * __until__ time rules
      * rules will be active from Midnight __until__ the given time
      * the first matching __until__ rule with a time later than the current time will be selected
    * __from__ time rules
      * rules will be active __from__ given time to Midnight
      * the last matching __from__ rule with a time earlier than the current time will be considered
      * __from__ rules only considered if no __until__ rule was selected
* a rule with a condition and a given time
  * these type of rules are a combination. The rules will only be considered if the condition matches and then it act as a normal time rule. Otherwise it will be ignored.

the blind level of a rule could have 3 options:

* __absolute__
  * If a rule with a blind level of type absolute matches, the level would be set to the level defined in the rule. No sun control will be active as long this rule is active.
* __minimum (absolute - default)__ / __maximum (absolute - default)__
  * If a rule with a blind level of this type matches, as the level the the default defined blind position will be used or if sun control is active the blind position calculated by the sun will be used. If this level is above (maximum) or below (minimum) the given blind position by the rule, the position by the rule will be used.
* __minimum (additional oversteer)__ / __maximum (additional oversteer)__
  * a rule of this type never acts alone. These types of rules act in addition to the identified rule.
    * a type of this rule will not considered,
      * if it comes after an active absolute __until__ time rule
      * if it comes before an active absolute __from__ time rule
      * if no rule is active (default blind position or sun-control is active)

If there is a time where no rules matches, then as blind position the default defined blind position will be used or if sun control is active the blind position calculated by the sun will be used.

a typically easy ruleset could be setup in a way like:

* 1 __until__ absolute time (e.g. early morning 6:00) blind will be closed (absolute)
* 2 __until__ sun rise time (e.g. sunrise) blind will be closed (absolute)
  * The previous absolute __until__ rule (rule 1) will consider that the blind is closed, even if the sun rise time (this rule 2) is earlier than the time of rule 1.
* 3 __from__ sun set time (e.g. sunset) blind will be closed (absolute)
* 4 __from__ absolute time (e.g. late night 22:00) blind will be closed (absolute)
  * This rule 4 will be consider that the blind is closed, even if the sun set time (rule 3) is later than this absolute time.
* In the time between the rule 2 (last __until__) and the rule 3 (first __from__ rule) the blind will set to the default position which is setup normally to open. Only in this time the blind position can be controlled by sun.

### rules example

first lets look at the until rules:
![blind-control-rules-1](https://user-images.githubusercontent.com/12692680/57451580-018ead80-7262-11e9-9630-2662bdfdc627.png)

starting from midnight the following rule will be used:

* *until* 6:30 the rule 1 which results in a blind position of closed
* *until* 7:25 the rule 2 which results in a blind position of closed
  * but only if the [condition](README.md#conditions) "global.dayInfo.isWeekendOrHoliday === true" matches
* *until* civilDawn ~9:24 the rule 3 which results in a blind position of closed
  * but only if the time of civilDawn is greater than a time of a previous *until* rule

then lets look at the from rules:
![blind-control-rules-2](https://user-images.githubusercontent.com/12692680/57451583-03f10780-7262-11e9-8561-2bae3cf7d3cd.png)

starting from a defined time the following rule will be used:

* *from* civilDusk ~23:05 the rule 4 which results in a blind position of closed
  * but only if the time of civilDusk is lower than a time of a following *from* rule
* *from* 22:35 the rule 5 which results in a blind position of closed
  * but only if the [condition](README.md#conditions) "global.dayInfo.isWeekendOrHoliday === false" matches
* *from* 23:15 the rule 6 which results in a blind position of closed

This position will be used until midnight

There is a time between the *until* and the *from* rules, where no rules matches. In this time the default defined blind position will be used or if sun control is active the blind position calculated by the sun will be used.

## Samples

Example for a time-control to open blind on civilDawn, but not before 6 o'clock and close blind on civilDusk, but not later than 23:00 o clock:

![blind-control-example-1](https://user-images.githubusercontent.com/12692680/59666579-61f40180-91b5-11e9-9d28-78e4060fb77d.png)

```json
[{"id":"6ae5efb.281221","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"650223e.daba8dc","outputs":"1","blindIncrement":0.01,"blindOpenPos":1,"blindClosedPos":0,"blindPosReverse":false,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"timeValue":"6:00","timeType":"entered","timeOp":"0","timeOpText":"bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"👌 - Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"num"},{"timeValue":"civilDawn","timeType":"pdsTime","timeOp":"0","timeOpText":"bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"👌 - Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"num"},{"timeValue":"civilDusk","timeType":"pdsTime","timeOp":"1","timeOpText":"von","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"👌 - Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"num"},{"timeValue":"23:00","timeType":"entered","timeOp":"1","timeOpText":"von","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"👌 - Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"num"}],"sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"","oversteer3BlindPosType":"levelFixed","x":415,"y":2430,"wires":[["d31309f7.35a698"]]},{"id":"2e391f9c.f974b","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":210,"y":2430,"wires":[["6ae5efb.281221"]]},{"id":"d31309f7.35a698","type":"debug","z":"d7bd7fb6.a0c13","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":630,"y":2430,"wires":[]},{"id":"4368317d.414b3","type":"comment","z":"d7bd7fb6.a0c13","name":"Example 1:","info":"","x":150,"y":2385,"wires":[]},{"id":"650223e.daba8dc","type":"position-config","z":"","name":"","isValide":"true","longitude":"0","latitude":"0","angleType":"deg","timeZoneOffset":99,"timeZoneDST":0,"stateTimeFormat":"HH:mm:ss","stateDateFormat":"yyyy-MM-dd"}]
```

similar example with additional different times for weekend:

```json
[{"id":"42177438.2b8acc","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"d2b0ae0f.90e0c","outputs":1,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"14400000","rules":[{"timeValue":"6:30","timeType":"entered","timeOp":"0","timeOpText":"bis","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"7:25","timeType":"entered","timeOp":"0","timeOpText":"bis","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"dayInfo.today.isWeekendOrHoliday","validOperandAType":"global","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"civilDawn","timeType":"pdsTime","timeOp":"0","timeOpText":"bis","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"civilDusk","timeType":"pdsTime","timeOp":"1","timeOpText":"von","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"22:35","timeType":"entered","timeOp":"1","timeOpText":"von","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"dayInfo.tomorrow.isWeekendOrHoliday","validOperandAType":"global","validOperator":"false","validOperatorText":"ist falsch","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"23:15","timeType":"entered","timeOp":"1","timeOpText":"von","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"}],"sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","x":415,"y":3300,"wires":[["98c3eea0.6fb4b"]]},{"id":"8ad0c281.16c04","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":210,"y":3300,"wires":[["42177438.2b8acc"]]},{"id":"98c3eea0.6fb4b","type":"debug","z":"d7bd7fb6.a0c13","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":630,"y":3300,"wires":[]},{"id":"75d33e8e.0d3f6","type":"comment","z":"d7bd7fb6.a0c13","name":"Example 2:","info":"","x":150,"y":3255,"wires":[]},{"id":"49b7db3c.bbdb44","type":"change","z":"d7bd7fb6.a0c13","name":"dayInfo.today.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.today.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":605,"y":3360,"wires":[[]]},{"id":"cfb7c3ce.8f545","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":335,"y":3360,"wires":[["49b7db3c.bbdb44"]]},{"id":"a434dc44.c4da2","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":335,"y":3405,"wires":[["49b7db3c.bbdb44"]]},{"id":"c96a8cf.1e6ea7","type":"change","z":"d7bd7fb6.a0c13","name":"dayInfo.tomorrow.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.tomorrow.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":615,"y":3450,"wires":[[]]},{"id":"d23986f5.6512c8","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":335,"y":3450,"wires":[["c96a8cf.1e6ea7"]]},{"id":"5b57030c.952d9c","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":335,"y":3495,"wires":[["c96a8cf.1e6ea7"]]},{"id":"d2b0ae0f.90e0c","type":"position-config","z":"","name":"Kap-Halbinsel","isValide":"true","longitude":"0","latitude":"0","angleType":"deg","timezoneOffset":"1"}]
```

### testing rules and overrides

The following example could be used for testing rules, overrides and sun-position. The function node with the start/stop inject will set `msg.ts` which will be used by the node as the current time. This time is increased every 2 seconds by 30 minutes (can be setup at the beginning of the function node). The given number by the inject will be used as the start hour for that time.

So this example is ideal for testing setup in previous.

![blind-control-example-3](https://user-images.githubusercontent.com/12692680/57134451-897a4080-6da6-11e9-989e-15ab04e11d9d.png)

```json
[{"id":"cea2ff78.43c88","type":"function","z":"36914821.7e61b8","name":"test 60/1","func":"\nconst minutesEachLoop = 60; // minutes to add\nconst loopCycle = 1; // seconds delay\nlet timeObj = context.get(\"timeObj\");\n\nif (timeObj && msg.topic.includes('stop')) {\n    clearInterval(timeObj);\n    context.set(\"timeObj\", null);\n    let d = new Date(context.get(\"date\"));\n    node.log(\"STOP    \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');\n    node.status({fill:\"red\",shape:\"ring\",text:\"stopped - \" + d.toLocaleTimeString()});\n    return null;\n} else if (!timeObj && msg.topic.includes('start')) {\n    context.set(\"message\", msg);\n    let d = new Date();\n    let num = Number(msg.payload) || 0;\n    d.setHours(num);\n    d.setMinutes(0);\n    context.set(\"date\", d.getTime());\n    msg.lts = d.toLocaleTimeString();\n    msg.ts = d.getTime();\n    node.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');\n    node.log(\"START   \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.send(msg);\n\n    let timeObj = setInterval(function(){\n        let msg = context.get(\"message\");\n        let d = new Date(context.get(\"date\"));\n        //d.setHours(d.getHours()+1);\n        d.setMinutes(d.getMinutes() + minutesEachLoop)\n        context.set(\"date\", d.getTime());\n        msg.lts = d.toLocaleTimeString();\n        msg.ts = d.getTime();\n        node.status({fill:\"green\",shape:\"dot\",text:\"run - \" + d.toLocaleTimeString()});\n        node.log(\"sending \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n        node.send(msg);\n\t}, (1000 * loopCycle));\n    context.set(\"timeObj\", timeObj);\n    node.status({fill:\"green\",shape:\"ring\",text:\"start - \" + d.toLocaleTimeString()});\n    return null;\n}\n\nlet d = new Date(context.get(\"date\"));\nd.setMinutes(d.getMinutes() + 1)\n//d.setHours(d.getHours()+1);\nmsg.lts = d.toLocaleTimeString();\nmsg.ts = d.getTime();\nnode.status({fill:\"yellow\",shape:\"dot\",text:\"interposed - \" + d.toLocaleTimeString()});\nnode.log(\"sending interposed msg \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\nnode.send(msg);\nreturn null;","outputs":1,"noerr":0,"x":410,"y":170,"wires":[["1e9ec677.cb735a"]]},{"id":"94adccd9.10de4","type":"inject","z":"36914821.7e61b8","name":"","topic":"start/stop","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":120,"wires":[["cea2ff78.43c88"]]},{"id":"7d247b9a.e38db4","type":"inject","z":"36914821.7e61b8","name":"reset","topic":"resetOverwrite","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":210,"wires":[["cea2ff78.43c88"]]},{"id":"64b23228.81421c","type":"inject","z":"36914821.7e61b8","name":"0%","topic":"levelOverwrite","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":250,"wires":[["cea2ff78.43c88"]]},{"id":"e7ae3bfc.894ee8","type":"inject","z":"36914821.7e61b8","name":"60%","topic":"levelOverwrite","payload":"0.6","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":290,"wires":[["cea2ff78.43c88"]]},{"id":"deb790bb.78fa1","type":"comment","z":"36914821.7e61b8","name":"manual overrides:","info":"","x":120,"y":170,"wires":[]},{"id":"64d5dcbc.3400a4","type":"inject","z":"36914821.7e61b8","name":"90%, expire 2,5s","topic":"","payload":"{\"position\":0.9,\"expire\":2500}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":150,"y":330,"wires":[["cea2ff78.43c88"]]},{"id":"33901314.b0745c","type":"inject","z":"36914821.7e61b8","name":"30% Prio 1","topic":"","payload":"{\"position\":0.3,\"prio\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":370,"wires":[["cea2ff78.43c88"]]},{"id":"167bce83.65d931","type":"inject","z":"36914821.7e61b8","name":"100% prio 1","topic":"","payload":"{\"priority\":1, \"position\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":410,"wires":[["cea2ff78.43c88"]]},{"id":"1e9ec677.cb735a","type":"blind-control","z":"36914821.7e61b8","name":"","topic":"","positionConfig":"","outputs":2,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"index":0,"timeValue":"6:30","timeType":"entered","timeOp":"0","timeOpText":"↥ until","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  absolute","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","timeLimited":true,"conditional":false},{"index":1,"timeValue":"7:25","timeType":"entered","timeOp":"0","timeOpText":"↥ until","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  absolute","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"dayInfo.today.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","timeLimited":true,"conditional":true},{"index":2,"timeValue":"civilDawn","timeType":"pdsTime","timeOp":"0","timeOpText":"↥ until","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  absolute","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","timeLimited":true,"conditional":false},{"index":3,"timeValue":"civilDusk","timeType":"pdsTime","timeOp":"1","timeOpText":"↧ from","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  absolute","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","timeLimited":true,"conditional":false},{"index":4,"timeValue":"22:35","timeType":"entered","timeOp":"1","timeOpText":"↧ from","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  absolute","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","timeLimited":true,"conditional":false},{"index":5,"timeValue":"23:15","timeType":"entered","timeOp":"1","timeOpText":"↧ from","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  absolute","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"dayInfo.tomorrow.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","timeLimited":true,"conditional":true}],"sunControlMode":"2","sunFloorLength":"0.6","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"1.28","windowBottom":"0","windowAzimuthStart":"70","windowAzimuthEnd":"150","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":640,"y":170,"wires":[["d02857b1.ca8e08"],["f2000479.7be598"]]},{"id":"d02857b1.ca8e08","type":"debug","z":"36914821.7e61b8","name":"Blind position","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":870,"y":160,"wires":[]},{"id":"f2000479.7be598","type":"debug","z":"36914821.7e61b8","name":"Blind status","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":870,"y":210,"wires":[]},{"id":"eff1539b.c231a","type":"change","z":"36914821.7e61b8","name":"dayInfo.today.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.today.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":680,"y":300,"wires":[[]]},{"id":"5029989c.6159d8","type":"inject","z":"36914821.7e61b8","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":410,"y":300,"wires":[["eff1539b.c231a"]]},{"id":"22d8493a.dee336","type":"inject","z":"36914821.7e61b8","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":410,"y":350,"wires":[["eff1539b.c231a"]]},{"id":"8bdec9f2.d26378","type":"change","z":"36914821.7e61b8","name":"dayInfo.tomorrow.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.tomorrow.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":690,"y":400,"wires":[[]]},{"id":"4a7aebc7.ae0464","type":"inject","z":"36914821.7e61b8","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":410,"y":400,"wires":[["8bdec9f2.d26378"]]},{"id":"c2b3bc06.6d4a2","type":"inject","z":"36914821.7e61b8","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":410,"y":450,"wires":[["8bdec9f2.d26378"]]}]
```

## Additional FAQ

### Why is there no multi blind controller? (FAQ)

The approach is that there is a node for a blind. To reduce the setup overhead it is possible to create a sub-flow with the node per side of the house and thus only have to make the settings once. Settings such as overrides or times can still be configured individually, for example via sub-flow environment variables.

Maybe in this case [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller) is better suited here as well.

### How to define a Temperature Overwrite? (FAQ)

To Overwrite the sun-.calculation by a temperature threshold can be archived by using a conditional rule.

### How do I achieve that when opening a window the blind opens? (FAQ)

This can be archived in different ways:

* using override possibilities with different priority
* using conditional rules

## Other

For bugs, questions and feature requests please use the
[GitHub Issues](https://github.com/rdmtc/node-red-contrib-sun-position/issues).
