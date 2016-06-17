import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { partial, isEmpty, isNull, values, shuffle, find } from 'lodash';
import { Button, Panel, Glyphicon } from 'react-bootstrap';

import * as mapActions from '../actions/mapActions';
import * as diseaseActions from '../actions/diseaseActions';
import * as cardActions from '../actions/cardActions';
import * as globalActions from '../actions/globalActions';
import { getCurrentCityId, canBuildStation, canTreatAll, canTreatAllOfColor,
  getPlayerHand, getPlayerToDiscard, getCurrentPlayer, canShareCards, cardsNeededToCure,
  getInfectionDiscard, getPlayers, getContPlannerEvent, isContingencyPlannerAbilityAvailable,
  isDispatcher, getCurableDisease, getTreatableDiseases } from '../selectors';

import CityPicker from '../components/CityPicker';
import SingleCardPicker from '../components/SingleCardPicker';
import PlayerPicker from '../components/PlayerPicker';
import MultiCardPicker from '../components/MultiCardPicker';
import DiseasePicker from '../components/DiseasePicker';


class Actions extends React.Component {
  constructor(props) {
    super(props);

    this.onDiscardCardPicked = this.onDiscardCardPicked.bind(this);
    this.onShareCandidatePicked = this.onShareCandidatePicked.bind(this);
    this.onCureCardsPicked = this.onCureCardsPicked.bind(this);
    this.onMoveInit = this.onMoveInit.bind(this);
    this.onMoveCityPicked = this.onMoveCityPicked.bind(this);
    this.onGovGrantCityPicked = this.onGovGrantCityPicked.bind(this);
    this.onResPopCardPicked = this.onResPopCardPicked.bind(this);
    this.onResPopUsed = this.onResPopUsed.bind(this);
    this.onContinueTurn = this.onContinueTurn.bind(this);
    this.onForecastShuffled = this.onForecastShuffled.bind(this);
    this.onAirliftPlayerPicked = this.onAirliftPlayerPicked.bind(this);
    this.onAirliftCityPicked = this.onAirliftCityPicked.bind(this);
    this.onOpsCardPicked = this.onOpsCardPicked.bind(this);
    this.onContPlannerCardPicked = this.onContPlannerCardPicked.bind(this);
    this.onDispatcherCancel = this.onDispatcherCancel.bind(this);
    this.onDispatcherPlayerPicked = this.onDispatcherPlayerPicked.bind(this);
    this.onTreatColorPicked = this.onTreatColorPicked.bind(this);
    this.onTreatClicked = this.onTreatClicked.bind(this);

    this.state = {
      dispatcherPlayers: [],
      showTreatColors: false
    };
  }

  onDiscardCardPicked(cardType, id) {
    if (cardType === 'city') {
      this.props.actions.discardFromHand('city', this.props.playerToDiscard, id);
    } else {
      this.props.actions.playEventInit(this.props.playerToDiscard, id);
    }
  }

  onShareCandidatePicked(id, share) {
    const { currentPlayer } = this.props;
    const [giver, receiver] =
      share === 'giver' ? [id, currentPlayer.id] : [currentPlayer.id, id];

    this.props.actions.shareCard(giver, receiver, this.props.currentCityId);
  }

  onCureCardsPicked(ids) {
    this.props.actions.cureDiseaseComplete(ids, this.props.currentMove.curingDisease.color);
  }

  onMoveInit() {
    if (this.props.isDispatcher) {
      this.setState({ dispatcherPlayers: this.props.players });
    } else {
      this.props.actions.moveInit(this.props.currentPlayer.id);
    }
  }

  onMoveCityPicked(id) {
    const { source } = this.props.currentMove.availableCities[id];
    const { playerToMove } = this.props.currentMove;
    let playerId, originId;
    if (playerToMove) {
      playerId = playerToMove;
      originId = find(this.state.dispatcherPlayers, { id: playerId });
    } else {
      playerId = this.props.currentPlayer.id;
      originId = this.props.currentCityId;
    }

    this.props.onPlayerMoved(playerId, id);
    this.props.actions.moveToCity(
      playerId,
      originId,
      id,
      source);
    this.setState({ dispatcherPlayers: [] });
  }

