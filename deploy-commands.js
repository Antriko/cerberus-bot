const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

(async () => {
	try {
		const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENTID),
            { body: commands },
        );
	} catch (error) {
		console.error(error);
	}
})();