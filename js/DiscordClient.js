var discord = new DiscordXHR();

var discordGateway = new DiscordGateway({ debug: true });

function listChannel(opts = { dm: true }) {
	let focus = null;

	discord["getChannels" + (opts.dm ? "DM" : "")]().then((raw) => {
		let channels = raw.map(function (x) {
			var name =
				x.name ||
				x.recipients
					.map(function (x) {
						return x.username;
					})
					.join(", ");
			return { name: name, channel: x };
		});

		var list = getId("chlist");
		list.innerHTML = "";

		if (opts.dm) {
			let header = document.createElement("div");
			header.className = "separator";
			header.innerText = "direct messages";
			list.appendChild(header);
		}

		channels.forEach((a) => {
			let item = document.createElement("div");
			item.tabIndex = 0;
			let dataset = item.dataset;
			dataset.type = opts.dm ? "dm" : "text"; // temp
			dataset.channel = a.channel.id;

			// item.innerText = a.name;
			// item.setAttribute("channel", a.channel.id);
			// item.href = "#chview";
			// item.id = "msg" + a.channel.id;

			let m = document.createElement("div");
			m.dataset.mentions = 0; // temp
			item.appendChild(m);

			if (opts.dm) {
				let av = document.createElement("div");
				av.className = "avatar";
				av.dataset.status = "offline";
				item.appendChild(av);

				if (a.channel.recipients && a.channel.recipients[0].avatar) {
					let { id, avatar } = a.channel.recipients[0];
					item.style = `--default-avatr: url(https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=32)`;
				}
			}

			if (false) {
				// temp
				let s = document.createElement("div");
				s.className = "subtext";
				s.innerText = "temp status";
				item.appendChild(s);
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

		(focus || list.qs("[data-type]")).focus();
	});
}

function loadChannel(channel) {
	var chname = getId("chname");
	var msg_con = getId("message_container");

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

				msg.author.avatar
					? discord.getAvatarURL(msg.author.id, msg.author.avatar).then((a) => {
							elem.style.backgroundImage = 'url("' + a + '")';
					  })
					: (elem.style.backgroundImage = 'url("/css/default.png")');

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

			discordGateway.addEventListener("message", function (evt) {
				if (evt.channel_id != channel.id) return;

				addMessage(evt);
				msg_con.scrollTop = msg_con.scrollHeight;
			});
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

function init() {
	var chview = getId("chview");
	var writert = getId("writert");

	discordGateway.init();

	window.addEventListener("keypress", function (e) {
		switch (e.key) {
			case "ArrowDown": {
				chview.scrollTop += 75;
				break;
			}

			case "ArrowUp": {
				chview.scrollTop -= 75;
				break;
			}

			case "SoftLeft": {
				listChannel();
				break;
			}

			case "SoftRight": {
				alert("unimplemented");
				break;
			}
		}
	});

	writert.addEventListener("keypress", function (evt) {
		if (evt.key != "Enter") return;
		if (writert.value.length <= 0) return;

		evt.preventDefault();
		discord.sendMessage(chview.getAttribute("channel"), writert.value);
		writert.value = "";
	});
}

function login(token, save) {
	if (save) localStorage.setItem("token", token);

	discord.login(token);
	discordGateway.login(token);

	discordGateway.addEventListener("close", function () {
		if (confirm("Oh no! Discord Gateway connection has closed! Reconnect?")) {
			discordGateway.login(token);
			discordGateway.init();
		}
	});

	init();
	listChannel();
	switchPages("chlist");
	loadServers();
}

window.addEventListener("DOMContentLoaded", function () {
	if (localStorage.getItem("token")) {
		login(localStorage.getItem("token"));
	} else {
		console.log("To login: ");
		console.log("  1. Get your Discord token");
		console.log("  2. Run the following function from WebIDE: ");
		console.log('     login("TOKEN_HERE", true);');
		console.log("  3. The DM selector should appear. If it");
		console.log("     does not, relaunch the app and enjoy.");
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

var focusTimeout;

window.addEventListener("keydown", (e) => {
	let { key, target } = e;

	let writert = getId("writert");

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
});

getId("writert").onfocus = () => {
	changeSoftKeys(["Send", "enter", "Options"]);
};

getId("message_container").onfocus = () => {
	changeSoftKeys(["Channels", "send", "Options"]);
};

function changeSoftKeys(arr) {
	[qs("footer").children].forEach((a, i) => (a.innerHTML = arr[i]));
}

function switchPages(g) {
	qsa("#chview,#chlist,#srvrs").forEach((a) => a.classList.remove("selected"));

	getId(g).className = "selected";

	if (g == "chview") {
		setTimeout(() => {
			getId("writert").focus();
		}, 500);
	}
}
