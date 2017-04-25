import { NgModule } from '@angular/core';
import { NativeScriptRouterModule } from
    'nativescript-angular/router';
import { Routes } from '@angular/router';
import { PlayerModule } from '../player/player.module';
import { BaseComponent } from './components/base.component';
import { MixerComponent } from './components/mixer.component';

const COMPONENTS: any[] = [
    BaseComponent,
    MixerComponent
]
const routes: Routes = [
    {
        path: '',
        component: BaseComponent,
        children: [
            {
                path: 'home',
                component: MixerComponent
            }
        ]
    }
];
@NgModule({
    imports: [
        PlayerModule,
        NativeScriptRouterModule.forChild(routes)
    ],
    declarations: [
        ...COMPONENTS
    ]
})
export class MixerModule { }