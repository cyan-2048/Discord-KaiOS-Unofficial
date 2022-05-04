// i commented out discord gateway stuff....
let { DiscordXHR /*, DiscordGateway */ } = require("./index.js");

let discord = new DiscordXHR();
// let discordGateway = new DiscordGateway({ debug: false });

let token = require("fs").readFileSync("./token.txt", { encoding: "utf-8" });

discord.login(token);
// discordGateway.login(token);

/*
discordGateway.addEventListener("close", function () {
	console.error("Oh no! Discord Gateway connection has closed!");
});

discordGateway.init();
*/
/*
(async () => {
	let channels = await discord.getChannelsDM();
	console.log("await discord.getChannelsDM():");
	channels
		.map(function (x) {
			var name =
				x.name ||
				x.recipients
					.map(function (x) {
						return x.username;
					})
					.join(", ");
			return name;
		})
		.forEach((a) => console.log(a));
})();
*/
discord.sendMessage("846181656514658304", "t!rep 733929955099934741");
