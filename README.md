# node-red-contrib-sun-position for NodeRED

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/HM-RedMatic/node-red-contrib-sun-position/graphs/commit-activity)

[![HitCount](http://hits.dwyl.io/HM-RedMatic/node-red-contrib-sun-position.svg)](http://hits.dwyl.io/HM-RedMatic/node-red-contrib-sun-position)

[![Dependencies Status](https://img.shields.io/david/HM-RedMatic/node-red-contrib-sun-position.svg)](https://david-dm.org/HM-RedMatic/node-red-contrib-sun-position)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[![Issues](https://img.shields.io/github/issues/HM-RedMatic/node-red-contrib-sun-position.svg?style=flat-square)](https://github.com/HM-RedMatic/node-red-contrib-sun-position/issues)

[![NPM](https://nodei.co/npm/node-red-contrib-sun-position.png)](https://nodei.co/npm/node-red-contrib-sun-position/)

<!-- [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) -->

This node are for getting sun and moon position or to control a flow by sun or moon position. This can be used for smart home.

![nodes](images/appearance1.png?raw=true)

> This is still in development!
> This is not fully tested and documentation are missing!

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Implemented Nodes](#implemented-nodes)
  - [sun-position](#sun-position)
    - [Node settings](#node-settings)
    - [Node Input](#node-input)
    - [Node Output](#node-output)
  - [moon-position](#moon-position)
    - [Node settings](#node-settings-1)
    - [Node Input](#node-input-1)
    - [Node Output](#node-output-1)
  - [time-inject](#time-inject)
    - [Node settings](#node-settings-2)
    - [Node Input](#node-input-2)
    - [Node Output](#node-output-2)
  - [within-time](#within-time)
    - [Node settings](#node-settings-3)
  - [times definitions](#times-definitions)
- [Bugs and Feedback](#bugs-and-feedback)
- [LICENSE](#LICENSE)

## Installation

`npm install node-red-contrib-sun-position`

## Quick Start

tbd

## Implemented Nodes

- within-time a switch node, which forwards a message only within a certain period of time.The beginning and the end can also be sunset, sunrise, moonset, moonrise or any other sun times.
- time-inject a inject node, which can send a message on a specified time, which can also be a sun or moon time.
- sun-position a node which calculates sun position. Can be used as a switch node for specific azimuth of the sun.
- moon-position a node which calculates moon position and phases. Can be used as a switch node for specific azimuth of the sun.

### sun-position

The node calculates the current sun position on any input message.

![sun-position](images/sun-position-example.png?raw=true)

```
[{"id":"fc962ea1.197a3","type":"inject","z":"de4e9c38.0d942","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":300,"wires":[["56265aeb.99f034"]]},{"id":"a0d0e562.7ad1d8","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":570,"y":300,"wires":[]},{"id":"56265aeb.99f034","type":"sun-position","z":"de4e9c38.0d942","name":"","positionConfig":"2831ba70.55a636","rules":[{"valueLow":"10","valueLowType":"num","valueHigh":"100","valueHighType":"num"}],"onlyOnChange":"true","topic":"","outputs":2,"x":330,"y":300,"wires":[["a0d0e562.7ad1d8","9cc2d51.4ac0828","28e91.9d63d16f6"],["e921e01a.a0fa3"]]},{"id":"9cc2d51.4ac0828","type":"change","z":"de4e9c38.0d942","name":"azimuth","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.azimuth","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":560,"y":340,"wires":[["e866e950.a7f798"]]},{"id":"28e91.9d63d16f6","type":"change","z":"de4e9c38.0d942","name":"altitude","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.altitude","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":560,"y":380,"wires":[["5b085e1b.4ec8a"]]},{"id":"e921e01a.a0fa3","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":550,"y":420,"wires":[]},{"id":"e866e950.a7f798","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":750,"y":340,"wires":[]},{"id":"5b085e1b.4ec8a","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":750,"y":380,"wires":[]},{"id":"2831ba70.55a636","type":"position-config","z":"","name":"Kap-Halbinsel","longitude":"-34.357051","latitude":"18.473782","angleType":"deg"}]
```

#### Node settings

![sun-position](images/sun-position-settings.png?raw=true)

- **Position** defines the current position.
- **Topic** defines the topic of the first output
- **position container** here you can define multiple lower and upepr limits for azimuth. If the calculated value of the azimuth is inside the defined limit the input message will send to the associated output.
- **Name** name of the Node

#### Node Input

The Input is for triggering the calculation. If limits are defined the input message will send to the output associated to the limit.

#### Node Output

- **first output**
  - `msg.payload.azimuth` the azimuth of the sun position relative to the given coordinates.
  - `msg.payload.altitude` the altitude/elevation of the sun position relative to the given coordinates.
  - `msg.payload.times` the sun times as object.
    - `msg.payload.times.astronomicalDawn` night ends (morning astronomical twilight starts)
    - `msg.payload.times.amateurDawn` amateur astronomical dawn (sun at 12° before sunrise)
    - `msg.payload.times.nauticalDawn` nautical dawn (morning nautical twilight starts)
    - `msg.payload.times.dawn` dawn (morning nautical twilight ends, morning civil twilight starts)
    - `msg.payload.times.blueHourDawn` blue Hour start (time for special photography photos starts)
    - `msg.payload.times.sunrise` sunrise (top edge of the sun appears on the horizon)
    - `msg.payload.times.sunriseEnd` sunrise ends (bottom edge of the sun touches the horizon)
    - `msg.payload.times.goldenHourEnd` morning golden hour (soft light, best time for photography) ends
    - `msg.payload.times.solarNoon` solar noon (sun is in the highest position)
    - `msg.payload.times.goldenHour` evening golden hour starts
    - `msg.payload.times.sunsetStart` sunset starts (bottom edge of the sun touches the horizon)
    - `msg.payload.times.sunset` sunset (sun disappears below the horizon, evening civil twilight starts)
    - `msg.payload.times.blueHourSet` blue Hour start (time for special photography photos ends)
    - `msg.payload.times.dusk` dusk (evening nautical twilight starts)
    - `msg.payload.times.blueHourDusk` nautical dusk (evening astronomical twilight starts)
    - `msg.payload.times.amateurDusk` amateur astronomical dusk (sun at 12° after sunrise)
    - `msg.payload.times.astronomicalDusk` night starts (dark enough for astronomical observations)
    - `msg.payload.times.nadir` nadir (darkest moment of the night, sun is in the lowest position)
  - `msg.payload.pos` array with a boolean of every defined limit of the azimuth, which is _true_ if the azimuth is inside the limit.
  - `msg.payload.posChanged` boolean which is true if any of the defined limit of the azimuth has changed to the last calculation.

```
	{
		"lastUpdate": "2018-11-11T11:11:11.111Z",
		"latitude": "18.473782",
		"longitude": "-34.357051",
		"angleType": "deg",
		"azimuth": 117.72942647370792,
		"altitude": 20.984193272523992,
		"times": {
        "solarNoon": "2018-12-10T10:59:14.814Z",
        "nadir": "2018-12-10T22:59:14.814Z",
        "sunrise": "2018-12-10T06:58:55.584Z",
        "sunset": "2018-12-10T14:59:34.044Z",
        "sunriseEnd": "2018-12-10T07:03:12.232Z",
        "sunsetStart": "2018-12-10T14:55:17.395Z",
        "blueHourDawn": "2018-12-10T06:34:22.885Z",
        "blueHourSet": "2018-12-10T15:24:06.743Z",
        "civilDawn": "2018-12-10T06:19:31.249Z",
        "civilDusk": "2018-12-10T15:38:58.379Z",
        "nauticalDawn": "2018-12-10T05:37:04.859Z",
        "blueHourDusk": "2018-12-10T16:21:24.768Z",
        "amateurDawn": "2018-12-10T05:16:44.832Z",
        "amateurDusk": "2018-12-10T16:41:44.795Z",
        "astronomicalDawn": "2018-12-10T04:56:49.931Z",
        "astronomicalDusk": "2018-12-10T17:01:39.696Z",
        "goldenHourEnd": "2018-12-10T07:58:28.541Z",
        "goldenHour": "2018-12-10T14:00:01.086Z"
		},
		"pos": [],
		"posChanged": false
	}
```

- **second output** to **... output** if limits for azimuth are defined the incomming message will send to this output. It adds a `msg.posChanged` property of type _boolean_ which is true if in the previous calculation no message was send to this output.

### moon-position

The node calculates the current sun position on any input message.

![moon-position](images/moon-position-example.png?raw=true)

```
[{"id":"d99ac08d.fdb94","type":"moon-position","z":"de4e9c38.0d942","name":"","positionConfig":"2831ba70.55a636","rules":[],"outputs":1,"topic":"","x":340,"y":520,"wires":[["e5e8e9a1.6080e8","e9ec273d.d90168","45563d84.0c4bf4","cce94ccc.b2dd2","65c76f28.3dd49","ac44c210.86465","f2deae49.60015","a9e0a2d1.0633a","948f6e2.8a4a39","cc85e458.447ba8","bff5a621.3fb498"]]},{"id":"124bfd72.dcb2f3","type":"inject","z":"de4e9c38.0d942","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":520,"wires":[["d99ac08d.fdb94"]]},{"id":"e5e8e9a1.6080e8","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":590,"y":520,"wires":[]},{"id":"e9ec273d.d90168","type":"change","z":"de4e9c38.0d942","name":"azimuth","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.azimuth","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":580,"y":560,"wires":[[]]},{"id":"45563d84.0c4bf4","type":"change","z":"de4e9c38.0d942","name":"altitude","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.altitude","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":580,"y":600,"wires":[[]]},{"id":"cce94ccc.b2dd2","type":"change","z":"de4e9c38.0d942","name":"distance","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.distance","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":580,"y":640,"wires":[[]]},{"id":"65c76f28.3dd49","type":"change","z":"de4e9c38.0d942","name":"parallacticAngle","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.parallacticAngle","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":600,"y":680,"wires":[[]]},{"id":"ac44c210.86465","type":"change","z":"de4e9c38.0d942","name":"illumination angle","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.angle","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":610,"y":720,"wires":[[]]},{"id":"f2deae49.60015","type":"change","z":"de4e9c38.0d942","name":"illumination fraction","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.fraction","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":610,"y":760,"wires":[[]]},{"id":"a9e0a2d1.0633a","type":"change","z":"de4e9c38.0d942","name":"illumination phase","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.phase.value","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":610,"y":800,"wires":[[]]},{"id":"948f6e2.8a4a39","type":"change","z":"de4e9c38.0d942","name":"illumination phase angle","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.phase.angle","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":630,"y":840,"wires":[[]]},{"id":"bff5a621.3fb498","type":"change","z":"de4e9c38.0d942","name":"illumination zenithAngle","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.zenithAngle","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":630,"y":920,"wires":[[]]},{"id":"cc85e458.447ba8","type":"change","z":"de4e9c38.0d942","name":"illumination phase name","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.illumination.phase.name","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":630,"y":880,"wires":[[]]},{"id":"2831ba70.55a636","type":"position-config","z":"","name":"Kap-Halbinsel","longitude":"-34.357051","latitude":"18.473782","angleType":"deg"}]
```

#### Node settings

![moon-position](images/sun-position-settings.png?raw=true)

- **Position** defines the current position.
- **Topic** defines the topic of the first output
- **position container** here you can define multiple lower and upepr limits for azimuth. If the calculated value of the azimuth is inside the defined limit the input message will send to the associated output.
- **Name** name of the Node

#### Node Output

- **first output**
  - `msg.payload.azimuth` the azimuth of the moon position relative to the given coordinates.
  - `msg.payload.altitude` the altitude/elevation of the moon position relative to the given coordinates.
  - `msg.payload.distance` the distance of the moon.
  - `msg.payload.parallacticAngle` the parallacticAngle of the moon.
  - `msg.payload.illumination` the illumination of the moon as object.
    - `msg.payload.illumination.angle` the illumination angle of the moon.
    - `msg.payload.illumination.fraction` the illumination fraction angle of the moon.
    - `msg.payload.illumination.zenithAngle` the illumination zenith angle of the moon.
    - `msg.payload.illumination.phase` the illumination phase of the moon as object.
      - `msg.payload.illumination.phase.value` the current phase of the moon in percent, where 0%/100% is New Moon, from 0% to 50% is growing, 50% is Full Moon and >50% is decreasing.
      - `msg.payload.illumination.phase.angle` the current phase angle of the moon.
      - `msg.payload.illumination.phase.emoji` the emoji of the current phase of the moon.
      - `msg.payload.illumination.phase.code` the code of the emoji for the current phase of the moon.
      - `msg.payload.illumination.phase.name` the name of the current phase of the moon.
  - `msg.payload.times` the moon times as object.
    - `msg.payload.times.rise` the moon rise time.
    - `msg.payload.times.set` the moon set time.
    - `msg.payload.times.alwaysUp` boolean which is _true_ if the moon never rises/sets and is always above the horizon during the day.
    - `msg.payload.times.alwaysDown` boolean which is _true_ if the moon is always below the horizon.
  - `msg.payload.pos` array with a boolean of every defined limit of the azimuth, which is _true_ if the azimuth is inside the limit.
  - `msg.payload.posChanged` boolean which is true if any of the defined limit of the azimuth has changed to the last calculation.

```
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

- **second output** to **... output** if limits for azimuth are defined the incomming message will send to this output. It adds a `msg.payload.posChanged` property of type _boolean_ which is true if the limit has changed since the last azimuth calculation.

### time-inject

Injects a message into a flow either manually or at timestamps which can also depending on the sunset, sunrise, or moon set and rise. The message payload can be a variety of types, including strings, JavaScript objects, the current time or the cuttent sun or moon position.

![time-inject](images/time-inject-example.png?raw=true)

```
[{"id":"d3c04d4e.ce3e3","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":570,"y":2100,"wires":[]},{"id":"586e4ae2.5b4f14","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":570,"y":2160,"wires":[]},{"id":"1b71d0e5.35b02f","type":"debug","z":"de4e9c38.0d942","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":570,"y":2220,"wires":[]},{"id":"3e4d36c0.620e7a","type":"time-inject","z":"de4e9c38.0d942","name":"","positionConfig":"bdf7c4a.9ca6c38","time":"nadir","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"payload":"","payloadType":"date","topic":"","x":320,"y":2100,"wires":[["d3c04d4e.ce3e3"]]},{"id":"c11713e.db07ef","type":"time-inject","z":"de4e9c38.0d942","name":"","positionConfig":"bdf7c4a.9ca6c38","time":"dawn","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"payload":"","payloadType":"date","topic":"","x":320,"y":2160,"wires":[["586e4ae2.5b4f14"]]},{"id":"b227cadc.dcf8c8","type":"time-inject","z":"de4e9c38.0d942","name":"","positionConfig":"bdf7c4a.9ca6c38","time":"rise","timeType":"pdmTime","timeDays":"1,4,0","offset":0,"offsetMultiplier":60,"payload":"{\"bool\":true}","payloadType":"json","topic":"","x":340,"y":2220,"wires":[["1b71d0e5.35b02f"]]},{"id":"bdf7c4a.9ca6c38","type":"position-config","z":"","name":"","longitude":"13.71587","latitude":"51.01732","angleType":"deg"}]
```

#### Node settings

![time-inject](images/time-inject-settings.png?raw=true)

- **Position** defines the current position
- **Payload** defines the payload of the message object send to the output
- **Topic** defines the topic of the send message
- **Time** An optional property that can be [configured](#times-definitions) when the inject node should emit a message on that timestamp.
- **Offset** An optional property which is only available if an time is choosen. The offset can be a positive or negative and defines a time offset to the choosen time.
- **Days** An optional property which is only available if an time is choosen. There can be defined on which days a msg should be emited.

- **Property** _optional_ here can be defined a context property which must be of tyxpe boolean. If this property is true alternate time will be used.
- **Alternate time** _optional_ defines an alternate start time which will be used if the property is true. This can be used for different times for example of holidays/weekend.

- **Additional Inject on Start** If this checkbox is set the inject node dcan emit the message on Node-Red Start or on any deploy of this node. There can be defined a delay after the emit should be done. This can be usefull for initializing any flow.

#### Node Input

It has only a button as input, where the massage could injected into a flow manually.

#### Node Output

The output is a message with the defined payload and topic in the settings.

### within-time

![time-inject](images/time-inject-example.png?raw=true)

```
[{"id":"bd9bd279.302eb","type":"inject","z":"de4e9c38.0d942","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":1180,"wires":[["b5c283be.eb945"]]},{"id":"273eb4cb.2715fc","type":"debug","z":"de4e9c38.0d942","name":"out1","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":590,"y":1180,"wires":[]},{"id":"78f068d6.2fe9f8","type":"debug","z":"de4e9c38.0d942","name":"out2","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":590,"y":1220,"wires":[]},{"id":"b5c283be.eb945","type":"within-time-switch","z":"de4e9c38.0d942","name":"","positionConfig":"bdf7c4a.9ca6c38","startTime":"7:00","startTimeType":"entered","startOffset":0,"startOffsetMultiplier":"60","endTime":"9:00","endTimeType":"entered","endOffset":0,"endOffsetMultiplier":"60","property":"","propertyType":"none","startTimeAlt":"","startTimeAltType":"none","startOffsetAlt":0,"startOffsetAltMultiplier":"60","endTimeAlt":"","endTimeAltType":"none","endOffsetAlt":0,"endOffsetAltMultiplier":"60","x":330,"y":1180,"wires":[["273eb4cb.2715fc"],["78f068d6.2fe9f8"]]},{"id":"bdf7c4a.9ca6c38","type":"position-config","z":"","name":"","longitude":"13.71587","latitude":"51.01732","angleType":"deg"}]
```

#### Node settings

A simple node that routes messages depending on the time. If the current time falls within the range specified in the node configuration, the message is routed to output 1. Otherwise the message is routed to output 2.

![within-time](images/within-time-settings.png?raw=true)

- **Position** defines the current position
- **Start time** defines the start time of the time range with with different [configuration possibilities](#times-definitions)
- **End time** defines the end time of the time range with with different [configuration possibilities](#times-definitions)
- **Property** _optional_ here can be defined a boolean property. If it is true alternate start or and times will be used.
- **Alternate start time** _optional_ defines an alternate start time of the time range which will be used if the property is true. This can be used for different times for example of holidays.
- **Alternate end time** _optional_ defines an alternate end time of the time range which will be used if the property is true. This can be used for different times for example of holidays.

- **Status** here can be adjusted which status should be displayed under the node.
  - this has the following posibilities:
    - **none** - no status will be displayed - **only errors** - if an error occures it will be displayed
      ![within-time-status-error](images/within-time-status-error.png?raw=true)
    - **time limits** - the time limits will be displayed. An `⎇` sign after a time will show that an alternate time is used.
      ![within-time-status-time](images/within-time-status-time.png?raw=true)
    - **last message** - the time limits will be shown and if the last message was blocked. An `⎇` sign after a time will show that an alternate time is used.
      ![within-time-status-error](images/within-time-status-message-block.png?raw=true)
      if the message was pass throught the timestamp of this message will be shown.
      ![within-time-status-send](images/within-time-status-message-send.png?raw=true)
    - **time limits or last message** - on deploy/start until a message arrives the same behaviour as `time limits` options, otherwise the `last message` status display.

### Times definitions

The time definitions of the nodes has different configuration possibilities

![within-time start Time](images/within-time-startTime.png?raw=true)

manual timestamps can be entered as one of the following formats:

- `00:00 ... 23:59` 24h Format
- `00:00:00 ... 23:59:00` 24h Format with seconds
- `00:00pm ... 12:59pm` 12h Format
- `00:00:00pm ... 12:59:00pm` 12h Format

following Sun times can be choosen:

| Time               | Description                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| `astronomicalDawn` | night ends (morning astronomical twilight starts)                        |
| `amateurDawn`      | amateur astronomical dawn (sun at 12° before sunrise)                    |
| `nauticalDawn`     | nautical dawn (morning nautical twilight starts)                         |
| `civilDawn`        | dawn (morning nautical twilight ends, morning civil twilight starts)     |
| `blueHourDawn`     | blue Hour start (time for special photography photos starts)             |
| `sunrise`          | sunrise (top edge of the sun appears on the horizon)                     |
| `sunriseEnd`       | sunrise ends (bottom edge of the sun touches the horizon)                |
| `goldenHourEnd`    | morning golden hour (soft light, best time for photography) ends         |
| `solarNoon`        | solar noon (sun is in the highest position)                              |
| `goldenHour`       | evening golden hour starts                                               |
| `sunsetStart`      | sunset starts (bottom edge of the sun touches the horizon)               |
| `sunset`           | sunset (sun disappears below the horizon, evening civil twilight starts) |
| `blueHourSet`      | blue Hour start (time for special photography photos ends)               |
| `civilDusk`        | dusk (evening nautical twilight starts)                                  |
| `blueHourDusk`     | nautical dusk (evening astronomical twilight starts)                     |
| `amateurDusk`      | amateur astronomical dusk (sun at 12° after sunrise)                     |
| `astronomicalDusk` | night starts (dark enough for astronomical observations)                 |
| `nadir`            | nadir (darkest moment of the night, sun is in the lowest position)       |

moon rise and moon set can be used

any message, flow or global property. It must contain a timestamp as one of the following formats:

- `00:00 ... 23:59` 24h Format
- `00:00:00 ... 23:59:00` 24h Format with seconds
- `00:00pm ... 12:59pm` 12h Format
- `00:00:00pm ... 12:59:00pm` 12h Format

**Offsets:**
The start and end time can have an offset. This is specified in seconds,minutes or hours:

- negative number brings the time forward. E.g. if the time is dusk and offset is -60 minutes, the start time will be 60 minutes before dusk.
- positive number delays the time by the specified number

## Bugs and Feedback

For bugs, questions and discussions please use the
[GitHub Issues](https://github.com/HM-RedMatic/node-red-contrib-sun-position/issues).

### :moneybag: Donations [![Donate](https://img.shields.io/badge/donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=4PCF5YW5ASHBN)

Even for those that don't have the technical knowhow to help developing on there are ways to support development. So if you want to donate some money please feel free to send money via [PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=4PCF5YW5ASHBN).

## LICENSE

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

## Other

[![Greenkeeper badge](https://badges.greenkeeper.io/HM-RedMatic/node-red-contrib-sun-position.svg)](https://greenkeeper.io/)

this node is published also here:

- [NPM package](https://www.npmjs.com/package/node-red-contrib-sun-position)
- [Node-Red](https://flows.nodered.org/node/node-red-contrib-sun-position)
