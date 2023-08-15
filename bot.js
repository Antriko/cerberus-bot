const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const schedule = require('node-schedule');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
	console.log("Ready.");


    const rule = new schedule.RecurrenceRule();

    // Post somethingevery friday morning
    // const friday = new schedule.RecurrenceRule();
    // friday.dayOfWeek = 5; // (0-6) Starting with Sunday
    // friday.hour = 5;
    // friday.minute = 0;
    // friday.second = 0;
    // const postage = schedule.scheduleJob(friday, postFunction);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error("Err?", error);
		await interaction.reply({ content: "Error", ephemeral: true });
	}
});

client.login(process.env.TOKEN);