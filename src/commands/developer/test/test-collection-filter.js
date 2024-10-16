const { SlashCommandSubcommandBuilder } = require("discord.js");
const { parseFilterString } = require("@utils/gacha/filter");

module.exports = {
  category: "developer/test",
  data: new SlashCommandSubcommandBuilder()
    .setName("collection-filter")
    .setDescription("Test parsing of the collection filters.")
    .addStringOption((option) => option.setName("string").setDescription("Filter string to test parser.")),

  async execute(client, interaction) {
    const testCases = [
      "-a -asc character=yato rarity>=r series=noragami",
      "bad order=date wish<> wish>100 wrong fake  rarity>= false junk",
      'series="attack on titan" series="character" character=goku score>=90',
      'series  = "    dragon         ball "     wish   <> character=           "black   goku"',
    ];

    const string = interaction.options.getString("string");
    if (string) testCases.push(string);

    await interaction.deferReply();

    const output = [];
    for (const testCase of testCases) {
      output.push(testCase);
      output.push("```");
      const parsedData = parseFilterString(testCase);
      for (const data of parsedData) {
        output.push(`{ key: "${data.key}", operator: "${data.operator}", value: "${data.value}" }`);
      }
      output.push("```");
      output.join("\n");
    }

    interaction.editReply(output.join("\n"));
  },
};
