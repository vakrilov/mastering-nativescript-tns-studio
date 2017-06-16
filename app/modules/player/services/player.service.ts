// angular
import { Injectable, NgZone } from '@angular/core';
// libs

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

// nativescript
import { isIOS } from 'platform';

// app
import { ITrack, CompositionModel, TrackPlayerModel, IPlayerError, TrackModel } from '../../shared/models';
import { MixerService } from '../../mixer/services/mixer.service';

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
    private _seeking: boolean;
    private _seekPaused: boolean;
    private _seekTimeout: number;

    // default name of new tracks
    private _defaultTrackName: string = 'New Track';

    constructor(private mixerService: MixerService) {
        // observe currentTime changes every 1 seconds
        this.currentTime$ = Observable.interval(1000)
            .switchMap(_ => {
                if (this._seeking) {
                    return Observable.never();
                } else if (this._longestTrack) {
                    return Observable.of(
                        this._standardizeTime(
                            this._longestTrack.player.currentTime));
                } else {
                    return Observable.of(0);
                }
            });
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

    public set seeking(value: boolean) {
        this._seeking = value;
        if (this._playing && !this._seekPaused) {
            // pause while seeking
            this._seekPaused = true;
            this.pause();
        }
        if (this._seekTimeout) clearTimeout(this._seekTimeout);
        this._seekTimeout = setTimeout(() => {
            this._seeking = false;
            if (this._seekPaused) {
                // resume play
                this._seekPaused = false;
                this.play();
            }
        }, 1000);
    }

    public seekTo(time: number) {
        for (let track of this._trackPlayers) {
            track.player.seekTo(time);
        }
    }

    public togglePlay(excludeTrackId?: number) {
        if (this._trackPlayers.length) {
            this.playing = !this.playing;
            if (this.playing) {
                this.play(excludeTrackId);
            } else {
                this.pause();
            }
        }
    }
    public play(excludeTrackId?: number) {
        // for iOS playback sync
        let shortStartDelay = .01;
        let now = 0;
        for (let i = 0; i < this._trackPlayers.length; i++) {
            let track = this._trackPlayers[ i ];
            if (excludeTrackId !== track.trackId) {
                if (isIOS) {
                    if (i == 0) now = track.player.ios.deviceCurrentTime;
                    (<any>track.player).playAtTime(now + shortStartDelay);
                } else {
                    track.player.play();
                }
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

    public addTrack(track: TrackModel): Promise<any> {
        return new Promise((resolve, reject) => {
            let trackPlayer = this._trackPlayers.find((p) => p.trackId ===
                track.id);
            if (!trackPlayer) {
                // new track
                trackPlayer = new TrackPlayerModel();
                this._composition.tracks.push(track);
                this._trackPlayers.push(trackPlayer);
            } else {
                // update track
                this.updateTrack(track);
            }
            trackPlayer.load(
                track,
                this._trackComplete.bind(this),
                this._trackError.bind(this)
            ).then(_ => {
                // report longest duration as totalDuration
                this._updateTotalDuration();
                resolve();
            });
        })
    }
    public updateCompositionTrack(trackId: number, filepath: string): number {
        let track;
        if (!trackId) {
            // Create a new track
            let cnt = this._defaultTrackNamesCnt();
            track = new TrackModel({
                name: `${this._defaultTrackName}${cnt ? ' ' + (cnt + 1) : ''}`,
                order: this.composition.tracks.length,
                filepath
            });
            trackId = track.id;
        } else {
            // find by id and update
            track = this.findTrack(trackId);
            track.filepath = filepath;
        }
        this.addTrack(track);
        return trackId;
    }
    private _defaultTrackNamesCnt() {
        return this.composition.tracks
            .filter(t => t.name.startsWith(this._defaultTrackName)).length;
    }

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
        console.log('track complete:', trackId);
        console.log("is in angular zone: " + NgZone.isInAngularZone());
        this.playing = false;
        this.complete$.next(trackId);
    }

    private _trackError(playerError: IPlayerError) {
        console.log(`trackId ${playerError.trackId} error:`,
            playerError.error);
    }
    private _standardizeTime(time: number) {
        return isIOS ? time : time * .001;
    }


    // Additionaly added
    public findTrack(trackId: number) {
        return this._composition.tracks.find(t => t.id === trackId);
    }
    public updateTrack(track: TrackModel) {
        for (let t of this._composition.tracks) {
            if (t.id === track.id) {
                t = track;
                break;
            }
        }
    }

    public saveComposition() {
        this.mixerService.save(this.composition);
    }
}