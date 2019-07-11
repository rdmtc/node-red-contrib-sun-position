---
Title: Rollladen und Jalousiesteuerung
Category: User Flows
link: https://github.com/rdmtc/RedMatic/wiki/Rollladen-und-Jalousiesteuerung
---

# Rollläden, Jalousien, Markisen mit Node-Red steuern

## Einleitung

Eine Rollladensteuerung ist nicht trivial. Diese Anleitung soll den Einstieg in dieses Thema bieten. Es kann beliebig weiter ausgebaut werden.

## Inhalt

* [Rollläden, Jalousien, Markisen mit Node-Red steuern](#Rollläden-Jalousien-Markisen-mit-Node-Red-steuern)
	* [Einleitung](#Einleitung)
	* [Inhalt](#Inhalt)
	* [Konzept](#Konzept)
	* [Vorbereitungen](#Vorbereitungen)
	* [TEIL 1: Einfache Steuerung nach Zeit/Sonnenstand](#TEIL-1-Einfache-Steuerung-nach-ZeitSonnenstand)
		* [Flow mit der node-red-contrib-sun-position nodes](#Flow-mit-der-node-red-contrib-sun-position-nodes)
			* [Value Node - Aktor](#Value-Node---Aktor)
			* [Time - Inject Node](#Time---Inject-Node)
				* [Zeit abhängig vom Sonnenstand](#Zeit-abhängig-vom-Sonnenstand)
				* [Zeit Offset und Tage](#Zeit-Offset-und-Tage)
				* [Hinweis - externe Daten](#Hinweis---externe-Daten)
			* [Beispiel-flow zur Ermittlung aller möglichen Sonnenzeiten](#Beispiel-flow-zur-Ermittlung-aller-möglichen-Sonnenzeiten)
	* [TEIL 2a: Grundlagen zur erweiterten Rollladensteuerung](#TEIL-2a-Grundlagen-zur-erweiterten-Rollladensteuerung)
		* [die Nodes des Flows](#die-Nodes-des-Flows)
			* [Inject Node](#Inject-Node)
			* [Node zur Rollladensteuerung vorbereiten](#Node-zur-Rollladensteuerung-vorbereiten)
	* [TEIL 2b: Rollladensteuerung mit der dedizierten Node](#TEIL-2b-Rollladensteuerung-mit-der-dedizierten-Node)
		* [einfache Steuerung der Rollläden nach Zeit](#einfache-Steuerung-der-Rollläden-nach-Zeit)
		* [Steuerung der Rollläden nach Zeit mit Wochenende](#Steuerung-der-Rollläden-nach-Zeit-mit-Wochenende)
			* [Vorbereitung für Wochenende und Feiertage](#Vorbereitung-für-Wochenende-und-Feiertage)
			* [Rollladensteuerung - Früh](#Rollladensteuerung---Früh)
			* [Rollladensteuerung - Abends](#Rollladensteuerung---Abends)
			* [Rollladensteuerung - Flow](#Rollladensteuerung---Flow)
		* [Steuerung der Rollläden Sonnenstands abhängig](#Steuerung-der-Rollläden-Sonnenstands-abhängig)
		* [Manuelles Überschreiben](#Manuelles-Überschreiben)
			* [Manuelle Steuerung bei Homematic](#Manuelle-Steuerung-bei-Homematic)
			* [Manuelle Steuerung erweitert, Bsp. Rollladen bei Feueralarm öffnen](#Manuelle-Steuerung-erweitert-Bsp-Rollladen-bei-Feueralarm-öffnen)
				* [zusätzlicher Logik nach der Node](#zusätzlicher-Logik-nach-der-Node)
				* [Überschreiben der Rollladenposition](#Überschreiben-der-Rollladenposition)
		* [Die Regelausführung, Caching, Bsp. Betrachten von Fensteröffnung](#Die-Regelausführung-Caching-Bsp-Betrachten-von-Fensteröffnung)
			* [Nachrichteneigenschaften](#Nachrichteneigenschaften)
			* [Wie die Regelauswertung funktioniert](#Wie-die-Regelauswertung-funktioniert)
			* [complexes Beispiel](#complexes-Beispiel)
	* [weiterführende Links](#weiterführende-Links)

## Konzept

Als erstes sollte man sich das Grundsätzliche Konzept der Rollladensteuerung überlegen. Möglichkeiten gibt es hier viele:

* Soll der Rollladen Nachts automatisch schließen
  * Wann soll der Rollladen morgens frühestens öffnen?
  * Wann soll der Rollladen abends spätestens schließen?
  * Neben einer Zeit Steuerung soll der Rollladen abhängig vom Tageslicht oder Sonnenstand schließen?
    * Ist ein licht-sensor vorhanden?
  * Sollen verschiedene Zeiten für Feiertage und Wochenende gelten?
* Muss der Rollladen beim öffnen des Fensters/der Tür automatisch öffnen oder eine Belüftung zulassen?
  * Wie wird das Öffnen erkannt, gibt es einen Fensterkontakt oder einen Drehgriffsensor?
* Muss der Rollladen im Falle eines Feuers öffnen?
* Muss der Rollladen im Falle von Abwesenheit schließen?
* Soll, wenn die Sonne in das Fenster scheint eine Beschattung realisiert werden?
* Soll bei einem Einbruchalarm alle Rollladen runterfahren?

## Vorbereitungen

* Installieren Sie RedMatic Paket oder Node-Red anderweitig
* Machen Sie sich mit den [Grundlagen](https://github.com/rdmtc/RedMatic/wiki/Node-RED) vertraut.
* prüfen Sie ob die Node [node-red-contrib-sun-position](https://flows.nodered.org/node/node-red-contrib-sun-position) [installiert](https://github.com/rdmtc/RedMatic/wiki/Node-Installation) sind und [installieren](https://github.com/rdmtc/RedMatic/wiki/Node-Installation) /updaten sie diese wenn nötig
* Wenn sie am Wochenende/Feiertags andere Zeiten zur Steuerung verwenden wollen, [installieren](https://github.com/rdmtc/RedMatic/wiki/Node-Installation) Sie sich die Node [node-red-contrib-german-holidays](https://flows.nodered.org/node/node-red-contrib-german-holidays)

Speziell bei Homematic beachten Sie Bitte das Thema ["reportValueUsage"](https://github.com/rdmtc/RedMatic/wiki/Faq#tastendruck-erzeugt-keine-events). So ist es bei Homematic Aktoren und Sensoren unter Umständen nötig, das diese so konfiguriert werden, das diese Ihren Status an die CCU übermitteln. Am einfachsten geht dies, wenn man auf der CCU ein "Dummy" Programm erstellt, indem einfach eine Dummy-Systemvariable auf einen Wert gesetzt wird, wenn sich ein Kanal des Aktors oder Sensors ändert.

## TEIL 1: Einfache Steuerung nach Zeit/Sonnenstand

Dieser Flow stellt exemplarisch dar, wie man seht einfach eine Jalousiesteuerung basierend auf Sonnenstand oder Zeit umsetzt.

### Flow mit der [node-red-contrib-sun-position](https://flows.nodered.org/node/node-red-contrib-sun-position) nodes

![image](https://user-images.githubusercontent.com/12692680/53870140-ec936500-3ff9-11e9-8b0b-9e776407fc4e.png)

```json
[{"id":"408a7420.db0dec","type":"ccu-value","z":"6de78cfb.a9dd74","name":"","iface":"BidCos-RF","channel":"LEQ0815018:3 Rollladen Bad","datapoint":"LEVEL","mode":"","start":true,"change":true,"cache":false,"on":0,"onType":"undefined","ramp":0,"rampType":"undefined","working":false,"ccuConfig":"78742432.c6d88c","topic":"${CCU}/${Interface}/${channel}/${datapoint}","x":800,"y":900,"wires":[[]]},{"id":"90acaf4.4d5255","type":"time-inject","z":"6de78cfb.a9dd74","name":"","positionConfig":"d9e9ca6a.952218","payload":"0.3","payloadType":"num","payloadTimeFormat":0,"payloadOffset":0,"payloadOffsetType":"none","payloadOffsetMultiplier":60000,"topic":"","time":"sunrise","timeType":"pdsTime","timeDays":"*","offset":"30","offsetType":"num","offsetMultiplier":60000,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetType":"none","timeAltOffsetMultiplier":60000,"once":false,"onceDelay":0.1,"addPayload1":"","addPayload1Type":"none","addPayload1Value":"","addPayload1ValueType":"date","addPayload1Format":"0","addPayload1Offset":0,"addPayload1OffsetType":"none","addPayload1OffsetMultiplier":60000,"addPayload1Days":"*","addPayload2":"","addPayload2Type":"none","addPayload2Value":"","addPayload2ValueType":"date","addPayload2Format":"0","addPayload2Offset":0,"addPayload2OffsetType":"none","addPayload2OffsetMultiplier":60000,"addPayload2Days":"*","addPayload3":"","addPayload3Type":"none","addPayload3Value":"","addPayload3ValueType":"date","addPayload3Format":"0","addPayload3Offset":0,"addPayload3OffsetType":"none","addPayload3OffsetMultiplier":60000,"addPayload3Days":"*","recalcTime":2,"x":500,"y":820,"wires":[["408a7420.db0dec"]]},{"id":"7adfb506.8b1dbc","type":"time-inject","z":"6de78cfb.a9dd74","name":"","positionConfig":"d9e9ca6a.952218","payload":"0.4","payloadType":"num","payloadTimeFormat":0,"payloadOffset":0,"payloadOffsetType":"none","payloadOffsetMultiplier":60000,"topic":"","time":"sunsetStart","timeType":"pdsTime","timeDays":"*","offset":"15","offsetType":"num","offsetMultiplier":60000,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetType":"none","timeAltOffsetMultiplier":60000,"once":false,"onceDelay":0.1,"addPayload1":"","addPayload1Type":"none","addPayload1Value":"","addPayload1ValueType":"date","addPayload1Format":"0","addPayload1Offset":0,"addPayload1OffsetType":"none","addPayload1OffsetMultiplier":60000,"addPayload1Days":"*","addPayload2":"","addPayload2Type":"none","addPayload2Value":"","addPayload2ValueType":"date","addPayload2Format":"0","addPayload2Offset":0,"addPayload2OffsetType":"none","addPayload2OffsetMultiplier":60000,"addPayload2Days":"*","addPayload3":"","addPayload3Type":"none","addPayload3Value":"","addPayload3ValueType":"date","addPayload3Format":"0","addPayload3Offset":0,"addPayload3OffsetType":"none","addPayload3OffsetMultiplier":60000,"addPayload3Days":"*","recalcTime":2,"x":510,"y":940,"wires":[["408a7420.db0dec"]]},{"id":"85633b81.4594f8","type":"time-inject","z":"6de78cfb.a9dd74","name":"","positionConfig":"d9e9ca6a.952218","payload":"1","payloadType":"num","payloadTimeFormat":0,"payloadOffset":0,"payloadOffsetType":"none","payloadOffsetMultiplier":60000,"topic":"","time":"sunriseEnd","timeType":"pdsTime","timeDays":"*","offset":"","offsetType":"none","offsetMultiplier":60000,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetType":"none","timeAltOffsetMultiplier":60000,"once":false,"onceDelay":0.1,"addPayload1":"","addPayload1Type":"none","addPayload1Value":"","addPayload1ValueType":"date","addPayload1Format":"0","addPayload1Offset":0,"addPayload1OffsetType":"none","addPayload1OffsetMultiplier":60000,"addPayload1Days":"*","addPayload2":"","addPayload2Type":"none","addPayload2Value":"","addPayload2ValueType":"date","addPayload2Format":"0","addPayload2Offset":0,"addPayload2OffsetType":"none","addPayload2OffsetMultiplier":60000,"addPayload2Days":"*","addPayload3":"","addPayload3Type":"none","addPayload3Value":"","addPayload3ValueType":"date","addPayload3Format":"0","addPayload3Offset":0,"addPayload3OffsetType":"none","addPayload3OffsetMultiplier":60000,"addPayload3Days":"*","recalcTime":2,"x":500,"y":880,"wires":[["408a7420.db0dec"]]},{"id":"ad925ed3.f1228","type":"time-inject","z":"6de78cfb.a9dd74","name":"","positionConfig":"d9e9ca6a.952218","payload":"0","payloadType":"num","payloadTimeFormat":0,"payloadOffset":0,"payloadOffsetType":"none","payloadOffsetMultiplier":60000,"topic":"","time":"sunset","timeType":"pdsTime","timeDays":"*","offset":"","offsetType":"none","offsetMultiplier":60000,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetType":"none","timeAltOffsetMultiplier":60000,"once":false,"onceDelay":0.1,"addPayload1":"","addPayload1Type":"none","addPayload1Value":"","addPayload1ValueType":"date","addPayload1Format":"0","addPayload1Offset":0,"addPayload1OffsetType":"none","addPayload1OffsetMultiplier":60000,"addPayload1Days":"*","addPayload2":"","addPayload2Type":"none","addPayload2Value":"","addPayload2ValueType":"date","addPayload2Format":"0","addPayload2Offset":0,"addPayload2OffsetType":"none","addPayload2OffsetMultiplier":60000,"addPayload2Days":"*","addPayload3":"","addPayload3Type":"none","addPayload3Value":"","addPayload3ValueType":"date","addPayload3Format":"0","addPayload3Offset":0,"addPayload3OffsetType":"none","addPayload3OffsetMultiplier":60000,"addPayload3Days":"*","recalcTime":2,"x":480,"y":1000,"wires":[["408a7420.db0dec"]]},{"id":"78742432.c6d88c","type":"ccu-connection","z":"","name":"Homematic-Dummy","host":"localhost","regaEnabled":false,"bcrfEnabled":true,"iprfEnabled":false,"virtEnabled":false,"bcwiEnabled":false,"cuxdEnabled":false,"regaPoll":false,"regaInterval":"120","rpcPingTimeout":"60","rpcInitAddress":"127.0.0.51","rpcServerHost":"127.0.0.1","rpcBinPort":"2047","rpcXmlPort":"2046","contextStore":"memory"},{"id":"d9e9ca6a.952218","type":"position-config","z":"","name":"Entenhausen","isValide":"true","longitude":"0","latitude":"0","angleType":"deg","timezoneOffset":"1"}]
```

#### Value Node - Aktor

In diesem Beispiel wird ein Homematic Rollladen oder Jalousie Aktor geschaltet. Dazu verwenden wir der Einfachheit die Value Node. Diese Node wird entsprechend des zu schaltenden Aktors konfiguriert. Bei Jalousie, Rollladen oder DImmer Aktoren ist der entsprechende LEVEL Datenpunkt zu wählen:
![image](https://user-images.githubusercontent.com/12692680/53871129-e2726600-3ffb-11e9-8ede-d108dcad1e20.png)

Hilfreich zur Ermittlung der Datenpunktes zu einem Aktor kann die Device Beschreibung sein. Diese kann man beim Hersteller der Homematic Komponenten [EQ-3](https://www.eq-3.de/) auf der Webseite im Service - Download Bereich herunterladen.

* Für Homematic (BidCoS RF) und Homematic-Wired (BidCoS Wired) ist es das Dokument "HomeMatic-Script Dokumentation - Teil 4: Datenpunkte".
* Für HomematicIP und HomematicIP-Wired Geräte ist es das Dokument "Homematic IP Devices - Technical Documentation".

Die LEVEL Datenpunkte benötigen dabei typischerweise eine Zahl als Payload, wobei 0 0% entspricht und 1 = 100%. Dementsprechend sind 25% = 0.25. (Bitte beachten, das man in RedMatic/Node-Red als Dezimaltrennzeichen für Zahlen den Punkt anstelle dem Komma verwendet.)

#### Time - Inject Node

Bei den time-inject Nodes lässt sich entsprechend die Payload einstellen. Diese muss also auf Nummer gestellt werden und als Wert wird der gewünschte Öffnungsgrad der Jalousie eingegeben:

![image](https://user-images.githubusercontent.com/12692680/53871519-b3a8bf80-3ffc-11e9-8aa9-44fcfebe82a4.png)

Unter Zeit wird die gewünschte Zeit gewählt, bei deren Erreichen die Jalousie den entsprechenden Öffnungsgrad annehmen soll.
Dafür gibt es folgende Optionen:
![image](https://user-images.githubusercontent.com/12692680/53871652-f4083d80-3ffc-11e9-9c1e-65fcadc39764.png)

* time - freies eingeben einer festen Uhrzeit
* sun time - Zeit abhängig vom Sonnen Stand, Zum Beispiel Sonnen auf oder Untergang
* moon time - Zeit abhängig vom Mond Auf oder Untergang
* flow, global - Die Zeit wird über einen RedMatic internen flow oder global context geliefert. Das sind so etwas wie in RedMatic interne Variablen.
* env variable - Die Zeit wird über eine Umgebungsvariable des dahinterliegenden Linux System geliefert.

##### Zeit abhängig vom Sonnenstand

Wenn man als Zeit Vorgabe zum Beispiel eine Zeit abhängig vom Sonnenstand gewählt hat ("sun time") kann man über ein Auswahlmenü die entsprechende Zeit wählen:
![image](https://user-images.githubusercontent.com/12692680/53872167-dbe4ee00-3ffd-11e9-956c-45733c32e387.png)

Die mögliche Auswahl ist im GitHub zum [node-red-contrib-sun-position](https://github.com/rdmtc/node-red-contrib-sun-position/blob/master/README.md) node [erläutert](https://github.com/rdmtc/node-red-contrib-sun-position/blob/master/README.md#sun-times). Der Einfachheit sind hier nur folgende erwähnt:

* sunrise - Beginn des Sonnenaufganges
* sunriseEnd - Ende des Sonnenaufganges
* sunsetStart - Beginn des Sonnenunterganges
* sunset - Ende des Sonnenunterganges

Am Ende des Artikels ist ein Flow zur Ermittlung aller möglichen Sonnenzeiten.

##### Zeit Offset und Tage

Mit dem Offset kann man die Sonnenzeit um eine bestimmte Zeitspanne verschieben. Das ist such im negativen möglich:
![image](https://user-images.githubusercontent.com/12692680/53874221-41d37480-4002-11e9-89b9-e5930f9d1ba3.png)

Bei der Wahl der Tage kann der Inject Node so konfiguriert werden, dass er nur an den gewählten Tagen die Nachricht sendet. Mit mehreren Inject Nodes kann man damit beispielsweise verschiedene Zeitpunkte zu verschiedenen Tagen (Wochenende/Woche) einstellen.

![image](https://user-images.githubusercontent.com/12692680/48483980-33740980-e815-11e8-850a-71538a9cd038.png)

##### Hinweis - externe Daten

Wenn man die Zeit Vorgabe oder den Offset über eine externe Definition (flow, global, env variable) erfolgt, bekommt die time-Inject Node nicht unmittelbar eine Änderung der Datenquelle mit. Es gibt für diesen Fall die Möglichkeit die Berechnung des Zeitpunktes in Einstellbaren Zeit Intervallen neu zu veranlassen:
![image](https://user-images.githubusercontent.com/12692680/53872076-adffa980-3ffd-11e9-8067-c970770213b8.png)

#### Beispiel-flow zur Ermittlung aller möglichen Sonnenzeiten

![image](https://user-images.githubusercontent.com/12692680/53872557-d2a85100-3ffe-11e9-99a0-b160ae31a122.png)

```json
[{"id":"89787b8d.ca1d18","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"10","payloadType":"num","topic":"","time":"solarNoon","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2020,"y":2030,"wires":[["4ea8fe4b.8b48a"]]},{"id":"e681ef57.708a9","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"19","payloadType":"num","topic":"","time":"nadir","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2000,"y":2480,"wires":[["4ea8fe4b.8b48a"]]},{"id":"c56ababe.bb7b28","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"7","payloadType":"num","topic":"","time":"sunrise","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2000,"y":1880,"wires":[["4ea8fe4b.8b48a"]]},{"id":"4a9cd409.d3ec3c","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"13","payloadType":"num","topic":"","time":"sunset","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2010,"y":2180,"wires":[["4ea8fe4b.8b48a"]]},{"id":"963b3d66.86307","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"8","payloadType":"num","topic":"","time":"sunriseEnd","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2020,"y":1930,"wires":[["4ea8fe4b.8b48a"]]},{"id":"5c9f095.224c8f8","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"12","payloadType":"num","topic":"","time":"sunsetStart","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2020,"y":2130,"wires":[["4ea8fe4b.8b48a"]]},{"id":"85e1cfa.c708d3","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"5","payloadType":"num","topic":"","time":"civilDawn","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2000,"y":1780,"wires":[["4ea8fe4b.8b48a"]]},{"id":"c32beb3a.14f188","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"15","payloadType":"num","topic":"","time":"civilDusk","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2000,"y":2280,"wires":[["4ea8fe4b.8b48a"]]},{"id":"5a89201d.51f2c","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"3","payloadType":"num","topic":"","time":"nauticalDawn","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2020,"y":1680,"wires":[["4ea8fe4b.8b48a"]]},{"id":"9392b463.89a928","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"1","payloadType":"num","topic":"","time":"astronomicalDawn","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2020,"y":1580,"wires":[["4ea8fe4b.8b48a"]]},{"id":"90cea9ff.964888","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"18","payloadType":"num","topic":"","time":"astronomicalDusk","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2020,"y":2430,"wires":[["4ea8fe4b.8b48a"]]},{"id":"33f5e4cd.e6ae6c","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"9","payloadType":"num","topic":"","time":"goldenHourEnd","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2010,"y":1980,"wires":[["4ea8fe4b.8b48a"]]},{"id":"59844aac.42e5c4","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"11","payloadType":"num","topic":"","time":"goldenHourStart","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"addPayload1":"","addPayload1Type":"none","addPayload1Value":"","addPayload1ValueType":"date","addPayload1Format":"0","addPayload1Offset":"0","addPayload1OffsetMultiplier":"60","addPayload1Days":"*","addPayload2":"","addPayload2Type":"none","addPayload2Value":"","addPayload2ValueType":"date","addPayload2Format":"0","addPayload2Offset":"0","addPayload2OffsetMultiplier":"60","addPayload2Days":"*","addPayload3":"","addPayload3Type":"none","addPayload3Value":"","addPayload3ValueType":"date","addPayload3Format":"0","addPayload3Offset":"0","addPayload3OffsetMultiplier":"60","addPayload3Days":"*","recalcTime":2,"x":2020,"y":2080,"wires":[["4ea8fe4b.8b48a"]]},{"id":"da05a6dc.34e068","type":"mqtt out","z":"b295b262.43b13","name":"","topic":"ccu/system/info/sun/time","qos":"0","retain":"false","broker":"ad1f3a00.8fd8f8","x":2730,"y":1890,"wires":[]},{"id":"4ea8fe4b.8b48a","type":"change","z":"b295b262.43b13","name":"","rules":[{"t":"set","p":"#:(memory)::sunType","pt":"global","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":2470,"y":1890,"wires":[["da05a6dc.34e068","db6a839c.e536c"]]},{"id":"db6a839c.e536c","type":"debug","z":"b295b262.43b13","name":"Type","active":true,"tosidebar":false,"console":false,"tostatus":true,"complete":"payload","x":2670,"y":1940,"wires":[]},{"id":"c7affbf9.9d8c28","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"4","payloadType":"num","topic":"","time":"blueHourDawnStart","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2030,"y":1730,"wires":[["4ea8fe4b.8b48a"]]},{"id":"4c4cf520.912f8c","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"6","payloadType":"num","topic":"","time":"blueHourDawnEnd","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2030,"y":1830,"wires":[["4ea8fe4b.8b48a"]]},{"id":"129f47e6.8dd898","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"14","payloadType":"num","topic":"","time":"blueHourDuskStart","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2030,"y":2230,"wires":[["4ea8fe4b.8b48a"]]},{"id":"5eccf283.8272ec","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"16","payloadType":"num","topic":"","time":"blueHourDuskEnd","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2030,"y":2330,"wires":[["4ea8fe4b.8b48a"]]},{"id":"85625aad.606e18","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"17","payloadType":"num","topic":"","time":"amateurDusk","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2020,"y":2380,"wires":[["4ea8fe4b.8b48a"]]},{"id":"31b95d52.d6edb2","type":"time-inject","z":"b295b262.43b13","name":"","positionConfig":"4a3a78f7.65d988","payload":"2","payloadType":"num","topic":"","time":"amateurDawn","timeType":"pdsTime","timeDays":"*","offset":0,"offsetMultiplier":60,"property":"","propertyType":"none","timeAlt":"","timeAltType":"entered","timeAltOffset":0,"timeAltOffsetMultiplier":60,"once":false,"onceDelay":0.1,"recalcTime":2,"x":2020,"y":1630,"wires":[["4ea8fe4b.8b48a"]]},{"id":"4a3a78f7.65d988","type":"position-config","z":"","name":"zuHause","isValide":"true","longitude":"0","latitude":"0","angleType":"deg","timezoneOffset":"1"},{"id":"ad1f3a00.8fd8f8","type":"mqtt-broker","z":"","name":"Mosquitto","broker":"localhost","port":"1883","clientid":"ccu","usetls":false,"compatmode":false,"keepalive":"60","cleansession":true,"birthTopic":"ccu/system/connection","birthQos":"0","birthRetain":"false","birthPayload":"start","closeTopic":"ccu/system/connection","closeQos":"0","closeRetain":"false","closePayload":"end","willTopic":"ccu/system/connection","willQos":"0","willPayload":"end unexpected"}]
```

## TEIL 2a: Grundlagen zur erweiterten Rollladensteuerung

Als Teil der [node-red-contrib-sun-position](https://flows.nodered.org/node/node-red-contrib-sun-position) Nodes gibt es einen dedizierte [Node für Rollladensteuerung](https://github.com/rdmtc/node-red-contrib-sun-position/blob/HEAD/blind_control.md).

### die Nodes des Flows

Unter der Palette fortgeschritten finden Sie die Node zur Rollladensteuerung:

![palette-blind](https://user-images.githubusercontent.com/12692680/59846604-96f08780-9360-11e9-9d6b-f5dea3555cab.png)

Ziehen Sie diese in den Arbeitsbereich.

Die Node zur Rollladensteuerung berechnet bei einem Eingangs-Signal die Behang Höhe des Rollladens. Von sich aus wird keine neue Behang Höhe berechnet, daher wird immer ein Signal zur Steuerung benötigt. Am Einfachsten geht dies mit einem Inject node aus der Palette Eingabe:

![palette-inject](https://user-images.githubusercontent.com/12692680/59846686-ce5f3400-9360-11e9-834b-0e90160e55e8.png)

An den Ausgang kann man direkt einen Homematic Rollladen Aktor hängen. Zum Testen kann auch erstmal eine Debug-Node aus der Palette Ausgabe gehangen werden:

![palette-debug](https://user-images.githubusercontent.com/12692680/59846854-3ca3f680-9361-11e9-8279-5fb1c3be6199.png)

Ziehen Sie die Nodes in den Flow und verbinden Sie diese miteinander:

![flow-blind-basic](https://user-images.githubusercontent.com/12692680/59846932-737a0c80-9361-11e9-8354-531b82a2ea96.png)

Als nächstes konfigurieren wir die Nodes. Dazu rufen Sie Bitte die Einstellung der Nodes nacheinander auf (per doppel-klick öffnen).

#### Inject Node

Der Inject Node wird so eingestellt, das dieser aller 10 Minuten ein Signal sendet. Als Signal dient einfach einfach der Zeitstempel. Solange die EingangsNachricht der Node Der Rollladensteuerung nicht eine bestimmte Topic oder Eigenschaft besitzt, führt die Nachricht nur zur Neuberechnung der Rollladenposition.

![inject-config-interval](https://user-images.githubusercontent.com/12692680/59848056-8215f300-9364-11e9-80c1-aeda75d6c3ff.png)

#### Node zur Rollladensteuerung vorbereiten

Bei diesem Node müssen Sie zuerst den konfigurationsknoten einstellen.
Wenn Sie bereits einen haben wählen Sie diesen, andernfalls erstellen Sie einen neuen.

![blind-config-control](https://user-images.githubusercontent.com/12692680/59848128-b093ce00-9364-11e9-8dd3-99126b60e83d.png)

Im Konfigurationsknoten müssen Sie nur die Koordinaten für Ihren Standort eingeben:

![position-config](https://user-images.githubusercontent.com/12692680/59848457-7c6cdd00-9365-11e9-83f2-45389fc6be5c.png)

Diese Koordinaten werden später intern zur Berechnung der Sonnenposition, des Sonnenstandes, etc... verwendet. Wenn Se nicht vorhaben eine Sonnensteuerung zu verwenden, können Sie hier auch andere Koordinaten eintragen. Beachten Sie dann aber, falls sie später auf Funktionen zurückgreifen, welche diese benötigen, dann falsche Ergebnisse bekommen.

Schließen Sie mit Fertig und auch die Einstellungen der Node zur Rollladensteuerung. Vergessen Sie nicht die Änderungen zu Deploy/Implementieren.

Wenn Sie jetzt den Button des Inject Node betätigen sendet der Rollladen Node eine 1, was 100% entspricht:

![flow-blind-basic-run](https://user-images.githubusercontent.com/12692680/59849231-547e7900-9367-11e9-823a-237c3c3b1cc4.png)

Falls sie eine Debug-Node am Ausgang haben, werden sie hierbei nur einmal die 1 sehen, auch wenn sie mehrfach den button betätigen. Der Node sendet in der Grundeinstellung nur eine geänderte Behanghöhe aus.

Für die weiteren Tele dieser Anleitung haben Sie damit  alles vorbereitet und können dort Fortfahren.

Hier gibt es den Flow auch fertig zum [Importieren](https://github.com/rdmtc/RedMatic/wiki/Flow-Import):

```json
[{"id":"bc85f5f8.590538","type":"debug","z":"d7bd7fb6.a0c13","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":685,"y":2520,"wires":[]},{"id":"29678e1a.5530f2","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":2520,"wires":[["52f48f8e.da889"]]},{"id":"52f48f8e.da889","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"","outputs":"1","blindIncrement":0.01,"blindOpenPos":1,"blindClosedPos":0,"blindPosReverse":false,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"","rules":[],"sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":420,"y":2520,"wires":[["bc85f5f8.590538"]]}]
```

In diesem Beispiel fehlt aber die Konfigurations-Node (gelbes Dreieck). Diese muss noch eingestellt werden.

## TEIL 2b: Rollladensteuerung mit der dedizierten Node

Im Folgenden werden verschiedene Möglichkeiten der Steuerung vorgestellt. Diese steigern sich in der Komplexität und Funktionsumfang. Bei der Erklärung bauen diese teilweise aufeinander auf.

### einfache Steuerung der Rollläden nach Zeit

Im folgenden soll der Rollladen früh um 7 Uhr öffnen und abends gegen 19 Uhr schließen.

Folgendes ist dafür einzustellen:

![blind-config-start](https://user-images.githubusercontent.com/12692680/60419048-b8653500-9be4-11e9-997a-8beedc61e8c0.png)

1. Es ist eine Konfigurations-Node nötig. Diese dient intern zur Steuerung. Auch wenn Sie in diesem Beispiel die Koordinaten nicht benötigen, ist es ratsam diese einzugeben um später die Sonnenstands abhängige Rollladensteuerung nutzen zu können.
2. Hier werden die Grundsätzlichen Eigenschaften des Rollladenaktors eingestellt.
   * Für Homematic Rollladen und Jalousieaktoren ist `1` offen, `0` geschlossen und die Schrittweite `0.01`
3. Fügen Sie jetzt 2 Regeln hinzu

![blind-config-rule-simple](https://user-images.githubusercontent.com/12692680/60419474-a46e0300-9be5-11e9-9221-b98f09748b94.png)

1. Die erste Regel soll den Rollladen von 0 Uhr bis 7 Uhr geschlossen halten. Dafür stellen Sie die Regel auf "bis" (1) und als Zeit 7:00 (2)
2. Die 2. Regel soll den Rollladen ab 19 Uhr schließen. Dafür stellen Sie die Regel auf "von" (3) und als Zeit 19:00 (4)
3. In der restlichen Zeit soll der Rollladen geöffnet sein. Hierfür wird der Standard auf offen festgelegt.

Bitte beachten Sie das alle Regeln vom Typ absolut eingestellt sind. Dies sit die Standard Einstellung:

![blind-config-rule-absolut](https://user-images.githubusercontent.com/12692680/60526780-4890a080-9cf1-11e9-8f58-5d4d113626af.png)

Für Regeln vom Typ Minimum oder Maximum ist das Verhalten grundsätzlich anders.

Damit ist das gewünschte Verhalten bereits erfüllt. Vergessen Sie nicht die Änderung zu speichern und den Flow zu deployen.

### Steuerung der Rollläden nach Zeit mit Wochenende

In diesem Beispiel soll der Rollladen früh 30 Minuten nach Sonnenaufgang öffnen, jedoch in der Woche nicht vor 6:30 Uhr und am Wochenende/Feiertag nicht vor 7 Uhr.
Am Abend soll der Rollladen 10 Minuten nach Sonnenuntergang schließen, jedoch nicht nach 22:30 Uhr in der Woche und wenn am nächsten Tag Wochenende/Feiertag ist nicht nach 23:00 Uhr.

#### Vorbereitung für Wochenende und Feiertage

Als erste Vorbereitung ist es nötig, das im System bekannt ist, wann Wochenende oder Feiertag ist. [Installieren](https://github.com/rdmtc/RedMatic/wiki/Node-Installation) Sie sich dafür beispielsweise die Node [node-red-contrib-german-holidays](https://flows.nodered.org/node/node-red-contrib-german-holidays).

Ziehen Sie 2 Inject, den Holiday Node und eine change Node in den Flow und verbinden Sie diese wie folgt:

![holiday-flow](https://user-images.githubusercontent.com/12692680/60429759-12bdc000-9bfc-11e9-8dc4-a6c924e0a1d0.png)

Die beiden Inject Nodes konfigurieren Sie Bitte wie folgt:

![inject-config-midnight](https://user-images.githubusercontent.com/12692680/60427652-6a0d6180-9bf7-11e9-9b90-91414b488f78.png)

![inject-config-start](https://user-images.githubusercontent.com/12692680/60427659-709bd900-9bf7-11e9-8259-d408ece9da14.png)

Der erste Node triggert das Ermitteln der Tagesinformation jeden Tag kurz nach Mitternacht und der zweite triggert immer kurz nach Node-Red Neustart, damit auch dann die Information.

Die Change Node ist so zu konfigurieren, das der Inhalt aus dem Payload der Nachricht persistent in einem Context gespeichert wird:

![change-config](https://user-images.githubusercontent.com/12692680/60429756-105b6600-9bfc-11e9-84ca-201a481dd951.png)

In der Feiertags-Node sind einfach die Feiertage oder freie Tage, welche für Sie gültig sind zu hinterlegen:

![holiday-config-basic](https://user-images.githubusercontent.com/12692680/60429003-69c29580-9bfa-11e9-932c-74bff8eb76c5.png)

Entgegen des Namens der Node ist das nicht nur für Deutschland beschränkt und auch nicht nur für Feiertage. Für Deutschland gibt es eine Eintrags-Hilfe. Wählen Sie hierfür Ihr Bundesland und fügen Sie die Feiertage für Ihr Bundesland mit dem entsprechenden Button ein:

![image](https://user-images.githubusercontent.com/12692680/60429108-a2fb0580-9bfa-11e9-8706-5425ef57a901.png)

Wenn Sie stattdessen eigene Feiertage, Freie Tage oder Tage mit besonderer Rollladensteuerung hinzufügen möchten, nutzen Sie den hinzufügen Button:

![image](https://user-images.githubusercontent.com/12692680/60430208-09812300-9bfd-11e9-8495-c18f90835a7e.png)

1. Betätigen Sie den Button
2. Editieren Sie den Tag am Besten über den erweiterten Dialog

Mittels des Dialoges zum Bearbeiten eines Feiertages können sie einen neuen Feiertag anlegen oder auch die Vordefinierte bearbeiten. Hierrüber können alle Eigenschaften bearbeitet werden:

![image](https://user-images.githubusercontent.com/12692680/60430247-2158a700-9bfd-11e9-9981-b2a3bc34e97a.png)

1. _optional_ mit der ID können sie dem Tag zur speziellen Steuerung eine ID vergeben. Dies ist jedoch freigestellt.
2. __Wichtig:__ Der Name des Tages gibt den Namen an. Dieser sollte vergeben werden.
3. _optional_ wenn ein Tag unter mehreren Namen bekannt ist können Sie heir dem Tag noch einen anderen Namen vergeben.
4. _optional_ Für eine spezielle Steuerung kann ein Tag auch einer der Kategorien zugeordnet werden.
5. __Wichtig:__ Das Datum des Tags. Hier kann dies als eine der folgenden Möglichkeiten eingegeben werden:
   * Festes Datum, wählen Sie das Datum in dem Feld darunter.
   * Relatives Datum zum Oster Sonntag. Viele Tage sind relativ zu Ostern. Die Node berechnet sich automatisch das Datum von Ostersonntag für das Jahr. Für einen derartigen Tag geben sie in dem Feld darunter einen positiven oder negativen Offset zum Ostersonntag in Tagen an. Beispielsweise ist Ostermontag ein Tag nach Ostersonntag und damit ist der Offset hier `1`. Der Karfreitag hingegen ist 2 Tage vor Ostersonntag und damit ist hierfür ein Offset von `-2` anzugeben.
   * Relatives Datum zum 4. Advent. Ähnlich zu Ostern können sie auch ein Datum relativ zum 4. Advent eingeben. Beispielsweise ist der Buß- und Bettag 32 Tage vor dem 4. Advent. Hierfür ist ein Offset von `-32` anzugeben.
   * erster Wochentag im Monat. Wenn ein Tag beispielsweise immer am 1. Sonntag eines Monats stattfindet können Sie dies hiermit einstellen. Dafür geben Sie den Monat, die Position (erster, zweiter, ...) und den Wochentag (Montag, Dienstag, ...) an.
   * letzter Wochentag im Monat. Umgekehrt zum ersten Wochentag im Monat können sie auch einen Termin definieren, der beispielsweise immer am letzten Freitag eines Monats stattfindet.

Diesen kurzen Flow hier ebenfalls als export:

```json
[{"id":"3baf2a6d.a96056","type":"german-holidays","z":"c4313d2c.5d102","name":"","topic":"","region":"","holidays":[],"specialdays":[],"x":1125,"y":240,"wires":[["fe9a21a4.6a652"]]},{"id":"17016240.1ea76e","type":"inject","z":"c4313d2c.5d102","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"10 00 * * *","once":false,"onceDelay":0.1,"x":940,"y":240,"wires":[["3baf2a6d.a96056"]]},{"id":"fe9a21a4.6a652","type":"change","z":"c4313d2c.5d102","name":"","rules":[{"t":"set","p":"day","pt":"global","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":1325,"y":240,"wires":[[]]},{"id":"8e49c2d0.17a18","type":"inject","z":"c4313d2c.5d102","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":940,"y":285,"wires":[["3baf2a6d.a96056"]]}]
```

Nach dem Speichern und Deploy dieses Flows sollte jetzt in der Sidebar der Kontext-Daten unter global die entsprechenden Werte auftauchen:

![context-sidebar-day-info](https://user-images.githubusercontent.com/12692680/60436416-443e8780-9c0c-11e9-953f-c4bb09030f72.png)

Damit haben sie jetzt neben einer Vielzahl anderer Informationen die folgenden verfügbar:

* `global.day.today.isWeekend` - ist `true`, wenn heute Samstag oder Sonntag ist, sonst `false`
* `global.day.today.isWeekendOrHoliday` - ist `true`, wenn heute ein Feiertag oder Wochenende ist, sonst `false`
* `global.day.tomorrow.isWeekend` - ist `true`, wenn morgen ein Samstag oder Sonntag ist, sonst `false`
* `global.day.tomorrow.isWeekendOrHoliday` - ist `true`, wenn morgen ein Feiertag oder Wochenende ist, sonst `false`

#### Rollladensteuerung - Früh

Aufbauend auf den vorhergehenden Beispielen werden jetzt die Regeln so erweitert, dass der Rollladen früh 30 Minuten nach Sonnenaufgang öffnet, jedoch in der Woche nicht vor 6:30 Uhr und am Wochenende/Feiertag nicht vor 7 Uhr.

Diese Anforderung hat 2 Schwierigkeiten.

* Der Sonnenaufgang kann im Sommer anders als im Winter doch deutlich vor 6:30 Uhr stattfinden.
* Es sollen unterschiedliche Zeiten für Wochenende und Woche gelten.

Grundsätzlich kann man die Anforderung jedoch wie folgt umformulieren:

1. Bis 6:30 Uhr soll der Rollladen auf jeden Fall geschlossen bleiben.
2. Bis 7 Uhr soll der Rollladen nur am Wochenende/Feiertags geschlossen bleiben.
3. Bis 30 Minuten nach Sonnenaufgang soll der Rollladen geschlossen bleiben, wenn dies nach einer der beiden Regeln vorher erfolgt ist.

Wenn die Regeln in dieser Art formuliert werden, sind diese sehr einfach auch in dieser Weise aufsetzbar:

![blind-rule-until1](https://user-images.githubusercontent.com/12692680/60437333-689b6380-9c0e-11e9-8e7a-18024482fb9c.png)

* Die erste Regel, hält den Rollladen geschlossen bis 6:30 ohne eine Bedingung.
* Die zweite Regel ist nur aktiv, wenn der Wert von `global.day.today.isWeekendOrHoliday` den Wert `true` besitzt. Mit dem zuvor aufgebauten Flow mit der [node-red-contrib-german-holidays](https://flows.nodered.org/node/node-red-contrib-german-holidays) Node ist dies sehr einfach umgesetzt. Hier kann man auch eine andere Bedingung verwenden.
* Die dritte Regel ist die Steuerung abhängig vom Sonnenaufgang.

Für Regeln vom Typ Absolut gilt:
Die __bis__ Zeit-Regeln werden der Reihen nach aufsteigend abgearbeitet. Die erste Regel, deren Zeit größer ist als die aktuelle Zeit wird gewählt. Nachfolgende Regeln werden nicht mehr betrachtet. Damit wird die 3. Regel mit der Sonnensteuerung nur aktiv, wenn die Zeit dieser Regel nach der Zeit der vorhergehenden Regeln ist.

Damit sind die Regeln für Früh bereits fertig.

#### Rollladensteuerung - Abends

Am Abend soll der Rollladen 10 Minuten nach Sonnenuntergang schließen, jedoch nicht nach 22:30 Uhr in der Woche und wenn am nächsten Tag Wochenende/Feiertag ist nicht nach 23:00 Uhr.

Auch hier hilft es die Anforderung etwas umzuformulieren:

1. Ab 23 Uhr soll der Rollladen auf jeden Fall geschlossen sein.
2. Ab 22:30 Uhr soll der Rollladen nur in der Woche geschlossen sein.
3. Ab 10 Minuten nach Sonnenuntergang soll der Rollladen ebenfalls geschlossen sein, wenn dies vor einer der beiden Regeln erfolgt ist.

Dreht man diese Regel, kann man das mit Regeln vom Typ von genauso aufsetzen:

![blind-rule-from1](https://user-images.githubusercontent.com/12692680/60442502-72769400-9c19-11e9-9a63-c0a40f342dc5.png)

* Die sechste Regel hält den Rollladen ab 23:00 geschlossen ohne eine Bedingung.
* Die fünfte Regel ist nur aktiv, wenn der Wert von `global.day.tomorrow.isWeekendOrHoliday` den Wert `false` besitzt. Damit ist diese nut in der Woche aktiv.
* Die vierte Regel ist bis 10 Minuten nach dem Ende des Sonnenunterganges aktiv und schließt ab dann den Rollladen.

Zu beachten ist, das diese Regeln alle vom Typ __von__ (und Absolut) sind. Für die __von__ Regeln gilt, dass diese nur betrachtet werden, wenn zuvor keinen der __bis__ Regeln gewählt wurde. Dabei werden die __von__ Regeln absteigend von der letzten Regel ausgewertet. Die dabei erste Regel deren Zeit kleiner als die aktuelle Zeit ist wird gewählt.
Anders formuliert: Es ist immer die _letzte_ __von__ Regel aktiv, deren Zeit größer als die aktuelle Zeit ist. Damit wird die 4. Regel mit der Sonnensteuerung nur aktiv, wenn die Zeit dieser Regel vor der Zeit der nachfolgenden Regeln ist.

#### Rollladensteuerung - Flow

```json
[{"id":"6f728cc7.e1dbe4","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"","outputs":1,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"index":0,"timeValue":"6:30","timeType":"entered","timeOp":"0","timeOpText":"↥ bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"},{"index":1,"timeValue":"7:00","timeType":"entered","timeOp":"0","timeOpText":"↥ bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"day.today.isWeekendOrHoliday","validOperandAType":"global","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"},{"index":2,"timeValue":"sunrise","timeType":"pdsTime","timeOp":"0","timeOpText":"↥ bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"30","offsetType":"num","multiplier":"60000","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"},{"index":3,"timeValue":"sunset","timeType":"pdsTime","timeOp":"1","timeOpText":"↧ von","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"10","offsetType":"num","multiplier":"60000","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"},{"index":4,"timeValue":"22:30","timeType":"entered","timeOp":"1","timeOpText":"↧ von","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"day.tomorrow.isWeekendOrHoliday","validOperandAType":"global","validOperator":"false","validOperatorText":"ist false","validOperandBValue":"","validOperandBType":"str"},{"index":5,"timeValue":"23:00","timeType":"entered","timeOp":"1","timeOpText":"↧ von","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"}],"sunControlMode":"0","sunFloorLength":"0.6","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"1.28","windowBottom":"0","windowAzimuthStart":"70","windowAzimuthEnd":"150","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":625,"y":3375,"wires":[["1ae4e39a.15056c"]]},{"id":"8ddb151c.a89b98","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":385,"y":3375,"wires":[["6f728cc7.e1dbe4"]]},{"id":"1ae4e39a.15056c","type":"debug","z":"d7bd7fb6.a0c13","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":880,"y":3375,"wires":[]}]
```

In diesem Beispiel fehlt aber die Konfigurations-Node (gelbes Dreieck). Diese muss noch eingestellt werden.

### Steuerung der Rollläden Sonnenstands abhängig

Die vorherigen Beispiele lassen sich um eine Sonnensteuerung erweitern. Das bedeutet der Rollladen soll Tagsüber soweit schließen, dass nicht zu viel Sonnenlicht in den Raum fällt.
Dabei ist die Sonnensteuerung nur aktiv, wenn keine der Regeln zutrifft.

Um die Sonnensteuerung zu nutzen ist folgendes einzustellen:

![sun-control-1](https://user-images.githubusercontent.com/12692680/60419989-e3508880-9be6-11e9-9262-989db5fdba45.png)

1. Als erstes ist die Sonnensteuerung zu aktivieren.
2. als nächstes muss definiert werden, wann die Sonne in das Fenster scheint. Dafür ist der Sonnen-azimuth anzugeben, wann die Sonne das in das Fenster fällt. Diese Winkel können sie beispielsweise über eine Webseiten wie beispielsweise https://www.suncalc.org/ oder http://suncalc.net/ ermitteln.
3. Als nächstes ist die Fenster Ober und unterkante anzugeben. Die Einheit (cm , m ,...) ist hier egal, muss aber überall gleich sein.
4. Als letztes geben sie an wieviel Sonnenlicht durch das Fenster fallen darf (als länge auf dem Boden).

![sun-control-2](https://user-images.githubusercontent.com/12692680/60426748-90ca9880-9bf5-11e9-8e3e-8ac7210923d3.png)

5. Für Homematic Funk-Rolllandenaktoren ist noch empfehlenswert die Änderungshäufigkeit zu beschränken. Dies kann über die Mindeständerung (Bsp. als `0.1`) oder eine Zeit Beschränkung (glätten Bsp. 10 Minuten) einzuschränken um die Anzahl der Funk-Telegrame zu verringern.
6. Die minimale Rollladenposition kann erstmal auf geschlossen und die maximale Rollladenposition als offen eingestellt sein.
7. Eine Übersteuerung ist für den ersten Test sicher nicht nötig. Im späteren Betrieb möchte man vielleicht die Sonnensteuerung bei Bewölkung abschalten. Dann ist hier die entsprechende Stellgröße zu konfigurieren.

Damit ist das gewünschte Verhalten bereits erfüllt. Vergessen Sie nicht die Änderung zu speichern und den Flow zu deployen.

### Manuelles Überschreiben

Oft gibt es die Anforderung das eine manuelle Bedienung der Rollläden dazu führen soll, das der Automatismus außer Kraft gesetzt wird.

Hierzu lässt sich in den Node für die Rollladensteuerung eine Nachricht senden, dessen Topic einen Wert wie `levelOverwrite` enthält und dessen Payload eine Zahl der gewünschten Rollladenposition ist.

Um dieses Überschreiben wieder Zurückzusetzen ist eine Nachricht mit dem Topic `resetOverwrite` nötig. Der Payload der Nachricht ist in diesem Falle egal.

Zusätzlich bietet die Steuerung auch ein automatisches Zurücksetzen des Überschreibens nach einer Zeit:

![blind-override](https://user-images.githubusercontent.com/12692680/60445465-8e7d3400-9c1f-11e9-955d-fe482e3ccbbe.png)

Ist hier eine Zeit eingestellt, verfällt das Überschreiben nach dieser Zeit.

#### Manuelle Steuerung bei Homematic

In der Homematic-Welt will man diese manuelle Steuerung typischerweise aktivieren, wenn ein Rollladen mit einem Tastendruck am Aktor oder an einem direktverknüpften Taster in eine andere Position gefahren wird. (Bitte das Thema ["reportValueUsage"](https://github.com/rdmtc/RedMatic/wiki/Faq#tastendruck-erzeugt-keine-events) beachten.)

Dazu kann man anstelle der gewünschten Rollladenposition auch den Wert `-1` als Payload mit dem Topic `levelOverwrite` an die Rolllasen-node senden und erreicht damit das gewünschte Verhalten.

![homematic-override](https://user-images.githubusercontent.com/12692680/60466794-f601a680-9c54-11e9-9604-b5ca9a013033.png)

Die change Node ist dabei sehr einfach:

![homematic-override-change](https://user-images.githubusercontent.com/12692680/60466820-07e34980-9c55-11e9-9059-e0b1ea7983a6.png)

#### Manuelle Steuerung erweitert, Bsp. Rollladen bei Feueralarm öffnen

Eine Anforderung ist es oft, dass bei einem Feueralarm die Rollläden öffnen sollen. Die Node ist so ausgelegt, das man verschiedenste Anforderungen sehr flexibel umsetzen kann.

Für jegliche Anforderungen gibt es im Grunde meist 3 Mögliche Lösungswege:

* Mit zusätzlicher Logik nach der Node.
* Mittels Überschreiben der Rollladenposition
* Mittels Regeln

Die ersten beiden Lösungsmöglichkeiten sollen hier beschrieben werden. Die letzte wird dann folgend an einer anderen Anforderung erläutert.

##### zusätzlicher Logik nach der Node

Um die Anforderung mittels extra Logik nach der Node zu realisieren und den Aktor direkt anzusteuern kann man eine Logik wie hier abgebildet ist verwenden:

![blind-control-alarm-1](https://user-images.githubusercontent.com/12692680/60504124-47e01600-9cc1-11e9-9bdd-6e4159ee5982.png)

Hier wird im Falle eines Feueralarms über den Switch-Node verhindert, das die Rollladen-Node eine Position vorgeben kann, solange der Alarm noch nicht quittiert wurde. Über einen extra Pfad wird der Rollladen Aktor geöffnet. Bei Homematic Aktoren wäre für das Öffnen auch eine Direktverknüpfung mit einem virtuellen Kanal der CCU eine sehr gute Möglichkeit.

##### Überschreiben der Rollladenposition

Eine andere Möglichkeit die Anforderung umzusetzen ist ebenfalls dies mit dem Überschreiben der Rollladenposition zu realisieren. Hier möchte man aber vielleicht kein automatisches Zurücksetzen und kein anderes Übersteuern zulassen.

Dafür gibt es die Möglichkeit beim Übersteuerung zusätzlich eine Priorität in Form einer Nachrichteneigenschaft `msg.priority` mit einer Zahl größer 0 mitzugeben. Dabei gilt,je höher diese Zahl ist, desto höher ist die Priorität. Nachrichten ohne Priorität besitzen intern die Priorität des Wertes 1.

Beim Reset des Übersteuerns mittels Topic `resetOverwrite` kann man ebenfalls eine Priorität mitgeben und dann wird nur zurückgesetzt, wenn die Priorität des Überschreibens kleiner oder gleich der Priorität des Reset ist.

Die einstellbare Zeit für den Verfall des Überschreibens ist nur für Überschreiben von der Priorität des Wertes 1. (Bei Bedarf kann das automatische verfallen aber auch der Nachricht für das Überschrieben mitgegeben werden und so je nach Anwendungsfall eine andere Verfallszeit genutzt werden.)

![blind-control-alarm-2](https://user-images.githubusercontent.com/12692680/60467008-a079c980-9c55-11e9-8775-885f78bb6702.png)

Die Change Node kann dabei wie folgt konfiguriert werden:

![blind-control-alarm-3](https://user-images.githubusercontent.com/12692680/60466931-60b2e200-9c55-11e9-902f-0aa714df7c1f.png)

### Die Regelausführung, Caching, Bsp. Betrachten von Fensteröffnung

Oft möchte man bei einem offenen Fenster eine spezielle Anforderung realisieren:

* Bei einer Tür soll der Rollladen sich nicht schließen, wenn diese offen ist.
* Bei einem Fenster sollen die Rollladen auf bestimmte Belüftungs-Positionen fahren, wenn das Fenster geöffnet ist.

Die Umsetzung der Anforderungen kann man hier genauso wie beim Feueralarm beschrieben mit Logik nach der Node oder mit einem Überschreiben realisieren.

Da dies bereits beschrieben ist, soll hier die Variante über Regeln beschrieben werden. Welche der Varianten die günstigste ist kommt sicher auf den konkreten Anwendungsfall oder auf persönliche Vorlieben an. Das hier beschriebene dient lediglich dafür die Grundlagen zu erläutern.

#### Nachrichteneigenschaften

Als Bedingung für eine Regel kann auch eine Eigenschaft einer Nachricht ausgewertet werden, welcher an die Rollladen Node gesendet wird:

![blind-control-open-1](https://user-images.githubusercontent.com/12692680/60505637-6b589000-9cc4-11e9-9c8a-98d66a294d3b.png)

Dabei wird beim Erhalt einer Nachricht die Eigenschaft zwischengespeichert. Es muss damit nicht jede Eingangs-Nachricht die betreffende Eigenschaft haben, sondern es braucht nur bei Änderung des Zustandes eine Nachricht mit der betreffenden Eigenschaft gesendet werden.

Ist dem Node eine Eigenschaft nicht bekannt (weil noch nie eine Nachricht mit der entsprechenden Eigenschaft empfangen wurde), wird ein Standard-Wert (meist null) angenommen und eine Warnung ausgegeben:

![blind-control-open-2](https://user-images.githubusercontent.com/12692680/60505993-284aec80-9cc5-11e9-9bef-6b087f13ec42.png)

Daher sollte sichergestellt werden, das beim Start von Node red initial alle aktuellen Stati übermittelt werden. Für Homematic kann man es so einstellen, das die Nodes beim Start den der CCU bekannten Status aussenden.

#### Wie die Regelauswertung funktioniert

Neben den Zeit-Regeln gibt es auch die Möglichkeit Regeln ohne Zeit-Beschränkung, nur mit einer Bedingung aufzusetzen. Diese Regeln werden entsprechend der Reihenfolge mit den Zeit-Regeln ausgewertet.

Die genaue Logik ist wie folgt:

1. Das System wertet von der ersten Regel an beginnend der Reihen nach aufsteigend bis zur letzten __bis__ Regel (oder falls es keine __bis__ Regel gibt bis zur letzten Regel) aus.
   * Regeln deren Bedingung nicht zutreffen werden übersprungen.
   * Regeln vom Zeit-Typ __von__ werden übersprungen.
   * Die erste Regel vom Level Typ __absolut__, die keinerlei Zeit-Einschränkung hat oder deren Zeit größer ist als die aktuelle Zeit wird gewählt.
     * Nachfolgende Regeln werden nicht mehr betrachtet, auch nicht wenn diese keine Zeit-Einschränkung haben.
2. Wenn unter 1. keine Regel gefunden wurde, wertet das System die Regeln absteigend von der letzten Regel aus.
   * Regeln deren Bedingung nicht zutreffen werden übersprungen.
   * Regeln vom Zeit-Typ __bis__ werden übersprungen.
   * Die dabei erste Regel vom Level Typ __absolut__ die keinerlei Zeit-Einschränkung hat oder deren Zeit kleiner als die aktuelle Zeit ist wird gewählt.
   * Weitere Regeln werden nicht ausgewertet, auch nicht wenn diese keine Zeit-Einschränkung haben.
3. Wenn mit 1.und 2. keine Regel gefunden wurde, wird der standard-Wert für die Rollladensteuerung genommen und die Sonnensteuerung kann aktiv gehen.

Die Regeln im Bereich zwischen der letzten __bis__ Regel und der ersten __von__ Regel wird dabei nur ausgewertet, wenn keine andere Regel aktiv geht. Dies lässt sich nutzen um spezielle Steuerung während dieser Zeit zu ermöglichen.

Neben den Regeln vom Level Typ __absolut__ gibt es noch die Regeln vom Typ Minimum, Maximum und Minimum, Maximum reset. Diese Regeln werden Grundsätzlich genauso ausgewertet.
Wenn eine der Regeln zutrifft, wird jedoch die Auswertung fortgesetzt und bei der Minimum, bzw. Maximum Regel merkt sich das System die jeweils letzte Regel der jeweiligen Art (letzte Minimum, letzte Maximum). Wenn bei der Auswertung eine der Zurücksetzen Regeln zutrifft, wird die gemerkte Regel verworfen. Die am Ende übrig gebliebene Regel vom Typ Minimum und die übrig gebliebene Regel vom Typ Maximum wird angewendet. Bei der Anwendung dieser Minimum/Maximum Regeln ist es egal durch was die Rollladenposition (Regel, Sonnenposition, default,...) bestimmt wurde.

Gerade für den Anwendungsfall der Fensteröffnung lässt sich dies gut nutzen.
Möchte man das bei offenem Fenster der Rollladen mindestens 10% geöffnet wird, kann man damit beispielsweise folgende Regel als 1. Regel vom level-Typ Minimum setzen:

![blind-control-open-3](https://user-images.githubusercontent.com/12692680/60526960-a1f8cf80-9cf1-11e9-83e0-043361af7736.png)

Damit wird sichergestellt, das bei offenem Fenster der Rollladen immer 10% geöffnet ist.

Möchte man das diese Regel nur Nachts aktiv geht, kann man nach der letzten __bis__ Regel und vor der ersten __von__ Regel dies auch wieder zurücksetzen:

![image](https://user-images.githubusercontent.com/12692680/60527555-c0ab9600-9cf2-11e9-9cba-cc856eb56f32.png)

#### complexes Beispiel

Für das Testen haben die vorhergehenden Beispiele den Nachteil, das man hiermit nicht das Verhalten der Einstellungen zu verschiedenen Tageszeiten testen kann. Die Rollladen node bietet dafür die Möglichkeit in der Eingangsnachricht einen Zeitpunkt mitzugeben als `msg.ts`. Damit kann eine bestimmter Zeitpunkt vorgegeben werden.

Mit Hilfe des folgenden Flows kann man jetzt dies testen. Beim Inject über Start wird bei 0 Uhr die Zeit gestartet und in 30 Minuten Schritten jeweils pro Sekunde hochgezählt. Mittels Stop kann man das stoppen.

![blind-control-example-3](https://user-images.githubusercontent.com/12692680/60344573-24faec80-99b7-11e9-8b5c-772c7828047d.png)

```json
[{"id":"9f40dfd7.71532","type":"function","z":"d7bd7fb6.a0c13","name":"30min 0.5sec","func":"\nconst minutesEachLoop = 30; // minutes to add\nconst loopCycle = 0.5; // seconds delay\nlet timeObj = context.get(\"timeObj\");\n\nif (timeObj && msg.topic.includes('stop')) {\n    clearInterval(timeObj);\n    context.set(\"timeObj\", null);\n    context.set(\"orgtopic\", null);\n    let d = new Date(context.get(\"date\"));\n    node.log(\"STOP    \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ' + d.toISOString());\n    node.status({fill:\"red\",shape:\"ring\",text:\"stopped - \" + d.toLocaleTimeString()});\n    return null;\n} else if (!timeObj && msg.topic.includes('start')) {\n    context.set(\"message\", msg);\n    context.set(\"orgtopic\", msg.topic);\n    let d = new Date();\n    let num = Number(msg.payload) || 0;\n    d.setHours(num);\n    d.setMinutes(0);\n    context.set(\"date\", d.getTime());\n    msg.tsISO = d.toISOString();\n    msg.ts = d.getTime();\n    msg.topic += ' ' + d.toLocaleTimeString();\n    node.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');\n    node.log(\"START   \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n    node.send(msg);\n\n    let timeObj = setInterval(function(){\n        let msg = context.get(\"message\");\n        let topic = context.get(\"orgtopic\");\n        let d = new Date(context.get(\"date\"));\n        //d.setHours(d.getHours()+1);\n        let dt = d.getDate();\n        let dm = d.getMonth();\n        d.setMinutes(d.getMinutes() + minutesEachLoop)\n        d.setDate(dt);\n        d.getMonth(dm);\n        context.set(\"date\", d.getTime());\n        msg.tsISO = d.toISOString();\n        msg.ts = d.getTime();\n        msg.topic = topic + ' ' + d.toLocaleTimeString();\n        node.status({fill:\"green\",shape:\"dot\",text:\"run - \" + d.toLocaleTimeString()});\n        node.log(\"sending \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\n        node.send(msg);\n\t}, (1000 * loopCycle));\n    context.set(\"timeObj\", timeObj);\n    node.status({fill:\"green\",shape:\"ring\",text:\"start - \" + d.toLocaleTimeString()});\n    return null;\n}\n\nlet d = new Date(context.get(\"date\"));\nif (!(d instanceof Date) || isNaN(d)) {\n    d = new Date();\n}\nd.setMinutes(d.getMinutes() + 1)\n//d.setHours(d.getHours()+1);\nmsg.tsISO = d.toISOString();\nmsg.ts = d.getTime();\nmsg.topic += ' ' + d.toLocaleTimeString();\nnode.status({fill:\"yellow\",shape:\"dot\",text:\"interposed - \" + d.toLocaleTimeString()});\nnode.log(\"sending interposed msg \" + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);\nnode.send(msg);\nreturn null;","outputs":1,"noerr":0,"x":490,"y":4275,"wires":[["617f833.f37ee7c"]]},{"id":"94f315b8.1051f8","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"start/stop","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":195,"y":4230,"wires":[["9f40dfd7.71532"]]},{"id":"546da2c0.686c9c","type":"inject","z":"d7bd7fb6.a0c13","name":"reset","topic":"resetOverwrite","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":4320,"wires":[["9f40dfd7.71532"]]},{"id":"d81e3831.29c088","type":"inject","z":"d7bd7fb6.a0c13","name":"0%","topic":"levelOverwrite","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":4360,"wires":[["9f40dfd7.71532"]]},{"id":"450db993.b7bc68","type":"inject","z":"d7bd7fb6.a0c13","name":"60%","topic":"levelOverwrite","payload":"0.6","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":170,"y":4405,"wires":[["9f40dfd7.71532"]]},{"id":"cacc7caf.f49aa","type":"comment","z":"d7bd7fb6.a0c13","name":"manual overrides:","info":"","x":165,"y":4275,"wires":[]},{"id":"973d6032.62885","type":"inject","z":"d7bd7fb6.a0c13","name":"90%, expire 2,5s","topic":"","payload":"{\"position\":0.9,\"expire\":2500}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":200,"y":4455,"wires":[["9f40dfd7.71532"]]},{"id":"b86adfcb.7f703","type":"inject","z":"d7bd7fb6.a0c13","name":"30% Prio 1","topic":"","payload":"{\"position\":0.3,\"prio\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":180,"y":4500,"wires":[["9f40dfd7.71532"]]},{"id":"a701e311.0594f","type":"inject","z":"d7bd7fb6.a0c13","name":"100% prio 1","topic":"","payload":"{\"priority\":1, \"position\":1}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":4545,"wires":[["9f40dfd7.71532"]]},{"id":"617f833.f37ee7c","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"","outputs":1,"blindIncrement":"0.01","blindOpenPos":"1","blindClosedPos":0,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"7200000","rules":[{"index":0,"timeValue":"","timeType":"none","timeOp":"0","timeOpText":"↥ bis","levelValue":"10%","levelType":"levelFixed","levelOp":"1","levelOpText":"⭳❗  Minimum (übersteuernd)","offsetValue":"","offsetType":"none","multiplier":"60000","validOperandAValue":"windowOpen","validOperandAType":"msg","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"windowOpen","validOperandBType":"str"},{"index":1,"timeValue":"5:30","timeType":"entered","timeOp":"0","timeOpText":"↥ bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"},{"index":2,"timeValue":"7:25","timeType":"entered","timeOp":"0","timeOpText":"↥ bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"day.today.isWeekendOrHoliday","validOperandAType":"global","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"},{"index":3,"timeValue":"civilDawn","timeType":"pdsTime","timeOp":"0","timeOpText":"↥ bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"},{"index":4,"timeValue":"","timeType":"none","timeOp":"0","timeOpText":"↥ bis","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"3","levelOpText":"⭳✋ Minimum zurücksetzen","offsetValue":"","offsetType":"none","multiplier":"60000","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"num"},{"index":5,"timeValue":"","timeType":"none","timeOp":"0","timeOpText":"↥ bis","levelValue":"50%","levelType":"levelFixed","levelOp":"2","levelOpText":"⭱️❗  Maximum (übersteuernd)","offsetValue":"","offsetType":"none","multiplier":"60000","validOperandAValue":"raining","validOperandAType":"msg","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"num"},{"index":6,"timeValue":"civilDusk","timeType":"pdsTime","timeOp":"1","timeOpText":"↧ von","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"},{"index":7,"timeValue":"21:25","timeType":"entered","timeOp":"1","timeOpText":"↧ von","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"day.tomorrow.isWeekendOrHoliday","validOperandAType":"global","validOperator":"false","validOperatorText":"ist false","validOperandBValue":"","validOperandBType":"str"},{"index":8,"timeValue":"23:15","timeType":"entered","timeOp":"1","timeOpText":"↧ von","levelValue":"closed (min)","levelType":"levelFixed","levelOp":"0","levelOpText":"↕  Absolut","offsetValue":"","offsetType":"none","multiplier":"1","validOperandAValue":"","validOperandAType":"none","validOperator":"true","validOperatorText":"ist true","validOperandBValue":"","validOperandBType":"str"}],"sunControlMode":"2","sunFloorLength":"0.6","sunMinAltitude":"","sunMinDelta":"0.1","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"1.28","windowBottom":"0","windowAzimuthStart":"70","windowAzimuthEnd":"150","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"50","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":710,"y":4275,"wires":[["e5ad9e89.91fca"]]},{"id":"e5ad9e89.91fca","type":"debug","z":"d7bd7fb6.a0c13","name":"Blind position","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":955,"y":4275,"wires":[]},{"id":"73586d22.519c84","type":"change","z":"d7bd7fb6.a0c13","name":"dayInfo.today.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.today.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":785,"y":4350,"wires":[[]]},{"id":"5b45699c.065d38","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":515,"y":4350,"wires":[["73586d22.519c84"]]},{"id":"2aa7fe06.4b3542","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":515,"y":4395,"wires":[["73586d22.519c84"]]},{"id":"672e362e.320458","type":"change","z":"d7bd7fb6.a0c13","name":"dayInfo.tomorrow.isWeekendOrHoliday","rules":[{"t":"set","p":"dayInfo.tomorrow.isWeekendOrHoliday","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":795,"y":4440,"wires":[[]]},{"id":"184622ac.87528d","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":515,"y":4440,"wires":[["672e362e.320458"]]},{"id":"c499f778.1f1e88","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":0.1,"x":515,"y":4485,"wires":[["672e362e.320458"]]},{"id":"34c6b5d0.fd55ea","type":"comment","z":"d7bd7fb6.a0c13","name":"Example 4:","info":"","x":135,"y":4185,"wires":[]},{"id":"48e19f72.346a4","type":"change","z":"d7bd7fb6.a0c13","name":"","rules":[{"t":"set","p":"windowOpen","pt":"msg","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":830,"y":4530,"wires":[["b0c3eec.cf4ac1"]]},{"id":"17b8a4d8.27a83b","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"window open","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":545,"y":4530,"wires":[["48e19f72.346a4"]]},{"id":"309856e0.51ed4a","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"window closed","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":"0.5","x":565,"y":4575,"wires":[["48e19f72.346a4"]]},{"id":"4e797cd3.64c104","type":"link in","z":"d7bd7fb6.a0c13","name":"do_refreshBlind_state","links":["b0c3eec.cf4ac1","dba49bc7.8be158"],"x":390,"y":4200,"wires":[["9f40dfd7.71532"]]},{"id":"b0c3eec.cf4ac1","type":"link out","z":"d7bd7fb6.a0c13","name":"trigger_refreshBlind_state","links":["4e797cd3.64c104"],"x":1035,"y":4530,"wires":[]},{"id":"a9d231d9.a4d08","type":"change","z":"d7bd7fb6.a0c13","name":"","rules":[{"t":"set","p":"raining","pt":"msg","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":810,"y":4620,"wires":[["b0c3eec.cf4ac1"]]},{"id":"1390bf63.8a3161","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"is raining","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":535,"y":4620,"wires":[["a9d231d9.a4d08"]]},{"id":"6e1753a9.3ce90c","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"is raining","payload":"false","payloadType":"bool","repeat":"","crontab":"","once":true,"onceDelay":"0.7","x":545,"y":4665,"wires":[["a9d231d9.a4d08"]]}]
```

In diesem Beispiel fehlt aber die Konfiguration-Node (gelbes Dreieck). Diese muss noch eingestellt werden.

## weiterführende Links

* [englische Beschreibung der Blind-control node](https://github.com/rdmtc/node-red-contrib-sun-position/blob/HEAD/blind_control.md)
* [Tutorial zur Rollladensteuerung auf stall.biz](https://www.stall.biz/project/so-steuert-man-rolladen-jalousien-und-markisen-mit-der-homematic)
