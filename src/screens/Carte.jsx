import { useState } from 'preact/hooks';
import { useStore } from '../lib/store.js';
import { BIOME } from '../data/biomes.js';
import { CROPS, FISH, GEMS, FORAGE } from '../data/resources.js';
import { SPECIES } from '../data/critters.js';
import { Icon, Seg, ExtTag } from '../ui.jsx';

// Décor des zones (formes "dessinées à la main") : purement visuel, aucune donnée de jeu.
const BLOBS = [
  'M -95,-8 C -100,-55 -60,-92 -5,-90 C 50,-93 98,-55 95,-2 C 100,48 60,90 5,92 C -50,95 -92,42 -95,-8 Z',
  'M -125,-10 C -130,-48 -85,-68 -30,-62 C 25,-70 110,-58 120,-8 C 128,38 75,68 15,64 C -55,72 -120,32 -125,-10 Z',
  'M -70,-115 C -90,-70 -82,-20 -78,25 C -85,75 -40,115 8,112 C 55,118 92,78 85,28 C 95,-22 78,-78 35,-108 C 2,-128 -42,-130 -70,-115 Z',
  'M -65,-20 C -72,-55 -35,-72 8,-65 C 48,-72 78,-42 72,-2 C 80,32 48,62 8,58 C -32,66 -62,35 -65,-20 Z',
  'M -80,20 C -95,-20 -70,-70 -20,-85 C 25,-98 75,-80 90,-35 C 100,5 85,50 45,70 C 5,90 -45,80 -80,20 Z'
];
// Texture de chaque zone : vraie tuile de carte extraite des fichiers du jeu (bundle
// ui-images-menu-map-hires), recadrée/compressée dans public/img/map/. Association zone ↔
// tuile faite à l'œil (aucune carte officielle assemblée pour les extensions, voir CLAUDE.md) —
// fiable pour le jeu de base (noms de tuiles explicites), au mieux pour les extensions quand
// plusieurs tuiles partagent le même biome (ex. les 4 tuiles "desert" pour les 4 zones de Dunes).
const TILE = {
  esplanade: 'esplanade.webp', prairie: 'prairie.webp', plage: 'plage.webp', foret: 'foret.webp',
  bayou: 'bayou.webp', plateau: 'plateau.webp', hauteurs: 'hauteurs.webp', terres: 'terres.webp',
  'la-cour': 'la-cour.webp', 'les-quais': 'les-quais.webp', 'la-promenade': 'la-promenade.webp', 'le-belvedere': 'le-belvedere.webp',
  loasis: 'loasis.webp', 'le-desert': 'le-desert.webp', 'les-plaines': 'les-plaines.webp', 'les-ruines': 'les-ruines.webp',
  'la-lisiere': 'la-lisiere.webp', 'le-bosquet': 'le-bosquet.webp', 'les-pres': 'les-pres.webp', 'le-lagon': 'le-lagon.webp',
  bibliotheque: 'bibliotheque.webp', 'chutes-theiere': 'chutes-theiere.webp', 'champs-elysees': 'champs-elysees.webp', 'mont-olympe': 'mont-olympe.webp',
  'bois-sauvages': 'bois-sauvages.webp', 'ranch-florespérance': 'ranch.webp', 'voie-souhaits': 'voie-souhaits.webp',
  'alpes-enchantees': 'alpes-enchantees.webp', 'highlands-ranch': 'highlands-ranch.webp', 'ravin-ravissant': 'ravin-ravissant.webp', 'clairiere-feerique': 'clairiere-feerique.webp'
};

