# clock-timer Controller

## clock-timer

Used to control a flow time based with many possibilities. This can be used to switch something which is time-dependent. It is ideal for dimmers, Christmas lights, ...

![clock-timer](https://user-images.githubusercontent.com/12692680/70033610-1e991e00-15b0-11ea-8035-8a74164f7d64.png)

### Table of contents

- [clock-timer Controller](#clock-timer-controller)
  - [clock-timer](#clock-timer)
    - [Table of contents](#table-of-contents)
    - [The node](#the-node)
    - [Node settings](#node-settings)
      - [general settings](#general-settings)
      - [rule settings](#rule-settings)
      - [overwrite settings](#overwrite-settings)
      - [special settings](#special-settings)
    - [Node Input](#node-input)
    - [Node Output](#node-output)
    - [Node Status](#node-status)
  - [rules](#rules)
    - [rules execution in detail](#rules-execution-in-detail)
    - [rules example](#rules-example)
    - [time rules additional constraints](#time-rules-additional-constraints)
  - [Samples](#samples)
  - [Other](#other)

### The node

The node was created out of the desire to be able to use the [blind-control node](blind_control.md) also for dimmers or other use-cases. So this node is a simplified [blind-control node](blind_control.md) without sun based control. In contrast, this node offers the possibility to have any payload.

### Node settings

#### general settings

![clock-timer-settings-1](https://user-images.githubusercontent.com/12692680/57134454-8c753100-6da6-11e9-95e9-bdff86f1e3d4.png)

- **Position Configuration** connects to the central configuration node, which contains the current position, but also handles a lot of internal shared functions. Thus, this configuration is always needed, even if the sense does not always open up.
- **name** the name of the node

#### rule settings

![clock-timer-settings-2](https://user-images.githubusercontent.com/12692680/70568882-138a5300-1b99-11ea-97b4-011f7e7d8819.png)

- **default payload** The value which will be used if no other value given by rule, or override.
- **topic** if defined, the default topic of any outgoing message will be set to this value, otherwise the topic of the ingoing message will be used

![clock-timer-settings-3](https://user-images.githubusercontent.com/12692680/70744707-84a94200-1d22-11ea-8fc4-f781e6202901.png)

- If a rule has a condition, the rule only applies if the condition matches.
  - For some conditions a comparisons needs to be defined.
  - If the values of comparison comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages.
- If a rule has a time limitation
  - `until` the first rule is taken, where the given time is greater than the current time.
  - `from` the last rule is taken, where the given time is less than the current time.
- If a rule will applied the defined payload to the rule will be send.

- For some time definitions an Offset could be added (or be reduced with a negative value)

#### overwrite settings

![clock-timer-settings-4](https://user-images.githubusercontent.com/12692680/70744825-d5209f80-1d22-11ea-90c1-1d7e13b13d91.png)

- **expire** the duration in minutes a manual setting will remain is place. If not defined, there will be no default expiring of overrides.

![clock-timer-settings-5](https://user-images.githubusercontent.com/12692680/70744896-fe413000-1d22-11ea-8085-0d37847d74dc.png)

#### special settings

- **output** here is configurable if the node has one single (default) or two outputs. See [Node Output](#node-output) for further details.
- **auto trigger** Typically the calculation will be triggered by an incoming message or by an expiring timeout from an override. Additionally the node can be configured to have an auto trigger time.
  - If such a time is configured the node will be trigger a new calculation automatically at the next possible time, taking the following times into account:
    - a time for a rule or the next rule occurs or expires
    - the configured time span in the node
  - To thus in the most cases it makes no sense to enter a short period (less than 15min) of auto trigger time in the configuration, because the node automatically shortens the time if necessary.
  - Please note that the node cannot react to changes in times that are configured via a context. If for example times or offsets configured by using a flow or global context, the auto trigger would not change the next trigger time.
- **start delay** Sometimes on node-red start (or flow re deploy) the node should not send any output before the system has settled (contexts are set, incoming messages processed, ...). To thus it is possible to define a delay time. Setting a time will only block the node to send any output until the time has reached to the first output. All calculations still will be made.

### Node Input

The Input is for triggering the calculation and for setting overwrites of the blind position.

- **reset** an incoming message with `msg.reset` or `msg.resetOverwrite` is `true` or where the `msg.topic` contains `resetOverwrite` and the value of `msg.payload` = `true` will reset any existing overrides.
  - **importance** (optional) when a importance is given the existing override will only reset if the importance of the message is __equal or higher__ then the importance of the existing override. For a reset, the same applies to the importance as for the overrise (see below).
- **override** an incoming message with a topic including `manual` or `overwrite` will override any of rule based or default payload.
  - If an override is already active a new message changes the payload if the **importance** of the existing override allows this.
- **importance** (optional) Enables to handles overrides of different importance's. Default value will be `0`.
  - A message property `msg.importance`, `msg.privilege` with a valid numeric value (due to backward compatibility also `msg.priority` and `msg.prio` is possible)
  - A `boolean` value `true` is considered as numeric `1`.
  - A higher number is a higher importance. So importance 1 is the lowest importance.

- **expire** (optional) Enables to define an override as automatically expiring. As default value the value in the settings is be used.
  - A message property `msg.expire`
  - The value must be a time in milliseconds which is greater than 100. Otherwise the override will be set to not expiring.
  - If an override is already active a new message with **expire** can change the existing expire behavior if the **importance** of the existing override allows this.

Useful to know:

- If a **reset** and a new override is set in the same message, any existing override will be reset and the new will be set afterwards. In this scenario no existing override **importance** will be considered.
- An already existing Override can only be changed if the importance of the existing is `0` (default - can always be changed) or the message object has a **importance** set with a value that is equal or greater than the existing override. If that is given the **expire**, **importance** or **position** can be changed.
  - if additional **exactImportance** is defined, then the message importance must be __equal__ to the existing importance.
- A message where the topic contains `triggerOnly` or with an property `msg.trigger` which is true can not act as override.


### Node Output

In the enhanced option are configurable if the node has one single (default) or two outputs.

An output can be triggered by an incoming message, by an expiring timeout from an override or by auto trigger. If the trigger is a incoming message, the incoming message will be forwarded to the first output if the rule or payload has changed.

The incoming message is changed as following:

- `msg.topic` if a topic is defined this topic will be used, otherwise no change of the topic from the incoming message
- `msg.payload` the payload will be set to the new defiend payload

If the output is set to single, an object property `msg.timeCtrl` will be attached to the message and forwarded to the first output.
If the node is configured with two outputs this object is set as the `msg.payload` property of the message that is send to the second output. The difference is also, that the second output will give this object every time a recalculation will is triggered, where the first output only send a message on blind position change.


{"rule":{"active":false,"id":-1},"reason":{"code":1,"state":"default","description":"position is set to default position because no other rule matches","stateComplete":"1578080767456 - default"},"timeClock":{"payloadDefault":"","payloadDefaultType":"date","payloadDefaultTimeFormat":0,"payloadDefaultOffset":0,"payloadDefaultOffsetType":"none","payloadDefaultOffsetMultiplier":60000,"topic":"default","overwrite":{"active":false,"expireDuration":null,"importance":0}}}


- `timeCtrl` a object will be added add as `msg.timeCtrl` property on single output mode or send as `msg.payload` on slit output mode with the following properties:
  - `timeCtrl.reason` - __object__ - for the reason of the current blind position
    - `timeCtrl.reason.code` - __number__ - representing the reason for the blind position. The possible codes are
      - **NaN** - start delay is setup and node is in this time
      - **-1** - the rules was not evaluated, maybe override is active
      - **1**  - defined default payload, because no other rule/condition/behavior
      - **2**  - manual override
      - **3**  - manual override - expiring
      - **4**  - based blind position based by rule
    - `timeCtrl.reason.state` - __string__ - short text representing the reason for the blind position (same as node status text)
    - `timeCtrl.reason.description` - __string__ - describe the reason for the blind position
  - `timeCtrl.timeClock` - __object__ - containing all settings, only the most interesting ones are explained here
    - `timeCtrl.timeClock.payloadDefault` - __any__ - the defined default payload
    - `timeCtrl.timeClock.payloadDefaultType` - __string__ - the type of the default payload
    - `timeCtrl.timeClock.payloadDefault...` - other settings of the default payload
    - `timeCtrl.timeClock.topic` - __string__ - the defined default topic
    - `timeCtrl.timeCtrl.overwrite` - __object__
      - `timeCtrl.timeCtrl.overwrite.active` - __boolean__ - is `true` when overwrite is active, otherwise `false`
      - `timeCtrl.timeCtrl.overwrite.importance` - __number__ - the importance of the override
      - `timeCtrl.timeCtrl.overwrite.expires` - __boolean__ - is `true` when overwrite expires [exists only if overwrite active]
      - `timeCtrl.timeCtrl.overwrite.expireTs` - __number__ - a timestamp (UNIX) when overwrite expiring [exists only if overwrite expires]
      - `timeCtrl.timeCtrl.overwrite.expireDate` - __string__ - a timestamp (String) when overwrite expiring [exists only if overwrite expires]
  - `timeCtrl.rule` - __object__ - exists only if no override is active
    - `timeCtrl.rule.active` - __boolean__ - `true` if a rule applies
    - `timeCtrl.rule.id` - __number__ - id of the rule who applies (is `-1` if no rule has applied)
    - `timeCtrl.rule.level` - __number__ - the blind level defined by the rule if level type is __absolute__, otherwise the defined default blind position [exists only if a rule applies]
    - `timeCtrl.rule.conditional` - __boolean__ - `true` if the rule has a condition [exists only if a rule applies]
    - `timeCtrl.rule.timeLimited` - __boolean__ - `true` if the rule has a time [exists only if a rule applies]
    - `timeCtrl.rule.conditon` - __object__ with additional data about the condition [exists only if `timeCtrl.rule.conditional` is true] - good for debugging purpose
    - `timeCtrl.rule.time` - __object__ with additional data about the time [exists only if `timeCtrl.rule.timeLimited` is true] - good for debugging purpose
    - `timeCtrl.rule.hasMinimum` - __boolean__ - is __true__ if to the level of the rule an additional __minimum__ rule will be active, otherwise __false__
    - `timeCtrl.rule.levelMinimum` - __number__ - exists only if `timeCtrl.rule.hasMinimum` is __true__ and then contains then the blind level defined by the rule
    - `timeCtrl.rule.hasMaximum` - __boolean__ - is __true__ if  to the level of the rule an additional __maximum__ rule will be active, otherwise __false__
    - `timeCtrl.rule.levelMinimum` - __number__ - exists only if `timeCtrl.rule.hasMaximum` is __true__ and then contains then the blind level defined by the rule
  - `timeCtrl.autoTrigger` - __object__ - with additional data about the autoTrigger [exists only if auto trigger is enabled in the settings]
    - `timeCtrl.autoTrigger.deaultTime` - __number__ - in milliseconds the auto trigger time of the settings
    - `timeCtrl.autoTrigger.time` - __number__ - in milliseconds the next auto trigger time (could be less than the dined time in the settings)
    - `timeCtrl.autoTrigger.type` - __number__ - the type of the next auto trigger
      - **0**  - equal to defined `timeCtrl.autoTrigger.deaultTime`
      - **1**  - by current rule end or `timeCtrl.autoTrigger.deaultTime`
      - **2**  - by next rule or `timeCtrl.autoTrigger.deaultTime`

### Node Status

The node status representing the value of the `timeCtrl.reason.state` of the output.
The color of the output is as following:

- red - any error or a start delay is set and node is currently in this time
- blue - override active
- grey - payload by rule
- green - default value
- yellow - any other

## rules

The rules are not easy to understand.
![rule-edit-0](https://user-images.githubusercontent.com/12692680/75869514-f4066d80-5e09-11ea-9130-a5ca4b804bf0.png)

There are basically 4 generic types of rules:

- no time and no condition rule
![rule-type-1](https://user-images.githubusercontent.com/12692680/75872780-12bb3300-5e0f-11ea-9c13-f086415dde46.png)
  - a rule with no time and no condition will be always active if checked.
  - such rules are evaluated in the order of time __until__ and time __from__ rules
- a rule with a condition - conditional rule
![rule-type-2](https://user-images.githubusercontent.com/12692680/75876361-db03b980-5e15-11ea-9f47-2d72ff4ab43d.png)
  - a rule with a condition will only be active if the condition matches, otherwise the rule will be ignored
  - rules with only a condition are evaluated in the order of time __until__ and time __from__ rules
- a rule with a given time - time rule
![rule-type-3](https://user-images.githubusercontent.com/12692680/75883648-a1d24600-5e23-11ea-9536-3bf03a83c2ac.png)
  - time rules differ again in 2 ways
    - __until__ time rules
      - rules will be active from Midnight __until__ the given time
      - the first matching __until__ rule with a time later than the current time will be selected
    - __from__ time rules
      - rules will be active __from__ given time to Midnight
      - the last matching __from__ rule with a time earlier than the current time will be considered
      - __from__ rules only considered if no __until__ rule was selected
- a rule with a condition and a given time
![rule-type-4](https://user-images.githubusercontent.com/12692680/75883859-02618300-5e24-11ea-8f73-720b8867fdea.png)
  - these type of rules are a combination. The rules will only be considered if the condition matches and then it act as a normal time rule. Otherwise it will be ignored.

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
3. If no rule was found with 1st and 2nd, the default payload value for the node is used.

The rules in the range between the last to rule and the first rule are evaluated only if no other rule is active. This can be used to allow special control during this time.

### rules example

For examples, please see [blind control](blind_control.md). The clock-timer node is very similar to the blind-control node.

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

For examples, please see [blind control](blind_control.md). The clock-timer node is very similar to the blind-control node.

## Other

For bugs, questions and feature requests please use the
[GitHub Issues](https://github.com/rdmtc/node-red-contrib-sun-position/issues).
