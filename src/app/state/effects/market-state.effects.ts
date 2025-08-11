import { GlobalState } from '@/models/global-state';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATION, RouterNavigationPayload, getRouterSelectors } from '@ngrx/router-store';
import { Store } from '@ngrx/store';

import { combineLatest, distinctUntilChanged, filter, from, map, mergeMap, of, scan, switchMap, tap, withLatestFrom } from 'rxjs';

import * as marketStateActions from '../actions/market-state.actions';
import * as marketStateSelectors from '../selectors/market-state.selectors';

import * as dataStateActions from '../actions/data-state.actions';
import * as dataStateSelectors from '../selectors/data-state.selectors';

import * as appStateActions from '../actions/app-state.actions';
import * as appStateSelectors from '../selectors/app-state.selectors';

import { DataService } from '@/services/data.service';
import { MarketState } from '@/models/market.state';

import { Phunk, Event } from '@/models/db';
@Injectable()
export class MarketStateEffects {

  defaultFetchLength = 249;

  setMarketFromRoute$ = createEffect(() => this.actions$.pipe(
    ofType(ROUTER_NAVIGATION),
    withLatestFrom(
      this.store.select(getRouterSelectors().selectQueryParams),
      this.store.select(getRouterSelectors().selectRouteParams),
      this.store.select(appStateSelectors.selectConfig),
    ),
    mergeMap(([{ payload }, queryParams, routeParams, config]) => {
      const actions: any[] = [
        marketStateActions.setMarketType({ marketType: routeParams['marketType'] }),
      ];

      // console.log({ payload, queryParams, routeParams, config });

      // Use route params if available
      let marketSlug = routeParams['slug'];

      // Use default slug if no slug is available
      const { event } = payload as RouterNavigationPayload;
      if (event.urlAfterRedirects === '/') marketSlug = config.defaultCollection;
      // if (routeParams['marketType'] === 'user') marketSlug = 'user';

      // Set market slug if available
      if (marketSlug) actions.push(marketStateActions.setMarketSlug({ marketSlug }));
      actions.push(marketStateActions.setActiveTraitFilters({ traitFilters: queryParams }));
      // console.log({marketSlug});
      return actions;
    })
  ));

  onMarketTypeChanged$ = createEffect(() => this.actions$.pipe(
    ofType(marketStateActions.setMarketType),
    withLatestFrom(
      this.store.select(marketStateSelectors.selectMarketType),
      this.store.select(getRouterSelectors().selectRouteParam('slug')),
      this.store.select(getRouterSelectors().selectQueryParam('address')),
    ),
    filter(([, marketType]) => marketType !== 'all'),
    switchMap(([action, marketType, marketSlug, queryAddress]) => {
      // Likely exited market route so we clear some state

      // console.log({ action, marketType, marketSlug, queryAddress });

      if (!marketType || !marketSlug) {
        this.store.dispatch(marketStateActions.clearActiveMarketRouteData());
        return from([]);
      }

      if (queryAddress && typeof queryAddress === 'string') {
        return this.store.select(appStateSelectors.selectWalletAddress).pipe(
          switchMap((res) => {
            if (res && res === queryAddress?.toLowerCase()) {
              // if (marketType === 'bids') return this.store.select(dataStateSelectors.selectUserOpenBids);
              return this.store.select(marketStateSelectors.selectOwned);
            } else {
              return this.dataSvc.fetchOwned(queryAddress, marketSlug);
            }
          }),
        );
      }

      if (marketType === 'listings') return this.store.select(marketStateSelectors.selectListings);
      if (marketType === 'bids') return this.store.select(marketStateSelectors.selectBids);
      if (marketType === 'activity') return this.store.select(dataStateSelectors.selectEvents).pipe(
        map((events) => {
          return events?.map((event) => {
            return {
              hashId: event.hashId,
              tokenId: event.tokenId,
              sha: event.sha,
              event: event,
            } as Phunk;
          }) || [];
        })
      );

      return of([]);
    }),
    // tap((data) => console.log('onMarketTypeChanged$', data)),
    map((data) => ({ data, total: data.length })),
    map((activeMarketRouteData: MarketState['activeMarketRouteData']) =>
      marketStateActions.setActiveMarketRouteData({ activeMarketRouteData })
    ),
  ));

  fetchMarketData$ = createEffect(() => this.actions$.pipe(
    ofType(marketStateActions.setMarketSlug),
    distinctUntilChanged((a, b) => a.marketSlug === b.marketSlug),
    switchMap(({ marketSlug }) => this.dataSvc.fetchMarketData(marketSlug)),
    // tap((marketData) => console.log('fetchMarketData$', marketData)),
    map((marketData) => marketStateActions.setMarketData({ marketData }))
  ));

  fetchEvents$ = createEffect(() => this.actions$.pipe(
    ofType(marketStateActions.setMarketSlug),
    distinctUntilChanged((a, b) => a.marketSlug === b.marketSlug),
    switchMap(({ marketSlug }) => {
      return combineLatest([
        this.store.select(appStateSelectors.selectEventTypeFilter),
        this.store.select(appStateSelectors.selectEventPage)
      ]).pipe(
        // tap(([eventTypeFilter, page]) => console.log('fetchEvents$', {eventTypeFilter, page})),
        switchMap(([eventTypeFilter, page]) =>
          this.dataSvc.fetchEvents(page * 24, 24, eventTypeFilter, marketSlug).pipe(
            map(events => ({ events, page }))
          )
        ),
        scan((acc, { events, page }) => {
          if (page === 0) return events;
          return [...acc, ...events];
        }, [] as Event[]),
      );
    }),
    // tap((events) => console.log('fetchEvents$', events)),
    map((events) => dataStateActions.setEvents({ events })),
  ));

