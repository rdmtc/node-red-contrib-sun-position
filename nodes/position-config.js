module.exports = function (RED) {
    "use strict";
    function positionConfigurationNode(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.longitude = n.longitude;
        this.latitude = n.latitude;
        this.angleType = n.angleType;
        this.azimuthWestLow = n.azimuthWestLow;
        this.azimuthWestHigh = n.azimuthWestHigh;
        this.azimuthSouthLow = n.azimuthSouthLow;
        this.azimuthSouthHigh = n.azimuthSouthHigh;
        this.azimuthEastLow = n.azimuthEastLow;
        this.azimuthEastHigh = n.azimuthEastHigh;
        this.azimuthNorthLow = n.azimuthNorthLow;
        this.azimuthNorthHigh = n.azimuthNorthHigh;
        this.cachProp = (n.name) ? n.name + '-' : 'position-';
    }
    RED.nodes.registerType("position-config", positionConfigurationNode);
}