module.exports = {
	name: "test",

	async execute(client, interaction) {
		const focusedValue = interaction.options.getFocused();
		const choices = ["Hey!", "Excuse me!"];

		const filtered = choices.filter((choice) =>
			choice.startsWith(focusedValue)
		);

		await interaction.respond(
			filtered.map((choice) => ({ name: choice, value: choice }))
		);
		return;
	},
};