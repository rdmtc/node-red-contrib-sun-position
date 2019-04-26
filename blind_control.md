# Blind Controller

## blind-control

Used to control a blind with many possibilities. This can be time-dependent and it can calculate the blind position based on the current position of the sun to limit the sun light To limit the sunlight on the floor of a window.

![blind-control](images/blind-control-example.png?raw=true)

### Node settings

#### general

- **Position Konfiguration** connects to the central configuration node, which contains the current position, but also handles a lot of internal shared functions. Thus, this configuration is always needed, even if the sense does not always open up.
- **topic** if defined, the topic of any outgoing message will be set to this value, otherwise the topic of the ingoing message will not changed
- **name** the name of the node

#### blind settings

![blind-control](images/blind-control-settings-2.png?raw=true)

- **Increment** defines the minimum degree the blind position can be controlled
- **open position** The value for maximum open degree of a blind.
- **closed position** The value for minimum close degree of a blind.

All values could be floating point values.

#### rule settings

![blind-control](images/blind-control-settings-3.png?raw=true)

- **default position** The value which will be used if no other value given by condition, time or sun applies.

![blind-control](images/blind-control-settings-4.png?raw=true)

 - If a rule applies, the blind position defined by the rule will be used.
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

![blind-control](images/blind-control-settings-5.png?raw=true)

- **expire** the duration in minutes a manual setting will remain is place. If not defined, there will be no default expiring of overrides.

#### sun settings

Sun control is only active if no override and no rule applies!

![blind-control](images/blind-control-settings-6.png?raw=true)

If sun-control checkbox is not checked, the defined **default position** will be used.

![blind-control](images/blind-control-settings-7.png?raw=true)

If the sun control is active and no other rule or override matches, the node calculates the appropriate blind position to restrict the amount of direct sunlight entering the room. This calculation includes:

- Determination of whether direct sunlight is entering the room based on the orientation of the blind and the azimuth of the sun
- Dimensions of the window and the current altitude of the sun.
- consideration of weather conditions against defined thresholds

- **start** The azimuth of the sun, when the sun start falls into the window.
- **end** The azimuth of the sun, when the sun no longer falls into the window.

under the simplest assumption starting from the bearing representing the perpendicular of the window to geographical north:

- start = orientation - 90
- end = orientation + 90

- **top** Measurement from the floor to top of the window covered by the blind.
- **bottom** Measurement from the floor to bottom of the window covered by the blind.
- **length on the floor** (optional) the extent to which direct sunlight is to be allowed into the room through the window, defined as a length on the floor.
- **min altitude threshold** (optional) minimum altitude of the sun for determination of blind position.
- **min position** minimum blind position if the sun is in the window, the min altitude threshold is given and weather conditions given.
- **max position** maximum blind position if the sun is in the window, the min altitude threshold is given and weather conditions given.

![blind-control](images/blind-control-settings-8.png?raw=true)

![blind-control](images/blind-control-settings-9.png?raw=true)

- **Cloud**, **cloud Operator**, **Threshold** allows to define a blind position which should be used in a given condition to be used instead of the calculated value by the sun. Typical use-case is a weather condition but it is not limited to that.
  - the value for **Threshold** can only be entered if needed by selected **operator**
  - Example: If the **Cloud** is a property which contains a numerical value representing the percentage of sky occluded by clouds and an operator *greater than or equal* is used with a **Threshold** a numerical value representing the maximum percentage of sky occluded by clouds. Then if the **cloud** value exceeds the **Threshold** the **blind position** will be used instead of the position calculated by the sun.
  - If the values of  **Cloud** or **Threshold** comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages. But this evaluation is only considered by messages when no rule active.
  - **blind position** the blind position which should be used instead of the calculated value by the sun if the defined expression for **cloud** with **operator** (and maybe **Threshold**) is **true**.

### Node Input

The Input is for triggering the calculation and for setting overwrites of the blind position.

- **force output** an incoming message with a property `msg.forceOut`, `msg.payload.forceOut` of value true will force to send the output message every time. Otherwise a new output message will only be send if the blind position or the reason for the blind position has changed to the last out message. (This will not work if no blind position is available.)
- **reset** an incoming message with `msg.reset` is `true` or `msg.payload.reset` is `true` or where the `msg.topic` contains `resetOverwrite` and the value of `msg.payload` = `true` will reset any existing overrides.
  - **position** an incoming message with a numeric property of `msg.blindPosition`, `msg.position`, `msg.level`, `msg.blindLevel`,  `msg.payload.blindPosition`, `msg.payload.position`, `msg.payload.level`, `msg.payload.blindLevel` or where the  `msg.topic` contains `manual` or `levelOverwrite` and the value of `msg.payload` is a numeric value will override any of rule/sun/.. based level of the blind.
    - If an override is already active a new message changes the blind level if the **priority** of the existing override allows this.
      - The override could also limited if  a property `msg.ignoreSameValue`, `msg.payload.ignoreSameValue` is set to true an existing override will only be changed if the position value differs from the active override position.
    - Except `-1` the position must be a valid blind Position as defined in the node settings or otherwise it will throw an error.
    - The **position** of the special value of `-1` will set the node in override mode without sending any message out until override **position** is changed, override is **expired** or **reset**.
      - Example: This could be useful if a blind is controlled by an external button, where not known the blind position after button press. In this case the Button-event can used to trigger the override-mode of the node without knowing the real **position** of the blind.
  - **priority** (optional) Enables to handles overrides of different priorities. Default value will be `0`.
    - A message property `msg.prio`, `msg.payload.prio`, `msg.priority` or `msg.payload.priority`
    - or when the `msg.topic` contains `prio` or `alarm` and the value of `msg.payload` is a valid numeric value
    - A `boolean` value `true` is considered as numeric `1`
  - **expire** (optional) Enables to define an override as automatically expiring. As default value for overrides of priority `0` the value in the settings is be used. Overrides with a priority higher than `0` will not expire by default.
    - A message property `msg.expire` or `msg.payload.expire`
    - or when the `msg.topic` contains `expire` and the value of `msg.payload` is a valid numeric value
    - The value must be a time in milliseconds which is greater than 100. Otherwise the override will be set to not expiring.
    - If an override is already active a new message with **expire** can change the existing expire behavior if the **priority** of the existing override allows this.

