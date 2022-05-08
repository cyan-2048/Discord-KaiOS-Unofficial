const sn = SpatialNavigation;
var discord = new DiscordXHR();

var discordGateway = new DiscordGateway({ debug: true });
// prettier-ignore
function hashCode(r){var n,t=String(r),o=0;if(0===t.length)return o;for(n=0;n<t.length;n++)o=(o<<5)-o+t.charCodeAt(n),o|=0;return Array.from(o.toString()).map(r=>"ledoshcyan"[r]).join("")}

let bitwise2text = {
	64: "write_reactions",
	1024: "read",
	2048: "write",
	8192: "mod_delete",
	32768: "attach",
	65536: "history",
	131072: "ping_everyone",
	262144: "ext_emojis",
	32: "ext_stickers",
	4: "mod_threads",
	8: "make_thread",
	16: "make_priv_thread",
	64: "write_thread",
};

function groupBy(arr, property) {
	return arr.reduce(function (memo, x) {
		if (!memo[x[property]]) {
			memo[x[property]] = [];
		}
		memo[x[property]].push(x);
		return memo;
	}, {});
}

// make getting roles more readble, i am not a robot
function parseRoleAccess(overwrites = [], roles = []) {
	let obj = {};
	let grouped = groupBy(overwrites, "type");
	Object.keys(grouped)
		.sort()
		.forEach((a) => {
			grouped[a].forEach((o) => {
				if (roles.includes(o.id)) {
					Object.entries(bitwise2text).forEach((ar) => {
						let [num, perm] = ar;
						if ((o.allow & num) == num) obj[perm] = true;
						if ((o.deny & num) == num) obj[perm] = false;
					});
				}
			});
		});
	return obj;
}

function listChannel(opts = { dm: true }) {
	let focus = null;
	let list = getId("chlist");
	let currentChannel = getId("chview").dataset.channel;

	function bye() {
		switchPages("chlist");
		(focus || list.qs("[data-type]")).focus();
	}

	if (list.dataset.channel == (opts.dm ? "dms" : opts.id)) return bye();
	list.dataset.channel = opts.dm ? "dms" : opts.id;

	discord["getChannels" + (opts.dm ? "DM" : "")](opts.id).then((raw) => {
		Promise.all(opts.dm ? [Promise.resolve()] : [discord.getRoles(opts.id, "@me"), discord.getServerProfile(opts.id, "@me")]).then((_promise) => {
			let [roles, profile] = _promise;
			list.innerHTML = "";
			let channels = opts.dm
				? raw.map(function (x) {
						var name =
							x.name ||
							x.recipients
								.map(function (x) {
									return x.username;
								})
								.join(", ");
						return { name: name, id: x.id, channel: x };
				  })
				: (() => {
						let position = (a, b) => a.position - b.position;
						let _channels = {
							0: [],
						};
						let separators = [];
						let channels_id = {};
						raw.forEach((a) => {
							if (a.type == 4) {
								_channels[a.name] = [];
								channels_id[a.id] = a.name;
								separators.push(a);
							}
						});
						separators.sort(position);
						separators = separators.map((a) => a.name);
						separators.unshift(0);

						raw.forEach((a) => {
							if (a.type == 0 || a.type == 5) {
								let perms = parseRoleAccess(a.permission_overwrites, profile.roles.concat([roles.find((p) => p.position == 0).id, profile.user.id]));
								let id = a.parent_id;
								if (perms.read !== false) (_channels[id ? channels_id[id] : 0] || []).push(a);
							}
						});

						Object.keys(_channels).forEach((a) => {
							if (_channels[a].length == 0) {
								_channels[a] = null; // playing safe
							} else {
								_channels[a].sort(position);
							}
						});

						let final = [];

						separators.forEach((a) => {
							if (_channels[a]) {
								final.push({ type: "separator", name: a });
								final = final.concat(_channels[a]);
							}
						});

						return final;
				  })();

			function separator(text) {
				let header = crel("div");
				header.className = "separator";
				header.innerText = text;
				return header;
			}

			if (opts.dm) {
				list.appendChild(separator("direct messages"));
				channels = channels.sort((a, b) => Number(b.channel.last_message_id) - Number(a.channel.last_message_id));
			}

			channels.forEach((a) => {
				if (a.type == "separator") {
					if (a.name === 0) return;
					return list.appendChild(separator(a.name));
				}

				let item = crel("div");
				item.tabIndex = 0;
				let dataset = item.dataset;
				dataset.type = opts.dm
					? "dm"
					: a.type == 5
					? "announce"
					: (() => {
							let ft = a.permission_overwrites.find((l) => l.id == roles.find((p) => p.position == 0).id);
							if (!ft) return false;
							return (ft.deny & 1024) == 1024;
					  })()
					? "limited"
					: "text"; // temp, limited
				dataset.channel = a.id;

				let m = crel("div");
				m.dataset.mentions = 0; // temp
				item.appendChild(m);

				function subtext(text) {
					let s = crel("div");
					s.className = "subtext";
					s.innerText = text;
					return s;
				}

				if (opts.dm) {
					let av = crel("div");
					av.className = "avatar";
					av.dataset.status = "offline";
					item.appendChild(av);

					let { id, icon, recipients } = a.channel;

					if (a.channel.icon) {
						item.style = `--default-avatr: url(https://cdn.discordapp.com/channel-icons/${id}/${icon}.jpg?size=32)`;
						item.appendChild(subtext(recipients.length + " Members"));
					} else if (recipients && recipients[0].avatar) {
						let { id, avatar } = recipients[0];
						item.style = `--default-avatr: url(https://cdn.discordapp.com/avatars/${id}/${avatar}.jpg?size=32)`;
					}
				}

				if (false) {
					// temp
					item.appendChild(subtext("temporary"));
				}

				let text = crel("div");
				text.className = "text";
				text.innerText = a.name;
				item.appendChild(text);

				if (a.id == currentChannel) {
					focus = item;
				}

				list.appendChild(item);
			});

			bye();
		});
	});
}

