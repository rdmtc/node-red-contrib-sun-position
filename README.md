# node-red-contrib-sun-position for NodeRED

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/HM-RedMatic/node-red-contrib-sun-position/graphs/commit-activity)

[![HitCount](http://hits.dwyl.io/HM-RedMatic/node-red-contrib-sun-position.svg)](http://hits.dwyl.io/HM-RedMatic/node-red-contrib-sun-position)

[![Dependencies Status](https://img.shields.io/david/HM-RedMatic/node-red-contrib-sun-position.svg)](https://david-dm.org/HM-RedMatic/node-red-contrib-sun-position)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[![Issues](https://img.shields.io/github/issues/HM-RedMatic/node-red-contrib-sun-position.svg?style=flat-square)](https://github.com/HM-RedMatic/node-red-contrib-sun-position/issues)

[![NPM](https://nodei.co/npm/node-red-contrib-sun-position.png)](https://nodei.co/npm/node-red-contrib-sun-position/)

<!-- [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) -->

This is a ultimate Node-Red Timer based flow control with dusk, dawn (and variations) and much more.
Additional you can get sun and moon position or to control a flow by sun or moon position. It is ideal for usage of control smart home, but also for all other time based flow control.
In addition, there is now a blind controller, which can set blind position time and sun controlled. ( see [blind-control](blind_control.md) )

![nodes](images/appearance1.png?raw=true)
![nodes](images/appearance2.png?raw=true)

> This is still in development!
> This is not fully tested and documentation are missing!

## Table of contents

* [node-red-contrib-sun-position for NodeRED](#node-red-contrib-sun-position-for-nodered)
  * [Table of contents](#table-of-contents)
  * [Installation](#installation)
  * [General](#general)
    * [Saving resources](#saving-resources)
    * [second based accuracy](#second-based-accuracy)
  * [Implemented Nodes](#implemented-nodes)
    * [sun-position](#sun-position)
      * [sun-position - Node settings](#sun-position---node-settings)
      * [Node Input](#node-input)
      * [sun-position - Node Output](#sun-position---node-output)
    * [moon-position](#moon-position)
      * [moon-position - Node settings](#moon-position---node-settings)
      * [moon-position - Node Output](#moon-position---node-output)
    * [time-inject](#time-inject)
      * [time-inject - Node settings](#time-inject---node-settings)
      * [time-inject - Node Input](#time-inject---node-input)
      * [time-inject - Node Output](#time-inject---node-output)
    * [within-time](#within-time)
      * [within-time - Node settings](#within-time---node-settings)
    * [time-comp](#time-comp)
      * [time-comp - Node settings](#time-comp---node-settings)
    * [time-span](#time-span)
      * [time-span - Node settings](#time-span---node-settings)
    * [blind-control](#blind-control)
    * [Times definitions](#times-definitions)
      * [sun times](#sun-times)
        * [remarks](#remarks)
          * [blue hour](#blue-hour)
          * [amateurDawn /amateurDusk](#amateurdawn-amateurdusk)
          * [alternate properties](#alternate-properties)
      * [moon times](#moon-times)
      * [message, flow or global property or JSONATA expression](#message-flow-or-global-property-or-jsonata-expression)
    * [input parse formats](#input-parse-formats)
    * [output timestamp formats](#output-timestamp-formats)
    * [output timespan formats](#output-timespan-formats)
    * [Conditions](#conditions)
  * [TODO](#todo)
  * [Bugs and Feedback](#bugs-and-feedback)
  * [LICENSE](#license)
  * [Other](#other)

## Installation

`npm install node-red-contrib-sun-position`

## General

### Saving resources

The nodes are designed to do not calculate time events with every arriving message or with an interval every x time. This is to be able to handle a huge amount of messages also on even on computers with low resources.

### second based accuracy

The nodes are designed to be accurate to seconds. This means it was designed to turn on/off at exact given second. Other timers often work using intervals where they check your schedule only once a minute or even less. This means when you want something to come on at 08:00am, it may actually not come on until 30 seconds later. This nodes does not have this problem, it will come on at exactly 08:00:00am.

## Implemented Nodes

* within-time a switch node, which forwards a message only within a certain period of time.The beginning and the end can also be sunset, sunrise, moonset, moonrise or any other sun times.
* time-inject a inject node, which can send a message on a specified time, which can also be a sun or moon time.
* sun-position a node which calculates sun position. Can be used as a switch node for specific azimuth of the sun.
* moon-position a node which calculates moon position and phases. Can be used as a switch node for specific azimuth of the sun.

### sun-position

The node calculates the current sun position on any input message. This node is compatible to [node-red-contrib-blindcontroller](https://github.com/alisdairjsmyth/node-red-contrib-blindcontroller).

![sun-position-example](https://user-images.githubusercontent.com/12692680/57134504-aa429600-6da6-11e9-9e36-7d1eb80f5589.png)

```json
[{"id":"fc962ea1.197a3","type":"inject","z":"de4e9c38.0d942","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":300,"wires":[["56265aeb.99f034"]]},{"id":"a0d0e562.7ad1d8","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":570,"y":300,"wires":[]},{"id":"56265aeb.99f034","type":"sun-position","z":"de4e9c38.0d942","name":"","positionConfig":"2831ba70.55a636","rules":[{"valueLow":"10","valueLowType":"num","valueHigh":"100","valueHighType":"num"}],"onlyOnChange":"true","topic":"","outputs":2,"x":330,"y":300,"wires":[["a0d0e562.7ad1d8","9cc2d51.4ac0828","28e91.9d63d16f6"],["e921e01a.a0fa3"]]},{"id":"9cc2d51.4ac0828","type":"change","z":"de4e9c38.0d942","name":"azimuth","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.azimuth","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":560,"y":340,"wires":[["e866e950.a7f798"]]},{"id":"28e91.9d63d16f6","type":"change","z":"de4e9c38.0d942","name":"altitude","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.altitude","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":560,"y":380,"wires":[["5b085e1b.4ec8a"]]},{"id":"e921e01a.a0fa3","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":550,"y":420,"wires":[]},{"id":"e866e950.a7f798","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":750,"y":340,"wires":[]},{"id":"5b085e1b.4ec8a","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":750,"y":380,"wires":[]},{"id":"2831ba70.55a636","type":"position-config","z":"","name":"Kap-Halbinsel","longitude":"-34.357051","latitude":"18.473782","angleType":"deg"}]
```

#### sun-position - Node settings

![sun-position-settings](https://user-images.githubusercontent.com/12692680/57134503-aa429600-6da6-11e9-945b-aa7b6d750267.png)

* **Position** connects to the central configuration node, which contains the current position, but also handles internal shared functions
* **Topic** defines the topic of the first output
* **position container** here you can define multiple lower and upper limits for azimuth. If the calculated value of the azimuth is inside the defined limit the input message will send to the associated output.
* **Name** name of the Node

#### Node Input

The Input is for triggering the calculation. If limits are defined the input message will send to the output associated to the limit.

#### sun-position - Node Output

* **first output**
  * `msg.payload.azimuth` the azimuth of the sun position relative to the given coordinates.
  * `msg.payload.altitude` the altitude/elevation of the sun position relative to the given coordinates.
  * `msg.payload.times` the sun times as object.
    * `msg.payload.times.astronomicalDawn` night ends (morning astronomical twilight starts)
    * `msg.payload.times.amateurDawn` amateur astronomical dawn (sun at 12° before sunrise)
    * `msg.payload.times.nauticalDawn` nautical dawn (morning nautical twilight starts)
    * `msg.payload.times.blueHourDawnStart` blue Hour start (time for special photography photos starts)
    * `msg.payload.times.civilDawn` dawn (morning nautical twilight ends, morning civil twilight starts)
    * `msg.payload.times.blueHourDawnEnd` blue Hour end (time for special photography photos starts)
    * `msg.payload.times.sunrise` sunrise (top edge of the sun appears on the horizon)
    * `msg.payload.times.sunriseEnd` sunrise ends (bottom edge of the sun touches the horizon)
    * `msg.payload.times.goldenHourDawnEnd` morning golden hour (soft light, best time for photography) ends
    * `msg.payload.times.solarNoon` solar noon (sun is in the highest position)
    * `msg.payload.times.goldenHourDuskStart` evening golden hour starts
    * `msg.payload.times.sunsetStart` sunset starts (bottom edge of the sun touches the horizon)
    * `msg.payload.times.sunset` sunset (sun disappears below the horizon, evening civil twilight starts)
    * `msg.payload.times.blueHourDuskStart` nautical dusk start (evening astronomical twilight starts)
    * `msg.payload.times.civilDusk` dusk (evening nautical twilight starts)
    * `msg.payload.times.blueHourDuskEnd` nautical dusk end (evening astronomical twilight starts)
    * `msg.payload.times.amateurDusk` amateur astronomical dusk (sun at 12° after sunrise)
    * `msg.payload.times.astronomicalDusk` night starts (dark enough for astronomical observations)
    * `msg.payload.times.nadir` nadir (darkest moment of the night, sun is in the lowest position)
  * `msg.payload.pos` array with a boolean of every defined limit of the azimuth, which is _true_ if the azimuth is inside the limit.
  * `msg.payload.posChanged` boolean which is true if any of the defined limit of the azimuth has changed to the last calculation.
  * `msg.payload.startTime` if a start time is defined the start timestamp (inclusive of offset).
  * `msg.payload.endTime` if a end time is defined the end timestamp (inclusive of offset).
  * `msg.payload.sunInSky` if a start and an end time is defined a boolean value indicating whether it is currently considered daylight hours.

* **second output** to **... output** if limits for azimuth are defined the incoming message will send to this output. It adds a `msg.posChanged` property of type _boolean_ which is true if in the previous calculation no message was send to this output.

### moon-position

The node calculates the current sun position on any input message.

![moon-position-example](https://user-images.githubusercontent.com/12692680/57134922-f6daa100-6da7-11e9-91f7-6f33ab997df5.png)

```json
[{"id":"d99ac08d.fdb94","type":"moon-position","z":"de4e9c38.0d942","name":"","positionConfig":"2831ba70.55a636","rules":[],"outputs":1,"topic":"","x":340,"y":520,"wires":[["e5e8e9a1.6080e8","e9ec273d.d90168","45563d84.0c4bf4","cce94ccc.b2dd2","65c76f28.3dd49","ac44c210.86465","f2deae49.60015","a9e0a2d1.0633a","948f6e2.8a4a39","cc85e458.447ba8","bff5a621.3fb498"]]},{"id":"124bfd72.dcb2f3","type":"inject","z":"de4e9c38.0d942","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":520,"wires":[["d99ac08d.fdb94"]]},{"id":"e5e8e9a1.6080e8","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":590,"y":520,"wires":[]},{"id":"e9ec273d.d90168","type":"change","z":"de4e9c38.0d942","name":"azimuth","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.azimuth","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":580,"y":560,"wires":[[]]},{"id":"45563d84.0c4bf4","type":"change","z":"de4e9c38.0d942","name":"altitude","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.altitude","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":580,"y":600,"wires":[[]]},{"id":"cce94ccc.b2dd2","type":"change","z":"de4e9c38.0d942","name":"distance","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.distance","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":580,"y":640,"wires":[[]]},{"id":"65c76f28.3dd49","type":"change","z":"de4e9c38.0d942","name":"parallacticAngle","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.parallacticAngle","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":600,"y":680,"wires":[[]]},{"id":"ac44c210.86465","type":"change","z":"de4e9c38.0d942","name":"illumination angle","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.angle","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":610,"y":720,"wires":[[]]},{"id":"f2deae49.60015","type":"change","z":"de4e9c38.0d942","name":"illumination fraction","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.fraction","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":610,"y":760,"wires":[[]]},{"id":"a9e0a2d1.0633a","type":"change","z":"de4e9c38.0d942","name":"illumination phase","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.phase.value","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":610,"y":800,"wires":[[]]},{"id":"948f6e2.8a4a39","type":"change","z":"de4e9c38.0d942","name":"illumination phase angle","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.phase.angle","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":630,"y":840,"wires":[[]]},{"id":"bff5a621.3fb498","type":"change","z":"de4e9c38.0d942","name":"illumination zenithAngle","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.zenithAngle","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":630,"y":920,"wires":[[]]},{"id":"cc85e458.447ba8","type":"change","z":"de4e9c38.0d942","name":"illumination phase name","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.phase.name","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":630,"y":880,"wires":[[]]},{"id":"2831ba70.55a636","type":"position-config","z":"","name":"Kap-Halbinsel","longitude":"-34.357051","latitude":"18.473782","angleType":"deg"}]
```

#### moon-position - Node settings

![moon-position-settings](https://user-images.githubusercontent.com/12692680/57134923-f6daa100-6da7-11e9-9e1d-a49ecfc4bbcc.png)

* **Position** connects to the central configuration node, which contains the current position, but also handles internal shared functions
* **Topic** defines the topic of the first output
* **position container** here you can define multiple lower and upper limits for azimuth. If the calculated value of the azimuth is inside the defined limit the input message will send to the associated output.
* **Name** name of the Node

#### moon-position - Node Output

* **first output**
  * `msg.payload.azimuth` the azimuth of the moon position relative to the given coordinates.
  * `msg.payload.altitude` the altitude/elevation of the moon position relative to the given coordinates.
  * `msg.payload.distance` the distance of the moon.
  * `msg.payload.parallacticAngle` the parallacticAngle of the moon.
  * `msg.payload.illumination` the illumination of the moon as object.
    * `msg.payload.illumination.angle` the illumination angle of the moon.
    * `msg.payload.illumination.fraction` the illumination fraction angle of the moon.
    * `msg.payload.illumination.zenithAngle` the illumination zenith angle of the moon.
    * `msg.payload.illumination.phase` the illumination phase of the moon as object.
      * `msg.payload.illumination.phase.value` the current phase of the moon in percent, where 0%/100% is New Moon, from 0% to 50% is growing, 50% is Full Moon and >50% is decreasing.
      * `msg.payload.illumination.phase.angle` the current phase angle of the moon.
      * `msg.payload.illumination.phase.emoji` the emoji of the current phase of the moon.
      * `msg.payload.illumination.phase.code` the code of the emoji for the current phase of the moon.
      * `msg.payload.illumination.phase.name` the name of the current phase of the moon.
  * `msg.payload.times` the moon times as object.
    * `msg.payload.times.rise` the moon rise time.
    * `msg.payload.times.set` the moon set time.
    * `msg.payload.times.alwaysUp` boolean which is _true_ if the moon never rises/sets and is always above the horizon during the day.
    * `msg.payload.times.alwaysDown` boolean which is _true_ if the moon is always below the horizon.
  * `msg.payload.pos` array with a boolean of every defined limit of the azimuth, which is _true_ if the azimuth is inside the limit.
  * `msg.payload.posChanged` boolean which is true if any of the defined limit of the azimuth has changed to the last calculation.

```json
{
  "lastUpdate": "2018-11-11T11:11:11.111Z",
  "latitude": "18.473782",
  "longitude": "-34.357051",
  "angleType": "deg",
  "azimuth": 108.71205459404247,
  "altitude": -9.578482237780767,
  "distance": 400811.8001636167,
  "parallacticAngle": -73.92702172116152,
  "illumination": {
    "angle": -94.27663428960696,
    "fraction": 0.14981886026806135,
    "phase": {
      "emoji": "🌒",
      "code": ":waxing_crescent_moon:",
      "name": "Waxing Crescent",
      "weight": 6.3825,
      "value": 0.12651089732280724,
      "angle": 45.54392303621061
    },
    "zenithAngle": -20.349612568445437
  },
  "times": {
    "rise": "2018-11-11T11:44:22.877Z",
    "set": "2018-11-11T23:10:07.389Z",
    "alwaysUp": false,
    "alwaysDown": false
  },
  "pos": [],
  "posChanged": false
}
```

* **second output** to **... output** if limits for azimuth are defined the incoming message will send to this output. It adds a `msg.payload.posChanged` property of type _boolean_ which is true if the limit has changed since the last azimuth calculation.

### time-inject

Injects a message into a flow either manually or at timestamps which can also depending on the sunset, sunrise, or moon set and rise. The message payload can be a variety of types, including strings, JavaScript objects, the current time or the current sun or moon position.

![time-inject-example](https://user-images.githubusercontent.com/12692680/57134517-b4fd2b00-6da6-11e9-914a-30741c285426.png)

```json
[{"id":"d3c04d4e.ce3e3","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":570,"y":2100,"wires":[]},{"id":"586e4ae2.5b4f14","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":570,"y":2160,"wires":[]},{"id":"1b71d0e5.35b02f","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":570,"y":2220,"wires":[]},{"id":"3e4d36c0.620e7a","type":"time-inject","z":"de4e9c38.0d942","name":"","positionConfig":"bdf7c4a.9ca6c38","time":"nadir","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"payload":"","payloadType":"date","topic":"","x":320,"y":2100,"wires":[["d3c04d4e.ce3e3"]]},{"id":"c11713e.db07ef","type":"time-inject","z":"de4e9c38.0d942","name":"","positionConfig":"bdf7c4a.9ca6c38","time":"dawn","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"payload":"","payloadType":"date","topic":"","x":320,"y":2160,"wires":[["586e4ae2.5b4f14"]]},{"id":"b227cadc.dcf8c8","type":"time-inject","z":"de4e9c38.0d942","name":"","positionConfig":"bdf7c4a.9ca6c38","time":"rise","timeType":"pdmTime","timeDays":"1,4,0","offset":0,"offsetMultiplier":60,"payload":"{\"bool\":true}","payloadType":"json","topic":"","x":340,"y":2220,"wires":[["1b71d0e5.35b02f"]]},{"id":"bdf7c4a.9ca6c38","type":"position-config","z":"","name":"","longitude":"13.71587","latitude":"51.01732","angleType":"deg"}]
```

#### time-inject - Node settings

![time-inject-settings](https://user-images.githubusercontent.com/12692680/57134518-b4fd2b00-6da6-11e9-891a-d62b271b1de3.png)

* **Position** connects to the central configuration node, which contains the current position, but also handles internal shared functions
* **Payload** defines the payload of the message object send to the output
* **Topic** defines the topic of the send message
* **Time** An optional property that can be [configured](#times-definitions) when the inject node should emit a message on that timestamp.
* **Offset** An optional property which is only available if an time is chosen. The offset can be a positive or negative and defines a time offset to the chosen time.
* **Days** An optional property which is only available if an time is chosen. There can be defined on which days a msg should be emitted.

* **Property** _optional_ here can be defined a [condition](#conditions) under which a alternate time should be used.
* **Alternate time** _optional_ defines an alternate start time which will be used if the condition applies. This can be used for different times for example of holidays/weekend.

* **Additional Inject on Start** If this checkbox is set the inject node can emit the message on Node-Red Start or on any deploy of this node. There can be defined a delay after the emit should be done. This can be useful for initializing any flow.

* **Set additional** With this selection you can
  * set __global__, __flow__ context or set additional property of the message object (if the property is __payload__ the payload will be overridden.)
  * for any timestamp properties like __timestamp__, __sun time__, __moon time__ there are a lot of possibilities to influence this. You can add an offset or select the days wherefore the timestamp should be calculated. The output format could be Unix, ECMA timestamp, object or the time difference between timestamp and emit the message. This is useful to to send a payload of true on sunset with an additional message property as __on time__ with the seconds until sunrise.
    * **set additional timestamp**:
      !![time-inject-settings-addProp1](https://user-images.githubusercontent.com/12692680/57134519-b4fd2b00-6da6-11e9-843a-dd1d83555b8b.png)
    * **set additional sun timestamp**:
      ![time-inject-settings-addProp2](https://user-images.githubusercontent.com/12692680/57134520-b4fd2b00-6da6-11e9-9832-a3d8beda4897.png)
    * **possible formats of timestamp output**
      * number - milliseconds UNIX timestamp
      * string - ECMA-262
      * string - local date and time
      * string - local time
      * string - UTC date and time
      * string - ISO date and time
      * string - YYYYMMDDHHMMSS
      * string - YYYYMMDD.HHMMSS
      * number - milliseconds since emit
      * number - seconds since emit
      * number - minutes since emit
      * number - hour since emit
      * as object

time-inject-settings-addProp1

If this checkbox is set the inject node

#### time-inject - Node Input

It has only a button as input, where the massage could injected into a flow manually.

#### time-inject - Node Output

The output is a message with the defined payload and topic in the settings.

### within-time

![within-time-example](https://user-images.githubusercontent.com/12692680/57134524-b595c180-6da6-11e9-9208-a5c7cb89d2db.png)

```json
[{"id":"bd9bd279.302eb","type":"inject","z":"de4e9c38.0d942","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":1180,"wires":[["b5c283be.eb945"]]},{"id":"273eb4cb.2715fc","type":"debug","z":"de4e9c38.0d942","name":"out1","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":590,"y":1180,"wires":[]},{"id":"78f068d6.2fe9f8","type":"debug","z":"de4e9c38.0d942","name":"out2","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":590,"y":1220,"wires":[]},{"id":"b5c283be.eb945","type":"within-time-switch","z":"de4e9c38.0d942","name":"","positionConfig":"bdf7c4a.9ca6c38","startTime":"7:00","startTimeType":"entered","startOffset":0,"startOffsetMultiplier":"60","endTime":"9:00","endTimeType":"entered","endOffset":0,"endOffsetMultiplier":"60","property":"","propertyType":"none","startTimeAlt":"","startTimeAltType":"none","startOffsetAlt":0,"startOffsetAltMultiplier":"60","endTimeAlt":"","endTimeAltType":"none","endOffsetAlt":0,"endOffsetAltMultiplier":"60","x":330,"y":1180,"wires":[["273eb4cb.2715fc"],["78f068d6.2fe9f8"]]},{"id":"bdf7c4a.9ca6c38","type":"position-config","z":"","name":"","longitude":"13.71587","latitude":"51.01732","angleType":"deg"}]
```

#### within-time - Node settings

A simple node that routes messages depending on the time. If the current time falls within the range specified in the node configuration, the message is routed to output 1. Otherwise the message is routed to output 2.

![within-time-settings](https://user-images.githubusercontent.com/12692680/57134525-b62e5800-6da6-11e9-9946-2c6873592026.png)

* **Position** connects to the central configuration node, which contains the current position, but also handles internal shared functions
* **Start time** defines the start time of the time range with with different [configuration possibilities](#times-definitions)
  * **Start Offset** allows to define a positive or negative offset in *seconds*, *minutes* or *hours* to the given **Start Time**. This will be useful for sun based times.
* **End time** defines the end time of the time range with with different [configuration possibilities](#times-definitions)
  * **End Offset** allows to define a positive or negative offset in *seconds*, *minutes* or *hours* to the given **End Time**. This will be useful for sun based times.

* **Alternate start time** _optional_ defines an alternate start time of the time range which will be used if the [conditions](#conditions) matches. This can be used for different times for example of holidays.
  * **Start time** alternate start time
  * **Start Offset** offset for the alternate start time

* **Alternate end time** _optional_ defines an alternate end time of the time range which will be used if the [conditions](#conditions) matches. This can be used for different times for example of holidays.
  * **End time** alternate end time
  * **End Offset** offset for the alternate end time

* **resend start** If this checkbox is checked and a message arrived outside of time, this message will be additional send again some milliseconds after next start time point. This option is only for fixed time definitions available.
* **resend end** If this checkbox is checked and a message arrived within time, this message will be additional send again some milliseconds after next end time point. This option is only for fixed time definitions available.

### time-comp

A enhanced node for time format change and time comparison.

![time-comp-example](https://user-images.githubusercontent.com/12692680/57134514-b4649480-6da6-11e9-9321-9fd1a2927a9b.png)

```json
[{"id":"1a6b5f99.4c928","type":"time-comp","z":"4e9a710a.bf0b9","outputs":1,"name":"","positionConfig":"d9e9ca6a.952218","input":"payload","inputType":"msg","inputFormat":"0","inputOffset":0,"inputOffsetMultiplier":60,"rules":[],"checkall":"true","result1":"payload","result1Type":"msg","result1Value":"","result1ValueType":"input","result1Format":"5","result1Offset":0,"result1OffsetMultiplier":60,"x":350,"y":120,"wires":[["fd45b2d2.eba89"]]},{"id":"fd45b2d2.eba89","type":"debug","z":"4e9a710a.bf0b9","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":570,"y":120,"wires":[]},{"id":"f390b758.7dd9b8","type":"inject","z":"4e9a710a.bf0b9","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":160,"y":120,"wires":[["1a6b5f99.4c928"]]},{"id":"b87a5c79.d4ce3","type":"comment","z":"4e9a710a.bf0b9","name":"change Unix Timestamp to ISO","info":"","x":210,"y":80,"wires":[]},{"id":"20afdf5d.4cd8d","type":"comment","z":"4e9a710a.bf0b9","name":"compare Time","info":"","x":150,"y":180,"wires":[]},{"id":"3d8ee66c.7c86ea","type":"inject","z":"4e9a710a.bf0b9","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":160,"y":240,"wires":[["f19f0fd9.8ad1d"]]},{"id":"f19f0fd9.8ad1d","type":"time-comp","z":"4e9a710a.bf0b9","outputs":3,"name":"","positionConfig":"d9e9ca6a.952218","input":"payload","inputType":"msg","inputFormat":"0","inputOffset":0,"inputOffsetMultiplier":60,"rules":[{"operator":"5","operatorType":"11,12,13,14,15,16,17,18","operatorText":"","operandType":"str","operandValue":"12:00","format":"ddd MMM dd yyyy HH:mm:ss","formatSelection":"0","offsetType":"none","offsetValue":"","propertyType":"none","propertyValue":""},{"operator":"3","operatorType":"11,12,13,14,15,16,17,18","operatorText":"","operandType":"str","operandValue":"15:00","format":"ddd MMM dd yyyy HH:mm:ss","formatSelection":"0","offsetType":"none","offsetValue":"","propertyType":"none","propertyValue":""}],"checkall":"true","result1":"payload","result1Type":"msg","result1Value":"","result1ValueType":"input","result1Format":"5","result1Offset":0,"result1OffsetMultiplier":60,"x":350,"y":240,"wires":[["723d7d7c.e7a874"],["44ac03f7.fd68fc"],["4d8512cd.73c90c"]]},{"id":"723d7d7c.e7a874","type":"debug","z":"4e9a710a.bf0b9","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":570,"y":220,"wires":[]},{"id":"44ac03f7.fd68fc","type":"debug","z":"4e9a710a.bf0b9","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":570,"y":260,"wires":[]},{"id":"4d8512cd.73c90c","type":"debug","z":"4e9a710a.bf0b9","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":570,"y":300,"wires":[]},{"id":"d9e9ca6a.952218","type":"position-config","z":0,"name":"Entenhausen","longitude":"13.72324","latitude":"51.12381","angleType":"deg"}]
```

#### time-comp - Node settings

A simple node that routes messages depending on the time. If the current time falls within the range specified in the node configuration, the message is routed to output 1. Otherwise the message is routed to output 2.

![time-comp-settings](https://user-images.githubusercontent.com/12692680/57134515-b4fd2b00-6da6-11e9-9d04-0cafb0721ba8.png)

* **Position** connects to the central configuration node, which contains the current position, but also handles internal shared functions
* **Input** defines the input parameter for the time stamp
  * **parse format** defines the format for the input parameter, more information see [input parse formats](#input-parse-formats).
  * **Offset** allows to define a positive or negative offset to the given **Input Time**.
* **compare with** here can be defined various definitions of times to which the input time should be compared.
  * **operator** Drop down to define operator
  * **compare type** allows to define what parts of the time string should be compared. Default is a comparison of the complete timestamp. But it is possible to only compare a pat like the only the year.
  * **time** defines where the time to which should be compared comes from
  * **parse format** defines the format for the time to compare, more information see [input parse formats](#input-parse-formats).
  * **Offset** allows to define a positive or negative offset to the given time.
  * **limitation** here it is possible to additionally define a parameter. if defined this comparison will only be made if the [conditions](#conditions) matches.
* **result** allows to write the **Input time** to a parameter in a different format. Without defining any **compare with**, the node allows by only defining input and result parameter a simply time format conversation.

### time-span

A enhanced node for time span calculation and time span comparison.

![time-span-example](https://user-images.githubusercontent.com/12692680/57134521-b595c180-6da6-11e9-82fe-01ddaaba0d7b.png)

```json
tbd
```

#### time-span - Node settings

A simple node that routes messages depending on the time. If the current time falls within the range specified in the node configuration, the message is routed to output 1. Otherwise the message is routed to output 2.

![time-span-settings](https://user-images.githubusercontent.com/12692680/57134523-b595c180-6da6-11e9-8146-ce1d7a59792a.png)

* **Position** connects to the central configuration node, which contains the current position, but also handles internal shared functions
* **Input 1** defines the first input parameter for the time span calculation
  * **parse format** defines the format for the first input parameter, more information see [input parse formats](#input-parse-formats).
  * **Offset** allows to define a positive or negative offset to the given **Input 1 Time**.
* **Input 2** defines the second input parameter for the time span calculation
  * **parse format** defines the format for the second input parameter, more information see [input parse formats](#input-parse-formats).
  * **Offset** allows to define a positive or negative offset to the given **Input 2 Time**.
* **compare with** here can be defined various time spams to which the time span between timestamp of input 1 and input 2 should be compared.
  * **operator** Drop down to define operator for comparison
  * **time** defines a number to which should be the timespan be compared
  * **time type** the unit of the given time
* **result** ** as result of an incoming message, data could be written to that destination. This could be a message property, a flow or a global context.
  * **result value** defines the value which should be written to the result destination. Could be the timestamp, one of the Input times or any other time/data. For timestamp or times the output format or maybe an offset could be defined.

Without defining any comparison, the node allows by only defining inputs and result a simply timespan calculation.

### blind-control

Used to control a blind with many possibilities. This can be time-dependent and it can calculate the blind position based on the current position of the sun to limit the sun light To limit the sunlight on the floor of a window.

[blind-control](blind_control.md)

### Times definitions

The time definitions of the nodes has different configuration possibilities

![within-time-startTime](https://user-images.githubusercontent.com/12692680/57134526-b62e5800-6da6-11e9-9b95-b0e9998c41c4.png)

manual timestamps can be entered as one of the following formats:

* `00:00 ... 23:59` 24h Format
* `00:00:00 ... 23:59:00` 24h Format with seconds
* `00:00pm ... 12:59pm` 12h Format
* `00:00:00pm ... 12:59:00pm` 12h Format with seconds

#### sun times

following Sun times will be calculated and can be chosen:

| Time                | Description                                                              | SunBH |
| ------------------- | ------------------------------------------------------------------------ | ----- |
| `astronomicalDawn`  | night ends (morning astronomical twilight starts)                        | 18    |
| `amateurDawn`       | amateur astronomical dawn (sun at 12° before sunrise)                    | 15    |
| `nauticalDawn`      | nautical dawn (morning nautical twilight starts)                         | 12    |
| `blueHourDawnStart` | blue Hour start (time for special photography photos starts)             | 8     |
| `civilDawn`         | dawn (morning nautical twilight ends, morning civil twilight starts)     | 6     |
| `blueHourDawnEnd`   | blue Hour end (time for special photography photos end)                  | 4     |
| `goldenHourDawnStart` | morning golden hour (soft light, best time for photography) starts     | -1    |
| `sunrise`           | sunrise (top edge of the sun appears on the horizon)                     | 0.833 |
| `sunriseEnd`        | sunrise ends (bottom edge of the sun touches the horizon)                | 0.3   |
| `goldenHourDawnEnd`   | morning golden hour (soft light, best time for photography) ends       | -6    |
| `solarNoon`         | solar noon (sun is in the highest position)                              |       |
| `goldenHourDuskStart` | evening golden hour (soft light, best time for photography) starts     | -6    |
| `sunsetStart`       | sunset starts (bottom edge of the sun touches the horizon)               | 0.3   |
| `sunset`            | sunset (sun disappears below the horizon, evening civil twilight starts) | 0.833 |
| `goldenHourDuskEnd` | evening golden hour (soft light, best time for photography) ends         | 1     |
| `blueHourDuskStart` | blue Hour start (time for special photography photos starts)             | 4     |
| `civilDusk`         | dusk (evening nautical twilight starts)                                  | 6     |
| `blueHourDuskEnd`   | blue Hour end (time for special photography photos end)                  | 8     |
| `nauticalDusk`      | nautical dusk end (evening astronomical twilight starts)                 | 12    |
| `amateurDusk`       | amateur astronomical dusk (sun at 12° after sunrise)                     | 15    |
| `astronomicalDusk`  | night starts (dark enough for astronomical observations)                 | 18    |
| `nadir`             | nadir (darkest moment of the night, sun is in the lowest position)       |       |

SunBH is the angle of the sun below the horizon

![sun-times](https://user-images.githubusercontent.com/12692680/57134546-c6dece00-6da6-11e9-8a32-c3517c5211fe.png)

##### remarks

###### blue hour

Although the blue hour does not have an official definition, the blue color spectrum is most prominent when the Sun is between 4° and 8° below the horizon.

###### amateurDawn /amateurDusk

This is not an official definition, this is happend when the Sun is 15° below the horizon

###### alternate properties

The following time parameters are exists in the output for backward compatibility. These are equal to parameters in the table above:

| time parameter    | is equal to              |
| ----------------- | ------------------------ |
| `dawn`            | `civilDawn`              |
| `dusk`            | `civilDusk`              |
| `nightEnd`        | `astronomicalDawn`       |
| `night`           | `astronomicalDusk`       |
| `nightStart`      | `astronomicalDusk`       |
| `goldenHour`      | `goldenHourDuskStart`    |
| `sunsetEnd`       | `sunset`                 |
| `sunriseStart`    | `sunrise`                |
| `goldenHourEnd`   | `goldenHourDawnEnd`      |
| `goldenHourStart` | `goldenHourDuskStart`    |

#### moon times

moon rise and moon set can be used

#### message, flow or global property or JSONATA expression

any message, flow or global property which contain any of the following types:

* Integer which is a [Unix Time Stamp](http://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html#tag_04_16) representing the number of milliseconds since January 1, 1970, 00:00:00 UTC, with leap seconds ignored.
* String value representing a valid JavaScript date-string.

String as one of the following formats:

* `00:00 ... 23:59` 24h Format
* `00:00:00 ... 23:59:00` 24h Format with seconds
* `00:00pm ... 12:59pm` 12h Format
* `00:00:00pm ... 12:59:00pm` 12h Format with seconds

**Offsets:**
The start and end time can have an offset. This is specified in seconds,minutes or hours:

* negative number brings the time forward. E.g. if the time is dusk and offset is -60 minutes, the start time will be 60 minutes before dusk.
* positive number delays the time by the specified number

### input parse formats

Some nodes has the ability to get an input time out of different pre defined formats or a free format definition.

The formats are:

* **milliseconds UNIX timestamp** This is the default for Node-ed. Timestamps are a numeric representation of the time in milliseconds since 1970-01-01 UTC
* **ECMA-262** YYYY-MM-DDTHH:mm:ss.sssZ - This is the default toString output of JavaScript. This is a simplification of the ISO 8601 Extended Format.
* **YYYYMMDDHHMMSS** is a number of the format YYYYMMDDHHMMSS.
* **YYYYMMDD.HHMMSS** is a number of the format YYYYMMDD.HHMMSS.
* **various** the system will try to parse different string formats
* **other** there you can define a format like "yyyy-MM-dd HH:mm:ss" of the given time. Possible format placeholders are:

 | Field        | Full Form           | Short Form                       |
 | ------------ | ------------------- | -------------------------------- |
 | Year         | yyyy (4 digits)     | yy (2 digits), y (2 or 4 digits) |
 | Month        | MMM (name or abbr.) | MM (2 digits), M (1 or 2 digits) |
 | Month        | NNN (abbr.)         |
 | Day of Month | dd (2 digits)       | d (1 or 2 digits)                |
 | Day of Week  | EE (name)           | E (abbr.)                        |
 | Hour (1-12)  | hh (2 digits)       | h (1 or 2 digits)                |
 | Hour (0-23)  | HH (2 digits)       | H (1 or 2 digits)                |
 | Hour (0-11)  | KK (2 digits)       | K (1 or 2 digits)                |
 | Hour (1-24)  | kk (2 digits)       | k (1 or 2 digits)                |
 | Minute       | mm (2 digits)       | m (1 or 2 digits)                |
 | Second       | ss (2 digits)       | s (1 or 2 digits)                |
 | Millisecond  | ll (3 digits)       | l (1, 2 or 3 digits)             |
 | AM/PM        | tt  (2 digits)      | t (1 or 2 digits)                |

### output timestamp formats

For timestamp outputs some nodes has the ability to define the format of the timestamp. Therefore different pre defined formats exists or a free format definition.

The formats are:

* **milliseconds UNIX timestamp** Timestamps are a numeric representation of the time in milliseconds since 1970-01-01 UTC
* **ECMA-262** YYYY-MM-DDTHH:mm:ss.sssZ - This is the default toString output of JavaScript. This is a simplification of the ISO 8601 Extended Format.
* **YYYYMMDDHHMMSS** is a number of the format YYYYMMDDHHMMSS.
* **YYYYMMDD.HHMMSS** is a number of the format YYYYMMDD.HHMMSS.
* **local** is the java script output of date.toLocaleString()
* **localLong** is the java script output of date.toString()
* **localTime** is the java script output of date.toLocaleTimeString()
* **localTimeLong** is the java script output of date.toTimeString()
* **localDate** is the java script output of date.toLocaleDateString()
* **localDateLong** is the java script output of date.toDateString()
* **UTC** is the java script output of date.toUTCString()
* **ISO** YYYY-MM-DDTHH:mm:ss.sssZ (output of date.toISOString())
* **ms** the time in milliseconds between output and timestamp
* **sec** the time in seconds between output and timestamp
* **min** the time in minutes between output and timestamp
* **hour** the time in hours between output and timestamp
* **Day Name** the timestamps day in the format Monday, 22.12.
* **Day in relative** the timestamps day in relative to output time in the format Today, 22.12.
* **object** gives back an object for the timestamp with the following properties:
  * **date** Java script Date object
  * **ts** number - Unix timestamp (milliseconds since 1970-01-01 UTC)
  * **timeUTCStr** string representation of the Time in UTC format
  * **timeISOStr** string representation of the Time in ISO format
  * **timeLocaleStr** the java script output of date.toLocaleString()
  * **timeLocaleTimeStr** the java script output of date.toLocaleTimeString()
  * **delay** the time in milliseconds between output and timestamp
  * **delaySec** the time in seconds between output and timestamp
* **other** there you can define a format like "yyyy-MM-dd HH:mm:ss" of the given time. Possible format placeholders are:

| placeholder | Description                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| d           | Day of the month as digits; no leading zero for single-digit days.                                                                                            |
| dd          | Day of the month as digits; leading zero for single-digit days.                                                                                               |
| ddd         | Day of the week as a three-letter abbreviation. (same as E)                                                                                                   |
| dddd        | Day of the week as its full name.  (same as EE)                                                                                                               |
| E           | Day of the week as a three-letter abbreviation.                                                                                                               |
| EE          | Day of the week as its full name.                                                                                                                             |
| M           | Month as digits; no leading zero for single-digit months.                                                                                                     |
| MM          | Month as digits; leading zero for single-digit months.                                                                                                        |
| MMM         | Month as a three-letter abbreviation.                                                                                                                         |
| MMMM        | Month as its full name.                                                                                                                                       |
| yy          | Year as last two digits; leading zero for years less than 10.                                                                                                 |
| yyyy        | Year represented by four digits.                                                                                                                              |
| h           | Hours; no leading zero for single-digit hours (12-hour clock 1-12).                                                                                           |
| hh          | Hours; leading zero for single-digit hours (12-hour clock 01-12).                                                                                             |
| H           | Hours; no leading zero for single-digit hours (24-hour clock  0-23).                                                                                          |
| HH          | Hours; leading zero for single-digit hours (24-hour clock 00-23).                                                                                             |
| k           | Hours; no leading zero for single-digit hours (12-hour clock 0-11).                                                                                           |
| kk          | Hours; leading zero for single-digit hours (12-hour clock  00-11).                                                                                            |
| K           | Hours; no leading zero for single-digit hours (24-hour clock 1-24).                                                                                           |
| KK          | Hours; leading zero for single-digit hours (24-hour clock 01-24).                                                                                             |
| m           | Minutes; no leading zero for single-digit minutes.                                                                                                            |
| mm          | Minutes; leading zero for single-digit minutes.                                                                                                               |
| s           | Seconds; no leading zero for single-digit seconds.                                                                                                            |
| ss          | Seconds; leading zero for single-digit seconds.                                                                                                               |
| l           | Milliseconds; no leading zeros for single-digit                                                                                                               |
| ll          | Milliseconds; 1 leading zero for single-digit; no for 3 digits                                                                                                |
| lll         | Milliseconds; 2 leading zero for single-digit; 2 for 2 digits                                                                                                 |
| L           | Milliseconds divided by 100 round to 0; no leading zero                                                                                                       |
| LL          | Milliseconds divided by 10 round to 0; leading zero for single-digit                                                                                          |
| t           | Lowercase, single-character time marker string: a or p.                                                                                                       |
| tt          | Lowercase, two-character time marker string: am or pm.                                                                                                        |
| T           | Uppercase, single-character time marker string: A or P.                                                                                                       |
| TT          | Uppercase, two-character time marker string: AM or PM.                                                                                                        |
| Z           | timezone abbreviation, e.g. EST, MDT, MESZ or MEZ.                                                                                                            |
| z           | timezone offset, e.g. GMT-0500                                                                                                                                |
| zz          | timezone offset - nothing for GMT/UTC, e.g. -0500 or +0230.                                                                                                   |
| o           | GMT/UTC timezone offset in  hours:minutes, e.g. -05:00 or +02:30.                                                                                             |
| oo          | GMT/UTC timezone offset, e.g. -0500 or +0230.                                                                                                                 |
| ooo         | GMT/UTC timezone offset - 'Z' for GMT/UTC, e.g. -0500 or +0230.                                                                                               |
| oooo        | GMT/UTC timezone offset - 'UTC' for GMT/UTC, e.g. -0500 or +0230.                                                                                             |
| S           | The date's ordinal suffix (st, nd, rd, or th). Works well with d.                                                                                             |
| x           | difference of days from timestamp day to output day                                                                                                           |
| xx          | difference of days from timestamp day to output day with relative names for today, tomorrow, ...                                                              |
| '…' or "…"  | Literal character sequence. Surrounding quotes are removed.                                                                                                   |
| UTC:        | Must be the first four characters of the mask. Converts the date from local time to UTC/GMT/Zulu time before applying the mask. The "UTC:" prefix is removed. |

### output timespan formats

For timespan output the calc-timespan node has the ability to define the format of the timespan. Therefore different pre defined formats exists or a free format definition.

The formats are:

* **ms** timespan im milliseconds (integer value)
* **sec**, **min**,..., **month**, **years** timespan as a floating point number or as a integer number of the the chosen unit.
* **object** gives back an object for the timespan with the following properties:
  * **date** Java script Date object
  * **ts** number - Unix timestamp (milliseconds since 1970-01-01 UTC)
  * **timeUTCStr** string representation of the Time in UTC format
  * **timeISOStr** string representation of the Time in ISO format
  * **timeLocaleStr** the java script output of date.toLocaleString()
  * **timeLocaleTimeStr** the java script output of date.toLocaleTimeString()
  * **delay** the time in milliseconds between output and timestamp
  * **delaySec** the time in seconds between output and timestamp
* **other** there you can define a format like "yyyy-MM-dd HH:mm:ss" of the given time. Possible format placeholders are:

### Conditions

A condition usually consists of a *property*, an *operator* and depending on the operator, a *threshold*.

*property*, an *operator*:

![condition-1](https://user-images.githubusercontent.com/12692680/57455030-81207a80-726a-11e9-8803-eb7e526950b4.png)

*property*, *operator* and *threshold*:
![condition-2](https://user-images.githubusercontent.com/12692680/57455031-81b91100-726a-11e9-9987-d53c201f79b0.png)

The operators are:

* `is true` - the value of the *property* must be of type boolean and the condition is fulfilled if the value is `true`
* `is false` - the value of the *property* must be of type boolean and the condition is fulfilled if the value is `false`
* `is null` - the value of the *property* must be `undefined` or `null`
* `is not null` - the value of the *property* can have an obscure value that is not `undefined` or `null`
* `is empty` - the condition is fulfilled if the *property* is an empty `string`, `array`, `buffer` or an object with no properties
* `is not empty` - the condition is fulfilled if the *property* is an  `string`, `array`, `buffer` which is not empty or an object which has properties
* `true expression` - the condition is fulfilled if the *property* is a number and greater `0` or a Boolean which is `true` or a string containing one of the following values `true`, `yes`, `on`, `ja`. If the property has a string `switchon` then this would evaluate to true, because `on` is part of the string.
* `false expression` - the condition is fulfilled if the *property* is a number and less than or equal `0` or a Boolean which is `false` or a string containing one of the following values `false`, `no`, `off`, `nein`.  If the property has a string `nonsens` then this would evaluate to true, because `no` is part of the string.
* `not true expression` - the condition is fulfilled if the *property* is a number and **not** greater `0` or a Boolean which is **not** `true` or a string containing **none** of the following values `true`, `yes`, `on`, `ja`. It the property is a number and **NaN** then this would evaluate to true.
* `false expression` - the condition is fulfilled if the *property* is a number and **not** less than or equal `0` or a Boolean which is **not** `false` or a string containing **none** of the following values `false`, `no`, `off`, `nein`.
* `<`, `<=`, `==`, `!=`, `>`, `>=` - compares the value of the *property* with a *threshold*. Typically this makes only sense if the *property* and the *threshold* are numbers.
* `contain` - the condition is fulfilled if the *property* contains the string defined in the *threshold*.
* `containSome` - the *threshold* must be a string separated with comma `,`, semicolon `;` or pipe `|`. The condition is fulfilled as soon as only one of the seperated parts of the *threshold* string is is included in the *property* value.
* `containEvery` - the *threshold* must be a string separated with comma `,`, semicolon `;` or pipe `|`. The condition is fulfilled as soon as all of the seperated parts of the *threshold* string are included in the *property* value.

A JSONata expression in the *property* must be always a boolean with value true, in this case the operator can not be chosen.

## TODO

* [ ] add possibility to select input/output timezone
  * [ ] select auto add get info from getTimezoneOffset
  * [ ] solve problem of DST

## Bugs and Feedback

For bugs, questions and feature requests please use the
[GitHub Issues](https://github.com/HM-RedMatic/node-red-contrib-sun-position/issues).

:moneybag: Donations [![Donate](https://img.shields.io/badge/donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=4PCF5YW5ASHBN)

Even for those that don't have the technical knowhow to help developing on there are ways to support development. So if you want to donate some money please feel free to send money via [PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=4PCF5YW5ASHBN).

## LICENSE

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this nodes except in compliance with the License. You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

## Other

[![Greenkeeper badge](https://badges.greenkeeper.io/HM-RedMatic/node-red-contrib-sun-position.svg)](https://greenkeeper.io/)

this node is published also here:

* [NPM package](https://www.npmjs.com/package/node-red-contrib-sun-position)
* [Node-Red](https://flows.nodered.org/node/node-red-contrib-sun-position)
