// angular
import { Injectable } from '@angular/core';
// libs
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
// app
import { ITrack, CompositionModel, TrackPlayerModel } from '../../shared/models';
@Injectable()
export class PlayerService {
    // observable state
    public playing$: Subject<boolean> = new Subject();
    public duration$: Subject<number> = new Subject();
    public currentTime$: Observable<number>;

    // active composition
    private _composition: CompositionModel;
    // internal state
    private _playing: boolean;
    // collection of track players
    private _trackPlayers: Array<TrackPlayerModel> = [];
    // used to report currentTime from
    private _longestTrack: TrackPlayerModel;

    constructor() {
        // observe currentTime changes every 1 seconds
        this.currentTime$ = Observable.interval(1000)
            .map(_ => this._longestTrack ?
                this._longestTrack.player.currentTime
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
            trackPlayer.load(track).then(_ => {
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
        for (let t of this._trackPlayers) {
            t.player.play();
        }
    }
    public pause() {
        for (let t of this._trackPlayers) {
            t.player.pause();
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
        this.duration$.next(totalDuration);
    }
    private _resetTrackPlayers() {
        for (let t of this._trackPlayers) {
            t.cleanup();
        }
        this._trackPlayers = [];
    }
}