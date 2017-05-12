// angular
import { Component, Input } from '@angular/core';
// libs
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

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

    public playStatus$: Observable<string>;
    public currentTime$: Observable<number>;
    public duration$: Observable<number>;

    constructor(
        private playerService: PlayerService
    ) { }
    public togglePlay() {
        this.playerService.togglePlay();
    }
    ngOnInit() {
        // init audio player for composition
        this.playerService.composition = this.composition;
       
        this.playStatus$ = Observable
            .of(false) // the default value
            .concat(this.playerService.playing$)
            .map((value: boolean) => value ? 'Stop' : 'Play');

        this.currentTime$ = this.playerService.currentTime$;
        this.duration$ = this.playerService.duration$;
    }
}