export const FACTIONS = [
  { id: "aurora", name: "Aurora Compact", color: "#7de8ff" },
  { id: "verdant", name: "Verdant Accord", color: "#9ff08c" },
  { id: "ember", name: "Ember Dominion", color: "#ff9b72" },
];

export const TERRITORY_TEMPLATE = [
  { id: "crown", name: "Crown Basin", owner: "aurora", defense: 56, industry: 7 },
  { id: "vale", name: "Verdant Vale", owner: "verdant", defense: 62, industry: 8 },
  { id: "rift", name: "Rift March", owner: "ember", defense: 58, industry: 9 },
  { id: "tidal", name: "Tidal Reach", owner: "aurora", defense: 44, industry: 6 },
  { id: "meridian", name: "Meridian Steppe", owner: "verdant", defense: 48, industry: 7 },
  { id: "emberfall", name: "Emberfall Shelf", owner: "ember", defense: 52, industry: 8 },
];

const cap = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const clone = (value) => JSON.parse(JSON.stringify(value));

export function createBattleState() {
  return {
    turn: 1,
    player: "aurora",
    actionPoints: 3,
    selected: "rift",
    status: "ACTIVE",
    factions: {
      aurora: { fleet: 64, morale: 72, supply: 70 },
      verdant: { fleet: 59, morale: 76, supply: 75 },
      ember: { fleet: 68, morale: 66, supply: 69 },
    },
    territories: clone(TERRITORY_TEMPLATE),
    log: ["Turn 1: planetary contest initialized. All geography and factions are fictional."],
  };
}

function seededNoise(state, salt) {
  let h = 2166136261;
  const text = `${state.turn}:${salt}:${state.log.length}`;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function factionName(id) {
  return FACTIONS.find((f) => f.id === id)?.name || id;
}

function ownedCount(state, id) {
  return state.territories.filter((t) => t.owner === id).length;
}

function finalize(state) {
  for (const faction of FACTIONS) {
    if (ownedCount(state, faction.id) === state.territories.length) {
      state.status = `${factionName(faction.id).toUpperCase()} VICTORY`;
    }
  }
  return state;
}

export function reinforce(input, territoryId) {
  const state = clone(input);
  if (state.status !== "ACTIVE" || state.actionPoints < 1) return state;
  const territory = state.territories.find((t) => t.id === territoryId);
  if (!territory || territory.owner !== state.player) return state;
  const faction = state.factions[state.player];
  if (faction.supply < 5) return state;
  territory.defense = cap(territory.defense + 12);
  faction.supply = cap(faction.supply - 5);
  state.actionPoints -= 1;
  state.log.unshift(`${factionName(state.player)} reinforced ${territory.name}.`);
  return finalize(state);
}

export function mobilize(input) {
  const state = clone(input);
  if (state.status !== "ACTIVE" || state.actionPoints < 1) return state;
  const faction = state.factions[state.player];
  if (faction.supply < 8) return state;
  faction.fleet = cap(faction.fleet + 8);
  faction.supply = cap(faction.supply - 8);
  faction.morale = cap(faction.morale + 2);
  state.actionPoints -= 1;
  state.log.unshift(`${factionName(state.player)} mobilized additional fleet capacity.`);
  return finalize(state);
}

export function engage(input, territoryId, attackerId = input.player) {
  const state = clone(input);
  const territory = state.territories.find((t) => t.id === territoryId);
  if (!territory || territory.owner === attackerId || state.status !== "ACTIVE") return state;
  if (attackerId === state.player && state.actionPoints < 1) return state;
  const attacker = state.factions[attackerId];
  const defenderId = territory.owner;
  const defender = state.factions[defenderId];
  if (!attacker || !defender || attacker.supply < 6 || attacker.fleet < 10) return state;

  const attack = attacker.fleet * 0.48 + attacker.morale * 0.27 + attacker.supply * 0.16 + seededNoise(state, `${attackerId}:${territoryId}:a`) * 18;
  const defense = territory.defense * 0.55 + defender.fleet * 0.22 + defender.morale * 0.19 + seededNoise(state, `${defenderId}:${territoryId}:d`) * 18;

  attacker.supply = cap(attacker.supply - 6);
  attacker.fleet = cap(attacker.fleet - (attack >= defense ? 4 : 8));
  defender.fleet = cap(defender.fleet - (attack >= defense ? 8 : 4));
  if (attackerId === state.player) state.actionPoints -= 1;

  if (attack >= defense) {
    territory.owner = attackerId;
    territory.defense = cap(34 + territory.industry * 2);
    attacker.morale = cap(attacker.morale + 5);
    defender.morale = cap(defender.morale - 6);
    state.log.unshift(`${factionName(attackerId)} gained control of ${territory.name} after an abstract fleet engagement.`);
  } else {
    territory.defense = cap(territory.defense - 7, 20, 100);
    attacker.morale = cap(attacker.morale - 4);
    defender.morale = cap(defender.morale + 3);
    state.log.unshift(`${factionName(defenderId)} held ${territory.name}.`);
  }
  return finalize(state);
}

export function endTurn(input) {
  let state = clone(input);
  if (state.status !== "ACTIVE") return state;

  for (const faction of FACTIONS) {
    if (faction.id === state.player) continue;
    const enemyTerritories = state.territories.filter((t) => t.owner !== faction.id);
    const pick = enemyTerritories[Math.floor(seededNoise(state, faction.id) * enemyTerritories.length)];
    if (pick) state = engage(state, pick.id, faction.id);
  }

  for (const faction of FACTIONS) {
    const stats = state.factions[faction.id];
    const holdings = ownedCount(state, faction.id);
    const industry = state.territories.filter((t) => t.owner === faction.id).reduce((sum, t) => sum + t.industry, 0);
    stats.supply = cap(stats.supply + 4 + industry * 0.7);
    stats.fleet = cap(stats.fleet + 2 + holdings * 0.8);
    stats.morale = cap(stats.morale + (holdings >= 2 ? 1 : -1));
  }

  state.turn += 1;
  state.actionPoints = 3;
  state.log.unshift(`Turn ${state.turn}: production and supply cycles refreshed.`);
  return finalize(state);
}

export function resetBattle() {
  return createBattleState();
}
