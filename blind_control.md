# Blind Controller

## blind-control

Used to control a blind with many possibilities. This can be time-dependent and it can calculate the blind position based on the current position of the sun to limit the sun light To limit the sunlight on the floor of a window.

![blind-control](images/appearance2.png?raw=true)

### Node settings

#### general

![blind-control-settings-1](https://user-images.githubusercontent.com/12692680/57134454-8c753100-6da6-11e9-95e9-bdff86f1e3d4.png)

- **Position Konfiguration** connects to the central configuration node, which contains the current position, but also handles a lot of internal shared functions. Thus, this configuration is always needed, even if the sense does not always open up.
- **topic** if defined, the topic of any outgoing message will be set to this value, otherwise the topic of the ingoing message will not changed
- **name** the name of the node

#### blind settings

![blind-control-settings-2](https://user-images.githubusercontent.com/12692680/57134458-8d0dc780-6da6-11e9-80c3-2d8e130bd8fb.png)

- **Increment** defines the minimum degree the blind position can be controlled
- **open position** The value for maximum open degree of a blind.
- **closed position** The value for minimum close degree of a blind.

All values could be floating point values.

#### rule settings

![blind-control-settings-3](https://user-images.githubusercontent.com/12692680/57134461-8d0dc780-6da6-11e9-8235-a5bd141fef99.png)

- **default position** The value which will be used if no other value given by condition, time or sun applies.

![blind-control-settings-4](https://user-images.githubusercontent.com/12692680/57134463-8d0dc780-6da6-11e9-9019-1cb4ed85e756.png)

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

![blind-control-settings-5](https://user-images.githubusercontent.com/12692680/57134465-8d0dc780-6da6-11e9-97a6-8f3b61ed2de9.png)

- **expire** the duration in minutes a manual setting will remain is place. If not defined, there will be no default expiring of overrides.

#### sun settings

Sun control is only active if no override and no rule applies!

![blind-control-settings-6](https://user-images.githubusercontent.com/12692680/57134466-8da65e00-6da6-11e9-84d2-425ca0be5e3d.png)

If sun-control checkbox is not checked, the defined **default position** will be used.

![blind-control-settings-7](https://user-images.githubusercontent.com/12692680/57134469-8da65e00-6da6-11e9-979b-ca875da064d7.png)

The sun control (maximize or restrict sunlight) is only active, if no other rule or override matches.
  - Requirements that should be valid with a higher priority should be set up as rules.
    - Example: if the blind should set to a level if a temperature threshold exceeded, this could be setup as rule

##### maximize sunlight (Winter)

In this mode the blind will set to **min position** if sun is not in the window.
If the sun is in the window and any oversteer data are setup and met the blind will set to the defined oversteer blind position.
If the sun is in the window in any other case the blind level is set to **max position**.

##### restrict sunlight (Summer)

In this mode if no other rule or override matches, the node calculates the appropriate blind position to restrict the amount of direct sunlight entering the room.

This calculation includes:

- Determination of whether direct sunlight is entering the room based on the orientation of the blind and the azimuth of the sun
- Dimensions of the window and the current altitude of the sun.
- consideration of weather conditions against defined thresholds

- **start** The azimuth (in degree) of the sun, when the sun start falls into the window.
- **end** The azimuth (in degree) of the sun, when the sun no longer falls into the window.

under the simplest assumption starting from the bearing representing the perpendicular of the window to geographical north:

- start = orientation - 90 degree
- end = orientation + 90 degree

- The units of length is measure agnostic, They must be all in the same unit, but it does not matter which unit is used. If as lengths are used meter all lengths must be in meter. If used centimeters, all must be in centimeter.
- **top** Measurement from the floor to top of the window covered by the blind.
- **bottom** Measurement from the floor to bottom of the window covered by the blind.
- **length on the floor** (optional) the extent to which direct sunlight is to be allowed into the room through the window, defined as a length on the floor.
- **min altitude threshold** (optional) minimum altitude (in degree) of the sun for determination of blind position.
- **min position** minimum blind position if the sun is in the window, the min altitude threshold is given and weather conditions given.
- **max position** maximum blind position if the sun is in the window, the min altitude threshold is given and weather conditions given.

![blind-control-settings-8](https://user-images.githubusercontent.com/12692680/57134470-8da65e00-6da6-11e9-95a9-41eab8f6a6d3.png)

![blind-control-settings-9](https://user-images.githubusercontent.com/12692680/57134453-8c753100-6da6-11e9-9285-74e98e17f62b.png)

- **oversteer**, **oversteer Operator**, **Threshold** allows to define a blind position which should be used in a given condition to be used instead of the calculated value by the sun. Typical use-case is a weather condition but it is not limited to that.
  - the value for **Threshold** can only be entered if needed by selected **operator**
  - Example: If the **oversteer** is a property which contains a numerical value representing the percentage of sky occluded by clouds and an operator *greater than or equal* is used with a **Threshold** a numerical value representing the maximum percentage of sky occluded by clouds. Then if the **oversteer** value exceeds the **Threshold** the **blind position** will be used instead of the position calculated by the sun.
  - If the values of **oversteer** or **Threshold** comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages.
  - **blind position** the blind position which should be used instead of the calculated value by the sun if the defined expression for **oversteer** with **operator** (and maybe **Threshold**) is **true**.

### Node Input

The Input is for triggering the calculation and for setting overwrites of the blind position.

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
- an incoming message with `msg.mode`, `msg.payload.mode` or where the `msg.topic` contains `setMode` and the value of `msg.payload` is a valid number, will allow to set the mode of the sun control.
  - a value of `0` will deactivate sun control, `1` will set to maximize sunlight (Winter) and `2` will set to restrict sunlight (Summer).
  - The maximum adjustable mode is influenced by the settings of the node. The mode can not be set to restrict sunlight (`2`) if in the settings is setup only maximize sunlight (`1`).

### Node Output

In then enhanced option are configurable if the node has one single (default) or two outputs.


An output can be triggered by an incoming message or by an expiring timeout from an override. If the trigger is a incoming message, the incoming message will be forwarded to the first output if the blind position has changed.

The incoming message is changed as following:
- `msg.topic` if a topic is defined this topic will be used, otherwise no change of the topic from the incoming message
- `msg.payload` the payload will be set to the new blind level (numeric value)

If the output is set to single, an object property `msg.blindCtrl` will be attached to the message and forwarded to the first output.
If the node is configured with two outputs this object is set as the `msg.payload` property of the message that is send to the second output. The difference is also, that the second output will give this object every time a recalculation will is triggered, where the first output only send a message on blind position change.

- `blindCtrl` a object will be added add as `msg.blindCtrl` property on single output mode or send as `msg.payload` on slit output mode with the following properties:
  - `blindCtrl.reason` object for the reason of the current blind position
    - `blindCtrl.reason.code` a number representing the reason for the blind position. The possible codes are
      - **1** - defined default blind position, because no other rule/condition/behavior
      - **2** - manual override
      - **3** - manual override - expiring
      - **4** - based blind position based by rule
      - **5** - calculated blind position by sun control is below defined minimum blind position (minimum blind position used)
      - **6** - calculated blind position by sun control is above defined maximum blind position (maximum blind position used)
      - **7** - Sun below altitude threshold
      - **8** - sun is not in window, default blind position is used
      - **9** - blind position calculated by sun position
      - **10** - defined oversteer condition applies
      - **11** - (enhanced settings) blind position calculated by sun position was not used caused by smooth settings
      - **12** - sun is in window (maximize mode), max blind position used
      - **13** - sun is not in window (maximize mode), min blind position used
    - `blindCtrl.reason.state` a short text (same as node status text) representing the reason for the blind position
    - `blindCtrl.reason.description` a text, describe the reason for the blind position
  - `blindCtrl.blind` a object containing all blind settings, only the most interesting ones are explained here
    - `blindCtrl.blind.level` - the new blind level (numeric value) - equal to `msg.payload` of the first output message.
    - `blindCtrl.blind.levelInverse` - if `blindCtrl.blind.overwrite.active` is true, the value of `blindCtrl.blind.levelInverse` will be equal to the value of `blindCtrl.blind.level`, otherwise it will be the inverse to `blindCtrl.blind.level`. This means if `blindCtrl.blind.level` indicates how much the blind is open, then `blindCtrl.blind.levelInverse` indicates how much the blind is closed. So if `blindCtrl.blind.level` is equal to **min position**, `blindCtrl.blind.levelInverse` will be **max position**.
    - `blindCtrl.blind.overwrite`
      - `blindCtrl.blind.overwrite.active` - is `true` when overwrite is active, otherwise `false`
      - `blindCtrl.blind.overwrite.priority` - the priority of the override
      - `blindCtrl.blind.overwrite.expires` -  is `true` when overwrite expires [exists only if overwrite active]
      - `blindCtrl.blind.overwrite.expireTs` - a timestamp (UNIX) when overwrite expiring [exists only if overwrite expires]
      - `blindCtrl.blind.overwrite.expireDate` - a timestamp (String) when overwrite expiring [exists only if overwrite expires]
  - `blindCtrl.rule` - exists only if no override is active
    - `blindCtrl.rule.active` - `true` if a rule applies
    - `blindCtrl.rule.ruleId` - number of the rule who applies (is `-1` if no rule has applied)
    - `blindCtrl.rule.level` - the blind level defined by the rule [exists only if a rule applies]
    - `blindCtrl.rule.conditional` - `true` if the rule has a condition [exists only if a rule applies]
    - `blindCtrl.rule.timeLimited` - `true` if the rule has a time [exists only if a rule applies]
    - `blindCtrl.rule.conditon` - __object__ with additional data about the condition [exists only if `blindCtrl.rule.conditional` is true] - good for debugging purpose
    - `blindCtrl.rule.time` - __object__ with additional data about the time [exists only if `blindCtrl.rule.timeLimited` is true] - good for debugging purpose
  - `blindCtrl.sunPosition` - calculated sub-position data - exists only if sun position is calculated
    - `blindCtrl.sunPosition.InWindow` - `true` if sun is in window, otherwise `false`
    - `blindCtrl.sunPosition.oversteer` - object containing oversteer data!

### Node Status

The node status representing the value of the `blindCtrl.reason.state` of the output.
The color of the output is as following:

- red - any error
- blue - override active
- grey - level by rule
- green - default value or sun not in window
- yellow - any other

The shape indicates whether the blind is fully closed or not.

## Samples

Example for a time-control to open blind on civilDawn, but not before 6 o'clock and close blind on civilDusk, but not later than 23:00 o clock:

![blind-control-example-1](https://user-images.githubusercontent.com/12692680/57134447-867f5000-6da6-11e9-81dc-24fbf58dcd15.png)

```
[{"id":"955111e1.50585","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"650223e.daba8dc","outputs":"1","blindIncrement":0.01,"blindOpenPos":1,"blindClosedPos":0,"blindPosReverse":false,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"timeType":"entered","timeValue":"6:00","timeOp":"0","timeOpText":"until","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"none","validOperandAValue":"","validOperator":"true","validOperatorText":"is true","validOperandBType":"num","validOperandBValue":""},{"timeType":"pdsTime","timeValue":"civilDawn","timeOp":"0","timeOpText":"until","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"none","validOperandAValue":"","validOperator":"true","validOperatorText":"is true","validOperandBType":"num","validOperandBValue":""},{"timeType":"pdsTime","timeValue":"civilDusk","timeOp":"1","timeOpText":"from","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"none","validOperandAValue":"","validOperator":"true","validOperatorText":"is true","validOperandBType":"num","validOperandBValue":""},{"timeType":"entered","timeValue":"23:00","timeOp":"1","timeOpText":"from","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"none","validOperandAValue":"","validOperator":"true","validOperatorText":"is true","validOperandBType":"num","validOperandBValue":""}],"tsCompare":"0","sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","x":440,"y":2385,"wires":[["afa7898a.2362b8"]]},{"id":"dc2734a.e0332c8","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":235,"y":2385,"wires":[["955111e1.50585"]]},{"id":"afa7898a.2362b8","type":"debug","z":"d7bd7fb6.a0c13","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":655,"y":2385,"wires":[]},{"id":"650223e.daba8dc","type":"position-config","z":"","name":"","isValide":"true","longitude":"0","latitude":"0","angleType":"deg","timezoneOffset":-60}]
```

similar example with additional different times for weekend:
```
[{"id":"65945da6.f4c7d4","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"d2b0ae0f.90e0c","outputs":1,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"14400000","rules":[{"timeType":"entered","timeValue":"6:30","timeOp":"0","timeOpText":"until","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"none","validOperandAValue":"","validOperator":"true","validOperatorText":"is true","validOperandBType":"str","validOperandBValue":""},{"timeType":"entered","timeValue":"7:25","timeOp":"0","timeOpText":"until","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"global","validOperandAValue":"dayInfo.today.isWeekendOrHoliday","validOperator":"true","validOperatorText":"is true","validOperandBType":"str","validOperandBValue":""},{"timeType":"pdsTime","timeValue":"civilDawn","timeOp":"0","timeOpText":"until","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"none","validOperandAValue":"","validOperator":"true","validOperatorText":"is true","validOperandBType":"str","validOperandBValue":""},{"timeType":"pdsTime","timeValue":"civilDusk","timeOp":"1","timeOpText":"from","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"none","validOperandAValue":"","validOperator":"true","validOperatorText":"is true","validOperandBType":"str","validOperandBValue":""},{"timeType":"entered","timeValue":"22:35","timeOp":"1","timeOpText":"from","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"none","validOperandAValue":"","validOperator":"true","validOperatorText":"is true","validOperandBType":"str","validOperandBValue":""},{"timeType":"entered","timeValue":"23:15","timeOp":"1","timeOpText":"from","levelType":"levelFixed","levelValue":"closed (min)","offsetType":"none","offsetValue":"","multiplier":"1","validOperandAType":"global","validOperandAValue":"dayInfo.tomorrow.isWeekendOrHoliday","validOperator":"true","validOperatorText":"is true","validOperandBType":"str","validOperandBValue":""}],"tsCompare":"0","sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","x":440,"y":2445,"wires":[["b833cc54.55162"]]},{"id":"c3adc7de.37c938","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":235,"y":2445,"wires":[["65945da6.f4c7d4"]]},{"id":"b833cc54.55162","type":"debug","z":"d7bd7fb6.a0c13","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":655,"y":2445,"wires":[]},{"id":"d2b0ae0f.90e0c","type":"position-config","z":"","name":"Kap-Halbinsel","isValide":"true","longitude":"0","latitude":"0","angleType":"deg","timezoneOffset":"1"}]
```

Flow for testing overrides and rules:
![blind-control-example-3](https://user-images.githubusercontent.com/12692680/57134451-897a4080-6da6-11e9-989e-15ab04e11d9d.png)
```
[{"id":"133a6b14.ea2b85","type":"function","z":"d7bd7fb6.a0c13","name":"test","func":"\nconst minutesEachLoop = 30;\nconst loopCycle = 2; // seconds\nlet timeObj = context.get(\"timeObj\");\n\nif (timeObj && msg.topic.includes('stop')) {\n    clearInterval(timeObj);\n    context.set(\"timeObj\", null);\n    let d = new Date(context.get(\"date\"));\n    node.status({fill:\"red\",shape:\"ring\",text:\"stopped - \" + d.toLocaleTimeString()});\n    return null;\n} else if (!timeObj && msg.topic.includes('start')) {\n    context.set(\"message\", msg);\n    let d = new Date();\n    let num = Number(msg.payload) || 0;\n    d.setHours(num);\n    d.setMinutes(0);\n    context.set(\"date\", d.getTime());\n    msg.lts = d.toLocaleTimeString();\n    msg.ts = d.getTime();\n    node.log(\"sending \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.send(msg);\n\n    let timeObj = setInterval(function(){\n        let msg = context.get(\"message\");\n        let d = new Date(context.get(\"date\"));\n        //d.setHours(d.getHours()+1);\n        d.setMinutes(d.getMinutes() + minutesEachLoop)\n        context.set(\"date\", d.getTime());\n        msg.lts = d.toLocaleTimeString();\n        msg.ts = d.getTime();\n        node.status({fill:\"green\",shape:\"dot\",text:\"run - \" + d.toLocaleTimeString()});\n        node.log(\"sending \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n        node.send(msg);\n\t}, (1000 * loopCycle));\n    context.set(\"timeObj\", timeObj);\n    node.status({fill:\"green\",shape:\"ring\",text:\"start - \" + d.toLocaleTimeString()});\n    return null;\n}\n\nlet d = new Date(context.get(\"date\"));\nd.setMinutes(d.getMinutes() + 1)\n//d.setHours(d.getHours()+1);\nmsg.lts = d.toLocaleTimeString();\nmsg.ts = d.getTime();\nnode.status({fill:\"yellow\",shape:\"dot\",text:\"interposed - \" + d.toLocaleTimeString()});\nnode.log(\"sending interposed msg \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\nnode.send(msg);\nreturn null;","outputs":1,"noerr":0,"x":500,"y":2580,"wires":[["2f830c53.455b44"]]},{"id":"66a0fed2.d1c17","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"start/stop","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":225,"y":2535,"wires":[["133a6b14.ea2b85"]]},{"id":"36b5bf53.635a","type":"inject","z":"d7bd7fb6.a0c13","name":"reset","topic":"resetOverwrite","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":2625,"wires":[["133a6b14.ea2b85"]]},{"id":"26e49680.865ada","type":"inject","z":"d7bd7fb6.a0c13","name":"0%","topic":"levelOverwrite","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":2665,"wires":[["133a6b14.ea2b85"]]},{"id":"5d82a89c.499078","type":"inject","z":"d7bd7fb6.a0c13","name":"60%","topic":"levelOverwrite","payload":"0.6","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":2710,"wires":[["133a6b14.ea2b85"]]},{"id":"e8ac078f.9bc308","type":"comment","z":"d7bd7fb6.a0c13","name":"manual overrides:","info":"","x":225,"y":2580,"wires":[]},{"id":"32306190.8018ee","type":"inject","z":"d7bd7fb6.a0c13","name":"90%, expire 2,5s","topic":"","payload":"{\"position\":0.9,\"expire\":2500}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":260,"y":2760,"wires":[["133a6b14.ea2b85"]]},{"id":"5c942931.d78168","type":"inject","z":"d7bd7fb6.a0c13","name":"30% Prio 1","topic":"","payload":"{\"position\":0.3,\"prio\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":2805,"wires":[["133a6b14.ea2b85"]]},{"id":"d21d3f4d.50916","type":"inject","z":"d7bd7fb6.a0c13","name":"100% prio 1","topic":"","payload":"{\"priority\":1, \"position\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":2850,"wires":[["133a6b14.ea2b85"]]},{"id":"2f830c53.455b44","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"d9e9ca6a.952218","outputs":2,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"timeValue":"6:30","timeType":"entered","timeOp":"0","timeOpText":"bis","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"7:25","timeType":"entered","timeOp":"0","timeOpText":"bis","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"dayInfo.today.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"civilDawn","timeType":"pdsTime","timeOp":"0","timeOpText":"bis","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"civilDusk","timeType":"pdsTime","timeOp":"1","timeOpText":"von","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"22:35","timeType":"entered","timeOp":"1","timeOpText":"von","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"},{"timeValue":"23:15","timeType":"entered","timeOp":"1","timeOpText":"von","levelValue":"closed (min)","levelType":"levelFixed","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"dayInfo.tomorrow.isWeekendOrHoliday","validOperandAType":"flow","validOperator":"true","validOperatorText":"ist wahr","validOperandBValue":"","validOperandBType":"str"}],"sunControlMode":"2","sunFloorLength":"0.6","sunMinAltitude":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"1.28","windowBottom":"0","windowAzimuthStart":"70","windowAzimuthEnd":"150","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","x":740,"y":2580,"wires":[["12e898d.ca51e67"],["324e3f09.4452"]]},{"id":"12e898d.ca51e67","type":"debug","z":"d7bd7fb6.a0c13","name":"Blind position","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":985,"y":2565,"wires":[]},{"id":"324e3f09.4452","type":"debug","z":"d7bd7fb6.a0c13","name":"Blind status","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":985,"y":2625,"wires":[]},{"id":"4abea741.2fd968","type":"change","z":"d7bd7fb6.a0c13","name":"dayInfo.today.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.today.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":785,"y":2715,"wires":[[]]},{"id":"4548475.5b1feb8","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":515,"y":2715,"wires":[["4abea741.2fd968"]]},{"id":"fb328117.4c438","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":515,"y":2760,"wires":[["4abea741.2fd968"]]},{"id":"db519048.9483b","type":"change","z":"d7bd7fb6.a0c13","name":"dayInfo.tomorrow.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.tomorrow.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":795,"y":2805,"wires":[[]]},{"id":"1230ba43.d37cd6","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":515,"y":2805,"wires":[["db519048.9483b"]]},{"id":"d9e378ce.f2db68","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":515,"y":2850,"wires":[["db519048.9483b"]]},{"id":"d9e9ca6a.952218","type":"position-config","z":"","name":"Entenhausen","isValide":"true","longitude":"0","latitude":"0","angleType":"deg","timezoneOffset":"1"}]
```