import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';

import { GlobalState, Notification } from '@/models/global-state';

import { NotificationComponent } from './notification/notification.component';

import * as notificationSelectors from '@/state/selectors/notification.selectors';

import { map } from 'rxjs';

export type TxFunction = 'sendToEscrow' | 'phunkNoLongerForSale' | 'offerPhunkForSale' | 'withdrawBidForPhunk' | 'acceptBidForPhunk' | 'buyPhunk' | 'enterBidForPhunk' | 'transferPhunk' | 'withdrawPhunk';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    NotificationComponent,
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent {

  transactions$ = this.store.select(notificationSelectors.selectNotifications).pipe(
    // tap((res) => console.log({res})),
    map((txns: Notification[]) => [...txns].sort((a, b) => b.timestamp - a.timestamp))
  );

  constructor(
    private store: Store<GlobalState>
  ) {}

  trackByFn(index: number, item: Notification) {
    return item.id;
  }
}