// Zones affichées sur la carte. Le jeu de base reprend tel quel les 8 biomes réels
// (biomes.js), affiché avec l'image COMPLÈTE de chaque tuile extraite (pas de recadrage) —
// chacune garde son propre décor (rochers, rivière, pont…) tel qu'il sort du jeu. Position de
// chaque image (`box`) retrouvée par recalage automatique (OpenCV, corrélation croisée avec
// masque alpha) contre la carte officielle (static.wikia.nocookie.net/.../Carte_DDV.png) —
// chaque tuile s'y reconnaît avec un score de confiance ≥ 0,96 au même facteur d'échelle
// (~0,39), ce qui confirme que cette image officielle est composée des mêmes tuiles ; les
// coordonnées ci-dessous sont directement celles trouvées dans l'image de référence
// (1920×1744), reprises telles quelles comme viewBox. Les extensions ont des lieux bien plus
// précis que nos biomes actuels (ex. « L'Oasis » dans Dunes scintillantes) : pas encore une
// donnée de jeu confirmée dans src/data, donc gardées ici en formes décoratives (`blob`) —
// chaque zone est juste rattachée au biome réel le plus proche pour les ressources/pêche/
// animaux, disposition plausible mais pas géographiquement garantie (aucune carte officielle
// assemblée n'existe pour les extensions, voir mémoire).
const BASE_ZONES = [
  { id: 'terres', name: 'Terres oubliées', l1: 'TERRES', l2: 'OUBLIÉES', biome: 'terres', box: { x: 0, y: 40, w: 794, h: 1003 }, cx: 397, cy: 542, caption: 'Un territoire oublié, à la lisière du mystère.',
    outline: 'M430.7,40.0 L421.8,109.8 L253.8,129.7 L276.8,208.4 L194.5,246.6 L169.2,369.0 L183.6,451.3 L131.7,490.6 L126.7,566.3 L0.0,600.2 L88.1,710.1 L159.8,739.7 L209.7,724.5 L202.3,631.0 L285.7,665.3 L232.7,820.8 L263.5,853.2 L220.2,931.5 L234.7,997.4 L385.5,1004.4 L434.6,1042.6 L467.4,1036.4 L467.0,1007.9 L754.6,1006.4 L793.6,916.7 L784.3,861.3 L767.1,861.0 L785.8,809.9 L748.0,774.0 L785.4,763.5 L736.7,744.4 L734.8,690.2 L705.1,682.0 L736.3,667.2 L723.8,622.0 L672.0,596.7 L714.5,509.3 L773.7,463.0 L759.3,273.5 L633.8,116.0 L526.2,56.8 Z' },
  { id: 'plateau', name: 'Plateau ensoleillé', l1: 'PLATEAU', l2: 'ENSOLEILLÉ', biome: 'plateau', box: { x: 118, y: 609, w: 764, h: 611 }, cx: 500, cy: 915, caption: "Un plateau baigné de soleil, idéal pour les cultures d'été.",
    outline: 'M858.2,626.1 L825.9,609.0 L797.8,641.3 L731.5,649.5 L682.4,610.9 L630.2,623.8 L633.3,643.7 L667.2,660.4 L648.5,710.3 L674.2,766.4 L637.2,856.8 L346.8,858.8 L348.4,888.0 L317.6,891.5 L270.4,854.1 L118.0,842.0 L144.1,882.9 L194.0,878.3 L176.9,921.1 L209.6,947.2 L210.4,1077.4 L185.4,1097.6 L188.6,1128.0 L260.7,1162.3 L289.9,1209.1 L315.6,1179.5 L340.6,1186.9 L351.9,1219.6 L382.3,1205.6 L380.3,1160.8 L403.3,1151.4 L410.7,1174.0 L477.8,1154.1 L544.0,1165.1 L571.7,1150.2 L626.3,1158.0 L634.5,1120.2 L740.5,1133.9 L771.3,1121.4 L786.1,1010.4 L776.4,916.8 L810.7,911.8 L803.3,840.1 L834.8,839.3 L838.3,815.1 L862.9,817.1 L881.6,780.1 L881.6,703.3 Z' },
  { id: 'bayou', name: 'Bayou de la confiance', l1: 'BAYOU DE LA', l2: 'CONFIANCE', biome: 'bayou', box: { x: 282, y: 1145, w: 508, h: 583 }, cx: 536, cy: 1437, caption: 'Eaux calmes et reflets verts, royaume des crocodiles.',
    outline: 'M379.8,1158.2 L377.8,1203.5 L342.4,1212.8 L341.2,1297.4 L325.2,1285.3 L308.1,1298.2 L340.8,1355.8 L326.0,1390.9 L335.4,1412.7 L303.8,1364.4 L284.7,1377.7 L296.4,1393.6 L282.0,1421.3 L289.0,1444.7 L341.6,1449.4 L341.6,1568.6 L311.2,1578.4 L291.7,1616.2 L319.4,1709.3 L363.4,1722.5 L375.5,1703.4 L465.9,1671.5 L467.4,1697.6 L517.7,1708.5 L543.4,1670.7 L591.3,1670.3 L585.9,1706.6 L619.0,1719.4 L645.1,1700.7 L631.4,1669.9 L691.0,1686.3 L764.3,1674.6 L777.9,1581.1 L772.9,1376.5 L789.6,1374.9 L789.6,1348.0 L759.2,1346.1 L751.0,1311.0 L732.0,1312.2 L721.8,1335.2 L711.7,1292.3 L676.2,1290.0 L697.7,1284.1 L695.3,1260.7 L627.5,1259.2 L625.6,1156.3 L460.0,1150.5 L414.5,1171.9 L409.4,1145.0 Z' },
  { id: 'esplanade', name: 'Esplanade', l1: 'ESPLANADE', l2: '', biome: 'esplanade', box: { x: 772, y: 719, w: 391, h: 402 }, cx: 968, cy: 1033, caption: 'Le cœur de la vallée, là où bat la vie du village.',
    outline: 'M803.5,837.4 L810.9,908.3 L772.0,909.5 L782.5,1001.8 L775.1,1089.8 L804.7,1094.9 L810.9,1115.9 L819.1,1089.1 L921.2,1082.8 L932.8,1109.7 L981.5,1120.6 L1001.4,1108.5 L1010.7,1084.4 L1030.6,1083.2 L1053.6,1099.2 L1110.0,1082.4 L1120.9,1115.5 L1126.0,1098.8 L1145.1,1097.6 L1157.2,1120.6 L1159.9,1033.7 L1145.1,1005.3 L1157.9,980.0 L1157.2,901.3 L1150.1,915.7 L1124.1,910.3 L1124.4,873.6 L1142.0,832.4 L1119.0,820.7 L1133.8,799.2 L1115.9,803.9 L1118.6,784.4 L1097.2,790.3 L1050.5,767.7 L1022.4,800.8 L1000.6,797.7 L980.4,772.8 L982.3,719.0 L967.5,727.2 L949.2,719.0 L950.8,776.3 L916.5,796.9 L884.2,789.5 L862.0,816.0 L838.2,814.0 L832.8,839.0 Z' },
  { id: 'prairie', name: 'Prairie tranquille', l1: 'PRAIRIE', l2: 'TRANQUILLE', biome: 'prairie', box: { x: 618, y: 1079, w: 638, h: 310 }, cx: 937, cy: 1234, caption: 'De vastes champs à perte de vue, parfaits pour les récoltes.',
    outline: 'M625.0,1123.3 L618.0,1182.9 L627.4,1260.6 L693.3,1261.0 L696.0,1284.0 L674.2,1287.9 L713.2,1296.4 L722.1,1335.7 L733.0,1315.9 L753.7,1315.1 L760.7,1347.8 L898.4,1347.8 L954.5,1388.6 L991.2,1382.8 L1030.6,1348.2 L1111.7,1341.9 L1145.2,1362.2 L1176.1,1343.9 L1178.0,1250.5 L1192.8,1224.1 L1183.9,1193.0 L1252.1,1166.1 L1216.2,1161.8 L1215.8,1151.3 L1255.6,1129.2 L1159.3,1121.0 L1150.7,1096.1 L1120.7,1092.6 L1115.2,1079.0 L986.1,1079.0 L978.7,1110.5 L947.1,1109.3 L934.7,1087.9 L940.9,1079.0 L813.8,1079.0 L807.1,1089.9 L775.6,1087.9 L772.4,1119.1 L750.6,1129.6 L712.8,1118.7 Z' },
  { id: 'hauteurs', name: 'Hauteurs glacées', l1: 'HAUTEURS', l2: 'GLACÉES', biome: 'hauteurs', box: { x: 1058, y: 114, w: 735, h: 666 }, cx: 1426, cy: 447, caption: 'Neiges éternelles et vents glacés sur les hauteurs.',
    outline: 'M1065.0,235.7 L1075.9,335.1 L1120.0,361.6 L1185.1,371.4 L1274.4,335.5 L1374.6,357.7 L1320.0,417.8 L1279.1,388.9 L1249.1,405.3 L1233.1,439.6 L1250.2,469.2 L1212.8,526.5 L1247.1,573.7 L1280.6,564.4 L1296.2,593.6 L1352.4,609.6 L1395.3,592.8 L1407.8,682.1 L1438.2,688.0 L1416.3,720.3 L1543.1,712.2 L1541.9,741.8 L1555.5,725.4 L1623.0,767.1 L1713.5,766.4 L1765.3,634.9 L1754.4,599.1 L1725.2,586.2 L1758.7,531.2 L1721.3,454.0 L1792.6,429.1 L1780.1,381.9 L1739.2,407.6 L1713.5,399.8 L1697.5,425.9 L1659.6,417.8 L1686.9,396.7 L1680.7,363.6 L1726.3,367.8 L1776.6,333.9 L1783.3,266.9 L1714.6,138.6 L1660.4,115.9 L1528.2,119.5 L1464.7,174.8 L1460.4,208.4 L1373.8,232.9 L1346.5,282.4 L1356.7,300.4 L1293.5,293.4 L1325.5,232.1 L1280.3,174.8 L1224.5,147.5 L1185.9,152.6 L1110.2,224.7 Z' },
  { id: 'foret', name: 'Forêt du courage', l1: 'FORÊT DU', l2: 'COURAGE', biome: 'foret', box: { x: 1097, y: 468, w: 538, h: 664 }, cx: 1366, cy: 800, caption: 'Une canopée dense où rôdent ratons laveurs et brochets.',
    outline: 'M1185.1,468.0 L1141.8,494.1 L1156.3,530.0 L1129.0,531.1 L1111.0,550.2 L1128.2,604.4 L1106.4,635.9 L1119.6,669.5 L1097.0,720.5 L1097.0,770.8 L1128.6,777.0 L1136.8,799.2 L1118.4,816.8 L1138.3,843.3 L1119.6,896.2 L1130.1,917.7 L1156.6,921.6 L1143.4,1005.7 L1159.0,1032.2 L1158.2,1117.6 L1228.4,1131.6 L1304.8,1120.7 L1311.0,1098.5 L1350.8,1084.1 L1391.0,1038.1 L1465.0,1020.2 L1483.3,992.9 L1567.9,988.2 L1569.9,965.2 L1634.6,918.5 L1634.6,899.4 L1589.8,848.7 L1598.4,764.5 L1576.1,733.0 L1562.9,738.4 L1543.8,712.3 L1488.0,711.5 L1485.7,724.4 L1422.9,723.2 L1417.1,703.8 L1437.3,706.5 L1440.5,687.8 L1408.1,681.5 L1399.1,592.7 L1350.4,607.1 L1343.0,591.1 L1294.3,591.1 L1287.2,562.3 L1261.1,561.9 L1254.5,575.5 L1244.0,549.4 L1181.6,556.8 L1177.3,544.8 L1207.7,519.4 L1206.2,478.9 Z' },
  { id: 'plage', name: 'Plage enchantée', l1: 'PLAGE', l2: 'ENCHANTÉE', biome: 'plage', box: { x: 765, y: 940, w: 964, h: 739 }, cx: 1247, cy: 1310, caption: 'Sable doré et vagues douces, avec quelques îlots au large.',
    outline: 'M1675.6,950.9 L1588.2,944.7 L1550.8,989.9 L1509.8,991.1 L1496.2,970.0 L1309.0,1095.5 L1303.5,1119.7 L1222.4,1137.2 L1214.6,1161.0 L1252.5,1163.7 L1189.3,1179.3 L1192.0,1228.4 L1171.0,1247.5 L1182.3,1322.0 L1160.8,1350.8 L1070.0,1327.0 L956.1,1378.5 L899.1,1344.2 L790.7,1341.5 L772.0,1376.9 L774.7,1586.6 L890.2,1599.5 L1100.0,1568.7 L1276.6,1598.3 L1370.6,1647.8 L1545.7,1664.2 L1651.4,1625.2 L1718.5,1514.9 L1719.6,1443.2 L1638.9,1260.4 L1552.3,1225.7 L1548.8,1196.5 L1628.4,1108.0 Z' }
];
const RIFT_ZONES = [
  { id: 'la-cour', name: 'La Cour', l1: 'LA COUR', l2: '', biome: 'port', cx: 660, cy: 165, blob: 3, scale: 1.3, rot: 0, caption: "Une cour de pierre ancienne, porte d'entrée du port." },
  { id: 'les-quais', name: 'Les Quais', l1: 'LES QUAIS', l2: '', biome: 'port', cx: 800, cy: 250, blob: 0, scale: 1.45, rot: 8, caption: "Pontons de bois où accostent les navires d'autrefois." },
  { id: 'la-promenade', name: 'La Promenade', l1: 'LA', l2: 'PROMENADE', biome: 'port', cx: 810, cy: 390, blob: 1, scale: 1.45, rot: -5, caption: 'Une allée dallée longeant la mer scintillante.' },
  { id: 'le-belvedere', name: 'Le Belvédère', l1: 'LE', l2: 'BELVÉDÈRE', biome: 'port', cx: 670, cy: 470, blob: 3, scale: 1.3, rot: 0, caption: 'Un promontoire offrant une vue sur tout le rivage.' },
  { id: 'loasis', name: "L'Oasis", l1: "L'OASIS", l2: '', biome: 'dunes', cx: 400, cy: 350, blob: 0, scale: 1.25, rot: 0, caption: "Une étendue d'eau fraîche au cœur des dunes." },
  { id: 'le-desert', name: 'Le Désert', l1: 'LE DÉSERT', l2: '', biome: 'dunes', cx: 260, cy: 210, blob: 1, scale: 1.7, rot: 0, caption: 'Des dunes dorées à perte de vue.' },
  { id: 'les-plaines', name: 'Les Plaines', l1: 'LES PLAINES', l2: '', biome: 'dunes', cx: 260, cy: 90, blob: 0, scale: 1.4, rot: -6, caption: 'Un désert de sable fin balayé par le vent.' },
  { id: 'les-ruines', name: 'Les Ruines', l1: 'LES RUINES', l2: '', biome: 'dunes', cx: 150, cy: 330, blob: 4, scale: 1.3, rot: 5, caption: "Vestiges d'une civilisation disparue, à moitié ensevelis." },
  { id: 'la-lisiere', name: 'La Lisière', l1: 'LA LISIÈRE', l2: '', biome: 'meandres', cx: 380, cy: 430, blob: 2, scale: 1.4, rot: 0, caption: 'La frontière entre sable et végétation sauvage.' },
  { id: 'le-bosquet', name: 'Le Bosquet', l1: 'LE BOSQUET', l2: '', biome: 'meandres', cx: 300, cy: 640, blob: 0, scale: 1.3, rot: 0, caption: 'Un bosquet touffu au cœur des méandres.' },
  { id: 'les-pres', name: 'Les Prés', l1: 'LES PRÉS', l2: '', biome: 'meandres', cx: 510, cy: 660, blob: 1, scale: 1.35, rot: 0, caption: 'Des prairies sauvages nichées entre les méandres.' },
  { id: 'le-lagon', name: 'Le Lagon', l1: 'LE LAGON', l2: '', biome: 'meandres', cx: 640, cy: 610, blob: 3, scale: 1.25, rot: 0, caption: 'Une eau calme et turquoise, blottie dans la jungle.' }
];
const VALE_ZONES = [
  { id: 'bibliotheque', name: 'Bibliothèque du savoir', l1: 'BIBLIOTHÈQUE', l2: 'DU SAVOIR', biome: 'reliure', cx: 480, cy: 230, blob: 2, scale: 1.4, rot: 0, caption: 'Un sanctuaire de récits et de pages anciennes.' },
  { id: 'chutes-theiere', name: 'Chutes de la Théière', l1: 'CHUTES DE LA', l2: 'THÉIÈRE', biome: 'reliure', cx: 340, cy: 410, blob: 0, scale: 1.3, rot: 0, caption: "Une cascade fantaisiste tout droit sortie d'un conte." },
  { id: 'champs-elysees', name: 'Champs Élysées', l1: 'CHAMPS', l2: 'ÉLYSÉES', biome: 'mythopie', cx: 660, cy: 440, blob: 1, scale: 1.5, rot: 0, caption: 'Des champs dorés inspirés des mythes grecs.' },
  { id: 'mont-olympe', name: 'Mont Olympe', l1: 'MONT', l2: 'OLYMPE', biome: 'mythopie', cx: 740, cy: 240, blob: 2, scale: 1.55, rot: -4, caption: 'Le sommet légendaire où résident les dieux.' },
  { id: 'bois-sauvages', name: 'Bois sauvages', l1: 'BOIS', l2: 'SAUVAGES', biome: 'comte', cx: 290, cy: 590, blob: 4, scale: 1.45, rot: 0, caption: "Une forêt touffue à l'orée du comté des contes." }
];
const RANCH_ZONES = [
  { id: 'ranch-florespérance', name: 'Ranch de Florespérance', l1: 'RANCH DE', l2: 'FLORESPÉRANCE', biome: 'ranch', cx: 460, cy: 480, blob: 1, scale: 1.55, rot: 0, caption: 'Le cœur fleuri du ranch, entre granges et vergers.' },
  { id: 'voie-souhaits', name: 'Voie des souhaits', l1: 'VOIE DES', l2: 'SOUHAITS', biome: 'ranch', cx: 480, cy: 310, blob: 3, scale: 1.3, rot: 0, caption: 'Un chemin serpentant vers les hauteurs du ranch.' },
  { id: 'alpes-enchantees', name: 'Alpes enchantées', l1: 'ALPES', l2: 'ENCHANTÉES', biome: 'alpes', cx: 690, cy: 180, blob: 2, scale: 1.55, rot: 0, caption: 'Des sommets enneigés et enchantés qui dominent le ranch.' },
  { id: 'highlands-ranch', name: 'Highlands du Ranch', l1: 'HIGHLANDS', l2: 'DU RANCH', biome: 'alpes', cx: 760, cy: 350, blob: 0, scale: 1.35, rot: 6, caption: 'De hauts plateaux balayés par le vent, au-dessus du ranch.' },
  { id: 'ravin-ravissant', name: 'Ravin ravissant', l1: 'RAVIN', l2: 'RAVISSANT', biome: 'gulch', cx: 260, cy: 560, blob: 4, scale: 1.4, rot: 0, caption: 'Un canyon escarpé aux couleurs flamboyantes.' },
  { id: 'clairiere-feerique', name: 'Clairière féerique', l1: 'CLAIRIÈRE', l2: 'FÉERIQUE', biome: 'pixie', cx: 320, cy: 270, blob: 0, scale: 1.3, rot: -5, caption: 'Une clairière secrète où volent les lucioles et les fées.' }
];