function loadChannel(channel) {
	var chname = getId("chname");
	var msg_con = getId("message_container");

	msg_con.innerHTML = "";

	let chview = getId("chview");
	chview.dataset.channel = channel.id;
	let guild = getId("chlist").dataset.channel;

	discord.getChannel(channel.id).then((ch) => {
		chname.innerText =
			ch.name ||
			ch.recipients
				.map(function (x) {
					return x.username;
				})
				.join(", ");

		function linkify(inputText) {
			let backticks = {};
			let blocks = {};

			let output = inputText
				// back ticks always first
				.replace(/```([\s\S]*?)```/g, (a, b, c) => {
					let hash = hashCode(Math.random() + c + b);
					blocks[hash] = a;
					return hash;
				})
				.replace(/`([\s\S]*?)`/g, (a, b, c) => {
					let hash = hashCode(Math.random() + c + b);
					backticks[hash] = a;
					return hash;
				})

				// other stuff starts here

				// markdown bold italics
				.replace(/\*\*\*([\s\S]*?)\*\*\*/g, "<b><i>$1</i></b>")
				// bold
				.replace(/\*\*([\s\S]*?)\*\*/g, "<b>$1</b>")
				// italic
				.replace(/\*([\s\S]*?)\*/g, "<i>$1</i>")
				// underline
				.replace(/__([\s\S]*?)__/g, "<u>$1</u>")
				//italic (no i can't use | because underline)
				.replace(/\s_([\s\S]*?)_\s/g, "<i>$1</i>")
				// strikethrough
				.replace(/~~([\s\S]*?)~~/g, "<s>$1</s>")

				// links/urls

				//URLs starting with http://, https://, or ftp://
				.replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim, '<a href="$1" target="_blank">$1</a>')
				//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
				.replace(/(^|[^\/])(www\.[\S]+(\b|$))/gim, '$1<a href="http://$2" target="_blank">$2</a>')
				//Change email addresses to mailto:: links.
				.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim, '<a href="mailto:$1">$1</a>')
				// discord emojis
				.replace(
					/(&lt;a?):\w+:(\d{18}&gt;)?/g,
					(a) =>
						`<div class="emoji" style="--emoji_url: url('https://cdn.discordapp.com/emojis/${a.slice(0, -4).split(":").reverse()[0]}.${
							a.startsWith("&lt;a") ? "gif" : "png"
						}?size=16')"></div>`
				)
				.replace(/@everyone|@here/g, `<span class="mentions">$&</span>`)
				.replace(/:(.*):/g, (a, b) => EmojiDict[b] || a)
				.replace(
					/&lt;(@|#|@&amp;)(\d*)&gt;/g,
					(a, b, c) => `<span class="mentions" data-type="${b == "@&amp;" ? "role" : b == "#" ? "channel" : "user"}" data-id="${c}">${a.slice(4).slice(0, -4)}</span>`
				);
			Object.keys(backticks).forEach((a) => {
				output = output.replace(a, `<code>${backticks[a].slice(0, -1).slice(1)}</code>`);
			});
			Object.keys(blocks).forEach((a) => {
				let res = blocks[a].slice(0, -3).slice(3);
				if (/^\w+<br>|^<br>/.test(res)) res = res.split("<br>").slice(1).join("<br>");
				output = output.replace(a, `<pre>${res}</pre>`);
			});
			return output;
		}

		let elem, lastSender;
		function addMessage(msg) {
			if (lastSender != msg.author.id) {
				lastSender = msg.author.id;
				elem = crel("div");
				elem.classList.add("message");

				elem.style.backgroundImage = msg.author.avatar
					? 'url("' + "https://cdn.discordapp.com/avatars/" + msg.author.id + "/" + msg.author.avatar + ".png?size=24" + '")'
					: "url(/css/default.png)";

				let bold = crel("b");
				bold.dataset.id = msg.author.id;
				bold.innerText = msg.author.username + "\n";
				elem.appendChild(bold);

				msg_con.appendChild(elem);
			}

			function makeImage(url, speed) {
				let el = new Image();
				el.src = url;
				if (speed != "unset") el.style.imageRendering = "optimize" + (speed ? "Speed" : "Quality");
				return el;
			}

			function handleEmbed(embed, span) {
				let { type, url } = embed;
				if (/gifv|image/.test(type)) {
					let e = span.firstElementChild;
					if (span.childNodes.length == 1 && e && e.tagName == "A") span.innerHTML = "";

					let a = makeImage(url + (type == "gifv" ? ".gif" : ""), type == "gifv");
					let { height, width } = embed.thumbnail;
					if ((width || 0) > 203) a.style.height = (height / width) * 203 + "px";
					else a.style.height = height;
					a.onload = function () {
						this.onload = null;
						//	this.style.removeProperty("height");
					};
					Object.assign(a.dataset, {
						embed: true,
						id: msg.id,
					});
					return elem.appendChild(a);
				}
			}

			function handleReply(ref, span) {
				let el = crel("div");
				el.classList.add("reply");
				if (ref.attachments && ref.attachments[0]) el.classList.add("attach");
				if (ref.sticker_items) el.classList.add("sticker");
				let b = crel("b");
				b.innerText = "@" + ref.author.username + " ";
				el.innerText = ref.content.substring(0, 30).replace(/\n/g, " ");
				el.prepend(b);
				span.prepend(el);
			}

			function handleAttach(a) {
				let { content_type: type, url } = a;
				if (type && type.startsWith("image/")) {
					let e = makeImage(url, type.includes("gif"));
					let { height, width } = a;

					if ((width || 0) > 203) e.style.height = (height / width) * 203 + "px";
					else e.style.height = height;

					e.onload = function () {
						this.onload = null;
						//	this.style.removeProperty("height");
					};
					Object.assign(e.dataset, {
						id: msg.id,
					});
					return elem.appendChild(e);
				}
				if (type && type == "sticker") {
					let { format_type: format, id, name } = a;
					let e = makeImage(`https://media.discordapp.net/stickers/${id}.png?size=240`, "unset");
					Object.assign(e.style, { width: "203px", height: "203px" });
					Object.assign(e.dataset, { format, name, id: msg.id });
					e.onload = function () {
						this.onload = null;
						//	this.removeAttribute("style");
					};
					elem.appendChild(e);
				}
			}

			let span = crel("div");
			span.id = "msg" + msg.id;
			span.innerText = msg.content;
			console.log(msg);
			span.innerHTML = linkify(span.innerHTML) + (msg.edited_timestamp ? `<small> (edited)</small>` : "");
			elem.appendChild(span);
			if (msg.attachments && msg.attachments[0]) msg.attachments.forEach(handleAttach);
			if (msg.embeds && msg.embeds[0]) msg.embeds.forEach((a) => handleEmbed(a, span));
			if (msg.sticker_items) handleAttach(Object.assign({ content_type: "sticker" }, msg.sticker_items[0]));
			if (msg.referenced_message) handleReply(msg.referenced_message, span);
		}

		discord.getMessages(channel.id, 15).then((messages) => {
			messages.reverse().forEach(addMessage);

			let cache = {};

			function updateMentions() {
				let hash_mentions = chview.qsa(`.mentions[data-type="channel"]:not(.loaded)`);
				new Set(hash_mentions.map((a) => a.dataset.id)).forEach((a) => {
					discord.getChannel(a).then((e) => {
						// people can also mention a channel not in the current server
						hash_mentions
							.filter((b) => b.dataset.id == a)
							.forEach((d) => {
								d.innerText = "#" + e.name;
								d.classList.add("loaded");
							});
					});
				});

				if (guild != "dms") {
					discord.getRoles(guild).then((roles) => {
						let role_mentions = chview.qsa(`.mentions[data-type="role"]:not(.loaded)`);
						new Set(role_mentions.map((a) => a.dataset.id)).forEach((a) => {
							role_mentions
								.filter((b) => b.dataset.id == a)
								.forEach((d) => {
									let sr = roles.find((e) => e.id == a);
									d.innerText = "@" + (sr.name || "deleted-role");
									d.classList.add("loaded");
									let { style } = d;
									if (sr && sr.color) {
										let col = decimal2rgb(sr.color, true);
										style.setProperty("--color", `rgba(${col},0.3)`);
										style.color = `rgb(${col})`;
									}
								});
						});

						let mentions = chview.qsa(`.mentions[data-type="user"]:not(.loaded), .message > b:not(.loaded)`);
						new Set(mentions.map((a) => a.dataset.id)).forEach((a) => {
							discord.getServerProfile(guild, a).then((e) => {
								if (!(e.roles && e.user)) return;
								mentions
									.filter((b) => b.dataset.id == a)
									.forEach((d) => {
										let isB = d.tagName == "B";
										d.innerText = (isB ? "" : "@") + (e.nick ? e.nick : e.user.username) + (isB ? "\n" : "");
										d.classList.add("loaded");
										if (!isB) return;
										let { style } = d;
										if (e.roles && e.roles.length != 0) {
											let sr = roles.reverse().find((o) => e.roles.includes(o.id));
											if (sr && sr.color) {
												let col = decimal2rgb(sr.color, true);
												style.setProperty("--color", `rgba(${col},0.3)`);
												style.color = `rgb(${col})`;
											}
										}
									});
							});
						});
					});
				} else {
					let mentions = chview.qsa(`.mentions[data-type="user"]:not(.loaded)`);
					new Set(mentions.map((a) => a.dataset.id)).forEach((a) => {
						discord.getProfile(a).then((e) => {
							mentions
								.filter((b) => b.dataset.id == a)
								.forEach((d) => {
									d.innerText = "@" + e.user.username;
									d.classList.add("loaded");
								});
						});
					});
				}
			}
			updateMentions();
			setTimeout(() => (msg_con.scrollTop = msg_con.scrollHeight), 500);
			discordGateway.addEventListener("message", function (evt) {
				if (evt.channel_id != channel.id) return;
				addMessage(evt, true);
				updateMentions();
				if (actEl().id == "writert") msg_con.scrollTop = msg_con.scrollHeight;
			});

			discordGateway.addEventListener("message_edit", function (evt) {
				if (evt.channel_id != channel.id) return;
				let a = qsa(`[data-id="${evt.id}"][data-embed]`);
				let msg_el = msg_con.qs("#msg" + evt.id);
				if (evt.embeds.length == 0 && a.length > 0) {
					a.forEach((a) => a.remove());
				}
				let re = msg_el.qs(".reply");
				if (re) re = re.outerHTML;
				else re = "";
				msg_el.innerHTML = re + linkify(evt.content) + `<small> (edited)</small>`;
				updateMentions();
			});

			discordGateway.addEventListener("message_delete", function (evt) {
				if (evt.channel_id != channel.id) return;
				msg_con.qsa(`[data-id="${evt.id}"],#msg${evt.id}`).forEach((a) => a.remove());
				updateMentions();
			});

			switchPages("chview");
		});
	});
}

