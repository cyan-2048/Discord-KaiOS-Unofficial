((exports) => {
	let XMLHttpRequest = typeof require === "function" ? require("xmlhttprequest").XMLHttpRequest : window.XMLHttpRequest;
	class DiscordXHR {
		constructor() {
			this.token = null;
		}
		get baseURL() {
			return "https://discord.com/api/v9/";
		}
		get baseHeaders() {
			return {
				[typeof require === "function" ? "content-type" : "Content-Type"]: "application/json",
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

				var o = Object.assign({}, this.baseHeaders, headers);
				Object.keys(o).forEach((a) => {
					xhr.setRequestHeader(a, o[a]);
				});
				xhr.onload = () => res(xhr);
				xhr.onerror = (e) => err(e, xhr);
				xhr.send(dataString);
			});
		}

		xhrRequestJSON() {
			return this.xhrRequest(...arguments).then((r) => JSON.parse(r.responseText));
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

		getAvatarURL(userID, avatarID) {
			return new Promise((res) => {
				function terminate(avatar = avatarID) {
					res("https://cdn.discordapp.com/avatars/" + userID + "/" + avatar + ".png?size=24");
				}
				avatarID ? terminate() : this.getProfile(userID).then((a) => terminate(a.user.avatar));
			});
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
