// libs
import { TNSPlayer } from 'nativescript-audio';

// app
import { ITrack } from './track.model';
interface ITrackPlayer {
    trackId: number;
    duration: number;
    readonly player: TNSPlayer;
}
export class TrackPlayerModel implements ITrackPlayer {
    public trackId: number;
    public duration: number;
    private _player: TNSPlayer;
    constructor() {
        this._player = new TNSPlayer();
    }
    public load(track: ITrack): Promise<number> {
        return new Promise((resolve, reject) => {
            this.trackId = track.id;
            this._player.initFromFile({
                audioFile: track.filepath,
                loop: false
            }).then(() => {
                this._player.getAudioTrackDuration()
                    .then((duration) => {
                        this.duration = +duration;
                        resolve();
                    });
            });
        });
    }
    public get player(): TNSPlayer {
        return this._player;
    }

    public cleanup() {
        if (this.player) {
            this.player.dispose();
        }
    }
}