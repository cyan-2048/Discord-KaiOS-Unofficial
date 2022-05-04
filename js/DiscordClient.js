var discord = new DiscordXHR();

var discordGateway = new DiscordGateway({ debug: true });

function listChannel() {
	var chview = document.getElementById("chview");

	discord.getChannelsDM().then((raw) => {
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

		var list = document.createElement("ul");
		list.id = "chlist";

		var nav = function (evt) {
				var ix = Array.prototype.indexOf.apply(list.children, [document.activeElement]);

				console.log(evt.key, ix);

				switch (evt.key) {
					case "ArrowDown":
					case "ArrowRight": {
						ix = (ix + 1) % list.children.length;
						break;
					}

					case "ArrowUp":
					case "ArrowLeft": {
						ix = (list.children.length + ix - 1) % list.children.length;
						break;
					}

					default: {
						return;
					}
				}

				list.children[ix].focus();
			},
			focus = null;

		channels.forEach((a) => {
			var item = document.createElement("a");
			item.innerText = a.name;
			item.setAttribute("channel", a.channel.id);
			item.href = "#chview";
			item.id = "msg" + a.channel.id;
			item.addEventListener("keydown", nav);
			item.addEventListener("click", function () {
				document.documentElement.classList.remove("chlist");
				document.body.removeChild(list);
				loadChannel({ id: this.getAttribute("channel") });
			});

			if (a.channel.id == chview.getAttribute("channel")) {
				focus = item;
			}

			list.appendChild(item);
		});

		document.documentElement.classList.add("chlist");
		document.body.appendChild(list);

		(focus || list.children[0]).focus();
	});
}

function loadChannel(channel) {
	var chname = document.getElementById("chname");
	var chview = document.getElementById("chview");

	chview.setAttribute("channel", channel.id);
	while (chview.children.length > 3) {
		chview.removeChild(chview.children[3]);
	}

	discord.getChannel(channel.id).then((ch) => {
		chname.innerText =
			ch.name ||
			ch.recipients
				.map(function (x) {
					return x.username;
				})
				.join(", ");

		var elem, lastSender;
		var addMessage = function (msg) {
			if (lastSender != msg.author.id) {
				lastSender = msg.author.id;
				elem = document.createElement("div");
				elem.classList.add("message");

				msg.author.avatar
					? discord.getAvatarURL(msg.author.id, msg.author.avatar).then((a) => {
							elem.style.backgroundImage = 'url("' + a + '")';
					  })
					: (elem.style.backgroundImage = 'url("/img/icons/icon-56x.png")');

				var bold = document.createElement("b");
				bold.innerText = msg.author.username + "\n";
				elem.appendChild(bold);

				chview.appendChild(elem);
			}

			var span = document.createElement("div");
			span.classList.add("message-indiv");
			span.id = "msg" + msg.id;
			span.innerText = msg.content;
			elem.appendChild(span);
		};

		discord.getMessages(channel.id, 15).then((messages) => {
			messages.reverse().forEach(addMessage);

			discordGateway.addEventListener("message", function (evt) {
				if (evt.channel_id != channel.id) return;

				addMessage(evt);
				chview.scrollTop = chview.scrollHeight;
			});
		});
	});
}

function selectTextbox() {
	var s = !document.documentElement.classList.contains("chlist");

	var writert = document.getElementById("writert");
	if (s && writert != document.activeElement) {
		writert.select();
	}

	setTimeout(selectTextbox, 125);
}

function init() {
	var chview = document.getElementById("chview");
	var writert = document.getElementById("writert");

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
	selectTextbox();
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
