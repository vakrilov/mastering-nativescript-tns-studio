// nativescript
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
// angular
import { NgModule } from '@angular/core';

// register nativescript custom components
import { registerElement } from 'nativescript-angular/element-registry';
import { Waveform } from './native/waveform';
registerElement('Waveform', () => Waveform);

// app
import { PIPES } from './pipes';
@NgModule({
    imports: [
        NativeScriptModule,
        NativeScriptRouterModule
    ],
    declarations: [
        ...PIPES
    ],
    exports: [
        NativeScriptModule,
        NativeScriptRouterModule,
        ...PIPES
    ]
})
export class SharedModule { }