const MAPS = [
  { id: 'base', label: 'Jeu de base', ext: null, zones: BASE_ZONES, viewBox: '0 0 1920 1744', river: null },
  { id: 'rift', label: 'A Rift in Time', ext: 'rift', zones: RIFT_ZONES, viewBox: '0 0 1000 800', river: 'M 380,250 C 420,320 380,380 420,450 C 460,520 520,560 560,600 C 600,650 630,660 650,700' },
  { id: 'vale', label: 'The Storybook Vale', ext: 'vale', zones: VALE_ZONES, viewBox: '0 0 1000 800', river: 'M 330,350 C 300,420 260,480 270,560 C 275,620 300,660 320,700' },
  { id: 'ranch', label: 'Wishblossom Ranch', ext: 'ranch', zones: RANCH_ZONES, viewBox: '0 0 1000 800', river: 'M 680,220 C 600,280 520,340 470,420 C 420,480 340,500 280,540' }
];

const TYPE_LABEL = { culture: 'Culture', cueillette: 'Cueillette', gemme: 'Gemme' };

// Ressources/pêche/animaux réels du biome associé à une zone — jamais dupliqués, juste
// filtrés depuis resources.js/critters.js (même source que Resources.jsx/Animals.jsx).
// Chaque lien pré-remplit la recherche de l'écran visé (ResourceScreen lit déjà ?q=).
function zoneResources(biomeId) {
  const out = [];
  for (const c of CROPS) if (c.biomes.includes(biomeId)) out.push({ name: c.name, type: 'culture', href: '#/potager?q=' + encodeURIComponent(c.name) });
  for (const f of FORAGE) if (f.biomes.includes(biomeId)) out.push({ name: f.name, type: 'cueillette', href: '#/cueillette?q=' + encodeURIComponent(f.name) });
  for (const g of GEMS) if (g.biomes.includes(biomeId)) out.push({ name: g.name, type: 'gemme', href: '#/mines?q=' + encodeURIComponent(g.name) });
  return out;
}
function zoneFish(biomeId) {
  return FISH.filter((f) => f.biomes.includes(biomeId)).map((f) => ({ name: f.name, href: '#/peche?q=' + encodeURIComponent(f.name) }));
}
// Animals.jsx recherche sur le nom de la VARIANTE (ex. "Singe doré"), pas sur le nom de
// l'espèce au pluriel ("Singes") : ça ne matcherait aucune ligne. Le nom du biome, lui, est
// inclus dans la recherche de chaque variante (BIOME[...].name) et désigne sans ambiguïté
// tous les animaux de cette zone.
function zoneCritters(biomeId) {
  const bio = BIOME[biomeId];
  return SPECIES.filter((s) => s.biome === biomeId).map((s) => ({ name: s.name, href: '#/animaux?q=' + encodeURIComponent(bio?.name || s.name) }));
}

