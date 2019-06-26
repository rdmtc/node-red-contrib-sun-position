# Rollläden, Jalousien, Markisen mit Node-Red steuern

## Einleitung

Eine Rollladensteuerung ist nicht trivial. Dieses tutorial soll den Einstieg in dieses Thema bieten. Es kann beliebig weiter ausgebaut werden.

Hinweis: Der Artikel ist noch im Entstehen und wird in den nächsten tagen / Wochen noch weiter entwickelt.

## Inhalt

* [Rollläden, Jalousien, Markisen mit Node-Red steuern](#Rollläden-Jalousien-Markisen-mit-Node-Red-steuern)
	* [Einleitung](#Einleitung)
	* [Inhalt](#Inhalt)
	* [Konzept](#Konzept)
	* [Vorbereitungen](#Vorbereitungen)
		* [Grundlagen - den Flow vorbereiten](#Grundlagen---den-Flow-vorbereiten)
			* [die Nodes des Flows](#die-Nodes-des-Flows)
				* [Inject Node](#Inject-Node)
				* [Node zur Rollladensteuerung vorbereiten](#Node-zur-Rollladensteuerung-vorbereiten)
		* [Enhanced - einen Flow zum Testen](#Enhanced---einen-Flow-zum-Testen)
	* [Die Steuerung](#Die-Steuerung)
		* [einfache Steuerung der Rollläden nach Zeit](#einfache-Steuerung-der-Rollläden-nach-Zeit)
	* [Text](#Text)
	* [weiterführende Links:](#weiterführende-Links)

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

* Installieren Sie RedMatic Paket
* Machen Sie sich mit den [Grundlagen](https://github.com/rdmtc/RedMatic/wiki/Node-RED) vertraut.
* prüfen Sie ob die Node [node-red-contrib-sun-position](https://flows.nodered.org/node/node-red-contrib-sun-position) [installiert](https://github.com/rdmtc/RedMatic/wiki/Node-Installation) sind und [installieren](https://github.com/rdmtc/RedMatic/wiki/Node-Installation) /updaten sie diese wenn nötig
* Wenn sie am Wochenende/Feiertags andere Zeiten zur Steuerung verwenden wollen, [installieren](https://github.com/rdmtc/RedMatic/wiki/Node-Installation) Sie sich die Node [node-red-contrib-german-holidays](https://flows.nodered.org/node/node-red-contrib-german-holidays)

Als Teil der [node-red-contrib-sun-position](https://flows.nodered.org/node/node-red-contrib-sun-position) Nodes gibt es einen dedizierte [Node für Rollladensteuerung](https://github.com/rdmtc/node-red-contrib-sun-position/blob/HEAD/blind_control.md).

### Grundlagen - den Flow vorbereiten

#### die Nodes des Flows

Unter der Palette fortgeschritten finden Sie die Node zur Rollladensteuerung:
![image](https://user-images.githubusercontent.com/12692680/59846604-96f08780-9360-11e9-9d6b-f5dea3555cab.png)

Ziehen Sie diese in den Arbeitsbereich.

Die Node zur Rollladensteuerung berechnet bei einem Eingangs-Signal die Behang Höhe des Rollladens. Von sich aus wird keine neue Behang Höhe berechnet, daher wird immer ein Signal zur Steuerung benötigt. Am Einfachsten geht dies mit einem Inject node aus der Palette Eingabe:
![image](https://user-images.githubusercontent.com/12692680/59846686-ce5f3400-9360-11e9-834b-0e90160e55e8.png)

An den Ausgang kann man direkt einen Homematic Rollladen Aktor hängen. Zum Testen kann auch erstmal eine Debug-Node aus der Palette Ausgabe gehangen werden:
![image](https://user-images.githubusercontent.com/12692680/59846854-3ca3f680-9361-11e9-8279-5fb1c3be6199.png)

Ziehen Sie die Nodes in den Flow und verbinden Sie diese miteinander:
![image](https://user-images.githubusercontent.com/12692680/59846932-737a0c80-9361-11e9-8354-531b82a2ea96.png)

Als nächstes konfigurieren wir die Nodes. Dazu rufen Sie Bitte die Einstellung der Nodes nacheinander auf (per doppel-klick öffnen).

##### Inject Node

Der Inject Node wird so eingestellt, das dieser aller 10 Minuten ein Signal sendet. Als Signal dient einfach einfach der Zeitstempel. Solange die EingangsNachricht der Node Der Rollladensteuerung nicht eine bestimmte Topic oder Eigenschaft besitzt, führt die Nachricht nur zur Neuberechnung der Rollladenposition.

![image](https://user-images.githubusercontent.com/12692680/59848056-8215f300-9364-11e9-80c1-aeda75d6c3ff.png)

##### Node zur Rollladensteuerung vorbereiten

Bei diesem Node müssen Sie zuerst den konfigurationsknoten einstellen.
Wenn Sie bereits einen haben wählen Sie diesen, andernfalls erstellen Sie einen neuen.

![image](https://user-images.githubusercontent.com/12692680/59848128-b093ce00-9364-11e9-8dd3-99126b60e83d.png)

Im Konfigurationsknoten müssen Sie nur die Koordinaten für Ihren Standort eingeben:

![image](https://user-images.githubusercontent.com/12692680/59848457-7c6cdd00-9365-11e9-83f2-45389fc6be5c.png)

Diese Koordinaten werden später intern zur Berechnung der Sonnenposition, des Sonnenstandes, etc... verwendet. Wenn Se nicht vorhaben eine Sonnensteuerung zu verwenden, können Sie hier auch andere Koordinaten eintragen. Beachten Sie dann aber, falls sie später auf Funktionen zurückgreifen, welche diese benötigen, dann falsche Ergebnisse bekommen.

Schließen Sie mit Fertig und auch die Einstellungen der Node zur Rollladensteuerung. Vergessen Sie nicht die Änderungen zu Deploy/Implementieren.

Wenn Sie jetzt den Button des Inject Node betätigen sendet der Rollladen Node eine 1, was 100% entspricht:

![image](https://user-images.githubusercontent.com/12692680/59849231-547e7900-9367-11e9-823a-237c3c3b1cc4.png)

Falls sie eine Debug-Node am Ausgang haben, werden sie hierbei nur einmal die 1 sehen, auch wenn sie mehrfach den button betätigen. Der Node sendet in der Grundeinstellung nur eine geänderte Behanghöhe aus.

Für die weiteren Tele dieser Anleitung haben Sie damit  alles vorbereitet und können dort Fortfahren.

Hier gibt es den Flow auch fertig zum [Importieren](https://github.com/rdmtc/RedMatic/wiki/Flow-Import):

```json
[{"id":"bc85f5f8.590538","type":"debug","z":"d7bd7fb6.a0c13","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":685,"y":2520,"wires":[]},{"id":"29678e1a.5530f2","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"","payload":"","payloadType":"date","repeat":"600","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":2520,"wires":[["52f48f8e.da889"]]},{"id":"52f48f8e.da889","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"","outputs":"1","blindIncrement":0.01,"blindOpenPos":1,"blindClosedPos":0,"blindPosReverse":false,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"","rules":[],"sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":420,"y":2520,"wires":[["bc85f5f8.590538"]]}]
```

In diesem Beispiel fehlt aber die Konfigurations-Node (gelbes Dreieck). Diese muss noch eingestellt werden.

### Enhanced - einen Flow zum Testen

Der einfache Flow bildet die Ausgangslage zu dem reell genutzten Flow. Für das Testen hat er jedoch den Nachteil, das man hiermit nicht das Verhalten der Einstellungen zu verschiedenen Tageszeiten testen kann. Die Rollanden node bietet dafür die Möglichkeit in der Eingangsnachricht einen zeitstempel mitzugeben als `msg.ts`. Damit kann eine bestimmter Zeitpunkt vorgegeben werden.

Mit Hilfe des folgenden Flows kann man jetzt dies testen. Beim Injekt über Start wird bei 0 Uhr die Zeit gestartet und in 30 Minuten Schritten jeweils pro Sekunde hochgezählt. Mittels Stop kann man das stoppen.

![image](https://user-images.githubusercontent.com/12692680/60100786-c0435600-975a-11e9-8072-ce6fd6a530db.png)

```json
[{"id":"f9b2f049.8a01b","type":"debug","z":"d7bd7fb6.a0c13","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":910,"y":4455,"wires":[]},{"id":"653abe67.1f053","type":"function","z":"d7bd7fb6.a0c13","name":"30min 1sec","func":"\nconst minutesEachLoop = 30;\nconst loopCycle = 1; // seconds\nlet timeObj = context.get(\"timeObj\");\n\nif (timeObj && msg.topic.includes('stop')) {\n    clearInterval(timeObj);\n    context.set(\"timeObj\", null);\n    let d = new Date(context.get(\"date\"));\n    node.status({fill:\"red\",shape:\"ring\",text:\"stopped - \" + d.toLocaleTimeString()});\n    return null;\n} else if (!timeObj && msg.topic.includes('start')) {\n    context.set(\"message\", msg);\n    let d = new Date();\n    let num = Number(msg.payload) || 0;\n    d.setHours(num);\n    d.setMinutes(0);\n    context.set(\"date\", d.getTime());\n    msg.ts = d.getTime();\n    msg.lts = d.toLocaleTimeString();\n    msg.uts = d.toISOString();\n    msg.test = true;\n    node.log(\"sending \" + d.toLocaleTimeString() + ' ######################## payload='+msg.payload+' topic='+msg.topic + ' iso=' + d.toISOString());\n    node.send(msg);\n\n    let timeObj = setInterval(function(){\n        let msg = context.get(\"message\");\n        let d = new Date(context.get(\"date\"));\n        //d.setHours(d.getHours()+1);\n        d.setMinutes(d.getMinutes() + minutesEachLoop)\n        context.set(\"date\", d.getTime());\n        msg.ts = d.getTime();\n        msg.lts = d.toLocaleTimeString();\n        msg.uts = d.toISOString();\n        msg.test = true;\n        node.status({fill:\"green\",shape:\"dot\",text:\"run - \" + d.toLocaleTimeString()});\n        node.log(\"sending \" + d.toLocaleTimeString() + ' ######################## payload='+msg.payload+' topic='+msg.topic + ' iso=' + d.toISOString());\n        node.send(msg);\n\t}, (1000 * loopCycle));\n    context.set(\"timeObj\", timeObj);\n    node.status({fill:\"green\",shape:\"ring\",text:\"start - \" + d.toLocaleTimeString()});\n    return null;\n}\n\nlet d = new Date(context.get(\"date\"));\nd.setMinutes(d.getMinutes() + 1)\n//d.setHours(d.getHours()+1);\nmsg.ts = d.getTime();\nmsg.lts = d.toLocaleTimeString();\nmsg.uts = d.toISOString();\nmsg.test = true;\nnode.status({fill:\"yellow\",shape:\"dot\",text:\"interposed - \" + d.toLocaleTimeString()});\nnode.log(\"sending interposed msg \" + d.toLocaleTimeString() + ' ######################## payload='+msg.payload+' topic='+msg.topic + ' iso=' + d.toISOString());\nnode.send(msg);\nreturn null;","outputs":1,"noerr":0,"x":460,"y":4455,"wires":[["1b46a186.dbc68e"]]},{"id":"1b46a186.dbc68e","type":"blind-control","z":"d7bd7fb6.a0c13","name":"","topic":"","positionConfig":"","outputs":"1","blindIncrement":0.01,"blindOpenPos":1,"blindClosedPos":0,"blindPosReverse":false,"blindPosDefault":"open (max)","blindPosDefaultType":"levelFixed","overwriteExpire":"","rules":[],"sunControlMode":"0","sunFloorLength":"","sunMinAltitude":"","sunMinDelta":"","blindPosMin":"closed (min)","blindPosMinType":"levelFixed","blindPosMax":"open (max)","blindPosMaxType":"levelFixed","smoothTime":"","windowTop":"","windowBottom":"","windowAzimuthStart":"","windowAzimuthEnd":"","oversteerValue":"","oversteerValueType":"none","oversteerCompare":"gte","oversteerThreshold":"","oversteerThresholdType":"num","oversteerBlindPos":"open (max)","oversteerBlindPosType":"levelFixed","oversteer2Value":"","oversteer2ValueType":"none","oversteer2Compare":"gte","oversteer2Threshold":"","oversteer2ThresholdType":"num","oversteer2BlindPos":"open (max)","oversteer2BlindPosType":"levelFixed","oversteer3Value":"","oversteer3ValueType":"none","oversteer3Compare":"gte","oversteer3Threshold":"","oversteer3ThresholdType":"num","oversteer3BlindPos":"open (max)","oversteer3BlindPosType":"levelFixed","x":675,"y":4455,"wires":[["f9b2f049.8a01b"]]},{"id":"b66a23ec.f1755","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"start","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":245,"y":4455,"wires":[["653abe67.1f053"]]},{"id":"3d854d22.15ae92","type":"inject","z":"d7bd7fb6.a0c13","name":"","topic":"stop","payload":"0","payloadType":"num","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":245,"y":4515,"wires":[["653abe67.1f053"]]}]
```

In diesem Beispiel fehlt aber die Konfiguration-Node (gelbes Dreieck). Diese muss noch eingestellt werden.

## Die Steuerung

Im Folgenden werden verschiedene Möglichkeiten der Steuerung vorgestellt. Diese steigern sich in der Komplexität und Funktionsumfang. Bei der Erklärung bauen diese teilweise aufeinander auf.

### einfache Steuerung der Rollläden nach Zeit

Im folgenden soll der Rollladen früh um 7 Uhr öffnen und abends gegen 19 Uhr schließen.


tbd


## Text

-- hier kommt noch text rein ;)

## weiterführende Links:
* [engliche Beshreibung der Blind-control node](https://github.com/rdmtc/node-red-contrib-sun-position/blob/HEAD/blind_control.md)
* [Tutorial zur Rollladensteuerung auf stall.biz](https://www.stall.biz/project/so-steuert-man-rolladen-jalousien-und-markisen-mit-der-homematic)