function loadServers() {
	let servers = qs("#srvrs .servers");
	servers.innerHTML = "";

	function server_icon(obj) {
		let el = crel("div");
		let { dataset } = el;
		el.tabIndex = 0;
		dataset.mentions = 0; // temp
		dataset.id = obj.id;
		el.classList.add("server-icon");
		if (obj.icon) el.style = `--server_url: url(${obj.icon})`;
		else {
			el.classList.add("no_icon");
			let split = obj.name.split(" ").map((a) => (a[0] || "").toLowerCase());
			el.innerText = (split[0] || "") + (split[1] || "");
		}
		return el;
	}

	function createFolder(obj) {
		let el = crel("div");
		let { dataset } = el;
		el.tabIndex = 0;
		dataset.mentions = 0; // temp
		dataset.id = obj.id;
		dataset.hidden = false;
		el.classList.add("server-folder");

		el.innerHTML = '<div class="server-folder-icon" tabindex="0"></div>';

		obj.array.forEach((a) => {
			el.appendChild(server_icon(a));
		});
		return el;
	}

	discord.getServers().then((_guilds) => {
		let guilds = _guilds.map((a) => {
			a.icon = a.icon ? `https://cdn.discordapp.com/icons/${a.id}/${a.icon}.png?size=48` : null;
			return a;
		});
		discord.getSettings().then((settings) => {
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
			sort.forEach((a) => {
				servers.appendChild(a.folder ? createFolder(a) : server_icon(a));
			});
		});
	});
}

