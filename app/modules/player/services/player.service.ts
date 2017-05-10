// angular
import { Injectable, NgZone } from '@angular/core';
// libs

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

// nativescript
import { isIOS } from 'platform';

// app
import { ITrack, CompositionModel, TrackPlayerModel, IPlayerError } from '../../shared/models';
@Injectable()
export class PlayerService {
    // observable state
    public playing$: Subject<boolean> = new Subject();
    public duration$: Subject<number> = new Subject();
    public currentTime$: Observable<number>;
    public complete$: Subject<number> = new Subject();

    // active composition
    private _composition: CompositionModel;
    // internal state
    private _playing: boolean;
    // collection of track players
    private _trackPlayers: Array<TrackPlayerModel> = [];
    // used to report currentTime from
    private _longestTrack: TrackPlayerModel;

    constructor(private ngZone: NgZone) {
        // observe currentTime changes every 1 seconds
        this.currentTime$ = Observable.interval(1000)
            .map(_ => this._longestTrack ?
                this._standardizeTime(this._longestTrack.player.currentTime)
                : 0);
    }
    public set playing(value: boolean) {
        this._playing = value;
        this.playing$.next(value);
    }
    public get playing(): boolean {
        return this._playing;
    }
    public get composition(): CompositionModel {
        return this._composition;
    }
    public set composition(comp: CompositionModel) {
        this._composition = comp;
        // clear any previous players
        this._resetTrackPlayers();
        // setup player instances for each track
        let initTrackPlayer = (index: number) => {
            let track = this._composition.tracks[ index ];
            let trackPlayer = new TrackPlayerModel();
            trackPlayer.load(track,
                this._trackComplete.bind(this),
                this._trackError.bind(this)).then(_ => {
                    this._trackPlayers.push(trackPlayer);
                    index++;
                    if (index < this._composition.tracks.length) {
                        initTrackPlayer(index);
                    } else {
                        // report total duration of composition
                        this._updateTotalDuration();
                    }
                });
        };
        // kick off multi-track player initialization
        initTrackPlayer(0);
    }
    public togglePlay() {
        this.playing = !this.playing;
        if (this.playing) {
            this.play();
        } else {
            this.pause();
        }
    }
    public play() {
        // for iOS playback sync
        let shortStartDelay = .01;
        let now = 0;
        for (let i = 0; i < this._trackPlayers.length; i++) {
            let track = this._trackPlayers[ i ];
            if (isIOS) {
                if (i == 0) now = track.player.ios.deviceCurrentTime;
                (<any>track.player).playAtTime(now + shortStartDelay);
            } else {
                track.player.play();
            }
        }
    }
    public pause() {
        let currentTime = 0;
        for (let i = 0; i < this._trackPlayers.length; i++) {
            let track = this._trackPlayers[ i ];
            if (i == 0) currentTime = track.player.currentTime;
            track.player.pause();
            // ensure tracks pause and remain paused at the same time
            track.player.seekTo(currentTime);
        }
    }
    // ...
    private _updateTotalDuration() {
        // report longest track as the total duration of the mix
        let totalDuration = Math.max(...this._trackPlayers.map(t => t.duration));
        // update trackPlayer to reflect longest track
        for (let t of this._trackPlayers) {
            if (t.duration === totalDuration) {
                this._longestTrack = t;
                break;
            }
        }
        // standardize to seconds
        totalDuration = this._standardizeTime(totalDuration);
        console.log('totalDuration of mix:', totalDuration);
        this.duration$.next(totalDuration);
    }
    private _resetTrackPlayers() {
        for (let t of this._trackPlayers) {
            t.cleanup();
        }
        this._trackPlayers = [];
    }

    private _trackComplete(trackId: number) {
        this.ngZone.run(() => {
            console.log('track complete:', trackId);
            this.playing = false;
            this.complete$.next(trackId);
        });
    }

    private _trackError(playerError: IPlayerError) {
        console.log(`trackId ${playerError.trackId} error:`,
            playerError.error);
    }
    private _standardizeTime(time: number) {
        return isIOS ? time : time * .001;
    }
}