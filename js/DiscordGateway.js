((exports) => {
	let WebSocket = typeof require == "function" ? require("ws") : window.WebSocket;
	class DiscordGateway {
		constructor(options) {
			this.token = null;
			this.ws = null;
			this.persist = null;
			this.events = {};
			this._debug = options && options.debug === true ? true : false;
		}
		// i don't understand why this has to be a get function...
		// i'm just gonna follow it anyways
		get streamURL() {
			return "wss://gateway.discord.gg/?v=9&encoding=json";
		}

		debug() {
			// we use console.info so that we can opt out when debugging
			if (this._debug === true) console.info("[gateway] ", ...arguments);
		}

		addEventListener(name, callback) {
			this.events[name] = callback;
		}
		emit(name, data) {
			if (name in this.events) this.events[name].apply(this, [data]);
		}
		login(token) {
			this.token = token;
		}
		send(data) {
			this.ws.send(JSON.stringify(data));
		}
		handlePacket(message) {
			var packet = JSON.parse(message.data);

			this.debug("Handling packet with OP ", packet.op);

			var callbacks = {
				0: this.handlePacketDispatch,
				9: this.handlePacketInvalidSess,
				10: this.handlePacketGatewayHello,
				11: this.handlePacketAck,
			};

			if (packet.op in callbacks) callbacks[packet.op].apply(this, [packet]);
			else this.debug("OP " + packet.op + "not found!");
		}
		handlePacketDispatch(packet) {
			this.persist.sequence_num = packet.s;
			this.debug("dispatch:", packet);
			switch (packet.t) {
				case "MESSAGE_CREATE": {
					this.emit("message", packet.d);
					break;
				}
				case "MESSAGE_UPDATE": {
					this.emit("message_edit", packet.d);
					break;
				}
				case "MESSAGE_DELETE": {
					this.emit("message_delete", packet.d);
					break;
				}
			}
		}
		handlePacketInvalidSess(packet) {
			this.debug("sess inv:", packet);
			this.ws.close();
		}

		handlePacketGatewayHello(packet) {
			var self = this,
				ws = this.ws;

			this.debug("Sending initial heartbeat...");
			self.send({
				op: 1, // HEARTBEAT
				d: self.persist.sequence_num || null,
			});

			var interval = setInterval(() => {
				if (ws != self.ws) return clearInterval(interval);
				this.debug("Sending heartbeat...");

				self.send({
					op: 1, // HEARTBEAT
					d: self.persist.sequence_num || null,
				});
			}, packet.d.heartbeat_interval);
		}

		handlePacketAck(packet) {
			if (this.persist.authenticated) return;

			this.persist.authenticated = true;
			this.send({
				op: 2,
				d: {
					status: "online",
					token: this.token,
					intents: 0b11111111111111111,
					properties: {
						$os: "Android",
						$browser: "Discord Android",
						$device: "phone",
					},
				},
			});
		}

		init() {
			if (!this.token) throw Error("You need to authenticate first!");

			var self = this;

			this.persist = {};

			this.debug("Connecting to gateway...");
			this.ws = new WebSocket(this.streamURL);

			this.ws.addEventListener("message", this.handlePacket.bind(this));
			this.ws.addEventListener("open", () => {
				this.debug("Sending Identity [OP 2]...");
			});
			this.ws.addEventListener("close", function (evt) {
				self.emit("close", evt);
			});
		}
	}

	exports.DiscordGateway = DiscordGateway;
})(typeof exports === "undefined" ? this : exports);