function login(token, save) {
	if (save) localStorage.setItem("token", token);

	discord.login(token);
	discordGateway.login(token);

	let attempts = 0;
	let {
		dataset: { channel: id },
	} = getId("chview");
	discordGateway.addEventListener("close", function () {
		function hmm() {
			if (document.visibilityState == "visible") {
				attempts++;
				if (id) loadChannel({ id });
				discordGateway.init();
			} else {
				document.addEventListener("visibilitychange", function a() {
					document.removeEventListener("visibilitychange", a);
					hmm();
				});
			}
		}
		if (attempts == 5) {
			if (confirm("The Discord gateway closed 5 times already! Do you want to retry connecting? You might get rate limited...")) {
				attempts = -1;
				hmm();
			} else window.close();
		} else hmm();
	});

	discordGateway.init();
	loadServers();
	listChannel({ dm: true });
	//idk
	setTimeout(() => {
		if (navigator.userAgent == "Mozilla/5.0 (Mobile; Nokia_800_Tough; rv:48.0) Gecko/48.0 Firefox/48.0 KAIOS/2.5.2.2") {
			listChannel({ dm: true });
		}
	}, 5000);
}

window.addEventListener("load", function () {
	qs("html").lang = navigator.language;

	function log() {
		[...arguments].forEach((a) => console.log(a));
	}

	if (localStorage.getItem("token")) {
		login(localStorage.getItem("token"));
	} else {
		fetch("/token.txt")
			.then((r) => r.text())
			.then((r) => {
				login(r, true);
			})
			.catch((e) => {
				log(
					"To login: ",
					"  1. Get your Discord token (you can use https://cyan-2048.github.io/discordo/)",
					'"  2. Run the following function from WebIDE: ',
					'"     login("TOKEN_HERE", true);',
					'"  3. The DM selector should appear. If it',
					'"     does not, relaunch the app and enjoy.'
				);
				alert("hi, token.txt was not found, please go to WebIDE and check the console logs, it will show you instructions...");
			});
	}

	function initEmoji(link, toSave) {
		let xhr = new XMLHttpRequest({ mozSystem: true });
		xhr.open("get", link, true);
		xhr.responseType = "blob";
		xhr.onload = () => {
			let r = xhr.response;
			let el = crel("style");
			let url = URL.createObjectURL(r);
			el.innerHTML = `@font-face { font-family: twemoji; src: url("${url}");}`;
			document.documentElement.appendChild(el);
			if (toSave === true) {
				let reader = new FileReader();
				reader.readAsDataURL(r);
				reader.onloadend = () => {
					localStorage.setItem("emoji-font", reader.result);
				};
			}
		};
		xhr.send();
	}

	let emoji = localStorage.getItem("emoji-font");
	initEmoji(emoji || "https://github.com/mozilla/twemoji-colr/releases/latest/download/TwemojiMozilla.ttf", emoji ? false : true);
});

