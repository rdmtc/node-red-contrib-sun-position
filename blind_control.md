# Blind Controller

## blind-control

Used to control a blind with many possibilities. This can be time-dependent and it can calculate the blind position based on the current position of the sun to limit the sun light To limit the sunlight on the floor of a window.

![blind-control](images/blind-control-example.png?raw=true)



#### blind-control - Node settings

##### general
![blind-control](images/blind-control-settings-1.png?raw=true)

- **Position** connects to the central configuration node, which contains the current position, but also handles internal shared functions
- **topic** if defined, the topic of any outgoing message will be set to this value, otherwise the topic of the ingoing message will not changed
- **name** the name of the node

##### blind settings

![blind-control](images/blind-control-settings-2.png?raw=true)

- **Increment** defines the minimum degree the blind position can be controlled
- **open position** The value for maximum open degree of a blind.
- **closed position** The value for minimum close degree of a blind.

All values could be floating point values.

##### rule settings

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

##### overwrite settings

![blind-control](images/blind-control-settings-5.png?raw=true)

- **expire** the duration in minutes a manual setting will remain is place. If not defined, there will be no default expiring of overrides.

##### sun settings

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

- **Cloud**, **cloud Operator**, **Threshold** allows to define properties to be used instead of the calculated value by the sun.
  - Example: If the **Cloud** is a property which contains a numerical value representing the percentage of sky occluded by clouds. and an operator greater tan or equal is used wit a **Threshold** a numerical value representing the maximum percentage of sky occluded by clouds. Then if the **cloud** value exceeds the **Threshold** the **blind position** will be used instead of the position calculated by the sun.
  - If the values of  **Cloud** or **Threshold** comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages. But this evaluation is only considered by messages when no rule active.
  - **blind position** the blind position which should be used if the defined expression for **cloud** is **true**.

#### Node Input

The Input is for triggering the calculation and for setting overwrites of the blind position.

