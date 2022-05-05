const sn = SpatialNavigation;
var discord = new DiscordXHR();

var discordGateway = new DiscordGateway({ debug: true });

function listChannel(opts = { dm: true }) {
	let focus = null;
	let list = getId("chlist");

	function bye() {
		switchPages("chlist");
		(focus || list.qs("[data-type]")).focus();
	}

	if (list.dataset.channel == (opts.dm ? "dms" : opts.id)) return bye();
	list.innerHTML = "";
	list.dataset.channel = opts.dm ? "dms" : opts.id;

	discord["getChannels" + (opts.dm ? "DM" : "")]("guilds/" + opts.id).then((raw) => {
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
							let id = a.parent_id;
							(_channels[id ? channels_id[id] : 0] || []).push(a);
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
			let header = document.createElement("div");
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

			let item = document.createElement("div");
			item.tabIndex = 0;
			let dataset = item.dataset;
			dataset.type = opts.dm ? "dm" : a.type == 5 ? "announce" : "text"; // temp
			dataset.channel = a.id;

			// item.innerText = a.name;
			// item.setAttribute("channel", a.channel.id);
			// item.href = "#chview";
			// item.id = "msg" + a.channel.id;

			let m = document.createElement("div");
			m.dataset.mentions = 0; // temp
			item.appendChild(m);

			function subtext(text) {
				let s = document.createElement("div");
				s.className = "subtext";
				s.innerText = text;
				return s;
			}

			if (opts.dm) {
				let av = document.createElement("div");
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

			let text = document.createElement("div");
			text.className = "text";
			text.innerText = a.name;
			item.appendChild(text);

			// if (a.channel.id == chview.getAttribute("channel")) {
			// 	focus = item;
			// }

			list.appendChild(item);
		});

		bye();
	});
}

function loadChannel(channel) {
	var chname = getId("chname");
	var msg_con = getId("message_container");

	msg_con.innerHTML = "";

	let chview = getId("chview");
	chview.dataset.channel = channel.id;

	discord.getChannel(channel.id).then((ch) => {
		chname.innerText =
			ch.name ||
			ch.recipients
				.map(function (x) {
					return x.username;
				})
				.join(", ");

		var elem, lastSender;
		function addMessage(msg) {
			if (lastSender != msg.author.id) {
				lastSender = msg.author.id;
				elem = document.createElement("div");
				elem.classList.add("message");

				elem.style.backgroundImage = msg.author.avatar
					? 'url("' + "https://cdn.discordapp.com/avatars/" + msg.author.id + "/" + msg.author.avatar + ".png?size=24" + '")'
					: "url(/css/default.png)";

				var bold = document.createElement("b");
				bold.innerText = msg.author.username + "\n";
				elem.appendChild(bold);

				msg_con.appendChild(elem);
			}

			var span = document.createElement("div");
			span.id = "msg" + msg.id;
			span.innerText = msg.content;
			elem.appendChild(span);
		}

		discord.getMessages(channel.id, 15).then((messages) => {
			messages.reverse().forEach(addMessage);
			msg_con.scrollTop = msg_con.scrollHeight;
			discordGateway.addEventListener("message", function (evt) {
				if (evt.channel_id != channel.id) return;

				addMessage(evt);
				msg_con.scrollTop = msg_con.scrollHeight;
			});
			switchPages("chview");
		});
	});
}

function loadServers() {
	let servers = qs("#srvrs .servers");
	servers.innerHTML = "";

	function server_icon(obj) {
		let el = document.createElement("div");
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
		let el = document.createElement("div");
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

	discord.getServers().then((_servers) => {
		_servers.forEach((a) => {
			servers.appendChild(a.folder ? createFolder(a) : server_icon(a));
		});
	});
}

function login(token, save) {
	if (save) localStorage.setItem("token", token);

	discord.login(token);
	discordGateway.login(token);

	let attempts = 0;
	discordGateway.addEventListener("close", function () {
		function hmm() {
			if (document.visibilityState == "visible") {
				attempts++;
				discordGateway.login(token);
				discordGateway.init();
			} else {
				document.addEventListener("visibilitychange", function a() {
					document.removeEventListener("visibilitychange", a);
					hmm();
				});
			}
		}
		if (attempts == 10) {
			if (confirm("The Discord gateway closed 10 times already! Do you want to retry connecting?")) {
				attempts = -1;
				hmm();
			} else window.close();
		} else hmm();
	});

	discordGateway.init();
	loadServers();
	listChannel({ dm: true });

	setTimeout(() => {
		if (navigator.userAgent == "Mozilla/5.0 (Mobile; Nokia_800_Tough; rv:48.0) Gecko/48.0 Firefox/48.0 KAIOS/2.5.2.2") {
			listChannel({ dm: true });
		}
	}, 5000);
}

window.addEventListener("load", function () {
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
			});
	}
});

// cyan's code

function getCaretPosition(editableDiv) {
	var caretPos = 0,
		sel,
		range;

	sel = window.getSelection();
	if (sel.rangeCount) {
		range = sel.getRangeAt(0);
		if (range.commonAncestorContainer.parentNode == editableDiv) {
			caretPos = range.endOffset;
		}
	}

	return caretPos;
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

	window.addEventListener("keydown", (e) => {
		let { key, target } = e;

		let writert = getId("writert");

		let { chview, chlist, srvrs } = _pages;

		if (chview.classList.contains("selected")) {
			if (key == "SoftLeft") {
				if (target == writert) {
					discord.sendMessage(chview.dataset.channel, writert.innerText);
					writert.innerText = "";
				} else setTimeout(() => switchPages("chlist"), 50);
			}
			if (key == "ArrowLeft" && target != writert) {
				setTimeout(() => switchPages("chlist"), 50);
			}
			if (key == "Backspace") {
				e.preventDefault();
				if ((target == writert && (writert.innerText == "" || writert.innerText == "\n")) || target != writert) switchPages("chlist");
			}
			if (
				((key == "ArrowUp" && (getCaretPosition(writert) != writert.innerText.length - 1 || writert.innerText.length - 1 == 0)) ||
					(key == "ArrowDown" && (getCaretPosition(writert) != 0 || writert.innerText.length - 1 == 0))) &&
				!e.repeat &&
				target.id == "writert"
			) {
				let caret = getCaretPosition(writert);
				let contain = getId("message_container");

				if (caret == 0) {
					contain.focus();
				} else if (caret == writert.innerText.length - 1) {
					contain.focus();
				}
			}

			setTimeout(() => {
				if ((key == "ArrowUp" || key == "ArrowDown") && target.id == "message_container") {
					let text = writert;
					if (target.scrollHeight - target.scrollTop === target.clientHeight) {
						text.focus();
					} else if (target.scrollTop === 0) {
						text.focus();
					}
				}
			}, 50);

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
					target.children[0].focus();
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
			} else if (key == "ArrowRight") {
				switchPages("chlist");
			} else if (key == "Backspace") {
				e.preventDefault();
				if (confirm("Are you sure you want to exit the app?")) window.close();
			}
		}
	});

	return switchPages;
})();