// cyan's code

function caret(el) {
	return el.selectionStart;
}

getId("writert").onfocus = () => {
	changeSoftKeys(["Send", "enter", "Options"]);
};

getId("message_container").onfocus = () => {
	changeSoftKeys(["Channels", "send", "Options"]);
};

function changeSoftKeys(arr) {
	[...qs("footer").children].forEach((a, i) => (a.innerHTML = arr[i]));
}

var switchPages = (() => {
	function getScrollParent(node) {
		if (node == null) return null;
		if (node.scrollHeight > node.clientHeight) return node;
		else return getScrollParent(node.parentNode);
	}

	let current = null;
	let pages = qsa("#chview,#chlist,#srvrs");

	let _pages = (() => {
		let obj = {};
		pages.forEach((a) => {
			obj[a.id] = a;
		});
		return obj;
	})();

	sn.init();
	let disabled = true;
	let _servers = `#srvrs [data-role="dms"], #srvrs .servers > [tabindex]:not([data-hidden="false"]), #srvrs .server-folder[data-hidden="false"] > [tabindex]`;

	let servers = getId("srvrs");

	sn.add({
		id: "srvrs",
		selector: _servers,
		disabled,
	});
	sn.add({
		id: "chlist",
		selector: `#chlist [tabindex]`,
		disabled,
	});

	function switchPages(g) {
		pages.forEach((a) => a.classList.remove("selected"));
		_pages[g].className = "selected";
		if (g == "chview") {
			setTimeout(() => {
				getId("writert").focus();
			}, 500);
		}

		if (current) sn.disable(current);
		if (g == "chview") current = null;
		else {
			current = g;
			sn.enable(g);
		}

		if (g == "srvrs") {
			let sel = servers.qs(".selected");
			if (sel) {
				let parent = sel.parentNode;
				if (parent.classList.contains("server-folder")) {
					if (parent.dataset.hidden == "true") {
						parent.focus();
					} else sel.focus();
				} else sel.focus();
			} else {
				let el = servers.qs(_servers);
				el.classList.add("selected");
				el.focus();
			}
		}
		if (g == "chlist") {
			let current = _pages["chview"].dataset.channel;
			if (current) {
				let el = _pages["chlist"].qs("[data-channel='" + current + "']");
				if (el) el.focus();
				else {
					actEl().blur();
					sn.focus();
				}
			} else {
				sn.focus();
			}
		}
	}

	let isScrolling = false;

	window.addEventListener("sn:willmove", (e) => {
		if (isScrolling) e.preventDefault();
	});

	window.addEventListener("sn:focused", (e) => {
		if (isScrolling) return;
		isScrolling = true;
		let to = actEl();
		const rect = to.getBoundingClientRect();
		const elY = rect.top - 0 + rect.height / 2;
		let parent = getScrollParent(to);
		if (!parent) return (isScrolling = false);

		parent.scrollBy({
			left: 0,
			top: elY - window.innerHeight / 2,
			behavior: "smooth",
		});

		setTimeout(() => {
			isScrolling = false;
		}, 50);
	});

	let writert = getId("writert");

	writert.setAttribute("style", "height:37px;overflow-y:hidden;");
	writert.addEventListener(
		"input",
		function () {
			if (this.scrollHeight < 73) {
				this.style.height = "auto";
				this.style.height = this.scrollHeight + "px";
			}
		},
		false
	);

	writert.oninput = function () {
		let x = /:([\s\S]*?):\n?$/,
			text = this.value;
		if (x.test(text)) {
			let t = false;
			let r = text.replace(x, (a, b) => {
				let e = EmojiDict[b];
				if (e) {
					t = true;
					return e;
				}
			});
			if (t) {
				setTimeout(() => {
					this.value = r;
					this.setSelectionRange(this.value.length, this.value.length);
				}, 50);
			}
		}
	};

	let { chview, chlist, srvrs } = _pages;

	let msg_con = getId("message_container");

	window.addEventListener("keydown", (e) => {
		let { key, target } = e;

		if (chview.classList.contains("selected")) {
			if (key == "SoftLeft") {
				if (target == writert) {
					discord.sendMessage(chview.dataset.channel, writert.value);
					writert.value = "";
				} else setTimeout(() => switchPages("chlist"), 50);
			}
			if (key == "ArrowLeft" && target != writert) {
				setTimeout(() => switchPages("chlist"), 50);
			}
			if (key == "Backspace") {
				e.preventDefault();
				if ((target == writert && writert.value == "") || target != writert) switchPages("chlist");
			}

			let scrolled = msg_con.scrollHeight - msg_con.scrollTop === msg_con.clientHeight;

			if (key == "ArrowUp" && target == writert && caret(writert) == 0) {
				if (target.value == "" && !scrolled) msg_con.focus();
				else setTimeout(() => msg_con.focus(), 50);
			}
			if (key == "ArrowDown" && target == writert && target.value == "") {
				msg_con.focus();
			}

			if (target.id == "message_container") {
				let text = writert;
				if (scrolled && key == "ArrowDown") {
					text.focus();
				} else if (target.scrollTop === 0 && key == "ArrowUp") {
					text.focus();
				}
			}

			if (key == "ArrowRight" && target.id == "message_container") writert.focus();
		} else if (chlist.classList.contains("selected")) {
			let id = target.dataset.channel;
			if (key == "Enter") {
				if (id == chview.dataset.channel) switchPages("chview");
				else loadChannel({ id });
			}
			if (key.includes("Right") && chview.dataset.channel) switchPages("chview");
			if (key.includes("Left") || key == "Backspace") {
				e.preventDefault();
				switchPages("srvrs");
			}
		} else if (srvrs.classList.contains("selected")) {
			let { dataset, classList: cL } = target;

			if (key == "Enter") {
				if (cL.contains("server-folder")) {
					dataset.hidden = false;
					setTimeout(() => target.children[0].focus(), 50);
				} else if (cL.contains("server-folder-icon")) {
					let parent = target.parentNode;
					parent.dataset.hidden = true;
					parent.focus();
				} else {
					let { id, role } = dataset;
					let dm = role == "dms";
					if (chlist.dataset.channel == (dm ? "dms" : id)) {
						switchPages("chlist");
					} else {
						let sel = srvrs.qs(".selected");
						if (sel) sel.classList.remove("selected");
						target.classList.add("selected");
						listChannel({ id, dm });
					}
				}
			} else if (/Right/.test(key)) {
				switchPages("chlist");
			} else if (key == "Backspace") {
				e.preventDefault();
				if (confirm("Are you sure you want to exit the app?")) window.close();
			}
		}
	});

	return switchPages;
})();
