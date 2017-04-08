// nativescript
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
// angular
import { NgModule } from '@angular/core';
// app
import { PROVIDERS } from './services';
@NgModule({
    imports: [
        NativeScriptModule
    ],
    providers: [
        ...PROVIDERS
    ],
    exports: [
        NativeScriptModule
    ]
})
export class CoreModule { }