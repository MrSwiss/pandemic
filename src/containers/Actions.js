import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { partial, isEmpty, shuffle } from 'lodash';
import { Button, Panel, Glyphicon } from 'react-bootstrap';
import pluralize from 'pluralize';

import * as mapActions from '../actions/mapActions';
import * as diseaseActions from '../actions/diseaseActions';
import * as cardActions from '../actions/cardActions';
import * as globalActions from '../actions/globalActions';
import { getCurrentCityId, canBuildStation, canTreatAll,
  getCurrentPlayer, canShareCards,
  getInfectionDiscard, getContPlannerEvent, isContingencyPlannerAbilityAvailable,
  getCurableDisease, getTreatableDiseases, getEventsInHands } from '../selectors';

import CityPicker from '../components/CityPicker';


class Actions extends React.Component {
  constructor(props) {
    super(props);

    this.onForecastShuffled = this.onForecastShuffled.bind(this);
    this.onTreatClicked = this.onTreatClicked.bind(this);
  }

  onTreatClicked() {
    const { treatableDiseases } = this.props;
    if (Object.keys(treatableDiseases).length > 1) {
      this.props.onShowTreatColors();
    } else {
      const color = Object.keys(treatableDiseases)[0];
      this.props.onTreatColorPicked(color);
    }
  }

  onForecastShuffled() {
    this.props.actions.forecastShuffle(shuffle([...this.props.currentMove.forecastCards]));
  }


  render() {
    const { shareCandidates, forecastCards, actionsLeft } = this.props.currentMove;
    const { infectionDiscard, isContingencyPlannerAbilityAvailable,
      contPlannerEvent, treatableDiseases, canTreatAll, currentPlayer, events } = this.props;
    return (
      <Panel
        className="actions"
        footer={`${currentPlayer.name}'s turn, ${pluralize('action', actionsLeft, true)} left`}>
        <Button
          onClick={this.props.onMoveInit}>
            <Glyphicon glyph="arrow-right" /><div>Move</div></Button>
        <Button
          onClick={partial(this.props.actions.buildStation, this.props.currentCityId)}
          disabled={!this.props.canBuildStation}>
          <Glyphicon glyph="home" /><div>Build</div></Button>
        <Button
          onClick={this.props.actions.shareCardsInit}
          disabled={!this.props.canShareCards || !isEmpty(shareCandidates)}>
          <Glyphicon glyph="book" /><div>Share</div></Button>
        <Button
          onClick={this.onTreatClicked}
          disabled={isEmpty(treatableDiseases)}>
          <Glyphicon glyph="plus" />
          <div>{canTreatAll ? 'Treat All' : 'Treat'}</div>
        </Button>
        <Button
          onClick={partial(this.props.actions.cureDiseaseInit, this.props.curableDisease)}
          disabled={!this.props.curableDisease}>
          <Glyphicon glyph="ok" />
          <div>Cure</div>
        </Button>

        {!isEmpty(forecastCards) &&
          <Button onClick={this.onForecastShuffled}>Shuffle</Button>
        }

        {isContingencyPlannerAbilityAvailable &&
          <Button
            onClick={partial(this.props.actions.contPlannerInit, this.props.currentPlayer.id)}>Planner Special</Button>
        }
        {!isEmpty(contPlannerEvent) &&
          <Button onClick={partial(this.props.actions.playEventInit, this.props.currentPlayer.id,
            contPlannerEvent.id)}>{contPlannerEvent.name}</Button>
        }
        {!isEmpty(events) &&
          <Button
            onClick={this.props.onPlayEventClicked}
            className="play-event">
            Play Event
          </Button>
        }
      </Panel>
    );
  }
}

const mapStateToProps = (state) => {
  return { currentMove: state.currentMove, currentCityId: getCurrentCityId(state),
    canBuildStation: canBuildStation(state), canTreatAll: canTreatAll(state),
    curableDisease: getCurableDisease(state), treatableDiseases: getTreatableDiseases(state),
    currentPlayer: getCurrentPlayer(state), canShareCards: canShareCards(state),
    infectionDiscard: getInfectionDiscard(state), contPlannerEvent: getContPlannerEvent(state),
    isContingencyPlannerAbilityAvailable: isContingencyPlannerAbilityAvailable(state),
    events: getEventsInHands(state)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators(Object.assign({}, mapActions, diseaseActions, cardActions, globalActions), dispatch)
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Actions);
