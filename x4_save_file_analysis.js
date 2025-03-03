const sortedSectorData = 
[
 ["Great Reef",-9,-3,"cluster_603","sector001", 1],
 ["Barren Shores",-8,-3,"cluster_602","sector001", 1],
 ["Watchful Gaze",-7,-4,"cluster_601","sector001", 1],
 ["Ocean of Fantasy",-9,-2,"cluster_604","sector001", 1],
 ["Sanctuary of Darkness",-10,-4,"cluster_605","sector001", 1],
 ["Reflected Stars",-12,-5,"cluster_606","sector002", 5],
 ["Kingdom End 1",-12,-5,"cluster_606","sector001", 7],
 ["Towering Wave",-12,-5,"cluster_606","sector003", 3],
 ["Rolk's Demise",-13,-5,"cluster_607","sector001", 1],
 ["Menelaus' Oasis",-13,-4,"cluster_609","sector001", 1],
 ["Atreus's Clouds",-12,-4,"cluster_608","sector001", 1],
 ["Mercury",-12,-2,"cluster_106","sector001", 1],
 ["Venus",-12,-1,"cluster_102","sector001", 1],
 ["Earth",-11,-2,"cluster_104","sector001", 7],
 ["Moon",-11,-2,"cluster_104","sector002", 4],
 ["Mars",-11,-1,"cluster_101","sector001", 1],
 ["Asteroid Belt",-10,0,"cluster_100","sector001", 1],
 ["Adventure's Promise",-14,0,"cluster_721","sector001", 1],
 ["Jupiter",-11,1,"cluster_107","sector001", 1],
 ["Saturn 1",-12,2,"cluster_108","sector001", 3],
 ["Saturn 2",-12,2,"cluster_108","sector003", 7],
 ["Titan",-12,2,"cluster_108","sector002", 5],
 ["Uranus",-13,2,"cluster_109","sector001", 1],
 ["Neptune",-12,3,"cluster_110","sector001", 1],
 ["Pluto",-13,3,"cluster_111","sector001", 1],
 ["Oort Cloud",-14,4,"cluster_116","sector001", 1],
 ["Circle of Deceit",-10,5,"cluster_724","sector001", 1],
 ["Brennan's Triumph",-9,3,"cluster_115","sector001", 1],
 ["Gian Prophecy",-8,4,"cluster_114","sector001", 1],
 ["Segaris",-7,3,"cluster_113","sector001", 1],
 ["Sanctum Verge",-5,4,"cluster_722","sector001", 1],
 ["Mists of Artemis",-4,4,"cluster_715","sector001", 1],
 ["Atiya's Misfortune I",-4,3,"cluster_26","sector001", 7],
 ["Atiya's Misfortune III",-4,3,"cluster_26","sector002", 4],
 ["Faulty Logic I", -2, 3,"cluster_25","sector001", 2],
 ["Faulty Logic VII", -2, 3,"cluster_25","sector002", 5],
 ["Wretched Skies V Family Phi",-5,-5,"cluster_403","sector001", 1],
 ["Wretched Skies X",-6,-5,"cluster_422","sector001", 1],
 ["Litany of Fury XII",-8,-5,"cluster_423","sector002", 2],
 ["Litany of Fury IX",-8,-5,"cluster_423","sector001", 5],
 ["Wretched Skies IV Family Valka",-4,-5,"cluster_400","sector001", 1],
 ["Family Zhin",-2,-5,"cluster_401","sector001", 1],
 ["Family Kritt",-2,-6,"cluster_402","sector001", 1],
 ["Tharka's Cascade XV",-2,-4,"cluster_32","sector001", 4],
 ["Tharka's Cascade XVII",-2,-4,"cluster_32","sector002", 7],
 ["Matrix #79B",-3,-5,"cluster_33","sector001", 1],
 ["Argon Prime",-3,-2,"cluster_14","sector001", 1],
 ["Nopileos' Fortune II",2,1,"cluster_04","sector001", 7],
 ["Nopileos' Fortune VI",2,1,"cluster_04","sector002", 4],
 ["Grand Exchange I",0,0,"cluster_01","sector001", 4],
 ["Grand Exchange III",0,0,"cluster_01","sector002", 6],
 ["Grand Exchange IV",0,0,"cluster_01","sector003", 2],
 ["Leap of Faith",1,-1,"cluster_504","sector001", 1],
 ["Eighteen Billion",1,-2,"cluster_02","sector001", 1],
 ["Silent Witness I",0,-3,"cluster_08","sector001", 1],
 ["President\'s End",1,-3,"cluster_704","sector001", 1],
 ["Guiding Star VII",5,-6,"cluster_416","sector002", 7],
 ["Guiding Star V",5,-6,"cluster_416","sector001", 4],
 ["Eleventh Hour",5,-8,"cluster_417","sector001", 1],
 ["Matrix #451",7,-3,"cluster_16","sector001", 1],
 ["Frontier Edge",-5,0,"cluster_49","sector001", 1],
 ["Black Hole Sun IV",-1,0,"cluster_06","sector001", 7],
 ["Black Hole Sun V",-1,0,"cluster_06","sector002", 4],
 ["Savage Spur I",-5,-3,"cluster_112","sector001", 2],
 ["Savage Spur II",-5,-3,"cluster_112","sector002", 5],
 ["Getsu Fune",-6,-2,"cluster_48","sector001", 1],
 ["Nopileos' Memorial",-5,-2,"cluster_705","sector001", 1],
 ["Hatikvah's Faith",-4,-1,"cluster_706","sector001", 1],
 ["The Reach",-4,-2,"cluster_07","sector001", 1],
 ["Heretic's End",-5,-4,"cluster_31","sector001", 1],
 ["Antigone Memorial",-7,-1,"cluster_28","sector001", 1],
 ["The Void",-6,-1,"cluster_27","sector001", 1],
 ["Ore Belt",-6,1,"cluster_720","sector001", 1],
 ["Third Redemption",-6,0,"cluster_730","sector001", 1],
 ["Frontier Edge",-5,0,"cluster_49","sector001", 1],
 ["Silent Witness XII",0,-4,"cluster_45","sector001", 1],
 ["Silent Witness XI",1,-4,"cluster_44","sector001", 1],
 ["Rhy's Defiance",-2,-7,"cluster_414","sector001", 1],
 ["Matrix #598",-2,-7,"cluster_415","sector001", 1],
 ["Matrix #101",-1,-4,"cluster_708","sector001", 1],
 ["Morning Star IV",-3,-4,"cluster_46","sector001", 1],
 ["Morning Star III",-3,-3,"cluster_30","sector001", 1],
 ["Hatikvah's Choice I",-2,-2,"cluster_29","sector001", 5],
 ["Hatikvah's Choice III",-2,-2,"cluster_29","sector002", 2],
 ["Windfall I Union Summit",0,-2,"cluster_501","sector001", 1],
 ["Windfall III The Hoard",-1,-2,"cluster_502","sector001", 1],
 ["Windfall IV Aurora's Dream",-1,-1,"cluster_503","sector001", 1],
 ["Avarice I",0,-1,"cluster_500","sector001", 2],
 ["Avarice V Dead End",0,-1,"cluster_500","sector002", 4],
 ["Avarice IV",0,-1,"cluster_500","sector003", 6],
 ["Second Contact II Flash Point",-2,0,"cluster_13","sector001", 1],
 ["Second Contact VII",-3,0,"cluster_40","sector001", 1],
 ["Second Contact XI",-3,-1,"cluster_41","sector001", 1],
 ["Path to Profit",0,1,"cluster_05","sector001", 1],
 ["True Sight",-2,2,"cluster_12","sector001", 1],
 ["Holy Vision",-1,2,"cluster_24","sector001", 1],
 ["Cardinal's Redress",-1,3,"cluster_36","sector001", 1],
 ["Pontifex's Claim",0,3,"cluster_11","sector001", 1],
 ["Lasting Vengeance",0,4,"cluster_35","sector001", 1],
 ["Freedom's Reach",-1,4,"cluster_714","sector001", 1],
 ["Tempting Fumes",0,6,"cluster_723","sector001", 1],
 ["Cardinal's Domain",3,4,"cluster_709","sector001", 1],
 ["Sacred Relic",3,3,"cluster_23","sector001", 1],
 ["Pious Mists XI",2,3,"cluster_38","sector001", 1],
 ["Pious Mists IV",3,2,"cluster_37","sector001", 1],
 ["Pious Mists II",2,2,"cluster_22","sector001", 1],
 ["Moo Kye's Revenge",5,3,"cluster_710","sector001", 1],
 ["Mi Ton's Refuge",5,2,"cluster_711","sector001", 1],
 ["Loomanckstrat's Legacy",4,2,"cluster_712","sector001", 1],
 ["Scale Plate Green I",6,2,"cluster_21","sector001", 4],
 ["Scale Plate Green VII",6,2,"cluster_21","sector002", 7],
 ["Turquoise Sea IX",7,1,"cluster_50","sector001", 7],
 ["Turquoise Sea X",7,1,"cluster_50","sector002", 4],
 ["Company Regard",6,1,"cluster_20","sector001", 1],
 ["Unholy Retribution",4,1,"cluster_10","sector001", 1],
 ["CEO's Doubt",3,0,"cluster_713","sector001", 1],
 ["Memory of Profit X",2,0,"cluster_39","sector001", 1],
 ["Memory of Profit IX",2,-1,"cluster_03","sector001", 1],
 ["Trinity Sanctum VII",3,-1,"cluster_47","sector001", 1],
 ["Trinity Sanctum III",4,0,"cluster_18","sector001", 1],
 ["Hewa's Twin I",5,0,"cluster_19","sector001", 5],
 ["Hewa's Twin II",5,0,"cluster_19","sector002", 2],
 ["Hewa's Twin III",6,0,"cluster_42","sector001", 7],
 ["Hewa's Twin IV The Core",6,0,"cluster_42","sector002", 4],
 ["Hewa's Twin V",6,-1,"cluster_43","sector001", 1],
 ["Fires of Defeat",8,-4,"cluster_421","sector001", 1],
 ["Family Tkr",8,-3,"cluster_407","sector001", 1],
 ["Tharka's Ravine XXIV",9,-4,"cluster_409","sector001", 1],
 ["Tharka's Ravine XVI",10,-4,"cluster_410","sector001", 1],
 ["Tharka's Ravine VIII",11,-4,"cluster_412","sector001", 1],
 ["Tharka's Ravine IV Tharka's Fall",12,-4,"cluster_413","sector001", 1],
 ["Thuruk's Demise III",8,-2,"cluster_408","sector001", 4],
 ["Thuruk's Demise II First Impact",8,-2,"cluster_408","sector002", 7],
 ["Ianamus Zura VII",7,-2,"cluster_15","sector001", 2],
 ["Ianamus Zura IV",7,-2,"cluster_15","sector002", 5],
 ["Heart Of Acrimony II",10,-5,"cluster_411","sector001", 1],
 ["Heart of Acrimony I The Boneyard",9,-6,"cluster_425","sector001", 1],
 ["Mitsuno's Revelation",8,-1,"cluster_701","sector001", 1],
 ["Mitsuno's Defiance",9,-1,"cluster_702","sector001", 1],
 ["Mitsuno's Sacrifice",9,-2,"cluster_703","sector001", 1],
 ["Matrix #9",6,-3,"cluster_17","sector001", 1],
 ["Bright Promis",4,-2,"cluster_09","sector001", 1],
 ["Profit Center Alpha",3,-3,"cluster_34","sector001", 1],
 ["Two Grand",4,-4,"cluster_420","sector001", 1],
 ["Open Market",3,-5,"cluster_419","sector001", 1],
 ["Family Nhuut",2,-5,"cluster_418","sector001", 1],
 ["Zyarth's Dominion I",2,-6,"cluster_404","sector001", 1],
 ["Zyarth's Dominion IV",3,-6,"cluster_405","sector001", 1],
 ["Zyarth's Dominion X",3,-7,"cluster_406","sector001", 1],
 ["Emperor's Pride IV",-9,-6,"cluster_424","sector001", 2],
 ["Emperor's Pride VI",-9,-6,"cluster_424","sector002", 5],
]

