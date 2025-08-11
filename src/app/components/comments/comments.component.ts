import { Component, input, model, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Store } from '@ngrx/store';

import { from } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

import { DataService } from '@/services/data.service';
import { Web3Service } from '@/services/web3.service';
import { UtilService } from '@/services/util.service';

import { Comment, CommentWithReplies } from '@/models/comment';
import { GlobalState, Notification } from '@/models/global-state';

import { WalletAddressDirective } from '@/directives/wallet-address.directive';
import { TippyDirective } from '@/directives/tippy.directive';

import { AvatarComponent } from '@/components/avatar/avatar.component';

import { selectWalletAddress } from '@/state/selectors/app-state.selectors';
import { ZERO_ADDRESS } from '@/constants/utils';
import { upsertNotification } from '@/state/actions/notification.actions';
@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WalletAddressDirective,
    TippyDirective,
    AvatarComponent,
  ],
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss']
})
export class CommentsComponent {

  hashId = input.required<string>();
  hashId$ = toObservable(this.hashId);

  commentValue = model<Record<string, string>>({});
  expanded = signal<Record<string, boolean>>({});
  replyActive = signal<string | null>(null);

  comments$ = this.hashId$.pipe(
    switchMap((hashId: string) => {
      return from(this.dataSvc.fetchComments(hashId)).pipe(
        switchMap((initialComments: CommentWithReplies[]) => {
          const topics = [hashId, ...this.getAllTopicsAndIds(initialComments)];
          return this.dataSvc.getCommentChanges(topics).pipe(
            switchMap(() => from(this.dataSvc.fetchComments(hashId))),
            startWith(initialComments)
          );
        })
      );
    })
  );

  connectedAddress$ = this.store.select(selectWalletAddress);

  constructor(
    private store: Store<GlobalState>,
    private web3Svc: Web3Service,
    private dataSvc: DataService,
    private utilSvc: UtilService,
  ) {}

  getAllTopicsAndIds(comments: CommentWithReplies[]): string[] {
    const uniqueTopics = new Set<string>();

    const addCommentTopicsAndIds = (comment: CommentWithReplies) => {
      if (comment.topic) uniqueTopics.add(comment.topic);
      if (comment.id) uniqueTopics.add(comment.id);
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(reply => addCommentTopicsAndIds(reply as CommentWithReplies));
      }
    };

    comments.forEach(comment => addCommentTopicsAndIds(comment));
    return Array.from(uniqueTopics);
  }

  /**
   * Updates the comment value for a specific topic when the user types in the comment box
   * @param event The new comment text value
   * @param topic The topic ID that the comment belongs to
   */
  handleCommentChanged(event: string, topic: string) {
    this.commentValue.update(prev => ({...prev, [topic]: event}));
  }

  /**
   * Creates and inscribes a new comment on the blockchain
   * @param content The text content of the comment
   * @param topic The topic ID that the comment belongs to
   */
  async addComment(content: string, topic: string) {
    if (!content) return;

    const commentObject: Comment = {
      topic,
      content,
      version: '0x0'
    };

    const commentString = JSON.stringify(commentObject);
    const commentUrl = `data:message/vnd.tic+json;rule=esip6,${commentString}`;
    // console.log({commentUrl});

    let notification: Notification = {
      id: this.utilSvc.createIdFromString('tic' + topic),
      timestamp: Date.now(),
      type: 'wallet',
      function: 'tic',
    };

    this.store.dispatch(upsertNotification({ notification }));

    try {
      const hash = await this.web3Svc.inscribe(commentUrl);
      if (!hash) throw new Error('Failed to inscribe comment');

      notification = {
        ...notification,
        type: 'pending',
        hash,
      };

      this.store.dispatch(upsertNotification({ notification }));

      const receipt = await this.web3Svc.pollReceipt(hash!);

      notification = {
        ...notification,
        type: 'complete',
        hash: receipt.transactionHash,
      };

    } catch (err) {
      console.log(err);

      notification = {
        ...notification,
        type: 'error',
        detail: err,
      };
    } finally {
      this.store.dispatch(upsertNotification({ notification }));

      this.clearCommentValue();
      this.clearActiveReply();
    }
  }

  /**
   * Toggles the expanded state of a comment thread to show/hide replies
   * @param commentId The ID of the comment to expand/collapse
   */
  expandComment(commentId: string) {
    this.expanded.update(prev => ({...prev, [commentId]: !prev[commentId]}));
  }

  /**
   * Sets the active reply state to show the reply form for a specific comment
   * @param commentId The ID of the comment being replied to
   */
  setReplyActive(commentId: string) {
    const isActive = this.replyActive() === commentId;
    this.replyActive.set(isActive ? null : commentId);
  }

  clearCommentValue() {
    this.commentValue.set({});
  }

  clearActiveReply() {
    this.replyActive.set(null);
  }

  /**
   * Deletes a comment by transferring its NFT to the zero address
   * @param commentId The ID of the comment to delete
   */
  async deleteComment(commentId: string) {

    let notification: Notification = {
      id: this.utilSvc.createIdFromString('ticDelete' + commentId),
      timestamp: Date.now(),
      type: 'wallet',
      function: 'ticDelete',
    };

    this.store.dispatch(upsertNotification({ notification }));

    try {
      const hash = await this.web3Svc.transferPhunk(commentId, ZERO_ADDRESS);
      if (!hash) return;

      notification = {
        ...notification,
        type: 'pending',
        hash,
      };

      this.store.dispatch(upsertNotification({ notification }));

      const receipt = await this.web3Svc.pollReceipt(hash);

      notification = {
        ...notification,
        type: 'complete',
        hash: receipt.transactionHash,
      };

      this.store.dispatch(upsertNotification({ notification }));
    } catch (error) {
      notification = {
        ...notification,
        type: 'error',
        detail: error,
      };
    } finally {
      this.store.dispatch(upsertNotification({ notification }));
    }

    this.clearCommentValue();
    this.clearActiveReply();
  }
}
