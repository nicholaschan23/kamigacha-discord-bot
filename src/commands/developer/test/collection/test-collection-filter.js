const { SlashCommandSubcommandBuilder } = require("discord.js");
const Logger = require("../../../../utils/Logger");
const logger = new Logger("Test collection filter");
const { parseFilterString } = require("../../../../utils/gacha/filter");

module.exports = {
  category: "developer/test/collection",
  data: new SlashCommandSubcommandBuilder().setName("filter").setDescription("Test parsing of the collection filters."),

  async execute(client, interaction) {
    await interaction.deferReply();
    const testCases = [
      "t=trade o=w",
    ];

    // const testCases = [
    //   "bad order=date wishlist<> wishlist>100 wrong fake  rarity>= false junk",
    //   'series="attack on titan" series="character" character=goku score>=90',
    //   'series  = "    dragon         ball "     wishlist   <> character=           "black   goku"',
    // ];

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
    await interaction.editReply(output.join("\n"));
  },
};
