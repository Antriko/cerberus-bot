const { SlashCommandBuilder } = require('discord.js');

const limit = 10;
module.exports = {
	data: new SlashCommandBuilder()
		.setName('prune')
		.setDescription(`Mass delete messages, limited to ${limit}`)
		.addIntegerOption(option => 
            option.setName('prune')
                .setDescription('Amount to delete')
                .setRequired(true))
        .setDefaultMemberPermissions(8192), // Manage Messages
	async execute(interaction) {
		var prune = interaction.options.getInteger('prune');
        
        prune = ((prune) > limit ? limit : prune)
        prune = ((prune) <= 0 ? 1 : prune);

        console.log(`Pruning ${prune}`)

		await interaction.channel.bulkDelete(prune + 1, true).catch(error => {
			console.error(error);
			interaction.reply({ content: 'Prune error', ephemeral: true });
		});
        
        return interaction.reply({ content: `Pruned ${prune}`, ephemeral: true });
	},
};