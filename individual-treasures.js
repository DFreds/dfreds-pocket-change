export default class IndividualTreasures {
  populateTreasureForActor(data, actor) {
    if (!this._validate(data, actor)) return;

    let currencyData;

    if (this._isWithinChallengeRating(actor, 0, 4)) {
      currencyData = this._treasureForChallengeRating0to4(actor);
    } else if (this._isWithinChallengeRating(actor, 5, 10)) {
      currencyData = this._treasureForChallengeRating5to10(actor);
    } else if (this._isWithinChallengeRating(actor, 11, 16)) {
      currencyData = this._treasureForChallengeRating11to16(actor);
    } else if (this._isWithinChallengeRating(actor, 17, 100)) {
      currencyData = this._treasureForChallengeRating17andUp(actor);
    }

    console.log(`Generating currency`);
    setProperty(data, 'actorData.data.currency', currencyData);
  }

  _validate(data, actor) {
    if (this._isLootSheetNpc5e(actor)) {
      console.log('cannot generate treasure for loot sheets');
      return false;
    }

    if (this._isLinked(data)) {
      console.log('will not generate treasure for linked characters');
      return false;
    }

    if (this._isHumanoidsOnly() && !this._isHumanoid(actor)) {
      console.log('set to humanoids only, but this actor was not a humanoid');
      return false;
    }

    if (!this._isActorNpc(actor) || this._hasPlayerOwner(actor)) {
      console.log('cannot generate treasure for owned or non-npc actors');
      return false;
    }

    if (!this._isGm()) {
      console.log('cannot generate treasure, not the GM');
      return false;
    }

    return true;
  }

  _rollDice(formula) {
    const roll = new Roll(formula);
    roll.roll();
    return roll.total;
  }

  _isLinked(data) {
    return data.actorLink;
  }

  _isGm() {
    return game.user.isGM;
  }

  _isHumanoidsOnly() {
    return game.settings.get('dfreds-individual-treasures', 'humanoidsOnly');
  }

  _isActorNpc(actor) {
    return actor.data.type == 'npc';
  }

  _isLootSheetNpc5e(actor) {
    return actor.sheet.template.includes('lootsheetnpc5e');
  }

  _hasPlayerOwner(actor) {
    return actor.data.hasPlayerOwner;
  }

  _isHumanoid(actor) {
    return actor.data.data.details.type.toLowerCase().includes('humanoid');
  }

  _isWithinChallengeRating(actor, lowerCr, upperCr) {
    let cr = actor.data.data.details.cr;
    return cr >= lowerCr && cr <= upperCr;
  }

  _treasureForChallengeRating0to4(actor) {
    let roll = this._rollDice('1d100');

    let currency = {
      cp: { value: actor.data.data.currency.cp.value },
      sp: { value: actor.data.data.currency.sp.value },
      ep: { value: actor.data.data.currency.ep.value },
      gp: { value: actor.data.data.currency.gp.value },
      pp: { value: actor.data.data.currency.pp.value }
    };

    if (roll >= 1 && roll <= 30) {
      currency.cp.value = this._rollDice('5d6');
    } else if (roll >= 31 && roll <= 60) {
      currency.sp.value = this._rollDice('4d6');
    } else if (roll >= 61 && roll <= 70) {
      currency.ep.value = this._rollDice('3d6');
    } else if (roll >= 71 && roll <= 95) {
      currency.gp.value = this._rollDice('3d6');
    } else {
      currency.pp.value = this._rollDice('1d6');
    }

    return currency;
  }

  _treasureForChallengeRating5to10(actor) {
    let roll = this._rollDice('1d100');

    let currency = {
      cp: { value: actor.data.data.currency.cp.value },
      sp: { value: actor.data.data.currency.sp.value },
      ep: { value: actor.data.data.currency.ep.value },
      gp: { value: actor.data.data.currency.gp.value },
      pp: { value: actor.data.data.currency.pp.value }
    };

    if (roll >= 1 && roll <= 30) {
      currency.cp.value = this._rollDice('4d6*100');
      currency.ep.value = this._rollDice('1d6*10');
    } else if (roll >= 31 && roll <= 60) {
      currency.sp.value = this._rollDice('6d6*10');
      currency.gp.value = this._rollDice('2d6*10');
    } else if (roll >= 61 && roll <= 70) {
      currency.ep.value = this._rollDice('1d6*100');
      currency.gp.value = this._rollDice('2d6*10');
    } else if (roll >= 71 && roll <= 95) {
      currency.gp.value = this._rollDice('4d6*10');
    } else {
      currency.gp.value = this._rollDice('2d6*10');
      currency.pp.value = this._rollDice('3d6');
    }

    return currency;
  }

  _treasureForChallengeRating11to16(actor) {
    let roll = this._rollDice('1d100');

    let currency = {
      cp: { value: actor.data.data.currency.cp.value },
      sp: { value: actor.data.data.currency.sp.value },
      ep: { value: actor.data.data.currency.ep.value },
      gp: { value: actor.data.data.currency.gp.value },
      pp: { value: actor.data.data.currency.pp.value }
    };

    if (roll >= 1 && roll <= 20) {
      currency.sp.value = this._rollDice('4d6*100');
      currency.gp.value = this._rollDice('1d6*100');
    } else if (roll >= 21 && roll <= 35) {
      currency.ep.value = this._rollDice('1d6*100');
      currency.gp.value = this._rollDice('1d6*100');
    } else if (roll >= 36 && roll <= 75) {
      currency.gp.value = this._rollDice('2d6*100');
      currency.pp.value = this._rollDice('1d6*10');
    } else {
      currency.gp.value = this._rollDice('2d6*100');
      currency.pp.value = this._rollDice('2d6*10');
    }

    return currency;
  }

  _treasureForChallengeRating17andUp(actor) {
    let roll = this._rollDice('1d100');

    let currency = {
      cp: { value: actor.data.data.currency.cp.value },
      sp: { value: actor.data.data.currency.sp.value },
      ep: { value: actor.data.data.currency.ep.value },
      gp: { value: actor.data.data.currency.gp.value },
      pp: { value: actor.data.data.currency.pp.value },
    };

    if (roll >= 1 && roll <= 15) {
      currency.ep.value = this._rollDice('2d6*1000');
      currency.gp.value = this._rollDice('8d6*100');
    } else if (roll >= 16 && roll <= 55) {
      currency.gp.value = this._rollDice('1d6*1000');
      currency.pp.value = this._rollDice('1d6*100');
    } else {
      currency.gp.value = this._rollDice('1d6*1000');
      currency.pp.value = this._rollDice('2d6*100');
    }

    return currency;
  }
}
