
const minutesEachLoop = 30;
const loopCycle = 1; // sekunden
let timeObj = context.get("timeObj");

if (timeObj && msg.topic.includes('stop')) {
    clearInterval(timeObj);
    context.set("timeObj", null);
    let d = new Date(context.get("date"));
    node.status({fill:"red",shape:"ring",text:"off - " + d.toLocaleTimeString()});
} else if (!timeObj && msg.topic.includes('start')) {
    context.set("message", msg);
    let d = new Date();
    let num = Number(msg.payload) || 0;
    d.setHours(num);
    d.setMinutes(0);
    context.set("date", d.getTime());
    msg.lts = d.toLocaleTimeString();
    msg.ts = d.getTime();
    node.log("sending " + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);
    node.send(msg);

    let timeObj = setInterval(function(){
        let msg = context.get("message");
        let d = new Date(context.get("date"));
        //d.setHours(d.getHours()+1);
        d.setMinutes(d.getMinutes() + minutesEachLoop)
        context.set("date", d.getTime());
        msg.lts = d.toLocaleTimeString();
        msg.ts = d.getTime();
        node.status({fill:"green",shape:"dot",text:d.toLocaleTimeString()});
        node.log("sending " + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);
        node.send(msg);
	}, (1000 * loopCycle));
    context.set("timeObj", timeObj);
    node.status({fill:"green",shape:"ring",text:d.toLocaleTimeString()});
} else {
    let d = new Date(context.get("date"));
    d.setMinutes(d.getMinutes() + 1)
    //d.setHours(d.getHours()+1);
    msg.lts = d.toLocaleTimeString();
    msg.ts = d.getTime();
    node.status({fill:"green",shape:"dot",text:d.toLocaleTimeString()});
    node.log("sending interrupt msg " + d.toLocaleTimeString() + ' ####################################### payload='+msg.payload+' topic='+msg.topic);
    node.send(msg);
}

return null;