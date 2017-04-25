// angular
import { NgModule } from '@angular/core';
// app
import { AppComponent } from './app.component';
import { CoreModule } from './modules/core/core.module';
import { AppRoutingModule } from './app.routing';

@NgModule({
    imports: [
        CoreModule,
        AppRoutingModule
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule { }