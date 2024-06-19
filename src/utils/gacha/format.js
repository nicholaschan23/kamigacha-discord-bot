function formatCardInfo(data) {
  return [`\`${data.code}\``, `\`${data.rarity}\``, `\`◈${data.set}\``, `*${data.series}*`, `**${data.character}**`].join(" · ");
}

function formatCardInfoPage(dataList) {
  // Calculate max lengths for padding
  const maxCodeLength = Math.max(...dataList.map(data => data.code.length));
  const maxRarityLength = Math.max(...dataList.map(data => data.rarity.length));
  const maxSetLength = Math.max(...dataList.map(data => `${data.set}`.length));

  return dataList.map(data => {
    const paddedCode = data.code.padEnd(maxCodeLength, ' ');
    const paddedRarity = data.rarity.padEnd(maxRarityLength, ' ');
    const paddedSet = `${data.set}`.padEnd(maxSetLength, ' ');

    return [`\`${paddedCode}\``, `\`${paddedRarity}\``, `\`◈${paddedSet}\``, `*${data.series}*`, `**${data.character}**`].join(" · ");
  }).join('\n');
}

module.exports = {
  formatCardInfo,
  formatCardInfoPage,
};