const factions = [
  ["khaak", "#c90000"],
  ["court", "#5b5b5b"],
  ["civilian", "#5b5b5b"],
  ["criminal", "#c90000"],
  ["argon", "#0079a5"],
  ["visitor", "#5b5b5b"],
  ["scavenger", "#005986"],
  ["antigone", "#00A6ff"],
  ["fallensplit", "#c530c5"],
  ["pioneers", "#00c1d5"],
  ["freesplit", "#d58100"],
  ["holyorderfanatic", "#ffbaff"],
  ["player", "rgb(17, 240, 51)"],
  ["smuggler", "#c90000"],
  ["split", "#d58100"],
  ["alliance", "#c530c5"],
  ["holyorder", "#ffbaff"],
  ["scaleplate", "#c90000"],
  ["xenon", "#c90000"],
  ["ministry", "#c5c500"],
  ["loanshark", "#b5a750"],
  ["boron", "#4cc6ff"],
  ["trinity", "#c530c5"],
  ["ownerless", "#5b5b5b"],
  ["paranid", "#c530c5"],
  ["yaki", "#c90000"],
  ["buccaneers", "#c90000"],
  ["terran", "#aad8ff"],
  ["teladi", "#c5c500"],
  ["hatikvah", "#50fFff"],
]

const factionsIndex = {}
factions.forEach(f => factionsIndex[f[0]] = f)

const sectorMacroIndex = {}
sortedSectorData.forEach(s => sectorMacroIndex[`${s[3]}_${s[4]}`] = s)

const clusterMetaData = {}
sortedSectorData.forEach(s => clusterMetaData[s[3]] = [s[2], s[1]])

const zonePositionIndex = {}
const gatePositionIndex = {}

const componentTypes = [
  { type: "station", color: `rgb(21,0,255)` },
  { type: "datavault", color: `rgb(226, 4, 255)` },
  { type: "gate", color: `rgb(255, 166, 0)` },
  { type: "highwayentrygate", color: `rgb(4, 238, 255)` },
  { type: "highwayexitgate", color: `rgb(169, 240, 245)` },
  { type: "ship_xs", color: `rgb(251, 255, 0)` },
  { type: "ship_s", color: `rgb(251, 255, 0)` },
  { type: "ship_m", color: `rgb(251, 255, 0)` },
  { type: "ship_l", color: `rgb(251, 255, 0)` },
  { type: "ship_xl", color: `rgb(251, 255, 0)` },
]

const componentColorIndex = {}
componentTypes.forEach(c => componentColorIndex[c.type] = c.color)

const zoneFilter = [
  "zone001_cluster_01_sector001_macro",
  "zone002_cluster_01_sector001_macro",
  "zone003_cluster_01_sector001_macro",
  "zone004_cluster_01_sector001_macro",
  "zone005_cluster_01_sector01_macro",
]

