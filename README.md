# node-red-contrib-sun-position for NodeRED

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/rdmtc/node-red-contrib-sun-position/graphs/commit-activity)
[![npm version](https://badge.fury.io/js/node-red-contrib-sun-position.svg)](https://badge.fury.io/js/node-red-contrib-sun-position)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Issues](https://img.shields.io/github/issues/rdmtc/node-red-contrib-sun-position.svg?style=flat-square)](https://github.com/rdmtc/node-red-contrib-sun-position/issues)
[![code style](https://img.shields.io/badge/Code%20Style-eslint-green.svg)](https://eslint.org/)
[![NPM](https://nodei.co/npm/node-red-contrib-sun-position.png)](https://nodei.co/npm/node-red-contrib-sun-position/)

<!-- [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) -->

This is a ultimate (Swiss-Army-Knife) Node-Red Timer based flow control with dusk, dawn (and variations) and much more.
Additional you can get sun and moon position or to control a flow by sun or moon position. It is ideal for usage of control smart home, but also for all other time based flow control.
There is also a roller [blind control](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/blind-control) node and a [clock timer](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/clock-timer) node. The [blind control](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/blind-control) node can determine the position of the roller shutter by time or position of the sun. The [timer](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/clock-timer) can send different payloads depending on the time.

![nodes](https://user-images.githubusercontent.com/12692680/70033601-19d46a00-15b0-11ea-9e36-a7843e20ff85.png)

## Information on Version changes

If a Node has a warning sign on the label like this one:
![warning sign](https://user-images.githubusercontent.com/12692680/81336350-7977f980-90a9-11ea-8d14-fa412b83fe45.png)
This is not an error, it hides only that the node needs to be opened, saved and deployed to fix the label.

⚠ Nodes that were created or saved with a version 2.0.0 or later do not work in versions prior 2.0.0 of the package.

## Table of contents

- [node-red-contrib-sun-position for NodeRED](#node-red-contrib-sun-position-for-nodered)
  - [Information on Version changes](#information-on-version-changes)
  - [Table of contents](#table-of-contents)
  - [Preconditions](#preconditions)
  - [Installation](#installation)
  - [General](#general)
    - [Saving resources](#saving-resources)
    - [second based accuracy](#second-based-accuracy)
  - [Documentation of the nodes](#documentation-of-the-nodes)
  - [CHANGELOG](#changelog)
  - [TODO](#todo)
  - [Support, Bugs and Feedback](#support-bugs-and-feedback)
  - [LICENSE](#license)
  - [Other](#other)

## Preconditions

These nodes need at least NodeJS Version __8.0__ and Node-Red with Version __1.0__! Any early Version of Node-Red will not work!

## Installation

`npm install node-red-contrib-sun-position`

## General

### Saving resources

The nodes are designed to do not calculate time events with every arriving message or with an interval every x time. This is to be able to handle a huge amount of messages also on even on computers with low resources.

### second based accuracy

The nodes are designed to be accurate to seconds. This means it was designed to turn on/off at exact given second. Other timers often work using intervals where they check your schedule only once a minute or even less. This means when you want something to come on at 08:00am, it may actually not come on until 30 seconds later. This nodes does not have this problem, it will come on at exactly 08:00:00am.

## Documentation of the nodes

The documentation of the nodes is moved to the [wiki](https://github.com/rdmtc/node-red-contrib-sun-position/wiki):

- [base functions for all (or the most of the nodes)](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/Base-Functions)
- [Implemented Nodes](https://github.com/rdmtc/node-red-contrib-sun-position/wiki)
  - [sun-position](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/sun-position)
  - [moon-position](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/moon-position)
  - [time-inject](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/time-inject)
  - [within-time](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/within-time)
  - [time-comp](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/time-comp)
  - [time-span](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/time-span)
  - [blind-control](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/blind-control)
  - [clock-timer](https://github.com/rdmtc/node-red-contrib-sun-position/wiki/clock-timer)

## CHANGELOG

- see [here the releases at npm](https://github.com/rdmtc/node-red-contrib-sun-position/releases).
- see [here the changelog of master](https://github.com/rdmtc/node-red-contrib-sun-position/blob/HEAD/CHANGELOG.md)
- see [here the changelog of dev](https://github.com/rdmtc/node-red-contrib-sun-position/blob/dev/CHANGELOG.md)

## TODO

- [ ] add possibility to select input/output timezone

## Support, Bugs and Feedback

For bugs, questions and feature requests please use the
[GitHub Issues](https://github.com/rdmtc/node-red-contrib-sun-position/issues), or the [Homematic forum](https://homematic-forum.de/forum/viewforum.php?f=77).

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

- [npm Releases / changelog](https://github.com/rdmtc/node-red-contrib-sun-position/releases)
- [newreleases.io](https://newreleases.io/npm/node-red-contrib-sun-position)
- [RedMatic Forum](https://homematic-forum.de/forum/viewforum.php?f=77)
- [RedMatic Wiki](https://github.com/rdmtc/RedMatic/wiki)
- [Github](https://github.com/rdmtc/node-red-contrib-sun-position)
- [NPM package](https://www.npmjs.com/package/node-red-contrib-sun-position)
- [Node-Red](https://flows.nodered.org/node/node-red-contrib-sun-position)
- [![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/rdmtc/node-red-contrib-sun-position)
- [![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U7U3315ED)