Useful to know:

- If a **reset** and a new override is set in the same message, any existing override will be reset and the new will be set afterwards. In this scenario no existing override **priority** will be considered.
- An already existing Override can only be changed if the prio of the existing is `0` (default - can always be changed) or the message object has a **priority** set with a value that is equal or greater than the existing override. If that is given the **expire**, **priority** or **position** can be changed.
- There are a special configuration for rules with a condition, with which it can be prevented to allow overrides.

### Node Output

An output can be triggered by an incoming message or by an expiring timeout from an override. If the trigger is a incoming message, the incoming message will be forwarded to the output with the following changes:

- `msg.topic` if a topic is defined this topic will be used, otherwise no change of the topic from the incoming message
- `msg.payload` the payload will be set to the new blind level (numeric value)
- `msg.blindCtrl` a object will be added with the following properties:
  - `msg.blindCtrl.reason` object for the reason of the current blind position
    - `msg.blindCtrl.reason.code` a number representing the reason for the blind position. The possible codes are
      - **1** - defined default blind position, because no other rule/condition/behavior
      - **2** - manual override
      - **3** - manual override - expiring
      - **4** - based blind position based by rule
      - **5** - calculated blind position by sun control is below defined minimum blind position (minimum blind position used)
      - **6** - calculated blind position by sun control is above defined maximum blind position (maximum blind position used)
      - **7** - Sun below altitude threshold
      - **8** - sun is not in window, default blind position is used
      - **9** - blind position calculated by sun position
      - **10** - defined cloud condition applies
      - **11** - (enhanced settings) blind position calculated by sun position was not used caused by smooth settings
    - `msg.blindCtrl.reason.state` a short text (same as node status text) representing the reason for the blind position
    - `msg.blindCtrl.reason.description` a text, describe the reason for the blind position
  - `msg.blindCtrl.blind` a object containing all blind settings, only the most interesting ones are explained here
    - `msg.blindCtrl.blind.level` - equal to `msg.payload`
    - `msg.blindCtrl.blind.overwrite`
      - `msg.blindCtrl.blind.overwrite.active` - is `true` when overwrite is active, otherwise `false`
      - `msg.blindCtrl.blind.overwrite.priority` - the priority of the override
      - `msg.blindCtrl.blind.overwrite.expires` -  is `true` when overwrite expires [exists only if overwrite active]
      - `msg.blindCtrl.blind.overwrite.expireTs` - a timestamp (UNIX) when overwrite expiring [exists only if overwrite expires]
      - `msg.blindCtrl.blind.overwrite.expireDate` - a timestamp (String) when overwrite expiring [exists only if overwrite expires]
  - `msg.blindCtrl.rule` - exists only if no override is active
      - `msg.blindCtrl.rule.active` - `true` if a rule applies
      - `msg.blindCtrl.rule.ruleId` - number of the rule who applies (is `-1` if no rule has applied)
      - `msg.blindCtrl.rule.level` - the blind level defined by the rule [exists only if a rule applies]
      - `msg.blindCtrl.rule.conditional` - `true` if the rule has a condition [exists only if a rule applies]
      - `msg.blindCtrl.rule.timeLimited` - `true` if the rule has a time [exists only if a rule applies]
  - `msg.blindCtrl.sunPosition` - calculated sub-position data - exists only if sun position is calculated
    - `msg.blindCtrl.sunPosition.InWindow` - `true` if sun is in window, otherwise `false`
  - `msg.blindCtrl.cloud` - object containing cloud data, exists only if override by cloud is activated!
    - `msg.blindCtrl.cloud.isOperative` - `true` if it is active and defined limit is applicable otherwise `false`


### Node Status

The node status representing the value of the `msg.blindCtrl.reason.state` of the output.
The color of the output is as following:
- red - any error
- blue - override active
- grey - level by rule
- green - default value or sun not in window
- yellow - any other

The shape indicates whether the blind is fully closed or not.

## Samples
