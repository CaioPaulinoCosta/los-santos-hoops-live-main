const { buildSeasonSnapshot } = require("./_shared/season-data");

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const { upcomingGames } = buildSeasonSnapshot(new Date());

  res.status(200).json(upcomingGames);
};