export function Carte() {
  const { state } = useStore();
  const availableMaps = MAPS.filter((m) => !m.ext || state.extensions[m.ext]);
  const [mapId, setMapId] = useState('base');
  const [zoneId, setZoneId] = useState(null);
  const map = availableMaps.find((m) => m.id === mapId) || availableMaps[0];

  function pickMap(id) { setMapId(id); setZoneId(null); }

  const selected = map.zones.find((z) => z.id === zoneId) || null;
  const bio = selected ? BIOME[selected.biome] : null;
  const resources = selected ? zoneResources(selected.biome) : [];
  const fish = selected ? zoneFish(selected.biome) : [];
  const critters = selected ? zoneCritters(selected.biome) : [];

  return (
    <div class="page wide">
      <h1>Carte de la vallée</h1>
      <p class="small muted" style={{ margin: 0 }}>Clique une zone pour voir ses ressources, sa pêche et ses animaux.</p>

      {availableMaps.length > 1 && (
        <Seg label="Carte affichée" options={availableMaps.map((m) => [m.id, m.label])} value={map.id} onChange={pickMap} />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: '999 1 620px', minWidth: 0, background: 'var(--surface)', borderRadius: '24px', padding: '16px' }}>
          <svg viewBox={map.viewBox} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '18px' }} role="img" aria-label={'Carte — ' + map.label}>
            <defs>
              <filter id="map-sketchy" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="map-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <radialGradient id="map-ocean" cx="50%" cy="40%" r="78%">
                <stop offset="0%" stop-color="var(--surface-2)" />
                <stop offset="60%" stop-color="var(--surface)" />
                <stop offset="100%" stop-color="var(--bg)" />
              </radialGradient>
            </defs>

            <rect x="-1000" y="-1000" width="4000" height="4000" fill="url(#map-ocean)" />
            {map.river && (
              <>
                <path d={map.river} fill="none" stroke="var(--teal)" stroke-width="22" stroke-linecap="round" opacity="0.35" />
                <path d={map.river} fill="none" stroke="var(--text)" stroke-width="7" stroke-linecap="round" opacity="0.3" />
              </>
            )}

            {map.zones.map((zone) => {
              const isSel = zone.id === zoneId;
              const tile = TILE[zone.id];
              const fillColor = BIOME[zone.biome]?.color || '#999';

              // Jeu de base : l'image COMPLÈTE de la tuile (pas de recadrage), à sa taille
              // réelle (proportions natives) — juste positionnée pour s'approcher au mieux
              // de la vraie carte, sans contour « dessiné main ». Zone cliquable = vrai
              // contour de la tuile (pas son rectangle) : sur les images qui se chevauchent,
              // le clic cible ainsi ce qui est réellement visible à cet endroit plutôt que
              // systématiquement la tuile dont le rectangle d'origine passe par-dessus.
              if (zone.box) {
                const { x, y, w, h } = zone.box;
                return (
                  <g key={zone.id} onClick={() => setZoneId(zone.id)} style={{ cursor: 'pointer' }}>
                    {zone.outline
                      ? <path d={zone.outline} fill="transparent" />
                      : <rect x={x} y={y} width={w} height={h} fill="transparent" />}
                    {tile && <image href={`img/map/${tile}`} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none' }} />}
                    {isSel && zone.outline && <path d={zone.outline} fill="none" stroke="#FFE8A3" stroke-width="7" stroke-linejoin="round" filter="url(#map-glow)" opacity="0.9" />}
                    {isSel && zone.outline && <path d={zone.outline} fill="none" stroke="#FFE8A3" stroke-width="4" stroke-linejoin="round" />}
                  </g>
                );
              }

              return (
                <g key={zone.id} transform={`translate(${zone.cx},${zone.cy}) rotate(${zone.rot}) scale(${zone.scale})`} onClick={() => setZoneId(zone.id)} style={{ cursor: 'pointer' }}>
                  {isSel && <path d={BLOBS[zone.blob]} fill="var(--accent)" opacity="0.5" filter="url(#map-glow)" transform="scale(1.22)" />}
                  <path d={BLOBS[zone.blob]} fill={fillColor} fill-opacity="0.88" filter="url(#map-sketchy)" />
                  {tile && (
                    <g clip-path={`url(#clip-${zone.id})`}>
                      <clipPath id={`clip-${zone.id}`}><path d={BLOBS[zone.blob]} /></clipPath>
                      <image href={`img/map/${tile}`} x="-140" y="-140" width="280" height="280" preserveAspectRatio="xMidYMid slice" />
                      <path d={BLOBS[zone.blob]} fill={fillColor} opacity="0.3" />
                    </g>
                  )}
                  <path d={BLOBS[zone.blob]} fill="none" stroke={isSel ? '#FFE8A3' : 'var(--bg)'} stroke-width={isSel ? 9 : 7} stroke-dasharray="2 11" stroke-linecap="round" filter="url(#map-sketchy)" />
                </g>
              );
            })}

            {map.zones.map((zone) => {
              const isSel = zone.id === zoneId;
              const y1 = zone.l2 ? -6 : 7;
              const y2 = 17;
              return (
                <g key={zone.id} transform={`translate(${zone.cx},${zone.cy})`} onClick={() => setZoneId(zone.id)} role="button" tabindex="0" aria-label={zone.name} style={{ cursor: 'pointer' }}>
                  <text x="0" y={y1} text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="21" fill={isSel ? '#FFE8A3' : 'var(--text)'} stroke="var(--bg)" stroke-width="4" stroke-linejoin="round" paint-order="stroke" style={{ letterSpacing: '1px' }}>{zone.l1}</text>
                  {zone.l2 && <text x="0" y={y2} text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="21" fill={isSel ? '#FFE8A3' : 'var(--text)'} stroke="var(--bg)" stroke-width="4" stroke-linejoin="round" paint-order="stroke" style={{ letterSpacing: '1px' }}>{zone.l2}</text>}
                </g>
              );
            })}
          </svg>
        </div>

        <div class="card" style={{ flex: '1 1 320px', minWidth: '300px', maxWidth: '420px', padding: 0, overflow: 'hidden', alignSelf: 'stretch' }}>
          {selected ? (
            <>
              <div style={{ padding: '18px 20px', background: bio?.color, position: 'relative' }}>
                <button type="button" onClick={() => setZoneId(null)} aria-label="Fermer le panneau"
                  style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '999px', border: 'none', background: 'rgba(20,18,58,0.22)', color: '#14123A', fontSize: '15px', fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>×</button>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: '#14123A', paddingRight: '30px' }}>{selected.name}</div>
                <ExtTag ext={map.ext} />
              </div>
              <div style={{ padding: '4px 18px 20px', maxHeight: '560px', overflowY: 'auto' }}>
                <div class="small muted" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 6px' }}>Ressources</div>
                {resources.length ? (
                  <div class="list-rows">
                    {resources.map((r) => (
                      <a key={r.href} href={r.href} class="list-row">
                        <span style={{ flex: 1, fontWeight: 700 }}>{r.name}</span>
                        <span class="tag">{TYPE_LABEL[r.type]}</span>
                      </a>
                    ))}
                  </div>
                ) : <div class="small muted">Pas encore de ressource recensée ici.</div>}

                <div class="small muted" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 6px' }}>Pêche</div>
                {fish.length ? (
                  <div class="list-rows">
                    {fish.map((f) => <a key={f.href} href={f.href} class="list-row"><span style={{ flex: 1, fontWeight: 700 }}>{f.name}</span></a>)}
                  </div>
                ) : <div class="small muted">Aucun poisson recensé dans cette zone.</div>}

                <div class="small muted" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 6px' }}>Animaux</div>
                {critters.length ? (
                  <div class="list-rows">
                    {critters.map((c) => <a key={c.href} href={c.href} class="list-row"><span style={{ flex: 1, fontWeight: 700 }}>{c.name}</span></a>)}
                  </div>
                ) : <div class="small muted">Pas encore d'animal recensé ici.</div>}

                <div class="small muted" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 6px' }}>Autres infos</div>
                <div class="small" style={{ lineHeight: 1.5, padding: '2px 4px 4px' }}>{selected.caption}</div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '50px 24px', minHeight: '400px' }}>
              <Icon name="search" size={28} style={{ color: 'var(--accent)', marginBottom: '14px' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>Choisis une zone</div>
              <div class="small muted" style={{ marginTop: '8px', maxWidth: '240px', lineHeight: 1.5 }}>Clique sur une zone de la carte pour afficher ses ressources, sa pêche, ses animaux et plus.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