- **reset** an incoming message with `msg.reset` is `true` or `msg.payload.reset` is `true` or where the `msg.topic` contains `reset` and the value of `msg.payload` = `true` will reset any existing overrides.
  - **position** 'blindPosition', 'position', 'level', 'blindlevel'], ['manual', 'overwrite'
  - **priority** (optional) Enables to handles overrides of different priorities. Default value will be `0`.
    - A message property `msg.prio`, `msg.payload.prio`, `msg.priority` or `msg.payload.priority`
    - or when the `msg.topic` contains `prio` or `alarm` and the value of `msg.payload` is a valid numeric value
    - A `boolean` value `true` is considered as numeric `1`
  - **expire** (optional) Enables to define an override as automatically expiring. As default value for overrides of priority `0` the value in the settings is be used. Overrides with a priority higher than `0` will not expire by default.
    - A message property `msg.expire` or `msg.payload.expire`
    - or when the `msg.topic` contains `expire` and the value of `msg.payload` is a valid numeric value
    - The value must be a time in milliseconds which is greater than 100. Otherwise the override will be set to not expiring.

Useful to know:

- If a **reset** and a new override is set in the same message, any existing override will be reset and the new will be set.
- An already active Override can only be changed if the prio of the existing is `0` (default) or the message object has a **priority** set with a value that is equal or greater than the existing override. If that is given the **expire**, **priority** or **position** can be changed.
- **position** of a value `-1`
- There are a special configuration for rules with a condition, with which it can be prevented to allow overrides.

#### blind-control - Node Output

- **first output**
  - `msg.payload.azimuth` the azimuth of the sun position relative to the given coordinates.
  - `msg.payload.altitude` the altitude/elevation of the sun position relative to the given coordinates.
  - `msg.payload.times` the sun times as object.
    - `msg.payload.times.astronomicalDawn` night ends (morning astronomical twilight starts)
    - `msg.payload.times.amateurDawn` amateur astronomical dawn (sun at 12° before sunrise)
    - `msg.payload.times.nauticalDawn` nautical dawn (morning nautical twilight starts)
    - `msg.payload.times.blueHourDawnStart` blue Hour start (time for special photography photos starts)
    - `msg.payload.times.civilDawn` dawn (morning nautical twilight ends, morning civil twilight starts)


--------------------------------------------------------


It is configured with the following properties:

* <b>channel</b>: identifier of the blind - which is used in the emitted <b>msg.payload</b>
* <b>mode</b>: mode of control
  * <b>Summer</b>: constrains the extent to which direct sunlight is allowed to enter the room
  * <b>Winter</b>: maximises the amount of direct sunlight allowed to enter the room
* <b>orientation</b>: the bearing representing the perpendicular of the window to geographical north
* <b>negative offset</b>: (optional) anti-clockwise offset from orientation for determination of whether the sun is coming through window. Offsets allow for obstacles that inhibit direct sunlight through the window. The obstacle could be a tree, a wall, anything.
* <b>positive offset</b>: (optional) clockwise offset from orientation for determination of whether the sun is coming through window
* <b>top</b>: measurement from the floor to top of the window covered by the blind
* <b>bottom</b>: measurement from the floor to bottom of the window covered by the blind
* <b>depth</b>: (optional) the extent to which direct sunlight is to be allowed into the room through the window, defined as a length on the floor. (Only relevant in Summer mode.)
* <b>altitude threshold</b>: (optional) minimum altitude of the sun for determination of blind position
* <b>increment</b>: the degree to which the blind position can be controlled
* <b>max open</b>: (optional) the maximum extent the blind is allowed to be opened during daylight hours. Defaults to 0.
* <b>max closed</b>: (optional) the maximum extent the blind is allowed to be closed during daylight hours. Defaults to 100.
* <b>temperature threshold</b>: (optional) temperature at which the blind will be set to the <b>temperature threshold position</b> while the sun is in the window. This setting overrides <b>altitudethreshold</b> and <b>depth</b> in the calculation
* <b>temperature threshold position</b>: (optional) the blind position associated with <b>temperature threshold</b>, default is fully closed
* <b>clouds threshold</b>: (optional) maximum percentage of sky occluded by clouds for the calculation to be performed
* <b>clouds threshold position</b>: (optional) the blind position associated with the <b>clouds threshold</b>, default is fully open
* <b>night position</b>: (optional) the position of the blind outside of daylight hours. Defaults to 100.
* <b>expiry period</b>: (optional) the duration in minutes a manual setting will remain is place. Default to 120.

The calculation requires the output of the <a href="https://www.npmjs.com/package/node-red-contrib-sunpos" target="_new">Sun Position</a> Node. This can be supplemented with current weather conditions, such as that from forecastio or weather underground. <b>msg.topic</b> should be set to weather, and <b>msg.payload</b> either or both of the following properties:

* <b>maxtemp</b>: the forecasted maximum temperature for the day;
* <b>clouds</b>: A numerical value between 0 and 1 (inclusive) representing the percentage of sky occluded by clouds. A value of 0 corresponds to clear sky, 0.4 to scattered clouds, 0.75 to broken cloud cover, and 1 to completely overcast skies.

In Summer mode, the node calculates the appropriate blind position to restrict the amount of direct sunlight entering the room. This calculation includes:

* determination of whether direct sunlight is entering the room based on the orientation of the blind and the azimuth of the sun - taking into account the negative and positive offset properties; and
  ![sunInWindow](./docs/sunInWindow.jpg)
* dimensions of the window and the current altitude of the sun.
  ![sunInRoom](./docs/sunInRoom.jpg)
* consideration of weather conditions against defined thresholds

In Winter mode, the node calculates the appropriate blind position to maximise the amount of direct sunlight entering the room. This calculation is based on whether direct sunlight is entering the room based on the orientation of the blind and the azimuth of the sun - taking into account the negative and positive offset properties. When the sun is in the window the blind will positioned in the <b>max open</b> setting, otherwise it will be positioned in the <b>max closed</b> setting. In overcast conditions the blind will be positioned in the <b>max closed</b> setting.

The mode can be changed via a message. <b>msg.topic</b> should be set to mode, and <b>msg.payload</b> with the following property:

* <b>mode</b>: Set to either Summer or Winter

In the event the node determines a blind position change is required, it will emit a <b>msg.payload</b> with the properties of the blind including:

* <b>blindPosition</b>: the new position of the blind
* <b>blindPositionReasonCode</b>: code of rationale of the new position
  * <b>01</b> - Manually set
  * <b>02</b> - Sun below horizon
  * <b>03</b> - Sun below altitude threshold
  * <b>04</b> - Sun not in window
  * <b>05</b> - Sun in window
  * <b>06</b> - Overcast conditions
  * <b>07</b> - Temperature forecast above threshold
* <b>blindPositionReasonDesc</b>: description of rationale of the new position (as above)

In addition, <b>msg.data</b> includes information useful for monitoring:

* <b>altitude</b>: altitude of the sun in degrees
* <b>azimuth</b>: azimuth of the sun in degrees
* <b>sunInWindow</b>: boolean value indicating whether direct sunlight is entering the room based on the orientation of the blind and the azimuth of the sun - taking into account the negative and positive offset properties

<b>msg.topic</b> is set to "blind".

The node also supports manual overrides by processing messages with <b>msg.topic</b> set to blindPosition, and <b>msg.payload</b> containing the following properties:

* <b>channel</b>: the channel of the blind
* <b>blindPosition</b>: the new position of the blind
* <b>expiry period</b>: (optional) the duration in minutes this manual setting will remain is place.

Manual positions can be forced to expire by processing a message with <b>msg.topic</b> set to blindPositionReset, and <b>msg.payload</b> containing the following properties:

* <b>channel</b>: the channel of the blind
* <b>reset</b>: boolean indicating manual setting is to be reset

The node also reports its status within the Node-RED flow editor:

* colour indicates whether it is currently considered daylight hours;
* shape indicates whether the blind is fully closed or not;
* text reports current blind position.


When processing either a Sun Position, Weather or Mode message, the blind position calculation is performed for each blind for which a configuration message has previously been received. Emitted messages from this node have the same properties as those emitted from the <b>Blind Controller</b> node.

This node does not report status within the Node-RED flow editor.

## Sample Flow

The figure below represents a sample flow of <b>Blind Controller</b> node can be used to control 6 Qmotion blinds at the one geo location. The flow is initiated by an Injector node configured to run periodically.

![Blind Controller Screenshot](./docs/sample-flow.png)

The figure below represents a sample flow using the <b>Multi Blind Controller</b> node for the same use case, where the blind configuration is stored in a Cloudant database.

![Multi Blind Controller Screenshot](./docs/sample-flow2.png)
