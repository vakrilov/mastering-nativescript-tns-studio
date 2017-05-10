// angular
import { Component, Input } from '@angular/core';
// libs
import { Subscription } from 'rxjs/Subscription';
// app
import { ITrack, CompositionModel } from '../../../shared/models';
import { PlayerService } from '../../services';

@Component({
    moduleId: module.id,
    selector: 'player-controls',
    templateUrl: 'player-controls.component.html'
})
export class PlayerControlsComponent {
    @Input() composition: CompositionModel;

    // ui state
    public playStatus: string = 'Play';
    public duration: number = 0;
    public currentTime: number = 0;

    // manage subscriptions
    private _subPlaying: Subscription;
    private _subDuration: Subscription;
    private _subCurrentTime: Subscription;
    
    constructor(
        private playerService: PlayerService
    ) { }
    public togglePlay() {
        this.playerService.togglePlay();
    }
    ngOnInit() {
        // init audio player for composition
        this.playerService.composition = this.composition;
        // react to play state
        this._subPlaying = this.playerService.playing$
            .subscribe((playing: boolean) => {
                // update button state
                this._updateStatus(playing);
                // update slider state
                if (playing) {
                    this._subCurrentTime = this.playerService
                        .currentTime$
                        .subscribe((currentTime: number) => {
                            this.currentTime = currentTime;
                        });
                } else if (this._subCurrentTime) {
                    this._subCurrentTime.unsubscribe();
                }
            });
        // update duration state for slider
        this._subDuration = this.playerService.duration$
            .subscribe((duration: number) => {
                this.duration = duration;
            });
    }
    ngOnDestroy() {
        // cleanup
        if (this._subPlaying)
            this._subPlaying.unsubscribe();
        if (this._subDuration)
            this._subDuration.unsubscribe();
        if (this._subCurrentTime)
            this._subCurrentTime.unsubscribe();
    }
    private _updateStatus(playing: boolean) {
        this.playStatus = playing ? 'Stop' : 'Play';
    }
}