  // Handle pager reset
  resetEventPage$ = createEffect(() => this.actions$.pipe(
    ofType(marketStateActions.setMarketSlug),
    distinctUntilChanged((a, b) => a.marketSlug === b.marketSlug),
    switchMap(() => this.store.select(appStateSelectors.selectEventTypeFilter).pipe(
      distinctUntilChanged(),
      map(() => appStateActions.setEventPage({ page: 0 }))
    ))
  ));

  fetchAll$ = createEffect(() => this.actions$.pipe(
    ofType(marketStateActions.setMarketSlug),
    distinctUntilChanged((a, b) => a.marketSlug === b.marketSlug),
    switchMap(({ marketSlug }) => {
      return this.dataSvc.fetchAllWithPagination(marketSlug, 0, 110, {}).pipe(
        map((data: MarketState['activeMarketRouteData']) => data.data)
      );
    }),
    map((all: Phunk[]) => marketStateActions.setAll({ all })),
  ));

  fetchOwned$ = createEffect(() => this.actions$.pipe(
    ofType(appStateActions.setWalletAddress),
    distinctUntilChanged((a, b) => a.walletAddress === b.walletAddress),
    switchMap(({ walletAddress }) => {
      if (!walletAddress) return of([]);
      return this.store.select(marketStateSelectors.selectMarketSlug).pipe(
        distinctUntilChanged(),
        switchMap((slug) => this.dataSvc.fetchOwned(walletAddress, slug)),
      );
    }),
    // tap((phunks) => console.log('fetchOwned$', phunks)),
    map((phunks) => marketStateActions.setOwned({ owned: phunks })),
  ));

  paginateAll$ = createEffect(() => this.actions$.pipe(
    ofType(marketStateActions.setPagination),
    // distinctUntilChanged((a, b) => a.pagination.fromIndex === b.pagination.fromIndex),
    withLatestFrom(
      this.store.select(marketStateSelectors.selectMarketSlug),
      this.store.select(marketStateSelectors.selectMarketType),
      this.store.select(marketStateSelectors.selectActiveMarketRouteData),
      this.store.select(marketStateSelectors.selectActiveTraitFilters),
    ),
    filter(([action, , marketType]) => {
      return marketType === 'all' && (this.defaultFetchLength + 1) <= action.pagination.toIndex;
    }),
    // tap((action) => console.log('paginateAll', action)),
    switchMap(([action, marketSlug, marketType, routeData, traitFilters]) => {
      return this.dataSvc.fetchAllWithPagination(
        marketSlug,
        action.pagination.fromIndex,
        action.pagination.toIndex,
        traitFilters
      ).pipe(
        map((data: MarketState['activeMarketRouteData']) => {
          return {
            data: [...routeData.data, ...data.data],
            total: data.total,
          };
        })
      );
    }),
    map((activeMarketRouteData: MarketState['activeMarketRouteData']) =>
      marketStateActions.setActiveMarketRouteData({ activeMarketRouteData })
    ),
  ));

  setTraitFilter$ = createEffect(() => this.actions$.pipe(
    ofType(marketStateActions.setActiveTraitFilters),
    withLatestFrom(
      this.store.select(marketStateSelectors.selectMarketType),
      this.store.select(marketStateSelectors.selectMarketSlug),
      this.store.select(marketStateSelectors.selectActiveTraitFilters),
    ),
    filter(([action, marketType]) => marketType === 'all'),
    switchMap(([action, marketType, slug, traitFilters]) => {
      return this.dataSvc.fetchAllWithPagination(slug, 0, this.defaultFetchLength, traitFilters).pipe(
        mergeMap((data: MarketState['activeMarketRouteData']) => [
          marketStateActions.setActiveMarketRouteData({ activeMarketRouteData: data })
        ]),
      );
    })
  ));

  // setUserOpenBids$ = createEffect(() => this.actions$.pipe(
  //   ofType(marketStateActions.setMarketData),
  //   switchMap((action) => {
  //     return this.store.select(appStateSelectors.selectWalletAddress).pipe(
  //       map((address) => {
  //         return dataStateActions.setUserOpenBids({
  //           userOpenBids: action.marketData?.filter((item) => item.bid && item.bid?.fromAddress === address) || []
  //         });
  //       })
  //     );
  //   })
  // ));

  // fetchMarketStats$ = createEffect(() => this.actions$.pipe(
  //   ofType(marketStateActions.setMarketSlug),
  //   switchMap((action) => this.dataSvc.fetchStats(action.marketSlug).pipe(
  //     tap((stats) => console.log('fetchMarketStats$', action, stats)),
  //   )),
  // ), { dispatch: false });

  constructor(
    private store: Store<GlobalState>,
    private actions$: Actions,
    private dataSvc: DataService
  ) {}

}
