// angular
import { Injectable } from '@angular/core';
// app
import { ITrack, IComposition, CompositionModel } from '../../shared/models';
import { DatabaseService } from '../../core/services/database.service';
import { DialogService } from '../../core/services/dialog.service';

@Injectable()
export class MixerService {
    public list: Array<IComposition>;

    constructor(
        private databaseService: DatabaseService,
        private dialogService: DialogService
    ) {
        // restore with saved compositions or demo list
        this.list = this._savedCompositions() || this._demoComposition();
    }

    public add() {
        this.dialogService.prompt('Composition name:', "")
            .then((value) => {
                if (value.result) {
                    let composition = new CompositionModel({
                        id: this.list.length + 1,
                        name: value.text,
                        order: this.list.length // next one in line
                    });
                    this.list.push(composition);
                    // persist changes
                    this._saveList();
                }
            });
    }
    public edit(composition: IComposition) {
        this.dialogService.prompt('Edit name:', composition.name)
            .then((value) => {
                if (value.result) {
                    for (let comp of this.list) {
                        if (comp.id === composition.id) {
                            comp.name = value.text;
                            break;
                        }
                    }
                    // re-assignment triggers view binding change
                    // only needed with default change detection
                    // when object prop changes in collection
                    // NOTE: we will use Observables in ngrx chapter
                    this.list = [ ...this.list ];
                    // persist changes
                    this._saveList();
                }
            });
    }
    private _savedCompositions(): any {
        return this.databaseService
            .getItem(DatabaseService.KEYS.compositions);
    }
    private _saveList() {
        this.databaseService
            .setItem(DatabaseService.KEYS.compositions, this.list);
    }
    
    private _demoComposition(): Array<IComposition> {
        // starter composition for user to demo on first launch
        return [
            {
                id: 1,
                name: 'Demo',
                created: Date.now(),
                order: 0,
                tracks: [
                    {
                        id: 1,
                        name: 'Drums',
                        order: 0,
                        filepath: '~/audio/drums.mp3'
                    },
                    {
                        id: 2,
                        name: 'Bass',
                        order: 1,
                        filepath: '~/audio/bass.mp3'
                    },
                    {
                        id: 3,
                        name: 'Piano',
                        order: 2,
                        filepath: '~/audio/piano.mp3'
                    }
                ]
            }
        ];
    }
}