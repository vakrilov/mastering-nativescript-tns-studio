// nativescript
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
// angular
import { NgModule } from '@angular/core';
// app
import { PIPES } from './pipes';
@NgModule({
    imports: [
        NativeScriptModule
    ],
    declarations: [
        ...PIPES
    ],
    exports: [
        NativeScriptModule,
        ...PIPES
    ]
})
export class SharedModule { }