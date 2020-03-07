# Blind Controller

## blind-control

Used to control a blind with many possibilities. This can be time-dependent and it can calculate the blind position based on the current position of the sun to limit the sun light To limit the sunlight on the floor of a window.

![blind-control](https://user-images.githubusercontent.com/12692680/70033605-1c36c400-15b0-11ea-94db-fbf30eb6d7b7.png)

### Table of contents

- [Blind Controller](#blind-controller)
  - [blind-control](#blind-control)
    - [Table of contents](#table-of-contents)
    - [The node](#the-node)
    - [Node settings](#node-settings)
      - [general settings](#general-settings)
      - [blind settings](#blind-settings)
      - [rule settings](#rule-settings)
      - [overwrite settings](#overwrite-settings)
      - [sun settings](#sun-settings)
        - [maximize sunlight (Winter)](#maximize-sunlight-winter)
        - [restrict sunlight (Summer)](#restrict-sunlight-summer)
        - [sun position settings](#sun-position-settings)
      - [special settings](#special-settings)
    - [Node Input](#node-input)
    - [Node Output](#node-output)
    - [Node Status](#node-status)
  - [rules](#rules)
    - [rules execution in detail](#rules-execution-in-detail)
    - [rules example](#rules-example)
    - [time rules additional constraints](#time-rules-additional-constraints)
  - [Samples](#samples)
    - [Example 1](#example-1)
    - [Example 2](#example-2)
    - [Example 3 - testing rules and overrides](#example-3---testing-rules-and-overrides)
    - [Example 4 - usage of message properties](#example-4---usage-of-message-properties)
  - [Additional FAQ](#additional-faq)
    - [Why is there no multi blind controller? (FAQ)](#why-is-there-no-multi-blind-controller-faq)
    - [How to define a Temperature Overwrite? (FAQ)](#how-to-define-a-temperature-overwrite-faq)
    - [How do I achieve that when opening a window the blind opens? (FAQ)](#how-do-i-achieve-that-when-opening-a-window-the-blind-opens-faq)
  - [Other](#other)

### The node

Thanks a lot [alisdairjsmyth](https://github.com/alisdairjsmyth) with its node [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller). To be able to use the node [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller), a lot of functions around the node would have been necessary. As a result, I landed at a new node. So this node originated in the style of [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller) but internally has become a complete new development. I did not make the decision easy as to whether this node should be developed as a standalone node or as part of that node collection. The decisive factor was that this node uses many of the existing functions of that node collection.

Depending on the use case, this node may be the more appropriate one or the node [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller). The differences from this node to [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller) are:

- The output at the [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller) node is different to that node.
  - The node is designed to determine the degree of opening, so the higher number is open and the lower number is closed.
  - There is a `blindCtrl.levelInverse` output who will have the inverse value if needed.
  - The levels can be integer or floating point numbers. It is depending on the configuration of Open-level, closed-level and increment. This means the node can be configured to have 100=open, 0=closed with an increment of 1, but also 1=open, 0=closed with an increment of 0.01.
- This node is very flexible where information comes to the blind controller. So these do not always have to be part of the msg object, but can also come from environment variables or contexts.
- This node has the possibility for manual override with different priority. This can be used to differentiate between manual operation, fire alarm, window knob handle, etc. ...
- Various conditions for the absolute position are selectable, which unfortunately does not make the configuration easy. An example is if in the morning the blind should open depending on the position of the sun, but at the earliest at a defined time, which must be different between week and weekend.

### Node settings

#### general settings

![blind-control-settings-1](https://user-images.githubusercontent.com/12692680/57134454-8c753100-6da6-11e9-95e9-bdff86f1e3d4.png)

- **Position Configuration** connects to the central configuration node, which contains the current position, but also handles a lot of internal shared functions. Thus, this configuration is always needed, even if the sense does not always open up.
- **name** the name of the node

#### blind settings

![blind-control-settings-2](https://user-images.githubusercontent.com/12692680/57134458-8d0dc780-6da6-11e9-80c3-2d8e130bd8fb.png)

- **Increment** defines the minimum degree the blind position can be controlled
- **open position** The value for maximum open degree of a blind.
- **closed position** The value for minimum close degree of a blind.

All values could be floating point values.

#### rule settings

![blind-control-settings-3](https://user-images.githubusercontent.com/12692680/75864244-ff559b00-5e01-11ea-8d25-3c6d19953b42.png)

- **default position** The value which will be used if no other value given by condition, time or sun applies.
- **topic** if defined, the default topic of any outgoing message will be set to this value, otherwise the topic of the ingoing message will be used

![blind-control-settings-4](https://user-images.githubusercontent.com/12692680/68091970-9deae300-fe86-11e9-9a33-c69607fb8a38.png)

- If a rule with a absolute blind position applies, the blind position defined by the rule will be used.
  - sun control will then not be active
- If a rule has a condition, the rule only applies if the condition matches.
  - For some conditions a comparisons needs to be defined.
  - If the values of comparison comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages.
- If a rule has a time limitation
  - `until` the first rule is taken, where the given time is greater than the current time.
  - `from` the last rule is taken, where the given time is less than the current time.

- For some time definitions an Offset could be added (or be reduced with a negative value)
- If for the blind position a value from a message object and the value can not be determined the defined default blind position will be used.

#### overwrite settings

![blind-control-settings-5](https://user-images.githubusercontent.com/12692680/57134465-8d0dc780-6da6-11e9-97a6-8f3b61ed2de9.png)

- **expire** the duration in minutes a manual setting will remain is place. If not defined, there will be no default expiring of overrides.

![blind-control-settings-6](https://user-images.githubusercontent.com/12692680/57134466-8da65e00-6da6-11e9-84d2-425ca0be5e3d.png)

#### sun settings

Sun control is only active if no override and no rule with an absolute blind position applies!

If sun-control checkbox is not checked, the defined **default position** will be used.

The sun control (maximize or restrict sunlight) is only active, if no other rule (with an absolute blind position) or override matches.

- Requirements that should be valid with a higher priority should be set up as rules.
  - Example: if the blind should set to a level if a temperature threshold exceeded, this could be setup as rule

- **topic** if defined, the topic of the outgoing message which will be used if level is set by sun-control. If this topic is not defined (empty) the default topic will be used.

##### maximize sunlight (Winter)

![maximize-sunlight](https://user-images.githubusercontent.com/12692680/75866700-bbfd2b80-5e05-11ea-902e-37b125b08121.png)

In this mode if no override and no rule with an absolute blind position matches:

- If the sun is *not* in the window the blind will set to defined **min position**. (oversteer will be ignored)
- If the sun is in the window
  - If any oversteer data are setup and oversteer conditions are fulfilled the blind will set to the defined oversteer blind position.
  - otherwise the blind level is set to defined **max position**.

##### restrict sunlight (Summer)

![restrict-sunlight](https://user-images.githubusercontent.com/12692680/75867440-eac7d180-5e06-11ea-8bc6-92378701d2ca.png)

In this mode if no override and no rule with an absolute blind position matches, the node calculates the appropriate blind position to restrict the amount of direct sunlight entering the room.

This calculation includes:

- Determination of whether direct sunlight is entering the room based on the orientation of the blind and the azimuth of the sun
- Dimensions of the window and the current altitude of the sun.
- consideration of weather conditions against defined thresholds

##### sun position settings

- **start** The azimuth (in degree) of the sun, when the sun start falls into the window.
- **end** The azimuth (in degree) of the sun, when the sun no longer falls into the window.

![sun-azimuth2](https://user-images.githubusercontent.com/12692680/57704950-2f5d6300-7663-11e9-9ce1-4f90bbf3eed6.png)

under the simplest assumption starting from the bearing representing the perpendicular of the window to geographical north:

- start = orientation - 90 degree
- end = orientation + 90 degree

![sun-bottom-top](https://user-images.githubusercontent.com/12692680/57705862-ee664e00-7664-11e9-9e73-1306ffd2a6f8.png)

- The units of length is measure agnostic, They must be all in the same unit, but it does not matter which unit is used. If as lengths are used meter all lengths must be in meter. If used centimeters, all must be in centimeter.
- **top** Measurement from the floor to top of the window covered by the blind.
- **bottom** Measurement from the floor to bottom of the window covered by the blind.
- **length on the floor** (optional) the extent to which direct sunlight is to be allowed into the room through the window, defined as a length on the floor.
- **min altitude threshold** (optional) minimum altitude (in degree) of the sun for determination of blind position.
- **min position** minimum blind position if the sun is in the window. The blind will not close more than this minimum value, even if the calculated value results in a lower position.
- **max position** maximum blind position if the sun is in the window. The blind will not open more than this maximum value, even if the calculated value results in a higher position.

![blind-control-settings-8](https://user-images.githubusercontent.com/12692680/57453633-2df8f880-7267-11e9-85be-721ca916d2b1.png)

![blind-control-settings-9](https://user-images.githubusercontent.com/12692680/57453639-30f3e900-7267-11e9-9fbe-6688d075b988.png)

- **oversteer**, **oversteer Operator**, **Threshold** allows to define a blind position which should be used in a given [condition](README.md#conditions) to be used instead of the calculated value by the sun. Typical use-case is a weather condition but it is not limited to that.
  - the value for **Threshold** can only be entered if needed by selected **operator**
  - Example: If the **oversteer** is a property which contains a numerical value representing the percentage of sky occluded by clouds and an operator *greater than or equal* is used with a **Threshold** a numerical value representing the maximum percentage of sky occluded by clouds. Then if the **oversteer** value exceeds the **Threshold** the **blind position** will be used instead of the position calculated by the sun.
  - If the values of **oversteer** or **Threshold** comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages.
  - **blind position** the blind position which should be used instead of the calculated value by the sun if the defined expression for **oversteer** with **operator** (and maybe **Threshold**) is **true**.
  - can be used for overrides of sunPosition calculation by weather, cloud, temperature, UV-index, ... conditions
- **oversteer2**, **oversteer2 Operator**, **Threshold** equal to **oversteer**, but an additional oversteer possibility. Lower priority than **oversteer**
- **oversteer3**, **oversteer3 Operator**, **Threshold** equal to **oversteer** and **oversteer2**, but an additional oversteer possibility. Lower priority than **oversteer2**

- **oversteer topic** if defined, the topic of the outgoing message which will be used if level is set by sun-control. If this topic is not defined (empty) the default topic will be used.

#### special settings

- **output** here is configurable if the node has one single (default) or two outputs. See [Node Output](#node-output) for further details.
- **auto trigger** Typically the calculation will be triggered by an incoming message or by an expiring timeout from an override. Additionally the node can be configured to have an auto trigger time.
  - If such a time is configured the node will be trigger a new calculation automatically at the next possible time, taking the following times into account:
    - every 5 minutes if *restrict sunlight* is active and the sun is in the window
    - every 10 minutes if *restrict sunlight* is active and the sun will be next time shine in the window
    - a time for a rule or the next rule occurs or expires
    - the configured time span in the node
  - To thus in the most cases it makes no sense to enter a short period (less than 15min) of auto trigger time in the configuration, because the node automatically shortens the time if necessary.
  - Please note that the node cannot react to changes in times that are configured via a context. If for example times or offsets configured by using a flow or global context, the auto trigger would not change the next trigger time.
- **start delay** Sometimes on node-red start (or flow re deploy) the node should not send any output before the system has settled (contexts are set, incoming messages processed, ...). To thus it is possible to define a delay time. Setting a time will only block the node to send any output until the time has reached to the first output. All calculations still will be made.

### Node Input

The Input is for triggering the calculation and for setting overwrites of the blind position.

- **reset** an incoming message with `msg.reset` is `true` or `msg.payload.reset` is `true` or where the `msg.topic` contains `resetOverwrite` and the value of `msg.payload` = `true` will reset any existing overrides.
  - **priority** (optional) when a priority is given the existing override will only reset if the priority of the message is __equal or higher__ then the priority of the existing override. The message priority can be defined by
    - a property `msg.prio`, `msg.payload.prio`, `msg.priority`, `msg.payload.priority`, `msg.privilege` or `msg.payload.privilege` with a valid numeric value
    - or when the `msg.topic` contains `prio`, `privilege` or `alarm` and the value of `msg.payload` is a valid numeric value
    - a higher number is a higher priority. So prio 1 is the lowest priority
    - If in the message a property  `msg.exactPriority`, `msg.payload.exactPriority`, `msg.exactPrivilege` or `msg.payload.exactPrivilege` is set to true or when the `msg.topic` contains `exactPrio` or `exactPrivilege` then the existing override will only reset if the absolute value of the priority of the message is __equal__ then the priority of the existing override.
- **position** an incoming message with a numeric property of `msg.blindPosition`, `msg.position`, `msg.level`, `msg.blindLevel`,  `msg.payload.blindPosition`, `msg.payload.position`, `msg.payload.level`, `msg.payload.blindLevel` or where the  `msg.topic` contains `manual` or `levelOverwrite` and the value of `msg.payload` is a numeric value will override any of rule/sun/.. based level of the blind.
  - If an override is already active a new message changes the blind level if the **priority** of the existing override allows this.
    - The override could also limited if  a property `msg.ignoreSameValue`, `msg.payload.ignoreSameValue` is set to true an existing override will only be changed if the position value differs from the active override position.
  - Except `-1` the position must be a valid blind Position as defined in the node settings or otherwise it will throw an error.
  - The **position** of the special value of `-1` will set the node in override mode without sending any message out until override **position** is changed, override is **expired** or **reset**.
    - Example: This could be useful if a blind is controlled by an external button, where not known the blind position after button press. In this case the Button-event can used to trigger the override-mode of the node without knowing the real **position** of the blind.
- **priority** (optional) Enables to handles overrides of different priorities. Default value will be `0`.
  - A message property  `msg.prio`, `msg.payload.prio`, `msg.priority`, `msg.payload.priority`, `msg.privilege` or `msg.payload.privilege` with a valid numeric value
  - or when the `msg.topic` contains`prio`, `privilege` or `alarm`  and the value of `msg.payload` is a valid numeric value
  - A `boolean` value `true` is considered as numeric `1`
  - a higher number is a higher priority. So prio 1 is the lowest priority
- **expire** (optional) Enables to define an override as automatically expiring. As default value for overrides of priority `0` the value in the settings is be used. Overrides with a priority higher than `0` will not expire by default.
  - A message property `msg.expire` or `msg.payload.expire`
  - or when the `msg.topic` contains `expire` and the value of `msg.payload` is a valid numeric value
  - The value must be a time in milliseconds which is greater than 100. Otherwise the override will be set to not expiring.
  - If an override is already active a new message with **expire** can change the existing expire behavior if the **priority** of the existing override allows this.

Useful to know:

- If a **reset** and a new override is set in the same message, any existing override will be reset and the new will be set afterwards. In this scenario no existing override **priority** will be considered.
- An already existing Override can only be changed if the prio of the existing is `0` (default - can always be changed) or the message object has a **priority** set with a value that is equal or greater than the existing override. If that is given the **expire**, **priority** or **position** can be changed.
  - if additional **exactPrio** is defined, then the message priority must be __equal__ to the existing priority.
- There are a special configuration for rules with a condition, with which it can be prevented to allow overrides.
- an incoming message with `msg.mode`, `msg.payload.mode` or where the `msg.topic` contains `setMode` and the value of `msg.payload` is a valid number, will allow to set the mode of the sun control.
  - a value of `0` will deactivate sun control, `1` will set to maximize sunlight (Winter) and `2` will set to restrict sunlight (Summer).
  - The maximum adjustable mode is influenced by the settings of the node. The mode can not be set to restrict sunlight (`2`) if in the settings is setup only maximize sunlight (`1`).
- A message where the topic contains `triggerOnly` or  or with an property `msg.trigger` which is true can not act as override.


### Node Output

In the enhanced option are configurable if the node has one single (default) or two outputs.

An output can be triggered by an incoming message, by an expiring timeout from an override or by auto trigger. If the trigger is a incoming message, the incoming message will be forwarded to the first output if the blind position has changed.

The incoming message is changed as following:

- `msg.topic` if a topic is defined this topic will be used, otherwise no change of the topic from the incoming message
- `msg.payload` the payload will be set to the new blind level (numeric value)

If the output is set to single, an object property `msg.blindCtrl` will be attached to the message and forwarded to the first output.
If the node is configured with two outputs this object is set as the `msg.payload` property of the message that is send to the second output. The difference is also, that the second output will give this object every time a recalculation will is triggered, where the first output only send a message on blind position change.

- `blindCtrl` a object will be added add as `msg.blindCtrl` property on single output mode or send as `msg.payload` on slit output mode with the following properties:
  - `blindCtrl.reason` - __object__ - for the reason of the current blind position
    - `blindCtrl.reason.code` - __number__ - representing the reason for the blind position. The possible codes are
      - **NaN** - start delay is setup and node is in this time
      - **-1** - the rules was not evaluated, maybe override is active
      - **1**  - defined default blind position, because no other rule/condition/behavior
      - **2**  - manual override
      - **3**  - manual override - expiring
      - **4**  - based blind position based by rule
      - **5**  - calculated blind position by sun control is below defined minimum blind position (minimum blind position used)
      - **6**  - calculated blind position by sun control is above defined maximum blind position (maximum blind position used)
      - **7**  - Sun below altitude threshold
      - **8**  - Sun is not in window, default blind position is used
      - **9**  - blind position calculated by sun position
      - **10** - defined oversteer condition applies
      - **11** - blind position calculated by sun position was not used caused by smooth settings
      - **12** - sun is in window (maximize mode), max blind position used
      - **13** - sun is not in window (maximize mode), min blind position used
      - **14** - change is below defined minimum delta
      - **15** - blind position is below defined minimum blind position by rule
      - **16** - blind position is above defined maximum blind position by rule
    - `blindCtrl.reason.state` - __string__ - short text representing the reason for the blind position (same as node status text)
    - `blindCtrl.reason.description` - __string__ - describe the reason for the blind position
  - `blindCtrl.level` - __number__ - the new blind level - equal to `msg.payload` of the first output message.
  - `blindCtrl.levelInverse` - __number__ - if `blindCtrl.blind.overwrite.active` is true, the value of `blindCtrl.levelInverse` will be equal to the value of `blindCtrl.level`, otherwise it will be the inverse to `blindCtrl.level`. This means if `blindCtrl.level` indicates how much the blind is open, then `blindCtrl.levelInverse` indicates how much the blind is closed. So if `blindCtrl.level` is equal to **min position**, `blindCtrl.levelInverse` will be **max position**.
  - `blindCtrl.blind` - __object__ - containing all blind settings, only the most interesting ones are explained here
    - `blindCtrl.blind.overwrite` - __object__
      - `blindCtrl.blind.overwrite.active` - __boolean__ - is `true` when overwrite is active, otherwise `false`
      - `blindCtrl.blind.overwrite.priority` - __number__ - the priority of the override
      - `blindCtrl.blind.overwrite.expires` - __boolean__ - is `true` when overwrite expires [exists only if overwrite active]
      - `blindCtrl.blind.overwrite.expireTs` - __number__ - a timestamp (UNIX) when overwrite expiring [exists only if overwrite expires]
      - `blindCtrl.blind.overwrite.expireDate` - __string__ - a timestamp (String) when overwrite expiring [exists only if overwrite expires]
  - `blindCtrl.rule` - __object__ - exists only if no override is active
    - `blindCtrl.rule.active` - __boolean__ - `true` if a rule applies
    - `blindCtrl.rule.id` - __number__ - id of the rule who applies (is `-1` if no rule has applied)
    - `blindCtrl.rule.level` - __number__ - the blind level defined by the rule if level type is __absolute__, otherwise the defined default blind position [exists only if a rule applies]
    - `blindCtrl.rule.conditional` - __boolean__ - `true` if the rule has a condition [exists only if a rule applies]
    - `blindCtrl.rule.timeLimited` - __boolean__ - `true` if the rule has a time [exists only if a rule applies]
    - `blindCtrl.rule.conditon` - __object__ with additional data about the condition [exists only if `blindCtrl.rule.conditional` is true] - good for debugging purpose
    - `blindCtrl.rule.time` - __object__ with additional data about the time [exists only if `blindCtrl.rule.timeLimited` is true] - good for debugging purpose
    - `blindCtrl.rule.hasMinimum` - __boolean__ - is __true__ if to the level of the rule an additional __minimum__ rule will be active, otherwise __false__
    - `blindCtrl.rule.levelMinimum` - __number__ - exists only if `blindCtrl.rule.hasMinimum` is __true__ and then contains then the blind level defined by the rule
    - `blindCtrl.rule.hasMaximum` - __boolean__ - is __true__ if  to the level of the rule an additional __maximum__ rule will be active, otherwise __false__
    - `blindCtrl.rule.levelMinimum` - __number__ - exists only if `blindCtrl.rule.hasMaximum` is __true__ and then contains then the blind level defined by the rule
  - `blindCtrl.sunPosition` - __object__ - calculated sub-position data - exists only if sun position is calculated
    - `blindCtrl.sunPosition.InWindow` - `true` if sun is in window, otherwise `false`
    - `blindCtrl.sunPosition.oversteer` - __object__ - containing the active oversteer data
  - `blindCtrl.autoTrigger` - __object__ - with additional data about the autoTrigger [exists only if auto trigger is enabled in the settings]
    - `blindCtrl.autoTrigger.deaultTime` - __number__ - in milliseconds the auto trigger time of the settings
    - `blindCtrl.autoTrigger.time` - __number__ - in milliseconds the next auto trigger time (could be less than the dined time in the settings)
    - `blindCtrl.autoTrigger.type` - __number__ - the type of the next auto trigger
      - **0**  - equal to defined `blindCtrl.autoTrigger.deaultTime`
      - **1**  - by current rule end or `blindCtrl.autoTrigger.deaultTime`
      - **2**  - by next rule or `blindCtrl.autoTrigger.deaultTime`
      - **3**  - sun not on horizon (maybe it is night?)
      - **4**  - sun not visible
      - **5**  - sun before in window (auto trigger time will be at maximum every 10 minutes)
      - **6**  - sun in window and smooth time is set (auto trigger time will be maximum the defined smooth time)
      - **7**  - sun in window and no smooth time defined (auto trigger time will be at maximum every 5 minutes)

### Node Status

The node status representing the value of the `blindCtrl.reason.state` of the output.
The color of the output is as following:

- red - any error or a start delay is set and node is currently in this time
- blue - override active
- grey - level by rule
- green - default value or sun not in window
- yellow - any other

The shape indicates whether the blind is fully closed or not.

## rules

The rules are not easy to understand.
![rule-edit-0](https://user-images.githubusercontent.com/12692680/75113132-1f8b9a00-564b-11ea-9a04-9bc340763a08.png)

There are basically 4 generic types of rules:

- no time and no condition rule
![rule-type-1](https://user-images.githubusercontent.com/12692680/68092012-ff12b680-fe86-11e9-9c91-b4bf0f4bd82d.png)
  - a rule with no time and no condition will be always active if checked.
  - such rules are evaluated in the order of time __until__ and time __from__ rules
- a rule with a condition - conditional rule
![rule-type-2](https://user-images.githubusercontent.com/12692680/68092057-7fd1b280-fe87-11e9-97b6-4cacbaa7312a.png)
  - a rule with a condition will only be active if the condition matches, otherwise the rule will be ignored
  - rules with only a condition are evaluated in the order of time __until__ and time __from__ rules
- a rule with a given time - time rule
![rule-type-3](https://user-images.githubusercontent.com/12692680/75113146-68435300-564b-11ea-8531-6623311851b8.png)
  - time rules differ again in 2 ways
    - __until__ time rules
      - rules will be active from Midnight __until__ the given time
      - the first matching __until__ rule with a time later than the current time will be selected
    - __from__ time rules
      - rules will be active __from__ given time to Midnight
      - the last matching __from__ rule with a time earlier than the current time will be considered
      - __from__ rules only considered if no __until__ rule was selected
- a rule with a condition and a given time
![rule-type-4](https://user-images.githubusercontent.com/12692680/75113183-bc4e3780-564b-11ea-83d8-495e188e4b81.png)
  - these type of rules are a combination. The rules will only be considered if the condition matches and then it act as a normal time rule. Otherwise it will be ignored.

the blind level of a rule could have 5 options:

- __absolute__
  - If a rule with a blind level of type absolute matches, the level would be set to the level defined in the rule. No sun control will be active as long this rule is active.
- __minimum (oversteer)__ / __maximum (oversteer)__
  - a rule of this type makes a limitation of the blind position possible. Other __absolute__ rules still will be considered.
    - Please aware that a rule of this type will not considered if
      - it is of type __until__ and comes after an active absolute __until__ time rule
      - it is of type __from__ and comes before an active absolute __from__ time rule
- __reset minimum__ / __reset maximum__
  - a rule of these type only clears a previous remembered minimum or maximum limitation during the rule evaluation. The rules when such a rule becomes active are the same as for __minimum (oversteer)__ / __maximum (oversteer)__ rules.

If there is a time where no rules matches, then as blind position the default defined blind position will be used or if sun control is active the blind position calculated by the sun will be used.

a typically easy ruleset could be setup in a way like:

- 1 __until__ absolute time (e.g. early morning 6:00) blind will be closed (absolute)
- 2 __until__ sun rise time (e.g. sunrise) blind will be closed (absolute)
  - The previous absolute __until__ rule (rule 1) will consider that the blind is closed, even if the sun rise time (this rule 2) is earlier than the time of rule 1.
- 3 __from__ sun set time (e.g. sunset) blind will be closed (absolute)
- 4 __from__ absolute time (e.g. late night 22:00) blind will be closed (absolute)
  - This rule 4 will be consider that the blind is closed, even if the sun set time (rule 3) is later than this absolute time.
- In the time between the rule 2 (last __until__) and the rule 3 (first __from__ rule) the blind will set to the default position which is setup normally to open. Only in this time the blind position can be controlled by sun.

### rules execution in detail

The exact logic is as follows:

1. The system evaluates from the first rule starting to the last rule of type __until__ in ascending order (or if there is no __until__ rule, then to the last rule).
    - Rules whose condition does not apply will be skipped.
    - Rules of the time type __from__ are skipped.
    - The first rule of level type __absolute__, which has no time constraint or whose time is greater than the current time, is chosen.
      - Subsequent rules are no longer considered, even if they have no time constraint.
2. If no rule was found under 1., the system evaluates the rules in descending order from the last rule.
    - Rules whose condition does not apply will be skipped.
    - Rules the time type __until__ to are skipped.
    - The first rule of the level type __absolute__, which has no time constraint or whose time is smaller than the current time, is chosen.
      - Further rules are not evaluated, even if they have no time constraint.
3. If no rule was found with 1st and 2nd, the default value for the shutter control is taken and the sun control can be active.

The rules in the range between the last to rule and the first rule are evaluated only if no other rule is active. This can be used to allow special control during this time.

In addition to the rules of the level type __absolute__, there are also the rules of the type __minimum__, __maximum__ and __reset minimum__, __reset maximum__. These rules are basically evaluated in the same way.
If one of these rules applies, the system does not stop the evaluation of the rules, but remember the last rule of the respective kind (last minimum, last maximum). If one of the reset rules applies to the evaluation, the noted rule is discarded. The remaining minimum-type rule and the remaining maximum-type rule are applied. When applying these minimum / maximum rules, it does not matter what the shutter position (rule, sun position, default, ...) was determined. This can be used to set additional constraint on the next absolute rule or to the sun control based on other limitations,  constraints, time settings or whatever.
A typical application of this type of rule may be to ensure that a minimum shutter height is ensured when the window is open to guarantee ventilation or to ensure in heavy rain that no rain falls in the window.

### rules example

first lets look at the until rules:
![blind-control-rules-1](https://user-images.githubusercontent.com/12692680/68092147-6e3cda80-fe88-11e9-944b-96278c821d31.png)

starting from midnight the following rule will be used:

- the rule 1 will results in a blind position of closed *until* *civilDawn* or but at the earliest until 6:30
![blind-control-rules-1a](https://user-images.githubusercontent.com/12692680/68092163-94627a80-fe88-11e9-91c3-d1d3fa120ebd.png)
  - the earliest (minimum) means if the time of *civilDawn* is early than 6:30, the time of 6:30 will be used.
- the rule 2 will results in a blind position of closed *until* *civilDawn* or but at the earliest until 7:30
![blind-control-rules-1b](https://user-images.githubusercontent.com/12692680/68092236-5c0f6c00-fe89-11e9-82d5-952e23bbeac1.png)
  - but only if the [condition](README.md#conditions) `global.dayInfo.isWeekendOrHoliday === true` matches
  - and if the time of the second until rule is greater than the time of the first rule.

then lets look at the from rules:
![blind-control-rules-2](https://user-images.githubusercontent.com/12692680/68092290-da6c0e00-fe89-11e9-8897-dc5a3d2c69e1.png)

starting from a defined time the following rule will be used:

- *from* *civilDusk* the rule 3 results in a blind position of closed but at latest until 22:35
![blind-control-rules-2a](https://user-images.githubusercontent.com/12692680/68092318-274fe480-fe8a-11e9-8e88-81b3f8849152.png)
  - the latest (maximum) means if the time of *civilDusk* is later than 22:35, the time of 22:35 will be used.
  - the rule will be only used, if the [condition](README.md#conditions) `global.dayInfo.isWeekendOrHoliday === false` matches
  - ans the rule will be only used if the resulting time is lower than a time of a following *from* rule
- *from* 23:15 until midnight the rule 4 results in a blind position of closed
![blind-control-rules-2b](https://user-images.githubusercontent.com/12692680/68092401-f91ed480-fe8a-11e9-9799-dac643f963a9.png)

There is a time between the *until* and the *from* rules, where no rules matches. In this time the default defined blind position will be used or if sun control is active the blind position calculated by the sun will be used.

### time rules additional constraints

On a time rule additional constraints can be choose:
![blind-control-rules-constraints](https://user-images.githubusercontent.com/12692680/75113198-f61f3e00-564b-11ea-835e-7550a9e765af.png)

A rule is only executed if there are no restrictions.

That means:

- if the current day of the week is one of the selected days of the week
- if the current month is one of the selected months
- if *only even* is selected and the current day is an even day
- if *only odd* is selected and the current day is an odd day
- if the current day is in the time period as selected
  - For the time period settings the year is ignored.
    - Normal: the start day and month is less than the end day and month
      - the rule is only executed if the current month+day is greater than or equal the selected period start **and** less than the selected end month and day.
      - Example: This can be used To setup a period starting from 17th of March to 7th of May.
    - over the year: the start day and month is greater than the end day and month
      - the rule is only executed if the current month+day is greater than or equal the selected period start **or** less than the selected end month and day.
      - Example: This can be used To setup a period starting from 12th of November to 20th of February.

All constraints are additive. Pleas careful to that, that means it is possible to setup a rule which never would be used.

## Samples

### Example 1

Example for a time-control to open blind on civilDawn, but not before 6 o'clock and close blind on civilDusk, but not later than 23:00 o clock:

![blind-control-example-1](https://user-images.githubusercontent.com/12692680/67167183-f99d7280-f396-11e9-867e-737e4c23e2db.png)

```json
[{"id":"a63f055a.3a5648","type":"blind-control","z":"11d2cda0.99b1c2","name":"","topic":"","positionConfig":"","outputs":"1","blindIncrement":0.01,"blindOpenPos":1,"blindClosedPos":0,"blindPosReverse":false,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"index":0,"name":"open on civilDawn, but not before 6","timeValue":"6:00","timeType":"entered","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":1,"timeBValue":"civilDawn","timeBType":"pdsTime","timeBOp":1,"timeBOpText":"latest (max)","offsetBValue":"","offsetBType":"none","multiplierB":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"num","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until latest (max)<div class=\"indent-time-text\"> 6:00 <b>or</b> civilDawn</div></div><div>↕ absolute closed (min)</div>"},{"index":1,"name":"close civilDusk, but not later than 23:00","timeValue":"civilDusk","timeType":"pdsTime","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":1,"timeBValue":"23:00","timeBType":"entered","timeBOp":0,"timeBOpText":"earliest (min)","offsetBValue":"","offsetBType":"none","multiplierB":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"num","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from earliest (min)<div class=\"indent-time-text\"> civilDusk <b>or</b> 23:00</div></div><div>↕ absolute closed (min)</div>"}],"sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":360,"y":1620,"wires":[["4fc0f870.e9eab8"]]},{"id":"d1e3132b.f04af","type":"inject","z":"11d2cda0.99b1c2","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":155,"y":1620,"wires":[["a63f055a.3a5648"]]},{"id":"4fc0f870.e9eab8","type":"debug","z":"11d2cda0.99b1c2","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":575,"y":1620,"wires":[]},{"id":"62102ff9.05071","type":"comment","z":"11d2cda0.99b1c2","name":"Example 1:","info":"","x":95,"y":1575,"wires":[]}]
```

### Example 2

similar example with additional different times for weekend:

```json
[{"id":"8e118383.ebde","type":"blind-control","z":"b027a2d0.3fe03","name":"","topic":"","positionConfig":"","outputs":1,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"14400000","rules":[{"index":0,"name":"","timeValue":"6:30","timeType":"entered","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until 6:30</div><div>↕ absolute closed (min)</div>"},{"index":1,"name":"","timeValue":"7:25","timeType":"entered","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"dayInfo.today.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-code-fork\" aria-hidden=\"true\"></i> flow....fo.today.isWeekendOrHoliday is true</div><div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until 7:25</div><div>↕ absolute closed (min)</div>"},{"index":2,"name":"","timeValue":"civilDawn","timeType":"pdsTime","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until civilDawn</div><div>↕ absolute closed (min)</div>"},{"index":3,"name":"","timeValue":"civilDusk","timeType":"pdsTime","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from civilDusk</div><div>↕ absolute closed (min)</div>"},{"index":4,"name":"","timeValue":"22:35","timeType":"entered","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"dayInfo.tomorrow.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"false","validOperatorText":"is false","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-code-fork\" aria-hidden=\"true\"></i> flow....tomorrow.isWeekendOrHoliday is false</div><div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from 22:35</div><div>↕ absolute closed (min)</div>"},{"index":5,"name":"","timeValue":"23:15","timeType":"entered","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from 23:15</div><div>↕ absolute closed (min)</div>"}],"sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":360,"y":100,"wires":[["a1a9311b.ab37e"]]},{"id":"a21ed43b.1dd208","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":155,"y":100,"wires":[["8e118383.ebde"]]},{"id":"a1a9311b.ab37e","type":"debug","z":"b027a2d0.3fe03","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":575,"y":100,"wires":[]},{"id":"486bfe98.6fc88","type":"comment","z":"b027a2d0.3fe03","name":"Example 2:","info":"","x":95,"y":55,"wires":[]},{"id":"2d2d318a.b1e8ae","type":"change","z":"b027a2d0.3fe03","name":"dayInfo.today.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.today.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":550,"y":160,"wires":[[]]},{"id":"357b66a1.45baba","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":280,"y":160,"wires":[["2d2d318a.b1e8ae"]]},{"id":"ff7765ce.430618","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":280,"y":205,"wires":[["2d2d318a.b1e8ae"]]},{"id":"ac2afacc.a10e38","type":"change","z":"b027a2d0.3fe03","name":"dayInfo.tomorrow.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.tomorrow.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":560,"y":250,"wires":[[]]},{"id":"6aa6ea74.8c12f4","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":280,"y":250,"wires":[["ac2afacc.a10e38"]]},{"id":"c286d608.52c4f8","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":280,"y":295,"wires":[["ac2afacc.a10e38"]]}]
```

### Example 3 - testing rules and overrides

The following example could be used for testing rules, overrides and sun-position. The function node with the start/stop inject will set `msg.ts` which will be used by the node as the current time. This time is increased every 2 seconds by 30 minutes (can be setup at the beginning of the function node). The given number by the inject will be used as the start hour for that time.

So this example is ideal for testing setup in previous.

![blind-control-example-3](https://user-images.githubusercontent.com/12692680/57134451-897a4080-6da6-11e9-989e-15ab04e11d9d.png)

```json
[{"id":"f8a13620.864428","type":"function","z":"b027a2d0.3fe03","name":"30min 1sec","func":"\nconst minutesEachLoop = 30; // minutes to add\nconst loopCycle = 1; // seconds delay\nlet timeObj = context.get(\"timeObj\");\n\nif (timeObj && msg.topic.includes('stop')) {\n    clearInterval(timeObj);\n    context.set(\"timeObj\", null);\n    context.set(\"orgtopic\", null);\n    let d = new Date(context.get(\"date\"));\n    node.log(\"STOP    \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ' + d.toISOString());\n    node.status({fill:\"red\",shape:\"ring\",text:\"stopped - \" + d.toLocaleTimeString()});\n    return null;\n} else if (!timeObj && msg.topic.includes('start')) {\n    context.set(\"message\", msg);\n    context.set(\"orgtopic\", msg.topic);\n    let d = new Date();\n    let num = Number(msg.payload);\n    if (isNaN(num) && num < 24) {\n        d.setHours(num);\n        d.setMinutes(0);\n    } else {\n        let dt = new Date(msg.payload);\n        if (dt instanceof Date && !isNaN(dt)) {\n            d = dt;\n        } else {\n            d.setHours(0);\n            d.setMinutes(0);\n        }\n    }\n    context.set(\"date\", d.getTime());\n    msg.tsISO = d.toISOString();\n    msg.ts = d.getTime();\n    msg.topic += ' ' + d.toLocaleTimeString();\n    node.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');\n    node.log(\"START   \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.send(msg);\n\n    let timeObj = setInterval(function(){\n        let msg = context.get(\"message\");\n        let topic = context.get(\"orgtopic\");\n        let d = new Date(context.get(\"date\"));\n        //d.setHours(d.getHours()+1);\n        d.setMinutes(d.getMinutes() + minutesEachLoop)\n        context.set(\"date\", d.getTime());\n        msg.tsISO = d.toISOString();\n        msg.ts = d.getTime();\n        msg.topic = topic + ' ' + d.toLocaleTimeString();\n        node.status({fill:\"green\",shape:\"dot\",text:\"run - \" + d.toLocaleTimeString()});\n        node.log(\"sending \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n        node.send(msg);\n\t}, (1000 * loopCycle));\n    context.set(\"timeObj\", timeObj);\n    node.status({fill:\"green\",shape:\"ring\",text:\"start - \" + d.toLocaleTimeString()});\n    return null;\n}\n\nlet d = new Date(context.get(\"date\"));\nif (!(d instanceof Date) || isNaN(d)) {\n    d = new Date();\n}\nd.setMinutes(d.getMinutes() + 1)\n//d.setHours(d.getHours()+1);\nmsg.tsISO = d.toISOString();\nmsg.ts = d.getTime();\nmsg.topic += ' ' + d.toLocaleTimeString();\nnode.status({fill:\"yellow\",shape:\"dot\",text:\"interposed - \" + d.toLocaleTimeString()});\nnode.log(\"sending interposed msg \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\nnode.send(msg);\nreturn null;","outputs":1,"noerr":0,"x":490,"y":160,"wires":[["ebdb6f1c.03a1b"]]},{"id":"81369762.297228","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"start/stop","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":195,"y":115,"wires":[["f8a13620.864428"]]},{"id":"f9de0300.995f5","type":"inject","z":"b027a2d0.3fe03","name":"reset","topic":"resetOverwrite","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":205,"wires":[["f8a13620.864428"]]},{"id":"5819a842.89e728","type":"inject","z":"b027a2d0.3fe03","name":"0%","topic":"levelOverwrite","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":245,"wires":[["f8a13620.864428"]]},{"id":"ed33d5f.1aba928","type":"inject","z":"b027a2d0.3fe03","name":"60%","topic":"levelOverwrite","payload":"0.6","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":290,"wires":[["f8a13620.864428"]]},{"id":"db9a411a.c6648","type":"comment","z":"b027a2d0.3fe03","name":"manual overrides:","info":"","x":165,"y":160,"wires":[]},{"id":"b7b192c6.39569","type":"inject","z":"b027a2d0.3fe03","name":"90%, expire 2,5s","topic":"","payload":"{\"position\":0.9,\"expire\":2500}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":200,"y":340,"wires":[["f8a13620.864428"]]},{"id":"e255551d.1b0c98","type":"inject","z":"b027a2d0.3fe03","name":"30% Prio 1","topic":"","payload":"{\"position\":0.3,\"prio\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":180,"y":385,"wires":[["f8a13620.864428"]]},{"id":"8479b7a3.b63ba8","type":"inject","z":"b027a2d0.3fe03","name":"100% prio 1","topic":"","payload":"{\"priority\":1, \"position\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":430,"wires":[["f8a13620.864428"]]},{"id":"ebdb6f1c.03a1b","type":"blind-control","z":"b027a2d0.3fe03","name":"","topic":"","positionConfig":"","outputs":1,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"index":0,"name":"","timeValue":"5:30","timeType":"entered","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":1,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until 5:30</div><div>↕ absolute closed (min)</div>"},{"index":1,"name":"","timeValue":"7:25","timeType":"entered","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":1,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"dayInfo.today.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-code-fork\" aria-hidden=\"true\"></i> flow....fo.today.isWeekendOrHoliday is true</div><div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until 7:25</div><div>↕ absolute closed (min)</div>"},{"index":2,"name":"","timeValue":"civilDawn","timeType":"pdsTime","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":1,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until civilDawn</div><div>↕ absolute closed (min)</div>"},{"index":3,"name":"","timeValue":"civilDusk","timeType":"pdsTime","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":1,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from civilDusk</div><div>↕ absolute closed (min)</div>"},{"index":4,"name":"","timeValue":"21:25","timeType":"entered","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":1,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"dayInfo.tomorrow.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"false","validOperatorText":"is false","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-code-fork\" aria-hidden=\"true\"></i> flow....tomorrow.isWeekendOrHoliday is false</div><div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from 21:25</div><div>↕ absolute closed (min)</div>"},{"index":5,"name":"","timeValue":"23:15","timeType":"entered","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":1,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from 23:15</div><div>↕ absolute closed (min)</div>"}],"sunControlMode":"2","sunFloorLength":"0.6","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"1.28","windowBottom":"0","windowAzimuthStart":"70","windowAzimuthEnd":"150","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":710,"y":160,"wires":[["4ce4b247.3fd56c"]]},{"id":"4ce4b247.3fd56c","type":"debug","z":"b027a2d0.3fe03","name":"Blind position","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":955,"y":160,"wires":[]},{"id":"1b6acf79.8f1881","type":"change","z":"b027a2d0.3fe03","name":"dayInfo.today.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.today.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":755,"y":295,"wires":[[]]},{"id":"7b662c5a.558f14","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":485,"y":295,"wires":[["1b6acf79.8f1881"]]},{"id":"87a0e3cf.d0c1","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":485,"y":340,"wires":[["1b6acf79.8f1881"]]},{"id":"856d52f3.d258f","type":"change","z":"b027a2d0.3fe03","name":"dayInfo.tomorrow.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.tomorrow.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":765,"y":385,"wires":[[]]},{"id":"89599717.9ef538","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":485,"y":385,"wires":[["856d52f3.d258f"]]},{"id":"3f878268.26fbee","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":485,"y":430,"wires":[["856d52f3.d258f"]]},{"id":"e22d9caa.0577d","type":"comment","z":"b027a2d0.3fe03","name":"Example 3:","info":"","x":135,"y":70,"wires":[]}]
```

### Example 4 - usage of message properties

As an enhancement of example 3 the example 4. It shows how message instead of contexts could be used and how rule based overrides can be used.

![blind-control-example-4](https://user-images.githubusercontent.com/12692680/60344573-24faec80-99b7-11e9-8b5c-772c7828047d.png)

```json
[{"id":"9fa26434.d7cf28","type":"function","z":"b027a2d0.3fe03","name":"30min 0.5sec","func":"\nconst minutesEachLoop = 30; // minutes to add\nconst loopCycle = 0.5; // seconds delay\nlet timeObj = context.get(\"timeObj\");\n\nif (timeObj && msg.topic.includes('stop')) {\n    clearInterval(timeObj);\n    context.set(\"timeObj\", null);\n    context.set(\"orgtopic\", null);\n    let d = new Date(context.get(\"date\"));\n    node.log(\"STOP    \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ' + d.toISOString());\n    node.status({fill:\"red\",shape:\"ring\",text:\"stopped - \" + d.toLocaleTimeString()});\n    return null;\n} else if (!timeObj && msg.topic.includes('start')) {\n    context.set(\"message\", msg);\n    context.set(\"orgtopic\", msg.topic);\n    let d = new Date();\n    let num = Number(msg.payload) || 0;\n    d.setHours(num);\n    d.setMinutes(0);\n    context.set(\"date\", d.getTime());\n    msg.tsISO = d.toISOString();\n    msg.ts = d.getTime();\n    msg.topic += ' ' + d.toLocaleTimeString();\n    node.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');\n    node.log(\"START   \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.send(msg);\n\n    let timeObj = setInterval(function(){\n        let msg = context.get(\"message\");\n        let topic = context.get(\"orgtopic\");\n        let d = new Date(context.get(\"date\"));\n        //d.setHours(d.getHours()+1);\n        let dt = d.getDate();\n        let dm = d.getMonth();\n        d.setMinutes(d.getMinutes() + minutesEachLoop)\n        d.setDate(dt);\n        d.getMonth(dm);\n        context.set(\"date\", d.getTime());\n        msg.tsISO = d.toISOString();\n        msg.ts = d.getTime();\n        msg.topic = topic + ' ' + d.toLocaleTimeString();\n        node.status({fill:\"green\",shape:\"dot\",text:\"run - \" + d.toLocaleTimeString()});\n        node.log(\"sending \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n        node.send(msg);\n\t}, (1000 * loopCycle));\n    context.set(\"timeObj\", timeObj);\n    node.status({fill:\"green\",shape:\"ring\",text:\"start - \" + d.toLocaleTimeString()});\n    return null;\n}\n\nlet d = new Date(context.get(\"date\"));\nif (!(d instanceof Date) || isNaN(d)) {\n    d = new Date();\n}\nd.setMinutes(d.getMinutes() + 1)\n//d.setHours(d.getHours()+1);\nmsg.tsISO = d.toISOString();\nmsg.ts = d.getTime();\nmsg.topic += ' ' + d.toLocaleTimeString();\nnode.status({fill:\"yellow\",shape:\"dot\",text:\"interposed - \" + d.toLocaleTimeString()});\nnode.log(\"sending interposed msg \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\nnode.send(msg);\nreturn null;","outputs":1,"noerr":0,"x":470,"y":180,"wires":[["e4627512.874a38"]]},{"id":"a4974bae.039688","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"start/stop","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":175,"y":135,"wires":[["9fa26434.d7cf28"]]},{"id":"cb037fe0.a1981","type":"inject","z":"b027a2d0.3fe03","name":"reset","topic":"resetOverwrite","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":150,"y":225,"wires":[["9fa26434.d7cf28"]]},{"id":"78a61a2e.eb8d14","type":"inject","z":"b027a2d0.3fe03","name":"0%","topic":"levelOverwrite","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":150,"y":265,"wires":[["9fa26434.d7cf28"]]},{"id":"6f4e6bba.676104","type":"inject","z":"b027a2d0.3fe03","name":"60%","topic":"levelOverwrite","payload":"0.6","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":150,"y":310,"wires":[["9fa26434.d7cf28"]]},{"id":"8bd86738.d46218","type":"comment","z":"b027a2d0.3fe03","name":"manual overrides:","info":"","x":145,"y":180,"wires":[]},{"id":"917a42ec.46fdc","type":"inject","z":"b027a2d0.3fe03","name":"90%, expire 2,5s","topic":"","payload":"{\"position\":0.9,\"expire\":2500}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":180,"y":360,"wires":[["9fa26434.d7cf28"]]},{"id":"18fb2805.990618","type":"inject","z":"b027a2d0.3fe03","name":"30% Prio 1","topic":"","payload":"{\"position\":0.3,\"prio\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":160,"y":405,"wires":[["9fa26434.d7cf28"]]},{"id":"75acbdf8.e57ae4","type":"inject","z":"b027a2d0.3fe03","name":"100% prio 1","topic":"","payload":"{\"priority\":1, \"position\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":450,"wires":[["9fa26434.d7cf28"]]},{"id":"e4627512.874a38","type":"blind-control","z":"b027a2d0.3fe03","name":"","topic":"","positionConfig":"","outputs":1,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"index":0,"name":"","timeValue":"","timeType":"none","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"10%","levelType":"levelFixed","levelOp":1,"levelOpText":"⭳❗ minimum (oversteer)","validOperandAValue":"windowOpen","validOperandAType":"msg","validOperator":"true","validOperatorText":"is true","validOperandBValue":"windowOpen","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-code-fork\" aria-hidden=\"true\"></i> msg.windowOpen is true</div><div>⭳❗ minimum (oversteer) 10%</div>"},{"index":1,"name":"","timeValue":"5:30","timeType":"entered","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until 5:30</div><div>↕ absolute closed (min)</div>"},{"index":2,"name":"","timeValue":"7:25","timeType":"entered","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"dayInfo.today.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-code-fork\" aria-hidden=\"true\"></i> flow....fo.today.isWeekendOrHoliday is true</div><div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until 7:25</div><div>↕ absolute closed (min)</div>"},{"index":3,"name":"","timeValue":"civilDawn","timeType":"pdsTime","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↥ until civilDawn</div><div>↕ absolute closed (min)</div>"},{"index":4,"name":"","timeValue":"","timeType":"none","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelND","levelOp":1,"levelOpText":"⭳❗ minimum (oversteer)","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"num","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div>⭳✋ reset minimum</div>"},{"index":5,"name":"","timeValue":"","timeType":"none","timeOp":0,"timeOpText":"↥ until","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"50%","levelType":"levelFixed","levelOp":2,"levelOpText":"⭱️❗ maximum (oversteer)","validOperandAValue":"raining","validOperandAType":"msg","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"num","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-code-fork\" aria-hidden=\"true\"></i> msg.raining is true</div><div>⭱️❗ maximum (oversteer) 50%</div>"},{"index":6,"name":"","timeValue":"civilDusk","timeType":"pdsTime","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from civilDusk</div><div>↕ absolute closed (min)</div>"},{"index":7,"name":"","timeValue":"21:25","timeType":"entered","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"dayInfo.tomorrow.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"false","validOperatorText":"is false","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-code-fork\" aria-hidden=\"true\"></i> flow....tomorrow.isWeekendOrHoliday is false</div><div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from 21:25</div><div>↕ absolute closed (min)</div>"},{"index":8,"name":"","timeValue":"23:15","timeType":"entered","timeOp":1,"timeOpText":"↧ from","offsetValue":"","offsetType":"none","multiplier":60000,"timeMinValue":"","timeMinType":"none","offsetMinValue":"","offsetMinType":"none","multiplierMin":60000,"timeMaxValue":"","timeMaxType":"none","offsetMaxValue":"","offsetMaxType":"none","multiplierMax":60000,"levelValue":"closed (min)","levelType":"levelFixed","levelOp":0,"levelOpText":"↕ absolute","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"is true","validOperandBValue":"","validOperandBType":"str","valid2LogOperator":0,"valid2LogOperatorText":"N/A","valid2OperandAValue":"","valid2OperandAType":"msg","valid2Operator":"true","valid2OperatorText":"is true","valid2OperandBValue":"","valid2OperandBType":"num","description":"<div><i class=\"fa fa-clock-o\" aria-hidden=\"true\"></i> ↧ from 23:15</div><div>↕ absolute closed (min)</div>"}],"sunControlMode":"2","sunFloorLength":"0.6","sunMinAltitude":"","sunMinDelta":"0.1","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"1.28","windowBottom":"0","windowAzimuthStart":"70","windowAzimuthEnd":"150","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":690,"y":180,"wires":[["930dc605.f37e98"]]},{"id":"930dc605.f37e98","type":"debug","z":"b027a2d0.3fe03","name":"Blind position","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":935,"y":180,"wires":[]},{"id":"fcebc117.0ba76","type":"change","z":"b027a2d0.3fe03","name":"dayInfo.today.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.today.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":765,"y":255,"wires":[[]]},{"id":"1556f0f6.4c295f","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":495,"y":255,"wires":[["fcebc117.0ba76"]]},{"id":"95f5dcf8.fb3da","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":495,"y":300,"wires":[["fcebc117.0ba76"]]},{"id":"a1a99042.744ee","type":"change","z":"b027a2d0.3fe03","name":"dayInfo.tomorrow.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.tomorrow.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":775,"y":345,"wires":[[]]},{"id":"bb16e80.cec0118","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":495,"y":345,"wires":[["a1a99042.744ee"]]},{"id":"c68f8ed9.67bc4","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":495,"y":390,"wires":[["a1a99042.744ee"]]},{"id":"b29e68ff.8f3f78","type":"comment","z":"b027a2d0.3fe03","name":"Example 4:","info":"","x":115,"y":90,"wires":[]},{"id":"30b1da8a.0f5b36","type":"change","z":"b027a2d0.3fe03","name":"","rules":[{"t":"set","p":"windowOpen","pt":"msg","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":810,"y":435,"wires":[["abc692f9.5abbc"]]},{"id":"18ca7b36.b24635","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"window open","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":525,"y":435,"wires":[["30b1da8a.0f5b36"]]},{"id":"dd4215ea.95feb8","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"window closed","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":"0.5","x":545,"y":480,"wires":[["30b1da8a.0f5b36"]]},{"id":"a07ada0.153bb28","type":"link in","z":"b027a2d0.3fe03","name":"do_refreshBlind_state","links":["abc692f9.5abbc","dba49bc7.8be158"],"x":370,"y":105,"wires":[["9fa26434.d7cf28"]]},{"id":"abc692f9.5abbc","type":"link out","z":"b027a2d0.3fe03","name":"trigger_refreshBlind_state","links":["a07ada0.153bb28"],"x":1015,"y":435,"wires":[]},{"id":"9c71367b.c44268","type":"change","z":"b027a2d0.3fe03","name":"","rules":[{"t":"set","p":"raining","pt":"msg","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":790,"y":525,"wires":[["abc692f9.5abbc"]]},{"id":"4675dee4.3e4d5","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"is raining","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":515,"y":525,"wires":[["9c71367b.c44268"]]},{"id":"b3d664d3.f1ec48","type":"inject","z":"b027a2d0.3fe03","name":"","topic":"is raining","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":"0.7","x":525,"y":570,"wires":[["9c71367b.c44268"]]}]
```

## Additional FAQ

### Why is there no multi blind controller? (FAQ)

The approach is that there is a node for a blind. To reduce the setup overhead it is possible to create a sub-flow with the node per side of the house and thus only have to make the settings once. Settings such as overrides or times can still be configured individually, for example via sub-flow environment variables.

Maybe in this case [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller) is better suited here as well.

### How to define a Temperature Overwrite? (FAQ)

To Overwrite the sun-.calculation by a temperature threshold can be archived by using a conditional rule.

### How do I achieve that when opening a window the blind opens? (FAQ)

This can be archived in different ways:

- using override possibilities with different priority
- using conditional rules

## Other

For bugs, questions and feature requests please use the
[GitHub Issues](https://github.com/rdmtc/node-red-contrib-sun-position/issues).
