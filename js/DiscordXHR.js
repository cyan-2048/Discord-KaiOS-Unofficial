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
				"Content-Type": "application/json",
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
					xhr.setRequestHeader(a, o[a].replace(/\r?\n|\r/g, ""));
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
					res("https://cdn.discordapp.com/avatars/" + userID + "/" + avatar + ".png");
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

		getServers() {
			return new Promise((res) => {
				this.xhrRequestJSON("GET", "users/@me/guilds", {
					authorization: this.token,
				}).then((_guilds) => {
					let guilds = _guilds.map((a) => {
						a.icon = a.icon ? `https://cdn.discordapp.com/icons/${a.id}/${a.icon}.jpg?size=48` : null;
						return a;
					});
					this.getSettings().then((settings) => {
						let sort = settings.guild_folders.map((a) => {
							let { name, guild_ids, id } = a;
							if (guild_ids.length == 1) return guilds.find((e) => e.id == guild_ids[0]);
							return {
								folder: true,
								name,
								id,
								array: guild_ids.map((a) => guilds.find((e) => e.id == a)),
							};
						});
						res(sort);
					});
				});
			});
		}

		getSettings() {
			return this.xhrRequestJSON("GET", "users/@me/settings", {
				authorization: this.token,
			});
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
