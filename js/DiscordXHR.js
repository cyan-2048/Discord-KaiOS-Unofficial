((exports) => {
	let XMLHttpRequest = typeof require === "function" ? require("w3c-xmlhttprequest").XMLHttpRequest : window.XMLHttpRequest;
	class DiscordXHR {
		constructor() {
			this.token = null;
		}
		get baseURL() {
			return "https://discord.com/api/v9/";
		}
		get baseHeaders() {
			return {
				"content-type": "application/json",
			};
		}

		login(token) {
			this.token = token;
		}

		generateNonce() {
			return String(Date.now() * 512 * 1024);
		}

		xhrRequest(method, path, headers, data) {
			return new Promise((res, err) => {
				var dataString = data instanceof Object ? JSON.stringify(data) : String(data);

				var xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
				xhr.open(method, this.baseURL + path, true);

				var o = Object.assign({}, baseHeaders, headers);
				Object.keys(o).forEach((a) => {
					xhr.setRequestHeader(a, o[a]);
				});
				xhr.onload = res;
				xhr.onerror = err;
				xhr.send(dataString);
			});
		}

		xhrRequestJSON() {
			return this.xhrRequest(...arguments).then((r) => r.json());
		}

		sendMessage(channel, message) {
			return this.xhrRequestJSON(
				"POST",
				"channels/" + channel + "/messages",
				{
					authorization: this.token,
				},
				{
					content: message,
					nonce: this.generateNonce(),
				}
			);
		}

		getAvatarURL(userID, avatar) {
			avatar = avatar || this.getProfile(userID).user.avatar;

			return "https://cdn.discordapp.com/avatars/" + userID + "/" + avatar + ".png?size=24";
		}

		getChannel(channelID) {
			return this.xhrRequestJSON("GET", "channels/" + channelID, {
				authorization: this.token,
			});
		}

		getChannels(base) {
			return this.xhrRequestJSON("GET", base + "/channels", {
				authorization: this.token,
			});
		}

		getChannelsDM() {
			return this.getChannels("users/@me");
		}

		getMessages(channel, count) {
			return this.xhrRequestJSON("GET", "channels/" + channel + "/messages?limit=" + count, {
				authorization: this.token,
			});
		}

		getProfile(userID) {
			return this.xhrRequestJSON("GET", "users/" + userID + "/profile", {
				authorization: this.token,
			});
		}
	}

	exports.DiscordXHR = DiscordXHR;
})(typeof exports === "undefined" ? this : exports);