const stationFilter = [
  "QFC-357", 
  "HOB-359",
  "IZH-824",
  "OGT-108",
  "BRO-048",
  "ILF-184",
  "OTR-418",
  "VUX-649",
  "GGG-799",
  "ULR-649",
  "CTJ-278",
  "KQY-585",
  "MGT-426",
  "GGZ-221",
  "TRH-952",
  "BPN-720",
  "NEC-953",
  "HMN-539",
]

function initSectorData(document) {
  try {
    let sectoriterator = document.evaluate("/macros/macro/connections/connection[@ref='zones']", document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)
    var thissectorNode = sectoriterator.iterateNext();
    while (thissectorNode) {
      let zoneMacroNode = document.evaluate(
        `macro`, 
        thissectorNode, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      )?.singleNodeValue

      let zonePosNode = document.evaluate(
        `offset/position`, 
        thissectorNode, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      )?.singleNodeValue

      if (zoneMacroNode && zonePosNode) {
        let macro = zoneMacroNode.getAttribute("ref").toLowerCase()
        
        let x = parseInt(zonePosNode.getAttribute("x") || "0")
        let y = parseInt(zonePosNode.getAttribute("y") || "0")
        let z = parseInt(zonePosNode.getAttribute("z") || "0")

        zonePositionIndex[macro] = { x: x, y: y, z: z }
      }

      thissectorNode = sectoriterator.iterateNext();

    }
  }
  catch (e) {
    console.log(e)
    dump( 'Error: Sectors document tree modified during iteration ' + e );
  }
}


function initZoneData(document) {
  try {
    let gateiterator = document.evaluate("/macros/macro/connections/connection[@ref='gates']", document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)
    var gateNode = gateiterator.iterateNext();
    while (gateNode) {
      
      let gateName = gateNode.getAttribute("name")

      let gatePosNode = document.evaluate(
        `offset/position`, 
        gateNode, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      )?.singleNodeValue

      if (gateName && gatePosNode) {
        let name = gateName.toLowerCase()
        
        let x = parseInt(gatePosNode.getAttribute("x") || "0")
        let y = parseInt(gatePosNode.getAttribute("y") || "0")
        let z = parseInt(gatePosNode.getAttribute("z") || "0")

        gatePositionIndex[name] = { x: x, y: y, z: z }
      }

      gateNode = gateiterator.iterateNext();

    }
  }
  catch (e) {
    console.log(e)
    dump( 'Error: Sectors document tree modified during iteration ' + e );
  }
}


