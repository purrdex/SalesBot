import { DataState } from '@/models/data.state';
import { Action, ActionReducer, createReducer, on } from '@ngrx/store';

import * as actions from '../actions/data-state.actions';

export const initialState: DataState = {
  usd: null,
  events: null,
  userOpenBids: [],
  txHistory: null,
  leaderboard: null,
  collections: [],
  activeCollection: null
}

export const dataStateReducer: ActionReducer<DataState, Action> = createReducer(
  initialState,
  on(actions.resetDataState, () => initialState),
  on(actions.setUsd, (state, { usd }) => {
    const setUsd = {
      ...state,
      usd,
    };
    return setUsd
  }),
  on(actions.setEvents, (state, { events }) => {
    const setEvents = {
      ...state,
      events,
    };
    return setEvents
  }),
  // on(actions.setUserOpenBids, (state, { userOpenBids }) => {
  //   const setUserOpenBids = {
  //     ...state,
  //     userOpenBids
  //   };
  //   return setUserOpenBids
  // }),
  on(actions.setLeaderboard, (state, { leaderboard }) => {
    const setLeaderboard = {
      ...state,
      leaderboard,
    };
    return setLeaderboard
  }),
  on(actions.setCollections, (state, { collections }) => {
    const setCollections = {
      ...state,
      collections,
    };
    return setCollections
  }),
  on(actions.setActiveCollection, (state, { activeCollection }) => {
    const setActiveCollection = {
      ...state,
      activeCollection,
    };
    return setActiveCollection
  }),
);
