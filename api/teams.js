const { teams, buildSeasonSnapshot } = require("./_shared/season-data");

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const { standings } = buildSeasonSnapshot(new Date());

  const payload = teams.map((team) => {
    const stats = standings.get(team.id);
    return {
      nome: team.name,
      vitorias: stats ? stats.wins : 0,
      derrotas: stats ? stats.losses : 0,
      pf: stats ? stats.pointsFor : 0,
      pc: stats ? stats.pointsAgainst : 0,
    };
  });

  res.status(200).json(payload);
};