  doTreat(color) {
    const { treatableDiseases, canTreatAll, canTreatAllOfColor, currentCityId } = this.props;
    const shouldTreatAll = canTreatAll || canTreatAllOfColor(color);
    const count = shouldTreatAll ? treatableDiseases[color] : 1;
    this.props.actions[shouldTreatAll ? 'treatAllDisease' : 'treatDisease'](currentCityId, color, count);
  }

  onTreatClicked() {
    const { treatableDiseases } = this.props;
    if (Object.keys(treatableDiseases).length > 1) {
      this.setState({ showTreatColors: true });
    } else {
      const color = Object.keys(treatableDiseases)[0];
      this.doTreat(color);
    }
  }

  onTreatColorPicked(color) {
    this.doTreat(color);
    this.setState({ showTreatColors: false });
  }

  onDispatcherPlayerPicked(id) {
    if (id === this.props.currentPlayer.id) {
      this.props.actions.moveInit(this.props.currentPlayer.id);
    } else {
      this.props.actions.dispatcherChoosePlayer(id);
    }
  }

  onDispatcherCancel() {
    this.setState({ dispatcherPlayers: [] });
  }

  onGovGrantCityPicked(id) {
    this.props.actions.govGrantBuildStation(id);
  }

  onResPopCardPicked(id) {
    this.props.actions.resPopRemoveCard(id);
  }

  onResPopUsed() {
    this.props.actions.playEventInit(this.props.currentMove.resPopSuggestOwner, 'res_pop');
  }

  onContinueTurn() {
    this.props.actions.continueTurn();
  }

  onForecastShuffled() {
    this.props.actions.forecastShuffle(shuffle([...this.props.currentMove.forecastCards]));
  }

  onAirliftPlayerPicked(id) {
    this.props.actions.airliftChoosePlayer(id);
  }

  onAirliftCityPicked(id) {
    this.props.actions.airliftMoveToCity(this.props.currentMove.airlift.playerId, id);
  }

  onOpsCardPicked(cardType, id) {
    this.props.actions.discardFromHand('city', this.props.currentPlayer.id, id);
  }

  onContPlannerCardPicked(cardType, id) {
    this.props.actions.contPlannerChooseEvent(this.props.currentPlayer.id, id);
  }

