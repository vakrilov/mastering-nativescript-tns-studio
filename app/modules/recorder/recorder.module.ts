// angular
import { NgModule } from '@angular/core';
// app
import { SharedModule } from '../shared/shared.module';
import { PROVIDERS } from './services';
@NgModule({
    imports: [ SharedModule ],
    providers: [ ...PROVIDERS ]
})
export class RecorderModule { }