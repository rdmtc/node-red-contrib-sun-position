# node-red-contrib-sun-position for NodeRED

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/hypnos3/node-red-contrib-sun-position/graphs/commit-activity)
[![GitHub version](https://badge.fury.io/gh/Hypnos3%2Fnode-red-contrib-sun-position.svg)](https://github.com/hypnos3/node-red-contrib-sun-position)
[![NPM version](https://badge.fury.io/js/node-red-contrib-sun-position.svg)](http://badge.fury.io/js/node-red-contrib-sun-position)
[![HitCount](http://hits.dwyl.io/hypnos3/node-red-contrib-sun-position.svg)](http://hits.dwyl.io/hypnos3/node-red-contrib-sun-position)
[![Dependencies Status](https://david-dm.org/hypnos3/node-red-contrib-sun-position/status.svg)](https://david-dm.org/hypnos3/node-red-contrib-sun-position)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Issues](https://img.shields.io/github/issues/hypnos3/node-red-contrib-sun-position.svg?style=flat-square)](https://github.com/hypnos3/node-red-contrib-sun-position/issues)

<!-- [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) -->

This node are for getting sun and moon position or to control a flow by sun or moon position. This can be used for smart home.

![nodes](images/appearance1.png?raw=true)

> This is still in development!
> This is not fully tested and documentation are missing!

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Implemented Nodes](#implemented-nodes)
  * [sun-position](#sun-position)
    + [Node settings](#node-settings)
	+ [Node Input](#node-input)
	+ [Node Output](#node-output)
  * [moon-position](#moon-position)
    + [Node settings](#node-settings-1)
	+ [Node Input](#node-input-1)
	+ [Node Output](#node-output-1)
  * [time-inject](#time-inject)
    + [Node settings](#node-settings-2)
	+ [Node Input](#node-input-2)
	+ [Node Output](#node-output-2)
  * [within-time](#within-time)
    + [Node settings](#node-settings-3)
	+ [Node Input](#node-input-3)
	+ [Node Output](#node-output-3)
- [Bugs and Feedback](#bugs-and-feedback)
- [LICENSE](#LICENSE)

## Installation

`npm install node-red-contrib-sun-position`

## Quick Start

tbd

## Implemented Nodes

- within-time         a switch node, which forwards a message only within a certain period of time.The beginning and the end can also be sunset, sunrise, moonset, moonrise or any other sun times.
- time-inject         a inject node, which can send a message on a specified time, which can also be a sun or moon time.
- sun-position        a node which calculates sun position. Can be used as a switch node for specific azimuth of the sun.
- moon-position       a node which calculates moon position and phases. Can be used as a switch node for specific azimuth of the sun.

### sun-position

The node calculates the current sun position on any input message.

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
     - `msg.payload.times.sunrise` sunrise (top edge of the sun appears on the horizon)
     - `msg.payload.times.sunriseEnd` sunrise ends (bottom edge of the sun touches the horizon)
     - `msg.payload.times.goldenHourEnd` morning golden hour (soft light, best time for photography) ends
     - `msg.payload.times.solarNoon` solar noon (sun is in the highest position)
     - `msg.payload.times.goldenHour` evening golden hour starts
     - `msg.payload.times.sunsetStart` sunset starts (bottom edge of the sun touches the horizon)
     - `msg.payload.times.sunset` sunset (sun disappears below the horizon, evening civil twilight starts)
     - `msg.payload.times.dusk` dusk (evening nautical twilight starts)
     - `msg.payload.times.nauticalDusk` nautical dusk (evening astronomical twilight starts)
     - `msg.payload.times.night` night starts (dark enough for astronomical observations)
     - `msg.payload.times.nadir` nadir (darkest moment of the night, sun is in the lowest position)
     - `msg.payload.times.nightEnd` night ends (morning astronomical twilight starts)
     - `msg.payload.times.nauticalDawn` nautical dawn (morning nautical twilight starts)
     - `msg.payload.times.dawn` dawn (morning nautical twilight ends, morning civil twilight starts)
   - `msg.payload.pos` array with a boolean of every defined limit of the azimuth, which is *true* if the azimuth is inside the limit.
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
			"solarNoon": "2018-11-11T14:02:48.928Z",
			"nadir": "2018-11-11T02:02:48.928Z",
			"sunrise": "2018-11-11T08:23:11.190Z",
			"sunset": "2018-11-11T19:42:26.666Z",
			"sunriseEnd": "2018-11-11T08:25:33.165Z",
			"sunsetStart": "2018-11-11T19:40:04.691Z",
			"dawn": "2018-11-11T08:00:22.165Z",
			"dusk": "2018-11-11T20:05:15.692Z",
			"nauticalDawn": "2018-11-11T07:34:06.749Z",
			"nauticalDusk": "2018-11-11T20:31:31.107Z",
			"nightEnd": "2018-11-11T07:08:03.781Z",
			"night": "2018-11-11T20:57:34.075Z",
			"goldenHourEnd": "2018-11-11T08:53:43.879Z",
			"goldenHour": "2018-11-11T19:11:53.977Z"
		},
		"pos": [],
		"posChanged": false
	}
```
 - **second output** to **... output** if limits for azimuth are defined the incomming message will send to this output. It adds a `msg.posChanged` property of type *boolean* which is true if in the previous calculation no message was send to this output.


### moon-position

The node calculates the current sun position on any input message.

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
     - `msg.payload.times.alwaysUp` boolean which is *true* if the moon is always up.
     - `msg.payload.times.alwaysDown` boolean which is *true* if the moon is always down.
   - `msg.payload.pos` array with a boolean of every defined limit of the azimuth, which is *true* if the azimuth is inside the limit.
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
 - **second output** to **... output** if limits for azimuth are defined the incomming message will send to this output.  It adds a `msg.payload.posChanged` property of type *boolean* which is true if the limit has changed since the last azimuth calculation.

### time-inject

#### Node settings

![time-inject](images/time-inject-settings.png?raw=true)

 - **Payload** defines the payload of the message object send to the output
 - **Topic** defines the topic of the send message
 - **Time** An optional property that can be configured when the inject node should emit a message on that timestamp.
 - **Offset** An optional property which is only available if an time is choosen. The offset can be a positive or negative and defines a time offset to the choosen time.
 - **Days** An optional property which is only available if an time is choosen. There can be defined on which days a msg should be emited.

#### Node Input

 It has only a button as input, where the massage could injected into a flow manually.

#### Node Output

The output is a message with the defined payload and topic in the settings.

### within-time

#### Node settings

![within-time](images/within-time-settings.png?raw=true)

#### Node Input

#### Node Output


## Bugs and Feedback

For bugs, questions and discussions please use the
[GitHub Issues](https://github.com/Hypnos3/node-red-contrib-sun-position/issues).

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

[![Greenkeeper badge](https://badges.greenkeeper.io/Hypnos3/node-red-contrib-sun-position.svg)](https://greenkeeper.io/)
