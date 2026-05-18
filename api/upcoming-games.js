import { buildSeasonSnapshot } from "./_shared/season-data.js";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const { upcomingGames } = buildSeasonSnapshot(new Date());

  res.status(200).json(upcomingGames);
}