  render() {
    const { availableCities, shareCandidates, curingDisease, govGrantCities, resPopChooseCard,
      resPopSuggestOwner, forecastCards, airlift, opsMoveAbility, contPlannerEvents } = this.props.currentMove;
    const { playerToDiscard, infectionDiscard, players, isContingencyPlannerAbilityAvailable,
      contPlannerEvent, treatableDiseases, canTreatAll } = this.props;
    return (
      <Panel className="actions">
        {!isNull(playerToDiscard) &&
          <SingleCardPicker
            hand={this.props.getPlayerHand(playerToDiscard)}
            onCardPicked={this.onDiscardCardPicked} />}
        <Button
          onClick={this.onMoveInit}
          disabled={!isEmpty(availableCities) || !isEmpty(this.state.dispatcherPlayers)}>
            <Glyphicon glyph="arrow-right" /><div>Move</div></Button>
        {!isEmpty(this.state.dispatcherPlayers) &&
          <PlayerPicker
            players={this.state.dispatcherPlayers}
            onPlayerPicked={this.onDispatcherPlayerPicked}
            onCancel={this.onDispatcherCancel} />
        }
        {!isEmpty(availableCities) &&
          <CityPicker
            cities={values(availableCities)}
            onSubmit={this.onMoveCityPicked}
            onCancel={this.props.actions.moveCancel} />}
        <Button
          onClick={partial(this.props.actions.buildStation, this.props.currentCityId)}
          disabled={!this.props.canBuildStation}>
          <Glyphicon glyph="home" /><div>Build</div></Button>
        <Button
          onClick={this.props.actions.shareCardsInit}
          disabled={!this.props.canShareCards || !isEmpty(shareCandidates)}>
          <Glyphicon glyph="book" /><div>Share</div></Button>
        {!isEmpty(shareCandidates) &&
          <PlayerPicker
            players={shareCandidates}
            onPlayerPicked={this.onShareCandidatePicked}
            onCancel={this.props.actions.shareCardsCancel} />}
        <Button
          onClick={this.onTreatClicked}
          disabled={isEmpty(treatableDiseases)}>
          <Glyphicon glyph="plus" />
          <div>{canTreatAll ? 'Treat All' : 'Treat'}</div>
        </Button>
        {this.state.showTreatColors &&
          <DiseasePicker
            diseases={Object.keys(treatableDiseases)}
            onDiseasePicked={this.onTreatColorPicked} />
        }
        <Button
          onClick={partial(this.props.actions.cureDiseaseInit, this.props.curableDisease)}
          disabled={!this.props.curableDisease}>
          <Glyphicon glyph="ok" />
          <div>Cure</div>
        </Button>
        {!isEmpty(curingDisease) &&
          <MultiCardPicker
            cards={curingDisease.cards}
            countNeeded={this.props.cardsNeededToCure}
            onSubmit={this.onCureCardsPicked}
            onCancel={this.props.actions.cureDiseaseCancel} />
        }
        {!isEmpty(govGrantCities) &&
          <CityPicker
            cities={govGrantCities}
            onSubmit={this.onGovGrantCityPicked} />
        }
        {resPopChooseCard &&
          <CityPicker
            cities={infectionDiscard}
            onSubmit={this.onResPopCardPicked} />
        }
        {resPopSuggestOwner &&
          <div>
            <Button onClick={this.onResPopUsed}>Use res pop</Button>
            <Button onClick={this.onContinueTurn}>Continue</Button>
          </div>
        }
        {!isEmpty(forecastCards) &&
          <Button onClick={this.onForecastShuffled}>Shuffle</Button>
        }
        {!isEmpty(airlift) && !airlift.playerId &&
          <PlayerPicker
            players={players}
            onPlayerPicked={this.onAirliftPlayerPicked} />
        }
        {!isEmpty(airlift) && !isEmpty(airlift.cities) &&
          <CityPicker
            cities={airlift.cities}
            onSubmit={this.onAirliftCityPicked} />
        }
        {!isEmpty(opsMoveAbility.cards) &&
          <SingleCardPicker
            hand={opsMoveAbility.cards}
            onCardPicked={this.onOpsCardPicked} />
        }
        {}
        {isContingencyPlannerAbilityAvailable &&
          <Button
            onClick={partial(this.props.actions.contPlannerInit, this.props.currentPlayer.id)}>Planner Special</Button>
        }
        {!isEmpty(contPlannerEvents) &&
          <SingleCardPicker
            hand={contPlannerEvents}
            onCardPicked={this.onContPlannerCardPicked} />
        }
        {!isEmpty(contPlannerEvent) &&
          <Button onClick={partial(this.props.actions.playEventInit, this.props.currentPlayer.id,
            contPlannerEvent.id)}>{contPlannerEvent.name}</Button>
        }
      </Panel>
    );
  }
}

const mapStateToProps = (state) => {
  return { currentMove: state.currentMove, currentCityId: getCurrentCityId(state), canBuildStation: canBuildStation(state),
    canTreatAll: canTreatAll(state), canTreatAllOfColor: partial(canTreatAllOfColor, state),
    curableDisease: getCurableDisease(state), treatableDiseases: getTreatableDiseases(state), getPlayerHand: partial(getPlayerHand, state),
    playerToDiscard: getPlayerToDiscard(state), currentPlayer: getCurrentPlayer(state),
    canShareCards: canShareCards(state), cardsNeededToCure: cardsNeededToCure(state),
    infectionDiscard: getInfectionDiscard(state), players: getPlayers(state), contPlannerEvent: getContPlannerEvent(state),
    isContingencyPlannerAbilityAvailable: isContingencyPlannerAbilityAvailable(state),
    isDispatcher: isDispatcher(state) };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators(Object.assign({}, mapActions, diseaseActions, cardActions, globalActions), dispatch)
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Actions);
