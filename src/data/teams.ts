import blaineCountyLogo from "@/assets/team-logos/blaine-county-sheriffs.png";
import mirrorParkLogo from "@/assets/team-logos/mirror-park-mavericks.png";
import vinewoodSharksLogo from "@/assets/team-logos/vinewood-sharks.png";
import delPerroLogo from "@/assets/team-logos/del-perro-fishies.png";
import chicanosLogo from "@/assets/team-logos/chicanos-la-mesa.png";
import pacificBullsLogo from "@/assets/team-logos/pacific-bulls.png";
import mazeBankLogo from "@/assets/team-logos/maze-bank-titans.png";
import sanAndreasLogo from "@/assets/team-logos/san-andreas-state-warrior.png";
import paletoBayLogo from "@/assets/team-logos/paleto-bay-threes.png";
import youngersLogo from "@/assets/team-logos/youngers-university-pride.png";
import strawberryFakersLogo from "@/assets/team-logos/strawberry-fakers.png";
import grapeseedGiantsLogo from "@/assets/team-logos/grapeseed-giants.png";
import rockfordCityLogo from "@/assets/team-logos/rockford-city.png";
import sandyShoresLogo from "@/assets/team-logos/sandy-shores-drilling.png";
import vespucciVulturesLogo from "@/assets/team-logos/vespucci-vultures.png";
import davisHustlersLogo from "@/assets/team-logos/davis-hustlers.png";
import littleSeoulLogo from "@/assets/team-logos/little-seoul-serpents.png";
import murrietaHowlersLogo from "@/assets/team-logos/murrieta-howlers.png";
import downtownInfernosLogo from "@/assets/team-logos/downtown-infernos.png";
import fleecaBankLogo from "@/assets/team-logos/fleeca-bank-patricks.png";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo?: string;
}

export const teams: Team[] = [
  { id: "1", name: "Blaine County Sheriff's", shortName: "BCS", color: "#1E3A8A", logo: blaineCountyLogo },
  { id: "2", name: "Mirror Park Mavericks", shortName: "MPM", color: "#9333EA", logo: mirrorParkLogo },
  { id: "3", name: "Vinewood Sharks", shortName: "VWS", color: "#0EA5E9", logo: vinewoodSharksLogo },
  { id: "4", name: "Del Perro Fishies", shortName: "DPF", color: "#F59E0B", logo: delPerroLogo },
  { id: "5", name: "Chicanos La Mesa", shortName: "CLM", color: "#DC2626", logo: chicanosLogo },
  { id: "6", name: "Pacific Bulls", shortName: "PCB", color: "#10B981", logo: pacificBullsLogo },
  { id: "7", name: "Maze Bank Titans", shortName: "MBT", color: "#DC2626", logo: mazeBankLogo },
  { id: "8", name: "San Andreas State Warrior", shortName: "SAS", color: "#B91C1C", logo: sanAndreasLogo },
  { id: "9", name: "Paleto Bay Three's", shortName: "PBT", color: "#1E40AF", logo: paletoBayLogo },
  { id: "10", name: "Youngers University Pride", shortName: "YUP", color: "#6B7280", logo: youngersLogo },
  { id: "11", name: "Strawberry Fakers", shortName: "STF", color: "#DC2626", logo: strawberryFakersLogo },
  { id: "12", name: "Pillbox Pumpkins", shortName: "PBP", color: "#F97316", logo: grapeseedGiantsLogo },
  { id: "13", name: "Rockford Lions", shortName: "RKL", color: "#EAB308", logo: rockfordCityLogo },
  { id: "14", name: "Sandy Shores Drilling", shortName: "SSD", color: "#F97316", logo: sandyShoresLogo },
  { id: "15", name: "Vespucci Vultures", shortName: "VSV", color: "#7C3AED", logo: vespucciVulturesLogo },
  { id: "16", name: "Davis Hustlers", shortName: "DVH", color: "#84CC16", logo: davisHustlersLogo },
  { id: "17", name: "Little Seoul Serpents", shortName: "LSS", color: "#10B981", logo: littleSeoulLogo },
  { id: "18", name: "Murrieta Howlers", shortName: "MRH", color: "#6B7280", logo: murrietaHowlersLogo },
  { id: "19", name: "Downtown Infernos", shortName: "DTI", color: "#DC2626", logo: downtownInfernosLogo },
  { id: "20", name: "Fleeca Bank Patrick's", shortName: "FBP", color: "#10B981", logo: fleecaBankLogo },
];
