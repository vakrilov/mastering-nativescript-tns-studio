// angular
import { Component, Input } from '@angular/core';
// app
import { ITrack } from '../../../shared/models';
import { AuthService, LogService, DialogService } from '../../../core/services';
import { PlayerService } from '../../services/player.service';

@Component({
    moduleId: module.id,
    selector: 'track-list',
    templateUrl: 'track-list.component.html'
})
export class TrackListComponent {
    @Input() tracks: Array<ITrack>;
    
    constructor(
        private authService: AuthService,
        private logService: LogService,
        private dialogService: DialogService,
        public playerService: PlayerService
    ) { }

    public record(track: ITrack, usernameAttempt?: string) {
        if (AuthService.CURRENT_USER) {
            this.dialogService.confirm(
                'Are you sure you want to re-record this track?'
            ).then((ok) => {
                if (ok) this._navToRecord(track);
            });
        } else {
            this.authService.promptLogin(
                'Provide an email and password to record.',
                usernameAttempt
            ).then(
                this._navToRecord.bind(this, track), // or: () => { this._navToRecord(track); },
                (usernameAttempt) => {
                    // initiate sequence again
                    this.record(track, usernameAttempt);
                }
                );
        }
    }
    private _navToRecord(track: ITrack) {
        // TODO: navigate to record screen
        this.logService.debug('yes, re-record', track);
    }
}