function buildSectorData(document) {
    let sectors = [];

    try {
      let sectoriterator = document.evaluate("/savegame/universe/component[@class='galaxy']/connections//component[@class='sector']", document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)
      var thissectorNode = sectoriterator.iterateNext();
      while (thissectorNode) {
        let macro = thissectorNode.getAttribute("macro");
        let sector_key = macro.substring(0, macro.length - "_macro".length)

        if (!sectorMacroIndex[sector_key]) {
          thissectorNode = sectoriterator.iterateNext();
          continue;
        }

        let factionKey = thissectorNode.getAttribute("owner")
        let faction = factionsIndex[factionKey]

        let sector = { 
          sectorid: thissectorNode.getAttribute("id"),
          macro: macro, 
          code: thissectorNode.getAttribute("code"),
          owner: { color: faction ? faction[1] : "#5b5b5b", key: factionKey },
          node: thissectorNode,
        }
        sector.name = sectorMacroIndex[sector_key][0];
        sector.plot = [
          sectorMacroIndex[sector_key][1], 
          sectorMacroIndex[sector_key][2], 
          sectorMacroIndex[sector_key][5]
        ];

        sector.displayName = "sector "+sector.name+"(" + thissectorNode.getAttributeNode("code").value + ")", 
        sector.components = []
        sector.components = appendSectorComponentData(document, thissectorNode, sector.macro)
        sector.gates = []
        
        sectors.push(sector);
        thissectorNode = sectoriterator.iterateNext();

      }
    }
    catch (e) {
      console.log(e)
      dump( 'Error: Document tree modified during iteration ' + e );
    }
    return sectors;
  }

  function appendSectorComponentData(document, sectorNode) {
    let components = []
    
    let zoneItterator = document.evaluate(
      "connections/connection/component[@class='zone']", 
      sectorNode, 
      null, 
      XPathResult.UNORDERED_NODE_ITERATOR_TYPE, 
      null
    )

    var zoneNode = zoneItterator.iterateNext();

    while (zoneNode) {  

      let zoneMacro = zoneNode.getAttribute("macro")
      let zonePos = zonePositionIndex[zoneMacro]

      if (!zonePos) {
        zonePos = { x: 0, y: 0, z: 0 }
      }

      let zonePosNode = document.evaluate(
        `offset/position`, 
        zoneNode, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      )?.singleNodeValue

      if (zonePosNode) {
        zonePos.x += parseInt(zonePosNode.getAttribute('x') || "0")
        zonePos.y += parseInt(zonePosNode.getAttribute('y') || "0")
        zonePos.z += parseInt(zonePosNode.getAttribute('z') || "0")
      }

      let zone = {
        macro: zoneMacro,
        code: zoneNode.getAttribute("code"),
        x: zonePos ? zonePos.x : 0,
        y: zonePos ? zonePos.y : 0,
        z: zonePos ? zonePos.z : 0,
      }

      let classFilter = componentTypes.map(c => `@class='${c.type}'`).join(' or ')

      let iterator = document.evaluate(
        `connections/connection/component[${classFilter}]`,
        zoneNode,
        null,
        XPathResult.UNORDERED_NODE_ITERATOR_TYPE, 
        null
      )

      var thisNode = iterator.iterateNext();
      while (thisNode) {

        let thisCode = thisNode.getAttribute("code");

        if (!thisCode) {
          console.log("no code")
        }

        let thisClass = thisNode.getAttributeNode("class").value;

        let ownerAttr = thisNode.getAttributeNode("owner");
        let ownerStr = ownerAttr ? ownerAttr.value : "none"

        let x = 0
        let y = 0
        let z = 0

        if (thisClass.substring(0, "ship".length) == "ship") {

          if (ownerStr != "ownerless") {
            thisNode = iterator.iterateNext();
            continue;
          }

        }

        if (thisClass == "gate") {
          let parentConnection = thisNode.parentNode
          if (parentConnection) {
            let connectionName = parentConnection.getAttribute("connection")
            let gatePos = gatePositionIndex[connectionName]

            if (gatePos) {
              x = gatePos.x
              y = gatePos.y
              z = gatePos.z
            }
            console.log("found a gate: " + connectionName)
          }          
        }
        else {
          let posNode = document.evaluate(
            `offset/position`, 
            thisNode, 
            null, 
            XPathResult.FIRST_ORDERED_NODE_TYPE, 
            null
          )?.singleNodeValue

          x = (posNode ? parseInt(posNode.getAttribute('x') || "0") : 0)
          y = (posNode ? parseInt(posNode.getAttribute('y') || "0") : 0)
          z = (posNode ? parseInt(posNode.getAttribute('z') || "0") : 0)
        }

        let component = { 
          type: thisClass,
          componentid: thisNode.getAttributeNode("id").value,
          macro: thisNode.getAttributeNode("macro").value, 
          code: thisCode,
          owner: ownerStr,
          node: thisNode, 
          displayName: thisClass + " (" + thisCode + ")",
          x: (x + zone.x), 
          y: (y + zone.y), 
          z: (z + zone.z),
          r: 2,
          color: ownerStr == "player" ? `rgb(21,255,0)` : componentColorIndex[thisClass]
        }

        components.push(component)
        thisNode = iterator.iterateNext();
      }

      zoneNode = zoneItterator.iterateNext();
    }

    return components;
  }
