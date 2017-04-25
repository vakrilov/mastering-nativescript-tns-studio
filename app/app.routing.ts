import { NgModule, NgModuleFactoryLoader } from '@angular/core';
import { CustomModuleFactoryLoader } from './app.module-loader';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        redirectTo: '/mixer/home',
        pathMatch: 'full'
    },
    {
        path: 'mixer',
        loadChildren: './modules/mixer/mixer.module#MixerModule'
    },
    {
        path: 'record',
        loadChildren: './modules/recorder/recorder.module#RecorderModule'
    }
];

@NgModule({
    imports: [
        NativeScriptRouterModule.forRoot(routes)
    ],
    providers: [
        {
            provide: NgModuleFactoryLoader,
            useClass: CustomModuleFactoryLoader
        }],
    exports: [
        NativeScriptRouterModule
    ]
})
export class AppRoutingModule { }