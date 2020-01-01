# clock-timer Controller

## clock-timer

Used to control a flow time based with many possibilities. This can be used to switch something which is time-dependent. It is ideal for dimmers, Christmas lights, ...

![clock-timer](https://user-images.githubusercontent.com/12692680/70033610-1e991e00-15b0-11ea-8035-8a74164f7d64.png)

### Table of contents

- [clock-timer Controller](#clock-timer-controller)
  - [clock-timer](#clock-timer)
    - [Table of contents](#table-of-contents)
    - [The node](#the-node)
    - [Node settings](#node-settings)
      - [general settings](#general-settings)
      - [rule settings](#rule-settings)
      - [overwrite settings](#overwrite-settings)
    - [Node Input](#node-input)
    - [Node Output](#node-output)
  - [Other](#other)

### The node

The node was created out of the desire to be able to use the [blind-control node](blind_control.md) also for dimmers. So this node is a simplified [blind-control node](blind_control.md) without sun based control. In contrast, this node offers the possibility to have any payload.

### Node settings

#### general settings

![clock-timer-settings-1](https://user-images.githubusercontent.com/12692680/57134454-8c753100-6da6-11e9-95e9-bdff86f1e3d4.png)

- **Position Configuration** connects to the central configuration node, which contains the current position, but also handles a lot of internal shared functions. Thus, this configuration is always needed, even if the sense does not always open up.
- **name** the name of the node

#### rule settings

![clock-timer-settings-2](https://user-images.githubusercontent.com/12692680/70568882-138a5300-1b99-11ea-97b4-011f7e7d8819.png)

- **default payload** The value which will be used if no other value given by rule, or override.

![clock-timer-settings-3](https://user-images.githubusercontent.com/12692680/70744707-84a94200-1d22-11ea-8fc4-f781e6202901.png)

- If a rule has a condition, the rule only applies if the condition matches.
  - For some conditions a comparisons needs to be defined.
  - If the values of comparison comes from a message object and the value can not be determined, the value is taken at which the value could be determined last. If there is no previous value a error will be thrown otherwise only a log output. To thus the message property not needs to be available in all incoming messages.
- If a rule has a time limitation
  - `until` the first rule is taken, where the given time is greater than the current time.
  - `from` the last rule is taken, where the given time is less than the current time.
- If a rule will applied the defined payload to the rule will be send.

- For some time definitions an Offset could be added (or be reduced with a negative value)

#### overwrite settings

![clock-timer-settings-4](https://user-images.githubusercontent.com/12692680/70744825-d5209f80-1d22-11ea-90c1-1d7e13b13d91.png)

- **expire** the duration in minutes a manual setting will remain is place. If not defined, there will be no default expiring of overrides.

![clock-timer-settings-5](https://user-images.githubusercontent.com/12692680/70744896-fe413000-1d22-11ea-8085-0d37847d74dc.png)

### Node Input

The Input is for triggering the calculation and for setting overwrites of the blind position.

- **reset** an incoming message with `msg.reset` or `msg.resetOverwrite` is `true` or where the `msg.topic` contains `resetOverwrite` and the value of `msg.payload` = `true` will reset any existing overrides.
  - **priority** (optional) when a priority is given the existing override will only reset if the priority of the message is __equal or higher__ then the priority of the existing override. The message priority can be defined by
    - a property `msg.prio`, `msg.priority` or `msg.privilege` with a valid numeric value
    - A higher number is a higher priority. So prio 1 is the lowest priority.
    - If in the message a property  `msg.exactPriority` or `msg.exactPrivilege` is set to true then the existing override will only reset if the absolute value of the priority of the message is __equal__ then the priority of the existing override.
- **override** an incoming message with a topic including `manual` or `overwrite` will override any of rule based or default payload.
  - If an override is already active a new message changes the payload if the **priority** of the existing override allows this.
- **priority** (optional) Enables to handles overrides of different priorities. Default value will be `0`.
  - A message property  `msg.prio`, `msg.priority` or `msg.privilege` with a valid numeric value.
  - A `boolean` value `true` is considered as numeric `1`.
  - A higher number is a higher priority. So prio 1 is the lowest priority.
- **expire** (optional) Enables to define an override as automatically expiring. As default value for overrides of priority `0` the value in the settings is be used. Overrides with a priority higher than `0` will not expire by default.
  - A message property `msg.expire`
  - The value must be a time in milliseconds which is greater than 100. Otherwise the override will be set to not expiring.
  - If an override is already active a new message with **expire** can change the existing expire behavior if the **priority** of the existing override allows this.

Useful to know:

- If a **reset** and a new override is set in the same message, any existing override will be reset and the new will be set afterwards. In this scenario no existing override **priority** will be considered.
- An already existing Override can only be changed if the prio of the existing is `0` (default - can always be changed) or the message object has a **priority** set with a value that is equal or greater than the existing override. If that is given the **expire**, **priority** or **position** can be changed.
  - if additional **exactPriority** is defined, then the message priority must be __equal__ to the existing priority.
- A message where the topic contains `triggerOnly` or with an property `msg.trigger` which is true can not act as override.

### Node Output

In the enhanced option are configurable if the node has one single (default) or two outputs.

An output can be triggered by an incoming message or by an expiring timeout from an override. If the trigger is a incoming message, the incoming message will be forwarded to the first output if the rule has changed.

The incoming message is changed as following:

- `msg.topic` if a topic is defined this topic will be used, otherwise no change of the topic from the incoming message
- `msg.payload` the payload will be set to the new blind level (numeric value)

If the output is set to single, an object property `msg.timeCtrl` will be attached to the message and forwarded to the first output.
If the node is configured with two outputs this object is set as the `msg.payload` property of the message that is send to the second output. The difference is also, that the second output will give this object every time a recalculation will is triggered, where the first output only send a message on blind position change.

------------------------------------------------------------

Documentation not finished, but you can used the documentation of the blind control. This node is very similar.

## Other

For bugs, questions and feature requests please use the
[GitHub Issues](https://github.com/rdmtc/node-red-contrib-sun-position/issues).
