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

![sun-position](images/sun-position-settings.png?raw=true)

### moon-position

![moon-position](images/sun-position-settings.png?raw=true)

### time-inject

![time-inject](images/time-inject-settings.png?raw=true)

### within-time

![within-time](images/within-time-settings.png?raw=true)


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
