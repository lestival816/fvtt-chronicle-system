export const CS_SYSTEM = {};

/**
 * The set of Ability and Speciality Scores used within the system.
 * @type {Object}
 */

CS_SYSTEM.scores = {
  agility: { 
    ability: 'CS_SYSTEM.Ability.Agility',
    specialities: {
      acrobatics: 'CS_SYSTEM.Speciality.Acrobatics',
      balance: 'CS_SYSTEM.Speciality.Balance', 
      contortions: 'CS_SYSTEM.Speciality.Contortions',
      dodge: 'CS_SYSTEM.Speciality.Dodge',
      quickness: 'CS_SYSTEM.Speciality.Quickness',
    },
  },
  animalHandling: {
    ability: 'CS_SYSTEM.Ability.AnimalHandling',
    specialities: {
      charm: 'CS_SYSTEM.Speciality.Charm_A', //Charm is also a speciality for Persuation
      drive: 'CS_SYSTEM.Speciality.Drive',
      ride: 'CS_SYSTEM.Speciality.Ride',
      train: 'CS_SYSTEM.Speciality.Train',
    },
  },
  athletics: { 
    ability: 'CS_SYSTEM.Ability.Athletics',
    specialities: {
      climb: 'CS_SYSTEM.Speciality.Climb',
      jump: 'CS_SYSTEM.Speciality.Jump',
      run: 'CS_SYSTEM.Speciality.Run',
      strength: 'CS_SYSTEM.Speciality.Strength',
      swim: 'CS_SYSTEM.Speciality.Swim',
      throw: 'CS_SYSTEM.Speciality.Throw',
    },
  },
  awareness: {
    ability: 'CS_SYSTEM.Ability.Awareness',
    specialities: {
      empathy: 'CS_SYSTEM.Speciality.Empathy',
      notice: 'CS_SYSTEM.Speciality.Notice',
    },
  },
  cunning: {
    ability: 'CS_SYSTEM.Ability.Cunning',
    specialities: {
      decipher: 'CS_SYSTEM.Speciality.Decipher',
      logic: 'CS_SYSTEM.Speciality.Logic',
      memory: 'CS_SYSTEM.Speciality.Memory',
    },
  },
  deception: {
    ability: 'CS_SYSTEM.Ability.Deception',
    specialities: {
      act: 'CS_SYSTEM.Speciality.Act',
      bluff: 'CS_SYSTEM.Speciality.Bluff',
      cheat: 'CS_SYSTEM.Speciality.Cheat',
      disguise: 'CS_SYSTEM.Speciality.Disguise',
    },
  },
  endurance: {
    ability: 'CS_SYSTEM.Ability.Endurance',
    specialities: {
      resilience: 'CS_SYSTEM.Speciality.Resilience',
      stamina: 'CS_SYSTEM.Speciality.Stamina',
    },
  },
  fighting: {
    ability: 'CS_SYSTEM.Ability.Fighting',
    specialities: {
      axes: 'CS_SYSTEM.Speciality.Axes',
      bludgeons: 'CS_SYSTEM.Speciality.Bludgeons',
      brawling: 'CS_SYSTEM.Speciality.Brawling',
      fencing: 'CS_SYSTEM.Speciality.Fencing',
      longBlades: 'CS_SYSTEM.Speciality.LongBlades',
      polearms: 'CS_SYSTEM.Speciality.Polearms',
      shields: 'CS_SYSTEM.Speciality.Shields',
      shortBlades: 'CS_SYSTEM.Speciality.ShortBlades',
      spears: 'CS_SYSTEM.Speciality.Spears',
    },
  },
  healing: {
    ability: 'CS_SYSTEM.Ability.Healing',
    specialities: {
      diagnose: 'CS_SYSTEM.Speciality.Diagnose',
      treatailment: 'CS_SYSTEM.Speciality.TreatAilment',
      treatinjury: 'CS_SYSTEM.Speciality.TreatInjury',
    },
  },
  language: {
    ability: 'CS_SYSTEM.Ability.Language',
    specialities: {

    },
  },
  knowledge: {
    ability: 'CS_SYSTEM.Ability.Knowledge',
    specialities: {
      education: 'CS_SYSTEM.Speciality.Education',
      research: 'CS_SYSTEM.Speciality.Research',
      streetwise: 'CS_SYSTEM.Speciality.Streetwise',
    },
  },
  marksmanship: {
    ability: 'CS_SYSTEM.Ability.Marksmanship',
    specialities: {
      bows: 'CS_SYSTEM.Speciality.Bows',
      crossbows: 'CS_SYSTEM.Speciality.Crossbows',
      siege: 'CS_SYSTEM.Speciality.Siege',
      thrown: 'CS_SYSTEM.Speciality.Thrown',
    },
  },
  persuasion: {
    ability: 'CS_SYSTEM.Ability.Persuasion',
    specialities: {
      bargain: 'CS_SYSTEM.Speciality.Bargain',
      charm: 'CS_SYSTEM.Speciality.Charm_P', //Charm is also a speciality for Animal Handling
      convince: 'CS_SYSTEM.Speciality.Convince',
      incite: 'CS_SYSTEM.Speciality.Incite',
      intimidate: 'CS_SYSTEM.Speciality.Intimidate',
      seduce: 'CS_SYSTEM.Speciality.Seduce',
      taunt: 'CS_SYSTEM.Speciality.Taunt',
    },
  },
  status: {
    ability: 'CS_SYSTEM.Ability.Status',
    specialities: {
      breeding: 'CS_SYSTEM.Speciality.Breeding',
      reputation: 'CS_SYSTEM.Speciality.Reputation',
      stewardship: 'CS_SYSTEM.Speciality.Stewardship',
      tournaments: 'CS_SYSTEM.Speciality.Tournaments',
    },
  },
  stealth: {
    ability: 'CS_SYSTEM.Ability.Stealth',
    specialities: {
      blendIn: 'CS_SYSTEM.Speciality.BlendIn',
      sneak: 'CS_SYSTEM.Speciality.Sneak',
    },
  },
  survival: {
    ability: 'CS_SYSTEM.Ability.Survival',
    specialities: {
      forage: 'CS_SYSTEM.Speciality.Forage',
      hunt: 'CS_SYSTEM.Speciality.Hunt',
      orientation: 'CS_SYSTEM.Speciality.Orientation',
      track: 'CS_SYSTEM.Speciality.Track',
    },
  },
  thievery: {
    ability: 'CS_SYSTEM.Ability.Thievery',
    specialities: {
      picklock: 'CS_SYSTEM.Speciality.PickLock',
      sleightOfHand: 'CS_SYSTEM.Speciality.SleightOfHand',
      steal: 'CS_SYSTEM.Speciality.Steal',
    },
  },
  warfare: {
    ability: 'CS_SYSTEM.Ability.Warfare',
    specialities: {
      command: 'CS_SYSTEM.Speciality.Command',
      strategy: 'CS_SYSTEM.Speciality.Strategy',
      tactics: 'CS_SYSTEM.Speciality.Tactics',
    },
  },
  will: {
    ability: 'CS_SYSTEM.Ability.Will',
    specialities: {
      courage: 'CS_SYSTEM.Speciality.Courage',
      coordinate: 'CS_SYSTEM.Speciality.Coordinate',
      dedication: 'CS_SYSTEM.Speciality.Dedication',
    },
  },
};